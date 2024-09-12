#!/usr/bin/env node
async function start() {
  const { read } = await import("../dist/esm/utils/read.mjs");
  return read();
}
start();
