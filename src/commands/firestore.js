import {
  dataArrayFromSnap,
  parseFixturePath,
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
export default function firestoreAction(originalArgv, action = 'set', actionPath, thirdArg) {
  const fbInstance = initializeFirebase();

  let options = {};
  const parsedVal = parseFixturePath(thirdArg);

  // Otherwise handle third argument as an options object
  options = parsedVal;

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(
    fbInstance.firestore(),
    actionPath,
    options
  );

  // Confirm ref has action as a method
  if (typeof ref[action] !== 'function') {
    const missingActionErr = `Ref at provided path "${actionPath}" does not have action "${action}"`;
    throw new Error(missingActionErr);
  }

  try {
    // Call action with fixture data
    return ref[action](parsedVal)
      .then((res) => {
        const dataArray = dataArrayFromSnap(res);

        // Write results to stdout to be loaded in tests
        if (action === 'get') {
          process.stdout.write(JSON.stringify(dataArray));
        }

        return dataArray;
      })
      .catch((err) => {
        console.log(`Error with ${action} at path "${actionPath}": `, err); // eslint-disable-line no-console
        return Promise.reject(err);
      });
  }
  catch (err) {
    console.log(`${action} at path "${actionPath}" threw an error: `, err); // eslint-disable-line no-console
    throw err;
  }
}
