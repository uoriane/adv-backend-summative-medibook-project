# MediBook Clinic Appointment API

MediBook is an Express/MySQL/Redis backend for booking and cancelling clinic appointments.

Video Walkthrough

[Watch the video walkthrough](https://youtu.be/G8pP90HZzqo?si=7YcW0DFqik3oRIf9)

## Requirements

- Node.js 18 or newer
- MySQL 8
- Redis 6 or newer

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a MySQL database and load the schema and sample data:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```
3. Copy `.env.example` to `.env` and set the local credentials.
4. Start Redis.
5. Start the API:
   ```bash
   npm start
   ```
6. Start the separate worker process:
   ```bash
   npm run worker
   ```
7. Run unit tests:
   ```bash
   npm test
   ```

The API listens on `http://localhost:3000` by default.

## Main endpoints

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/patients` | List/create patients |
| GET/PUT/DELETE | `/patients/:id` | Read/update/delete a patient |
| GET/POST | `/doctors` | List/create doctors |
| GET/PUT/DELETE | `/doctors/:id` | Read/update/delete a doctor |
| POST | `/appointments` | Book an appointment |
| GET | `/appointments/:id` | Read an appointment |
| DELETE | `/appointments/:id` | Cancel and refund |
| POST | `/appointments/waitlist` | Join a waitlist for a future slot |
| GET | `/doctors/:id/statistics` | Doctor statistics |
| GET | `/reports/doctors` | Doctors and revenue report |
| GET | `/reports/busy-days` | Doctors/dates above 80% capacity |
| GET | `/feedback?lang=en` or `?lang=fr` | Localized feedback page |

## Booking rules

Appointments use fixed 30-minute slots from 09:00 through 16:30. Both the 12-per-day cap and doctor-slot uniqueness are enforced inside a transaction. The doctor row is locked during the transaction, and MySQL's `UNIQUE (doctor_id, active_slot)` constraint is the final concurrency guard. Cancelled appointments set `active_slot` to `NULL`, so the original slot can be booked again while the cancellation record remains.

Refund policy:

- More than 48 hours notice: 100%
- Exactly 24 through 48 hours: 50%
- Less than 24 hours: 0%

Exactly 24 and 48 hours use the 50% tier. Refund and cancellation are committed atomically.

## Audit log

Successful bookings and cancellations call an asynchronous `fs.promises` audit logger. It creates `logs/` and appends a JSON line to `logs/audit.log`. Logging failures are reported to the server console but never replace or fail the user's successful database operation.

## Redis and worker

The web server offers a Redis slot waitlist when the same-slot or same-day limit is reached. It pushes cancellation promotion jobs to Redis, and `npm run worker` runs a separate worker process. The worker removes the first waitlisted entry and attempts to book it. A failed promotion is pushed back onto the waitlist before the worker continues, so the patient is not lost. Confirmations are Redis jobs that the worker processes into the audit log.

## Database diagram

The normalized 3-table diagram is stored at `schema-diagram.png`.
