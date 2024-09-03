#!/bin/bash
echo "test sh"
message="feat: test feat"
echo $message
pnpm unbag commitlint --message "$message"
