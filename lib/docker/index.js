const util = require('util')
const exec = util.promisify(require('child_process').exec)

const config = require('../config')
const logger = require('../logger')('DOCKER')

const {
  dockerCommand,
  logStdErr,
  logStdOut,
  username,
  password,
  withRegistryAuth
} = config

const registryAuth = (withRegistryAuth) ? '--with-registry-auth' : ''

async function deploy(image, service, callback) {
  await login()
  await _pull(image)

  logger.log(`Deploying ${image} to ${service}…`)

  /* use docker inspect to get the image digest to ensure that `update` actually pulls the image, see https://stackoverflow.com/a/40705675/2034089 */
  // fixme this command doesn't work on Windows
  const execCmd =
    `${dockerCommand} service update ${registryAuth} --image $(docker inspect --type image --format '{{index .RepoDigests 0}}' ${image}) ${service}`
  debug(execCmd)
  return exec(execCmd)
    .then(({ stdout, stderr }) => {
      execLog(stdout, stderr)
      const msg = `Deployed ${image} to ${service} successfully and restarted the service OK`
      logger.log(msg)
      return msg
    })
    .catch((error) => {
      return Promise.reject(new Error(`Failed to deploy ${image} to ${service}! ${error}`))
    })
}

async function pull(image) {
  return login()
    .then(() => _pull(image))
    .catch((error) => {
      return Promise.reject(error)
    })
}

async function _pull(image) {
  logger.log(`Pulling image: ${image}`)

  const execCmd = `${dockerCommand} image pull ${image} `
  debug(execCmd)
  return exec(execCmd)
    .then(({ stdout, stderr }) => {
      execLog(stdout, stderr)
      const msg = `Pulled image ${image} OK`
      logger.log(msg)
      return msg
    })
    .catch((error) => {
      return Promise.reject(new Error(`Image pull failed. ${error}`))
    })
}

async function login() {
  if (!withRegistryAuth) {
    logger.log('Skipping Docker Hub login')
    return Promise.resolve()
  }

  logger.log('Logging into Docker Hub')

  const execCmd = `${dockerCommand} login -u "${username}" -p "${password}"`
  debug(execCmd)
  return exec(execCmd)
    .then(({ stdout, stderr }) => {
      execLog(stdout, stderr)
      logger.log('Logged into Docker Hub OK')
    })
    .catch((error) => {
      return Promise.reject(new Error(`Docker Hub Login Failed. ${error}`))
    })
}

function execLog(stdout, stderr) {
  const out = stdout.trim()
  const err = stderr.trim()
  if (out && logStdOut) {
    logger.log(`stdout: ${out}`)
  }
  if (err && logStdErr) {
    logger.warn(`stderr: ${err}`)
  }
}

function debug(msg) {
  if (process.env.DEBUG) {
    logger.log(`DEBUG: ${msg}`)
  }
}

module.exports = {
  deploy,
  login,
  pull
}
