FROM node:8-alpine
RUN apk update && apk add docker
RUN mkdir -p /usr/src/app
COPY index.js /usr/src/app
COPY config.json /usr/src/app
COPY package.json /usr/src/app
COPY npm-shrinkwrap.json /usr/src/app
WORKDIR /usr/src/app
RUN npm install
EXPOSE 80
CMD [ "npm", "start" ]