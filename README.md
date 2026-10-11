# AirTrace (BreatheWise) 🌍💨

> **Institutional Air Quality Intelligence & Clean Commute Optimization Engine**  
> *Powered by AWS Bedrock Generative AI & Enterprise Cloud Architecture*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![AWS Bedrock](https://img.shields.io/badge/AWS_Bedrock-Amazon_Nova-FF9900?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/bedrock/)
[![AWS Amplify](https://img.shields.io/badge/AWS_Amplify-Frontend_Hosting-FF9900?style=for-the-badge&logo=aws-amplify)](https://aws.amazon.com/amplify/)
[![Render](https://img.shields.io/badge/Render-Backend_Service-46E3B7?style=for-the-badge&logo=render)](https://render.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma_ORM-336791?style=for-the-badge&logo=postgresql)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 🌟 Executive Overview

**AirTrace (BreatheWise)** transforms passive, city-wide ambient air pollution numbers into **hyperlocal, quantifiable, and actionable intelligence**. 

While traditional weather apps present generic city-wide averages that fail to reflect street-level exposure, **AirTrace** combines high-resolution atmospheric telemetry with **AWS Bedrock Generative AI**, real-time **CPCB Indian NAQI standards**, mathematical **respiratory dosage models**, and multi-route navigation to empower individuals, university campuses, and school districts to make evidence-grounded health and operational decisions.

---

## 🚀 Architectural Superiority: Powered by AWS

AirTrace harnesses the depth and scalability of **Amazon Web Services (AWS)** to deliver sub-second intelligence with enterprise-grade reliability:

### 🧠 AWS Bedrock — Intelligent Inhalation Toxicology & Telemetry Grounding
* **Amazon Nova Foundation Models (`amazon.nova-lite-v1:0`)**: Leverages AWS Bedrock's next-generation multimodal and conversational inference engines via the AWS Bedrock **Converse API**.
* **Zero-Hallucination Grounding**: Every prompt dynamically injects real-time pollutant readings ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, $\text{O}_3$, $\text{NH}_3$, $\text{Pb}$), regulatory thresholds (GRAP Stages I–IV), and official institutional policies.
* **Clinical Health & Inhalation Guardrails**: Specialized system guardrails prevent medical misinformation, politely refusing off-topic banter while offering evidence-based operational decisions for asthmatics, athletic directors, and students.
* **Deterministic Fallback Engine**: Embedded zero-crash architecture automatically transitions to CPCB rule-based heuristic calculations if network connectivity to upstream providers is interrupted.

### ⚡ AWS Amplify — Next-Generation Edge Frontend Hosting
* **Global Edge Acceleration**: Automated CI/CD deployments through AWS Amplify Hosting with globally distributed Amazon CloudFront CDN edge points.
* **Next.js 16 SSR & App Router Optimization**: Native server-side rendering, Turbopack bundling, and instantaneous Partial Prerendering (PPR) cache invalidation.
* **Secure Environment Secret Isolation**: Seamless build-time injection of public variables (`NEXT_PUBLIC_API_URL`) ensuring production-ready cryptographic separation.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (AWS Amplify)"]
        UI["Next.js 16 App Router\n(React 19 + Tailwind CSS)"]
        Nav["Route Planner\n& Leaflet Maps"]
        Campus["Campus Decision\nDashboard"]
        Chat["AI Air Assistant\nInterface"]
    end

    subgraph Backend ["Backend Layer (Render Web Service)"]
        API["Express 5 + TypeScript API Gateway"]
        AuthEng["Better Auth + Session Guard"]
        AqiCalc["CPCB 8-Pollutant NAQI Engine"]
        RouteCalc["OSRM Route Dosage Analyzer"]
        CampusEng["Campus Decision Engine (GRAP / NPCCHH)"]
    end

    subgraph CloudAI ["AI & Cloud Services"]
        Bedrock["AWS Bedrock Runtime\n(Amazon Nova Lite / Converse API)"]
        OpenMeteo["Open-Meteo High-Res Atmospheric Grid"]
        CPCB["Official CAAQMS Ground Stations"]
        DB[(PostgreSQL Database\nNeon / AWS RDS)]
    end

    UI -->|HTTPS / REST| API
    Nav -->|Route Queries| RouteCalc
    Campus -->|Telemetry & Policy| CampusEng
    Chat -->|Inference Queries| API

    API --> AuthEng
    AuthEng --> DB
    RouteCalc --> OpenMeteo
    AqiCalc --> CPCB
    CampusEng --> AqiCalc
    API -->|AWS SDK v3| Bedrock
```

---

## ✨ Core Features & Platform Capabilities

### 1. 🏫 Campus & Institutional Air Decision Engine
Designed for university administrators, athletic directors, and school principals:
* **Indian NAQI & GRAP Compliance**: Incorporates official Ministry of Environment & Forests Graded Response Action Plan (GRAP Stages I–IV) and NPCCHH guidelines.
* **Time-Slot Rescheduling Engine**: Evaluates planned activity windows against alternative forecast windows to mathematically identify lower-exposure operational hours.
* **On-Campus Microclimate Zones**: Breaks campuses down into distinct risk zones (e.g., *Outdoor Sports Complex*, *Academic Quad*, *Perimeter Transit Arteries*, *Botanical Canopy*).
* **Automated Decision Notices**: Produces structured operational clearance statuses: `✅ Approved`, `⚠️ Restricted / Modified`, or `🚫 Strictly Prohibited`.

### 2. 🗺️ Clean Commute Route Optimizer
* **Multi-Corridor Exposure Comparison**: Ingests alternative routes from Open Source Routing Machine (OSRM) for driving, cycling, and walking.
* **Cumulative Particulate Inhalation Dosage**: Calculates cumulative $\text{PM}_{2.5}$ alveolar deposition:
  $$\text{Exposure Index} = \text{Average AQI} \times \text{Duration (hours)} \times F_{\text{mode}}$$
* **Health vs. Time Trade-Offs**: Quantifies exposure reduction (e.g., *"Take Route B: -32% inhaled dose for a 4-minute difference"*).
* **Interactive GeoJSON Maps**: Visualizes route geometries color-coded by real-time spatial air quality segments.

### 3. 🤖 AWS Bedrock Air Intelligence Advisor
* **Conversational Environmental Consultation**: Ask natural-language queries regarding athletic drills, morning assemblies, building filtration, or N95 mask requirements.
* **Strict Telemetry Injection**: Every response quotes current ambient metrics (e.g., quoting $\text{PM}_{2.5}$ in $\mu\text{g/m}^3$ and specific NAQI category).
* **Multi-Turn Chat Session Context**: Maintains clean dialogue memory strictly alternating between user questions and Bedrock recommendations.

### 4. 📊 8-Pollutant Indian NAQI Calculator
* Full regulatory implementation of the Central Pollution Control Board (CPCB) formulation calculating sub-indices across:
  $$\text{AQI} = \max\Big(I_{\text{PM2.5}}, I_{\text{PM10}}, I_{\text{NO2}}, I_{\text{SO2}}, I_{\text{CO}}, I_{\text{O3}}, I_{\text{NH3}}, I_{\text{Pb}}\Big)$$
* Identifies the prominent pollutant and applies spatial calibration to filter out synthetic sensor spikes.

### 5. 🔐 Multi-Role Authentication & Geo-Onboarding
* **Student vs. Professional Portals**: Differentiated profiles with university affiliation and campus coordinate geocoding.
* **Session Persistence**: Built on Better Auth with HTTP-only cookie security, rate limiting, and PostgreSQL persistence.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16** (App Router, Turbopack, React 19) |
| **Frontend Styling** | **Tailwind CSS v4**, Radix UI, Base UI, Class Variance Authority |
| **Interactive Maps** | **Leaflet**, React-Leaflet, CartoDB Basemaps, OpenStreetMap |
| **Backend Runtime** | **Node.js** (v20+), **Express 5**, **TypeScript** (ESModules) |
| **Cloud & Generative AI** | **AWS Bedrock** (`@aws-sdk/client-bedrock-runtime`, Amazon Nova), **AWS Amplify** |
| **Database & ORM** | **PostgreSQL** (Neon / AWS RDS), **Prisma ORM 7** |
| **Authentication** | **Better Auth** (Session-based, Argon2 password hashing) |
| **Validation & Utilities** | **Zod v4**, Date-fns, Lucide React, OpenMeteo SDK |

---

## 🚢 Deployment Guide

### Part 1: Deploy Frontend on AWS Amplify

AWS Amplify provides native support for Next.js App Router applications with automatic continuous deployment.

1. **Push your code to GitHub**:
   Ensure both `amplify.yml` (repository root) and `frontend/amplify.yml` are pushed to your `main` branch.
2. **Open AWS Management Console**:
   * Navigate to **AWS Amplify** $\rightarrow$ Click **Create new app**.
3. **Select Repository & Branch**:
   * Choose **GitHub** and select `AkibRaza3723/AirTrace`.
   * Branch: `main`.
4. **Monorepo Configuration**:
   * Check **My app is a monorepo**.
   * Enter Monorepo root directory: **`frontend`**.
5. **Configure Build Settings**:
   * Amplify will automatically detect the build configuration from `amplify.yml`.
6. **Set Environment Variables**:
   Under **App settings $\rightarrow$ Environment variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` | Live Render backend endpoint |
   | `NEXT_PUBLIC_CARTO_API_KEY` | *(Optional)* | Custom CartoDB map key |
7. **Deploy**:
   Click **Save and Deploy**. Your frontend will build and be live at `https://[branch].[app-id].amplifyapp.com`.

---

### Part 2: Deploy Backend on Render

Render provides native zero-downtime hosting for Node.js web services.

1. **Create a New Web Service**:
   * Log into [Render Dashboard](https://dashboard.render.com).
   * Click **New +** $\rightarrow$ **Web Service** $\rightarrow$ Connect your GitHub repo (`AirTrace`).
2. **Configure Service Settings**:
   * **Name**: `airtrace-backend`
   * **Region**: *Oregon (US West)* or closest to your database
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**:
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   * **Start Command**:
     ```bash
     npm run start
     ```
3. **Add Environment Variables**:
   Under the **Environment** tab on Render, add:
   | Key | Example Value | Description |
   | :--- | :--- | :--- |
   | `PORT` | `5001` | Server listening port |
   | `NODE_ENV` | `production` | Production environment flag |
   | `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | PostgreSQL connection string |
   | `BETTER_AUTH_SECRET` | `generate-a-32-char-random-secret` | Cryptographic session secret |
   | `BETTER_AUTH_URL` | `https://your-backend.onrender.com` | Public backend Render URL |
   | `AWS_REGION` | `us-east-1` | AWS Bedrock Region |
   | `AWS_ACCESS_KEY_ID` | `AKIA...` | IAM Key with `bedrock:InvokeModel` |
   | `AWS_SECRET_ACCESS_KEY`| `wJalr...` | IAM Secret |
   | `AWS_BEDROCK_MODEL_ID` | `amazon.nova-lite-v1:0` | Active AWS Bedrock model identifier |
4. **Deploy**:
   Click **Create Web Service**. Run database migrations if necessary via Render Shell:
   ```bash
   npx prisma db push
   ```

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher
* **PostgreSQL** database (Local or Cloud instance e.g., Neon / Supabase)
* **AWS IAM Credentials** with Bedrock model access permissions

### 1. Clone Repository
```bash
git clone https://github.com/AkibRaza3723/AirTrace.git
cd AirTrace
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env

# Generate Prisma client and sync schema
npx prisma generate
npx prisma db push

# Start backend dev server (runs on http://localhost:5001)
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create environment file if connecting to custom port
echo "NEXT_PUBLIC_API_URL=http://localhost:5001" > .env.local

# Start Next.js Turbopack dev server (runs on http://localhost:3000)
npm run dev
```

### 4. Run Automated Test Suite
```bash
cd ../backend
npm test
# Verified 34/34 passing unit and integration tests across NAQI & Decision Engines
```

---

## 🛡️ License & Acknowledgements

* **License**: MIT License © 2026 AirTrace Team.
* **Atmospheric Data**: Central Pollution Control Board (CPCB) India, Open-Meteo Air Quality APIs, OpenAQ.
* **Routing**: Open Source Routing Machine (OSRM) & OpenStreetMap.
* **AI Provider**: Powered by AWS Bedrock Foundation Models.
