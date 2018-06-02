const logger = require('../../lib/logger')('MAILGUN')

/* configure emailer */
const mg = require('nodemailer-mailgun-transport')
const nodemailer = require('nodemailer')

const { auth, fromAddress: from } = require('./config')
if (typeof auth !== 'object' || !auth.api_key || !auth.domain || !from) {
  logger.error('Invalid mailgun config. Exiting...')
  process.exit(1)
}

const smtpTransport = nodemailer.createTransport(mg({ auth }))

function sendEmail(notification, emailAddresses) {
  const {
    action,
    msg = '',
    nickName = '',
    success,
  } = notification

  const status = (success) ? 'Success' : 'Failed'
  const subject = `${status}: ${action} ${nickName}`

  if (!(emailAddresses.length && subject && msg)) {
    logger.error('Missing one or more required parameters to send email (to, subject, message)')
    return
  }

  let html = msg
  if (typeof msg === 'object') {
    if (msg.name === 'Error') {
      html = msg.message
    } else {
      html = JSON.stringify(msg)
    }
  }

  const to = emailAddresses.toString()
  smtpTransport.sendMail({ to, from, subject, html }, (error, response) => {
    if (error) {
      logger.error(`mailgun error: ${JSON.stringify(error)}`)
    }
  })
}

module.exports = { sendEmail }
