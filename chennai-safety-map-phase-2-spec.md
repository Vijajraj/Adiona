# Chennai Safety Map — Phase 2 Specification

Companion to `chennai-safety-map-spec.md` (MVP / Phase 1) and
`chennai-safety-map-ops-spec.md` (deployment, maintenance, expansion).
Phase 1 defines what the product is. Phase 2 defines what it becomes once the
core loop (report -> map -> someone finds it useful) is proven live.

---

## 1. Purpose

Phase 1 delivers a working no-login, crowdsourced safety map for Chennai.
Phase 2 turns it from "a map of reports" into "a tool people use to make
decisions and institutions use to act", while keeping every Phase 1 constraint.

**Phase 2 goals**
1. Make the data more trustworthy (credibility, decay, manipulation resistance).
2. Make the map more useful on the ground (safe-route, time-of-day, Tamil UI, nearby help).
3. Create real-world impact (institutional dashboard, open data export).
4. Prove the data is real (ground-truth validation).

**Non-goals (unchanged from Phase 1)**
- No login or user accounts for reporters.
- No paid services, no credit-card-required tiers, no ToS workarounds
  (e.g. key rotation to bypass quotas).
- No WhatsApp reporting.
- No Mappls/Google Maps dependency; OpenFreeMap + MapLibre stays.
- No expansion beyond Chennai until Phase 2 exit criteria are met.

---

## 2. Entry Criteria (do not start Phase 2 until all are true)

- [ ] Map renders seed data and live reports reliably on the deployed site
      (clusters/markers visible, new reports appear after submit).
- [ ] Style toggle (light/dark) does not wipe report layers.
- [ ] Phase A (security) and Phase B (privacy) tests pass on staging and prod.
- [ ] IP-based secondary rate limit confirmed working (not only documented).
- [ ] Moderation queue is reachable and checked on a schedule.
- [ ] Monitoring live (uptime + error tracking) and weekly DB backup running.
- [ ] At least 4 weeks of real usage data collected, so Phase 2 decisions are
      driven by data, not guesses.

If any box is unchecked, fix it first. Phase 2 features built on a map that
sometimes shows nothing will inherit that bug.

---

## 3. Scope

Priority tiers: **P0** build first, **P1** build next, **P2** only if time allows.

| # | Feature | Tier | Needs usage data first? |
|---|---|---|---|
| 3.1 | Data credibility and anti-manipulation | P0 | Yes |
| 3.2 | Time-of-day and recency views | P0 | Yes |
| 3.3 | Tamil language UI | P0 | No |
| 3.4 | Mobile / PWA polish | P1 | No |
| 3.5 | Institutional dashboard (read-only) | P1 | Yes |
| 3.6 | Open data export | P1 | Yes |
| 3.7 | Safe-route suggestion | P1 (spike first) | Yes |
| 3.8 | Heatmap view toggle (cluster vs density) | P2 | No |
| 3.9 | Ground-truth validation program | P0 (process, not code) | Yes |
| 3.10 | Nearby help layer (OpenStreetMap) | P1 | No |

---

### 3.1 Data credibility and anti-manipulation (P0)

**Problem.** Raw report counts can be gamed: one person reporting adjacent grid
cells over several days, or flooding "safe" reports to drown real "unsafe" ones.
Old reports (e.g. a lighting problem since fixed) mislead.

**Requirements**
- Weight reports by **unique confirming devices**, not raw row count.
- Apply **time decay** to weight (half-life configurable; start at 90 days for
  infrastructure categories, 30 days for incident-type categories).
- Seed-data rows are tagged `is_seed = true`; they decay slower and display a
  "Historical / sourced" label with the `source_url`.
- Flag clusters of reports from one device or one IP across adjacent grid
  cells within a short window; down-weight them and surface in the moderation
  queue.
- Computed score stored per grid cell (`cell_scores` table) and refreshed on a
  schedule, not recomputed on every map load.

**Data model additions**
```
cell_scores
  grid_lat, grid_lng        (PK together)
  score_unsafe  float
  score_safe    float
  unique_devices int
  last_report_at timestamp
  updated_at    timestamp

report_flags
  report_id, reason, created_at, reviewed boolean
```

**API**
```
GET /reports/heatmap   -> unchanged shape, but weight now comes from cell_scores
```

**Acceptance criteria**
- Test: one device reporting 10 adjacent cells produces less map weight than
  10 distinct devices reporting 10 cells.
- Test: a 12-month-old unconfirmed report weighs measurably less than a
  yesterday report (assert the ratio).
- Heatmap endpoint p95 latency does not regress vs Phase 1.

---

### 3.2 Time-of-day and recency views (P0)

**Problem.** A spot can be fine at noon and unsafe at 10 pm.

**Requirements**
- Store the report's time bucket (morning / afternoon / evening / night) from
  `created_at` in IST, or let the reporter optionally state "when did this
  happen" (default = now).
- Filter bar gains a **time-of-day** control and a **last N days** control
  (the `hours_back` param already exists).
- Default view on load: current time bucket for the viewer.

**API**
```
GET /reports/heatmap?time_bucket=night&days_back=90&category=&affected_group=
```

**Acceptance criteria**
- Changing the bucket changes which cells are shown without a full page reload.
- Empty result renders a clear "no reports match these filters" state, not a
  blank map.

---

### 3.3 Tamil language UI (P0)

**Why.** This is the single most "useful on ground" item: a Chennai safety tool
usable only in English excludes a large share of residents.

**Requirements**
- UI strings externalized (i18n library, e.g. `react-i18next`); English + Tamil.
- Language toggle in header; choice persisted in localStorage (not tied to
  identity).
- Category labels, form text, privacy notice, and error messages translated.
- Translations reviewed by a native Tamil speaker before launch, particularly
  the women-safety categories and the privacy notice. Machine translation alone
  is not acceptable for these.
- Free-text notes are stored as typed (any script); profanity filter behavior
  for Tamil text must be tested and its limits documented (the ML filter is
  English-trained).

**Acceptance criteria**
- No hardcoded user-facing strings remain in components.
- Tamil text renders correctly in the report modal, popups, and filter bar on
  Android and iOS browsers.

---

### 3.4 Mobile / PWA polish (P1)

- Installable PWA (manifest + service worker), add-to-home-screen prompt.
- Large tap targets in report flow; bottom-sheet style report form on mobile.
- Geolocate button pre-fills the report location (browser geolocation, used
  only client-side to place the pin, then grid-snapped by the backend).
- Cached last-loaded map data for brief offline/poor-signal viewing.
  Reporting while offline is out of scope (rate limiting and cooldown depend
  on server time).
- Meet WCAG 2.1 AA for the report flow (keyboard, screen reader, contrast,
  not relying on color alone for safe/unsafe).

---

### 3.5 Institutional dashboard (P1)

**Purpose.** Let a college admin, residents' association, or civic body see
where to act, without exposing report-level data.

**Requirements**
- Read-only, aggregated: top N cells/zones by category, trend over time,
  report counts by category and time bucket.
- **Small-number suppression:** never show a cell/zone with fewer than K
  reports (start K = 5) to prevent identifying individuals.
- Protected by the admin key mechanism (header-based, env var secret) for v1.
  If more than one institution needs access, move to per-institution keys
  (still no reporter accounts).
- No device_id, no exact pre-snap coordinates, no free-text notes in dashboard
  output.
- Served as a protected frontend route (`/dashboard`) or Swagger-only in v1,
  depending on whether a non-technical viewer needs it.

**API**
```
GET /admin/dashboard/summary?days_back=90
GET /admin/dashboard/top-zones?category=poor_lighting&limit=10
  (both require X-Admin-Key)
```

**Acceptance criteria**
- Unauthorized request returns 403 with no data leakage.
- Response never includes a cell below the K threshold.

---

### 3.6 Open data export (P1)

- Public endpoint (or periodic static file) of **aggregated** data per grid
  cell: category counts, score, last-updated. No device_id, no notes, no
  per-report timestamps finer than day.
- Licensed **CC BY 4.0**; license stated in README, API docs, and the app
  footer. (Code stays under its own license, e.g. MIT; these are separate.)
- Same K-threshold suppression as the dashboard.
- Rate-limited to prevent scraping the full dataset in a loop.

---

### 3.7 Safe-route suggestion (P1, spike first)

**Reality check.** This is the highest-value and highest-risk feature on a
free-tier budget. Do a time-boxed spike (2-3 days) before committing.

**Approach**
1. Get candidate routes between A and B from a routing engine
   (`alternatives=true`, 2-3 routes).
2. Score each route against `cell_scores` along its geometry.
3. Return the lowest-risk route that is within a configurable detour limit
   (e.g. no more than 25% longer than the fastest).
4. Show route, time, and a plain-language risk summary
   ("passes 3 cells flagged for poor lighting after dark").

**Routing engine options (decide in the spike)**
| Option | Pros | Cons / risks |
|---|---|---|
| Self-host OSRM with a Chennai-only OSM extract | Full control, no quota | Needs memory/CPU beyond Render free tier; hosting is the blocker |
| OpenRouteService free API | No hosting | Needs API key, daily quota (verify current limits), ToS review |
| Public OSRM demo server | Zero setup | **Not for production use**; do not ship on it |

If no option fits the free-tier constraint after the spike, defer the feature
and record why in the decisions log. Do not compromise the constraints to
ship it.

**Privacy rules for routing**
- Origin/destination coordinates are used only to compute the route and are
  **not stored or logged**.
- Route requests are rate-limited like reports.

**Wording rule.** The UI must say "lower-reported-risk route", never "safe
route". The data is crowdsourced and incomplete; do not overclaim.

---

### 3.8 Heatmap view toggle (P2)

- Offer cluster markers (default, robust) and a density heatmap view as a
  toggle, only after the marker layer is rock solid.
- Heatmap layer must wait for style load, use [lng, lat] GeoJSON order, and
  re-add itself after style swaps (light/dark toggle).

---

### 3.9 Ground-truth validation program (P0, process)

The only way to know the data is trustworthy.

- Each week, physically or via street-level imagery verify 5 flagged
  locations; record result (confirmed / not confirmed / unclear).
- Track a simple **confirmation rate** per category over time.
- If a category's confirmation rate is low, investigate (UI confusion? abuse?
  stale seed data?) before building anything on top of it.
- Publish a short, honest data-quality note on the site once there are enough
  checks (e.g. "X of Y spot-checks matched").

---

### 3.10 Nearby help layer (P1)

**Purpose.** The map currently shows where problems are reported. This adds the
other half: where help is. An optional overlay of police stations, hospitals,
24-hour pharmacies and metro/rail stations, sourced from OpenStreetMap.

**Data approach (important: no runtime dependency on Overpass)**
- A one-off script (`scripts/fetch_osm_help_points.py`) queries the Overpass API
  once, using the locked Chennai bounding box, and writes a static
  `help_points.geojson` served from the frontend's `public/data/` folder.
- Refresh manually (e.g. monthly or quarterly). The public Overpass servers are
  fair-use only, so the live app must never call them per user.
- Starting query (verify tags against real Chennai data before relying on it;
  OSM tagging for metro stations in particular should be checked by running
  the query and inspecting counts and names):

```
[out:json][timeout:60];
(
  nwr["amenity"="police"](12.9205,80.1070,13.2405,80.4270);
  nwr["amenity"="hospital"](12.9205,80.1070,13.2405,80.4270);
  nwr["amenity"="pharmacy"]["opening_hours"="24/7"](12.9205,80.1070,13.2405,80.4270);
  nwr["railway"="station"](12.9205,80.1070,13.2405,80.4270);
);
out center tags;
```

- Keep only: name (and `name:ta` when present), type, coordinates, and
  `opening_hours` if tagged. Drop everything else.
- Validate output: every point inside the Chennai bounding box, no exact
  duplicates, no empty names (fall back to "Police station" etc. by type).

**UI requirements**
- Layer toggle in the filter bar, off by default so the safety data stays the
  focus. Keyboard accessible.
- Visible from zoom 12 and up; cluster at lower zooms to avoid clutter.
- Visually distinct from report markers: different shapes and icons
  (lucide-react), and never the red/green used for unsafe/safe, so nobody
  confuses a hospital with a reported incident.
- Click a point to see name, type, and opening hours if known. Show the Tamil
  name when the UI language is Tamil and `name:ta` exists.
- Optional "nearest help" button: uses browser geolocation, computed entirely
  in the browser, shows the closest police station and hospital as
  straight-line distance (label it that way, not as a route or travel time).
- Persistent note in the layer panel: "Data from OpenStreetMap; may be
  incomplete or out of date. In an emergency call 112." (Verify the number and
  wording before shipping.)

**Integration with existing code (known pitfalls)**
- The map's click handler currently skips opening the report modal when a
  report cluster or point is clicked. The help layer ids must be added to that
  exclusion check, or clicking a hospital will open the report form.
- The light/dark style toggle wipes custom sources and layers. The help layer
  must be re-added after a style change, same as the report layers.

**Licensing and attribution**
- OpenStreetMap data is ODbL: keep "(c) OpenStreetMap contributors" visible
  (already in the map attribution) and credit it in the dataset file.
- The extracted help-points file is OSM-derived, so keep it separate from the
  CC BY 4.0 report export (3.6). Do not merge the two datasets or relicense
  the OSM data.

**Privacy**
- The user's location is used only in the browser for "nearest help" and is
  never sent to the backend or logged.

**Optional follow-ups (not in Phase 2 scope unless time allows)**
- Dashboard "help gap" view (3.5): flagged cells with no police station or
  hospital within a set distance.
- Routing (3.7): note proximity to help points in the route summary.

**Acceptance criteria**
- Toggling the layer shows and hides help points without affecting report
  markers or the click-to-report flow.
- Clicking a help point never opens the report modal.
- After a light/dark style switch, both report markers and help points are
  still present.
- Geolocation denied or unavailable fails gracefully with a clear message.
- Attribution and the data-currency note are visible whenever the layer is on.

---

## 4. Architecture Changes

```
backend/app/
  services/
    scoring.py          # decay, unique-device weighting, flags
    cell_scores_job.py  # scheduled recompute (cron / GitHub Action / Render cron)
    routing.py          # only if 3.7 passes its spike
  routers/
    admin_dashboard.py  # 3.5
    export.py           # 3.6
    routes.py           # 3.7

frontend/src/
  i18n/                 # en.json, ta.json
  components/
    TimeFilter.jsx      # 3.2
    LanguageToggle.jsx  # 3.3
    RoutePanel.jsx      # 3.7
    HelpLayer.jsx       # 3.10
  pages/
    Dashboard.jsx       # 3.5 (if built as a page)
  public/data/
    help_points.geojson # 3.10 static OSM extract, refreshed manually

scripts/
  fetch_osm_help_points.py  # 3.10 one-off Overpass fetch + validation
```

Scheduled scoring job must run on free infrastructure (GitHub Actions cron or
a lightweight in-app scheduler). Confirm Render free-tier sleep behavior does
not silently skip scheduled work.

---

## 5. Privacy and Safety Requirements (carry over + new)

- All Phase 1 privacy rules still apply (grid snapping, no device_id in any
  response, no PII logging).
- New: small-number suppression (K >= 5) on every aggregated output.
- New: routing coordinates never persisted or logged.
- New: re-run privacy tests (Phase B) after adding dashboard, export, and
  routing endpoints, since each is a new data-exposure surface.
- New: update the in-app privacy notice and its Tamil translation whenever a
  feature changes what is stored or exposed.
- New: "nearest help" geolocation stays client-side only; never sent to the
  backend or logged.

---

## 6. Testing Requirements

- Unit tests: decay math, unique-device weighting, K-threshold suppression,
  time-bucket assignment (IST, midnight boundary).
- Security: admin endpoints reject missing/wrong keys; dashboard and export
  cannot be used to reconstruct individual reports; rate limits cover all new
  GET endpoints.
- Manipulation tests: single-device multi-cell flooding, "safe" flooding,
  coordinated reports from one IP.
- Accessibility: Tamil rendering, keyboard-only report flow, color-blind-safe
  status indicators.
- Performance: heatmap and dashboard endpoints under load on Neon free tier;
  confirm `cell_scores` keeps heatmap latency flat as report count grows.
- Routing (if built): wrong/out-of-bounds coordinates, no-route cases,
  detour-limit enforcement.
- Help layer: dataset validation (all points inside the Chennai bounds, no
  duplicates, no empty names); toggle does not break report markers; clicking
  a help point never opens the report modal; layers survive a light/dark style
  switch; geolocation denied/unavailable handled; attribution visible.

---

## 7. Milestones

| Milestone | Contents | Gate to next |
|---|---|---|
| M0 | Entry criteria met (section 2) | All boxes checked |
| M1 | 3.1 credibility + 3.2 time views + 3.9 validation process started | Manipulation tests pass |
| M2 | 3.3 Tamil UI + 3.4 mobile/PWA + 3.10 nearby help layer | Native-speaker review done; help-layer tests pass |
| M3 | 3.5 dashboard + 3.6 open export | Privacy tests re-run clean |
| M4 | 3.7 routing spike, then build or defer | Spike decision logged |
| M5 | 3.8 optional heatmap toggle; Phase 2 retrospective | Exit criteria met |

---

## 8. Exit Criteria (Phase 2 is done when)

- [ ] Heatmap weight is based on unique devices with time decay, verified by tests.
- [ ] Time-of-day filtering works and defaults sensibly.
- [ ] Full Tamil UI shipped and reviewed by a native speaker.
- [ ] Nearby help layer live with OSM attribution, a data-currency note, and a
      documented refresh process.
- [ ] At least one institution has actually viewed the dashboard (impact, not
      just "built").
- [ ] Ground-truth confirmation rate measured and published for at least
      several weeks.
- [ ] Routing either shipped within free-tier limits or formally deferred with
      the reason recorded.
- [ ] Privacy and security test passes re-run on all new endpoints.

Only after these: consider geographic expansion (Tamil Nadu), per ops spec 3.1.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Low report volume makes scoring meaningless | Seed data + outreach; do not build ML scoring until volume justifies it |
| Routing can't fit free tier | Spike first; defer rather than break constraints |
| Aggregates leak individual info in sparse areas | K-threshold suppression; test with deliberately sparse cells |
| Tamil machine translation errors on sensitive text | Native-speaker review before shipping women-safety categories and privacy notice |
| Profanity filter weak on Tamil / Tanglish | Document limit; rely on moderation queue; consider a small custom Tamil list |
| Scheduled scoring job silently not running | Job heartbeat check in monitoring; alert if `cell_scores.updated_at` is stale |
| Overclaiming safety ("safe route") | Wording rule in 3.7; data-quality note from 3.9 |
| OSM help-point data incomplete or stale (e.g. a pharmacy tagged 24/7 that isn't) | Data-currency note in the UI, "call 112" reminder, scheduled refresh, never present a place as definitely open |
| Help points mistaken for reports, or clicks opening the wrong modal | Distinct icons and colors; add help layer ids to the map click-handler exclusion |
| ODbL obligations missed when redistributing OSM-derived data | Keep attribution visible; keep the help dataset separate from the CC BY 4.0 report export |

---

## 10. Decisions Needed Before Building

- [ ] Time-decay half-lives per category (start values in 3.1 are proposals).
- [ ] K threshold for small-number suppression (proposed 5).
- [ ] Who the first institutional dashboard viewer is (college admin? a
      residents' association?) so it is built for a real user.
- [ ] Who reviews Tamil translations.
- [ ] Routing engine choice, decided by the spike.
- [ ] Whether scoring runs as a GitHub Actions cron or an in-app scheduler.
- [ ] Help layer: which point types ship first (police, hospital, 24/7
      pharmacy, metro/rail station) after checking real OSM counts for Chennai.
- [ ] Help layer: refresh cadence for the OSM extract (monthly vs quarterly).
