#!/bin/sh
set -e

sed "s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL}|g" \
    /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
