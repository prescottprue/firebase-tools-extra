# firebase-tools-extra

> Extra methods for firebase-tools which support using a service account

## Installation

```sh
$ npm i --save-dev firebase-tools-extra
```

## Usage
firebase-tools-extra can be used for in a number of ways
### Testing Through Cypress
#### Add Cypress
1. Install Cypress and add it to your package file: `npm i --save-dev cypress`
1. Add cypress folder by calling `cypress open`

#### Add Custom Commands

```js
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/storage';
import 'firebase/firestore';
import { buildRtdbCommand, buildFirestoreCommand } from 'firebase-tools-extra';

const projectId = Cypress.env('FIREBASE_PROJECT_ID');

const fbConfig = {
  apiKey: Cypress.env('FIREBASE_API_KEY'),
  authDomain: `${projectId}.firebaseapp.com`,
  databaseURL: `https://${projectId}.firebaseio.com`,
  projectId: `${projectId}`,
  storageBucket: `${projectId}.appspot.com`,
};

window.fbInstance = firebase.initializeApp(fbConfig);

/**
 * Login to Firebase auth using FIREBASE_AUTH_JWT environment variable
 * which is generated using firebase-admin authenticated with serviceAccount
 * during test:buildConfig phase.
 * @type {Cypress.Command}
 * @memberOf Cypress.Chainable#
 * @name login
 * @example Basic
 * cy.login()
 */
Cypress.Commands.add('login', () => {
  /** Log in using token **/
  if (!Cypress.env('FIREBASE_AUTH_JWT')) {
    cy.log(
      'FIREBASE_AUTH_JWT must be set to cypress environment in order to login'
    );
    return;
  }
  if (firebase.auth().currentUser) {
    cy.log('Current user already exists, login complete.');
  } else {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      firebase.auth().onAuthStateChanged((auth) => {
        if (auth) {
          resolve(auth);
        }
      });
      firebase
        .auth()
        .signInWithCustomToken(Cypress.env('FIREBASE_AUTH_JWT'))
        .then(() => {
          console.debug('Login command successful');
        })
        .catch(reject);
    });
  }
});

/**
 * Log out of Firebase instance
 * @memberOf Cypress.Chainable#
 * @name login
 * @function
 */
Cypress.Commands.add('logout', () => {
  cy.log('Confirming use is logged out...');
  if (!firebase.auth().currentUser) {
    cy.log('Current user already logged out.');
  } else {
    cy.log('Current user exists, logging out...');
    firebase.auth().signOut();
  }
});

/**
 * Call Real Time Database path with some specified action. Authentication is through FIREBASE_TOKEN since firebase-tools
 * @param {String} action - The action type to call with (set, push, update, remove)
 * @param {String} actionPath - Path within RTDB that action should be applied
 * @param {Object} opts - Options
 * @param {Array} opts.args - Command line args to be passed
 * @type {Cypress.Command}
 * @example Set Data
 * // Set fixtures/fakeTransaction.json to RTDB
 * cy.callRtdb('set', 'transactions/listings/ABC123', 'fakeTransaction.json')
 * @example Get/Verify Data
 * cy.callRtdb('get', 'transactions/listings/ABC123')
 *   .then((project) => {
 *     // Confirm new data has users uid
 *     cy.wrap(project)
 *       .its('createdBy')
 *       .should('equal', Cypress.env('TEST_UID'))
 *   })
 * @example Other Args
 * const opts = { args: ['-d'] }
 * cy.callFirestore('update', 'project/test-project', opts)
 */
Cypress.Commands.add(
  'callRtdb',
  (action, actionPath, fixturePath, opts = {}) => {
    const rtdbCommand = buildRtdbCommand(action, actionPath, fixturePath, opts);
    cy.log(`Calling RTDB command:\n${rtdbCommand}`);
    return cy.exec(rtdbCommand).then((out) => {
      const { stdout } = out || {};
      if (typeof stdout === 'string') {
        try {
          return JSON.parse(stdout);
        } catch (err) {
          console.log('Error parsing data from callRtdb response', out);
        }
      }
      return stdout;
    });
  }
);

/**
 * Call Firestore instance with some specified action. Authentication is through serviceAccount.json since it is at the base
 * level. If using delete, auth is through FIREBASE_TOKEN since firebase-tools is used (instead of firebaseExtra).
 * @param {String} action - The action type to call with (set, push, update, remove)
 * @param {String} actionPath - Path within RTDB that action should be applied
 * @param {Object} opts - Options
 * @param {Array} opts.args - Command line args to be passed
 * @type {Cypress.Command}
 * @example Basic
 * cy.callFirestore('add', 'project/test-project', 'fakeProject.json')
 * @example Recursive Delete
 * const opts = { recursive: true }
 * cy.callFirestore('delete', 'project/test-project', opts)
 * @example Other Args
 * const opts = { args: ['-r'] }
 * cy.callFirestore('delete', 'project/test-project', opts)
 */
Cypress.Commands.add(
  'callFirestore',
  (action, actionPath, fixturePath, opts = {}) => {
    const firestoreCommand = buildFirestoreCommand(
      action,
      actionPath,
      fixturePath,
      opts
    );
    cy.log(`Calling Firestore command:\n${firestoreCommand}`);
    cy.exec(firestoreCommand, { timeout: 100000 }).then((res) => {
      if (res.stderr) {
        return Promise.reject(res.stderr);
      }
      try {
        return JSON.parse(res.stdout);
      } catch (err) {
        return res && res.stdout;
      }
    });
  }
);
```

### Create Config
1. Log into your app for the first time
1. Go to the Auth tab of Firebase and get your UID
1. Generate a service account -> save it as `serviceAccount.json`
1. Add your config info to `cypress/config.json`
  
  ```js
  {
    "TEST_UID": "<- uid of the user you want to test as ->",
    "FIREBASE_PROJECT_ID": "top-agent-prue-dev",
    "FIREBASE_API_KEY": "AIzaSyCY1Uf_o4iYBS3HYOAHcq-mgIYmecEQCKs"
  }
  ```

## Development

Install dependencies:

```
$ npm install
```

Run the example app at [http://localhost:8080](http://localhost:8080):

```
$ npm start
```

Run tests and watch for code changes using [jest](https://github.com/facebook/jest):

```
$ npm test
```

Lint `src` and `test` files:

```
$ npm run lint
```

Generate UMD output in the `lib` folder (runs implicitly on `npm version`):

```
$ npm run build
```

## License

MIT
