import {
  DataPlatformApiClient,
  type QueryResponse,
} from "@diligentcorp/data-platform-api-client";
import pMap from "p-map";
import logger from "./logger";

class AIRDpModel {
  private client: DataPlatformApiClient;

  constructor() {
    this.client = new DataPlatformApiClient();
  }

  async getallOrgs(): Promise<string[]> {
    logger.debug(`getallOrgs - fetching all orgs`);
    const orgs = await this.client.fetchOrganizations();
    logger.debug(`getallOrgs - successfully fetched orgs`, {
      orgCount: orgs.data.count,
    });
    return orgs.data.orgids;
  }

  async getDataSources(orgId: string, products: string[]) {
    const schemasPerProduct: Array<{
      orgId: string;
      product: string;
      name: string;
    }> = [];
    for (const product of products) {
      const schemas = await this.client.getProductSchemas(product, orgId);
      logger.debug(`found ${schemas.length} schemas for ${orgId}/${product}`);

      schemasPerProduct.push(
        ...schemas.map((schema) => ({
          orgId,
          product,
          name: schema,
        })),
      );
    }
    const schemas = schemasPerProduct.flat();
    logger.debug(`getDataSourcesForOrg - fetched schemas for org ${orgId}`, {
      count: schemas.length,
      orgId,
    });

    return schemas;
  }

  async getDataSourcesDetailed(orgId: string, products: string[]) {
    const schemas = await this.getDataSources(orgId, products);
    return await pMap(
      schemas,
      (schema) => this.getSchema(orgId, schema.product, schema.name),
      { concurrency: 4 },
    );
  }

  async getSchema(orgId: string, product: string, schema: string) {
    logger.debug(
      `getSchema - fetching schema for ${orgId}/${product}/${schema}`,
    );
    const result = await this.client.getSchemaForTable(product, schema, orgId);
    logger.debug(
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
