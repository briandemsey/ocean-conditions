# Strava Complete Feature Map & Module Analysis

**Research Date:** February 2026
**Purpose:** Comprehensive mapping of all Strava modules/features for action sports platform comparison

---

## Table of Contents

1. [Platform Overview & Architecture](#1-platform-overview--architecture)
2. [Navigation Structure](#2-navigation-structure)
3. [Module 1: Activity Recording & Upload](#3-module-1-activity-recording--upload)
4. [Module 2: Activity Feed (Dashboard/Home)](#4-module-2-activity-feed-dashboardhome)
5. [Module 3: Activity Detail Page](#5-module-3-activity-detail-page)
6. [Module 4: Profile & Personal Stats](#6-module-4-profile--personal-stats)
7. [Module 5: Training & Analytics](#7-module-5-training--analytics)
8. [Module 6: Routes & Exploration](#8-module-6-routes--exploration)
9. [Module 7: Segments & Leaderboards](#9-module-7-segments--leaderboards)
10. [Module 8: Social & Community](#10-module-8-social--community)
11. [Module 9: Clubs](#11-module-9-clubs)
12. [Module 10: Challenges & Gamification](#12-module-10-challenges--gamification)
13. [Module 11: Maps & Visualization](#13-module-11-maps--visualization)
14. [Module 12: Gear Management](#14-module-12-gear-management)
15. [Module 13: Sharing & Content Creation](#15-module-13-sharing--content-creation)
16. [Module 14: Notifications](#16-module-14-notifications)
17. [Module 15: Settings & Privacy](#17-module-15-settings--privacy)
18. [Module 16: Integrations & API](#18-module-16-integrations--api)
19. [Module 17: Subscription & Monetization](#19-module-17-subscription--monetization)
20. [Core User Experience Loops](#20-core-user-experience-loops)
21. [Free vs. Paid Feature Matrix](#21-free-vs-paid-feature-matrix)
22. [Supported Activity Types](#22-supported-activity-types)

---

## 1. Platform Overview & Architecture

Strava operates across three surfaces:
- **Mobile App** (iOS / Android) -- primary experience, GPS recording, all core features
- **Website** (strava.com) -- full dashboard, advanced analytics, route builder, settings
- **Apple Watch App** -- activity recording, route navigation, live segments

**User base:** 135+ million registered athletes globally (as of 2025).

**Core identity:** "The social network for athletes." Strava positions itself as a community-first platform that layers analytics and gamification on top of activity tracking.

---

## 2. Navigation Structure

### Mobile App (Primary)

**Bottom Navigation Bar (5 tabs):**

| Tab | Icon | Purpose |
|-----|------|---------|
| **Home** | House | Activity feed from followed athletes |
| **Maps** | Map pin | Route exploration, heatmaps, saved routes |
| **Record** | Central + button | Start GPS recording of an activity |
| **Groups** | People | Clubs, group challenges, events |
| **You** | Profile | Personal profile, stats, progress, settings |

**Top Bar (contextual):**
- Bell icon (notifications)
- Gear icon (settings -- accessible from Home, Groups, or You tabs)
- Search icon

### Website Navigation

**Top Nav Bar:**

| Item | Sub-items |
|------|-----------|
| **Dashboard** | Activity feed (home) |
| **Training** | Training Log, My Activities, Power Curve |
| **Explore** | Segment Explore, Athlete Search, Heatmap, Local Guides, Routes |
| **Challenges** | Browse and join challenges |
| **Profile dropdown** | My Profile, Settings, Find Friends, My Gear, Apps (connected), Subscription |

**Secondary Header Links:**
- About Us
- What's New
- Subscribe
- Careers
- Stories (editorial blog at stories.strava.com)

**Footer Navigation:**
- Features
- Subscription / Family Plan
- Student Discount
- Teacher / Military / Medical Professional Discounts
- Gift Subscriptions
- Routes (regional hiking content)
- Press
- Business & Partner Center
- Developer API
- Community Hub

---

## 3. Module 1: Activity Recording & Upload

### GPS Recording (Mobile / Watch)
- **Start screen:** Sport type selector, GPS signal strength indicator (halo around location), start button
- **During recording:** Live map, elapsed time, distance, pace/speed, elevation, heart rate (if connected)
- **Live Segments:** Real-time comparison against your PR and KOM/QOM/CR on starred segments
- **Auto-pause:** Detects when you stop moving
- **Beacon:** Live location sharing with trusted contacts for safety (now free for all users)
- **Audio cues:** Configurable audio updates at distance/time intervals

### Upload Methods
1. **Direct GPS recording** via Strava mobile app
2. **Sync from GPS device** (Garmin, Wahoo, Coros, Polar, Suunto, etc.)
3. **Sync from third-party apps** (Peloton, Zwift, Apple Health, etc.)
4. **File upload** from computer (GPX, TCX, FIT formats)
5. **Manual entry** -- enter time, distance, sport type without GPS data

### Post-Upload Processing
- Automatic segment matching
- Achievement/PR detection
- Matched activity detection (same route done before)
- Athlete Intelligence AI analysis (subscribers)
- Flyover 3D video generation
- Gear auto-assignment based on sport type

---

## 4. Module 2: Activity Feed (Dashboard/Home)

### Feed Content Types
- **Activities** from followed athletes (with map, stats, photos)
- **Club posts** from joined clubs
- **Challenge completions** and badge awards
- **KOM/QOM/CR achievements** by followed athletes
- **Goal completions**
- **Group activities** (tagged together)
- **Milestone celebrations** (e.g., "500th ride")

### Feed Ordering Options
1. **Personalized** -- algorithmically ranked based on activities you interact with and efforts you may have missed
2. **Latest Activities** -- chronological by activity completion time

### Feed Interactions
- **Kudos** (quick thumbs-up / like)
- **Comments** on activities
- **View activity details** (tap through)
- **View athlete profile**
- **Share activity** externally

---

## 5. Module 3: Activity Detail Page

### Core Data Display
- **Map** with GPS track (polyline), customizable map types
- **Key stats:** Distance, elapsed time, moving time, pace/speed, elevation gain/loss, calories
- **Splits table:** Per-mile or per-km breakdown with color-coded pacing
- **Elevation profile** graph
- **Heart rate graph** with zone distribution
- **Power graph** (cycling, with zone distribution)
- **Pace/speed graph**
- **Cadence data** (if available)
- **Temperature data** (if available)

### Activity Features
- **Photos** attached to the activity (geotagged to map locations)
- **Activity description** (athlete's notes)
- **Perceived exertion** (RPE scale input)
- **Relative Effort score** (calculated from HR or perceived exertion)
- **Segment efforts** list with times, rankings, and PR indicators
- **Best Efforts** (estimated best times for standard distances -- e.g., 1mi, 5K, 10K, half marathon)
- **Matched Activities** link (if route was done before)
- **Flyover** 3D playback button (subscribers)
- **Athlete Intelligence** AI summary (subscribers)
- **Gear used** (auto-assigned or manually selected)
- **Laps** data (if recorded)
- **Kudos list** and **comments section**
- **Group activity** tagging (who you were with)
- **Weather conditions** at time of activity

### Activity Actions
- Edit activity (title, description, sport type, gear, privacy)
- Share (link, social media, Instagram Stories)
- Flag activity
- Delete activity
- Export (download original file)
- Hide from feed

---

## 6. Module 4: Profile & Personal Stats

### Profile Page Sections
- **Header:** Profile photo, name, location, bio, follow/following counts
- **Recent activities** (filterable by sport type)
- **Stats overview area:** Recent trophies and achievements
- **Trophy Case** tab
- **Followers / Following** tabs
- **KOMs / CRs** tab (segment crowns held)

### Personal Stats
- **Last 4 weeks** averages (distance, time, elevation, activity count)
- **Year-to-date** totals
- **All-time** totals
- **Stats filterable by:** Time period (week/month), sport type, distance/time/elevation

### Goals (Subscribers)
- **Weekly goals** (distance, time, elevation, activity count)
- **Monthly goals**
- **Annual goals**
- **Segment goals** (target time on a specific segment)
- **Power goals** (FTP targets)
- **Progress bars** showing proximity to each goal

### Personal Records (PRs)
- Manually entered race PRs (linked to official results or Strava activities)
- Best Efforts auto-detected (standard distances: 400m, 1/2 mi, 1 mi, 2 mi, 5K, 10K, 15K, 10 mi, 20K, Half Marathon, Marathon, 50K)
- Segment PRs (gold, silver, bronze medals for top 3 personal times)

### Year in Sport (Annual)
- Personalized recap available December-January each year
- Highlights unique data insights, social engagements, standout moments
- Requires subscription and 3+ activities that year
- Mobile-only experience
- Shareable to social media

---

## 7. Module 5: Training & Analytics

### Training Log (Subscribers)
- **Calendar view** showing all activities by day
- **Weekly summaries** with totals for distance, time, elevation, relative effort
- **Filterable by:** Sport type, time, distance, elevation, relative effort
- **Visual progress indicators** with color coding
- **Week-by-week comparison**

### Activity History
- Searchable/filterable list of all past activities
- Group by week or month
- Filter by sport type

### Relative Effort
- Proprietary metric combining HR zone data with duration
- Cross-sport comparable (running effort vs. cycling effort)
- Uses personalized heart rate zones
- Can substitute Perceived Exertion when no HR data available

### Fitness Score / Fitness & Freshness (Subscribers)
- **Fitness score** -- cumulative training load over time
- **Fatigue score** -- recent training stress
- **Form** = Fitness minus Fatigue (indicates peak readiness)
- **Chart** plotting fitness, fatigue, and form over weeks/months
- Uses Training Load (power-based) and/or Relative Effort (HR-based)

### Heart Rate Analysis
- **Heart rate zones** (Zone 1-5, auto-calculated from max HR or manually set)
- **Zone distribution** per activity
- **Max HR setting** (default: 220 minus age, or manually entered)
- **Resting HR tracking**

### Power Analysis (Cycling)
- **Power Zones** based on FTP (Functional Threshold Power)
- **Weighted Average Power**
- **Intensity score**
- **Training Load** = f(Weighted Avg Power, FTP, Intensity)
- **Power Curve** -- best power outputs across different time durations
- **FTP estimation**

### Workout Analysis (Subscribers)
- **Splits analysis** with color-coded pacing visualization
- Darker colors = faster, lighter = slower
- Interval consistency evaluation
- Pace progression analysis

### Progress Comparison (Subscribers)
- Side-by-side comparison mode in progress summary charts
- Compare recent activities against past training periods
- Performance trend identification

### Matched Activities (Subscribers)
- Auto-detects when you complete the same route multiple times
- Groups all efforts into a single performance trend chart
- Matches based on start/end points, direction, and distance
- Available for runs, rides, walks, hikes, and several other types

### Athlete Intelligence (Subscribers, AI-Powered)
- **Post-workout AI summary** generated immediately after upload
- **Trend analysis** over 30-day rolling window
- **Performance breakdown** by pace zones, HR zones
- **Achievement recognition** (auto-detects PRs, milestones)
- Insights across: pace, heart rate, elevation, power, Relative Effort, segments
- Includes virtual run/ride data
- Available in 14 languages
- Mobile-only

---

## 8. Module 6: Routes & Exploration

### Route Builder (Subscribers)
- **Web-based route builder** with point-and-click interface
- **Mobile route builder** with redesigned interface (draw a line/circle, Strava matches to roads/trails)
- **AI-powered route suggestions** leveraging Global Heatmap data
- **Point-to-point routing** -- drop pins for A-to-B route generation (activity-specific)
- **Sport-type-specific routing** (road cycling vs. trail running vs. gravel, etc.)
- **Elevation profile** preview of planned route
- **Surface type** information
- **Turn-by-turn directions**

### Saved Routes
- Search by keyword
- Filter by sport type, distance, elevation, route owner, surface type
- Organize personal route library

### Tappable Points of Interest (Subscribers)
- Tap POIs on map (cafes, restrooms, viewpoints, water fountains)
- View distance, elevation, estimated arrival time
- See community photos of the location
- Generate route directly to a POI

### Global Heatmap
- Aggregated visualization of all public activities from last 13 months
- Heat intensity = frequency of use
- Available to all users; subscribers can zoom in for finer detail
- **Night Heatmap** variant showing only activities between sundown and sunrise
- Useful for finding popular/safe routes and discovering new areas

### Personal Heatmap
- Visualization of your own activity history on a map
- Shows everywhere you have been active

### Route Navigation
- Turn-by-turn navigation on mobile
- Apple Watch route navigation and maps
- Offline maps (subscribers)
- Off-course alerts

### Local Guides (Web)
- Regional hiking/running route content organized by geography
- Curated recommendations

---

## 9. Module 7: Segments & Leaderboards

### Segments
- **User-created** portions of roads or trails
- Automatically matched when GPS track overlaps a segment
- Each segment has its own **detail page** with map, profile, and leaderboards

### Leaderboard Types
- **Overall** (all time, all athletes)
- **This Year**
- **By Gender** (Men / Women)
- **By Age Group** (subscribers)
- **By Weight** (subscribers)
- **By Time Period** (subscribers -- filter by date range)
- **Followers Only** (subscribers)
- **Club members** (subscribers)
- **Your Efforts** (personal history on that segment)

### Crowns & Titles
- **CR (Course Record)** -- fastest time ever, regardless of gender
- **KOM (King of the Mountain)** -- fastest male time
- **QOM (Queen of the Mountain)** -- fastest female time
- **PR medals** -- gold, silver, bronze for your personal top 3 times

### Local Legend
- Awarded to the athlete who completes a segment the most in a rolling 90-day period
- **Speed-independent** -- rewards consistency/frequency, not pace
- Displays a laurel crown icon on segment and activity pages
- Available on run, ride, walk, hike, ski, and snowboard segments
- Only public activities count

### Live Segments
- Real-time segment performance during recording
- Compare live against your PR and current KOM/QOM/CR
- Available on mobile app and compatible devices (Garmin, Wahoo, etc.)
- Strava recently doubled the number of available popular live segments
- Subscribers get additional comparison metrics and screens

### Segment Explore
- Search and discover segments by location
- Filter by activity type
- View segment leaderboards without having attempted them

### Fair Leaderboards (Integrity)
- ML model analyzing 57 different factors
- Detects vehicle usage, GPS errors, e-bike misclassification
- Reprocessed top 100 positions across all ride leaderboards
- Removed 3.9M+ flagged activities (4.45M as of May 2025)
- Prevents bikes on run leaderboards, e-bikes on ride leaderboards

---

## 10. Module 8: Social & Community

### Following System
- **Follow athletes** to see their activities in your feed
- **Followers** see your activities (subject to privacy settings)
- **Find Friends** via contacts, Facebook, or search
- **Suggested Athletes** to follow

### Kudos
- Quick thumbs-up on any activity, achievement, post, badge
- Visible as a list on the activity
- **Kudos Bomb** -- shake phone to give kudos to everyone in a group activity
- Reciprocity-driven ("You get more kudos when you give more")

### Comments
- Text comments on activities
- Threaded replies
- Emoji reactions
- @mentions

### Group Activities
- Tag multiple athletes on a single activity
- "Who was with you?" feature to add participants
- Grouped activities linked together in feed

### Flybys
- Replay any activity and see athletes who were nearby at the same time
- Minute-by-minute playback on a map
- See where you crossed paths with others
- Useful for races and group meetups
- Privacy-controlled (opt-in/opt-out)

### Athlete Search
- Find other athletes by name
- Browse mutual connections

---

## 11. Module 9: Clubs

### Club Types
- **Company/brand clubs** (official)
- **Community clubs** (user-created)
- Open, invite-only, or approval-required membership

### Club Features
- **Club feed** with member activities
- **Club posts** (text/photo posts from admins or members)
- **Club leaderboards** (weekly, monthly stats among members)
- **Club challenges** (subscribers can create custom challenges for club members)
- **Club events** with types: Social, Workout, Competition
- **Pace groups** within events (up to 4)
- **Club page** with logo, cover photo, description, website link
- **Discussion/messaging** within club
- **Member list** with role designations

### Club Events
- Event creation with essential details (time, distance, place, route)
- Event types: Social, Workout, Competition
- RSVP functionality
- Route attachment
- Pace group specification
- Post-event activity linking

---

## 12. Module 10: Challenges & Gamification

### Challenges
- **Time-bound goals** (typically weekly or monthly)
- **Types:** Distance, elevation, activity count, time-based
- **Sponsored challenges** by brands (Nike, Adidas, etc.) with rewards
- **Community challenges** (large-scale, open to all)
- **Club challenges** (subscribers can create for their club)
- **Custom challenges with friends** (subscribers)
- Completion earns a **digital badge**
- Some unlock **exclusive discounts/promotions** from sponsors

### Trophy Case
- **Dedicated page** displaying all completed challenge badges
- Ordered by completion date
- Four most recent badges visible on public profile
- Persistent record of all achievements

### Achievement System
- **Segment achievements:** KOM/QOM/CR crowns, Local Legend laurels, PR medals (gold/silver/bronze)
- **Milestone badges:** Distance milestones (1 mi, 5K, 10K, half marathon, marathon, etc.), activity count milestones
- **Best Effort achievements:** New personal bests at standard distances
- **Year milestones:** Total distance, total time, total elevation for the year

### Personal Records & Medals
- **Segment PR medals:** Gold (1st), Silver (2nd), Bronze (3rd) for your best times
- **Best Efforts:** Auto-detected personal bests at standard race distances
- Visible on activity detail and profile

### Streaks (Informal)
- Consecutive days/weeks of activity
- No official badge system, but tracked implicitly
- The "fear of breaking a streak" is a known engagement driver

### Year in Sport
- Annual personalized recap (December-January)
- Shareable highlight reel
- Stats, achievements, social moments from the year
- Functions as a major annual gamification event

### Progress Bars
- Visual indicators showing proximity to goals
- Weekly, monthly, annual progress tracking
- Reinforces continuous improvement

---

## 13. Module 11: Maps & Visualization

### Map Types (Activity Maps)
Subscribers have access to additional map styles:

| Map Type | Description |
|----------|-------------|
| **Standard** | Clean road/trail map |
| **Satellite** | Aerial/satellite imagery |
| **3D Terrain** | Realistic terrain with elevation (powered by FATMAP/MRE) |
| **Pace/Speed** | Polyline colored by pace or speed |
| **Heart Rate** | Polyline colored by HR zone |
| **Elevation** | Polyline colored by altitude |
| **Gradient** | Polyline colored by grade/slope |
| **Power** | Polyline colored by power output |
| **Time** | Polyline colored by time progression |
| **Surface Type** | Shows road vs. trail vs. gravel |
| **Temperature** | Polyline colored by temperature data |

### 3D Map Engine
- Proprietary Map Rendering Engine (MRE) integrating FATMAP technology
- Realistic 3D terrain visualization
- Default for trail sports (hikes, trail runs, MTB, gravel)
- Informative terrain layers

### Flyover (Subscribers)
- **3D animated video** following your activity route from aerial perspective
- Signature orange polyline in motion
- **Stats overlay:** pace/speed, elevation, distance in real-time
- Toggle stats on/off
- **Share directly** to Instagram Stories or via shareable link
- Push notification when video generation completes
- Works on any GPS-based activity (past and present)

### Global Heatmap
- All public activities aggregated
- Night Heatmap variant
- Zoom levels gated by subscription

### Personal Heatmap
- Your own activity history visualized geographically

### Dark Mode
- Full app dark mode (light text on dark background)
- Reduces eyestrain in low-light conditions

---

## 14. Module 12: Gear Management

### Shoes
- Add multiple pairs of shoes
- Track mileage per shoe
- Set **default shoe by sport type** (Run, Trail Run, Walk, Virtual Run, Hike)
- **Retire** shoes (keeps in history but no longer assignable)
- Delete shoes

### Bikes
- Add multiple bikes
- Track mileage per bike
- Set **default bike by sport type** (Ride, MTB, Gravel, E-Bike, E-MTB, Virtual Ride, Handcycle, Velomobile)
- **Component tracking** (web only): Track individual parts (chain, tires, cassette, etc.) with mileage
- Retire or delete bikes

### Automatic Gear Assignment
- Auto-assigns default gear based on sport type of activity
- Overridable on individual activities

---

## 15. Module 13: Sharing & Content Creation

### Activity Sharing
- **Direct link** sharing
- **Social media** sharing (Facebook, Twitter/X, Instagram)
- **Instagram Stories** integration with Stats Stickers
- **Flyover video** sharing to Instagram Stories or via link

### Stats Stickers (Instagram Stories)
- Overlay activity stats (distance, time, pace, map) on any personal photo
- Movable, resizable, rotatable sticker
- Auto-generated when sharing to Instagram Stories from Strava

### Flyover Sharing
- Share 3D replay video directly to Instagram Stories
- Generate shareable link for any platform
- Stats overlay included

### Photo Attachments
- Add photos to activities
- Photos geotagged to map locations
- Visible in activity detail and feed

### Embeddable Widgets
- Strava activity embeds for websites/blogs
- Club widgets for external sites

---

## 16. Module 14: Notifications

### Notification Channels
1. **Push Notifications** (mobile, configurable per type)
2. **Email Notifications** (configurable from website settings)
3. **In-App (Pull) Notifications** (bell icon, always on, cannot be fully disabled)

### Notification Types
- Kudos received on your activity
- Comments on your activity
- New follower
- Friend completed an activity
- Challenge progress/completion
- Goal progress/completion
- KOM/QOM/CR lost
- Local Legend status changes
- Club posts and events
- Flyover video ready
- Motivational messages from Strava
- Weekly/monthly summaries
- Segment PR achievements

---

## 17. Module 15: Settings & Privacy

### Account Settings
- **My Account:** Email, password, login methods, subscription status
- **My Performance:** Max heart rate, heart rate zones, FTP, weight, lactate threshold
- **Display Preferences:** Units (imperial/metric), feed ordering, default sport type
- **Email Notifications:** Toggle individual email types on/off
- **Push Notifications:** Toggle individual push types on/off

### Privacy Controls
- **Profile Privacy:** "Everyone" or "Followers" visibility for profile details
- **Activity Privacy (default):** "Everyone," "Followers," or "Only You"
- **Activity Privacy (per-activity):** Override default on individual activities
- **Map Visibility:** Hide all map data, or hide start/end points
- **Privacy Zone:** Set address-based zones where GPS data is hidden
- **Flyby opt-in/opt-out**
- **Enhanced Privacy Mode** (opt-out of various data uses)
- **Group Activity tagging controls**

### Data Management
- **Download your data** (full profile, activities, photos, social contributions)
- **Delete account**
- **Connected apps management** (authorize/revoke third-party access)
- **Cookie consent** management

---

## 18. Module 16: Integrations & API

### Device Integrations
- **GPS watches:** Garmin, Apple Watch, Coros, Polar, Suunto, Amazfit, Samsung Galaxy Watch
- **Cycling computers:** Garmin Edge, Wahoo ELEMNT, Hammerhead Karoo
- **Smart trainers:** Wahoo KICKR, Zwift, TrainerRoad, Peloton
- **Heart rate monitors:** Chest straps, optical HR (via devices)
- **Power meters:** All major brands (via cycling computers)

### App Integrations
- **Apple Health** (bi-directional sync, including Apple Fitness+ workouts)
- **Google Fit**
- **Peloton**
- **Zwift**
- **TrainerRoad**
- **Relive** (3D video -- though Strava now has native Flyover)
- **Slopes** (ski/snowboard tracking)
- **Komoot** (routes)
- Hundreds of third-party apps via API

### Strava API
- REST API for developers
- OAuth 2.0 authentication
- Activity data, athlete data, segment data, club data
- **Recent restrictions:** Third-party apps cannot display activity data to other users (only to the activity owner)
- **AI prohibition:** Third parties prohibited from using Strava API data in AI models
- Webhook subscriptions for real-time activity notifications
- Rate limited

### Partner Integrations
- **Strava Metro:** Aggregated, de-identified data for city planners and transportation departments
- **Brand partnerships** for sponsored challenges
- **Business Partner Center** for commercial integrations

---

## 19. Module 17: Subscription & Monetization

### Pricing Tiers (as of 2026)

| Tier | Price | Billing |
|------|-------|---------|
| **Free** | $0 | -- |
| **Individual (Annual)** | $6.67/mo | $79.99/year |
| **Individual (Monthly)** | ~$11.99/mo | Monthly |
| **Family Plan** | $2.92/mo per person (4 members) | $139.99/year |
| **Student** | $3.33/mo | $39.99/year (50% off) |
| **Strava + Runna Bundle** | $12.50/mo | $149.99/year |

### Discount Programs (US only)
- Teachers: 25% off
- Military: 25% off
- Medical professionals: 25% off

### Other Monetization
- **Gift subscriptions**
- **Sponsored challenges** (brand-funded, with user rewards/discounts)
- **Strava Metro** (B2B data product)
- **Partner API** (business integrations)

### 30-Day Free Trial
- Available for annual individual and student plans

---

## 20. Core User Experience Loops

### Loop 1: Record -> Review -> Share (Primary)
```
Record Activity (GPS/device)
  -> Auto-upload & processing
    -> View activity detail (stats, map, segments, AI insights)
      -> Share to feed / Instagram / social
        -> Receive Kudos & Comments
          -> Motivation to record again
```

### Loop 2: Compete -> Improve -> Compete (Segments)
```
Attempt a Segment
  -> See leaderboard ranking
    -> Identify gap to PR / KOM / QOM
      -> Train to improve
        -> Re-attempt segment
          -> Check new ranking
```

### Loop 3: Set Goal -> Track Progress -> Achieve (Goals)
```
Set weekly/monthly/annual goal
  -> Record activities
    -> See progress bar fill
      -> Receive completion notification
        -> Set new goal
```

### Loop 4: Join Challenge -> Participate -> Earn Badge (Challenges)
```
Browse/join challenge
  -> Record qualifying activities
    -> Track challenge progress
      -> Complete challenge
        -> Earn badge in Trophy Case
          -> Unlock discount/reward
```

### Loop 5: Follow -> Observe -> Engage (Social)
```
Follow athletes / join clubs
  -> See their activities in feed
    -> Give Kudos / comment
      -> Receive Kudos / comments back
        -> Deepen connections
          -> Join group activities / events
```

### Loop 6: Explore -> Discover -> Adventure (Routes)
```
Browse heatmap / route suggestions
  -> Find interesting route
    -> Save route
      -> Follow route with navigation
        -> Record and share the adventure
          -> Route gets added to heatmap
```

### Loop 7: Analyze -> Adapt -> Progress (Training)
```
Complete workout
  -> Review Athlete Intelligence insights
    -> Check Fitness & Freshness trends
      -> Identify areas to improve
        -> Adjust training
          -> Track progress over time
```

---

## 21. Free vs. Paid Feature Matrix

### Free Features
- Activity recording via GPS
- Activity upload (all methods)
- Basic activity detail (map, stats, splits)
- Activity feed with Kudos and comments
- Follow athletes
- Join clubs
- Join challenges
- Basic segment matching (see your time, overall leaderboard)
- Personal Records (PRs)
- Best Efforts detection
- Beacon safety (live location sharing)
- Basic Global Heatmap (limited zoom)
- Personal Heatmap
- Gear tracking (shoes and bikes)
- Basic profile and stats
- Flybys
- Photo uploads
- Manual activity entry
- Basic notifications
- Year in Sport (requires subscription as of 2025)

### Subscriber-Only Features
- **Athlete Intelligence** (AI workout insights)
- **Flyover** (3D activity replay video)
- **Training Log** (advanced calendar view)
- **Fitness & Freshness / Fitness Score**
- **Relative Effort** (full access)
- **Progress Comparison** (side-by-side training period comparison)
- **Matched Activities**
- **Workout Analysis** (advanced splits with color coding)
- **Power Curve**
- **Goals** (weekly, monthly, annual, segment, power)
- **Route Builder** (full access with AI-powered suggestions)
- **Point-to-Point Routing**
- **Tappable Points of Interest**
- **Saved Routes** filtering and search
- **Offline Maps**
- **Route Navigation** on Apple Watch
- **Segment Leaderboard Filters** (age, weight, date range, followers, clubs)
- **Live Segments** (additional comparison metrics)
- **Custom Map Types** (pace, HR, power, gradient, temperature, etc.)
- **3D Terrain Maps** (full FATMAP integration)
- **Global Heatmap** (full zoom levels)
- **Night Heatmap**
- **Club Challenges** (create custom)
- **Custom Challenges with Friends**
- **Stats Stickers** for Instagram Stories
- **Flyover Sharing** to Instagram/links
- **Year in Sport** personalized recap
- **Dark Mode** (available to all as of late 2024)

---

## 22. Supported Activity Types

### Core Sports (Full Feature Support)
- **Ride** (Road Cycling)
- **Run**
- **Swim**

### Extended Cycling Types
- E-Bike Ride
- Mountain Bike Ride (MTB)
- Gravel Ride
- E-Mountain Bike Ride (E-MTB)
- Virtual Ride
- Handcycle
- Velomobile

### Extended Running Types
- Trail Run
- Virtual Run

### Water Sports
- Swim (Pool / Open Water)
- Surf
- Windsurf
- Kitesurf
- Stand Up Paddle (SUP)
- Kayak
- Canoe
- Row
- Virtual Row
- Sail

### Winter Sports
- Alpine Ski (Downhill)
- Backcountry Ski
- Nordic Ski (Cross-Country)
- Snowboard
- Snowshoe
- Ice Skate

**Winter-Specific Features:**
- Auto chairlift time removal for ski/snowboard
- Downhill metrics: number of runs, total downhill distance, average downhill speed
- Real-time run tracking for downhill sports

### Wheeled / Rolling Sports
- Inline Skate
- Roller Ski
- Skateboard

### Walking / Hiking
- Walk
- Hike
- Wheelchair

### Racquet Sports
- Tennis
- Badminton
- Pickleball
- Table Tennis
- Squash
- Racquetball

### Fitness / Gym
- Weight Training
- Yoga
- Pilates
- Crossfit
- HIIT
- Elliptical
- Stair Stepper
- Workout (generic)

### Other
- Golf
- Rock Climb
- Football (Soccer)

**Note:** Full analytics features (segments, leaderboards, advanced stats) are primarily available for the three core sport types (ride, run, swim). Other sport types can be recorded and tracked but may have limited feature support.

---

## Key Takeaways for Action Sports Platform Mapping

### What Strava Does Exceptionally Well
1. **Segment gamification** -- turning any stretch of road/trail into a persistent competition
2. **Social proof through activity sharing** -- the feed creates accountability and motivation
3. **Layered analytics** -- from simple stats (free) to AI insights (paid), meeting users at every level
4. **Heatmap as exploration tool** -- crowd-sourced route discovery
5. **Cross-platform sync** -- works with virtually every GPS device and fitness app
6. **Sponsored challenges** -- monetization that feels like a feature, not an ad
7. **Year in Sport** -- viral annual recap that drives engagement and social sharing

### Gaps Relevant to Action Sports
1. **Limited action sports depth** -- Surf, Ski, Snowboard, Skateboard are supported but lack sport-specific analytics
2. **No video/media-first experience** -- Strava is data/stats first; action sports are often visual/video-driven
3. **No trick/skill tracking** -- No way to log specific tricks, skills, or qualitative session details
4. **No spot/break/park database** -- No equivalent of a surf break guide or skatepark directory
5. **No conditions/forecast integration** -- No surf forecast, snow report, or wind data
6. **No equipment beyond shoes/bikes** -- No surfboard, snowboard, skateboard quiver management
7. **No session rating/journaling** -- Limited qualitative feedback beyond Perceived Exertion
8. **Community is athlete-follow-based, not location-based** -- No "who's at this spot right now" feature
