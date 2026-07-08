import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      const pids = new Set(
        out
          .split("\n")
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && /^\d+$/.test(pid))
      );
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        } catch {
          // process may already be gone
        }
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
    }
  } catch {
    // nothing listening on port
  }
}

rmSync(".next", { recursive: true, force: true });
try {
  rmSync(path.join(process.env.LOCALAPPDATA || os.tmpdir(), "lumina-next-cache"), {
    recursive: true,
    force: true,
  });
} catch {
  // ignore
}
killPort(3000);
execSync("npm run build", { stdio: "inherit" });
execSync("npm run start", { stdio: "inherit" });
