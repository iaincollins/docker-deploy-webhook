FROM node:8-alpine

## To specify passwords/paths/etc
##  -Set ENV values in this dockerfile, OR
##  -Set the _FILE vars to read the values from Docker Secrets, etc
##  -You can set the vars here, with the Docker run command, or in a Docker compose/stack file

# Port to run on
ENV PORT=3000

#  Which configuration in the config.json file to load
ENV CONFIG="production"

# Location of config.json
ENV CONFIG_PATH=/usr/src/app/config/config.json

# A token used to restrict access to the webhook
# ENV TOKEN="123-456-ABC-DEF"

# Docker Hub account username
# ENV USERNAME="docker-hub-username"

# Docker Hub account password
# ENV PASSWORD="docker-hub-password"

## OR specify files containing the values

# ENV TOKEN_FILE=/run/secrets/token
# ENV USERNAME_FILE=/run/secrets/username
# ENV PASSWORD_FILE=/run/secrets/password

RUN apk update && apk add docker

WORKDIR /usr/src/app

# install packages before copying code to take advantage of image layer caching
COPY package.json .
COPY npm-shrinkwrap.json .
RUN npm install

# copy everything else
COPY . .

EXPOSE ${PORT}
CMD [ "npm", "start" ]