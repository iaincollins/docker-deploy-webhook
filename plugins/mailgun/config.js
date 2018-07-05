const fs = require('fs')
const logger = require('../../lib/logger')('MAILGUN-CONFIG')

const env = process.env

function load() {
  const apiKeyFile = env.MAILGUN_KEY_FILE
  const domainFile = env.MAILGUN_DOMAIN_FILE
  const fromAddressFile = env.MAILGUN_FROM_ADDRESS_FILE

  let apiKey
  let domain
  let fromAddress

  // read secrets from files
  if (apiKeyFile) {
    logger.log(`Reading API key from file: ${apiKeyFile}`)
    try {
      apiKey = fs.readFileSync(apiKeyFile, 'utf8').trim()
      if (!apiKey) {
        logger.warn('apiKeyFile was specified but contents were empty')
      }
    } catch (error) {
      logger.error(`Error reading apiKeyFile: ${error}`)
    }
  }

  if (domainFile) {
    logger.log(`Reading domain from file: ${domainFile}`)
    try {
      domain = fs.readFileSync(domainFile, 'utf8').trim()
      if (!domain) {
        logger.warn('domainFile was specified but contents were empty')
      }
    } catch (error) {
      logger.error(`Error reading domainFile: ${error}`)
    }
  }

  if (fromAddressFile) {
    logger.log(`Reading fromAddress from file: ${fromAddressFile}`)
    try {
      fromAddress = fs.readFileSync(fromAddressFile, 'utf8').trim()
      if (!fromAddress) {
        logger.warn('fromAddressFile was specified but contents were empty')
      }
    } catch (error) {
      logger.error(`Error reading fromAddressFile: ${error}`)
    }
  }

  apiKey = apiKey || env.MAILGUN_KEY
  domain = domain || env.MAILGUN_DOMAIN
  fromAddress = fromAddress || env.MAILGUN_FROM_ADDRESS

  let enabled = true

  if (!apiKey || !domain || !fromAddress) {
    let error = 'Mailgun config invalid.  Missing: [ '
    error += (!apiKey) ? 'apiKey, ' : ''
    error += (!domain) ? 'domain, ' : ''
    error += (!fromAddress) ? 'fromAddress ' : ''
    error += '] -- No email notifications will be sent'
    logger.warn(error)
    enabled = false
  }

  return {
    auth: {
      api_key: apiKey,
      domain
    },
    fromAddress,
    enabled
  }
}

module.exports = load()
