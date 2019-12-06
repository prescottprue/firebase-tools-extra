import firestoreAction from '../src/commands/firestore'
import * as firebase from '@firebase/testing'
import { expect } from 'chai'

let app = firebase.initializeTestApp({
  projectId: "test",
  auth: { uid: "alice", email: "alice@example.com" }
});

describe('firestoreAction', () => {
  before(() => {
    // process.env.FIRESTORE_EMULATOR_HOST="localhost:8080"
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
