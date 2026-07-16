#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const detectors = [
  {
    id: "private-key",
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    id: "pgp-private-key",
    pattern: new RegExp(["-----BEGIN PGP", "PRIVATE KEY BLOCK-----"].join(" "), "g"),
  },
  {
    id: "stripe-api-key",
    pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
  },
  {
    id: "stripe-webhook-secret",
    pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/g,
  },
  {
    id: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
  },
  {
    id: "github-fine-grained-token",
    pattern: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g,
  },
  {
    id: "aws-access-key",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  },
  {
    id: "google-api-key",
    pattern: /\bAIza[A-Za-z0-9_-]{35}\b/g,
  },
  {
    id: "openai-api-key",
    pattern: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    id: "slack-token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    id: "npm-token",
    pattern: /\bnpm_[A-Za-z0-9]{36}\b/g,
  },
  {
    id: "gitlab-token",
    pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    id: "hugging-face-token",
    pattern: /\bhf_[A-Za-z0-9]{30,}\b/g,
  },
  {
    id: "sendgrid-api-key",
    pattern: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g,
  },
  {
    id: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    id: "credentialed-url",
    pattern: /\bhttps?:\/\/[^/\s:@]+:[^/\s@]+@/g,
  },
  {
    id: "assigned-secret",
    pattern:
      /(?:^|[\s"'`{,])(?:[A-Za-z0-9_-]*(?:secret|password|passwd|token|api[_-]?key|private[_-]?key)[A-Za-z0-9_-]*)\s*[:=]\s*["']?([A-Za-z0-9+/_=-]{24,})["']?/gi,
    valueGroup: 1,
  },
];

const placeholderFragments = [
  "changeme",
  "example",
  "not-a-secret",
  "not_a_secret",
  "placeholder",
  "redacted",
  "replace-me",
  "replace_me",
  "1234567890abcdef",
  "your-",
  "your_",
];

function isPlaceholder(value) {
  const normalized = value.toLowerCase();
  return placeholderFragments.some((fragment) => normalized.includes(fragment));
}

export function isBinaryBuffer(buffer) {
  return buffer.includes(0);
}

export function scanSecretText(text, path = "<text>") {
  const findings = [];
  const seen = new Set();

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    for (const detector of detectors) {
      for (const match of line.matchAll(detector.pattern)) {
        const candidate = detector.valueGroup ? match[detector.valueGroup] : match[0];
        if (isPlaceholder(candidate)) {
          continue;
        }

        const key = `${detector.id}:${index + 1}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        findings.push({
          detector: detector.id,
          line: index + 1,
          path,
        });
      }
    }
  }

  return findings;
}

function listTrackedFiles(repositoryRoot) {
  const output = execFileSync(
    "git",
    ["-C", repositoryRoot, "ls-files", "--cached", "-z"],
    { encoding: "buffer" },
  );

  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

export function scanTrackedFiles(repositoryRoot) {
  const findings = [];
  let binaryFiles = 0;
  let missingFiles = 0;
  let textFiles = 0;

  for (const path of listTrackedFiles(repositoryRoot)) {
    const absolutePath = resolve(repositoryRoot, path);
    if (!existsSync(absolutePath)) {
      missingFiles += 1;
      continue;
    }

    const contents = readFileSync(absolutePath);
    if (isBinaryBuffer(contents)) {
      binaryFiles += 1;
      continue;
    }

    textFiles += 1;
    findings.push(...scanSecretText(contents.toString("utf8"), path));
  }

  return { binaryFiles, findings, missingFiles, textFiles };
}

function run() {
  const repositoryRoot = execFileSync(
    "git",
    ["rev-parse", "--show-toplevel"],
    { encoding: "utf8" },
  ).trim();
  const result = scanTrackedFiles(repositoryRoot);

  if (result.findings.length > 0) {
    console.error(
      `Secret scan failed: ${result.findings.length} potential secret finding(s).`,
    );
    for (const finding of result.findings) {
      console.error(
        `- ${finding.path}:${finding.line} [${finding.detector}] value redacted`,
      );
    }
    console.error("Remove and rotate confirmed credentials before continuing.");
    process.exitCode = 1;
    return;
  }

  const missingSummary = result.missingFiles
    ? `; ${result.missingFiles} deleted tracked file(s) ignored`
    : "";
  console.log(
    `Secret scan passed: ${result.textFiles} tracked text file(s) scanned; ` +
      `${result.binaryFiles} tracked binary file(s) skipped${missingSummary}.`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  run();
}
