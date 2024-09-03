#!/usr/bin/env node

async function start() {
  const { read } = await import("../dist/babel/index.js");
  return read();
}
start();
