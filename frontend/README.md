# Campus Connect: React frontend

React 18 + Vite + React Router + Axios. No UI framework: the design system is a single
hand-written stylesheet (`src/index.css`) with light and dark themes.

## Run it

```bash
# 1. backend (from the Campus-Connect project root)
uvicorn backend.app.main:app --reload          # http://localhost:8000

# 2. frontend (this folder; put it at Campus-Connect/frontend)
npm install
npm run dev                                    # http://localhost:5173
```

The API URL lives in `.env` (`VITE_API_BASE_URL`, default `http://localhost:8000/api/v1`).
Your CORS list only allows port **5173**, so `vite.config.js` uses `strictPort`.

## First-run data (needed because of a backend gap, see bug 2)

There is no API path that creates the first admin or the first organizer. After registering
your own account in the UI, run this once against your database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
-- after creating a club in the UI, make yourself its organizer:
INSERT INTO club_memberships (user_id, club_id, role, status, joined_at)
VALUES (1, 1, 'organizer', 'active', CURRENT_TIMESTAMP);
```

After that, everything (approving members, promoting organizers) works from the UI.

## Screens

| Route | Who | What |
|---|---|---|
| `/` `/login` `/register` | public | landing (live events), auth |
| `/home` | everyone | stats, next tickets, activity |
| `/events`, `/events/:id` | everyone | search, club/category/date filters, register and cancel |
| `/clubs`, `/clubs/:id` | everyone | browse, join; admins create, edit, deactivate |
| `/tickets`, `/my-clubs` | everyone | registrations, memberships |
| `/profile` | everyone | name, password, deactivate |
| `/organizer` | organizers | dashboard totals per club |
| `/manage/:clubId` | organizers | events (draft, publish, edit, complete, cancel, delete), join requests, members |
| `/manage/:clubId/events/:id/participants` | organizers | participants and CSV export |

Organizer rights are per club, so the app derives them from `/users/me/clubs` (active membership with role `organizer`).

## Structure

```
src/api/         axios client (error normalising, 401 handling) + one function per endpoint
src/context/     auth, clubs list (to resolve names), toasts
src/hooks/       useAsync, useDebounce, useRegisteredIds, useTitle
src/components/  Layout, EventTicket, ClubCard, form modals, ui primitives
src/pages/       one file per screen
src/utils/       date formatting, colours, organizer event cache
```

## Backend issues found (backend left unchanged)

All of these were reproduced against your running API. The frontend works around each one.

1. **CSV export route is doubled**: `participant.py` has `prefix="/clubs"` and the path also starts with `/clubs/...`, so it is served at `/api/v1/clubs/clubs/{club_id}/events/{event_id}/participants/export`. Fix: drop the extra `/clubs` from the path. The UI tries the correct path first, then the current one.
2. **No way to bootstrap an organizer.** Approving requests needs an organizer; promoting needs an existing membership; an admin who is not an organizer gets 403 on `GET /clubs/{id}/members` and `/membership-requests`. Fix: let admins pass `get_current_club_organizer`, or create an organizer membership when a club is created.
3. **Organizers cannot see their own drafts.** `GET /events` and `GET /events/{id}` only return `published`, so drafts, cancelled and completed events cannot be listed or fetched. Suggested: `GET /clubs/{club_id}/events` for organizers. Workaround: the manage screen remembers events on that device (`src/utils/eventCache.js`).
4. **Mixed-case emails can never log in.** Register stores the email as typed (`Mixed@x.com`), login lowercases it before comparing. Fix: store `user_data.email.lower()`. The UI lowercases emails on register and login.
5. **Dashboard counts pending/rejected clubs.** In `dashboard_service.py` the `ClubMembership.status == 'active'` condition is passed as the second argument of `db.scalar(...)` (that is `params`), not inside `.where(...)`. Verified: 3 memberships (1 active) returned 3. The UI counts active memberships itself.
6. **Timezone-aware datetimes crash event updates** with HTTP 500 (`can't compare offset-naive and offset-aware datetimes` in `update_event`), because SQLite returns naive values. The UI always sends naive ISO strings. `registration_service` also mixes `datetime.now()` and `datetime.now(timezone.utc)`.
7. **Participants list returns only `user_id`** (no name or email). The UI resolves names from the club member list; the CSV has full details.
8. **`requirements.txt` lists `jwt==1.4.0` next to `PyJWT`.** Both provide the `jwt` module and can shadow each other. Remove `jwt==1.4.0`.
9. Smaller: events do not expose a registered count, so the UI cannot show "seats left"; tokens last 30 minutes with no refresh (the UI logs out on 401 and says why); `.env` was inside the zip, so rotate `SECRET_KEY` if it was ever shared.
