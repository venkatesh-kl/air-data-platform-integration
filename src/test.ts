import logger from "./logger";

const BASE_URL = "http://localhost:3000";

async function getAll() {
  const res = await fetch(`${BASE_URL}/orgs`);
  const response = (await res.json()) as unknown as string[];
  for (const org of response) {
    logger.info(`getting org ${org}`);
    await getOrg(org);
    logger.info(`got org ${org} data successfully`);
  }
}

async function getOrg(orgId: string) {
  const res = await fetch(`${BASE_URL}/orgs/${orgId}`);
  const data = await res.json();
  return data;
}
getAll();
