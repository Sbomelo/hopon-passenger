# Hopon — Handoff: status and remaining work

Companion to `AGENTS.md` (read that first). This file is the **source of truth for what's done and what's next**. Tick items off as you complete them.

---

## A. What is already built (verified in code)

**Passenger trips, profile and live detours (2026-11-21)**
- [x] OTP login and session reload open My trips with Active trips and Past trips. Passengers select Track on map on the active trip they want to follow.
- [x] The full name opens a profile menu with Emergency contact, Change number and Log out. Login retains its separate Change number action for correcting the number entered for OTP.
- [x] A signed-in change verifies an OTP sent to the new South African mobile number, then updates the same passenger account and issues a fresh token. Apply migration `20261121054737_AddPassengerPhoneChange` with `dotnet ef database update`.
- [x] Two consecutive off-route GPS fixes switch the line to the observed detour. It updates as fixes arrive and retains the detour when the bus rejoins the planned line. It uses the existing basemaps and schedule-offset ETA.
- [x] Verified the passenger flow at 360px in Edge with an isolated SQL Server demo database, Logging-mode OTP delivery and synthetic detour fixes over the live map's SignalR connection.

**Staff navigation and theme alignment (2026-11-21)**
- [x] The brand, staff account, logout and theme control share a single header row. Admin links appear in a grouped desktop sidebar or an expandable mobile menu, with the current page highlighted.
- [x] Verified header alignment in Light and Arrivo at 320, 360, 800, 1024 and 1361px. All 11 admin destinations returned successfully in the authenticated browser check.

Task 0 audit: **2026-11-16**, covering both repositories (`backend` = Hopon.Api; `frontend` = hopon-passenger). This handoff is copied into both repositories because the workspace-level `docs` directory is outside Git. API implementation is distinguished from usable UI below.

**Task 13 — Automated tests and CI (2026-11-18)**
- [x] Shared SQLite in-memory test host installs a recording SMS sender, fixed service clock and test JWT configuration. Hosted workers are driven explicitly in their own tests.
- [x] Extended xUnit coverage for ETA, tracking eligibility, trip access, boarding and ticket issuance. The OTP-to-tracking integration test checks passenger isolation and SignalR access over an in-process WebSocket with the .NET client.
- [x] Added separate GitHub Actions workflows for the backend and frontend repositories, README status badges and local test commands. The .NET 8-compatible solution runs both backend projects from the repository root.
- [x] Verified 473 xUnit cases (23 new), five driver JavaScript tests and seven frontend tests. The Ubuntu xUnit run met the 60-second target. The Windows Release run was slower. Frontend lint and build passed. No migration.

**Task 12 — Demo mode (2026-11-18)**
- [x] Seed or reset a live N3 trip and yesterday’s completed trip using three fake passenger accounts, a 60-seat coach, the existing driver and UTC schedules. Reset is transactional and protects unrelated trips, tickets and logs.
- [x] Admin Simulator and the passenger map share a 230-point OSRM route. The simulator supports manual moves, arrival/departure, status changes and three-second auto-drive through the driver lifecycle service. The passenger map shows the recent GPS trail.
- [x] Clean build, 449 backend tests, five driver JavaScript tests, seven passenger tests, lint and production build passed. Verified empty SQL Server migration, two seed runs and reset. Headless Edge covered OTP → live map, manual move, auto-drive on/off, live delay/resume, arrival/departure, completion, notifications and past-trip history.
- [x] Both READMEs link to the demo run instructions and 60-second walkthrough. No migration added. Before public release, sanitise the historical seed phone numbers and driver password hash (section B.18).

**Task 11 — Location throttling, audit and retention (2026-11-18)**
- [x] Default-off ten-second driver auto-sharing with indicator/stop/cleanup; injectable-clock singleton three-second throttle, 15-second persistence, accepted-fix broadcasts and 250 km/h plausibility validation. API/Razor handle friendly throttled/rejected outcomes.
- [x] Privacy-limited audit entity/migration, rolling five-minute read/join deduplication and failure-isolated writes; admin read-only filtered/paged `/Admin/Audit`.
- [x] Daily 02:00 SAST retention worker with disabled Development/default, enabled Production, default dry run, batched deletes, unique identity anonymisation and contact removal. `/Admin/Retention` exposes in-memory summary and a dry-run-only action that respects disabled mode.
- [x] Backend build zero warnings/errors; five driver JS tests and frontend lint/build passed. SQL migration applied/no pending model changes; eight admin page/theme/viewport checks and disabled dry-run POST passed. Hopon starts on 5101; temporary QA admin removed; demo records and real SMS untouched.
- [x] All **443 backend tests** passed, including 25 new privacy cases; isolated scheduler fixture updated for the new throttle dependency (15 focused scheduler tests passed). Earlier Application Control blocks cleared on normal rebuild/retry, without policy changes; empty discovery was not treated as a pass. Delivered as three ordered backend commits/PRs: location → audit → retention (`task-11-privacy-ops`). See backend `docs/PRIVACY_OPS.md` for commands, migration, assumptions and optional device GPS acceptance. Task 12 untouched.

**Task 10 — Admin console completion (2026-11-18)**
- [x] 10a: Admin home and post-login landing page; SAST-day trip/ticket counts and rolling 24-hour Sent/Failed notification-attempt counts.
- [x] 10b: Admin-only live monitor with latest GPS/age/stale highlighting/OSM, next Pending stop, final schedule-offset ETA and Details links. A no-store JSON handler and `wwwroot/js/monitor.js` refresh the table every 15 seconds without navigation; failures retain the last snapshot and retry.
- [x] 10c: Read-only notification log with combined trip/passenger/type/channel/status filters, stable newest-first paging at 50 rows, preserved filters and SAST timestamps.
- [x] 10d: Scheduled-only Void/Reinstate ticket forms and service rules; reinstate checks passenger/capacity/seat and preserves the original reference. Active-ticket delivery/access checks remain in force; void also evicts existing SignalR trip-group connections, with serialized joins/revocations and disconnect cleanup.
- [x] 10e: Validated Bus/Stop/Route CRUD, OSM point checks, confirmed destructive actions and friendly FK failures. Ordered route stops remain contiguous/unique through transactional swaps; any referenced trip locks reorder/remove, with the reason shown. Appends affect future trips only. Existing TripStop generation is verified and now coordinates with route edits transactionally.
- [x] 10f: All new pages in the admin nav; responsive table containers and existing theme variables. Inline dark-mode brand/link visibility and separate-ticket-form validation fixes.
- [x] Verification: backend rebuild zero warnings/errors; all **418 backend tests** passed (36 new cases, including an actual WebSocket revocation/rejoin check); frontend lint/build passed. Registration migration applied to local SQL Server after duplicate/length preflight; no pending model changes. Headless Edge verified 28 page/theme/viewport combinations plus timed monitor update/stale/error/empty/safe-text behavior without page navigation. Backend 5101 and Vite 5173 run.
- Delivery: six ordered backend commits, split into an operations PR, a ticket PR and a master-data/navigation PR. Exact URLs, commands, assumptions and migration preflight are in backend `docs/ADMIN_CONSOLE.md`. One new migration: `20261118064058_AddUniqueBusRegistration`; old migrations unchanged. The index permits legacy empty registrations; new writes require a nonempty unique normalized registration.
- Environment: Windows Application Control intermittently blocked startup/test assemblies. Normal rebuild/retry and the normal `dotnet` host restored execution; the final full suite passed. No policy settings changed. A browser connector timeout was handled with headless Edge. Browser polling checks used synthetic JSON rather than altering demo trips. Temporary QA admin is removed after review; no paid SMS was sent. Task 11/12 work remains untouched.

**Task 9 — Passenger UI completion (2026-11-17; implementation complete, visual acceptance pending)**
- [x] 9a: restore theme before React render through one theme helper; compact shared header with bell, theme and overflow controls. Map style/theme coupling is retained.
- [x] 9b: newest-first notifications with type icons, relative/absolute SAST time, optional routes and loading/empty/error/retry states. Browser-local seen timestamp drives unread polling every 30 seconds on dashboard/map with cleanup.
- [x] 9c: presentational boarding/alighting panel, persisted status/times, busy/error/retry handling and plain-string API errors. A scrolling bottom stack keeps route/follow controls separate from boarding.
- [x] 9d: past-card history with ticket/seat, scheduled/actual and boarding times plus stop timeline; destination ETA on live cards/map; explicit SOS call-link sheet. History accepts any owned ticket, including inactive; my-trips lists inactive tickets under Past trips. Map destination comes from the access-checked ticket and existing schedule-offset ETA; tracking gates unchanged. Stop/status updates refresh map data and reconnect rejoins the authorized group.
- [x] 9e: expandable draft login privacy notice, visible owner contact placeholder and truthful retention status (automation remains Task 11). Inline login fixes add a visible Verify button, verification errors and associated labels.
- [x] Verification: backend build zero warnings/errors; all 382 backend tests (four new PassengerUiTests), frontend lint/build and seven Node tests passed. SQL Server already up to date; no pending model changes or migration. Initial Application Control failures recovered on normal retry without policy changes. Backend HTTP 5101 and Vite 5173 run. Local Logging-mode OTP login, trips/feed/contact and owned past-history HTTP checks passed; no real SMS, calls or demo trip/ticket edits.
- [ ] Visual acceptance: 360px/desktop, both themes and live-map interaction remain unverified. In-app browser creation timed out; native Edge targeting failed on its minimized window. Local passenger has no live ticket; isolated tests cover map/boarding access and ticket-specific ETA. Follow `docs/PASSENGER_UI.md` before accepting the draft PR stack.
- Delivery/assumptions: five ordered frontend commits/stacked PRs plus one companion backend commit/PR. SOS only presents saved-contact/10111 tel links (no auto-dial/message). Read timestamp is browser-local; per-user SignalR groups are a future option. Privacy copy needs legal review and the owner must replace `privacy@hopon.example`. Theme tokens unchanged.

**Task 8 — One lifecycle path for trip status changes (2026-11-17; implementation complete, runtime verification pending)**
- [x] Renamed driver lifecycle service/interface with `git mv` to `TripLifecycleService` / `ITripLifecycleService`; updated DI, driver API/Razor callers and existing tests. `TripStatusRules.CanTransition` enforces the eight requested transitions; terminal/self transitions are rejected before side effects.
- [x] Admin Edit loads a tracked Trip by id and uses the lifecycle service for delay (optional reason), resume and completion. Details cancellation has an optional reason and confirmation flow. Missing IDs return 404; lifecycle errors are shown through TempData. Removed the admin status setter; only lifecycle code mutates existing trip statuses.
- [x] Cancellation appends enum value 7, notifies active holders with `Your trip has been cancelled.` plus optional reason and broadcasts the same status event as driver actions. Existing actual times are preserved; SMS follows the existing explicit allowlist. Completion retains final-stop emergency alerts for admin and driver alike. No migration added.
- [x] Added 57 focused cases covering all status pairs, lifecycle effects/rejections, active/voided recipients, repeated cancellation, SMS policy and real admin-versus-driver HTTP delay log/SignalR parity. Existing repeatable-delay test now resumes before a second delay. Inline fix: nullable driver API delay reason maps to an empty reason.
- [x] Verification passed: backend and test-project rebuild (zero errors/warnings), frontend lint/build and all four Node tests. Existing Vite chunk-size warning remains.
- [ ] Runtime verification: Windows Application Control blocks the generated backend/test assemblies (`0x800711C7`). Normal build/rebuild/retry did not clear it. Focused and full backend test runs could not execute reliably (full run reports 46 loader failures, not assertion results); EF update/model checks and local backend restart are also blocked. The earlier running backend was stopped to release its build lock and could not restart. No policy settings changed, no real SMS sent, and browser checks remain unverified. Re-run the exact commands in `docs/TRIP_LIFECYCLE.md` before accepting the draft PR.
- Assumptions/limits: reasons optional; start and resume retain distinct meanings so resume never rewrites ActualDeparture; cancellation does not invent Actual times or void tickets. SMS Cancellation is opt-in, with InApp always requested. Existing save/notify/broadcast operations are separate, without new concurrency claims, outbox or retries. Task 9 is untouched.

**Task 7 — Emergency contact alert on arrival (2026-11-17)**
- [x] Driver destination arrival sends the exact first-name/stop-name SMS through `INotificationService` / `ISmsSender` to the saved contact, who needs no Hopon account. Only active destination tickets qualify; missing contacts and legacy null destinations are skipped.
- [x] Passenger-owned Emergency/Sms log names the contact without their number. Success says “We told Mom you arrived.” Failed sends/exceptions are Failed with null SentAt; disabled/excluded SMS remains Pending with “SMS disabled”. Logging is explicitly simulated and remains Pending rather than claiming real delivery.
- [x] New migration `20261117124718_AddUniqueEmergencyAlerts` enforces one `(UserId, TripId, Type = Emergency)` across channels/statuses. Pending claims precede sending; repeated toggles, concurrent calls and completion cannot resend. One attempt total, no retries/backfill. Existing rows/migrations are preserved.
- [x] Driver Completed flow checks the trip's highest-sequence stop for not-yet-alerted final-stop ticket holders, even without an Arrived event. It does not invent stop timestamps or alert missed intermediate destinations. Admin domain-flow consolidation remains Task 8.
- [x] Passenger dashboard now includes a themed Emergency contact alerts feed, refreshed every 30 seconds, showing truthful Sent/Pending/Failed results. General notifications/unread UI remains Task 9. Added feed helper to authenticated-API logout coverage.
- [x] Verification: backend build (zero errors), 321 backend tests including 14 emergency cases, frontend lint/build and four Node tests passed. Local SQL Server migration and pending-model check passed. Backend HTTP 5101 and Vite 5173 start successfully. Existing DriverController nullable and Vite chunk warnings remain on full compilation/build.
- Verification limits: browser-control service timed out, so visual/360px dashboard checks remain unverified. Existing local passengers have no live trips; isolated HTTP tests cover OTP/map/SignalR and private feed access. No real SMS or paid provider calls were made.
- Assumptions/limits: first whitespace-delimited name (fallback `Passenger` if blank); “Sent” means provider acceptance, not handset receipt. Disabled, simulated and failed claims suppress later attempts; a crash after claiming may leave Pending with unknown delivery. See `docs/EMERGENCY_ALERTS.md` for exact commands, messages, completion edge case and rollout duplicate preflight.

**Task 6 — SMS abstraction and Twilio (2026-11-17)**
- [x] `ISmsSender`/`SmsSendResult`, Logging default and official Twilio 8.2.0 sender. Twilio supports FromNumber or MessagingServiceSid (service takes precedence), a 10-second timeout, failure results and body-free error logs. Logging prints messages only in Development and redacts bodies elsewhere; SDK debug body logging is disabled.
- [x] Typed SMS/Twilio/notification options validate provider, required Twilio credentials/sender and notification type names before database bootstrap. Notification SMS defaults off; its replacement type allowlist defaults to ThirtyMinutesBefore, TenMinutesBefore, Arrival, Delay and Emergency. OTP uses the selected provider independently of this switch.
- [x] OTP sends the exact Hopon ten-minute code text. Failed delivery deletes the new request and restores older unused codes, returns the requested SMS error, exposes no code and consumes no rate-limit slot.
- [x] `INotificationService.CreateAsync` unifies scheduler, driver delay and destination arrival channels. SMS claims a Pending log before sending and records Sent/SentAt or Failed/null SentAt. InApp delivery remains available. Failed SMS is not automatically retried; Sent means provider acceptance, not handset delivery. Emergency-contact delivery remains Task 7.
- [x] New migration `20261117052431_AddNotificationChannelUniqueness` replaces the filtered reminder/arrival unique key with `(UserId, TripId, Type, Channel)`. Existing data/migrations are preserved; Delay/Emergency may repeat. Applied successfully to local SQL Server with `dotnet ef database update --no-build -- --environment Development`; no pending model changes.
- [x] Recording-fake service/HTTP tests and in-memory SDK transport tests cover OTP rollback/rate-limit recovery, exact text/exposure, default/custom SMS filtering, failure status, channel uniqueness, scheduler/arrival/delay integration, startup validation, sender selection, redaction, timeout and cancellation. No test contacts Twilio.
- [x] Verification: backend build (zero errors), all 307 tests, frontend lint/build and SQL migration passed. SQL Server Logging-mode OTP request/verify, authenticated my-trips and notification feed passed. Startup with missing Twilio credentials/sender or an invalid provider fails clearly before database access. Existing DriverController nullable and Vite chunk warnings remain.
- Local limits: existing data has no live trips, so full local active-map rendering remains unverified; isolated HTTP tests cover OTP → map-data → SignalR. Windows Application Control intermittently blocked initial test/startup/EF attempts; a normal rebuild/retry restored execution without policy changes. No paid SMS was sent and no Twilio account/credentials were configured.
- [ ] Owner acceptance: follow `docs/SMS.md` to configure a sender/Messaging Service, enable South Africa, verify trial recipients and confirm real OTP receipt on a handset. Configuration keys and exact commands are also in README and `.env.example`.
- Assumptions/inline fixes: notification allowlist replaces defaults; no SMS backfill or automatic retries/outbox recovery (interruption may leave Pending). Guarded attempts are once per channel even when Failed. Failed OTP sends preserve the previous working code. Demo offset affects due decisions only; actual notification timestamps use injected UTC time. Fixed cascading startup validation errors for unknown SMS providers. Downgrade requires reconciling dual-channel rows before restoring Task 5's narrower index.

**Task 5 — Destination notification scheduler (2026-11-17)**
- [x] Pure threshold rules choose only the most urgent crossed 4h/2h/30min/10min reminder, suppress equal/less urgent repeats after catch-up or ETA changes, and skip past ETAs. Message helpers include the passenger stop and SAST ETA; the ten-minute reminder says to get ready to get off.
- [x] Hosted scheduler uses a 30-second `PeriodicTimer`, injected `TimeProvider.System` and a new scope per tick. Read-only ticket/log queries are batched; only InProgress/Delayed trips, active tickets, Pending destinations belonging to that trip and passengers without Alighted logs qualify. Legacy null destinations are skipped. Per-ticket saves isolate failures; later ticks retry failed reminder inserts while still due.
- [x] Driver stop arrival now generates guarded InApp Arrival notifications for active destination ticket holders after saving the stop. Repeated arrivals/writes do not duplicate logs. Existing repeatable Delay notifications remain unchanged. Emergency-contact/SMS delivery remains Tasks 7/6; feed UI remains Task 9.
- [x] Migration `AddUniquePassengerNotifications` adds a filtered unique `(UserId, TripId, Type)` index for reminder/arrival types only, closing insert races while allowing repeated Delay logs. Applied successfully to local SQL Server with `dotnet ef database update --no-build -- --environment Development`. No existing migration edited or schedule data shifted.
- [x] Optional `Demo:ClockOffsetMinutes` defaults to 0 and affects only the Development scheduler's notion of now. README documents fast-forwarding, restart/reset, eligibility, catch-up and the existing notification feed endpoint.
- [x] Focused SQLite/FakeTimeProvider coverage includes all threshold boundaries and sent combinations, different passenger stops/ETAs, all eligibility exclusions, batch read counts, per-ticket failure recovery, filtered unique-key races, timer shutdown, Development-only offsets, arrival hooks, repeatable delays and private `/api/notifications/my` feed visibility.
- [x] Verification: `dotnet build` (zero errors), `dotnet test --no-build` (281 passed, including 161 new notification cases), frontend `npm run lint`/`npm run build`, and local SQL Server migration passed. Existing DriverController nullable and Vite chunk warnings remain. The full-suite timer test now waits for save completion rather than polling a shared SQLite connection during its write.
- Local runtime limit: direct `dotnet run --no-build --launch-profile http` is still blocked by Windows Application Control (the existing Task 4b environment issue). No policy was changed. SQL Server migration and isolated HTTP/timer tests work; a direct local login → map smoke check remains unverified for Task 5.
- Assumptions: reminder/arrival uniqueness spans all channels/statuses for a user/trip/type, while Delay/Emergency logs may repeat. Catch-up satisfies older thresholds through the persisted urgent type without creating pretend Sent rows. Arrival recipients include active destination tickets even if already alighted, as required separately from the scheduler's alighting exclusion. Arrival generation runs in the driver arrival action, without a separate retry/outbox worker.

**Task 4b — UTC storage and SAST display (2026-11-17)**
- [x] `SaTime` converts admin SAST wall-clock input to UTC with a fixed +02:00 offset and no OS timezone IDs; UTC inputs are unchanged. EF conventions preserve writes and mark required/nullable DateTimes UTC on read, preserving ticks and nulls.
- [x] Admin Create/Edit save UTC and Edit pre-fills SAST. Admin Index/Details, ticket destination times, and driver schedule/stop/GPS displays use SAST; GPS is labelled SAST. Driver timestamps continue to use UTC.
- [x] Passenger `src/utils/format.js` centralizes time/date formatting with `Africa/Johannesburg`, reused by Dashboard, TripMap and EmergencyContact. My-trips `tripDate` retains the departure instant so a 00:30 SAST departure does not display the previous date.
- [x] No migration added or existing data shifted. The initial `dotnet ef migrations has-pending-model-changes --no-build -- --environment Development` reported no model changes. Manual, one-off correction for verified SAST-only schedule databases is in `docs/sql/shift-scheduled-times-to-utc.sql`; it is not idempotent and was **not run**. See `docs/UTC_TIME.md` for rollout and verification.
- [x] Backend build succeeds (zero errors) and all 120 tests pass; six new cases cover SaTime round trips, the ten-minute ETA offset, nullable/required UTC materialization, Admin Create/Edit and driver rendering, API JSON `Z`, and midnight rollover. Frontend lint/build and four Node tests pass, including UTC/New York/Auckland device-zone checks. Existing DriverController nullable and Vite chunk warnings remain.
- Local verification limit: after the initial EF check, Windows Application Control blocked `backend/bin/Debug/net8.0/Hopon.Api.dll` (`0x800711C7`) for direct startup and subsequent EF CLI checks. No policy was changed; local SQL Server migration/startup smoke checks could not be completed for Task 4b. The isolated HTTP tests use SQLite; legacy SQL schedules remain unchanged and require the documented correction when applicable.

**Task 4 — Passenger stops on tickets and TripStop generation (2026-11-16)**
- [x] Trip creation saves the trip and distance-proportional Pending stops atomically. First/last arrivals match the trip schedule; intermediate dwell is 15 minutes capped at the next arrival. Route edits regenerate stops only with no tickets (inactive tickets also block); schedule edits retain stop IDs and rescale only Pending stops.
- [x] Nullable origin/destination ticket FKs use Restrict with no back navigation. New tickets require a destination after their boarding stop; omitted origin defaults to the first stop. Migration: `AddPassengerStopsToTickets`; apply with `dotnet ef database update -- --environment Development` from backend.
- [x] Admin Details loads passengers/stops on GET and validation failure, provides both stop selectors, and displays destination name/time with `—` for old tickets. Fixed the pre-existing hidden Issue Ticket form.
- [x] My-trips, access-check, history and admin ticket DTOs expose destination name/scheduled arrival; my-trips also exposes the schedule-offset destination ETA. Trip-level ETA is retained. Passenger React display remains Task 9; scheduler remains Task 5; the known UTC defect remains Task 4b.
- [x] Verification: backend build (zero errors), 114 tests, frontend lint/build, SQL Server migration, and local OTP login → authenticated my-trips/map-data passed. Existing legacy ticket has null destination fields; isolated HTTP tests cover Admin GET/POST and the legacy dash. The existing local passenger still has no active trip; no demo trip/ticket rows changed. Existing DriverController nullable and Vite chunk warnings remain. One test run hit a transient Windows Application Control file-load error; a sequential rerun passed all 114 tests.
- Assumptions: routes need at least two stops with positive distances between consecutive stops; invalid/degenerate routes are rejected with admin errors. First-stop departure equals trip departure; last-stop departure is null. Existing trips without stops are not backfilled. Arrived/Departed stops use ActualArrival (even if null); unvisited stops on Completed/Cancelled trips have no ETA. No timezone conversion is added in Task 4.

**Task 3b — Configuration, secrets and startup safety (2026-11-16)**
- [x] Strongly typed JWT/CORS/OTP options use ValidateOnStart; validation runs before database bootstrap. Missing/short JWT keys produce readable errors. JWT issuance and bearer validation share typed settings; duplicate token-service registration removed.
- [x] CORS origins come from configuration; localhost:5173 is a Development-only default. Production has no allowed origins by default and OTP exposure is disabled. All committed settings are non-secret defaults.
- [x] Forwarded For/Proto headers precede Production HTTPS redirection/HSTS; Swagger remains Development-only. Default proxy trust retained; Azure managed-proxy setup and its trust assumptions are documented.
- [x] Ran user-secrets init (already initialized; existing secrets preserved). Backend README Local setup and .env.example document secrets, hosting variables, validation and CORS checks. Historical JWT rotation remains owner action; no Git history rewritten and no migration added.
- [x] Verification: backend build (zero errors), 92 tests, frontend lint/build and local migration check passed. Real Production startup with an empty JWT key failed clearly before database access; Development preflight returned 204 with the configured origin, and SQL Server OTP login/authenticated trips worked with existing user-secrets. Existing DriverController nullable and Vite chunk warnings remain. Azure configuration is documented and middleware-tested locally; no Azure deployment performed.

**Task 3 — OTP hardening and phone normalisation (2026-11-16)**
- [x] Pure South African mobile normalizer accepts common local/international formats; both OTP endpoints normalize before service calls. Emergency-contact model validation returns 400 for invalid phones; create/update stores E.164.
- [x] Cryptographic six-digit codes, invalidation of older unused requests, active-user checks on request/verification/token issuance, and Development-only OTP logging.
- [x] `Otp:ExposeCodeInResponse` defaults false and is true in Development configuration; hosted demos can explicitly opt in. Existing React code display works unchanged. Unknown-number errors stay generic; 200 for known vs 400 for unknown still permits enumeration (accepted demo limitation).
- [x] Existing xUnit/SQLite project extended with reusable `TestDb`, normalizer cases, OTP service tests and HTTP validation/configuration tests. Task 2 OTP/map/SignalR fixture now uses a valid synthetic mobile number.
- [x] Setup, assumptions, request examples and verification commands: backend `docs/OTP_HARDENING.md`. No migration added. SMS remains Task 6; Task 3b was subsequently completed.
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
- [x] OTP API (`POST /api/auth/otp/request`, `/api/auth/otp/verify`): normalized SA mobile numbers, cryptographically generated BCrypt codes, 10-minute expiry, three requests per 10 minutes, five verification attempts, active existing user required, older unused OTP invalidation, passenger JWT via `IJwtTokenService`. Code response exposure is opt-in; OTP logging is Development-only. Task 6 adds Logging/Twilio SMS delivery and failed-send rollback.
- [x] Trip access service and `[RequireTripAccess]` filter; missing active ticket returns 404. Passenger API: access-check, my-trips (live/past), boarding-status, board, alight, history, map-data.
- [x] Notifications API (`GET /api/notifications/my`), time-based passenger destination reminders, driver destination-arrival alerts and existing delay notifications. Task 6 adds optional SMS through the shared notification service; passenger feed UI remains Task 9.
- [x] Emergency-contact CRUD (`/api/emergency-contact`); no arrival-alert delivery.
- [x] Driver API (`/api/driver/...`, Driver role): my-trip, start, delay, complete, location; login at `/api/driver/auth/login`.
- [x] SignalR `/hubs/trip`, JWT query-string authentication, trip-group access checks; broadcasts `ReceiveLocationUpdate`, `ReceiveTripStatusUpdate`, `ReceiveStopUpdate`. Passenger hook subscribes to location/status/stop events and rejoins the authorized group after reconnect (Task 9).
- [x] Schedule-offset ETA in `Models/EtaCalculator.cs`; Task 4b makes new admin schedules UTC to match driver actual times. Legacy SAST schedules require the documented one-off correction.
- [x] Admin Razor trips list/filter, create, edit, details, cancel, mark delayed/completed. Ticket issuance includes seat/capacity/duplicate checks, `HOP-XXXXXX` references and validated passenger stops; Task 4 fixes the form's GET loading.
- [x] Driver Razor `/Driver/Trip`: start, delay/resume, complete, stop arrive/depart, GPS from browser geolocation; uses the authenticated driver id and the DriverOnly cookie policy (Task 1).

**Passenger — built and wired**
- [x] `src/pages/LoginPage.jsx`: OTP request and configured demo code display (`Otp:ExposeCodeInResponse`); code verification supports Enter and a visible Verify button with rendered errors (Task 9); expandable draft privacy notice is present.
- [x] `DashboardPage.jsx`: live/past trip cards and active-trip map navigation. Past-trip cards now open the ticket-owned history detail page (Task 9).
- [x] `TripMapPage.jsx` + `src/components/TripMap.jsx`: MapLibre GL JS + OpenFreeMap, OSRM road route with straight-line fallback, location/status SignalR updates, follow-bus, basemap switcher and themes.
- [x] `EmergencyContactPage.jsx`: contact read/save/delete; Task 7 now sends destination-arrival SMS and shows the result in the dashboard emergency feed.
- [x] `App.jsx`: owns `map`, `dashboard`, `emergency-contact`, `notifications`, `history` navigation and selected trip ID; login/logout reset navigation to `map`.

**Exists but not wired**
- Resolved in Task 4: Admin Issue Ticket now loads passengers and trip stops on the normal Details GET and after validation errors.
- Task 9 wires boarding/alighting, history, general notifications/unread, SOS and destination display. Task 7 emergency arrival outcomes remain on the dashboard. Visual acceptance of Task 9 remains pending as recorded above.

**Missing — checked with file globs and repository text searches**

| Requested item | Status / evidence | Follow-up |
|---|---|---|
| General NotificationsPage / unread count | Implemented in Task 9; visual acceptance pending | Task 9 |
| TripHistory detail page | Implemented in Task 9, including inactive owned tickets | Task 9 |
| BoardingPanel / boarding confirmation UI | Implemented in Task 9 with board/alight/status API calls | Task 9 |
| `Pages/Admin/Simulator/Index.cshtml` and page model | **Missing**; broken `/Admin/Simulator/Index` link removed from `Pages/Shared/_Layout.cshtml` | Task 12 |
| Admin Void ticket action | **Missing** from Razor handlers, forms and admin service; `Ticket.IsActive` exists but no void action | Task 10 |
| SOS button | Implemented in Task 9 as an explicit call-link sheet | Task 9 |
| Seed SQL / reproducible trip demo | **Missing**: no `*.sql` files or demo seeder in either checkout | Task 12 |

**Where operational data comes from**

Only Users and Drivers have `HasData` / migration inserts. Stops, BusRoutes, Buses, RouteStops and Tickets have no committed seed path. Task 4 makes Admin Create generate TripStops from RouteStops and fixes the Issue Ticket form. There is no Stop/Route/Bus CRUD. Existing local `HoponDb` has 5 stops, 2 routes, 2 buses, 5 trips and 3 tickets, but their original creation scripts/source are not in these repos. A fresh migration-only database cannot reproduce that demo; demo seeding remains Task 12.

**Secret scan**

No current committed JWT signing key, password-bearing connection string or Twilio credential was found. Historical `appsettings.json` in backend commit `cf11f906caf8c63f9baa61f4014dc2bce8138689` contains `Jwt:Key` and a Windows-auth connection string (no SQL password); it was removed later, but remains in history. **Owner must rotate any deployment/local key derived from that committed key.** No history was rewritten. Seeded phone numbers and the demo driver password hash remain in DbContext/migrations (section B.18); reset the demo password if reused and sanitise before public release. Task 3b completed configuration/startup hardening; credential rotation remains owner action.

---

## B. Known defects and risks found in the current code

Fix these as part of the tasks below (each is referenced there).

1. Resolved in Task 1: Admin/Driver Razor folders require the respective staff cookie role; the driver id comes from the authenticated claim.
2. Resolved in Task 2: passenger endpoints and TripHub require the Passenger role; driver APIs require Driver, preventing overlapping IDs from crossing identities.
3. Resolved in Task 3: cryptographic OTP generation, older unused request invalidation, active-user checks and Development-only logging. Response code exposure is independently opt-in for demos.
4. Resolved in Task 3: shared SA mobile normalisation for both OTP endpoints and emergency-contact create/update; invalid numbers return 400.
5. Resolved in Task 4: tickets have nullable origin/destination TripStop FKs, with destination required and ordered for new issuance. Task 5 generates reminders/arrival alerts for destination tickets; old null-stop tickets are skipped for these alerts.
6. Implemented in Task 8: admin delay/resume/completion/cancellation now call `ITripLifecycleService`, including Actual times, passenger notifications and SignalR. The old admin setter is removed. Runtime acceptance is pending the Windows Application Control issue recorded in section A.
7. Resolved in Task 1: stop arrival/departure queries require the authorized trip id.
8. Resolved inline in Task 1: RecordLocationAsync interface parameter names now match the implementation (latitude, longitude); behavior is unchanged.
9. Resolved inline in Task 1: user seed dates match the existing snapshot, preventing migration churn.
10. Resolved in Task 3b: configured CORS allowlist, validated typed JWT/CORS/OTP options, secrets/env setup documentation, Production HTTPS/HSTS/proxy support, and one token-service registration. Historical credential rotation remains owner action.
11. Implemented in Task 11: accepted fixes broadcast with three-second throttling, 15-second persistence and configurable retention. All 443 backend tests passed; deletion defaults to disabled/dry-run as documented above.
12. Typos in DTO property names (`MyTripDto.ActualDepature`, `DriverTripDto.BusRegistraton`) — rename only together with frontend usages.
13. Resolved in Task 0: removed unused Leaflet/add dependencies; README now describes MapLibre GL JS + OpenFreeMap.
14. Task 1 adds staff authentication, driver ownership and bootstrap tests. Broader coverage remains Task 13.
15. Resolved in Task 9: history relies on service ticket ownership, including inactive tickets, while tracking access gates stay unchanged. Inactive tickets are listed under Past trips so history is reachable.

16. Resolved for new data in Task 4b: admin SAST input converts to UTC, EF DateTimes read as UTC (API `Z`), and staff/passenger displays use SAST. Existing SAST schedule values are not automatically shifted; `docs/sql/shift-scheduled-times-to-utc.sql` is a manual, one-off correction only for verified SAST-only schedule databases.
17. Resolved in Task 4: `AdminTripService.CreateTripAsync` atomically saves TripStops generated from the route's stops. Legacy trips without stops are not backfilled.
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

**Task 3b: Configuration and secrets — complete**
- Move JWT key, connection string, Twilio keys to user-secrets / env vars; add `appsettings.Production.json` without secrets; CORS origins from config. Remove duplicate DI registration. Fail fast on startup if the JWT key is missing or shorter than 32 chars.

### Phase 2 — Missing product features
**Task 4b: Time handling — UTC everywhere — complete** *(local startup verification limited by Windows Application Control; see section A)*
- [x] Store new schedules as UTC; convert SAST admin input before saving and UTC to SAST for Razor display/Edit. EF marks required/nullable dates UTC on read; frontend shares `Africa/Johannesburg` formatters. Legacy correction is documented separately and not executed.
- *Done when:* a trip scheduled at 18:00 SAST departing 18:10 SAST shows a 10-minute delay everywhere, and ETAs are correct on the passenger dashboard.

**Task 4: Passenger stop on tickets (model change) — complete** *(also: generate TripStops when a trip is created — defect 17)*
- [x] Add nullable origin/destination TripStop FKs with restricted delete, migration, validated admin selectors, and destination fields in history/my-trips/access/admin DTOs. React "Your stop" display is deferred to Task 9 as instructed.
- *Done when:* every newly issued ticket has a destination stop; existing data still works.

**Task 5: Notification scheduler (4h / 2h / 30min / 10min / arrival) — complete**
- [x] A 30-second `BackgroundService` computes destination ETA through `CalculateStopEta`, applies catch-up rules and creates guarded InApp logs. Driver arrival creates destination Arrival logs; a filtered unique index enforces user/trip/type uniqueness. Fake-clock and feed tests verify generation and access.
- Stop reminder: the 10-minute notification doubles as the "get ready to get off" reminder.
- Delay notifications keep working as today.
- Unit-test the threshold logic as a pure function.
- *Done when:* with a seeded trip and a fast-forwarded clock (inject `TimeProvider`), each notification is created once and appears in `/api/notifications/my`.

**Task 6: SMS abstraction + Twilio — implementation complete; owner delivery check pending**
- [x] `ISmsSender` with `LoggingSmsSender` (default) and `TwilioSmsSender` (configured via secrets). Use it for OTP and configured Sms-channel passenger notifications; emergency-contact alerts remain Task 7. Record in `NotificationLog` (Channel = Sms, Status Sent/Failed). Handle failures without crashing the request.
- *Done when:* in Development nothing is sent but everything is logged; in Production OTP arrives by SMS.
- [ ] Owner acceptance: configure Twilio using `docs/SMS.md` and confirm actual OTP receipt on a South African handset. No paid SMS was sent during implementation.

**Task 7: Emergency contact alert on arrival — complete**
- [x] Exact privacy-limited SMS to saved contact on destination arrival; passenger-owned Emergency/Sms result log and dashboard feed. Unique user/trip/type claim prevents repeats; failed/disabled/simulated outcomes are truthful and are not retried.
- [x] Driver completion fallback covers final-stop tickets without an arrival event; voided tickets are ignored. Migration, focused tests and verification are recorded in section A and `docs/EMERGENCY_ALERTS.md`.

**Task 8: One domain path for trip status changes — implementation complete; runtime verification pending**
- [x] Admin delay/resume/completion/cancellation and existing driver actions use the renamed `ITripLifecycleService`; centralized transition rules, cancellation message/type and active-holder delivery, tracked loading and visible errors are implemented. See section A and `docs/TRIP_LIFECYCLE.md` in the backend repo.
- [ ] Run backend tests, EF checks and local startup after Windows Application Control permits the generated assemblies. PR remains draft pending these checks.
- *Done when:* admin and driver produce identical side-effects for the same transition.

**Task 9: Passenger UI completion — implementation complete; visual acceptance pending**
- [x] 9a theme/header; 9b notifications/unread; 9c boarding/alighting; 9d history/your stop/SOS and inactive-ticket backend fix; 9e draft privacy notice.
- [x] Required builds/lint, 382 backend tests, seven Node tests, SQL EF checks and local OTP/past-history smoke passed.
- [ ] Complete the 360px/desktop manual checks in both themes from `docs/PASSENGER_UI.md`; browser tooling could not verify them.
- Pages (React, no router, per AGENTS.md): Notifications feed (+ unread count badge on dashboard header via a global SignalR listener or polling — keep simple), Boarding panel on the trip screen (Board / Left bus), Trip History detail (stops with scheduled vs actual times), SOS/emergency access, "Your stop" display, privacy notice on the login page.
- Fix theme toggle so choice persists across all pages and reloads. Fix any header overflow on small phones (the header has 4 controls).
- Use the existing `DashboardPage` conventions. Verify on a 360px-wide viewport.
- *Done when:* every passenger capability in AGENTS.md section 1 is reachable from the UI.

**Task 10: Admin console completion — complete**
- [x] Admin home/login landing, live monitor, filtered/paged notification log, Scheduled ticket Void/Reinstate, Bus/Stop/ordered Route CRUD and admin navigation.
- [x] Trip creation generates TripStops; route-edit invariants and ticket revocation/reinstatement have service/HTTP/WebSocket coverage. All 418 backend tests, required build/lint, SQL migration/model checks and rendered admin checks passed. See section A and backend `docs/ADMIN_CONSOLE.md`.

### Phase 3 — Demo, privacy, quality, deploy
**Task 11: Location throttling, audit, retention (POPIA) — complete**
- [x] A/B/C implemented; 443 backend tests, five driver JS tests, frontend lint/build, SQL migration/model checks and eight admin theme/viewport checks passed. See section A and backend `docs/PRIVACY_OPS.md`.
- Driver GPS: client posts every 5–10 s; server ignores fixes < 3 s apart for the same trip. Persist at most one fix per ~15 s but broadcast every fix. Prune `LocationUpdates` older than N days.
- Audit log table for location/notification reads by passengers (UserId, TripId, Type, Timestamp). Keep it small.
- `RetentionService` (BackgroundService, daily): 90 days after trip completion, delete location updates, notification logs, boarding logs; anonymise Users (name → "Deleted user", phone → hashed token) when they have no recent trips. Configurable days.

**Task 12: Demo mode — complete**
- [x] From a fresh database, run migrations and `dotnet run -- --seed-demo`. Use `+27600000001` and open `/Admin/Simulator` in a second window. Repeat the pitch with `--reset-demo`. See **Run the demo** in the backend README.

**Task 13: Automated tests and CI**
- [x] Completed the coverage gaps and added a CI workflow to each repository. See section A for coverage and verification.

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
