/**
 * A service for automated deployment from Docker Hub to Docker Swarm
 * https://docs.docker.com/docker-hub/webhooks/
 */
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const config = require('./lib/config')
const docker = require('./lib/docker')
const logger = require('./lib/logger')('DOCKER-DEPLOY')
const notify = require('./lib/notify')
const services = require(`./config/config.json`)[config.whichConfig]

const { port, token } = config

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/webhook/:token', (req, res) => {
  if (req.params.token !== token) {
    logger.log('Webhook called with invalid or missing token.')
    return res.status(401).send('Access Denied: Token Invalid\n').end()
  }

  // Send response back right away if token was valid
  res.send('OK')

  const payload = req.body
  const imageName = `${payload.repository.repo_name}:${payload.push_data.tag}`

  if (!services[imageName]) {
    logger.log(`Received updated for "${imageName}" but not configured to handle updates for this image.`)
    return
  }

  const image = services[imageName]
  const service = image.service

  if (image.options.pullButDontDeploy) {
    docker.pull(imageName)
      .then((msg) => {
        notify('pull', true, msg, image)
      })
      .catch((err) => {
        logger.error(err)
        notify('pull', false, err, image)
      })

    return
  }

  docker.deploy(imageName, service)
    .then((msg) => {
      notify('pull', true, msg, image)
    })
    .catch((err) => {
      logger.error(err)
      notify('pull', false, err, image)
    })
})

app.all('*', (req, res) => {
  res.send('')
})

app.listen(port, err => {
  if (err) throw err
  logger.log(`Listening for webhooks on http://localhost:${port}/webhook/${token}`)
})
