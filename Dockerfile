FROM node:15.14.0 AS build
WORKDIR /usr/src/app
COPY package.json ./
RUN yarn
COPY ./src ./src
COPY ./public ./public
COPY ./api ./api
COPY ./server.js ./server.js
CMD yarn build
CMD npm install -g serve
CMD serve -s build -l ${PORT}
