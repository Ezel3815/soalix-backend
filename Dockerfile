# Use the official Node.js runtime as a base image
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

ENTRYPOINT ["npm", "start"]
