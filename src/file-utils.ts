import * as fs from "node:fs";
import * as path from "node:path";
import logger from "./logger";

const OUTPUT_DIR = path.resolve("output");
export function cleanOutputDir(): void {
  const outputDir = path.resolve("output");
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(outputDir, { recursive: true });
    logger.info(`Cleaned output directory: '${outputDir}'`);
  }
}

export function saveJSONFile(filename: string, data: any): void {
  const fpath = `${OUTPUT_DIR}/${filename}.json`;

  if (!data) {
    logger.error(`expected valid Javascript Object, received: '${data}' `);
    return;
  }

  const fileDir = path.dirname(fpath);

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  fs.writeFileSync(fpath, JSON.stringify(data, null, 2), "utf-8");
  logger.info(`saved to '${fpath}'`);
}
