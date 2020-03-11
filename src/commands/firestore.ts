import * as admin from 'firebase-admin'
import {
  slashPathToFirestoreRef,
  initializeFirebase,
  deleteFirestoreCollection,
  readJsonFile
} from "../utils";

export type FirestoreAction = 'get' | 'set' | 'add' | 'update' | 'delete'

/**
 * @param actionPath - Path where to run firestore get
 * @param options - Options object
 */
export async function firestoreGet(actionPath: string, options?: any): Promise<any> {
  const fbInstance = initializeFirebase();

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(
    fbInstance.firestore(),
    actionPath,
    options
  );

  try {
    // Call action with fixture data
    const res: any = await ref.get()

    // Parse results for get action
    // Include id in doc if collection query
    const dataToWrite = typeof res.data === 'function'
    ? res.data()
    : res.docs && res.docs.map((docSnap: admin.firestore.DocumentSnapshot) => {
      return {
        ...docSnap.data(),
        id: docSnap.id
      }
    })
    // Write results to stdout
    if (dataToWrite) {
      process.stdout.write(JSON.stringify(dataToWrite));
    }
    return dataToWrite;
  } catch (err) {
    console.error(`Error with firestore:get at path "${actionPath}": `, err.message); // eslint-disable-line no-console
    throw err;
  }
}

/**
 * Run write action for Firestore
 *
 * @param action - Firestore action to run
 * @param actionPath - Path at which Firestore action should be run
 * @param thirdArg - Either path to fixture or string containing object
 * of options (parsed by cy.callFirestore custom Cypress command)
 * @param options - Whether or not to include meta data
 * @param filePath
 * @param options.withMeta - Whether or not to include meta data
 * @returns Action within Firestore
 */
export async function firestoreWrite(
  action: FirestoreAction = "set",
  actionPath: string,
  filePath?: string,
  options?: any
): Promise<any> {
  const fbInstance = initializeFirebase();

  if (!filePath) {
    const errMsg = `File path or data is required to run ${action} at path "${actionPath}"`
    console.error(errMsg) // eslint-disable-line no-console
    throw new Error(errMsg)
  }
  const dataToWrite = options?.data ? options.data : readJsonFile(filePath)

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(
    fbInstance.firestore(),
    actionPath,
    options
  );
  // TODO: Support passing timestamps

  // Confirm ref has action as a method
  if (!(ref as any)[action]) {
    // Otherwise throw error for ref not containg action
    const missingActionErr = `Ref at provided path "${actionPath}" does not have action "${action}"`;
    throw new Error(missingActionErr);
  }

  try {
    // Call action with fixture data
    return (ref as any)[action](dataToWrite)
  } catch (err) {
    console.error(`Error with ${action} at path "${actionPath}": `, err.message); // eslint-disable-line no-console
    throw err;
  }
}

/**
 * Delete data from Firestore
 * @param actionPath - Path at which Firestore action should be run
 * @param options - Options object
 * @returns Action within Firestore
 */
export async function firestoreDelete(
  actionPath: string,
  options?: any
): Promise<any> {
  const fbInstance = initializeFirebase();

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(
    fbInstance.firestore(),
    actionPath,
    options
  );

  // Confirm ref has action as a method
  if (!(ref as any).delete) {
    // Delete Firestore Collection or SubCollection
    if (actionPath.split('/').length % 2) {
      return deleteFirestoreCollection(fbInstance.firestore(), actionPath, 200)
    }

    // Otherwise throw error for ref not containg action
    const missingActionErr = `Ref at provided path "${actionPath}" does not have action "delete"`;
    throw new Error(missingActionErr);
  }

  try {
    // Call action with fixture data
    return (ref as any).delete()
  } catch (err) {
    console.error(`Error with firestore:delete at path "${actionPath}": `, err.message); // eslint-disable-line no-console
    throw err;
  }
}
