import firestoreAction from '../src/commands/firestore'
import * as firebase from '@firebase/testing'
import { expect } from 'chai'
import { spawn } from 'child_process'
import stream from 'stream';

let app = firebase.initializeTestApp({
  projectId: "test",
  auth: { uid: "alice", email: "alice@example.com" }
});

export interface RunCommandOptions {
  pipeOutput?: boolean;
}


/**
 * @description Run a bash command using spawn pipeing the results to the main
 * process
 * @param {String} command - Command to be executed
 * @private
 */
export function runCommand(command: string, args?: string[], options?: RunCommandOptions) : Promise<any> {
  return new Promise((resolve, reject): void => {
    const child = spawn(command, args);
    let output: any;
    let error: any;
    const customStream = new stream.Writable();
    const customErrorStream = new stream.Writable();
    /* eslint-disable no-underscore-dangle */
    customStream._write = (data, ...argv): void => {
      output += data;
      if (options && options.pipeOutput) {
        process.stdout._write(data, ...argv);
      }
    };
    customErrorStream._write = (data, ...argv): void => {
      error += data;
      if (options && options.pipeOutput) {
        process.stderr._write(data, ...argv);
      }
    };
    /* eslint-enable no-underscore-dangle */
    // Pipe errors and console output to main process
    child.stdout.pipe(customStream);
    child.stderr.pipe(customErrorStream);
    // When child exits resolve or reject based on code
    child.on('exit', (code: number): void => {
      if (code !== 0) {
        // Resolve for npm warnings
        if (output && output.indexOf('npm WARN') !== -1) {
          return resolve(output);
        }
        reject(error || output);
      } else {
        // Remove leading undefined from response
        if (output && output.indexOf('undefined') === 0) {
          resolve(output.replace('undefined', ''));
        } else {
          console.log('output: ', output); // eslint-disable-line no-console
          resolve(output);
        }
      }
    });
  });
}

describe('firestoreAction', () => {
  before(() => {
    process.env.FIRESTORE_EMULATOR_HOST="localhost:8080"
  })

  after(() => {
    firebase.clearFirestoreData({
      projectId: "test"
    });
  })

  describe('set action', () => {
    it('sets data to Firestore database', async () => {
      await firestoreAction('set', 'test/item', '{ "some": "data" }')
      const docRes = await app.firestore().collection("test").doc("item").get()
      expect(docRes.exists).to.be.true
    })
  })

  describe('get action', () => {
    it('gets data from a Firestore document', async () => {
      const testData = { some: 'data2' }
      // Write data to firestore
      await app.firestore().collection("test").doc("item").set(testData)
      const res = await firestoreAction('get', 'test/item')
      expect(res.some).to.equal(testData.some)
    })

    it('gets Firestore collection', async () => {
      const testData = { some: 'data2' }
      // Write data to firestore
      await app.firestore().collection("test").doc("item").set(testData)
      const res = await firestoreAction('get', 'test')
      expect(res[0].data()).to.have.property('some', testData.some)
      expect(res.length).to.equal(1)
    })
  })
})
