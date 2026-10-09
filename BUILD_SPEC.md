# BreatheWise / AirTrace — Engineering & Product Build Spec

**Target Event:** WeMakeDevs Environmental Hacks 2026 — Air Track  
**Document Status:** Build-Ready Specification  
**Architecture:** Next.js (Frontend) + Node.js/TypeScript (API) + PostgreSQL/Redis + AWS Infrastructure  

---

## 1. Problem Statement & Core Value Proposition

Standard air-quality applications display city-wide average AQI numbers (e.g., *"AQI is 218 — Unhealthy"*). This metric is passive, geographically broad, and does not provide actionable guidance for personal decisions.

**Core Thesis:**  
Users don't just need to know the air is bad; they need to know:
1. **Who is most exposed** based on physiological activity and baseline vulnerability.
2. **When and where exposure peaks** across their daily routine.
3. **What specific trade-offs reduce intake** (e.g., spending 6 extra minutes on Route B reduces inhaled PM2.5 exposure by 28%).

```
[ Ingested Ground / Satellite Data ]
                 │
                 ▼
     [ Personal Exposure Engine ]
                 │
                 ▼
[ Actionable Trade-offs (Route / Schedule / School Mode) ]
                 │
                 ▼
       [ Quantified Intake Reduction ]
```

---

## 2. Feature Scope & Priority Matrix

| Priority | Feature | Scope & Mechanics | ML Dependency |
| :--- | :--- | :--- | :--- |
| **P0** | **Live Air Quality Dashboard** | Station-level PM2.5, PM10, key gases (NO2, SO2, CO, O3), localized weather, data timestamp, and station source attribution. | None |
| **P0** | **Personal Exposure Engine** | Computes estimated exposure scores based on duration, pollutant concentration, activity respiration rate, and location micro-environments. | None (Deterministic formula) |
| **P0** | **Pollution-Aware Route Comparison** | Evaluates travel routes between Origin and Destination; compares travel time against estimated cumulative pollution exposure (Fastest vs. Lowest Exposure vs. Balanced). | None (Segment aggregation) |
| **P0** | **Institutional / School Safety Mode** | Rule engine providing operational recommendations (e.g., cancel outdoor physical education, shift morning assembly indoors, open/close ventilation). | Deterministic rule matrix |
| **P0** | **Grounded AI Air Assistant** | Context-injected LLM assistant providing plain-language recommendations strictly grounded in real-time telemetry. Zero health hallucinations. | LLM API / AWS Bedrock |
| **P0** | **AWS Cloud Architecture** | Ingestion pipeline, raw telemetry storage (S3), background scheduling (EventBridge/Lambda), and centralized logging (CloudWatch). | None |
| **P1** | **Satellite Fire / Stubble Tracking** | NASA FIRMS active fire detection layer paired with wind direction to flag incoming smoke plumes. | None |
| **P1** | **Multi-Hour Exposure Forecast** | Hourly forward projection of personal exposure based on forecast weather and pollutant shifts. | Open-Meteo API / Optional XGBoost |
| **P1** | **Indoor vs. Outdoor Mode** | Comparative differential between ambient street air and indoor estimates / IoT readings. | None |
| **P2** | **Crowdsourced Hotspot Reports** | Geo-tagged community incident reports (trash burning, construction dust plumes). | None |
| **P2** | **Proactive Threshold Alerts** | Push/webhook notifications when a user's route or localized station crosses critical thresholds. | None |

---

## 3. Exposure Engine Formulation

The exposure engine translates raw atmospheric concentration into an actionable, person-centric exposure indicator.

### Mathematical Formulation

$$\text{Exposure Index} = \text{normalized}(\text{PM}_{2.5}) \times \text{Duration (hours)} \times \mathcal{F}_{\text{activity}} \times \mathcal{F}_{\text{location}}$$

Where:
- $\text{normalized}(\text{PM}_{2.5}) = \frac{\text{PM}_{2.5} \ (\mu\text{g/m}^3)}{25}$ (calibrated to WHO 24-hour guideline reference).
- $\mathcal{F}_{\text{activity}}$ reflects respiration rate variance:
  - **Sedentary / Indoor Baseline:** `1.0`
  - **Walking / Commuting (Transit):** `1.5`
  - **Biking / Running / Heavy Outdoor Exertion:** `2.5` to `3.0`
- $\mathcal{F}_{\text{location}}$ accounts for immediate micro-environments:
  - **Suburban / Park / Background:** `0.85`
  - **Standard Urban Area:** `1.0`
  - **Arterial Highway / High-Traffic Corridor:** `1.3` to `1.5`

### Route Segment Analysis
For any route $\mathcal{R}$ partitioned into discrete geometry segments $s_1, s_2, \dots, s_n$ with travel time $t_i$ and local ambient concentration $C_i$:

$$\text{Total Route Exposure} = \sum_{i=1}^{n} C_i \times t_i \times \mathcal{F}_{\text{mode}}$$

Routes are scored into three options:
1. **Fastest Route:** Minimizes $\sum t_i$ regardless of exposure.
2. **Lowest Exposure Route:** Minimizes total route exposure (e.g., reroutes away from major highways through secondary streets).
3. **Balanced Route:** Constrains travel time to $\le 1.15 \times t_{\text{fastest}}$ while maximizing exposure reduction.

> **Labeling Constraint:** The exposure index must always be presented as an *estimated personal exposure indicator*, never as a clinical or medical diagnosis.

---

## 4. External Data Integrations

| Provider | Purpose | Endpoints / Datasets | Update Frequency |
| :--- | :--- | :--- | :--- |
| **OpenAQ v3 API** | Ground-truth station observations (PM2.5, PM10, NO2, SO2, O3, CO) | `GET /v3/locations`, `GET /v3/sensors/{id}/measurements` | 10–60 mins |
| **Open-Meteo Air Quality** | Spatial coverage & 72-hour hourly forecasts | `GET https://air-quality-api.open-meteo.com/v1/air-quality` (PM2.5, PM10, dust, wind variables) | Hourly |
| **NASA FIRMS** | Thermal anomalies / active wildfire & crop stubble detections | MODIS (1km) / VIIRS (375m) NRT feeds via CSV or GeoJSON endpoint | 3–6 hours |
| **Routing Provider** | Geometry, duration, and multi-route alternatives | OSRM / OpenRouteService / Mapbox Directions API | On-demand |

---

## 5. System Architecture & AWS Infrastructure

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js / TypeScript)                 │
│              Shadcn UI • MapLibre GL • Exposure Visualizer             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Backend API (Node.js / Express or Fastify)            │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────┐ │
│  │ Exposure Calculation │  │ Route Multi-Scoring │  │ School Rules   │ │
│  └──────────────────────┘  └─────────────────────┘  └────────────────┘ │
└──────────┬────────────────────────┬─────────────────────────┬──────────┘
           │                        │                         │
           ▼                        ▼                         ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  Redis (Cache Layer) │ │ PostgreSQL (Storage) │ │ LLM Engine (Bedrock) │
│  API Response Cache  │ │ Historical Telemetry │ │ Grounded Assistance  │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
           ▲
           │ Ingestion Workers
┌──────────┴─────────────────────────────────────────────────────────────┐
│                       AWS Serverless Pipeline                          │
│                                                                        │
│   EventBridge (Cron) ──► Lambda Worker ──► Fetch OpenAQ / FIRMS        │
│                                │                                       │
│                                ├──► Save Raw Parquet/JSON to S3        │
│                                └──► Update Active Cache / Database     │
│                                                                        │
│   CloudWatch: Centralized Logs, Latency Metrics & Ingestion Alarms     │
└────────────────────────────────────────────────────────────────────────┘
```

### AWS Implementation Footprint
- **Amazon S3:** Bucket `airtrace-telemetry-raw` storing immutable daily batches of ground and satellite measurements.
- **AWS Lambda + EventBridge:** Automated worker running on a 15-minute cron schedule to poll stations, write raw files to S3, and trigger cache updates.
- **Amazon CloudWatch:** Telemetry on ingestion latency, external API quota tracking, and error logs.
- **Amazon Bedrock (or managed LLM API):** Claude 3.5 Sonnet or equivalent model invoked with structured context payloads.

---

## 6. Database Schema Design (PostgreSQL)

```sql
-- Tracked monitoring stations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    source VARCHAR(64) NOT NULL, -- e.g. 'OpenAQ', 'Open-Meteo'
    external_station_id VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ground station measurements
CREATE TABLE air_measurements (
    id BIGSERIAL PRIMARY KEY,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    pm25 REAL,
    pm10 REAL,
    no2 REAL,
    so2 REAL,
    co REAL,
    o3 REAL,
    temperature REAL,
    humidity REAL,
    source VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_air_measurements_loc_time ON air_measurements(location_id, recorded_at DESC);

-- Forecast records
CREATE TABLE forecasts (
    id BIGSERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    forecast_for TIMESTAMP WITH TIME ZONE NOT NULL,
    pm25 REAL,
    pm10 REAL,
    weather_condition VARCHAR(64),
    wind_speed REAL,
    wind_direction REAL,
    source VARCHAR(64) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_forecasts_coords_time ON forecasts(latitude, longitude, forecast_for);

-- Satellite fire observations (NASA FIRMS)
CREATE TABLE fire_events (
    id BIGSERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    satellite VARCHAR(32) NOT NULL, -- 'MODIS', 'VIIRS'
    confidence VARCHAR(16),
    frp REAL, -- Fire Radiative Power (MW)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_fire_events_detected ON fire_events(detected_at DESC);

-- User routes & exposure valuations
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(128) NOT NULL,
    origin_name VARCHAR(255),
    destination_name VARCHAR(255),
    origin_coords POINT NOT NULL,
    dest_coords POINT NOT NULL,
    distance_meters INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    route_geometry JSONB NOT NULL,
    exposure_score REAL NOT NULL,
    route_type VARCHAR(32) NOT NULL -- 'fastest', 'lowest_exposure', 'balanced'
);

-- User logged or estimated exposure sessions
CREATE TABLE exposure_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(128) NOT NULL,
    activity_type VARCHAR(64) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    calculated_exposure REAL NOT NULL,
    risk_level VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. Frontend User Experience & Views

The application implements a desktop and mobile responsive interface structured into 6 primary modules:

```
├── / (Home Dashboard)
│   ├── Location selector & coordinates
│   ├── Primary Air Quality card (PM2.5, PM10, primary pollutant)
│   ├── Data freshness badge ("Updated 12m ago • Source: OpenAQ / Central Station")
│   └── "What should I do right now?" instantaneous action banner
│
├── /exposure (Personal Exposure Timeline)
│   ├── Daily 24-hour timeline scrubbing through estimated exposure
│   ├── Peak exposure window callout (e.g., "08:00 - 10:00 AM — Morning rush peak")
│   └── Activity mode selector (Desk Work, Walking Commute, Cycling/Running)
│
├── /route (Pollution-Aware Route Planner)
│   ├── Origin / Destination inputs with map rendering
│   ├── 3 Route Cards:
│   │   ├── Fastest (22 mins • Exposure: High / 64 pts)
│   │   ├── Balanced (26 mins • Exposure: Moderate / 41 pts • -36% Exposure)
│   │   └── Lowest Exposure (29 mins • Exposure: Low / 32 pts • -50% Exposure)
│   └── Clean map polyline visualization color-coded by pollution gradient
│
├── /schools (School & College Safety Portal)
│   ├── Institutional protocol dashboard
│   ├── Outdoor activity status: Green (Proceed), Amber (Limit to 20m), Red (Move Indoors)
│   └── Deterministic justification rationale (e.g., "PM2.5 > 120 µg/m³ during 9 AM assembly slot")
│
├── /hotspots (Satellite Thermal & Wildfire Radar)
│   ├── Regional map overlay plotting NASA FIRMS thermal anomaly coordinates
│   └── Downwind trajectory indicator flagging potential agricultural stubble smoke
│
└── /assistant (Grounded AI Air Advisor)
    ├── Conversational drawer grounded strictly in active context payload
    └── Explicit "Sources & Metrics Used" disclosure on every generated response
```

---

## 8. AI Assistant Guardrail Architecture

The LLM is strictly prohibited from guessing or fabricating pollution numbers, making clinical diagnoses, or providing generic ungrounded advice.

### Context Assembly Schema
Before calling the LLM, the backend constructs an explicit JSON payload:

```json
{
  "location": { "name": "Civil Lines", "lat": 28.67, "lon": 77.22 },
  "telemetry": {
    "pm25": 164.2,
    "pm10": 280.5,
    "primary_pollutant": "PM2.5",
    "updated_at": "2026-10-09T09:45:00Z",
    "source": "OpenAQ (Station ID: IN-012)"
  },
  "exposure": {
    "current_risk": "VERY_HIGH",
    "peak_hours_today": "08:00 - 10:30 AM",
    "selected_activity": "Cycling"
  },
  "regional_fire_context": {
    "nearby_fires_count": 14,
    "closest_fire_km": 68.4,
    "wind_direction_deg": 315,
    "plume_risk": "ELEVATED"
  },
  "school_protocol": {
    "outdoor_assembly": "PROHIBITED",
    "sports_allowed": false
  }
}
```

### System Instruction Constraints
1. Rely **exclusively** on the provided JSON telemetry. Never state general statistics about other cities not in context.
2. If asked for medical advice, provide immediate practical mitigation (e.g., *wear N95 mask, reschedule outdoor aerobic run to after 2:00 PM*) and explicitly direct medical concerns to certified healthcare providers.
3. Every response must state the data source name and measurement timestamp.

---

## 9. Machine Learning Strategy (Pragmatic Scope)

- **Default Stance:** Open-Meteo's hourly forecasts provide immediate, dependable baseline values out of the box. Do **not** block product delivery on custom ML training.
- **Optional Enhancement (Only if P0 is operational early):**
  - **Algorithm:** XGBoost Regressor predicting `pm25_{t+3h}`.
  - **Input Features:** Lagged PM2.5 ($t_{-1}, t_{-3}, t_{-6}, t_{-24}$), temperature, relative humidity, boundary layer height, wind speed vector ($u, v$), hour-of-day, day-of-week, and nearby active fire count.
  - **Split Strategy:** Strict chronological time split (train on historical weeks, validate on future days). Random cross-validation row shuffling is strictly prohibited due to severe auto-correlation leakage.
  - **Fallback:** If validation RMSE fails to outperform Open-Meteo baseline, drop custom inference and rely on API forecast feeds.

---

## 10. Explicit Hackathon Exclusions (What NOT to Build)

To prevent scope creep and ensure a rock-solid submission:

1. **No custom CNN / computer vision models** on raw satellite imagery (use pre-computed NASA FIRMS tabular coordinates instead).
2. **No custom IoT hardware or microcontroller firmware** (rely on verified public station APIs).
3. **No complex microservice mesh or Kubernetes clusters** (monolithic TypeScript Node.js backend deployed cleanly on simple cloud infrastructure).
4. **No claims of medical diagnosis or clinical health outcomes** (label everything as estimated exposure and actionable risk indicators).
5. **No features that cannot be cleanly demonstrated in the final 3-minute video.**

---

## 11. Step-by-Step Implementation Roadmap

```
Phase 1: Shell & Core APIs (Hours 0 - 6)
  [x] Setup monorepo: Next.js (App Router, Tailwind, Shadcn) + Node/Express backend.
  [ ] Connect OpenAQ v3 API and Open-Meteo Air Quality endpoint.
  [ ] Implement Redis caching layer for third-party API payloads.

Phase 2: Exposure Scoring & Routing (Hours 6 - 14)
  [ ] Build deterministic Exposure Calculation Engine (/exposure module).
  [ ] Implement multi-route evaluation service integrating routing API geometry.
  [ ] Build Frontend Route Planner UI with comparative exposure delta tags.

Phase 3: Decision Systems & AI Grounding (Hours 14 - 20)
  [ ] Develop School/College Safety Mode rule matrix.
  [ ] Wire NASA FIRMS active fire feed to map overlay.
  [ ] Implement context assembly payload and hook up LLM Air Assistant.

Phase 4: Cloud Infrastructure & Polish (Hours 20 - 24)
  [ ] Provision AWS S3 bucket and Lambda cron task via EventBridge.
  [ ] Setup CloudWatch log monitoring and export sample pipeline screenshots.
  [ ] Rehearse user flow, verify mobile responsiveness, record demo video.
```

---

## 12. 3-Minute Video Demo Script

| Time | Segment | Screen / Visual Action | Narration & Key Dialogue |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:20** | **The Hook** | High-traffic urban footage / polluted road visual. | *"Standard apps say AQI is 220, but what does that actually mean for your morning commute or your child's sports class? AQI is passive. BreatheWise makes air quality actionable by tracking personal exposure and concrete trade-offs."* |
| **0:20 – 0:45** | **Live Dashboard** | Home dashboard; select localized station. Zoom into freshness badge. | *"Here is the live dashboard. Unlike generic city averages, we pull hyperlocal ground sensors from OpenAQ with timestamp transparency. Notice the active reading: 164 µg/m³ of PM2.5, updated 12 minutes ago."* |
| **0:45 – 1:20** | **Personal Exposure** | Toggle activity selector (Desk Work → Cycling). Scrub 24h timeline. | *"A commuter on an e-bike inhales vastly more particulates than someone sitting indoors. Our exposure engine combines duration, respiration rate, and location to plot today's danger window: 8:00 to 10:00 AM."* |
| **1:20 – 1:55** | **Route Trade-Off (Key Differentiator)** | Enter origin and destination. Display the 3 route options side-by-side. | *"Here is the core differentiator: Route comparison by pollution exposure. The fastest route along the ring road takes 22 minutes with high exposure. Route B takes just 4 minutes longer but cuts inhaled exposure by 36% by avoiding heavy truck corridors."* |
| **1:55 – 2:20** | **School Safety Mode** | Switch to Institutional / School portal view. | *"For schools and colleges, administrators cannot wait for generic advice. Our institutional mode checks hourly thresholds and outputs clear protocols: Move 9 AM morning assembly indoors, cancel outdoor sports."* |
| **2:20 – 2:40** | **Fire Radar & AI Assistant** | Show FIRMS stubble fire markers + ask AI assistant for advice. | *"We integrate NASA FIRMS satellite fire detections to flag upwind agricultural burning. And our AI assistant is strictly grounded in this live telemetry — giving direct, zero-hallucination guidance."* |
| **2:40 – 3:00** | **Architecture & Impact** | Display architecture diagram highlighting AWS S3, Lambda, EventBridge, CloudWatch. | *"Backed by automated AWS serverless pipelines storing raw data in S3 and scheduled via EventBridge, BreatheWise turns passive numbers into measurable exposure reduction. Thank you."* |
