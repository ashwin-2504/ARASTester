const fs = require("fs");
const path = require("path");

// Mocking the required parts of main.js for testing
const mockApp = {
  getPath: (name) => {
    if (name === "userData") return path.join(__dirname, "mock-userData");
    return "/tmp";
  },
};

const authorizedDirs = new Set([path.resolve(mockApp.getPath("userData"))]);

/**
 * Normalizes and validates a path to prevent directory traversal.
 * String-level rejection is an optimization; canonical containment is the authoritative security check.
 */
function resolveSafePath(baseDir, relativePath) {
  if (!baseDir || !relativePath) {
    throw new Error("ERR_INVALID_ARGS");
  }

  // 1. Fast rejection of obviously malicious relative paths
  const normalizedRelative = path.normalize(relativePath);
  if (
    path.isAbsolute(normalizedRelative) ||
    normalizedRelative.includes("..")
  ) {
    throw new Error("ERR_TRAVERSAL_DETECTED");
  }

  // 2. Resolve base directory and verify authorization
  const resolvedBase = path.resolve(baseDir);
  const canonicalBase = fs.existsSync(resolvedBase)
    ? fs.realpathSync(resolvedBase)
    : resolvedBase;

  // Check if the base directory is authorized
  let isAuthorized = false;
  for (const authDir of authorizedDirs) {
    if (canonicalBase.startsWith(authDir)) {
      isAuthorized = true;
      break;
    }
  }

  if (!isAuthorized) {
    throw new Error("ERR_UNAUTHORIZED_BASE");
  }

  // 3. Resolve target path and verify containment
  const targetPath = path.resolve(canonicalBase, normalizedRelative);

  // TOCTOU Mitigation: Use realpath if the file exists
  let canonicalTarget;
  try {
    if (fs.existsSync(targetPath)) {
      canonicalTarget = fs.realpathSync(targetPath);
    } else {
      // For new files, check the parent directory
      const parentDir = path.dirname(targetPath);
      if (fs.existsSync(parentDir)) {
        canonicalTarget = path.join(
          fs.realpathSync(parentDir),
          path.basename(targetPath),
        );
      } else {
        canonicalTarget = targetPath;
      }
    }
  } catch (err) {
    canonicalTarget = targetPath;
  }

  // 4. Final containment check (must start with base + separator)
  const baseWithSep = canonicalBase.endsWith(path.sep)
    ? canonicalBase
    : canonicalBase + path.sep;
  if (
    !canonicalTarget.startsWith(baseWithSep) &&
    canonicalTarget !== canonicalBase
  ) {
    throw new Error("ERR_TRAVERSAL_DETECTED");
  }

  return canonicalTarget;
}

// Test cases
const tests = [
  {
    name: "Valid path in userData",
    base: mockApp.getPath("userData"),
    rel: "settings.json",
    expected: "success",
  },
  {
    name: "Traversal attempt (..)",
    base: mockApp.getPath("userData"),
    rel: "../secrets.txt",
    expected: "ERR_TRAVERSAL_DETECTED",
  },
  {
    name: "Absolute path attempt",
    base: mockApp.getPath("userData"),
    rel: "/etc/passwd",
    expected: "ERR_TRAVERSAL_DETECTED",
  },
  {
    name: "Unauthorized base dir",
    base: "/tmp",
    rel: "test.json",
    expected: "ERR_UNAUTHORIZED_BASE",
  },
  {
    name: "Nested authorized base",
    base: path.join(mockApp.getPath("userData"), "SubDir"),
    rel: "test.json",
    expected: "success",
  },
];

// Setup mock environment
const userDataPath = mockApp.getPath("userData");
if (!fs.existsSync(userDataPath))
  fs.mkdirSync(userDataPath, { recursive: true });
fs.writeFileSync(path.join(userDataPath, "settings.json"), "{}");

let failures = 0;
console.log("Running Security Tests...");

tests.forEach((t) => {
  try {
    const result = resolveSafePath(t.base, t.rel);
    if (t.expected === "success") {
      console.log(`[PASS] ${t.name}`);
    } else {
      console.log(`[FAIL] ${t.name} - Expected ${t.expected} but got success`);
      failures++;
    }
  } catch (err) {
    if (err.message === t.expected) {
      console.log(`[PASS] ${t.name} - Correctly rejected with ${err.message}`);
    } else {
      console.log(
        `[FAIL] ${t.name} - Expected ${t.expected} but got ${err.message}`,
      );
      failures++;
    }
  }
});

// Clean up
fs.rmSync(userDataPath, { recursive: true, force: true });

if (failures === 0) {
  console.log("\nAll security tests passed!");
  process.exit(0);
} else {
  console.log(`\n${failures} tests failed!`);
  process.exit(1);
}
