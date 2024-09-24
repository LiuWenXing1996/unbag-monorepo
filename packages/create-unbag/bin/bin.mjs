#!/usr/bin/env node
async function start() {
  const { read } = await import("../dist/esm/read.mjs");
  return read();
}
start();
