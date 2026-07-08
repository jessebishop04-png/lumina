import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, ".next");
const cacheDir = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "lumina-next-cache");

const targets = [nextDir, path.join(root, "node_modules", ".cache", "next"), cacheDir];

for (const target of targets) {
  try {
    if (target === nextDir && fs.existsSync(target) && process.platform === "win32") {
      try {
        execSync(`cmd /c rmdir "${target}"`, { stdio: "ignore" });
        console.log(`Removed junction ${target}`);
        continue;
      } catch {
        // not a junction — fall through to rmSync
      }
    }
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`Removed ${target}`);
  } catch {
    // ignore
  }
}
