# Hopon passenger

[![Frontend CI](https://github.com/Sbomelo/hopon-passenger/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Sbomelo/hopon-passenger/actions/workflows/ci.yml)

React 19 + Vite passenger UI using **MapLibre GL JS + OpenFreeMap** and SignalR. The companion backend is ASP.NET Core **.NET 8**: [Hopon.Api](https://github.com/Sbomelo/Hopon.Api).

## Run the demo

Start the companion backend with the seeded Durban to Johannesburg trip. The backend README includes the prerequisites, migration and seeding commands, simulator controls and 60-second pitch checklist. [Backend demo instructions](https://github.com/Sbomelo/Hopon.Api/blob/7feb731059386820c484e5b3004d135a37ca4afd/README.md#run-the-demo)

Run `npm ci` and `npm run dev` here. Open the passenger view, request an OTP for **+27600000001** and enter the code shown in Development. Open the simulator in a second window to drive the bus while the passenger watches. [Passenger view](http://localhost:5173) · [Admin simulator](http://localhost:5101/Admin/Simulator)

## Testing

With Node.js 22, run `npm ci`, `npm run lint`, `npm run build`, and `node --test` from this repository root. Run `dotnet test` from the companion backend repository.

