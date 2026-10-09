# AirTrace (BreatheWise)

> **AI-Powered Pollution Exposure & Action Platform**  
> Built for WeMakeDevs Environmental Hacks 2026 — Air Track

AirTrace converts passive air-quality numbers into actionable personal decisions. Instead of showing generic city-wide AQI scores, AirTrace calculates personalized pollution exposure based on physiological exertion and travel duration, highlights pollution-minimized travel routes, and delivers operational safety guidance for schools and commuters.

---

## Key Capabilities

- **Hyperlocal Air Telemetry:** Direct station readings from OpenAQ v3 paired with Open-Meteo forecasts, with explicit data freshness and station attribution.
- **Personal Exposure Index:** Mathematical formulation factoring in duration, pollutant concentration, and respiration rate based on physical activity (sitting vs. walking vs. cycling).
- **Pollution-Aware Route Planner:** Compares routes by travel time versus inhaled particulate exposure (Fastest vs. Lowest Exposure vs. Balanced trade-offs).
- **Institutional / School Mode:** Clear operational protocols for schools (outdoor physical education, assemblies, ventilation guidelines).
- **Satellite Fire / Smoke Tracking:** Integration with NASA FIRMS active fire detections to flag upwind agricultural and wildfire smoke plumes.
- **Grounded AI Air Advisor:** Context-constrained assistant answering user queries with zero medical hallucination, strictly grounded in live backend telemetry.

---

## Technical Specifications

For full architectural diagrams, mathematical formulations, database schemas, API specs, and the 3-minute video demo script, see the complete specification document:

👉 **[Complete Engineering & Product Build Spec](BUILD_SPEC.md)**

---

## Repository Structure

```
AirTrace/
├── BUILD_SPEC.md       # Full engineering specification & build document
├── frontend/           # Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
├── backend/            # Node.js + TypeScript API server
└── .gitignore          # Repository gitignore configuration
```

---

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, shadcn/ui
- **Backend:** Node.js, TypeScript, Express / Fastify
- **Database & Cache:** PostgreSQL, Redis
- **Data Sources:** OpenAQ v3 API, Open-Meteo Air Quality, NASA FIRMS
- **Cloud Infrastructure:** AWS S3, Lambda, EventBridge, CloudWatch
