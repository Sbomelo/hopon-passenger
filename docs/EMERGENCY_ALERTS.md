# Emergency contact arrival alerts (Task 7)

Driver stop arrival calls `INotificationService` after saving the arrival. Active
tickets ending at that stop qualify if their passenger has a saved emergency
contact. The contact does not need a Hopon account. SMS goes to the contact's
stored number through `ISmsSender` with exactly:

```text
Hopon: Thandi has arrived safely at Johannesburg Park Station.
```

The first whitespace-delimited part of the passenger's full name is used, including
hyphenated first names. A missing name uses `Passenger`. No surname, route, trip
reference, coordinates or link is included.

One `Emergency` / `Sms` notification belongs to the **passenger**, with `TripId`
set. Its message names the contact but never copies the contact's phone number or
provider errors. The passenger dashboard's **Emergency contact alerts** feed reads
`GET /api/notifications/my` on mount and every 30 seconds. It shows these outcomes:

| Outcome | Status | Passenger message | SentAt |
| --- | --- | --- | --- |
| Provider accepts SMS | Sent | We told Mom you arrived. | UTC send time |
| Provider fails or throws | Failed | We could not tell Mom you arrived. SMS failed. | null |
| SMS switch off or Emergency excluded from allowlist | Pending | SMS disabled: we have not told Mom you arrived. | null |
| Logging provider accepts simulated message | Pending | SMS simulated: we have not told Mom you arrived. | null |

`Sent` means provider acceptance, as in Task 6; handset delivery receipts are not
implemented. Logging sends no real SMS, so it does not claim to have told the
contact. Its result now carries `IsSimulated`; OTP and existing passenger reminder
behavior is unchanged.

## Completion fallback and duplicate prevention

`DriverTripService.CompletedAsync` saves completion and then checks tickets ending
at the highest `TripStop.SequenceOrder` of that trip. This covers a driver who
completes without marking the final stop Arrived, including a final stop already
marked Departed or Skipped. It does not invent stop arrival timestamps/statuses or
send arrival alerts for missed intermediate stops. Trips without stops and legacy
tickets without destinations are skipped.

Migration `20261117124718_AddUniqueEmergencyAlerts` adds a filtered unique key on
`(UserId, TripId, Type)` where `Type = Emergency` and `TripId` is set. It spans all
channels and statuses. The Pending row is saved **before** external sending, so
repeated arrival toggles, overlapping requests and completion share one claim.
Existing migrations and rows are preserved; reminder/arrival channel uniqueness
and repeatable delay notifications are unchanged.

There is **one attempt, no automatic retry**. Failed, disabled and simulated rows
also suppress future attempts. Enabling SMS later does not backfill old alerts.
A process crash or database failure after a claim can leave Pending with an
unknown delivery outcome; Hopon deliberately does not resend an ambiguous attempt.
The scheduler does not retry emergency alerts. Inactive (voided) tickets are
excluded in both arrival and completion queries.

This is the driver's completion path. Admin status-flow consolidation remains
Task 8, including the existing admin completion bypass. The dashboard feed here
only covers emergency arrival outcomes; the general feed/unread UI remains Task 9.

## Run and verify

```powershell
# C:\dev\my-project\backend
dotnet build
dotnet test --no-build
dotnet test tests/Hopon.Api.Tests --filter FullyQualifiedName~EmergencyAlertTests
dotnet ef database update --no-build -- --environment Development
dotnet ef migrations has-pending-model-changes --no-build -- --environment Development
dotnet run --no-build --launch-profile http

# C:\dev\my-project\frontend
npm run lint
npm run build
node --test tests/*.test.mjs
npm run dev
```

For an older database containing manually created Emergency rows, first check for
duplicate keys; index creation intentionally fails rather than deleting history:

```sql
SELECT UserId, TripId, Type, COUNT(*) AS RowCount
FROM NotificationLogs
WHERE TripId IS NOT NULL AND Type = 6
GROUP BY UserId, TripId, Type
HAVING COUNT(*) > 1;
```

Use the default Logging provider for a no-cost check. In Development, set
`Notifications__SmsEnabled=true` and keep `Emergency` in `Notifications:SmsTypes`.
Save the contact at [Hopon](http://localhost:5173), then use the authenticated
[driver page](http://localhost:5101/Driver) to mark that passenger's destination
Arrived. Open **My trips** to see the Pending simulation message. With SMS disabled,
expect the Pending `SMS disabled` message instead. For a separate trip, complete
without arriving at the final stop: only final-stop passengers should get a row.

The completion API is `POST /api/driver/trips/{tripId}/complete` with a driver bearer
token. The contact API is `PUT /api/emergency-contact` with a passenger bearer token:

```json
{ "name": "Mom", "phoneNumber": "+27820000001" }
```

This synthetic test number must not be used for real delivery. Real SMS requires
Twilio setup and a consenting test recipient following `docs/SMS.md`. Automated
tests use fake senders only and never call Twilio. They cover exactly once,
concurrent requests, duplicate database keys across statuses/channels, missing
contacts, failed/throwing providers, disabled/filter/simulation status, final-stop
completion fallback, voided tickets, whitespace in first names and private feeds.
