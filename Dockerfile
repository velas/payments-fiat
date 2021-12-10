FROM node:16 AS build
WORKDIR /usr/src/app
COPY package.json ./
RUN yarn
COPY ./src ./src
COPY ./public ./public
COPY ./api ./api
COPY ./server.js ./server.js
COPY ./server-built.js ./server-built.js
RUN yarn build
RUN npm install -g serve 
CMD yarn prod
