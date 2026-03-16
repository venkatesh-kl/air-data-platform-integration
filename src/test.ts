import AIRDPModel from "./air-dp-model";
import { cleanOutputDir, saveJSONFile } from "./file-utils";

async function loadDataForOrg(orgId: string): Promise<void> {
  const dataSources = await AIRDPModel.getDataSourcesForOrg(orgId);
  saveJSONFile(`${orgId}/dataSources`, dataSources);

  for (const dataSource of dataSources) {
    const sampleData = await AIRDPModel.getPreviewData(
      dataSource.orgId,
      dataSource.product,
      dataSource.schema,
    );
    saveJSONFile(
      `${dataSource.orgId}/${dataSource.product}/${dataSource.schema}/preview`,
      sampleData,
    );
  }
}

async function main(): Promise<void> {
  cleanOutputDir();
  const orgs = await AIRDPModel.getallOrgs();
  saveJSONFile("orgs", orgs);

  for (const orgId of orgs) {
    console.log(`Loading data for org: ${orgId}`);
    await loadDataForOrg(orgId);
  }
}

main().catch((error) => {
  console.error("Error in main execution:", error);
});
