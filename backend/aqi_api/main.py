import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE = Path(__file__).parent
MODEL_DIR = BASE / "models"
CSV_PATH = Path(os.environ.get("AQI_CSV", BASE / "data.csv"))   # your dataset file
HORIZONS = [1, 6, 12]
BINS = [-np.inf, 50, 100, 200, 300, 400, np.inf]
LABELS = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]
MIN_ROWS = 169
WINDOW_ROWS = 300

meta = joblib.load(MODEL_DIR / "aqi_meta.pkl")
FEATURES = meta["features"]
MODELS = {H: joblib.load(MODEL_DIR / f"aqi_model_{H}h.pkl") for H in HORIZONS}

app = FastAPI(title="Delhi AQI Forecast API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ---------- history from the CSV (reloaded automatically when the file changes) ----------
_cache = {"mtime": None, "data": {}}


def csv_history():
    if not CSV_PATH.exists():
        raise ValueError(f"Data file not found: {CSV_PATH}")
    mtime = CSV_PATH.stat().st_mtime
    if _cache["mtime"] != mtime:
        df = pd.read_csv(CSV_PATH)
        df["datetime"] = pd.to_datetime(
            df["date_ist"].astype(str).str.strip() + " " + df["time_ist"].astype(str).str.strip(),
            format="%d/%m/%Y %H:%M")
        df = df.sort_values(["location", "datetime"]).drop_duplicates(["location", "datetime"])
        _cache["data"] = {loc: g.tail(WINDOW_ROWS).copy()
                          for loc, g in df.groupby("location") if loc in meta["locations"]}
        _cache["mtime"] = mtime
    return _cache["data"]


# ---------- features and prediction ----------
def build_features(h: pd.DataFrame) -> pd.DataFrame:
    h = h.sort_values("datetime").reset_index(drop=True).copy()
    if len(h) < MIN_ROWS:
        raise ValueError(f"Need at least {MIN_ROWS} hourly rows, got {len(h)}")
    if not (h["datetime"].tail(MIN_ROWS).diff().dropna() == pd.Timedelta(hours=1)).all():
        raise ValueError("The last 169 hours must be hourly with no gaps or duplicates")
    h["aqi"] = h["aqi_index"].clip(upper=500)
    for col in ["aqi", "pm2_5", "pm10", "no2", "co"]:
        for lag in [1, 3, 6, 12, 24, 48, 168]:
            h[f"{col}_lag{lag}"] = h[col].shift(lag)
    for w in [6, 24, 72]:
        h[f"aqi_roll_mean_{w}"] = h["aqi"].shift(1).rolling(w).mean()
        h[f"aqi_roll_std_{w}"] = h["aqi"].shift(1).rolling(w).std()
    h["aqi_diff_1"] = h["aqi"].diff(1)
    h["aqi_diff_24"] = h["aqi"].diff(24)
    h["temp_diff_3"] = h["temp_c"].diff(3)
    h["press_diff_3"] = h["pressure_mb"].diff(3)
    h["pm_ratio"] = h["pm2_5"] / h["pm10"]
    h["hour_sin"] = np.sin(2 * np.pi * h["datetime"].dt.hour / 24)
    h["hour_cos"] = np.cos(2 * np.pi * h["datetime"].dt.hour / 24)
    h["dow"] = h["datetime"].dt.dayofweek
    h["location"] = pd.Categorical(h["location"], categories=meta["locations"])
    h["condition_text"] = pd.Categorical(h["condition_text"], categories=meta["conditions"])
    return h


def forecast(history: pd.DataFrame, location: str):
    try:
        row = build_features(history).iloc[[-1]]
    except ValueError as e:
        raise HTTPException(422, str(e))
    now = row["datetime"].iloc[0]
    current = float(row["aqi"].iloc[0])
    out = {}
    for H, m in MODELS.items():
        p = float(np.clip(m.predict(row[FEATURES])[0] + current, 0, 500))
        out[f"{H}h"] = {"forecast_for": (now + pd.Timedelta(hours=H)).isoformat(),
                        "aqi": round(p),
                        "category": str(pd.cut([p], BINS, labels=LABELS)[0])}
    return {"location": location, "based_on": now.isoformat(),
            "current_aqi": round(current), "forecasts": out}


def check_location(location: str):
    if location not in meta["locations"]:
        raise HTTPException(422, f"Unknown location. Supported: {meta['locations']}")


# ---------- endpoints ----------
@app.get("/health")
def health():
    return {"status": "ok", "stations": meta["locations"], "horizons_h": HORIZONS}


@app.get("/predict/{location}")
def predict_from_csv(location: str):
    """Your app sends only the station name; history comes from the CSV on the server."""
    check_location(location)
    try:
        data = csv_history()
    except ValueError as e:
        raise HTTPException(500, str(e))
    if location not in data:
        raise HTTPException(422, f"No rows for {location} in {CSV_PATH.name}")
    return forecast(data[location], location)


class Reading(BaseModel):
    datetime: datetime
    lat: float
    lon: float
    temp_c: float
    humidity: float
    pressure_mb: float
    windspeed_kph: float
    condition_text: Optional[str] = None
    aqi_index: float
    pm2_5: float
    pm10: float
    co: float
    no2: float


class PredictRequest(BaseModel):
    location: str
    history: List[Reading]


@app.post("/predict")
def predict_from_history(req: PredictRequest):
    """Optional: send your own 169+ hourly rows instead of using the CSV."""
    check_location(req.location)
    df = pd.DataFrame([r.model_dump() for r in req.history])
    df["datetime"] = pd.to_datetime(df["datetime"])
    df["location"] = req.location
    return forecast(df, req.location)