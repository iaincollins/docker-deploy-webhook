const logger = require('../logger')('NOTIFY')
const plugins = require('../../plugins')

const {
  defaultNotificationOptions: defOpts
} = require('../config')

function notify(action, success, msg, image) {
  const opts = (image && image.options && image.options.notify)
    ? image.options.notify
    : {}

  const hasOpts = (typeof opts === 'object' && Object.keys(opts).length)
  const hasDefOpts = (typeof defOpts === 'object' && Object.keys(defOpts).length)
  if (!hasOpts && !hasDefOpts) {
    return
  }

  const methodSets = []
  // get notification settings from image, or alternatively from defOpts
  if (opts.all && opts.all.notify) {
    methodSets.push(opts.all.methods)
  } else if (defOpts && defOpts.all && defOpts.all.notify) {
    methodSets.push(defOpts.all.methods)
  }

  if (success) {
    if (opts.allSuccess && opts.allSuccess.notify) {
      methodSets.push(opts.allSuccess.methods)
    } else if (defOpts && defOpts.allSuccess && defOpts.allSuccess.notify) {
      methodSets.push(defOpts.allSuccess.methods)
    }
  }

  if (!success) {
    if (opts.allFailure && opts.allFailure.notify) {
      methodSets.push(opts.allFailure.methods)
    } else if (defOpts && defOpts.allFailure && defOpts.allFailure.notify) {
      methodSets.push(defOpts.allFailure.methods)
    }
  }

  const status = (success) ? 'success' : 'failure'
  if (opts[action] && opts[action][status] && opts[action][status].notify) {
    methodSets.push(opts[action][status].methods)
  } else if (defOpts &&
    defOpts[action] &&
    defOpts[action][status] &&
    defOpts[action][status].notify) {
    methodSets.push(defOpts[action][status].methods)
  }

  const notification = { msg, success, action, nickName: image.nickName }

  if (methodSets.length) {
    const notificationMap = mergeMethodSets(methodSets)
    const handlers = notificationMethodHandlers(notification)

    notificationMap.forEach((value, key) => {
      const method = key
      // targets is set of (emailaddresses/urls/etc) to notify via `method`
      const targets = value
      if (handlers[method]) {
        handlers[method](targets)
      }
    })
  }
}

function mergeMethodSets(methodSets) {
  const notificationMap = new Map()
  methodSets.forEach(methodSet => {
    const methods = Object.keys(methodSet)
    methods.forEach(method => {
      if (!notificationMap.has(method)) {
        notificationMap.set(method, new Set())
      }
      const thisMethod = notificationMap.get(method)
      methodSet[method].forEach(entry => thisMethod.add(entry))
    })
  })
  return notificationMap
}

function notificationMethodHandlers(notification) {
  function email(emailAddresses) {
    const numRecipients = emailAddresses.size
    if (!numRecipients) {
      return
    }

    const emailer = plugins.email
    if (!emailer) {
      logger.warn('No email service is configured')
      return
    }
    logger.log(`Sending email notifications to ${numRecipients} recipient(s)`)
    emailer(notification, [...emailAddresses])
  }

  function webhook(urls) {
    const numUrls = urls.size
    if (!numUrls) {
      return
    }

    const hookSender = plugins.webhook
    if (!hookSender) {
      logger.warn('No webhooks service is configured')
      return
    }

    logger.log(`Sending webhook notifications to ${numUrls} URL(s)`)
    hookSender(notification, [...urls])
  }

  return { email, webhook }
}

module.exports = notify
