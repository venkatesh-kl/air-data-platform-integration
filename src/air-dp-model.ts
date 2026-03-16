import { DataPlatformApiClient } from "@diligentcorp/data-platform-api-client";
import { saveJSONFile } from "./file-utils";

const AIR_SUPPORTED_PRODUCTS = ["risk_manager"];
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
    const supportedProductSchemas = products.filter((product) =>
      AIR_SUPPORTED_PRODUCTS.includes(product),
    );

    const schemasPerProduct = [];
    for (const product of supportedProductSchemas) {
      const schemas = await this.client.getProductSchemas(product, orgId);
      console.log(`found ${schemas.length} schemas for ${orgId}/${product}`);
      const dataSources = [];
      for (const schema of schemas) {
        const result = await this.client.getSchemaForTable(
          product,
          schema,
          orgId,
        );
        saveJSONFile(`${orgId}/${product}/${schema}/schema`, result);
        dataSources.push({ orgId, product, schema, result });
      }
      schemasPerProduct.push(dataSources);
    }
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
