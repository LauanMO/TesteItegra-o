# MandaRim — Backend (Node + Express + node:sqlite)
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=3001
EXPOSE 3001

CMD ["node", "src/index.js"]
