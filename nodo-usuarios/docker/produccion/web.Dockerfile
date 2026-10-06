# Imagen web de producción: compila el front-end y lo sirve con Caddy, que además gestiona HTTPS.
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY frontend ./frontend
RUN npm run build

FROM caddy:2-alpine
COPY docker/produccion/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist /srv
