import { expect } from 'chai';
import * as firebase from '@firebase/testing';
import { firestoreWrite, firestoreGet } from '../../src/actions/firestore';

const adminApp = firebase.initializeAdminApp({
  projectId: process.env.GCLOUD_PROJECT,
  databaseName: process.env.GCLOUD_PROJECT,
});

describe('firestoreAction', () => {
  after(async () => {
    // Cleanup all apps (keeps active listeners from preventing JS from exiting)
    await Promise.all(firebase.apps().map((app) => app.delete()));
  });

  describe('set action', () => {
    it('sets data to Firestore database', async function () {
      this.timeout(3000);
      const collection = 'first';
      await firestoreWrite('set', `${collection}/item`, '', {
        data: { some: 'data' },
      });
      const docRes = await adminApp.firestore().doc(`${collection}/item`).get();
      expect(docRes.exists).to.equal(true);
    });
  });

  describe('get action', () => {
    it('gets data from a Firestore document', async () => {
      const testData = { some: 'data2' };
      const collection = 'another';
      // Write data to firestore
      await adminApp.firestore().doc(`${collection}/item`).set(testData);
      const res = await firestoreGet(`${collection}/item`);
      expect(res.some).to.equal(testData.some);
    });

    it('gets Firestore collection', async () => {
      const testData = { some: 'data2' };
      // Write data to firestore
      await adminApp.firestore().doc('test/item').set(testData);
      const res = await firestoreGet('test');
      expect(res[0]).to.have.property('some', testData.some);
    });
  });
});
