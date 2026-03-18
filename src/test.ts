import AIRDPModel from "./air-dp-model";
import { cleanOutputDir, saveJSONFile } from "./file-utils";
import { SUPPORTED_DATA_SOURCES } from "./server";

async function loadDataForOrg(orgId: string): Promise<void> {
  const dataSources = await AIRDPModel.getDataSources(
    orgId,
    SUPPORTED_DATA_SOURCES,
  );
  saveJSONFile(`${orgId}/dataSources`, dataSources);

  for (const dataSource of dataSources) {
    const sampleData = await AIRDPModel.getPreviewData(
      dataSource.orgId,
      dataSource.product,
      dataSource.name,
    );
    saveJSONFile(
      `${dataSource.orgId}/${dataSource.product}/${dataSource.name}/preview`,
      sampleData,
    );
  }
}

async function main(): Promise<void> {
  cleanOutputDir();

  // uncomment below to run for all orgs in dev
  const orgs = await AIRDPModel.getallOrgs();
  saveJSONFile("orgs", orgs);

  for (const orgId of orgs) {
    console.log(`Loading data for org: ${orgId}`);
    await loadDataForOrg(orgId);
  }

  // await loadDataForOrg("6533");
}

main().catch((error) => {
  console.error("Error in main execution:", error);
});
