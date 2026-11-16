# AGENTS.md — Hopon

Read this file fully before changing anything. Then read `docs/HANDOFF.md` for current status and the ordered task list.

## 1. What Hopon is

Hopon is a real-time trip-notification and bus-tracking product for **intercity bus passengers in South Africa** (first target: Intercape-style services, route Durban → Johannesburg).

The problem: overnight passengers have no reliable ETA. They wait hours in dark stations, families can't plan pickups, passengers sleep through their stop, and delays aren't communicated.

What Hopon does:
- **OTP login** (phone number + one-time code, no passwords, no email) tied to a purchased ticket.
- **Live bus map**, restricted to the ticket holder of that specific trip.
- **ETA + delay notifications** (in-app first, SMS via Twilio later) at 4h / 2h / 30min / 10min before the passenger's stop, plus an arrival alert.
- **Emergency contact**: one saved number is notified when the passenger arrives.
- **Boarding / alighting confirmation** and **trip history**.
- **Driver page** (post GPS, start/delay/complete, mark stop arrived/departed) and **admin console** (trips, tickets, buses, monitoring).

Goals of the project (in this order of importance): (1) a pitch-ready demo for smaller regional bus operators, (2) a portfolio piece for a junior .NET developer job search, (3) a possible future service business. The owner (Sibonelo) is not a React expert and is a full-time worker with little time: **write code a junior dev can read, explain in an interview, and maintain.**

Always call the product **Hopon** (never "the app" / "the system").

## 2. Repos and layout

- `Hopon.Api` — ASP.NET Core Web API **plus** Razor Pages for Admin and Driver. Target framework **net8.0** (see csproj; some old notes say .NET 9, ignore them).
- `hopon-passenger` — React 19 + Vite passenger app (mobile-first). Calls the API through the Vite proxy (`/api`, `/hubs` → backend; check `vite.config.js` and `launchSettings.json` for the real port).

Backend folders: `Controllers/`, `Services/` (+ `Services/Interfaces/`), `DTOs/<Area>/`, `Models/` (+ `Models/Enums/`), `Data/HoponDbContext.cs`, `Hubs/TripHub.cs`, `Filters/`, `Pages/Admin`, `Pages/Driver`, `Migrations/`, `wwwroot/`.

If the two projects are separate Git repos, keep a copy of this file in each and keep them in sync.

## 3. Stack

| Layer | Tech |
|---|---|
| Backend | ASP.NET Core Web API, EF Core 8 Code First, SQL Server |
| Realtime | SignalR (hub at `/hubs/trip`, groups named `trip-{id}`) |
| Auth | JWT bearer (passengers & drivers), OTP hashed with BCrypt |
| Admin/Driver UI | Razor Pages (server-rendered) |
| Passenger UI | React + Vite, hooks only (`useState`, `useEffect`, `useRef`) |
| Maps | **MapLibre GL JS + OpenFreeMap** (replaced Leaflet; `react-leaflet`/`leaflet` are leftover deps and can be removed) |
| SMS | Twilio — **deferred**, not wired yet |
| Hosting target | Azure App Service + Azure SQL (or IIS) |

## 4. Architecture rules

- Thin controllers, logic in services, EF Core used **directly in services** (no repository pattern).
- DTOs for all API input/output. Validate input (data annotations or explicit checks).
- `async/await` for all I/O. DI everywhere. Meaningful HTTP status codes.
- Comments only where something is non-obvious.
- Do not over-engineer. This is a solo-developer project. No MediatR, no CQRS, no Redux, no React Router, no state libraries.

## 5. Decisions already made — do not relitigate

1. **ETA uses a schedule-offset approach**: `EstimatedArrival = ScheduledArrival + (ActualDeparture − ScheduledDeparture)` (`Models/EtaCalculator.cs`). Not Haversine/distance-based, because the N3 route is non-linear and a distance ETA creates a second source of truth.
2. **Identity and access are separate layers.** JWT proves who you are. Whether you may see a trip is a **database check on every request** (`ITripAccessService` / `[RequireTripAccess]`, and `TripHub.JoinTrip`). Never put trip access into the token.
3. `TripStatusRules.IsTrackingActive` is the single place that defines "tracking active" (Scheduled, InProgress, Delayed). Reuse it; don't duplicate the status list.
4. **React has no router.** `App.jsx` owns `token`, `currentPage`, `selectedTripId` and passes props down. Page switching = changing `currentPage`.
5. React helper sub-components (`StatusBadge`, `SectionCard`, …) live below the default export in the same `.jsx` file. Feature components like `BoardingPanel` are **presentational** (props in, callbacks out; no own navigation/token handling).
6. Map: MapLibre with switchable basemaps (Positron, Liberty, Bright, Dark). The "Intercape · Live" bottom card and "Follow bus" exist; **no Pause/Resume**. Route line must stay clearly visible on all basemaps.
7. Admin **Void ticket** is kept (use case: passenger cancels before the trip starts).
8. Distinguish "API exists" from "UI exists". Backend endpoints testable in Swagger are not the same as a usable passenger feature. Don't mark a feature done until the layer the user touches exists.

## 6. Conventions

**Theming (mandatory for every UI).** Never hardcode hex values; use CSS variables: `--color-primary`, `--color-accent`, `--color-highlight`, `--color-bg`, `--color-text`, `--color-surface`, `--color-surface-alt`, `--color-border`, `--color-interactive`, `--color-interactive-glow`, `--color-danger`, `--color-success`, `--font-base`, `--font-display`, plus map tokens (`--map-*`). Dark mode is `html[data-theme="dark"]`. Light = Outfit; dark = DM Sans body + DM Serif Display headings. Theme persisted in `localStorage` key `hopon-theme` (React) and cookie `hopon-theme` (Razor). Tokens are defined in `src/index.css` and `wwwroot/css/site.css` — keep them identical.

**Razor.** Use rooted layout paths (`/Pages/Shared/_Layout`) not short names.

**EF Core.**
- `DbSet` properties must be auto-properties (`{ get; set; } = null!;`). Expression-bodied DbSets triggered a Roslyn bug during migrations.
- EF cannot translate private static helper methods inside `.Where()` — inline the comparison.
- **Never edit or delete an existing migration.** Always add a new one.
- Don't use `DateTime.UtcNow` inside `HasData` (it causes a new migration every time). Use fixed dates.

**Code style.** Match surrounding code. Clear names, short focused methods/components. Fix pre-existing bugs you hit *inline in the same PR* and mention them in the PR description.

## 7. How to work

- **One task per branch / PR**, taken in order from `docs/HANDOFF.md`. Don't start the next task in the same PR.
- Before opening a PR: `dotnet build` (0 errors), `dotnet test` (once tests exist), and in `hopon-passenger`: `npm run lint` and `npm run build`.
- Every PR description: what changed, why, how to test (exact commands / URLs / sample requests), any migration added, anything you were unsure about.
- If a requirement is ambiguous, pick the simplest option consistent with section 5, **write the assumption in the PR description**, and continue. Don't stall.
- Update the checklist at the top of `docs/HANDOFF.md` when a task is done.
- Deliver full working files, not fragments of pseudo-code. No `TODO` for critical paths; if something must be deferred, say so explicitly in the PR.
- Never commit secrets (JWT key, connection strings, Twilio keys). Use user-secrets / environment variables.
- Keep the demo runnable: after your change, `dotnet ef database update` + `dotnet run` + `npm run dev` must still give a working login → map flow.

## 8. Commands

```
# backend (from Hopon.Api)
dotnet build
dotnet run
dotnet ef migrations add <Name>
dotnet ef database update

# passenger app (from hopon-passenger)
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build
```

Swagger is available in Development. Demo passengers are seeded in migrations: `+27789689875`, `+27835944077`, `+27814629100`. Demo driver: username `driver1` (id 2).

## 9. Privacy (POPIA) rules that apply to all work

- Collect only what's needed (phone number, ticket ref, trip data).
- OTPs stored hashed only; never log an OTP outside Development.
- No passenger may see another passenger's data. Tracking is limited to the ticket holder of that trip.
- Rate-limit OTP requests.
- Personal data must be deleted/anonymised after a retention period (default 90 days post-trip).
- Location and notification access should be auditable.

## 10. Do not

- Do not rewrite the app in another framework or add a router/state library.
- Do not replace MapLibre with Leaflet.
- Do not build the "campus safety app" or BLE mesh — separate future project.
- Do not add Redis. A SignalR backplane is not needed at demo scale.
- Do not expose live tracking on any public/unauthenticated route.
