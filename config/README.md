# README

## Configurations

You can specify multiple configs in one file. Specify which config to use by settting env.CONFIG to the config name.

```JSON
{
  "production": {},
  "development": {}
}
```

## Repos / Services

Within each config, you can specify multiple Docker Hub repos to monitor.  The repo name should match `org/name:tag`.

Each repo config must also specify the following:

- `nickName` - an arbitrary string that's used for logging / notifications purposes
- `service` - name of the swarm service that should be updated when a new build of the repo is available

```JSON
"production": {
  "my-org/my-repo:tag": {
    "nickName": "my-repo:tag",
    "service": "my-docker-service-name"
  },
  "my-org/my-other-repo:tag": {
    "nickName": "Production App Server",
    "service": "my-other-docker-service-name",
  }
```

## Per Repo Options

Each repo config can specify the following `options`

- `pullButDontDeploy` - Setting this option to `true` will allow the application to pull updated images that can be manually deployed later.  The default value is `false`
- `notify` - Container for per repo notification options

```JSON
"my-org/my-repo:tag": {
  "nickName": "my-repo:tag",
  "service": "my-docker-service",
  "options": {
    "pullButDontDeploy": false,
    "notify": {}
  }
}
```

## Notification Options

### Notification Option Types

You can configure the application to send notifications for certain kinds of actions, triggered on specific action statuses (i.e. success or failure), and/or for different catch-all categories.

Each notification type has two properties:

- `notify` - when set to `true`, the application will send notifications for events matching the option type.  The default value is `false`
- `methods` - container for configuring which notification methods to use and the notification targets for each method (e.g. list of email addresses)

### Catch-alls

There are three catch-all categories

- `all` -  any action, with any status
- `allSuccess` - all successful actions
- `allFailure` - all failed actions

### Action types

There are currently two types of actions

- `deploy` - matches deploy actions (where `pullButDontDeploy` is `false`)
- `pull` - matches pull actions (where `pullButDontDeploy` is `true`)

#### Action Type Statuses

- `success` - matches when `action` was successful
- `failure` - matches when `action` failed

Each action type status option can specify separate `notify` and `methods` values under `sucess` and `failure`

```JSON
"notify": {
  "deploy": {
    "success": {
      "notify": false,
      "methods": {}
    },
    "failure": {
      "notify": true,
      "methods": {}
    }
  },
  "pull": {
    "success": {
      "notify": false,
      "methods": {}
    },
    "failure": {
      "notify": false,
      "methods": {}
    }
  }
```

### Notification Methods

You must provide implementations for enabled notification methods as a plugin. An email plugin for [Mailgun](https://www.mailgun.com) has been provided.

Each enabled notification type must specify at least one notification method.  Currently there are two notification method stubs provided, and more could be added.

#### Notification Method Types

- `email` - send email notifications
- `webhook` - send webhook notifications
- Additional notification types can be configured by:
  - extending the `notificationMethodHandlers` method in `/lib/notify/index.js`
  - adding a matching `require` function in `/plugins/index.js`, and
  - providing the implementation in `/plugins/${type}/`

#### Notification Targets

Each enabled notification method type should specify an array of targets (e.g. email addresses for `email`)

```JSON
"notify": {
  "all": {
    "notify": true,
    "methods": {
      "email": [
        "admin@example.com",
        "admin2@example.com"
      ],
      "webhook": [
        "https://www.example.com/webhook",
        "https://www.example2.com/webhook"
      ]
    }
  }
}
```

## Default Notification Options

An additional configuration option, `defaultNotificationOptions`, can be added under a configuration to specify notification options that will apply to all repos under that configuration.

Any repo-specific notification options take precedence over the default options.

In this example, email notifications for the first service will be sent only to admin@example.com, but to admin2@example.com for the other two services:

```JSON
"production": {
  "my-org/first:tag": {
    "nickName": "my-repo:tag",
    "service": "my-first-service",
    "notify": {
      "all": {
        "notify": true,
        "methods": {
          "email": [
            "admin@example.com"
          ]
        }
      }
    }
  },
  "my-org/my-other-repo:tag": {
    "nickName": "Production App Server",
    "service": "my-other-docker-service-name",
  },
  "my-org/my-third-repo:tag": {
    "nickName": "Some Other Service",
    "service": "my-third-docker-service-name",
  },
  "defaultNotificationOptions": {
    "all": {
      "notify": true,
      "methods": {
        "email": [
          "admin2@example.com"
        ]
      }
    }
  }
}
```

## Example `config.json`

A full `config.json` example file has be provided in `/config`