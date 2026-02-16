#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [
  "fetch-rider-waite-assets.mjs",
  "fetch-card-backs.mjs",
  "validate-assets.mjs"
];

function run(file) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(__dirname, file)], { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }
      reject(new Error(`${file} failed with code ${code}`));
    });
  });
}

for (const command of commands) {
  // eslint-disable-next-line no-await-in-loop
  await run(command);
}
