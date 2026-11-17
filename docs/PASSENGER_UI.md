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
