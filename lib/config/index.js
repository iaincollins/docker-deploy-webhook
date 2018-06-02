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
  const configFilePath = env.CONFIG_PATH || '/usr/src/app/config/config.json'
  const tokenFile = env.TOKEN_FILE
  const usernameFile = env.USERNAME_FILE
  const passwordFile = env.PASSWORD_FILE
  const logStdErr = env.LOG_STD_ERR || true
  const logStdOut = env.LOG_STD_OUT || true

  let defaultNotificationOptions
  let username
  let password
  let token
  let withRegistryAuth = true

  // look for Docker secret files
  try {
    token = (tokenFile) ? fs.readFileSync(tokenFile).trim() : ''
  } catch (error) {
    logger.error(`Error reading tokenFile: ${JSON.stringify(error)}`)
  }

  try {
    password = (passwordFile) ? fs.readFileSync(passwordFile).trim() : ''
  } catch (error) {
    logger.error(`Error reading passwordFile: ${JSON.stringify(error)}`)
  }

  try {
    username = (usernameFile) ? fs.readFileSync(usernameFile).trim() : ''
  } catch (error) {
    logger.error(`Error reading usernameFile: ${JSON.stringify(error)}`)
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
}

module.exports = load()
