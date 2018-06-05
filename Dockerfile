FROM node:8-alpine

## To specify passwords/paths/etc
##  -Set ENV values in this dockerfile, OR
##  -Set the _FILE vars to read the values from Docker Secrets, etc
##  -You can set the vars here, with the Docker run command, or in a Docker compose/stack file

# Port to run on
ENV PORT=3000
EXPOSE ${PORT}

#  Which configuration in the config.json file to load
ENV CONFIG="production"

# Location of config.json
ENV CONFIG_DIR=/usr/src/app/config/
ENV CONFIG_FILE=config.json

## SSL Settings - optional

# ENV SSL_CERT_FILE=/path/to/ssl_cert_file
# ENV SSL_KEY_FILE=/path/to/ssl_key_file

## Github Settings - optionally used to pull the config file
## Don't add `https://` to the URL

# ENV GITHUB_TOKEN=abcdef12345678990abcdef1234567890abcdef1
# ENV GITHUB_URL=github.com/org/repo.git

## Specify secrets as ENV vars

# A token used to restrict access to the webhook
# ENV TOKEN="123-456-ABC-DEF"

# Docker Hub account username
# ENV USERNAME="docker-hub-username"

# Docker Hub account password
# ENV PASSWORD="docker-hub-password"

## OR - specify files containing the secrets

# ENV TOKEN_FILE=/run/secrets/token
# ENV USERNAME_FILE=/run/secrets/username
# ENV PASSWORD_FILE=/run/secrets/password


RUN apk update && apk add docker && apk add git

WORKDIR /usr/src/app/

# If GITHUB_TOKEN & GITHUB_URL are set, entrypoint script will pull config file
COPY scripts/fetchConfigFromGithub.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/fetchConfigFromGithub.sh

COPY . .
RUN npm install --unsafe-perm

ENTRYPOINT ["/usr/local/bin/fetchConfigFromGithub.sh"]
CMD [ "npm", "start" ]
