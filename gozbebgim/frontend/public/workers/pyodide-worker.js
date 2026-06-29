importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");

let pyodide = null;

// ======================================================
// CONFIG
// ======================================================

const MAX_CODE_LENGTH = 12000;
const EXECUTION_TIMEOUT = 8000;
const MAX_OUTPUT = 12000;

const ALLOWED_IMPORTS = new Set([
  "math",
  "random",
  "statistics",
  "collections",
  "itertools",
  "functools",
  "datetime",
  "json",
  "re",
  "string",
  "numpy",
  "pandas",
  "sklearn"
]);

const BLOCKED_IMPORTS = new Set([
  "os",
  "sys",
  "subprocess",
  "socket",
  "shutil",
  "pathlib",
  "threading",
  "multiprocessing",
  "ctypes",
  "pickle",
  "marshal",
  "resource",
  "signal",
  "asyncio",
  "http",
  "urllib",
  "requests",
  "ftplib"
]);

// ======================================================
// INIT
// ======================================================

async function initPyodideRuntime() {
  if (pyodide) return;

  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/"
  });

  await pyodide.loadPackage([
    "numpy",
    "pandas",
    "scikit-learn"
  ]);
}

// ======================================================
// TIMEOUT
// ======================================================

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Execution timeout")), ms)
    )
  ]);
}

// ======================================================
// IMPORT VALIDATION
// ======================================================

function validateImports(code) {
  const lines = code.split("\n");

  for (const line of lines) {
    const match = line.match(/^\s*(import|from)\s+([a-zA-Z0-9_\.]+)/);

    if (!match) continue;

    const mod = match[2].split(".")[0];

    if (BLOCKED_IMPORTS.has(mod)) {
      throw new Error(`🚫 Yasaklı modül: '${mod}'`);
    }

    if (!ALLOWED_IMPORTS.has(mod)) {
      throw new Error(`⚠️ İzin verilmeyen modül: '${mod}'`);
    }
  }
}
// ======================================================
// MESSAGE HANDLER
// ======================================================

self.onmessage = async (e) => {
  const data = e.data;

  try {

    // ---------------- INIT ----------------

    if (data.type === "init") {
      await initPyodideRuntime();

      self.postMessage({
        type: "init-done"
      });

      return;
    }

    // ---------------- RUN ----------------

    if (data.type !== "run") return;

    const code = String(data.code || "");

    if (code.length > MAX_CODE_LENGTH) {
      throw new Error("Code too large");
    }

    validateImports(code);

    const raw = await withTimeout(
      pyodide.runPythonAsync(
        buildRunner(
          code,
          data.test_scripts || [],
          data.test_names || []
        )
      ),
      EXECUTION_TIMEOUT
    );

    // Python tarafı json.dumps() ile string döndürüyor,
    // JS tarafında nesneye çevirmek gerekiyor.
    const result = JSON.parse(raw);

    self.postMessage({
      type: "run-done",
      result
    });

  } catch (err) {

    self.postMessage({
      type: "run-error",
      error: err.message || "Unknown error"
    });

  }
};

// ======================================================
// PYTHON RUNNER
// ======================================================

function buildRunner(code, testScripts, testNames) {

  return `
import json
import traceback
import sys

from io import StringIO

stdout_capture = StringIO()
stderr_capture = StringIO()

old_stdout = sys.stdout
old_stderr = sys.stderr

sys.stdout = stdout_capture
sys.stderr = stderr_capture

results = []

USER_CODE = ${JSON.stringify(code)}
TEST_SCRIPTS = ${JSON.stringify(testScripts)}
TEST_NAMES = ${JSON.stringify(testNames)}

global_scope = {}

def format_error(err):
    return str(err)[:500]

try:

    # =====================================
    # USER CODE
    # =====================================

    exec(USER_CODE, global_scope)

    # =====================================
    # TEST CODE
    # =====================================

    if TEST_SCRIPTS:
        exec("\\n".join(TEST_SCRIPTS), global_scope)

    # =====================================
    # RUN TESTS
    # =====================================

    for test_name in TEST_NAMES:

        try:

            fn = global_scope.get(test_name)

            if fn is None:

                results.append({
                    "name": test_name,
                    "passed": False,
                    "error": "Test not found"
                })

                continue

            fn()

            results.append({
                "name": test_name,
                "passed": True
            })

        except AssertionError as e:

            results.append({
                "name": test_name,
                "passed": False,
                "error": format_error(e)
            })

        except Exception as e:

            results.append({
                "name": test_name,
                "passed": False,
                "error": traceback.format_exc()[:1500]
            })

except Exception as e:

    results.append({
        "name": "Execution",
        "passed": False,
        "error": traceback.format_exc()[:1500]
    })

finally:

    sys.stdout = old_stdout
    sys.stderr = old_stderr

output = stdout_capture.getvalue()
error_output = stderr_capture.getvalue()

combined_output = (output + "\\n" + error_output)[:${MAX_OUTPUT}]

json.dumps({
    "results": results,
    "output": combined_output
})
`;
}