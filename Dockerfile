# Use the official Node.js runtime as a base image
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

# Sync the database to prisma/schema.prisma, then start the app.
# Earlier deploys never ran migrations, so the DB may have no migration
# history and `migrate deploy` could block every deploy. `db push` adds what
# is missing (xp column, UserAchievement, ActivityEvent) and refuses
# destructive changes; if it can't run, the server still starts and the
# reason is in the logs.
ENTRYPOINT ["sh", "-c", "npx prisma db push --skip-generate || echo 'WARNING: prisma db push failed - starting anyway'; npm start"]
