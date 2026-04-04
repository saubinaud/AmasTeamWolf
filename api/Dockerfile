FROM node:20-alpine
RUN apk add --no-cache tzdata
ENV TZ=America/Lima
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
EXPOSE 4000
CMD ["node", "src/index.js"]
