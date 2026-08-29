# Chennai Safety Map — Deployment, Maintenance & Expansion Spec

Companion document to `chennai-safety-map-spec.md`. That file defines what the
system is; this file defines how it stays live, trustworthy, and grows.

---

## 1. Deployment Strategy

### 1.1 Environments

| Environment | Purpose | Infra |
|---|---|---|
| Local | Fast iteration | SQLite or a throwaway Neon branch |
| Staging | Destructive/load testing, pre-launch verification | Second free Neon project + Render/Vercel preview deploy |
| Production | Real city-wide traffic | Production Neon DB, Render backend, Vercel frontend |

Staging is never pointed at production data. All destructive tests (injection
testing, load testing, DB growth simulation) run against staging only.

### 1.2 CI/CD Pipeline (GitHub Actions — free for public repos)

1. On push to a feature branch → run unit + integration tests automatically.
2. On merge to `main` → run `pip-audit` / `npm audit`, then auto-deploy backend
   to Render and frontend to Vercel.
3. Security-critical tests (geo-bounds validation, rate-limit enforcement,
   injection resistance) are **required checks** — merges are blocked if these
   fail, not just warned.
4. No auto-deploy to production without the test gate passing.

### 1.3 Launch Sequencing

1. Deploy to staging, run the full security/privacy/functional/performance/
   accessibility testing pass (see `chennai-safety-map-testing-spec.md` if
   tracked separately, or the testing phases already agreed).
2. Load verified seed data into the production DB (per main spec §5, §13) —
   before any public promotion.
3. Deploy to production, verify manually: submit one real test report, confirm
   it appears correctly on the heatmap, then delete it.
4. Begin city-wide promotion only after step 3 passes cleanly.

### 1.4 Secrets Management

- Neon connection string and any API keys live in GitHub Actions secrets and
  Render/Vercel environment variables — never in code, never committed.
- Any key ever pasted into a chat, doc, or shared channel is treated as
  compromised and rotated immediately.

### 1.5 Domain / HTTPS

- Render and Vercel both provide free HTTPS by default.
- A custom domain (even a cheap one) is worth it before wide promotion — a
  bare `.vercel.app` URL reads as less credible for a tool people are trusting
  with physical safety decisions.

---

## 2. Maintenance Strategy

### 2.1 Monitoring (free-tier tools)

- **Uptime**: UptimeRobot (free tier, 5-min checks) on both backend health
  endpoint and frontend. Side benefit: periodic pings reduce how often Render
  fully cold-sleeps.
- **Error tracking**: Sentry free tier (5k errors/month) wired into both
  FastAPI and React.
- **Storage**: Check Neon dashboard usage against the 0.5GB free cap weekly,
  not only when something breaks.

### 2.2 Moderation Cadence

- The profanity-filter flag-for-review queue must be checked on a real
  schedule — daily while volume is low. A queue nobody checks defeats the
  purpose of flag-for-review over hard-reject.
- Set an actual recurring reminder for this. Don't rely on memory.

### 2.3 Data Health Checks

- Weekly (more often early on): spot-check a handful of "unsafe" flagged
  locations against real-world conditions. This builds an actual trust record
  for the dataset, not just a volume metric.
- Watch for single-device manipulation patterns (one device gaming adjacent
  grid cells to fake a strong signal). Confirm the weighting-by-unique-device
  fix (from testing phase C.1) is holding under real traffic, not just in tests.

### 2.4 Security Patching Cadence

- Monthly: re-run `pip-audit` / `npm audit`, update dependencies with known CVEs.
- Immediately, out-of-cycle: any critical CVE in FastAPI, MapLibre, or PostGIS
  specifically.

### 2.5 Cost / Quota Monitoring

- Monthly check of Neon storage, Render, and Vercel usage against free-tier
  limits — free tiers can change terms with little notice.
- Decide the response in advance, not reactively:
  - Neon nearing 0.5GB → archive old/low-confidence reports first, upgrade if
    still needed.
  - Render cold-start complaints becoming frequent → first upgrade candidate.

### 2.6 Backup Strategy

- Free-tier Neon backup guarantees are limited. Run a weekly DB dump export to
  durable storage (private GitHub repo or personal cloud storage) as an
  independent safety net — don't rely solely on the provider.

### 2.7 Incident Response (write this before it's needed)

- Process for removing a false or malicious report affecting a real location
  or business: who can act, how fast, what's logged.
- Rollback plan for a broken deploy (e.g. geo-bounds or rate-limit found
  broken in production): Render/Vercel both support instant rollback to a
  previous deploy — know the exact steps before you need them under pressure.

### 2.8 Roadmap Discipline

- Do not build stretch features (main spec §4.3) until the MVP has real usage
  data proving the core loop works (report → heatmap → someone finds it
  useful). Over-building before validation is the most common failure mode
  for solo civic-tech projects.

---

## 3. Update & Expansion Strategy

### 3.1 Geographic Expansion (Chennai → Tamil Nadu)

The system was designed for this from the start — bounding box is a config
value, not hardcoded logic.

1. Rename `CHENNAI_BOUNDS` → a generic `ACTIVE_BOUNDS` config in both
   `bounds.js` (frontend) and `geo_validator.py` (backend).
2. Get new bounding box coordinates the same way as before (OSM Nominatim).
3. Re-run seed-data research and loading for the new area before promoting to
   it — the cold-start problem applies to every new region added, not just
   the original launch.
4. Reassess grid cell size (100m) at wider scale — rural areas are sparser,
   so variable grid size by local density may be needed (this also improves
   the privacy/de-anonymization posture flagged in testing).

### 3.2 Feature Expansion (stretch list, main spec §4.3)

Sequencing, not a free-for-all:

1. Confirm real usage data validates the MVP loop first. Don't build on top
   of thin or unvalidated data.
2. **Safe-route suggestion (OSRM)** — additive: new self-hosted service + new
   frontend flow, reads from the existing `Report` table, doesn't touch the
   core reporting pipeline.
3. **Severity/credibility ML scoring** — replaces raw-count heatmap
   weighting. Build behind a feature flag, A/B against existing weighting,
   never a hard cutover on a safety-relevant signal.
4. **Institutional dashboard** — additive: new read-only endpoint + view, no
   change to the reporting flow.

### 3.3 Adding New Report Categories

- Add as a new enum value only — never rename or remove an existing category
  (breaks historical data integrity).
- Never retroactively re-tag old reports into a new category. History stays
  as originally recorded; only new reports use the new category.
- Update the category lists in the main spec (§4.1) and both frontend/backend
  enums in the same PR, so they can't drift out of sync.

### 3.4 Spec Maintenance

- Treat `chennai-safety-map-spec.md` as a living document.
- Changes to locked decisions are recorded, not silently overwritten:
  `~~old value~~ → new value (changed DATE, reason: ...)`.
- Shipped stretch features move from §4.3 into §4.1/§4.2 (core) with their
  API contract added to §9.
- §11 (Decisions Log) remains the source of truth. If code and spec disagree,
  that's a bug to fix, not a judgment call to make silently.

### 3.5 Infrastructure Scaling Triggers

Decide these thresholds now, not reactively:

| Signal | Action |
|---|---|
| Neon storage hits ~80% of free cap | Archive old/low-confidence reports, or upgrade tier |
| Render cold-start complaints become frequent | Upgrade Render to remove sleep behavior |
| Vercel bandwidth approaching free cap | Unlikely first bottleneck; reassess if it happens |

### 3.6 Team / Contributor Expansion

If this grows beyond a solo project:

- Write the moderation process as an actual runbook (who can remove a report,
  what qualifies) rather than undocumented personal judgment.
- Enable branch protection on `main` so the CI test gate can't be bypassed by
  a rushed contribution.

---

## 4. Priorities If Time-Constrained

- **Pre-launch non-negotiable**: staging-based security/privacy testing (main
  spec's testing phases A & B), seed data in place, launch sequencing steps
  1-3 above.
- **First month post-launch**: monitoring setup (UptimeRobot + Sentry — ~20
  min total), moderation-queue check habit, weekly data health spot-checks.
- **Defer until real usage data exists**: any stretch feature, any
  geographic expansion.
