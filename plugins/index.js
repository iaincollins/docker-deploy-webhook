// Bring Your Own Plugin

function email(notification, emailAddresses) {
  return require('./mailgun').sendEmail(notification, emailAddresses)
}

function webhook(notification, urls) {
  return null
}

module.exports = { email, webhook }
