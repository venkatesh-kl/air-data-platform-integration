import { logger } from "@diligentcorp/data-platform-api-client";
import { serve } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { performance } from "node:perf_hooks";
import airDpModel from "./air-dp-model";
import { saveJSONFile } from "./file-utils";

const app = new Hono();
const port = Number(process.env["PORT"]) || 3000;

type HonoHandler = (ctx: Context) => Promise<any>;
export const SUPPORTED_DATA_SOURCES = ["risk_manager"];

async function asyncHandler(func: HonoHandler, ctx: Context) {
  const startTime = performance.now();
  try {
    const result = await func(ctx);
    const endTime = performance.now();
    const duration = endTime - startTime;
    logger.info(`${func.name} - completed in ${duration}ms`, { duration });
    return ctx.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const endTime = performance.now();
    const duration = endTime - startTime;
    logger.info(
      `${func.name} - completed in ${duration}ms with error: ${message}`,
      { duration },
    );
    return ctx.json({ error: message }, 500);
  }
}

app.get("/orgs", async (ctx) =>
  asyncHandler(async () => await airDpModel.getallOrgs(), ctx),
);

app.get("/data-sources/:orgId", async (ctx) =>
  asyncHandler(async () => {
    const orgId = ctx.req.param("orgId");
    const result = await airDpModel.getDataSources(
      orgId,
      SUPPORTED_DATA_SOURCES,
    );
    saveJSONFile(`${orgId}/dataSources`, result);
    return result;
  }, ctx),
);

// read schema along with the data sources titles
app.get("/data-sources/:orgId/list", async (ctx) =>
  asyncHandler(async () => {
    const orgId = ctx.req.param("orgId");
    const result = await airDpModel.getDataSourcesDetailed(
      orgId,
      SUPPORTED_DATA_SOURCES,
    );
    saveJSONFile(`${orgId}/dataSources`, result);
    return result;
  }, ctx),
);

app.get("/preview/:orgId/:product/:schema", async (ctx) =>
  asyncHandler(async () => {
    const orgId = ctx.req.param("orgId");
    const product = ctx.req.param("product");
    const schema = ctx.req.param("schema");
    const result = await airDpModel.getPreviewData(orgId, product, schema);
    saveJSONFile(`${orgId}/${product}/${schema}/preview`, result);
    return result;
  }, ctx),
);

app.get("/preview/:orgId/:product/:schema/details", async (ctx) =>
  asyncHandler(async () => {
    const orgId = ctx.req.param("orgId");
    const product = ctx.req.param("product");
    const schema = ctx.req.param("schema");
    const result = await airDpModel.getSchema(orgId, product, schema);
    saveJSONFile(`${orgId}/${product}/${schema}/details`, result);
    return result;
  }, ctx),
);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});
