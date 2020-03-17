# firebase-tools-extra

[![NPM version][npm-image]][npm-url]
[![Build Status][build-status-image]][build-status-url]
[![License][license-image]][license-url]
[![Code Style][code-style-image]][code-style-url]

> Extra functionality for firebase-tools with support for emulators and auth through service account

## Installation

```bash
npm i --save-dev firebase-tools-extra
```

## Setup

1. Generate a service account from within the settings section of the Firebase console
1. Save the service account to `serviceAccount.json` within your firebase project repo (or set `SERVICE_ACCOUNT` environment variable)
1. Make sure you add `serviceAccount.json` to your `.gitignore` so it is not commited as part of your changes - **THIS IS EXTREMELY IMPORTANT**

To use with emulators:

1. Pass the `--emulator` flag along with your command or set `FIREBASE_DATABASE_EMULATOR_HOST` and `FIRESTORE_EMULATOR_HOST` variabes to your environment or
1. Use firebase-tools-extra the same way you would firebase-tools: `firebase-extra database:get /users`

## Usage

firebase-tools-extra should be used the same way that [firebase-tools](https://github.com/firebase/firebase-tools) is used - the API is as close to the same as possible:

```bash
firebase-extra database:get --limit-to-last 10 /users
```

## Tests

Tests are currently not set up since they were causing timeouts when trying to shut down the emulator. They will be re-enabled once that is solved.

### Add back

1. Install `yarn add -D concurrently wait-port ts-mocha chai mocha @types/mocha @types/expect @firebase/testing`
1. Add the npm scripts:

   ```json
   "test:full": "concurrently \"npm run emulate\" \"wait-port -o silent 8080 && npm run test\"",
   "test": "ts-mocha -p ./tsconfig.json test/**/*.spec.ts --exit",
   ```

## Why

firebase-tools does not have the following:

- support for emulators ([feature request to add this to `firebase-tools`](https://github.com/firebase/firebase-tools/issues/1957))
- full Firestore interactions including `get`, `add`, `set`, and `update`

## License

MIT

[npm-image]: https://img.shields.io/npm/v/firebase-tools-extra.svg?style=flat-square
[npm-url]: https://npmjs.org/package/firebase-tools-extra
[build-status-image]: https://img.shields.io/github/workflow/status/prescottprue/firebase-tools-extra/NPM%20Package%20Publish?style=flat-square
[build-status-url]: https://github.com/prescottprue/firebase-tools-extra/actions
[climate-image]: https://img.shields.io/codeclimate/github/prescottprue/firebase-tools-extra.svg?style=flat-square
[climate-url]: https://codeclimate.com/github/prescottprue/firebase-tools-extra
[license-image]: https://img.shields.io/npm/l/firebase-tools-extra.svg?style=flat-square
[license-url]: https://github.com/prescottprue/firebase-tools-extra/blob/master/LICENSE
[code-style-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[code-style-url]: http://standardjs.com/
