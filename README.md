# Hopon passenger

React 19 + Vite passenger UI using **MapLibre GL JS + OpenFreeMap** and SignalR. The companion backend is ASP.NET Core **.NET 8**: [Hopon.Api](https://github.com/Sbomelo/Hopon.Api).

## Local run

Start the backend first using its root README: configure `ConnectionStrings:HoponDb` and `Jwt:Key` with `dotnet user-secrets`, run `dotnet ef database update -- --environment Development`, then `dotnet run --launch-profile http`. The API must listen at **http://localhost:5101**.

From this repository root (named `frontend` in the shared workspace), using Node.js 20.19+ or 22.12+ and npm:

```powershell
npm install
npm run lint
npm run build
npm run dev
```

Open **http://localhost:5173**. Both `/api` and `/hubs` proxy to **http://localhost:5101**, including SignalR WebSockets. `Hopon.Api.http`, the backend launch profile and both READMEs use that port.

Use an existing local passenger's exact phone number, request the Development OTP, enter the displayed code and press Enter. With no active ticketed trip, choose **Back to my trips** to view the dashboard. With an active trip, **Trips** opens the dashboard and **Track on map** opens the map. Migrations seed passengers and a driver only; a fresh database has no route/bus/trip demo. See [the verified inventory](docs/HANDOFF.md) for missing features and local verification limits.

Task 0 removed unused Leaflet/add packages and fixed stale SignalR callbacks. Lint and build pass; the bundle-size warning and seven npm audit findings remain documented for later work.
