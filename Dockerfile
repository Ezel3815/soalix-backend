# Use the official Node.js runtime as a base image
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

# Compile TypeScript -> dist/ ONCE at image-build time, instead of using
# `nest start`'s dev-mode webpack compiler at runtime. That compiler used
# to recompile the whole project in memory every time the container
# booted and stayed resident the whole time the server ran — fragile on
# a small instance even before, and firebase-admin's large dependency
# tree (grpc, protobufjs, google-gax) was enough to push that over the
# memory limit and crash with an OOM. Running the already-compiled JS
# needs a fraction of the memory.
# NODE_OPTIONS here only affects this one build step, never the running
# server — a little headroom in case the build machine is also tight.
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build
ENV NODE_OPTIONS=""

# Sync the database to prisma/schema.prisma, then start the app.
# Earlier deploys never ran migrations, so the DB may have no migration
# history and `migrate deploy` could block every deploy. `db push` adds what
# is missing (xp column, UserAchievement, ActivityEvent) and refuses
# destructive changes; if it can't run, the server still starts and the
# reason is in the logs.
ENTRYPOINT ["sh", "-c", "npx prisma db push --skip-generate || echo 'WARNING: prisma db push failed - starting anyway'; npm run start:prod"]
