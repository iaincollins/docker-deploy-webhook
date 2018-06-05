const fs = require('fs')

const logger = require('../logger')('CONFIG')

const env = process.env

function load() {
  if (env.NODE_ENV === 'localDev') {
    initLocalDev()
  }

  const port = env.PORT || 3000
  const dockerCommand = env.DOCKER || '/usr/bin/docker'
  const whichConfig = env.CONFIG || 'production'
  const configFilePath = (env.CONFIG_DIR && env.CONFIG_FILE) ? `${env.CONFIG_DIR}${env.CONFIG_FILE}` : 'config/config.json'
  const tokenFile = env.TOKEN_FILE
  const usernameFile = env.USERNAME_FILE
  const passwordFile = env.PASSWORD_FILE
  const logStdErr = env.LOG_STD_ERR || true
  const logStdOut = env.LOG_STD_OUT || true
  const sslCertFile = env.SSL_CERT_FILE || ''
  const sslKeyFile = env.SSL_KEY_FILE || ''

  let defaultNotificationOptions
  let username
  let password
  let sslCert
  let sslKey
  let token
  let withRegistryAuth = true

  // read secrets from files
  if (tokenFile) {
    logger.log(`Reading token from file: ${tokenFile}`)
    try {
      token = fs.readFileSync(tokenFile, 'utf8').trim()
      if (!token) {
        logger.warn('tokenFile was specified but contents were empty')
      }
    } catch (error) {
      logger.error(`Error reading tokenFile: ${error}`)
    }
  }

  if (passwordFile) {
    logger.log(`Reading password from file: ${passwordFile}`)
    try {
      password = fs.readFileSync(passwordFile, 'utf8').trim()
      if (!password) {
        logger.warn('passwordFile was specified but contents were empty')
      }
    } catch (error) {
      logger.error(`Error reading passwordFile: ${error}`)
    }
  }

  if (usernameFile) {
    logger.log(`Reading username from file: ${usernameFile}`)
    try {
      username = fs.readFileSync(usernameFile, 'utf8').trim()
      if (!username) {
        logger.warn('usernameFile was specified but contents were empty')
      }
    } catch (error) {
      logger.error(`Error reading usernameFile: ${error}`)
    }
  }

  if (sslCertFile) {
    logger.log(`Reading SSL Cert from file: ${sslCertFile}`)
    try {
      sslCert = fs.readFileSync(sslCertFile, 'utf8').trim()
    } catch (error) {
      logger.error(`Error reading sslCertFile: ${error}`)
    }
  }

  if (sslKeyFile) {
    logger.log(`Reading SSL Key from file: ${sslKeyFile}`)
    try {
      sslKey = fs.readFileSync(sslKeyFile, 'utf8').trim()
    } catch (error) {
      logger.error(`Error reading sslKeyFile: ${error}`)
    }
  }

  token = token || env.TOKEN
  password = password || env.PASSWORD
  username = username || env.USERNAME

  if (!token) {
    logger.error('You must specify a token to restrict access to the webhook. Exiting...')
    process.exit(1)
  }

  if (!password || !username) {
    let error = 'No Docker Hub '
    error += (!username) ? 'username ' : ''
    error += (!password && !username) ? 'or ' : ''
    error += (!password) ? 'password ' : ''
    error += 'was specified.  You will only be able to pull/deploy public images'
    logger.warn(error)
    withRegistryAuth = false
  }

  // sanity check config.json & get default notification options
  try {
    const configFile = fs.readFileSync(configFilePath)
    const myConfigFile = JSON.parse(configFile)
    const myConfig = myConfigFile[whichConfig]
    if (!myConfig) throw (new Error('Invalid config'))
    defaultNotificationOptions = myConfig.defaultNotificationOptions || {}
    logger.log(`Loaded config.json OK:`)
    console.dir(myConfig)
  } catch (error) {
    logger.error(`Error reading/parsing config.json: ${error}`)
    logger.error('Exiting...')
    process.exit(1)
  }

  return {
    configFilePath,
    defaultNotificationOptions,
    dockerCommand,
    logStdErr,
    logStdOut,
    withRegistryAuth,
    password,
    passwordFile,
    port,
    sslCert,
    sslKey,
    token,
    tokenFile,
    username,
    usernameFile,
    whichConfig,
  }
}

function initLocalDev() {
  /* optionally setup ENV for local dev testing */
  // env.CONFIG_PATH = './config/config.json'
  // env.DOCKER = 'docker'
  // env.TOKEN = env.TOKEN || 'myToken123456'
  // env.PASSWORD = env.PASSWORD || 'myPassword'
  // env.USERNAME = env.USERNAME || 'myUserName'
  // env.SSL_CERT_FILE = env.SSL_CERT_FILE || '/path/to/ssl_cert_file.crt'
  // env.SSL_KEY_FILE = env.SSL_KEY_FILE || '/path/to/ssl_key_file.key'
}

module.exports = load()
