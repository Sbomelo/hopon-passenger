# Hopon — Handoff: status and remaining work

Companion to `AGENTS.md` (read that first). This file is the **source of truth for what's done and what's next**. Tick items off as you complete them.

---

## A. What is already built (verified in code)

Task 0 audit: **2026-11-16**, covering both repositories (`backend` = Hopon.Api; `frontend` = hopon-passenger). This handoff is copied into both repositories because the workspace-level `docs` directory is outside Git. API implementation is distinguished from usable UI below.

**Task 3 — OTP hardening and phone normalisation (2026-11-16)**
- [x] Pure South African mobile normalizer accepts common local/international formats; both OTP endpoints normalize before service calls. Emergency-contact model validation returns 400 for invalid phones; create/update stores E.164.
- [x] Cryptographic six-digit codes, invalidation of older unused requests, active-user checks on request/verification/token issuance, and Development-only OTP logging.
- [x] `Otp:ExposeCodeInResponse` defaults false and is true in Development configuration; hosted demos can explicitly opt in. Existing React code display works unchanged. Unknown-number errors stay generic; 200 for known vs 400 for unknown still permits enumeration (accepted demo limitation).
- [x] Existing xUnit/SQLite project extended with reusable `TestDb`, normalizer cases, OTP service tests and HTTP validation/configuration tests. Task 2 OTP/map/SignalR fixture now uses a valid synthetic mobile number.
- [x] Setup, assumptions, request examples and verification commands: backend `docs/OTP_HARDENING.md`. No migration added. SMS remains Task 6; Task 3b remains next.
- [x] Verification: `dotnet build` (zero errors), `dotnet test --no-build` (81 passed, including 33 normalizer cases), frontend lint/build and local SQL Server migration check passed. Live local-format request → international-format verification → authenticated trips passed. Existing DriverController nullable and Vite chunk-size warnings remain; full local live-map rendering still depends on active demo trip data.

**Task 2 — Token separation (2026-11-16)**
- [x] Passenger JWTs carry the Passenger role; passenger controllers and TripHub require it. Driver JWTs retain Driver and now carry the correct username claim.
- [x] Explicit signing-key validation, one-minute clock skew and role claim mapping; query tokens remain restricted to `/hubs`.
- [x] Passenger UI returns to OTP login after authenticated API 401/403 responses, using the existing logout handler. Anonymous OTP errors remain visible.
- [x] Three-identity documentation and deployment notice in `docs/SECURITY.md`; request examples in backend `Hopon.Api.http`. Passengers must log in again because old tokens have no role. No migration added.
- [x] Verification: `dotnet build` (zero errors), 24 backend tests, frontend auth-failure test, lint and build passed. Coverage includes overlapping IDs, role-less tokens, signature/expiry validation and OTP → map-data → SignalR JoinTrip. Browser checks confirm authenticated 401/403 clears storage and returns to login.
- Local SQL Server OTP login, passenger trips, passenger-to-driver rejection (403) and hub negotiation (200) passed. Active-trip map-data access and SignalR joining passed with isolated test data; full local live-map rendering remains unverified because the existing passenger has zero live trips and one past trip. No demo records were changed. Broader testing remains Task 13.
- Task 3 was subsequently completed below in the ordered task list.

**Task 1 — Staff authentication (2026-11-16)**
- [x] Separate StaffCookie authentication and AdminOnly/DriverOnly Razor policies; existing API JWT behavior remains unchanged. Login, POST logout, access denied and role-aware headers are implemented.
- [x] AdminUsers table and AddAdminUsers migration; configuration-based first-admin bootstrap, generated Development fallback, warning/skip outside Development when credentials are missing.
- [x] Admin driver list, creation, deactivate/reactivate and password reset. Deactivated accounts lose cookie access on their next request. Password reset affects future logins, without revoking existing cookies/JWTs.
- [x] Driver page uses the authenticated driver id; service stop mutations require the authorized trip id.
- [x] Focused SQLite/WebApplicationFactory staff security and bootstrap tests. Run `dotnet test`; setup and manual acceptance checks are in `docs/STAFF_AUTH.md`.

**Task 0 verification**
- [x] `dotnet build`: succeeds, zero errors. Existing CS8604 nullable warning in `Controllers/DriverController.cs:68` remains; no backend compile fix was needed.
- [x] `dotnet ef database update -- --environment Development`: succeeds against local SQL Server; all five migrations already applied. No migration added or edited.
- [x] `npm install`, `npm run lint` (zero errors/warnings), `npm run build`: pass. Removed `react-leaflet`, `leaflet`, `@react-leaflet/core` and `add` using `npm uninstall`; no remaining imports/package entries. Fixed the stale SignalR callback dependency warning using callback refs.
- [x] Local backend and Vite start. `Properties/launchSettings.json` HTTP profile, both Vite proxy routes, HTTP samples and README agree on API **5101**; passenger UI remains **5173**. User-secrets supplies `ConnectionStrings:HoponDb` and `Jwt:Key`; only non-secret JWT defaults are committed.
- [x] Swagger and Admin trips return 200. Through Vite: OTP request/verify, my-trips, map-data (five stops), SignalR negotiate succeed; anonymous my-trips and invalid driver login return 401. Passenger dashboard renders the existing completed trip.
- [ ] Full active login → dashboard → live-map flow is **not verified**: all three existing tickets belong to a completed trip. No demo rows or trip-status changes were made for this audit. Successful driver login is not verified because the seed password is not documented.
- Remaining non-blocking output: Vite's >500 kB chunk warning; npm audit reports seven findings (three moderate, four high) in development/build tooling and dependencies. Dependency upgrades and bundle optimisation were not part of Task 0.

**Backend — built**
- [x] EF Core model and five migrations: Users, EmergencyContacts, Drivers (username + BCrypt hash), Buses, Stops, BusRoutes, RouteStops, Trips, TripStops, Tickets, LocationUpdates, BoardingLogs, NotificationLogs, OtpRequests. `Data/HoponDbContext.cs` and migrations `20260725213426_SeedUsers` / `20260804130147_SeededANewDriver` seed three users and one driver (`driver1`, id 2).
- [x] OTP API (`POST /api/auth/otp/request`, `/api/auth/otp/verify`): normalized SA mobile numbers, cryptographically generated BCrypt codes, 10-minute expiry, three requests per 10 minutes, five verification attempts, active existing user required, older unused OTP invalidation, passenger JWT via `IJwtTokenService`. Code response exposure is opt-in; OTP logging is Development-only. SMS delivery is not implemented.
- [x] Trip access service and `[RequireTripAccess]` filter; missing active ticket returns 404. Passenger API: access-check, my-trips (live/past), boarding-status, board, alight, history, map-data.
- [x] Notifications API (`GET /api/notifications/my`); only driver-delay in-app notifications are generated. No reminder scheduler or SMS sender.
- [x] Emergency-contact CRUD (`/api/emergency-contact`); no arrival-alert delivery.
- [x] Driver API (`/api/driver/...`, Driver role): my-trip, start, delay, complete, location; login at `/api/driver/auth/login`.
- [x] SignalR `/hubs/trip`, JWT query-string authentication, trip-group access checks; broadcasts `ReceiveLocationUpdate`, `ReceiveTripStatusUpdate`, `ReceiveStopUpdate`. Passenger hook subscribes to location/status only.
- [x] Schedule-offset ETA in `Models/EtaCalculator.cs` (known timezone defect remains in section B).
- [x] Admin Razor trips list/filter, create, edit, details, cancel, mark delayed/completed. Ticket-issuing service implements seat/capacity/duplicate checks and `HOP-XXXXXX` references; its UI wiring defect is below.
- [x] Driver Razor `/Driver/Trip`: start, delay/resume, complete, stop arrive/depart, GPS from browser geolocation; uses the authenticated driver id and the DriverOnly cookie policy (Task 1).

**Passenger — built and wired**
- [x] `src/pages/LoginPage.jsx`: OTP request and configured demo code display (`Otp:ExposeCodeInResponse`); code verification submits with Enter, but there is no visible Verify button.
- [x] `DashboardPage.jsx`: live/past trip cards and active-trip map navigation. Past-trip cards are summaries, not a history detail page.
- [x] `TripMapPage.jsx` + `src/components/TripMap.jsx`: MapLibre GL JS + OpenFreeMap, OSRM road route with straight-line fallback, location/status SignalR updates, follow-bus, basemap switcher and themes.
- [x] `EmergencyContactPage.jsx`: contact read/save/delete only. Text promising arrival notifications is ahead of implementation.
- [x] `App.jsx`: switches only `map`, `dashboard`, `emergency-contact`; login/logout reset navigation to `map`.

**Exists but not wired**
- Admin Issue Ticket: `Services/AdminTripService.cs`, `Pages/Admin/Trips/Details.cshtml` and its POST handler exist, but `Details.cshtml.cs.OnGetAsync` never loads `PassengerItems` via `LoadAsync`. The normal detail-page GET therefore hides the form even when eligible passengers exist. Recorded only; no backend behaviour change in Task 0.
- Notifications, boarding/alighting and history APIs exist, but the passenger API helper and `App.jsx` do not expose their missing UI features below.

**Missing — checked with file globs and repository text searches**

| Requested item | Status / evidence | Follow-up |
|---|---|---|
| NotificationsPage or equivalent feed | **Missing** from `src/pages`; no feed navigation or API helper | Task 9 |
| TripHistory detail page | **Missing**; dashboard past-trip cards do not call `/history` | Task 9 |
| BoardingPanel / boarding confirmation UI | **Missing** from `src/components` and pages; no board/alight calls | Task 9 |
| `Pages/Admin/Simulator/Index.cshtml` and page model | **Missing**; broken `/Admin/Simulator/Index` link removed from `Pages/Shared/_Layout.cshtml` | Task 12 |
| Admin Void ticket action | **Missing** from Razor handlers, forms and admin service; `Ticket.IsActive` exists but no void action | Task 10 |
| SOS button | **Missing** throughout both source trees; Emergency Contact is CRUD, not SOS | Task 9 |
| Seed SQL / reproducible trip demo | **Missing**: no `*.sql` files or demo seeder in either checkout | Task 12 |

**Where operational data comes from**

Only Users and Drivers have `HasData` / migration inserts. Stops, BusRoutes, Buses, RouteStops, TripStops and Tickets have no committed seed path. Trips are inserted by `AdminTripService.CreateTripAsync` through Admin Create; it does not create TripStops. Tickets can be inserted by `IssueTicketAsync`, subject to the UI defect above. There is no Stop/Route/Bus CRUD. Existing local `HoponDb` has 5 stops, 2 routes, 2 buses, 5 trips and 3 tickets, but their original creation scripts/source are not in these repos. A fresh migration-only database cannot reproduce that demo.

**Secret scan**

No current committed JWT signing key, password-bearing connection string or Twilio credential was found. Historical `appsettings.json` in backend commit `cf11f906caf8c63f9baa61f4014dc2bce8138689` contains `Jwt:Key` and a Windows-auth connection string (no SQL password); it was removed later, but remains in history. **Owner must rotate any deployment/local key derived from that committed key.** No history was rewritten. Seeded phone numbers and the demo driver password hash remain in DbContext/migrations (section B.18); reset the demo password if reused and sanitise before public release. Full configuration/security work stays in Task 3b.

---

## B. Known defects and risks found in the current code

Fix these as part of the tasks below (each is referenced there).

1. Resolved in Task 1: Admin/Driver Razor folders require the respective staff cookie role; the driver id comes from the authenticated claim.
2. Resolved in Task 2: passenger endpoints and TripHub require the Passenger role; driver APIs require Driver, preventing overlapping IDs from crossing identities.
3. Resolved in Task 3: cryptographic OTP generation, older unused request invalidation, active-user checks and Development-only logging. Response code exposure is independently opt-in for demos.
4. Resolved in Task 3: shared SA mobile normalisation for both OTP endpoints and emergency-contact create/update; invalid numbers return 400.
5. **`Ticket` has no passenger stop.** The notification rules ("X before *your* stop", "notify emergency contact when you arrive") are impossible without it. See Task 4.
6. **Admin status changes bypass the domain flow.** `UpdateTripStatusAsync` (Mark delayed / completed / cancel) doesn't set Actual times, doesn't notify passengers, and doesn't broadcast over SignalR.
7. Resolved in Task 1: stop arrival/departure queries require the authorized trip id.
8. Resolved inline in Task 1: RecordLocationAsync interface parameter names now match the implementation (latitude, longitude); behavior is unchanged.
9. Resolved inline in Task 1: user seed dates match the existing snapshot, preventing migration churn.
10. CORS allows only `http://localhost:5173`; JWT config and connection string location must be moved to secrets/env for deployment. `IJwtTokenService` is registered twice in `Program.cs`.
11. Every GPS fix is written to `LocationUpdates` forever, and each driver POST triggers a DB write + broadcast. Needs a throttle and retention (Task 11).
12. Typos in DTO property names (`MyTripDto.ActualDepature`, `DriverTripDto.BusRegistraton`) — rename only together with frontend usages.
13. Resolved in Task 0: removed unused Leaflet/add dependencies; README now describes MapLibre GL JS + OpenFreeMap.
14. Task 1 adds staff authentication, driver ownership and bootstrap tests. Broader coverage remains Task 13.
15. Open edge case: `[RequireTripAccess]` requires an **active** ticket, so a voided/deactivated ticket blocks trip history. Decide: history should be allowed for any ticket the user owns (inactive included), tracking only for active tickets + active trip status.

16. **Time zone inconsistency.** Admin forms (`datetime-local`) save South African local time into `ScheduledDeparture/Arrival` (Kind Unspecified), while the driver flow stamps `Actual*` with `DateTime.UtcNow`. `EtaCalculator` subtracts one from the other, so every delay/ETA is off by 2 hours. Dashboard DTO dates carry no `Z`; only `TripMapService` forces UTC (for location fixes).
17. **`AdminTripService.CreateTripAsync` creates the Trip but no `TripStops`.** A trip created in the admin UI has no stops on the map, driver page or history (unless data was inserted by SQL scripts).
18. **Personal data in the repo.** Real-looking phone numbers (the owner's and family's) are committed in `DbContext` seed data and migrations, and the demo driver's password hash is committed. Fine for a private repo; must be sanitised before the repo is made public.

---

## C. Remaining work, in order

Each task = one branch + one PR. Acceptance criteria are what "done" means.

### Phase 0 — Baseline
**Task 0: Verify and stabilise**
- Clone, run `dotnet build`, `dotnet ef database update`, `dotnet run`, `npm install`, `npm run dev`. Fix anything that doesn't build.
- Compare section A "reported complete" list against the repo; update section A with what really exists.
- Fix ports/proxy mismatches (`Hopon.Api.http` says 5101, Vite proxies to 55036). Remove dead deps. Fix root README to say MapLibre.
- *Done when:* clean build, app runs, login → dashboard → map works locally with seeded data, and section A is accurate.

### Phase 1 — Security (before any deployment)
**Task 1: Admin + Driver authentication (Razor Pages) — complete**
- Cookie authentication for Razor Pages with login/logout pages. Driver login uses existing `IDriverAuthService`. Add an `Admin` account (new `AdminUser` table or a role on a separate table — keep simple; BCrypt hash; seed via configuration, not hardcoded in source).
- `[Authorize(Roles="Admin")]` on `/Admin/*`, `[Authorize(Roles="Driver")]` on `/Driver/*`. Remove `DemoDriverId`; use the logged-in driver's id. A driver may only act on their own trip (enforce in services, see defect 7).
- Admin can create/deactivate driver accounts (username + initial password).
- *Done when:* unauthenticated requests to `/Admin/*` and `/Driver/*` redirect to login; driver A cannot act on driver B's trip.

**Task 2: Token separation — complete**
- Add a `Passenger` role claim to passenger JWTs; use `[Authorize(Roles="Passenger")]` on passenger controllers and the hub. Driver JWTs must not work on passenger endpoints and vice versa. Use different claim names or a `typ`/role check so ids can't collide.
- *Done when:* a driver JWT gets 403 on `/api/trips/my-trips` and `/hubs/trip`; a passenger JWT gets 403 on `/api/driver/*`.

**Task 3: OTP hardening + phone normalisation — complete**
- Normalise to E.164 (+27…) on request and verify (accept `078…`, `+27 78…`, `27…`). Validate format.
- Use `RandomNumberGenerator` for codes. Invalidate older unused OTPs on a new request. Never log OTPs outside Development. Return a generic message for unknown numbers (already done — keep it).
- *Done when:* the same user can log in with any common format of their number; OTP never appears in logs in Production.

**Task 3b: Configuration and secrets**
- Move JWT key, connection string, Twilio keys to user-secrets / env vars; add `appsettings.Production.json` without secrets; CORS origins from config. Remove duplicate DI registration. Fail fast on startup if the JWT key is missing or shorter than 32 chars.

### Phase 2 — Missing product features
**Task 4b: Time handling — UTC everywhere** *(do this right after Task 4 and before Task 5)*
- Store all `DateTime` values as UTC. Convert South African local time (UTC+2, no DST) to UTC when admin forms save, and back to local when Razor pages display. Make EF return `DateTimeKind.Utc` so JSON serialises with `Z`. Frontend formats with `timeZone: 'Africa/Johannesburg'`.
- *Done when:* a trip scheduled at 18:00 SAST departing 18:10 SAST shows a 10-minute delay everywhere, and ETAs are correct on the passenger dashboard.

**Task 4: Passenger stop on tickets (model change)** *(also: generate TripStops when a trip is created — defect 17)*
- Add `OriginTripStopId?` and `DestinationTripStopId` (nullable for existing rows) to `Ticket`, FK to `TripStops`, restrict delete. New migration. Update admin Issue Ticket form (select destination stop from the trip's stops), `TripHistoryDto`, my-trips DTO (show "Your stop").
- *Done when:* every newly issued ticket has a destination stop; existing data still works.

**Task 5: Notification scheduler (4h / 2h / 30min / 10min / arrival)**
- A `BackgroundService` ticking every 30–60 s. For each active trip and each active ticket with a destination stop, compute the passenger's stop ETA = stop `ScheduledArrival` + trip departure delay (reuse the schedule-offset idea). When ETA − now crosses 4h / 2h / 30min / 10min, create a `NotificationLog` (types already exist) **exactly once** (guard with a unique check on UserId + TripId + Type). Arrival notification fires when the passenger's stop is marked Arrived.
- Stop reminder: the 10-minute notification doubles as the "get ready to get off" reminder.
- Delay notifications keep working as today.
- Unit-test the threshold logic as a pure function.
- *Done when:* with a seeded trip and a fast-forwarded clock (inject `TimeProvider`), each notification is created once and appears in `/api/notifications/my`.

**Task 6: SMS abstraction + Twilio**
- `ISmsSender` with `LoggingSmsSender` (default in Development) and `TwilioSmsSender` (configured via secrets). Use it for: OTP delivery in Production, Sms-channel notifications, and emergency contact alerts. Record in `NotificationLog` (Channel = Sms, Status Sent/Failed). Handle failures without crashing the request.
- *Done when:* in Development nothing is sent but everything is logged; in Production OTP arrives by SMS.

**Task 7: Emergency contact alert on arrival**
- When the driver marks the passenger's destination stop as Arrived: send an SMS to that passenger's emergency contact ("Thandi has arrived at Johannesburg Park Station"), log it. Only once per ticket.

**Task 8: One domain path for trip status changes**
- Admin "Mark delayed / Mark completed / Cancel" must go through `IDriverTripService`-style logic (or a shared `ITripStatusService`): set Actual times, notify passengers (cancel gets its own message), broadcast over SignalR. Add a simple allowed-transitions check. Notify on Cancelled.
- *Done when:* admin and driver produce identical side-effects for the same transition.

**Task 9: Passenger UI completion**
- Pages (React, no router, per AGENTS.md): Notifications feed (+ unread count badge on dashboard header via a global SignalR listener or polling — keep simple), Boarding panel on the trip screen (Board / Left bus), Trip History detail (stops with scheduled vs actual times), SOS/emergency access, "Your stop" display, privacy notice on the login page.
- Fix theme toggle so choice persists across all pages and reloads. Fix any header overflow on small phones (the header has 4 controls).
- Use the existing `DashboardPage` conventions. Verify on a 360px-wide viewport.
- *Done when:* every passenger capability in AGENTS.md section 1 is reachable from the UI.

**Task 10: Admin console completion**
- Notification log page (filter by trip/user/type/status), vehicle last-known location per active trip, Bus/Route/Stop CRUD (Routes with ordered stops → generating TripStops on trip creation if not already done), Void ticket (set `IsActive=false`; allowed only before the trip starts), driver management (from Task 1).
- Verify trip creation generates `TripStops` from `RouteStops` with scheduled times — if not, implement.

### Phase 3 — Demo, privacy, quality, deploy
**Task 11: Location throttling, audit, retention (POPIA)**
- Driver GPS: client posts every 5–10 s; server ignores fixes < 3 s apart for the same trip. Persist at most one fix per ~15 s but broadcast every fix. Prune `LocationUpdates` older than N days.
- Audit log table for location/notification reads by passengers (UserId, TripId, Type, Timestamp). Keep it small.
- `RetentionService` (BackgroundService, daily): 90 days after trip completion, delete location updates, notification logs, boarding logs; anonymise Users (name → "Deleted user", phone → hashed token) when they have no recent trips. Configurable days.

**Task 12: Demo mode**
- `DemoSeeder` runs in Development (or via `dotnet run -- --seed-demo`), idempotent, creates: route **Durban → Johannesburg**, stops Durban, Pietermaritzburg, Estcourt, Harrismith, Johannesburg Park Station with real GPS coordinates, a bus (reg + capacity), driver, a trip In Progress whose last known location is ≈2 h from Johannesburg (between Harrismith and Johannesburg), TripStops with realistic times and first stops marked Departed, tickets for the 3 seeded passengers with different destination stops.
- Admin Simulator page (`/Admin/Simulator`): buttons "Move bus to next stop", "Trigger delay (with reason)", "Mark arrival at stop"; interpolates GPS along the route and posts it through the same service as the driver so passenger apps update live.
- A `Reset demo` action. Document the one-command start in the README.
- *Done when:* a fresh clone → migrations → run → the demo works end to end with no manual SQL.

**Task 13: Automated tests**
- xUnit project `Hopon.Api.Tests` using SQLite in-memory. Cover: `EtaCalculator`, `TripStatusRules`, OTP request/verify (rate limit, expiry, attempts), `TripAccessService`, `BoardingService`, `AdminTripService.IssueTicketAsync` (capacity, duplicate, seat taken), notification threshold logic, role separation (integration tests with `WebApplicationFactory`). Add a GitHub Actions workflow running build + tests + `npm run lint && npm run build`.

**Task 14: Deployment**
- Azure App Service + Azure SQL. Serve the React build from the API (`wwwroot` or a separate static host) — pick the simpler, document why. Enable WebSockets for SignalR. Production CORS, secrets in App Service config, `dotnet ef database update` via a migration bundle in CI. HTTPS only. Health endpoint.
- *Done when:* the demo runs on a public URL and passengers can log in on a phone.

**Task 15: Final README + docs**
- Rewrite `README.md`: problem, solution, Mermaid architecture diagram, how to run locally (one command demo), tech decisions with one-line reasons (ETA approach, identity vs access, MapLibre, split frontend), API overview, screenshots/GIF of the demo, POPIA notes, known limitations and roadmap.

### Backlog (only after everything above)
Notification settings / opt-out, per-stop boarding, push notifications, admin boarding log views, operator/multi-tenant model (currently the "Intercape" label is a hardcoded constant in `TripMap.jsx`).

---

## D. Out of scope
Campus safety app, BLE mesh, Redis, Redux/React Router, native mobile apps, connecting to a real ticketing system.
