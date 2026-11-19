# Student Course Registration & Feedback – Server-Side Validation (Express.js)

## Problem Statement
Design, develop and deploy a web application to demonstrate **server-side validation using Express.js**.
Browser (client-side) validation can be disabled or bypassed with DevTools, curl or Postman, so it cannot
be trusted. This app lets students register for a course and submit feedback, while **every input is validated
on the server** with `express-validator`. Invalid data is rejected with field-wise errors; valid data is saved
to a JSON file so it survives restarts.

## Run
```bash
npm install
npm start
# open http://localhost:3000
```

## Structure
```
server.js                          Express app + routes
catalog.js                         Departments -> courses (shared by server & client)
store.js                           JSON-file storage (data/registrations.json)
validators/registrationValidator.js  All validation rule chains
middleware/validate.js             Collects errors -> 422 JSON
public/                            index.html, app.js (fetch), style.css
data/registrations.json            Saved registrations
```

## Validation rules
| Field | Rules |
|---|---|
| studentName | required, 3-50 chars, letters/space/. ' - only |
| prn | required, exactly 12 digits (e.g. 202101234567) |
| email | required, valid format, normalised |
| phone | required, 10-digit Indian mobile (starts 6-9) |
| dob | required, valid ISO date, not future, age 16-40 |
| department | required, must be one of the catalog departments |
| year | required, integer 1-4 |
| course | required, must exist, **must belong to the chosen department**, **no duplicate registration**, **max 3 courses per student** |
| rating | required, integer 1-5 |
| feedback | required, 10-300 chars, no `<` or `>` |
| declaration | must be checked |
| `:id` (DELETE) | positive integer (route-param validation) |
| `?department=` (GET) | must be a known department (query validation) |

## API
| Method | Endpoint | Result |
|---|---|---|
| GET | `/api/catalog` | departments and courses |
| GET | `/api/registrations[?department=X]` | list registrations |
| POST | `/api/registrations` | `201` saved / `422` with `errors:{field:msg}` |
| DELETE | `/api/registrations/:id` | `200` deleted / `404` / `422` |

## Prove it is server-side (bypass the browser)
```bash
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"studentName":"A1","prn":"123","email":"bad","year":9}'
```
The response is `422` with a message for every bad field.

## Deploy (Render / Railway)
- Build command: `npm install`  |  Start command: `npm start`
- `PORT` is read from the environment automatically.
- Note: free tiers have an ephemeral disk, so the JSON file may reset on redeploy. Use a database for permanent storage.

## Viva questions
1. Why is client-side validation not enough?
2. What is the difference between validation and sanitisation? (see `.trim()`, `.toInt()`, `.normalizeEmail()`)
3. Why return HTTP 422 for invalid data?
4. How does the validator run before the route handler? (middleware chain)
5. What is a cross-field validation? (course must belong to department)
6. Why whitelist fields before saving?
