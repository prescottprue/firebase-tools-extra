import {
  dataArrayFromSnap,
  parseFixturePath,
  envVarBasedOnCIEnv,
  slashPathToFirestoreRef,
  initializeFirebase
} from '../utils';

/**
 *
 * @param {String} action - Firestore action to run
 * @param {String} actionPath - Path at which Firestore action should be run
 * @param {String} thirdArg - Either path to fixture or string containing object
 * of options (parsed by cy.callFirestore custom Cypress command)
 * @param {String} withMeta -
 */
export default function firestoreAction(action = 'set', actionPath, thirdArg, withMeta) {
  const fbInstance = initializeFirebase();

  let fixtureData;
  let options = {};
  const parsedVal = parseFixturePath(thirdArg);

  // Otherwise handle third argument as an options object
  options = parsedVal;
  if (withMeta) {
    const actionPrefix = action === 'update' ? 'updated' : 'created';
    fixtureData[`${actionPrefix}By`] = envVarBasedOnCIEnv('TEST_UID');
    /* eslint-disable standard/computed-property-even-spacing */
    fixtureData[
      `${actionPrefix}At`
    ] = fbInstance.firestore.FieldValue.serverTimestamp();
    /* eslint-enable standard/computed-property-even-spacing */
  }

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(fbInstance.firestore(), actionPath, options);

  // Confirm ref has action as a method
  if (typeof ref[action] !== 'function') {
    const missingActionErr = `Ref at provided path "${actionPath}" does not have action "${action}"`;
    throw new Error(missingActionErr);
  }

  try {
    // Call action with fixture data
    return ref[action](fixtureData).then((res) => {
      const dataArray = dataArrayFromSnap(res);

      // Write results to stdout to be loaded in tests
      if (action === 'get') {
        process.stdout.write(JSON.stringify(dataArray));
      }

      return dataArray;
    });
  }
  catch (err) {
    console.log(`Error with ${action} at path "${actionPath}": `, err);
    throw err;
  }
}
