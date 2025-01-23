FROM node:20
ENV NODE_ENV production
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install
EXPOSE 3006
CMD node main.js
