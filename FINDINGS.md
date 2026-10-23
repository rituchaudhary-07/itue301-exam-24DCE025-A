# Examination Findings Report: Campus Event Hub

This document summarizes the architectural and logical issues identified in the starter code across Tasks 1–5, their impact, and the corresponding solutions implemented.

---

## T1 — The Event Listing (Components and Props)

### What was wrong
The starter code lacked proper formatting rules for dates, event durations, registration fees, and seat availability. Dates were rendered as raw unformatted strings (e.g. `2026-11-05`), durations displayed crude raw minutes without converting into hours/minutes or omitting zero components (e.g. showing `90` or `1 h 0 min`), fees displayed as unformatted numbers without currency or "Free" indicators for zero-fee events, and seat statuses did not distinguish between available seats and "Full". Additionally, list rendering lacked unique key props, causing React console warnings.

### Why it mattered
Presenting raw data diminished user experience, caused confusion regarding whether an event was free or paid, gave unclear duration estimates, and polluted the browser console with React key warnings during render cycles.

### How you fixed it
- Implemented utility functions in `src/utils/formatters.js`:
  - `formatDate`: Converts ISO/date strings into `DD Mon YYYY` format (e.g., `05 Nov 2026`).
  - `formatDuration`: Converts minutes into hours and minutes, omitting any zero part (e.g., `90` $\to$ `"1 h 30 min"`, `45` $\to$ `"45 min"`, `120` $\to$ `"2 h"`).
  - `formatFee`: Renders `₹` with two decimal places (e.g., `₹150.00`) or `"Free"` when the fee is `0`.
  - `formatSeatStatus`: Displays `"<n> seats left"` when seats exist, or `"Full"` when seats are `0`.
- Built `src/components/EventCard.jsx` to render all required fields (title, category badge, formatted date, formatted duration, formatted fee, and formatted seat status).
- Built `src/components/EventList.jsx` to map events using `event.id` as unique React keys to ensure zero console warnings.

---

## T2 — The Registration (Routing and State)

### What was wrong
The starter application did not manage routing cleanly without full page reloads. The registration form lacked required field validation, allowed registrations even when events were completely full, allowed students to register indefinitely under the same email without restriction, and did not apply institutional student discounts for university emails. Furthermore, seat counts and total payable amounts were not dynamically tracked or restored upon cancellation.

### Why it mattered
Without proper client-side state handling and refusal logic, events would suffer from overbooking, student email abuse could monopolize seats, university students would not receive their entitled tuition discounts, and full-page reloads would cause catastrophic loss of client application state.

### How you fixed it
- Implemented SPA tab-based routing in `src/App.jsx` switching seamlessly between `Events`, `Register`, and `Organisers` without triggering browser reloads.
- Developed `src/components/RegistrationPage.jsx` with strict business rule validations:
  - **Empty Input Refusal**: Rejects empty name or email with the exact message `"Name and email are required"`.
  - **Seat Availability Refusal**: Computes remaining seats dynamically (`event.seats` minus active registrations). If remaining seats $\le 0$, refuses submission with `"Event is full"`.
  - **Registration Limit Refusal**: Tracks registration counts per email. If an email already has 3 registrations, refuses submission with `"Limit of 3 registrations reached"`.
  - **Institutional Discount**: Checks if email ends with `@charusat.edu.in`. If so, charges 80% of the fee (20% discount); otherwise charges full fee.
  - **Live Indicators & Cancellation**: Displays `"Seats left: <n>"` for the chosen event, `"Total payable: ₹<amount>"` across all active registrations, and a cancel button per registration that immediately restores the event seat and reduces the total payable.

---

## T3 — The Organisers Directory (API Consumption)

### What was wrong
The organisers directory was not consuming remote data properly. The API call either triggered on every component re-render or lacked loading state feedback. Organisers were rendered in arbitrary API order without case-insensitive alphabetical sorting, and network errors or non-2xx HTTP responses resulted in unhandled promise rejections or white-screen errors without any retry capability.

### Why it mattered
Failing to handle asynchronous network lifecycles properly resulted in poor UX (no loading indicator), unhandled browser crashes during API interruptions, disorganised lists, and inability for users to recover without completely reloading the application.

### How you fixed it
- Built `src/components/OrganisersDirectory.jsx`:
  - **Single Request on Mount**: Invokes `https://jsonplaceholder.typicode.com/users?_limit=10` using `useEffect` with a `useRef` guard to guarantee the fetch is executed exactly once on opening.
  - **Loading State**: Displays `"Loading organisers..."` while the request is in progress.
  - **Case-Insensitive A–Z Sorting**: Sorts fetched users alphabetically by name using `a.name.toLowerCase().localeCompare(b.name.toLowerCase())`.
  - **Organiser Card & Count**: Displays each organiser with name, company name (`user.company.name`), email, and a header badge showing `"<n> organisers"`.
  - **Error Handling & In-Place Retry**: Wraps execution in `try...catch` and verifies `response.ok` (200–299). On failure, shows `"Could not load organisers"` along with a `"Retry"` button that re-executes the fetch without reloading the page.

---

## T4 — The Events Service (Express and Middleware)

### What was wrong
The backend Express service lacked structured input validation for creating events, failed to enforce maximum fee query filtering, lacked route parameter existence checks on `GET` and `DELETE`, had no request audit logging, and crashed the server or leaked internal stack traces to clients during unhandled runtime exceptions.

### Why it mattered
Missing validation allowed invalid data (such as blank titles, fractional capacities, or capacities beyond 500) into the system. Missing 404 handlers broke REST API contracts, lack of logging prevented audit tracking, and exposing stack traces in 500 responses created critical security vulnerabilities.

### How you fixed it
- Implemented `server.js`:
  - **Logging Middleware**: Added `app.use((req, res, next) => ...)` logging exactly one line per incoming request: `[METHOD] [PATH] [TIMESTAMP]`.
  - **POST `/api/v1/events`**: Validates that `title` is a string between 1 and 80 characters after trimming, `capacity` is a whole integer between 1 and 500, and `fee` is a number $\ge 0$ (defaulting to 0). Responds with `400 { "error": "..." }` on invalid inputs, or `201` with `{ id, title, capacity, fee }` on success.
  - **GET `/api/v1/events`**: Returns status 200 with all events, filtering by `?maxFee=n` if provided.
  - **GET & DELETE `/api/v1/events/:id`**: Responds with `200` when the event exists, or `404 { "error": "..." }` when not found.
  - **Error Handling**: Implemented test endpoint `GET /api/v1/boom` that deliberately throws an error. Added global 4-parameter error middleware `(err, req, res, next)` responding with `500 { "error": "Something went wrong" }` with **zero stack trace** in the response.

---

## T5 — The Event Data (MongoDB and Mongoose)

### What was wrong
The MongoDB data model lacked domain-specific schema constraints. Specifically, cultural events had no constraint preventing capacities exceeding 200, date validation accepted invalid date formats, fees could be set to negative values, and Mongoose validation errors returned complex internal Mongoose structures rather than a standardized, clean error response object. Furthermore, there was no automated script to seed valid events and verify validation formatting.

### Why it mattered
Without database-level validation, business rules could be easily bypassed, resulting in illegal data states (e.g. overcapacity cultural gatherings or negative pricing). Without formatted validation errors, client applications could not predictably parse and display field-specific error messages.

### How you fixed it
- Defined Mongoose schema in `models/Event.js`:
  - `title`: String, required, trimmed, max length 80.
  - `date`: Date, required, validated as real date.
  - `category`: Enum `['tech', 'cultural', 'sports']`, default `'tech'`.
  - `createdAt`: Date, default `Date.now`.
  - `capacity`: Number, required, integer between 1 and 500. Added custom validator ensuring that `if (category === 'cultural') capacity <= 200`.
  - `fee`: Number, default `0`, min `0`.
- Created `utils/formatValidationError.js`: Extracts Mongoose `err.errors` into `{ error: "Validation failed", details: [ { field, message }, ... ] }`.
- Created `seed.js`: Connects to MongoDB, saves valid events, tests validation rejection on an invalid event, prints the formatted error object, and captured screenshot evidence in `evidence/db.png`.
