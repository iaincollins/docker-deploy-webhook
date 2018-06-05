const mg = require('nodemailer-mailgun-transport')
const nodemailer = require('nodemailer')

const logger = require('../../lib/logger')('MAILGUN')

const {
  auth,
  fromAddress: from,
  enabled
} = require('./config')

const smtpTransport = (enabled)
  ? nodemailer.createTransport(mg({ auth }))
  : null

function sendEmail(notification, emailAddresses) {
  if (!enabled) {
    logger.warn('Mailgun is disabled. Not sending notifications')
    return
  }

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
