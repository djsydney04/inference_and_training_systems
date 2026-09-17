import { execFileSync } from "node:child_process";
import { finalizeContentRelease } from "./content-release.ts";

const changed = finalizeContentRelease((path, body) => {
  const args = ["api", path];
  if (body) args.push("--method", "PUT", "--input", "-");
  return JSON.parse(execFileSync("gh", args, {
    input: body ? JSON.stringify(body) : undefined,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  }));
}, process.env.GH_REPO ?? "", process.env.PR_NUMBER ?? "");
console.log(changed ? "Archived the pending material changes on the release PR." : "Content history is already current.");
