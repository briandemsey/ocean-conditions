# Ocean Conditions Intelligence Platform — Operations Manual

**Project:** H-CONSULT Ocean Conditions Intelligence
**Version:** 1.0
**Last Updated:** February 6, 2026
**Owner:** Brian / H-Consult

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Development Environment Setup](#3-development-environment-setup)
4. [Project Structure](#4-project-structure)
5. [API Configuration](#5-api-configuration)
6. [The 6 Screens](#6-the-6-screens)
7. [Build & Run — Web](#7-build--run--web)
8. [Build & Run — iOS (Expo)](#8-build--run--ios-expo)
9. [App Store Submission](#9-app-store-submission)
10. [Environment Management](#10-environment-management)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Monitoring & Error Handling](#12-monitoring--error-handling)
13. [Security](#13-security)
14. [Release Process](#14-release-process)
15. [Runbooks](#15-runbooks)
16. [Team Workflows](#16-team-workflows)

---

## 1. Project Overview

### What We're Building

A 6-screen ocean conditions intelligence app that replicates Surfline's core user experience using public weather/ocean APIs (StormGlass, Open-Meteo) instead of Surfline's proprietary LOTUS engine.

The app runs as:
- **Web application** — React + Vite, accessible from any browser
- **iOS application** — React Native + Expo, submitted to the Apple App Store

### Key Differentiator

Multi-source forecast comparison with a consensus/agreement score. Surfline shows only their own LOTUS model. We show data from NOAA, DWD, MeteoFrance, UK MetOffice, and StormGlass AI simultaneously, letting the user see where forecasts agree and where they diverge.

### Target Audience

- Demo: Jeff Berg (Surfline CEO 2017-2020)
- Default test location: Huntington Beach, CA
- Launch target: July 4, 2026

### Success Metrics

- Equivalent or better ocean conditions data vs. Surfline
- ~1,500-2,000 lines of code (web) vs. Surfline's estimated 500K-1M+
- Shared codebase between web and iOS

---

## 2. Tech Stack

### Web Application

| Layer       | Technology               | Purpose                                    |
|-------------|--------------------------|---------------------------------------------|
| Frontend    | React 18 + Vite          | UI framework + fast dev server              |
| Styling     | Tailwind CSS             | Utility-first CSS, rapid prototyping        |
| Charts      | Recharts                 | Surf, swell, wind, and tide graphs          |
| Maps        | Leaflet + OpenStreetMap   | Spot maps (free, no API key needed)         |
| Routing     | React Router v6          | Client-side navigation between 6 screens   |
| Backend     | Node.js + Express        | API proxy to protect keys, serves frontend  |
| Language    | JavaScript / TypeScript  | Shared across web and mobile                |

### iOS Application

| Layer       | Technology               | Purpose                                    |
|-------------|--------------------------|---------------------------------------------|
| Framework   | React Native + Expo SDK  | Cross-platform mobile from same JS codebase|
| Charts      | react-native-chart-kit or Victory Native | Mobile-optimized charts     |
| Maps        | react-native-maps        | Native Apple Maps integration               |
| Navigation  | React Navigation         | Screen transitions on mobile                |
| Build       | EAS Build (Expo)         | Cloud builds for iOS .ipa                   |
| Submit      | EAS Submit (Expo)        | Direct submission to App Store Connect      |

### APIs

| API          | Role      | Auth             | Free Tier              | Paid Tier          |
|--------------|-----------|------------------|------------------------|--------------------|
| StormGlass   | Primary   | API key (header) | 10 requests/day        | 500/day at 19/mo   |
| Open-Meteo   | Backup    | None needed      | Unlimited (reasonable) | N/A                |

### Infrastructure (Production)

| Service             | Purpose                           |
|---------------------|-----------------------------------|
| Vercel or Railway   | Web app hosting                   |
| Expo EAS            | iOS builds + App Store submission |
| App Store Connect   | iOS app management + review       |
| GitHub              | Source control                    |
| GitHub Actions      | CI/CD                             |

---

## 3. Development Environment Setup

### Prerequisites

- **macOS** (required for iOS builds via Xcode)
- **Node.js** v18+ (`brew install node`)
- **npm** or **yarn**
- **Git** (`brew install git`)
- **Xcode** (latest from Mac App Store — required for iOS simulator + App Store submission)
- **Xcode Command Line Tools** (`xcode-select --install`)
- **Expo CLI** (`npm install -g expo-cli`)
- **EAS CLI** (`npm install -g eas-cli`)
- **Apple Developer Account** ($99/year — required for App Store submission)
- **StormGlass API Key** (sign up at https://stormglass.io/register)

### Initial Project Setup

```bash
# Clone the repository
cd ~/Projects
git clone <repo-url> ocean-conditions
cd ocean-conditions

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your STORMGLASS_API_KEY

# Start web development server
npm run dev

# In a separate terminal, start the Express backend
npm run server
```

### iOS Development Setup (First Time)

```bash
# Login to Expo
npx expo login

# Login to EAS
eas login

# Configure EAS for this project (creates eas.json)
eas build:configure

# Install iOS pods (if building locally)
cd ios && pod install && cd ..

# Run on iOS Simulator
npx expo run:ios

# OR run via Expo Go app on your physical iPhone
npx expo start
# Then scan the QR code with your iPhone camera
```

### Verify Everything Works

```bash
# Web: Should open at http://localhost:5173
npm run dev

# Backend API: Should respond at http://localhost:3001
npm run server

# Test StormGlass API connection
curl -H "Authorization: YOUR_KEY" \
  "https://api.stormglass.io/v2/weather/point?lat=33.65&lng=-118.00&params=waveHeight"

# iOS Simulator: Should launch Simulator with the app
npx expo run:ios
```

---

## 4. Project Structure

```
ocean-conditions/
├── package.json
├── .env                        # API keys (never commit this)
├── .env.example                # Template for .env
├── .gitignore
├── eas.json                    # Expo EAS build configuration
├── app.json                    # Expo app configuration (name, icons, splash)
├── vite.config.js              # Vite config for web builds
├── tailwind.config.js          # Tailwind CSS config
│
├── docs/
│   └── OPERATIONS_MANUAL.md    # This document
│
├── server/                     # Express backend (API proxy)
│   ├── index.js                # Server entry point
│   ├── routes/
│   │   ├── forecast.js         # /api/forecast/:spotId
│   │   ├── conditions.js       # /api/conditions/:spotId
│   │   ├── tides.js            # /api/tides/:spotId
│   │   └── compare.js          # /api/compare/:spotId (multi-source)
│   └── data/
│       └── spots.json          # Static spots database (15 CA spots)
│
├── src/                        # Shared React code (web + mobile)
│   ├── App.jsx                 # Router + layout
│   ├── pages/
│   │   ├── Search.jsx          # Screen 1: Search
│   │   ├── SpotOverview.jsx    # Screen 2: Current conditions
│   │   ├── ForecastBar.jsx     # Screen 3: 10-day forecast bar
│   │   ├── ForecastDetail.jsx  # Screen 4: Hourly graphs
│   │   ├── MultiSource.jsx     # Screen 5: Multi-source comparison
│   │   └── NearbySpots.jsx     # Screen 6: Nearby spots map
│   ├── components/
│   │   ├── ConditionCard.jsx   # Surf/swell/wind/tide data card
│   │   ├── SurfChart.jsx       # Wave height bar chart
│   │   ├── SwellChart.jsx      # Swell line chart
│   │   ├── WindChart.jsx       # Wind area chart
│   │   ├── TideChart.jsx       # Tide curve
│   │   ├── RatingBadge.jsx     # Color-coded 0-6 rating
│   │   ├── AgreementScore.jsx  # Multi-source confidence display
│   │   ├── SpotMap.jsx         # Leaflet/MapView map
│   │   └── SearchBar.jsx       # Autocomplete search input
│   ├── utils/
│   │   ├── ratings.js          # Raw data -> 0-6 rating algorithm
│   │   ├── formatting.js       # Units, compass directions, etc.
│   │   └── colors.js           # Rating color scale
│   └── data/
│       └── spots.js            # Client-side spot data
│
├── mobile/                     # React Native-specific overrides (if needed)
│   ├── App.native.jsx          # Mobile entry point
│   └── components/             # Mobile-specific component variants
│
├── assets/                     # App icons, splash screens
│   ├── icon.png                # 1024x1024 app icon
│   ├── splash.png              # Splash screen
│   └── adaptive-icon.png       # Android adaptive icon
│
└── ios/                        # Auto-generated by Expo (do not manually edit)
    └── ...
```

---

## 5. API Configuration

### StormGlass (Primary)

**Base URL:** `https://api.stormglass.io/v2`

**Authentication:** API key in the `Authorization` header.

**Key Endpoints:**

```
GET /weather/point
  ?lat={lat}&lng={lng}
  &params=waveHeight,wavePeriod,waveDirection,
          swellHeight,swellPeriod,swellDirection,
          secondarySwellHeight,secondarySwellPeriod,
          windSpeed,windDirection,windGust,
          airTemperature,waterTemperature,
          humidity,visibility,cloudCover,
          currentSpeed,currentDirection
  &source=sg,noaa,dwd,meteo,meto
  &start={ISO timestamp}
  &end={ISO timestamp}

GET /tide/extremes/point
  ?lat={lat}&lng={lng}
  &start={ISO}&end={ISO}
```

**Rate Limits:**
- Free: 10 requests/day
- Small (19/mo): 500 requests/day
- Medium (49/mo): 2,000 requests/day

**Important:** All StormGlass requests MUST go through the Express backend to keep the API key server-side. Never call StormGlass directly from the browser or mobile app.

### Open-Meteo (Free Backup)

**No API key required. No registration needed.**

```
Marine:
GET https://marine-api.open-meteo.com/v1/marine
  ?latitude={lat}&longitude={lng}
  &hourly=wave_height,wave_direction,wave_period,
          swell_wave_height,swell_wave_direction,swell_wave_period
  &forecast_days=7

Weather:
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lng}
  &hourly=temperature_2m,wind_speed_10m,wind_direction_10m
  &forecast_days=7
```

**Fallback strategy:** If StormGlass returns an error or rate limit is hit, automatically fall back to Open-Meteo. Log the fallback event.

---

## 6. The 6 Screens

### Screen 1: Search
- Search bar with autocomplete against spots database
- Pre-loaded: 15 California surf spots (expandable)
- On select → navigate to Screen 2

### Screen 2: Spot Overview (Current Conditions)
- Condition cards: Surf, Swell, Wind, Tide, Water Temp, Weather
- Color-coded rating (0-6 scale: Flat → Epic)
- Conditions Agreement Score (multi-source confidence)

### Screen 3: Forecast Bar (10-Day)
- Horizontal scrollable bar with daily ratings
- Click a day → Screen 4
- Toggle: Graph View / Table View

### Screen 4: Forecast Detail Graphs
- Recharts: Surf height, Swell, Wind, Tide
- Optimal window highlighting (offshore wind + good swell)

### Screen 5: Multi-Source Comparison (Key Differentiator)
- Side-by-side data from: StormGlass AI, NOAA, DWD, MeteoFrance, UK MetOffice
- Overlay chart with consensus band
- Agreement/confidence score

### Screen 6: Nearby Spots
- Map with spot markers
- Conditions comparison table
- Sort by: best conditions, distance, wind

### Rating System

```
0 = FLAT        → #8E8E8E (gray)      — < 0.5 ft
1 = VERY POOR   → #D32F2F (red)       — 0.5-1 ft, bad wind
2 = POOR        → #F57C00 (orange)    — 1-2 ft or poor wind
3 = POOR-FAIR   → #FBC02D (yellow)    — 2-3 ft, mixed conditions
4 = FAIR        → #689F38 (green)     — 3-4 ft, decent wind
5 = GOOD        → #1976D2 (blue)      — 4-6 ft, clean conditions
6 = EPIC        → #7B1FA2 (purple)    — 6+ ft, offshore, groomed
```

---

## 7. Build & Run — Web

### Development

```bash
# Start both frontend and backend
npm run dev        # Vite dev server → http://localhost:5173
npm run server     # Express API    → http://localhost:3001
```

### Production Build

```bash
# Build optimized frontend
npm run build      # Output → dist/

# Preview production build locally
npm run preview
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (first time — follow prompts to link project)
vercel

# Deploy to production
vercel --prod
```

### Deploy to Railway (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Environment Variables for Production

Set these in your hosting provider's dashboard:

| Variable             | Value                          |
|----------------------|--------------------------------|
| `STORMGLASS_API_KEY` | Your StormGlass API key        |
| `NODE_ENV`           | `production`                   |
| `PORT`               | `3001` (or provider default)   |

---

## 8. Build & Run — iOS (Expo)

### Development

```bash
# Start Expo dev server
npx expo start

# Options:
#   Press 'i' → open iOS Simulator
#   Scan QR code → open on physical iPhone via Expo Go
```

### Build for App Store

```bash
# Build a production .ipa file via EAS (cloud)
eas build --platform ios --profile production

# This will:
# 1. Upload your code to Expo's build servers
# 2. Build the .ipa using your Apple credentials
# 3. Return a download link when complete (~10-20 min)
```

### eas.json Configuration

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### app.json Key Fields

```json
{
  "expo": {
    "name": "Ocean Conditions",
    "slug": "ocean-conditions",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.hconsult.ocean-conditions",
      "buildNumber": "1",
      "supportsTablet": false,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Used to find surf spots near you"
      }
    },
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1976D2"
    }
  }
}
```

---

## 9. App Store Submission

### Pre-Submission Checklist

- [ ] App icon: 1024x1024 PNG, no transparency, no rounded corners
- [ ] Screenshots: 6.7" (iPhone 15 Pro Max) and 6.1" (iPhone 15 Pro) — at minimum
- [ ] App description written (max 4000 chars)
- [ ] Privacy policy URL hosted and accessible
- [ ] Age rating questionnaire completed in App Store Connect
- [ ] Keywords selected (max 100 chars total, comma-separated)
- [ ] Support URL set
- [ ] App category set: Weather (primary), Sports (secondary)
- [ ] Build uploaded and processed (green status in App Store Connect)
- [ ] TestFlight beta tested on at least one physical device

### Submission via EAS

```bash
# After a successful eas build, submit directly:
eas submit --platform ios --profile production

# This uploads the .ipa to App Store Connect automatically.
# Then go to App Store Connect to fill in metadata and submit for review.
```

### Submission via Xcode (Alternative — Same as Your Flutter Workflow)

1. Download the .ipa from EAS build
2. Open Xcode → Window → Organizer
3. Distribute App → App Store Connect
4. Follow the upload wizard
5. Go to App Store Connect in your browser
6. Fill in metadata, screenshots, description
7. Submit for review

### Apple Review Guidelines — Key Points

- **4.2 (Minimum Functionality):** The app must provide enough value beyond a website. Our charts, maps, and location-aware features meet this bar.
- **5.1.2 (Data Use and Sharing):** We use location only for finding nearby spots. Disclose in privacy policy.
- **No private API usage.** All data comes from public StormGlass/Open-Meteo APIs.
- **Review typically takes 24-48 hours** for new apps.

### Common Rejection Reasons to Avoid

| Reason | Prevention |
|--------|-----------|
| Metadata mismatch | Screenshots must match actual app screens |
| Crashes on launch | Test on physical device before submitting |
| Missing privacy policy | Host at a public URL before submission |
| Login wall without demo account | If we add login later, provide demo credentials to reviewers |
| Web wrapper (4.2) | Ensure native features: smooth navigation, maps, push notifications |

---

## 10. Environment Management

### Environments

| Environment  | Purpose              | URL                                     |
|-------------|----------------------|------------------------------------------|
| Development | Local coding/testing | http://localhost:5173 (web), Simulator (iOS) |
| Staging     | Pre-release testing  | https://staging.ocean-conditions.app     |
| Production  | Live users + demo    | https://ocean-conditions.app             |

### Environment Variables by Stage

```
# .env.development
STORMGLASS_API_KEY=your-dev-key
API_BASE_URL=http://localhost:3001
NODE_ENV=development

# .env.staging
STORMGLASS_API_KEY=your-staging-key
API_BASE_URL=https://staging-api.ocean-conditions.app
NODE_ENV=staging

# .env.production
STORMGLASS_API_KEY=your-production-key
API_BASE_URL=https://api.ocean-conditions.app
NODE_ENV=production
```

### Key Rule

**API keys NEVER go in the frontend code or mobile app.** All API calls go through the Express backend, which holds the keys server-side. The mobile app calls your Express server, not StormGlass directly.

---

## 11. CI/CD Pipeline

### GitHub Actions — Web

File: `.github/workflows/web.yml`

```yaml
name: Web Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      # Deploy to Vercel on push to main
      - uses: amondnet/vercel-action@v25
        if: github.ref == 'refs/heads/main'
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### GitHub Actions — iOS

File: `.github/workflows/ios.yml`

```yaml
name: iOS Build

on:
  push:
    tags: ['v*']  # Only build iOS on version tags

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform ios --profile production --non-interactive
```

---

## 12. Monitoring & Error Handling

### API Rate Limit Monitoring

StormGlass returns rate limit info in response headers:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1707264000
```

**Action:** Log remaining requests. When below 20%, fall back to Open-Meteo for non-critical requests (nearby spots, background refreshes). Reserve StormGlass for the active user's primary spot.

### Error Handling Strategy

```
API Error → Retry once after 2 seconds
Rate Limited → Fall back to Open-Meteo
Network Error → Show cached data with "Last updated X minutes ago" badge
No Data → Show "No conditions data available" with graceful empty state
```

### Logging

- **Development:** Console logging
- **Production (web):** Vercel built-in logs, or add Sentry for error tracking
- **Production (iOS):** Expo error reporting + Sentry React Native

### Uptime Monitoring (Production)

- Use a free uptime monitor (UptimeRobot, Better Stack) to ping your API endpoint every 5 minutes
- Alert via email if the web app or API goes down

---

## 13. Security

### API Key Protection

- StormGlass key lives ONLY in server-side `.env`
- Express backend proxies all API calls
- `.env` is in `.gitignore` — never committed
- Production keys are set in hosting provider's environment variables dashboard

### Frontend Security

- No API keys in JavaScript bundles
- Sanitize all user input (search queries)
- Use HTTPS everywhere in production
- Set CORS on Express to only allow your domains

### iOS Security

- No secrets embedded in the mobile app binary
- All API calls go to your Express backend, not directly to StormGlass
- Enable App Transport Security (ATS) — Expo enables this by default

### .gitignore Must Include

```
.env
.env.*
!.env.example
node_modules/
dist/
ios/
android/
*.ipa
```

---

## 14. Release Process

### Web Release

1. Merge feature branch to `main` via pull request
2. GitHub Actions automatically builds and deploys to Vercel
3. Verify on production URL
4. Done

### iOS Release

1. Update version in `app.json` (e.g., `1.0.0` → `1.1.0`)
2. Update `buildNumber` (must increment every submission)
3. Create a git tag: `git tag v1.1.0 && git push --tags`
4. GitHub Actions triggers EAS Build
5. Once build completes, submit:
   ```bash
   eas submit --platform ios --profile production
   ```
6. Go to App Store Connect → fill in "What's New" release notes
7. Submit for Apple review
8. Apple approves (24-48 hours typically) → release to users

### Version Numbering

```
MAJOR.MINOR.PATCH
1.0.0  — Initial release
1.1.0  — New feature (e.g., added multi-source comparison)
1.1.1  — Bug fix
2.0.0  — Major change (e.g., new navigation, breaking API change)
```

---

## 15. Runbooks

### Runbook: StormGlass API is Down

1. Check StormGlass status: https://status.stormglass.io
2. The app should auto-fallback to Open-Meteo (7-day data instead of 10-day)
3. If Open-Meteo is also down, the app shows cached/last-known data
4. Monitor and switch back to StormGlass when it recovers

### Runbook: App Store Rejection

1. Read the rejection reason in App Store Connect → Resolution Center
2. Common fixes:
   - **Metadata:** Update screenshots or description to match actual app
   - **Crash:** Reproduce the crash, fix, rebuild with EAS, resubmit
   - **Privacy:** Update privacy policy URL
   - **Functionality (4.2):** Add native features (haptic feedback, push notifications, offline caching)
3. Reply in Resolution Center explaining the fix
4. Resubmit

### Runbook: Adding a New Surf Spot

1. Edit `server/data/spots.json`
2. Add entry with: `id`, `name`, `lat`, `lng`, `region`, `optimalSwell`, `optimalWind`
3. Commit and deploy — no code changes needed

### Runbook: Adding a New Sport Vertical (e.g., Skateboarding)

1. Create a new spot database for skate parks
2. Create new rating algorithm in `utils/ratings.js` (weather conditions relevant to skating)
3. Swap chart types as needed (no tide/swell for skating — replace with wind/rain/temperature)
4. New Tailwind theme for branding
5. Deploy as a separate instance or route on the same platform

---

## 16. Team Workflows

### Git Branching

```
main              — Production-ready code. Deploys automatically.
staging           — Pre-release testing.
feature/screen-1  — Feature branches for individual screens/tasks.
fix/api-fallback  — Bug fix branches.
```

### Workflow

1. Create branch from `main`: `git checkout -b feature/screen-2`
2. Build the feature
3. Push and open a pull request
4. Review (or self-review for solo development)
5. Merge to `main` → auto-deploys web
6. Tag for iOS release when ready

### Commit Message Format

```
feat: add multi-source comparison chart (Screen 5)
fix: handle StormGlass rate limit with Open-Meteo fallback
docs: update operations manual with iOS submission steps
chore: upgrade Expo SDK to v52
```

### Development Priorities (Build Sequence)

| Step | Screen/Task                    | Est. Time |
|------|--------------------------------|-----------|
| 1    | Scaffolding (React + Vite + Express + Expo) | 1 hour |
| 2    | Screen 1 — Search              | 30 min    |
| 3    | Screen 2 — Current Conditions  | 1 hour    |
| 4    | Screen 3 — Forecast Bar        | 45 min    |
| 5    | Screen 4 — Forecast Graphs     | 1.5 hours |
| 6    | Screen 5 — Multi-Source (key differentiator) | 1 hour |
| 7    | Screen 6 — Nearby Spots        | 45 min    |
| 8    | Polish, responsive, dark theme  | 1 hour    |
| 9    | iOS adaptations + TestFlight    | 2 hours   |
| 10   | App Store submission            | 1 hour    |

---

## Appendix A: Initial Spots Database

15 California surf spots pre-loaded for the Jeff Berg demo:

| ID           | Name                         | Region          | Lat      | Lng       |
|-------------|------------------------------|-----------------|----------|-----------|
| hb-south    | Huntington Beach Southside   | Orange County   | 33.6501  | -117.9990 |
| hb-pier     | Huntington Beach Pier        | Orange County   | 33.6553  | -118.0028 |
| trestles    | Trestles (Lowers)            | San Diego North | 33.3828  | -117.5889 |
| wedge       | The Wedge                    | Orange County   | 33.5930  | -117.8819 |
| rincon      | Rincon                       | Santa Barbara   | 34.3742  | -119.4758 |
| malibu      | Malibu (First Point)         | Los Angeles     | 34.0362  | -118.6798 |
| blacks      | Blacks Beach                 | San Diego       | 32.8867  | -117.2536 |
| oceanside   | Oceanside Pier               | San Diego North | 33.1928  | -117.3862 |
| dana-point  | Doheny State Beach           | Orange County   | 33.4600  | -117.6870 |
| el-porto    | El Porto                     | Los Angeles     | 33.8958  | -118.4206 |
| san-onofre  | San Onofre                   | San Diego North | 33.3750  | -117.5694 |
| newport     | Newport Beach                | Orange County   | 33.6095  | -117.9294 |
| seal-beach  | Seal Beach Pier              | Orange County   | 33.7372  | -118.1114 |
| windansea   | Windansea                    | San Diego       | 32.8297  | -117.2812 |
| swamis      | Swami's                      | San Diego North | 33.0337  | -117.2930 |

---

## Appendix B: Color Rating Reference

```
0 = FLAT        → #8E8E8E (gray)      — < 0.5 ft
1 = VERY POOR   → #D32F2F (red)       — 0.5-1 ft, bad wind
2 = POOR        → #F57C00 (orange)    — 1-2 ft or poor wind
3 = POOR-FAIR   → #FBC02D (yellow)    — 2-3 ft, mixed conditions
4 = FAIR        → #689F38 (green)     — 3-4 ft, decent wind
5 = GOOD        → #1976D2 (blue)      — 4-6 ft, clean conditions
6 = EPIC        → #7B1FA2 (purple)    — 6+ ft, offshore, groomed
```

---

## Appendix C: Useful Commands Quick Reference

```bash
# --- Web ---
npm run dev                    # Start web dev server
npm run server                 # Start Express backend
npm run build                  # Production build
npm run preview                # Preview production build

# --- iOS ---
npx expo start                 # Start Expo dev server
npx expo run:ios               # Run on iOS Simulator
eas build --platform ios       # Build .ipa in the cloud
eas submit --platform ios      # Submit to App Store Connect

# --- Git ---
git checkout -b feature/name   # New feature branch
git push -u origin feature/name # Push branch
gh pr create                   # Create pull request

# --- Deployment ---
vercel --prod                  # Deploy web to production
eas build --platform ios --profile production  # Production iOS build
```

---

*This is a living document. Update it as the project evolves.*
