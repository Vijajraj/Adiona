# Chennai Safety Map — Project Specification

## 1. Overview

A no-login, web-based crowdsourced safety mapping platform scoped to Chennai (expandable to Tamil Nadu later). Residents click a location on the map and report it as safe or unsafe, tagging the specific problem (poor lighting, harassment, isolated area, no CCTV, etc.). Reports are aggregated into a heatmap. The platform is gender-neutral by design — it maps infrastructure and safety problems that affect everyone, while still allowing reporters to tag who was affected for later analysis.

**Positioning statement**: A hyperlocal, zero-friction, open safety-reporting tool for Chennai — closest existing comparison is Safecity (no-login, India-wide, harassment-focused); this project differentiates via infrastructure-focused categories, strict Chennai/TN geo-scoping, and gender-neutral framing.

## 2. Goals

- Primary: produce a usable, credible safety heatmap for Chennai city, seeded with real data before a city-wide day-one launch (see §5, §13).
- Secondary: portfolio-quality demonstration of geospatial engineering, anonymous-abuse-resistant system design, and civic-tech product thinking.
- Non-goal (v1): national scale, real-time SOS/panic button, law-enforcement integration.

## 3. Constraints

- **No login / no accounts.** Anonymity by design.
- **Free tier only, no ToS-violating workarounds.** No paid APIs, no credit card commitments, no automated key-rotation or account-cycling schemes to bypass free-tier quotas (evaluated and rejected for Mappls — see §7).
- **Geo-scoped to Chennai city** (full city, bounding box configurable to expand to Tamil Nadu later without code changes).
- **No WhatsApp-based reporting** — web-only reporting flow for v1.

## 4. Scope

### 4.1 Core (MVP)
- Interactive map of Chennai (MapLibre GL JS + OpenFreeMap vector tiles), bounded to Chennai's geographic extent.
- Click-to-pin reporting flow: select location → choose safe/unsafe → choose category → optional note → submit.
- Categories are split into two distinct lists (kept separate, not merged):

  **General safety** (affects everyone)
  - Poor / no lighting
  - Isolated / deserted area
  - No CCTV coverage
  - Stray animal risk
  - Robbery / theft-prone
  - Unsafe road / no footpath
  - Other (free text)

  **Women safety** (kept distinct)
  - Catcalling / verbal harassment
  - Stalking
  - Physical harassment / groping
  - Unsafe public transport stop
  - Other (free text)

- "Affected group" tag on report (woman / man / elderly / child / general) is **user-controlled**: a visible toggle in the report form lets the reporter choose whether to attach this tag at all. Default state is hidden/optional — reporters opt in rather than opt out. Used for later filtering only, never for restricting who can report.
- Heatmap layer rendering aggregated report density and severity.
- Anonymous device identification via a locally generated UUID (no personal data), used for rate limiting only.
- Backend validation: reject any report outside the Chennai bounding box.
- Rate limiting: max **5 reports per device per day**, plus 1 report per device per grid cell per cooldown period (prevents single-spot spam within the daily allowance).
- Grid-snapping: exact click coordinates are snapped to a ~100m grid cell before storage (privacy + anti-spam).

### 4.2 Good-to-have (v1.x)
- Time-of-day filter on heatmap (reports bucketed by time reported; a spot can look different by day vs night).
- Category filter on heatmap.
- "Confirm this report" flow — clicking near an existing pin prompts the user to confirm rather than create a duplicate; heatmap weight increases with confirmations.
- Time-decay weighting — older unconfirmed reports contribute less to heatmap intensity over time.
- Map style toggle (light/dark) via OpenFreeMap style swapping.

### 4.3 Stretch (v2+)
- Safe-route suggestion between two points using OSRM (self-hosted, free), penalizing routes through high-density unsafe grid cells.
- Correlation with TNeGA street-light-failure IoT data (if accessible) against user-reported lighting complaints.
- Severity/credibility scoring model (weighted by recency, confirmations, category) using a lightweight ML model (e.g. XGBoost) instead of raw counts.
- Read-only aggregated dashboard for institutional stakeholders (e.g. college administration) — top unsafe zones by category, without exposing individual report-level detail.

## 5. Launch Scope Recommendation

**Decision: promote city-wide from day one** — the full Chennai bounding box is live and publicly promoted at launch, not phased. This raises the cold-start bar (see §2/§13), so seeding is non-negotiable before public promotion:
1. Seed the map with real known problem spots (TN open data + manually logged spots — see §13) before the public promotion push, so first-time visitors don't land on an empty map.
2. Promote city-wide (college networks, social channels, local press/community groups if possible) once seed data is in place.
3. Monitor report density post-launch — if certain zones remain sparse, target manual seeding or local outreach there specifically rather than waiting for organic reports alone.

## 6. Architecture

```
frontend/
  src/
    components/
      MapView.jsx         # MapLibre GL map, bounded to Chennai
      ReportModal.jsx      # click-to-pin form: category, safe/unsafe, note, affected group
      HeatmapLayer.jsx      # heatmap layer fed by /reports/heatmap
      FilterBar.jsx          # category + time-of-day filters
      ConfirmPrompt.jsx       # "confirm existing report" flow
    hooks/
      useDeviceId.js          # generates/reads anonymous UUID from localStorage
    utils/
      bounds.js                # Chennai bounding box constant

backend/
  app/
    models.py               # Report (SQLAlchemy)
    schemas.py                # Pydantic request/response models
    routers/
      reports.py               # POST /reports, GET /reports/heatmap
    services/
      geo_validator.py          # checks lat/lng within Chennai bounds
      rate_limiter.py            # slowapi config
      grid_snap.py                # snaps exact coords to ~100m grid cell
      decay.py                     # time-decay weighting logic
    db.py                          # Neon PostgreSQL + PostGIS connection
```

## 7. Tech Stack (all free-tier)

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | Vite + React | Confirmed — .jsx components, lucide-react icons |
| Map rendering | MapLibre GL JS | Open-source Mapbox GL fork, works with vector tiles |
| Map tiles | OpenFreeMap | Free, no API key, no rate limits, self-hostable if needed |
| Frontend hosting | Vercel (free tier) | |
| Backend | FastAPI | |
| Backend hosting | Render (free tier) | Note: cold start ~30-50s after idle — document this in README |
| Database | Neon PostgreSQL + PostGIS | Free tier: 0.5GB storage — sufficient for this scale |
| Rate limiting | slowapi | |
| Device fingerprinting | Client-generated UUID (localStorage) | No third-party fingerprinting service needed |
| Icons | lucide-react | Used for category icons and UI elements |
| Routing (stretch) | OSRM (self-hosted) | Only if safe-route feature is built |

**Evaluated and rejected**: Mappls (MapmyIndia) — considered for potentially better India-specific map data, but rejected. Its free tier is limited and commercially rate-capped; an automated key-rotation scheme to bypass those limits was considered and explicitly rejected as a ToS violation and a reliability risk (providers detect and block this pattern, which could take the map down in production with no warning). OpenFreeMap has no rate limit and no key requirement, making it strictly better for this project's constraints.

## 8. Data Model (draft)

**Report**
| Field | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| grid_lat | float | snapped to ~100m grid |
| grid_lng | float | snapped to ~100m grid |
| status | enum | "safe" \| "unsafe" |
| category | enum | see §4.1 category list. "Other" is distinguished per list: `other_general` vs `other_women` |
| affected_group | enum, nullable | woman / man / elderly / child / general |
| note | text, nullable | free-text, **max 240 characters**. Also stores the free-text explanation when category is "Other". |
| device_id | UUID | anonymous, used for rate limiting only — never exposed via API |
| confirmations | int | default 0, incremented via confirm flow |
| is_flagged | bool | default false, set by profanity filter — flagged reports stored for later review (admin panel deferred to v1.x) |
| created_at | timestamp | |

**Heatmap weight**: MVP weight = report count per grid cell + confirmations. Severity weighting by category will be defined later based on real data and manual input (see §4.3 stretch goals).

## 9. API Contract (draft)

```
POST /reports
  body: { lat, lng, status, category, affected_group?, note?, device_id }
  → validate Chennai bounds → rate-limit check → grid-snap → insert
  response: { id, grid_lat, grid_lng, created_at }

POST /reports/{id}/confirm
  body: { device_id }
  → rate-limit check (1 confirm per device per report) → increment confirmations

GET /reports/heatmap?category=&hours_back=&affected_group=
  response: [{ lat, lng, weight }]
```

## 10. Anti-Abuse Design

- No personal data collected at any point — device_id is a random UUID, not tied to identity.
- Rate limiting by device_id (primary) and IP (secondary backup layer) — 5 reports/device/day, **7 reports/IP/day**.
- One report per device per grid cell per **24-hour cooldown window** (prevents spam-stuffing a single location).
- Backend-side geo bounds validation (frontend `maxBounds` is UX only, not a security boundary).
- Confirm-instead-of-duplicate flow reduces incentive and impact of spam pins. **Proximity threshold: same grid cell** — if a report already exists at the snapped `(grid_lat, grid_lng)`, the user gets a confirm prompt instead of creating a duplicate.
- **Profanity filter** applied to the free-text `note` field before storage, using **alt-profanity-check** (ML classifier, not a hardcoded wordlist). Reports flagged as likely-profane are **not auto-rejected** — they are stored with an `is_flagged` boolean for later review. **Admin/moderation panel is deferred to v1.x** — MVP stores flagged reports but does not expose a review UI. Hard-reject is reserved for clearly spam submissions (no coherent content). Applies to both category lists.

## 11. Decisions Log (locked)

- [x] Bounding box: Chennai city (full) — see §11a for exact coordinates.
- [x] Grid cell size: 100m.
- [x] Rate limit: 5 reports/device/day, **7 reports/IP/day**, plus per-grid-cell cooldown of **24 hours**.
- [x] Affected-group tag: user-controlled toggle, hidden/optional by default.
- [x] Categories: two separate lists — general safety and women safety. **"Other" distinguished as `other_general` / `other_women`**.
- [x] Icons: lucide-react.
- [x] Map provider: OpenFreeMap + MapLibre GL JS (Mappls evaluated and rejected — see §7).
- [x] **Frontend framework: Vite + React.**
- [x] Moderation: profanity/keyword filter on note field. **Admin/moderation panel deferred to v1.x** — MVP stores `is_flagged` boolean only.
- [x] Privacy: device_id + grid-snapped location stored, disclosed in-app.
- [x] Launch strategy: promote city-wide from day one (full Chennai bounding box, no phased rollout).
- [x] Profanity filter library: **alt-profanity-check** (ML-based classifier, not a wordlist — better suited to reports that may legitimately describe harassment language; flag-for-review rather than hard-reject, see §10).
- [x] **Note max length: 240 characters.** Also used for "Other" category free-text explanation.
- [x] **Confirm-flow proximity: same grid cell** (matching snapped `grid_lat`/`grid_lng`).
- [x] **Heatmap weight (MVP): report count + confirmations.** Severity weighting deferred to v2+ (data-driven).

### 11a. Chennai Bounding Box (source: OSM Nominatim)

| Value | Coordinate |
|---|---|
| South latitude (minlat) | 12.9205289 |
| North latitude (maxlat) | 13.2405289 |
| West longitude (minlon) | 80.1070369 |
| East longitude (maxlon) | 80.4270369 |

Usage formats:
- Nominatim array: `["12.9205289", "13.2405289", "80.1070369", "80.4270369"]`
- Overpass / Leaflet `s,w,n,e`: `12.9205, 80.1070, 13.2405, 80.4270`
- Standard `minlon, minlat, maxlon, maxlat` (used by most bounding-box libraries, incl. MapLibre `maxBounds`): `80.1070, 12.9205, 80.4270, 13.2405`

```js
// frontend/src/utils/bounds.js
export const CHENNAI_BOUNDS = [
  [80.1070369, 12.9205289], // southwest
  [80.4270369, 13.2405289], // northeast
];
```

```python
# backend/app/services/geo_validator.py — reference values
CHENNAI_MIN_LAT = 12.9205289
CHENNAI_MAX_LAT = 13.2405289
CHENNAI_MIN_LON = 80.1070369
CHENNAI_MAX_LON = 80.4270369
```

### Still open
- [ ] None — all launch-blocking decisions are locked. Remaining work is implementation.

## 12. Privacy Disclosure

Even though the platform is anonymous and login-free, `device_id` and location data (grid-snapped, not exact) are stored. A short, visible in-app notice must explain: what is stored (anonymized device identifier, grid-snapped location, report content), what is not stored (no names, no exact addresses, no precise GPS beyond the 100m grid), and why (abuse prevention only). This notice should be reachable from the report form itself, not buried in a separate policy page only.

## 13. Seed Data Sources (Chennai launch)

To avoid launching with an empty map:
- **TN crime data** (2022/2023, district and city-level, via data.opencity.in mirroring data.gov.in) — usable as reference/cross-check data for the general-safety category, particularly robbery/theft-prone tagging.
- **Street light datasets** published per-city on the TN Open Government Data Portal (tn.data.gov.in) — check for a Chennai-specific dataset directly on the portal (it was under maintenance at time of writing; retry rather than relying solely on third-party mirrors).
- **Road accident data** (annual, district-wise) — usable for the unsafe road / no footpath category.
- **Manual seeding** — known problem spots logged directly by the founding team/community before public launch, to supplement gaps in government data.
