#!/usr/bin/env node

async function start() {
  const { read } = require("../dist/cjs/index.cjs");
  return read();
}
start();
