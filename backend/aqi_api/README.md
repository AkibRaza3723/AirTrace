# Delhi AQI Forecast API: Frontend Guide

This API forecasts the Air Quality Index (AQI) for two Delhi stations at **1, 6 and 12 hours** ahead.
The frontend only sends a **station name**. The server keeps the history and does all the calculation.

> You do **not** need to send any history or pollution data from the frontend.

---

## 1. Base URL

| Environment | Base URL |
|---|---|
| Local | `http://127.0.0.1:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Real phone / other computer | `http://<computer-local-IP>:8000` (server must be started with `--host 0.0.0.0`) |

Keep the base URL in one config variable so it is easy to change.

Interactive API docs (for testing in a browser): `{BASE_URL}/docs`

---

## 2. Supported stations

Use these names **exactly** (case and spaces matter):

- `Anand Vihar`
- `Dwarka`

Any other name returns an error (see section 5). To build the dropdown from the server instead of hard-coding it, call `GET /health` and read `stations`.

---

## 3. Get a forecast

```
GET {BASE_URL}/predict/{station}
```

Example: `GET http://127.0.0.1:8000/predict/Dwarka`

For `Anand Vihar`, encode the space (`encodeURIComponent("Anand Vihar")` gives `Anand%20Vihar`).

### Successful response (HTTP 200)

```json
{
  "location": "Dwarka",
  "based_on": "2025-12-31T23:00:00",
  "current_aqi": 208,
  "forecasts": {
    "1h":  { "forecast_for": "2026-01-01T00:00:00", "aqi": 207, "category": "Poor" },
    "6h":  { "forecast_for": "2026-01-01T05:00:00", "aqi": 204, "category": "Poor" },
    "12h": { "forecast_for": "2026-01-01T11:00:00", "aqi": 199, "category": "Moderate" }
  }
}
```

| Field | Meaning |
|---|---|
| `location` | Station name |
| `based_on` | Time of the latest reading used for the forecast |
| `current_aqi` | AQI at `based_on` (capped at 500) |
| `forecasts["1h" / "6h" / "12h"]` | One forecast per horizon |
| `forecast_for` | The time the forecast is for |
| `aqi` | Forecast AQI, a whole number from 0 to 500 |
| `category` | Category name (see section 4) |

All times are **IST (India time) written without a timezone**, e.g. `2026-01-01T05:00:00`. Do not convert them with the user's local timezone. Display them as given, or parse them as IST.

---

## 4. AQI categories (CPCB scale)

`category` is always one of these six strings. The UI must handle all six, even if some rarely appear.

| Category | AQI range | Suggested colour |
|---|---|---|
| `Good` | 0 to 50 | `#00b050` |
| `Satisfactory` | 51 to 100 | `#92d050` |
| `Moderate` | 101 to 200 | `#ffd400` |
| `Poor` | 201 to 300 | `#ff9900` |
| `Very Poor` | 301 to 400 | `#ff0000` |
| `Severe` | 401 and above | `#c00000` |

Colours are only a suggestion. Use your own design if you prefer.

**Show the number, not just the category.** A forecast of 199 is "Moderate" but only one point below "Poor", and the forecast error is typically a few AQI points at 1 to 6 hours and about 15 at 12 hours. A small hint such as "near Poor" when the AQI is within about 10 of a boundary is a good idea.

---

## 5. Errors

When something goes wrong, the response has a non-200 status and a JSON body:

```json
{ "detail": "Unknown location. Supported: ['Anand Vihar', 'Dwarka']" }
```

| Status | Cause | What to show |
|---|---|---|
| 422 | Unknown station name, or not enough or broken data on the server | Show `detail`, or a friendly "Forecast unavailable for this station" |
| 500 | Server data file missing or unreadable | "Service temporarily unavailable" |
| network error | Server not running or wrong address | "Cannot reach the server" |

Always check `response.ok` before reading the forecast.

---

## 6. Example: plain JavaScript

```javascript
const BASE_URL = "http://127.0.0.1:8000";

async function getForecast(station) {
  const res = await fetch(`${BASE_URL}/predict/${encodeURIComponent(station)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

getForecast("Dwarka")
  .then(data => {
    const f = data.forecasts["6h"];
    console.log(`${f.aqi} (${f.category}) at ${f.forecast_for}`);
  })
  .catch(e => console.error(e.message));
```

## 7. Example: React

```jsx
import { useEffect, useState } from "react";

const BASE_URL = "http://127.0.0.1:8000";
const STATIONS = ["Anand Vihar", "Dwarka"];

export default function AqiForecast() {
  const [station, setStation] = useState(STATIONS[0]);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`${BASE_URL}/predict/${encodeURIComponent(station)}`)
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
        return res.json();
      })
      .then(setData)
      .catch(e => { setData(null); setError(e.message); })
      .finally(() => setLoading(false));
  }, [station]);

  return (
    <div>
      <select value={station} onChange={e => setStation(e.target.value)}>
        {STATIONS.map(s => <option key={s}>{s}</option>)}
      </select>

      {loading && <p>Loading…</p>}
      {error && <p>{error}</p>}
      {data && (
        <>
          <p>Now: {data.current_aqi} (as of {data.based_on})</p>
          {Object.entries(data.forecasts).map(([h, f]) => (
            <p key={h}>{h} ahead: <b>{f.aqi}</b> ({f.category}) at {f.forecast_for}</p>
          ))}
        </>
      )}
    </div>
  );
}
```

---

## 8. Other endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Returns `status`, supported `stations` and forecast `horizons_h`. Useful for a startup check or to fill a dropdown |
| `POST /predict` | Optional. Send your own 169 or more hourly readings. **Not needed for the frontend** |

---

## 9. Important notes

1. **Staleness.** The forecast is based on the newest row in the server's data file (`based_on`). If the data is not updated, the forecast will not be about "now". Compare `based_on` with the current time and show a warning (e.g. "Data is more than 3 hours old") when it is old.
2. **CORS.** The server allows requests from any website (`*`) for development. For production, the backend developer should change this to your site's address.
3. **Caching.** Forecasts change at most once an hour, so you can cache the response for a few minutes.
4. **Not medical advice.** Add a short note that these are model forecasts, not official readings.
5. **Accuracy.** The model is more accurate at 1 and 6 hours than at 12 hours. There is deliberately no 24-hour forecast because it was no better than assuming "same as now".

---

## 10. Quick test

1. Start the server (backend developer): `uvicorn main:app --reload`
2. Open `http://127.0.0.1:8000/predict/Dwarka` in a browser. You should see JSON like the example in section 3.
3. If that works but your page shows nothing, the cause is on the frontend: wrong base URL, a missing `await`/`.json()`, or an unhandled error. Check the browser console and the Network tab.
