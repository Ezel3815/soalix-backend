# Use the official Node.js runtime as a base image
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

# Apply any pending database migrations, then start the app.
# This makes schema changes deploy automatically from now on — no
# manual migration step needed on future updates.
ENTRYPOINT ["sh", "-c", "npx prisma migrate deploy && npm start"]
