# Data Platform integration

A local server that talks to the Diligent Data Platform API: it lists organizations and data sources, and fetches preview and schema data. API responses are cached under the `output/` directory.

## Prerequisites

- **Node.js** 22+ (or 24+)
- **pnpm** (required; project uses `pnpm@10.31.0`). Install with `npm install -g pnpm` or enable [corepack](https://nodejs.org/api/corepack.html) and run `corepack enable`.

## Setup

1. **Clone the repo** (if you have not already).

2. **Configure environment**
   - Copy `.env.example` to `.env`.
   - Set **required** variables:
     - `DATA_PLATFORM_CLIENT_ID` — your Data Platform client ID
     - `DATA_PLATFORM_CLIENT_SECRET` — your Data Platform client secret
   - Get these credentials from your team or internal docs (do not commit `.env`).
   - Optional: `DATA_PLATFORM_API_BASE_URL` (default: `https://data-services-api.diligentoneplatform-dev.com`), `DATA_PLATFORM_LOG_LEVEL` (e.g. `ERROR`).

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Start the server**
   ```bash
   pnpm start
   ```
   Server runs at http://localhost:3000 (or set `PORT` to override).

## Verify it works

- Open http://localhost:3000/orgs in a browser or run `curl http://localhost:3000/orgs`.
- Use the provided [sample-requests.rest](sample-requests.rest) (REST Client in VS Code / Cursor) with `@baseUrl = http://localhost:3000` to hit all endpoints.
- Responses are also written under the `output/` directory.

## API overview

| Method | Path                                       | Description                                  |
| ------ | ------------------------------------------ | -------------------------------------------- |
| GET    | `/orgs`                                    | List all orgs with data in the Data Platform |
| GET    | `/data-sources/:orgId`                     | List data sources for an org                 |
| GET    | `/data-sources/:orgId/list`                | List data sources with details               |
| GET    | `/preview/:orgId/:product/:schema`         | Preview data for a schema                    |
| GET    | `/preview/:orgId/:product/:schema/details` | Schema details for a product/schema          |

See [sample-requests.rest](sample-requests.rest) for example requests. The only supported data source at the moment is `risk_manager` (see `SUPPORTED_DATA_SOURCES` in [src/server.ts](src/server.ts)).

## Project structure

| Path                                         | Purpose                                                           |
| -------------------------------------------- | ----------------------------------------------------------------- |
| [src/server.ts](src/server.ts)               | Hono app and API routes                                           |
| [src/air-dp-model.ts](src/air-dp-model.ts)   | Data Platform client usage (orgs, data sources, schemas, preview) |
| [src/file-utils.ts](src/file-utils.ts)       | Writing JSON responses to `output/`                               |
| [src/logger.ts](src/logger.ts)               | Logging                                                           |
| `.env`                                       | Local config (gitignored; copy from `.env.example`)               |
| [sample-requests.rest](sample-requests.rest) | Example HTTP requests                                             |

To customize routes or Data Platform integration, see [src/server.ts](src/server.ts) for API routes and [src/air-dp-model.ts](src/air-dp-model.ts) for client logic.

## Model

[AIR DP Model](src/air-dp-model.ts) — wraps `@diligentcorp/data-platform-api-client` and provides methods to fetch organizations, data sources, product schemas, and preview data.
