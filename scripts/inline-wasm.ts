#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const pkgDir = join(import.meta.dir, "../packages/rust-core/pkg");
const jsPath = join(pkgDir, "rust_core.js");
const wasmPath = join(pkgDir, "rust_core_bg.wasm");

console.log("Inlining Wasm into JS...");

try {
  const wasmBuffer = readFileSync(wasmPath);
  const wasmBase64 = wasmBuffer.toString("base64");
  let jsContent = readFileSync(jsPath, "utf-8");

  // Regex to find the file reading logic
  // Matches:
  // const wasmPath = `${__dirname}/rust_core_bg.wasm`;
  // const wasmBytes = require('fs').readFileSync(wasmPath);
  
  const regex = /const wasmPath = .*?;[\s\S]*?const wasmBytes = require\('fs'\)\.readFileSync\(wasmPath\);/;
  
  const replacement = `
// Inlined Wasm
const wasmBase64 = "${wasmBase64}";
const wasmBytes = Uint8Array.from(Buffer.from(wasmBase64, "base64"));
`;

  if (jsContent.match(regex)) {
    jsContent = jsContent.replace(regex, replacement);
    writeFileSync(jsPath, jsContent);
    console.log(`✓ Successfully inlined ${wasmBuffer.length} bytes of Wasm.`);
  } else {
    // Check if already inlined
    if (jsContent.includes("const wasmBase64 =")) {
      console.log("Wasm already inlined. Skipping.");
    } else {
      console.error("Could not find Wasm loading logic to replace.");
      process.exit(1);
    }
  }

} catch (e) {
  console.error("Error inlining Wasm:", e);
  process.exit(1);
}
