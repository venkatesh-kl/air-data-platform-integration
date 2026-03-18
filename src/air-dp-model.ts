import {
  DataPlatformApiClient,
  type QueryResponse,
} from "@diligentcorp/data-platform-api-client";
import { saveJSONFile } from "./file-utils";
import logger from "./logger";

const AIR_SUPPORTED_PRODUCTS = ["risk_manager"];
class AIRDpModel {
  private client: DataPlatformApiClient;

  constructor() {
    this.client = new DataPlatformApiClient();
  }

  async getallOrgs(): Promise<string[]> {
    logger.info(`getallOrgs - fetching all orgs`);
    const orgs = await this.client.fetchOrganizations();
    logger.info(`getallOrgs - successfully fetched orgs`, {
      orgCount: orgs.data.count,
    });
    return orgs.data.orgids;
  }

  async getDataSources(
    orgId: string,
    products = ["risk_manager"],
    saveJson = true,
  ) {
    const supportedProductSchemas = products.filter((product) =>
      AIR_SUPPORTED_PRODUCTS.includes(product),
    );

    logger.info(`getDataSourcesForOrg - fetching schemas`, {
      supportedProductSchemas,
      orgId,
    });
    const schemasPerProduct: Array<{
      orgId: string;
      product: string;
      name: string;
    }> = [];
    for (const product of supportedProductSchemas) {
      const schemas = await this.client.getProductSchemas(product, orgId);
      console.log(`found ${schemas.length} schemas for ${orgId}/${product}`);
      if (saveJson) saveJSONFile(`${orgId}/${product}/schemas-list`, schemas);

      schemasPerProduct.push(
        ...schemas.map((schema) => ({
          orgId,
          product,
          name: schema,
        })),
      );
    }
    const schemas = schemasPerProduct.flat();
    logger.info(`getDataSourcesForOrg - fetched schemas for org ${orgId}`, {
      count: schemas.length,
      orgId,
    });

    return schemas;
  }

  async getSchema(orgId: string, product: string, schema: string) {
    logger.info(
      `getSchema - fetching schema for ${orgId}/${product}/${schema}`,
    );
    const result = await this.client.getSchemaForTable(product, schema, orgId);
    logger.info(
      `getSchema - fetched schema for ${orgId}/${product}/${schema} successfully`,
    );
    return result;
  }

  async getPreviewData(orgId: string, product: string, schema: string) {
    const previewData = await this.client.executeQuery(
      product,
      orgId,
      schema,
      `SELECT * FROM ${schema} LIMIT 10`,
    );
    const { results = [] } = previewData as QueryResponse;
    return { schema, results, product, orgId };
  }
}

const model = new AIRDpModel();

export default model;
