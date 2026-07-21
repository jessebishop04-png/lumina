import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, ".next");
const externalNext = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "lumina-next-cache", ".next");
const cacheDir = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "lumina-next-cache");

function isWindowsJunction(target) {
  if (!fs.existsSync(target)) return false;
  try {
    const parent = path.dirname(target);
    const name = path.basename(target);
    const out = execSync(`cmd /c dir /AL "${parent}"`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
    return out.toUpperCase().includes("<JUNCTION>") && out.includes(name);
  } catch {
    return false;
  }
}

function removePath(target) {
  if (!fs.existsSync(target)) return;
  try {
    if (isWindowsJunction(target)) {
      execSync(`cmd /c rmdir "${target}"`, { stdio: "ignore" });
      console.log(`Removed junction ${target}`);
      return;
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
        console.log(`Removed ${target}`);
        return;
      } catch {
        execSync("timeout /t 1 /nobreak >nul", { stdio: "ignore" });
      }
    }
  } catch {
    // ignore — dev server may still be releasing handles
  }
}

const targets = [
  nextDir,
  externalNext,
  path.join(root, "node_modules", ".cache", "next"),
  cacheDir,
];

for (const target of targets) {
  removePath(target);
}
