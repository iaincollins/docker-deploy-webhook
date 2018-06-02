const util = require('util')
const exec = util.promisify(require('child_process').exec)

const config = require('../config')
const logger = require('./lib/logger')('DOCKER-DEPLOY')

const {
  dockerCommand,
  username,
  password,
  withRegistryAuth
} = config

const registryAuth = (withRegistryAuth) ? '--with-registry-auth' : ''

async function deploy(image, service, callback) {
  logger.log(`Deploying ${image} to ${service}…`)

  // Make sure we are logged in to be able to pull the image
  if (withRegistryAuth) {
    await login()
  }

  const execCmd =
    `${dockerCommand} service update ${service} --force ${registryAuth} --image=${image}`

  return exec(execCmd)
    .then(({ stdout, stderr }) => {
      const msg = `Deployed ${image} to ${service} successfully and restarted the service OK`
      logger.log(msg)
      return msg
    })
    .catch((error) => {
      return Promise.reject(new Error(`Failed to deploy ${image} to ${service}! ${error}`))
    })
}

async function login() {
  const execCmd = `${dockerCommand} login -u "${username}" -p "${password}"`
  return exec(execCmd)
    .then(({ stdout, stderr }) => {
      logger.log('Logged into Docker Hub OK')
    })
    .catch((error) => {
      return Promise.reject(new Error(`Docker Hub Login Failed. ${error}`))
    })
}

module.exports = { deploy }
