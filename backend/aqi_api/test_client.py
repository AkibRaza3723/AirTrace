"""Sends 200 hours of your training data to the running API."""
import pandas as pd, requests
df = pd.read_csv("data.csv")
df["datetime"] = pd.to_datetime(df["date_ist"].astype(str).str.strip() + " " +
                                df["time_ist"].astype(str).str.strip(), format="%d/%m/%Y %H:%M")
s = df[df.location == "Dwarka"].sort_values("datetime").tail(200)
cols = ["datetime","lat","lon","temp_c","humidity","pressure_mb","windspeed_kph",
        "condition_text","aqi_index","pm2_5","pm10","co","no2"]
hist = s[cols].assign(datetime=s["datetime"].dt.strftime("%Y-%m-%dT%H:%M:%S")).to_dict("records")
print(requests.post("http://127.0.0.1:8000/predict", json={"location": "Dwarka", "history": hist}).json())