#!/bin/sh
if [[ ${GITHUB_TOKEN} && ${GITHUB_URL} ]]; then
  git -C ${CONFIG_DIR} init && git -C ${CONFIG_DIR} pull https://${GITHUB_TOKEN}@${GITHUB_URL}
fi

exec "$@"