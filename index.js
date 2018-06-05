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
  if (!checkToken(req.params.token, res)) {
    return
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

// default route
app.all('*', (req, res) => {
  res.send('')
})

// start webserver
if (config.sslCert && config.sslKey) {
  // start server with HTTPS only if SSL key & cert have been provided
  const https = require('https')
  const options = {
    key: config.sslKey,
    cert: config.sslCert
  }
  https.createServer(options, app).listen(port, serverStartCallback)
} else {
  // start HTTP server
  app.listen(port, serverStartCallback)
}

function serverStartCallback(err) {
  if (err) throw new Error(`Couldn't start server: ${err}`)

  const protocol = (config.sslCert && config.sslKey) ? 'https' : 'http'
  logger.log(`Listening for webhooks on ${protocol}://localhost:${port}/webhook/${token}`)
}

function checkToken(tokenSent, res) {
  if (tokenSent !== token) {
    logger.log('Endpoint called with invalid or missing token.')
    res.status(401).send('Access Denied: Token Invalid\n').end()
    return false
  }
  return true
}
