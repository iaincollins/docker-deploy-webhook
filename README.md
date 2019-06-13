# Docker Deploy Webhook

A web service for automated deployment of releases from Docker Hub to a Docker Swarm, triggered by a Docker Hub webhook (which can in turn be triggred by pushing to GitHub).

<img width="1526" alt="screen shot 2018-02-02 at 18 55 18" src="https://user-images.githubusercontent.com/595695/35750202-1efdaa5a-084c-11e8-8c7d-2b4fc0deb3c3.png">

Flow for automated deployment:

* Configure Docker Hub to build an image when a GitHub repository is updated.
* Configure Docker Hub to call this service via webhook when a new image is available.
* Configure and deploy this service to your Docker Swarm cluster.
* When a new image is built, it will update the Docker Service in the Swarm.

This webhook is intended for use with private Docker Hub repositories and self hosted Docker Swarm instances.

To get started, clone this repository, add an image of it to your Docker Hub account, configure config.json and deploy it to your Docker Swarm as a service (see steps below).

[Read more about this service in this blog post.](https://medium.com/@iaincollins/docker-swarm-automated-deployment-cb477767dfcf)

## Configuration

Supported environment variables:

    PORT="8080" // Port to run on
    CONFIG="production" // Which part of the config.json file to load
    TOKEN="123-456-ABC-DEF" // A token used to restrict access to the webhook
    USERNAME="docker-hub-username" // A Docker Hub account username
    PASSWORD="docker-hub-password" // A Docker Hub account password

**note:** the value for `CONFIG` environment variable can be passed in at image build time:

```
  docker build \
   --build-arg CONFIG=part-of-config-dot-json-file-to-load \
   -t docker-hub-username/docker-deploy-webhook .
```

The `config.json` file defines each environment:

    {
      "production": {},
      "development": {}
    }

Inside each environment config is the name of an image and tag to listen for, and the service that should be updated to run it:

    {
      "production": {
        "my-org/my-repo:latest": {
          "service": "my-docker-service"
        }
      },
      "development": {
        "my-org/my-repo:development": {
          "service": "my-docker-service"
        }
      }
    }

You can use the `CONFIG` environment variable to tell `docker-deploy-webhook` which section to use when it loads - this is useful if you have multiple Docker Swarm instances - e.g. production, development.

You use the same callback URL for all services, when `docker-deploy-webhook` receives an update for an image and tag is it is configured for it will push that release to the service associated with it in `config.json`.

### Notifications Configuration (Optional)

See the `README.md` file in `/config`

## Deploy to Docker Swarm

    swarm-manager000000> docker login
    swarm-manager000000> docker service create \
    --name docker-deploy-webhook \
    --with-registry-auth \
    --constraint "node.role==manager" \
    --publish=8080:8080 \
    --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
    -e CONFIG="8080" \
    -e CONFIG="production" \
    -e TOKEN="123456ABCDEF" \
    -e USERNAME="docker-hub-username" \
    -e PASSWORD="docker-hub-password" \
    your-org-name/decoders-deploy-webhook:latest

Note: This example exposes the service directly on port 8080.

## Configure Docker Hub to use Webhook

Use the "**Create automated build**" option in Docker Hub to automatically build an image in Docker Hub when changes are pushed to a GitHub repository, then add a webhook to the Docker Hub image repository.

The URL to specify for the webhook in Docker Hub will be `${your-server}/webhook/${your-token}`.

e.g. https://example.com/webhook/123456ABCDEF

You can configure multiple webhooks for a Docker Hub repository (e.g. one webhook on your production cluster, one on development, etc).

While all webhooks will receive the callback, the specific image that has just been built (e.g. `:latest`, `:edge`, etc.) will only be deployed to an environment if the webhook service running on it has it whitelisted in the `config.json` block for that environment.

## Testing

To test locally with the example payload:

    curl -v -H "Content-Type: application/json" --data @payload.json  http://localhost:3000/webhook/123456ABCDEF

To test in production with the example payload:

    curl -v -H "Content-Type: application/json" --data @payload.json https://example.com/webhook/123456ABCDEF
