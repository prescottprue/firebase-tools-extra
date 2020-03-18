import * as admin from 'firebase-admin';
import {
  slashPathToFirestoreRef,
  initializeFirebase,
  deleteFirestoreCollection,
  readJsonFile,
  writeFilePromise,
  tryToJsonParse,
} from '../utils';
import { error } from '../logger';

export type FirestoreAction = 'get' | 'set' | 'add' | 'update' | 'delete';

/**
 * Methods that are applicabale on a ref for a get action
 */
export interface FirestoreQueryMethods {
  orderBy?: string;
  startAt?: any;
  startAfter?: any;
  where?: [
    string | FirebaseFirestore.FieldPath,
    FirebaseFirestore.WhereFilterOp,
    any,
  ];
  limit?: number;
}

/**
 * Options for Firestore get action
 */
export interface FirestoreGetOptions extends FirestoreQueryMethods {
  // shallow?: boolean
  pretty?: boolean;
  output?: boolean;
  emulator?: boolean;
}

/**
 * Get data from Firestore at given path (works for documents & collections)
 * @param actionPath - Path where to run firestore get
 * @param options - Options object
 * @returns Data value that results from running get within Firestore
 */
export async function firestoreGet(
  actionPath: string,
  options?: any,
): Promise<any> {
  const fbInstance = initializeFirebase({ emulator: options?.emulator });

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(
    fbInstance.firestore(),
    actionPath,
    options,
  );

  try {
    // Call action with fixture data
    const res: any = await ref.get();

    // Parse results for get action
    // Include id in doc if collection query
    const dataToWrite =
      typeof res.data === 'function'
        ? res.data()
        : res.docs &&
          res.docs.map((docSnap: admin.firestore.DocumentSnapshot) => {
            return {
              ...docSnap.data(),
              id: docSnap.id,
            };
          });

    // Write results to stdout
    if (dataToWrite) {
      if (options?.output) {
        // Write results to file at path provided in options.output
        await writeFilePromise(
          `${process.cwd()}/${options.output}`,
          JSON.stringify(dataToWrite, null, 2),
        );
      } else {
        // Write results to stdout (console.log was used instead of process.stdout.write so that newline is appended)
        /* eslint-disable no-console */
        console.log(
          options?.pretty
            ? JSON.stringify(dataToWrite, null, 2)
            : JSON.stringify(dataToWrite),
        );
        /* eslint-enable no-console */
      }
    }

    return dataToWrite;
  } catch (err) {
    error(`Error with firestore:get at path "${actionPath}": `, err.message);
    throw err;
  }
}

/**
 * Run write action for Firestore
 * @param action - Firestore action to run
 * @param actionPath - Path at which Firestore action should be run
 * @param filePath - Path to file to write
 * @param options - Options object
 * @returns Results of running action within Firestore
 */
export async function firestoreWrite(
  action: FirestoreAction = 'set',
  actionPath: string,
  filePath?: string,
  options?: any,
): Promise<any> {
  const fbInstance = initializeFirebase({ emulator: options?.emulator });

  if (!filePath && !options?.data) {
    const errMsg = `File path or data is required to run ${action} at path "${actionPath}"`;
    error(errMsg);
    throw new Error(errMsg);
  }
  const dataToWrite = options?.data
    ? tryToJsonParse(options.data)
    : readJsonFile(filePath as string);

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(
    fbInstance.firestore(),
    actionPath,
    options,
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
    const res = await (ref as any)[action](dataToWrite);
    return res;
  } catch (err) {
    error(`Error with ${action} at path "${actionPath}": `, err.message);
    throw err;
  }
}

interface FirestoreDeleteOptions {
  batchSize?: number;
  emulator?: boolean;
}

/**
 * Delete data from Firestore
 * @param actionPath - Path at which Firestore action should be run
 * @param options - Options object
 * @returns Action within Firestore
 */
export async function firestoreDelete(
  actionPath: string,
  options?: FirestoreDeleteOptions,
): Promise<any> {
  const fbInstance = initializeFirebase({ emulator: options?.emulator });

  // Delete Firestore Collection or SubCollection
  if (actionPath.split('/').length % 2) {
    return deleteFirestoreCollection(
      fbInstance.firestore(),
      actionPath,
      options?.batchSize || 200,
    );
  }
  try {
    // Call action with fixture data
    const res = await fbInstance
      .firestore()
      .doc(actionPath)
      .delete();
    return res;
  } catch (err) {
    error(`firestore:delete at path "${actionPath}": `, err.message);
    throw err;
  }
}
