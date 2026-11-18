# Task 9 — Passenger UI completion

Branch: `task-9-passenger-ui`, based on Task 8. Changes are delivered in five ordered frontend commits; the separate backend repository has a companion 9d commit. No migrations are required.

## 9a — Theme and header

Theme restoration runs in `main.jsx` before React renders. `utils/theme.js` owns persistence; the map keeps its basemap/theme coupling. `AppHeader` keeps a shrinking title and three 44px controls, with Emergency Contact and Log out in an overflow disclosure. The notification bell is enabled in 9b. Menu closes on outside click or Escape.

Manual checks at `http://localhost:5173`, at 360px and desktop widths, in both themes:

1. Log in, open My trips, toggle the theme, reload, log out: the login screen must retain the theme.
2. Open a live trip. Pick Dark, then Liberty/Positron/Bright; Hopon must switch theme with the map. Navigate to My trips and Emergency Contact and reload.
3. Check a long route title: it truncates while all header buttons stay visible. Open the menu, tab through its buttons, dismiss with Escape/outside click, then reopen and navigate.

Validation: `npm run lint`, `npm run build`, `node --test tests/*.test.mjs`. Vite retains the existing large MapLibre chunk warning. Browser acceptance results are recorded below after the complete flow is available.
