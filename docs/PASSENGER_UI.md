# Task 9 — Passenger UI completion

Branch: `task-9-passenger-ui`, based on Task 8. Changes are delivered in five ordered frontend commits; the separate backend repository has a companion 9d commit. No migrations are required.

## 9a — Theme and header

Theme restoration runs in `main.jsx` before React renders. `utils/theme.js` owns persistence; the map keeps its basemap/theme coupling. `AppHeader` keeps a shrinking title and three 44px controls, with Emergency Contact and Log out in an overflow disclosure. The notification bell is enabled in 9b. Menu closes on outside click or Escape.

Manual checks at `http://localhost:5173`, at 360px and desktop widths, in both themes:

1. Log in, open My trips, toggle the theme, reload, log out: the login screen must retain the theme.
2. Open a live trip. Pick Dark, then Liberty/Positron/Bright; Hopon must switch theme with the map. Navigate to My trips and Emergency Contact and reload.
3. Check a long route title: it truncates while all header buttons stay visible. Open the menu, tab through its buttons, dismiss with Escape/outside click, then reopen and navigate.

Validation: `npm run lint`, `npm run build`, `node --test tests/*.test.mjs`. Vite retains the existing large MapLibre chunk warning. Browser acceptance results are recorded below after the complete flow is available.

## 9b — Notifications

The bell opens `NotificationsPage`, newest first, with type icons/labels, optional route names, relative time, absolute SAST time, channel and truthful delivery status. Route names come from my-trips when available, without changing the notifications API. Empty, loading, error and retry states are provided. Dashboard/map poll every 30 seconds and clean up their timers; failed polls preserve the last count. The shared localStorage timestamp is browser-local, not a server read receipt or a per-user cross-device setting. A per-user SignalR group would be a future alternative to polling.

Manual checks at 360px and desktop, both themes:

1. With existing trip notifications, open My trips: the bell shows a count for items newer than `hopon-notifications-seen-at` (missing key counts all). Open the bell: newest updates appear first, with SAST time and route when available.
2. Go back to My trips: the count clears for the displayed older updates. Create a driver delay and wait 30 seconds on My trips/map: the new notification counts as unread. Reload to verify the timestamp persists.
3. Check a passenger with no notifications. Disconnect the backend and open the feed: show an error and Try again; reconnect and retry. A failed feed fetch must not mark notifications as seen.
4. Navigate away from map/My trips and confirm notification polling stops in the Network panel; returning starts one interval.

Validation: `npm run lint` and `npm run build` passed for 9b.

## 9c — Boarding and alighting

`BoardingPanel` is presentational. TripMapPage fetches status and owns mutations, busy/error state and retry. The existing map has a children slot above its bottom card in a scrollable stack; boarding never overlays the route/follow actions. Buttons stay in a compact row at phone width. The API helper now reads both JSON and plain-text errors and handles empty 204 responses. All six requested API wrappers are available.

Manual checks at 360px and desktop, both themes:

1. Open a live ticket that has no boarding logs: see “I've boarded”. Tap once: busy state disables repeated input, then the boarded SAST time and “I've left the bus” appear. Tap that: both confirmation times appear. Reload: the same state persists.
2. Fail the boarding-status request: map stays usable and Retry status recovers it. Fail a mutation with a 400 string: its actual message appears and the button is enabled for retry.
3. Check Whole route and Follow bus remain visible/clickable. On a short viewport, scroll the bottom stack to reach its actions.

Validation: frontend lint/build and five Node tests passed, including authenticated wrappers, plain-text errors and empty bodies. Backend build passed with zero warnings/errors. The unchanged baseline full backend test attempt hit Windows Application Control `0x800711C7` loading Hopon.Api.dll (87 loader failures, zero assertion results); runtime acceptance remains pending.

## 9d — History, destination and SOS

PastTripCard opens a history page with ticket/seat, scheduled versus actual trip times, boarding/alighting times and an ordered dot/line stop timeline. Missing legacy values display a dash. Both live cards and the map bottom card display the passenger's destination and SAST ETA. Map data refreshes on status/stop events, and SignalR rejoins the ticketed group after reconnecting. Map framing allows for the bottom stack.

Backend companion: history removes only `[RequireTripAccess]`; the Passenger role and service ticket-ownership query remain. Defect 15 is fixed for inactive tickets. Inline fix: my-trips now includes those tickets in Past trips, otherwise their history would remain unreachable. They never appear as trackable live cards. Map destination is selected from the authorized ticket, scoped to the loaded trip, using the existing schedule-offset calculator. Tracking endpoint and hub access rules are unchanged. No migration.

SOS assumption: it opens a native modal bottom sheet showing the saved emergency contact and an explicit `tel:` link, plus `tel:10111`. Missing/failed contacts link to Emergency Contact. Opening SOS never auto-dials or sends messages. Native modal behavior provides focus trapping/Escape; the phone/browser handles a call only after a link is selected.

Manual checks at 360px and desktop, both themes:

1. My trips → a past card: verify route, ticket, seat, scheduled/actual times, boarded/left times and each stop in sequence. Check a legacy trip with missing actuals/stops and an inactive owned ticket; a different passenger must get 404 for the same history URL.
2. Open two passengers' tickets for different stops on the same trip: cards/map must show each passenger's own stop. Start ten minutes late: destination ETA moves ten minutes. Mark that stop arrived: the map refreshes to its actual time. A null legacy destination displays a dash. Query-string destination spoofing must have no effect.
3. Map → SOS: inspect the saved contact and both call links without selecting them. Close with Escape and check focus returns to SOS. Test with no contact and a failed contact load, then follow Emergency Contact to save one. No call or SMS should be made by opening the sheet.
4. Check SOS does not overlap basemaps/navigation, and boarding does not cover Whole route/Follow bus. Use the bottom stack scrollbar if the viewport is short.

Backend commands from `C:\dev\my-project\backend`: `dotnet build`, `dotnet test --no-build --filter FullyQualifiedName~PassengerUiTests`, `dotnet test --no-build`, `dotnet ef database update --no-build -- --environment Development`, `dotnet run --no-build --launch-profile http`. Four focused backend cases cover ownership/roles, inactive tickets, destination isolation, legacy nulls and schedule/actual ETA. Build passed; execution is subject to the existing Application Control blocker.

Inline verification fixes: unread data is tied to the current session token so switching passengers cannot briefly show another session's count. Node coverage verifies unread timestamp boundaries, relative-time boundaries/clock skew and midnight SAST rollover.

## 9e — Login privacy notice

An expandable section below Send one-time code explains phone use, ticket-holder-only location and the 90-day retention policy. It is visibly draft copy needing legal review. `privacy@hopon.example` is visibly an owner TODO placeholder, not a working contact. Since retention automation remains Task 11, the notice explicitly says automatic retention is not yet enabled in this demo; this task does not claim POPIA compliance.

Inline fixes encountered in the touched login form: the OTP step had neither a visible Verify button nor rendered verification errors. It now has both, linked input labels and one-time-code autocomplete. No OTP secrets are persisted by this UI.

Manual checks at 360px and desktop, both themes:

1. Log out/reload with a saved theme. Under Send one-time code, expand How Hopon uses your number. Read all four topics and the draft/owner warnings; long address text wraps without horizontal overflow. Collapse it with keyboard and pointer.
2. Request a code with a seeded passenger number; enter an incorrect six-digit code and click Verify code: show the error and re-enable the button. Use the correct configured demo code or received code and confirm login still opens a trip or the no-active-trip state. Enter also submits; Change number resets the code/error.

## Final verification — 2026-11-17

- Frontend `npm run lint`, `npm run build` and `node --test tests/*.test.mjs`: passed, all seven tests. Existing Vite MapLibre chunk-size warning remains.
- Backend `dotnet build`: zero warnings/errors. All 382 backend tests passed, including the four new PassengerUiTests. Initial Application Control loader/startup failures recovered on normal retry without policy changes.
- SQL Server `dotnet ef database update --no-build -- --environment Development`: already up to date. `dotnet ef migrations has-pending-model-changes --no-build -- --environment Development`: no pending changes.
- Backend HTTP 5101 and existing Vite 5173 are running. Local Logging-mode request/verify OTP, my-trips, notifications, emergency-contact and owned past-trip history passed. Existing local passenger has zero live trips; local map/boarding interaction cannot be smoke-checked without changing demo data. Isolated integration tests cover their access and personalized map data.
- Visual acceptance is **pending** at 360px/desktop in both themes: in-app browser tab creation timed out; native Edge inspection failed because its window is minimized and could not be restored by the available tool. No screenshot-based or interactive layout success is claimed. Complete the manual checks above before accepting the draft stack.
- No migration, real SMS, automatic call, new library, security-policy change or demo trip/ticket edit. The privacy notice still needs legal review and an owner-supplied contact; automatic retention remains Task 11.
