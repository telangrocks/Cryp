#!/bin/sh

# Start script for Render deployment
# This script handles dynamic port binding and starts nginx

set -e

# Set default port if not provided
PORT=${PORT:-80}

# Replace PORT placeholder in nginx config
envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
exec nginx -g "daemon off;"
