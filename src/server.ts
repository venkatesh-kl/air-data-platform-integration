import { serve } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { performance } from "node:perf_hooks";
import airDpModel from "./air-dp-model";
import type { DataSourceListItem } from "./data-sources-json.types";
import { asyncSaveJsonFile, saveJSONFile } from "./file-utils";
import logger from "./logger";

const app = new Hono();
const port = Number(process.env["PORT"]) || 3000;

type HonoHandler = (ctx: Context) => Promise<any>;
export const SUPPORTED_DATA_SOURCES = ["risk_manager"];

async function asyncHandler(func: HonoHandler, context: Context) {
  const startTime = performance.now();
  const method = context.req.method;
  const path = context.req.path;
  try {
    const result = await func(context);
    const endTime = performance.now();

    const duration = ((endTime - startTime) / 1000).toFixed(3);
    logger.info(
      { path, method, duration },
      `${method} ${path} completed in ${duration} seconds`,
    );
    return context.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const endTime = performance.now();
    const duration = endTime - startTime;
    logger.error(
      {
        path,
        method,
        duration,
        error: message,
        status: 500,
      },
      `${method} ${path} failed after ${duration}ms: ${message}`,
    );
    return context.json({ error: message }, 500);
  }
}

app.get("/orgs/:orgId", async (ctx) =>
  asyncHandler(async () => {
    const orgId = ctx.req.param("orgId")!.trim();
    logger.info(`get-org-data - in handler for org ${orgId}`);
    const baseUrl = "http://localhost:3000";
    const dataSourcesUrl = `${baseUrl}/${orgId}/data-sources/list`;
    logger.info(
      `get-org-data - fetching data sources for org ${orgId} from ${dataSourcesUrl}`,
    );
    const dataSources = await fetch(dataSourcesUrl);
    console.log(dataSources);
    const dataSourcesJson: DataSourceListItem[] =
      (await dataSources.json()) as unknown as DataSourceListItem[];
    saveJSONFile("${orgId}/dataSources", dataSourcesJson);

    for (const dataSource of dataSourcesJson) {
      const { schema_id, product } = dataSource.schema;
      logger.info(`running for ${orgId}/${product}/${schema_id}`);
      const schemaUrl = `${baseUrl}/${orgId}/data-sources/${product}/${schema_id}/schema`;
      const previewUrl = `${baseUrl}/${orgId}/data-sources/${product}/${schema_id}/preview`;

      await Promise.all([
        fetch(schemaUrl).then((r) => r.json()),
        fetch(previewUrl).then((r) => r.json()),
      ]);
    }
    return { orgId, success: true };
  }, ctx),
);

app.get("/orgs", async (ctx) =>
  asyncHandler(async () => await airDpModel.getallOrgs(), ctx),
);

// read schema along with the data sources titles
app.get("/:orgId/data-sources/list", async (ctx) =>
  asyncHandler(async () => {
    logger.info(`get-datasources - in handler`);
    const orgId = ctx.req.param("orgId");
    const result = await airDpModel.getDataSourcesDetailed(
      orgId,
      SUPPORTED_DATA_SOURCES,
    );
    asyncSaveJsonFile(`${orgId}/dataSources`, result);
    return result;
  }, ctx),
);

app.get("/:orgId/data-sources/:product/:schema/preview", async (ctx) =>
  asyncHandler(async () => {
    const orgId = ctx.req.param("orgId");
    const product = ctx.req.param("product");
    const schema = ctx.req.param("schema");

    const result = await airDpModel.getPreviewData(orgId, product, schema);
    asyncSaveJsonFile(`${orgId}/${product}/${schema}/preview`, result);
    return result;
  }, ctx),
);

app.get("/:orgId/data-sources/:product/:schema/schema", async (ctx) =>
  asyncHandler(async () => {
    const orgId = ctx.req.param("orgId")!;
    const product = ctx.req.param("product")!;
    const schema = ctx.req.param("schema")!;
    const result = await airDpModel.getSchema(orgId, product, schema);
    asyncSaveJsonFile(`${orgId}/${product}/${schema}/schema`, result);
    return result;
  }, ctx),
);

serve({ fetch: app.fetch, port }, (info) => {
  logger.info(`Server listening on http://localhost:${info.port}`);
});
