import { expect } from 'chai';
import * as firebase from '@firebase/testing';
import * as admin from 'firebase-admin';
import { firestoreWrite, firestoreGet } from '../../src/actions/firestore';

// const app = firebase.initializeTestApp({
//   projectId: 'test',
//   auth: { uid: 'alice', email: 'alice@example.com' },
// });

describe('firestoreAction', () => {
  after(() => {
    firebase.clearFirestoreData({
      projectId: 'test-project',
    });
  });

  describe('set action', () => {
    it('sets data to Firestore database', async () => {
      await firestoreWrite('set', 'test/item', '', { data: { some: 'data' } });
      const docRes = await admin
        .firestore()
        .collection('test')
        .doc('item')
        .get();
      expect(docRes.exists).to.equal(true);
    });
  });

  describe('get action', () => {
    it('gets data from a Firestore document', async () => {
      const testData = { some: 'data2' };
      // Write data to firestore
      await admin
        .firestore()
        .collection('test')
        .doc('item')
        .set(testData);
      const res = await firestoreGet('test/item');
      expect(res.some).to.equal(testData.some);
    });

    it('gets Firestore collection', async () => {
      const testData = { some: 'data2' };
      // Write data to firestore
      await admin
        .firestore()
        .collection('test')
        .doc('item')
        .set(testData);
      const res = await firestoreGet('test');
      expect(res[0]).to.have.property('some', testData.some);
      expect(res.length).to.equal(1);
    });
  });
});
