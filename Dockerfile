FROM node:22-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

ENV PORT=8080

EXPOSE 8080

USER node

CMD ["node", "index.js"]
