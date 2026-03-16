import * as fs from "node:fs";
import * as path from "node:path";
import {
  closeClient,
  fetchAllSchemasForOrg,
  getOrgs,
  getProductSchemas,
  getProducts,
  getSampleData,
  getSchemaForTable,
  initClient,
} from "./data-platform-model";

const OUTPUT_DIR = path.resolve("output");
function saveJSONFile(filename: string, data: any): void {
  const fpath = `${OUTPUT_DIR}/${filename}.json`;

  if (!data) {
    console.error(`expected valid Javascript Object, received: '${data}' `);
    return;
  }

  if (!fs.existsSync(path.dirname(fpath))) {
    fs.mkdirSync(path.dirname(fpath), { recursive: true });
  }
  fs.writeFileSync(fpath, JSON.stringify(data, null, 2), "utf-8");
  console.info(`saved to '${fpath}'`);
  console.log(`------------------------------------------------------
`);
}

type AsyncFunc<T> = (...args: any[]) => Promise<T>;

async function saveJSONResultOnSuccess<T>(
  func: AsyncFunc<T>,
  filename: string,
): Promise<T | undefined> {
  try {
    const result = await func();

    if (!result) {
      console.warn(`received: ${result} as response`);
      return result;
    }

    saveJSONFile(filename, result);
    return result;
  } catch (err) {
    const errorMessage = (err as Error).message;
    if (/401/.test(errorMessage)) {
      console.info(`Unauthorized: ${errorMessage}`);
    }

    console.error(`Error during fetch:'${errorMessage}'`);
    return;
  }
}

fs.rmSync(OUTPUT_DIR, { recursive: true });

(async () => {
  await initClient();
  try {
    console.log("> fetching orgs...");
    const orgs = await saveJSONResultOnSuccess(
      async () => await getOrgs(),
      "orgs",
    );

    for (const orgId of orgs?.data?.orgids ?? []) {
      console.info(`-------- org: ${orgId} --------`);
      console.info(`-> fetching schemas for org '${orgId}'...`);
      await saveJSONResultOnSuccess(
        async () => await fetchAllSchemasForOrg(orgId),
        `${orgId}/schemas`,
      );

      console.info(`--> fetching products for org '${orgId}'...`);
      const allProducts =
        (await saveJSONResultOnSuccess(
          async () => await getProducts(orgId),
          `${orgId}/products`,
        )) ?? [];

      const products = allProducts;
      for (const product of products) {
        console.log(
          `---> fetching schema for 'org:${orgId}>product:${product}'...`,
        );
        let productSchemas = await saveJSONResultOnSuccess(
          async () => await getProductSchemas(product, orgId),
          `${orgId}/products/${product}`,
        );

        console.info(
          `---> fetched productSchema for 'org:${orgId}>product:${product}' as ${JSON.stringify(productSchemas)}`,
        );

        for (const productSchema of productSchemas ?? []) {
          const productTableSchema = await saveJSONResultOnSuccess(
            async () => await getSchemaForTable(orgId, product, productSchema),
            `${orgId}/products/${product}/${productSchema}/schema`,
          );

          console.log({ productTableSchema });
          const table = productTableSchema?.schema?.table;
          const schemaId = productTableSchema?.schema_id;
          if (!(schemaId && table)) {
            console.log(
              `skipping sample data fetch for 'org:${orgId}>product:${product}' as schema: '${schemaId}' or table: '${table}' is missing...`,
            );
          } else {
            const sampleData = await saveJSONResultOnSuccess(
              () => getSampleData(orgId, product, schemaId, table),
              `${orgId}/products/${product}/${productSchema}/sample_data`,
            );
          }
        }
      }

      console.info(`-------- org: ${orgId} DONE --------`);
    }

    await saveJSONResultOnSuccess(async () => {
      return await getProducts();
    }, "global_products");
  } catch (e) {
    console.error(e);
  } finally {
    closeClient();
  }
})();
