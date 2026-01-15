#!/usr/bin/env node

import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tsxPath = join(__dirname, "../node_modules/.bin/tsx");

execSync(`"${tsxPath}" src/index.ts ${process.argv.slice(2).join(" ")}`, { stdio: "inherit" });
