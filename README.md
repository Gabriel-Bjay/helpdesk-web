# Help Desk System (Frontend)

Angular client for a support ticketing platform, backed by [helpdesk-api](https://github.com/Gabriel-Bjay/helpdesk-api).

## Features

- **Ticket management** — create, view, and track support tickets through to resolution
- **Categories** — organize tickets by category
- **User & admin views** — separate dashboards for regular users and admins, with an admin-only guard on top of standard auth
- **Authenticated access** — token-based login with route guards and an HTTP interceptor that attaches auth headers to every request
- **Data grids** — DevExtreme-powered tables for browsing tickets and records

## Tech stack

- **Framework:** Angular 21 (standalone components)
- **UI components:** DevExtreme
- **Backend:** [helpdesk-api](https://github.com/Gabriel-Bjay/helpdesk-api) (Laravel REST API)

## Getting started

```bash
git clone https://github.com/Gabriel-Bjay/helpdesk-web.git
cd helpdesk-web
npm install
ng serve
```

The app expects the API at the URL configured in `src/environments/environment.ts` (defaults to `http://localhost:8000/api` — see [helpdesk-api](https://github.com/Gabriel-Bjay/helpdesk-api) for running the API locally).

## Related

- [helpdesk-api](https://github.com/Gabriel-Bjay/helpdesk-api) — Laravel API this app talks to
