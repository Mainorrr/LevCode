FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /tmp/nginx.conf.template
ARG BACKEND_URL
RUN test -n "$BACKEND_URL" || (echo "ERROR: BACKEND_URL build arg is required" && exit 1)
RUN sed "s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL}|g" /tmp/nginx.conf.template > /tmp/nginx.conf.partial
EXPOSE 8080
ENTRYPOINT ["/bin/sh", "-c", "sed 's|PORT_PLACEHOLDER|'${PORT:-8080}'|g' /tmp/nginx.conf.partial > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
