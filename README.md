# StoryBook by MainStory: library app for parents and kids

Vite + React + TypeScript single-page app for the Digital Storybook Library (parent and child views).
It has no database of its own: every read and write goes through the backend API in `../storybook_library_app`,
which shares one PostgreSQL database with `storybook_management_app` (that repo owns the schema and seed data).

- Spec and decisions: [docs/specs/storybook-library-app.md](docs/specs/storybook-library-app.md)
- Design: [docs/design/mainstory-apps.dc.html](docs/design/mainstory-apps.dc.html) (section `#library`)
- API contract: `../storybook_library_app/docs/API-contracts.md`

## Run it

Start the backend first, as described in its README: `make -C ../storybook_management_app db-up migrate seed`,
then `make run` in `storybook_library_app` (API on http://localhost:9999).

```bash
corepack enable pnpm        # once
pnpm install
cp .env.example .env.local  # VITE_API_BASE_URL, default http://localhost:9999/api/v1
pnpm dev                    # http://localhost:5173
```

The backend seed creates the accounts and the plan but no books. To add the six sample books from the design, run the seed script. It calls the backend's admin API, so the books land in the shared database:

```bash
ADMIN_PASSWORD=... python3 scripts/seed-books.py   # API_BASE_URL defaults to http://localhost:9999/api/v1
```

Log in with the backend's seeded mock parent account. Accounts are created by `make seed` in `storybook_management_app` from its `SEED_PARENT_*` / `SEED_ADMIN_*` env vars (see the backend README). The seed script and E2E read them from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and `E2E_PARENT_EMAIL` / `E2E_PARENT_PASSWORD`, so no password is stored in this repo.

## Checks

| Purpose                | Command                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck              | `pnpm typecheck`                                                                                                                  |
| Lint                   | `pnpm lint`                                                                                                                       |
| Format                 | `pnpm format`                                                                                                                     |
| Unit + component tests | `pnpm test` (single file: `pnpm vitest run <path>`)                                                                               |
| E2E                    | `E2E_PARENT_PASSWORD=... pnpm e2e` (backend + seeded books required; `E2E_API_BASE_URL` defaults to http://localhost:9999/api/v1) |
| Production build       | `pnpm build`                                                                                                                      |

The E2E specs change data: they buy books, set PIN 1234, and subscribe then cancel on the seeded parent account. They run against the backend's shared database, so they change the seeded parent's data. The buy test skips once no locked books are left.
