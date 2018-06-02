function logger(tag) {
  let logTag = tag || 'APP'
  let errorTag = `ERROR ${tag}`
  let warnTag = `WARN ${tag}`

  const typeWidth = Math.max(15, errorTag.length)
  logTag = padRight(logTag, typeWidth)
  errorTag = padRight(errorTag, typeWidth)
  warnTag = padRight(warnTag, typeWidth)

  function log(message) {
    console.log(`${logTag} : ${message}`)
  }

  function error(message) {
    console.error(`${errorTag} : ${message}`)
  }

  function warn(message) {
    console.warn(`${warnTag} : ${message}`)
  }

  function padRight(str, width, padChar) {
    return str + Array((width - str.length) + 1).join(padChar || ' ')
  }

  return {
    log,
    error,
    warn
  }
}

module.exports = logger
