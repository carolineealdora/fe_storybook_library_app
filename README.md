# StoryBook by MainStory: library app for parents and kids

Vite + React + TypeScript single-page app for the Digital Storybook Library (parent and child views).
It has no database of its own: every read and write goes through the backend API in `../storybook_library_app`,
which shares one PostgreSQL database with `storybook_management_app` (that repo owns the schema and seed data).

- Spec and decisions: [docs/specs/storybook-library-app.md](docs/specs/storybook-library-app.md)
- Design: [docs/design/mainstory-apps.dc.html](docs/design/mainstory-apps.dc.html) (section `#library`)
- API contract: `../storybook_library_app/docs/API-contracts.md`

## Run it

Start both backends first, as described in their READMEs:

- `storybook_management_app`: `make db-up migrate seed`, then `make run`. It owns the database and serves the back-office (admin) API.
- `storybook_library_app`: `make run`. It serves the parent API this app uses.

Both backends default to port 9999, so locally one of them runs elsewhere (e.g. the library API with `PORT=9998`). Point this app at the **library** API:

```bash
corepack enable pnpm        # once
pnpm install
cp .env.example .env.local  # set VITE_API_BASE_URL to the library API, e.g. http://localhost:9998/api/v1
pnpm dev                    # http://localhost:5173
```

The backend seed creates the accounts and the plan but no books. To add the six sample books from the design, run the seed script. It uploads them through the **management app's** admin API, so they land in the shared database:

```bash
ADMIN_EMAIL=... ADMIN_PASSWORD=... API_BASE_URL=http://localhost:9999/api/v1 python3 scripts/seed-books.py
```

Log in with the backend's seeded mock parent account. Accounts are created by `make seed` in `storybook_management_app` from its `SEED_PARENT_*` / `SEED_ADMIN_*` env vars (see the backend README). The seed script and E2E read them from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and `E2E_PARENT_EMAIL` / `E2E_PARENT_PASSWORD`, so no password is stored in this repo.

## Checks

| Purpose                | Command                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| Typecheck              | `pnpm typecheck`                                                                                               |
| Lint                   | `pnpm lint`                                                                                                    |
| Format                 | `pnpm format`                                                                                                  |
| Unit + component tests | `pnpm test` (single file: `pnpm vitest run <path>`)                                                            |
| E2E                    | `E2E_PARENT_EMAIL=... E2E_PARENT_PASSWORD=... E2E_API_BASE_URL=<library API> pnpm e2e` (seeded books required) |
| Production build       | `pnpm build`                                                                                                   |

The E2E specs run against the shared database and change the seeded parent's data: they buy a book, set PIN 1234, and cancel and restart the subscription (ending on the plan the account started with). The buy test skips while the account is subscribed or once no locked books are left.

For a check that changes nothing, run only the smoke spec. It opens every screen as the seeded parent (including Child view) without buying, subscribing or touching the PIN:

```bash
E2E_PARENT_EMAIL=... E2E_PARENT_PASSWORD=... E2E_API_BASE_URL=http://localhost:9998/api/v1 pnpm e2e smoke
```
