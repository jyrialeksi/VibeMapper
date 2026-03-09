#!/bin/sh
set -e

# Fix ownership of data directory (handles volumes with files created by root)
chown -R appuser:appgroup /app/backend/data 2>/dev/null || true

# Drop privileges and run the app
exec su -s /bin/sh appuser -c "node backend/src/server.js"
