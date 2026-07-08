import { execSync } from "node:child_process";

const PORTS = [3000, 3001, 3002];

function killPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    const pids = new Set(
      out
        .split("\n")
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && /^\d+$/.test(pid) && pid !== "0")
    );
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Stopped PID ${pid} on port ${port}`);
      } catch {
        // already gone
      }
    }
  } catch {
    // nothing listening
  }
}

for (const port of PORTS) {
  killPort(port);
}
