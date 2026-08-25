# Use the official Node.js runtime as a base image
FROM node:20-alpine 

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install -g pnpm && pnpm install


COPY . .

RUN pnpx prisma@5.22.0 generate

ENTRYPOINT pnpm start
