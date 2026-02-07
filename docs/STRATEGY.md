# Action Sports WORLD — Platform Strategy

**Company:** H-Consult
**Domain:** actionsports.world
**Owner:** Brian Demsey
**Last Updated:** February 7, 2026

---

## Vision

A federated action sports platform where each sport gets its own branded destination, but all share a common technology backbone. **Surfline meets Strava** — conditions intelligence + activity tracking, built once and deployed across every action sport vertical.

---

## The Core Model

### Two Engines

| Engine | What It Does | Inspiration |
|--------|-------------|-------------|
| **Conditions** | Real-time forecasts, cams, spot data, multi-source comparison | Surfline |
| **Activity** | Session tracking, GPS, stats, social, progression | Strava |

Combined, these create something far stickier than either alone: real-time conditions activate users, personal tracking keeps them coming back.

### Federated Architecture

Each sport gets a **sub-brand** under the Action Sports WORLD umbrella, but they share the same platform engine:

- Surf World / actionsports.world (live — first vertical)
- Foil World
- Skate World
- Snow World
- Paddle World
- Bike World

Build once, deploy many. The conditions engine adapts per sport (ocean data for surfing, snow data for snowboarding, trail/weather data for MTB). The activity tracking layer is universal.

---

## Sports Verticals

### Water-Based
- Surfing (live — first vertical)
- SUP (Stand-Up Paddleboarding)
- Foiling (wing foil, surf foil, SUP foil)
- Outrigger canoe racing
- Kitesurfing / Kiteboarding
- Wakeboarding / Wakesurfing
- Bodyboarding
- Windsurfing
- Whitewater kayaking
- Jet ski freestyle

### Land-Based
- Skateboarding
- Longboarding
- Snowboarding (freestyle / freeride)
- Mountain biking (downhill / enduro)
- Parkour / Freerunning
- Rock climbing / Bouldering
- Sandboarding

### Air-Based
- Wingsuit flying
- Skydiving
- Paragliding
- Base jumping

### Hybrid / Emerging
- E-foil
- Electric skateboarding
- Surf skating / Carver training

**Common thread:** Athleticism, self-expression, risk, and a lifestyle culture that goes beyond the sport itself.

---

## Rollout Strategy

### Phase 1: Surfing + SUP + Foiling (Current)
- Overlapping ocean conditions data
- Shared spot database (coastal locations)
- Ocean Conditions Intelligence app live at actionsports.world

### Phase 2: Land Sports
- Skateboarding, snowboarding, MTB
- Conditions layer shifts to weather, snow reports, trail conditions
- Activity tracking layer: sessions, GPS routes, park/spot check-ins

### Phase 3: Full Platform
- All verticals live
- Cross-sport social features
- Unified athlete profiles across sports

---

## Competitive Landscape

| Competitor | Space | Gap We Fill |
|-----------|-------|-------------|
| Surfline | Surf conditions | Proprietary single-model (LOTUS). We show multi-source comparison with consensus scoring |
| Strava | Activity tracking | No conditions intelligence. Focused on cycling/running, not action sports |
| Outside / Fox Sports | Action sports media | Media only, no conditions or tracking tools |
| MapMyRide | Cycling tracking | No action sports focus |
| Pinkbike / Trailforks | MTB | Single-sport silo |
| Ikon / Epic Pass | Snow | Resort access passes, not conditions intelligence |
| Seaweed (acquired) | Surf data | Absorbed into larger platform |

**Nobody has combined conditions + tracking across multiple action sports under one platform.** That's the whitespace.

---

## Competitive Advantages

- **Multi-source truth:** Show data from NOAA, DWD, MeteoFrance, UK MetOffice, StormGlass AI simultaneously — users see where forecasts agree and diverge
- **Cross-sport platform:** One engine, many sports — network effects compound
- **Lean codebase:** ~1,500-2,000 lines vs. Surfline's estimated 500K-1M+
- **AI-optimized:** Built with Claude for rapid development (30,000+ lines of code track record)
- **Domain expertise:** 40 years in action sports — surfing, outrigger racing, decades in enterprise tech

---

## Revenue Model

| Stream | Description |
|--------|-------------|
| **Subscriptions** | Free tier + premium bundle per sport or all-access |
| **Sponsorship** | Per-vertical brand partnerships |
| **Gear Marketplace** | Integration with action sports retailers |
| **Analytics** | Premium data for serious athletes and coaches |
| **Strategic M&A** | Each vertical can operate independently or be acquired |

---

## Data Sources

### Ocean / Weather Conditions
| Source | Role | Notes |
|--------|------|-------|
| StormGlass | Primary | Multi-source aggregation (NOAA, DWD, MeteoFrance, UK MetOffice, StormGlass AI) |
| Open-Meteo | Free fallback | Marine + weather APIs, no key required |
| NDBC Buoys | Real-time buoy data | NOAA National Data Buoy Center |
| Open-Meteo | Weather forecasts | GFS, DWD ICON, and others |

### Future Data Sources (Per Vertical)
- Snow: OpenSnow, ski resort APIs, avalanche center data
- MTB: Trail condition APIs, Trailforks data
- Wind sports: Wind forecasts for kitesurfing, paragliding
- Tides: StormGlass tide extremes API

---

## Technology Stack

### Current (Surfing Vertical — Live)
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Charts:** Recharts
- **Maps:** Leaflet + OpenStreetMap
- **Hosting:** Render (auto-deploy from GitHub)
- **Domain:** actionsports.world (GoDaddy DNS, Render HTTPS)
- **Repo:** github.com/briandemsey/ocean-conditions

### Planned
- **iOS App:** React Native + Expo → App Store
- **Activity Tracking:** GPS session recording, manual entry, dashboards
- **AI Layer:** LLM-powered condition summaries, session analysis
- **Multi-vertical Engine:** Shared component library, per-sport config

---

## Key Milestones

| Date | Milestone |
|------|-----------|
| Feb 2026 | Ocean Conditions web app live at actionsports.world |
| Q2 2026 | iOS app on TestFlight |
| Jul 4, 2026 | Launch target — Jeff Berg demo (Surfline CEO 2017-2020) |
| Q3 2026 | Activity tracking module (Strava engine) |
| Q4 2026 | Second vertical (SUP/Foiling or Skateboarding) |

---

## Connection to Hallucinations.cloud

The H-LLM Multi Model project (Hallucinations.cloud) provides the AI backbone — multi-model comparison and consensus scoring. The same philosophy applies:

- **Hallucinations.cloud:** Compare multiple LLMs to find consensus (truth in AI)
- **Action Sports WORLD:** Compare multiple forecast models to find consensus (truth in conditions)

Separate brands, different investors, shared intellectual DNA.

---

*This is a living document. Update as the platform strategy evolves.*
