const child_process = require('child_process')
const config = require('../config')
const logger = require('./lib/logger')('DOCKER-DEPLOY')

const {
  dockerCommand,
  username,
  password,
  withRegistryAuth
} = config

function deploy(image, service, callback) {
  // Make sure we are logged in to be able to pull the image
  child_process.exec(`${dockerCommand} login -u "${username}" -p "${password}"`,
    (error, stdout, stderr) => {
      if (error) return logger.error(error)

      // Deploy the image and force a restart of the associated service
      logger.log(`Deploying ${image} to ${service}…`)

      const registryAuth = (withRegistryAuth) ? '--with-registry-auth' : ''
      child_process.exec(`${dockerCommand} service update ${service} --force ${registryAuth} --image=${image}`,
        (error, stdout, stderr) => {
          if (error) {
            logger.error(`Failed to deploy ${image} to ${service}!`)
            return logger.error(error)
          }
          logger.log(`Deployed ${image} to ${service} successfully and restarted the service.`)
        })
    })
}

module.exports = { deploy }
