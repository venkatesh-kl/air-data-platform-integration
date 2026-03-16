import { DataPlatformApiClient } from "@diligentcorp/data-platform-api-client";
import { saveJSONFile } from "./file-utils";

const AVAILABLE_PRODUCTS = ["risk_manager"];
class AIRDpModel {
  private client: DataPlatformApiClient;

  constructor() {
    this.client = new DataPlatformApiClient();
  }

  async getallOrgs(): Promise<string[]> {
    const orgs = await this.client.fetchOrganizations();
    saveJSONFile("all-orgs", orgs);
    return orgs.data.orgids;
  }

  async getDataSourcesForOrg(orgId: string) {
    const results = await this.client.getProducts(orgId);
    const products = Array.from(results);
    const schemasPerProduct = await Promise.all(
      products
        .filter((product) => AVAILABLE_PRODUCTS.includes(product))
        .slice(0, 2)
        .map(async (product) => {
          const schemas = await this.client.getProductSchemas(product, orgId);
          console.log(
            `found ${schemas.length} schemas for ${orgId}/${product}`,
          );
          const dataSources = [];
          for (const schema of schemas) {
            const result = await this.client.getSchemaForTable(
              product,
              schema,
              orgId,
            );
            dataSources.push({ orgId, product, schema, result });
          }
          return dataSources;
        }),
    );
    const schemas = schemasPerProduct.flat();
    return schemas;
  }

  async getPreviewData(orgId: string, product: string, schema: string) {
    const previewData = await this.client.executeQuery(
      product,
      orgId,
      schema,
      `SELECT * FROM ${schema} LIMIT 10`,
    );
    return previewData;
  }
}

const model = new AIRDpModel();

export default model;
