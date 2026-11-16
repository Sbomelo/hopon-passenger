# Hopon identities

| Identity | Issued by | Allowed surface |
| --- | --- | --- |
| Passenger JWT | Phone OTP verification at `/api/auth/otp/verify` | Passenger trips, notifications, emergency contact and `/hubs/trip`; requires the `Passenger` role. |
| Driver JWT | Username/password login at `/api/driver/auth/login` | `/api/driver/*`; requires the `Driver` role. The `username` claim contains `Driver.Username`. |
| Staff cookie | `/Staff/Login` | Razor pages only: `AdminOnly` for `/Admin`, `DriverOnly` for `/Driver`, using the separate `StaffCookie` scheme. It does not authenticate API or hub calls. |

JWT `NameIdentifier` is the corresponding User or Driver ID. These IDs can overlap: the role must be authorized before treating an ID as a passenger or driver. JWT signature, issuer, audience and lifetime are validated, with one minute of clock skew and `ClaimTypes.Role` as the role claim type. Bearer headers authenticate API calls; the `access_token` query string is accepted only under the `/hubs` path segment for SignalR transports.

A passenger role is not a ticket. Trip access remains a database check on every trip-specific request and `TripHub.JoinTrip`; only a ticket holder can join that trip's group while tracking is active. Driver ownership checks also remain in place.

## Deploying Task 2

**Passengers must log in again after deployment.** Previously issued passenger tokens have no role and now receive 403. Hopon's passenger UI clears the saved token and returns to OTP login when an authenticated API call returns 401 or 403. Anonymous OTP errors stay on the login form. Existing driver JWTs retain their Driver role; staff cookie authentication is unchanged. No database migration is needed.

## Verification

From `backend`, run `dotnet build` and `dotnet test tests/Hopon.Api.Tests/Hopon.Api.Tests.csproj`. From `frontend`, run `node --test tests/auth-failure.test.mjs`, `npm run lint` and `npm run build`.

For local acceptance, start the API at `http://localhost:5101` and the passenger UI at `http://localhost:5173`. Use `Hopon.Api.http` to request/verify an OTP and log in a driver; copy the returned tokens into its placeholders. An active trip must be assigned to the driver for the successful driver response (otherwise it correctly returns 404). A passenger needs an active ticket on a tracking-active trip to view the live map.

- Passenger JWT: `/api/trips/my-trips` returns 200; `/api/driver/my-trip` returns 403.
- Driver JWT: `/api/trips/my-trips` returns 403; `/api/driver/my-trip` returns 200 with that assignment.
- Driver JWT: hub negotiation and direct hub transport requests return 403, so no connection can invoke `JoinTrip`. Passenger hub negotiation succeeds, including a query token; API query tokens return 401.
- In the browser, log in with an OTP, open a ticketed active trip and confirm the map and live connection load. Set `hopon_token` in browser storage to a driver JWT or an old role-less passenger JWT and reload: the next API 403 must clear it and show OTP login. An expired/invalid JWT must do the same on 401.
- A wrong OTP must display its error without resetting the login form. Other errors such as an unavailable trip (404) must not sign out the passenger.

The isolated SQLite integration tests create active trips and test OTP → map data → a real SignalR WebSocket `JoinTrip`, including rejection of an unticketed trip. They also cover colliding identity IDs, old tokens, invalid signatures and the expiry tolerance without changing local demo records.
