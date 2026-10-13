# BACKEND: layered architecture

Laravel-style layers on Next.js route handlers and Drizzle. Every API request travels the same path, and each layer has one job.

## Request flow

```text
HTTP request
 -> routes       app/api/**/route.ts       maps HTTP method to a controller function
 -> middleware   with-handler, with-auth   error handling, session check (wrappers)
 -> request      server/requests           parse and validate input, authorize
 -> controller   server/controllers        orchestrate one endpoint, return the HTTP response
 -> service      server/services           business rules, cache invalidation
 -> model        server/models             database queries (Drizzle) for one table
 -> resource     server/resources          shape rows into API JSON
 -> JSON response
```

## Layer rules

| Layer      | Location              | Responsibility                                                                                                                                                     | May call                                 | Must not                                                 |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------- |
| Route      | `app/api/**/route.ts` | One line per HTTP method that passes the request to a controller function, wrapped by middleware                                                                   | middleware, controller                   | contain logic, touch the database, validate input        |
| Middleware | `server/middleware/`  | `with-handler` (maps errors to JSON responses), `with-auth` (session check, default deny)                                                                          | errors, http helpers                     | contain business logic                                   |
| Request    | `server/requests/`    | Read body, query and route params, validate with the shared zod schema, authorize, return typed input; throw `ValidationError`                                     | schemas (`lib/schemas`), errors          | call models or services                                  |
| Controller | `server/controllers/` | One function per endpoint: take validated input, call a service, build the response with a resource                                                                | request, service, resource, http helpers | contain business rules, import `db` or tables            |
| Service    | `server/services/`    | Business rules, combining models, `revalidateTag` after every write                                                                                                | models, other services                   | use HTTP types (`Request`, `Response`) or validate input |
| Model      | `server/models/`      | Query functions for one table (`all`, `find`, `create`, `update`, `remove`, scopes such as `active`, `today`); the only layer that imports `db` and `db/schema.ts` | `db`                                     | call services, controllers or zod                        |
| Resource   | `server/resources/`   | Convert a row (or list) into the public JSON shape: dates as ISO strings, no internal fields                                                                       | nothing                                  | query data                                               |

Calls only go downward. A lower layer never imports a higher one. `server/middleware/` holds our own wrapper functions; it is unrelated to Next.js's middleware/proxy file.

## Folder structure

```text
app/api/
  display/route.ts                       GET   public feed
  auth/[...nextauth]/route.ts            Auth.js (the one exception: not layered)
  admin/<entity>/route.ts                GET list, POST create
  admin/<entity>/[id]/route.ts           GET, PATCH, DELETE
server/
  controllers/   <entity>.controller.ts
  requests/      <entity>.request.ts
  services/      <entity>.service.ts, display.service.ts
  models/        <entity>.model.ts
  resources/     <entity>.resource.ts
  middleware/    with-handler.ts, with-auth.ts
  errors/        app-error.ts (AppError, ValidationError, NotFoundError, UnauthorizedError)
  http/          response.ts (ok, created, noContent, error helpers)
lib/schemas/     <entity>.schema.ts      pure zod schemas, shared with admin forms
db/              schema.ts, index.ts
```

Every file under `server/` imports `server-only`. Files in `lib/schemas/` stay pure (no server imports) so shadcn forms can reuse them.

## Conventions

- Controller functions are named like Laravel resource methods: `index`, `show`, `store`, `update`, `destroy`. They are plain functions, not classes.
- Request files export one parser per action (`store`, `update`) built on the shared schema; `update` uses a partial schema.
- JSON envelope: success `{ data }`; failure `{ error: { code, message, fields? } }`.
- Status codes: 200 read/update, 201 create, 204 delete, 401 not signed in, 404 missing row, 422 validation failed, 500 unexpected. Unexpected errors return a generic message; never leak stack traces or SQL.
- Route params (`id`) are validated like any other input.
- No Server Actions. The admin UI calls these routes, so there is one path to the data.

## Endpoints

Public (read-only):

- `GET /api/display`: `DisplayController.show` -> `DisplayService.getFeed` (tagged cache, date-in-timezone key) -> read functions of the models -> `DisplayResource`.

Admin (session required via `with-auth`):

- Full CRUD (`index`, `show`, `store`, `update`, `destroy`) for `pengumuman`, `kategori`, `agenda`, `promo`, `running-text`, `video`.
- `promo` and `video` also get a reorder endpoint (list of ids in the new order).
- Singletons `pandu` and `setting`: `show` and `update` only.
- Media fields are https URL strings validated in the schemas (see SPEC).

## Security and caching

- `with-auth` denies by default. Until Auth.js is wired in (T15) it returns 401 for every admin route, so nothing is exposed by accident.
- Every input goes through a request and its zod schema. Never trust the client, including ids and URLs.
- Every write goes through a service that calls `revalidateTag` for the display feed. Use the cache API of the installed Next.js version, and read its guide in `node_modules/next/dist/docs/` first (caching APIs differ between versions). Keep one tag for the display feed.
- Do not query the database per poll: `/api/display` is served from the tagged cache (see AGENTS.md, Vercel + Neon rules).

## Adding an entity (follow this order)

1. Table in `db/schema.ts`, then `drizzle-kit generate` and `migrate`
2. Model (`server/models/<entity>.model.ts`)
3. Zod schema (`lib/schemas/<entity>.schema.ts`)
4. Request (`server/requests/<entity>.request.ts`)
5. Resource (`server/resources/<entity>.resource.ts`)
6. Service (`server/services/<entity>.service.ts`) with `revalidateTag` on writes
7. Controller (`server/controllers/<entity>.controller.ts`)
8. Routes under `app/api/admin/<entity>/`
9. Manual check: valid input, invalid input (422), unknown id (404), no session (401)

## Reference entity

`running-text` (id, isi, isActive) is built end to end first (task T6A) as the pattern to copy. Do not invent a different structure for later entities; ask first if something does not fit.

## Done means

- Layers and call direction respected, no logic in routes or controllers
- All input validated, admin routes default deny
- Writes revalidate the display cache
- `npm run build` passes
