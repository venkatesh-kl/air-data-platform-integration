import { logger } from "@diligentcorp/data-platform-api-client";
import { serve } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { performance } from "node:perf_hooks";
import airDpModel from "./air-dp-model";

const app = new Hono();
const port = Number(process.env["PORT"]) || 3000;

type HonoHandler = (ctx: Context) => Promise<any>;

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
    return await airDpModel.getDataSources(orgId);
  }, ctx),
);

app.get("/preview/:orgId/:product/:schema", async (ctx) =>
  asyncHandler(async () => {
    const orgId = ctx.req.param("orgId");
    const product = ctx.req.param("product");
    const schema = ctx.req.param("schema");
    return await airDpModel.getPreviewData(orgId, product, schema);
  }, ctx),
);

app.get("/preview/:orgId/:product/:schema/details", async (ctx) =>
  asyncHandler(async () => {
    const orgId = ctx.req.param("orgId");
    const product = ctx.req.param("product");
    const schema = ctx.req.param("schema");
    return await airDpModel.getSchema(orgId, product, schema);
  }, ctx),
);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});
