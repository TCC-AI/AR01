FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY client/package.json client/
COPY server/package.json server/
COPY shared/package.json shared/
RUN npm install

# Build client
FROM deps AS build-client
COPY client/ client/
COPY shared/ shared/
COPY tsconfig.json ./
RUN cd client && npx vite build

# Build server
FROM deps AS build-server
COPY server/ server/
COPY shared/ shared/
COPY tsconfig.json ./
RUN cd server && npx tsc

# Production
FROM node:20-alpine AS production
WORKDIR /app

COPY package.json ./
COPY server/package.json server/
COPY shared/package.json shared/
RUN npm install --omit=dev

COPY --from=build-client /app/client/dist client/dist
COPY --from=build-server /app/server/dist server/dist
COPY shared/ shared/

RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
