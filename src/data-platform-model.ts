import type {
  CatalogResponse,
  SchemaResponse,
} from "@diligentcorp/data-platform-api-client";
import { DataPlatformApiClient } from "@diligentcorp/data-platform-api-client";

let client: DataPlatformApiClient;

export async function initClient() {
  if (!client) client = new DataPlatformApiClient();
}

export async function getOrgs() {
  await initClient();

  return await client.fetchOrganizations();
}

export async function fetchAllSchemasForOrg(
  orgId: string,
): Promise<CatalogResponse> {
  await initClient();

  return await client.fetchAllSchemas(orgId);
}

export async function getProducts(orgId?: string): Promise<string[]> {
  await initClient();

  const products = await client.getProducts(orgId);
  return Array.from(products);
}

export async function getProductSchemas(orgId: string, product: string) {
  await initClient();

  return await client.getProductSchemas(product, orgId);
}

export async function getSampleData(
  orgId: string,
  product: string,
  schemaId: string,
  table: string,
) {
  await initClient();

  const query = `select * FROM ${table} LIMIT 10`;

  console.log(`running query: ${query}`);
  const queryResult = await client.executeQuery(
    product,
    orgId,
    schemaId,
    query,
  );

  // Handle QueryResponse (synchronous) or QueryStatusResponse (async)
  if ("success" in queryResult && queryResult.success) {
    const queryResponse = queryResult as any;
    console.log("Query results:", queryResponse.results);
  } else if ("status" in queryResult) {
    const statusResponse = queryResult as any;
    console.log("Query status:", statusResponse.status);
    if (statusResponse.download_url) {
      console.log("Download URL:", statusResponse.download_url);
    }
  }
}

export async function closeClient() {
  if (!client) return;
  await client.close();
}

export async function getSchemaForTable(
  orgId: string,
  product: string,
  productSchema: string,
): Promise<SchemaResponse> {
  await initClient();

  return await client.getSchemaForTable(product, productSchema, orgId);
}
