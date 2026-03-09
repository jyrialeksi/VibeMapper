#!/bin/sh
set -e

# Run the app (already running as appuser via USER directive in Dockerfile)
exec node backend/src/server.js
