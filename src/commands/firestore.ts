import * as admin from 'firebase-admin'
import { isObject, isDate } from "lodash";
import { existsSync, readFileSync } from "fs";
import { join, extname } from "path";
import {
  parseFixturePath,
  slashPathToFirestoreRef,
  initializeFirebase,
  envVarBasedOnCIEnv,
  isString,
  deleteFirestoreCollection
} from "../utils";
import {
  DEFAULT_TEST_FOLDER_PATH,
  FALLBACK_TEST_FOLDER_PATH
} from "../constants";

/**
 * Load fixture and parse into JSON
 * @param fixturePath - Fixture's path from root
 * @returns Fixture data
 */
function readJsonFixture(fixturePath: string): any {
  const fixtureStringBuffer = readFileSync(fixturePath);
  try {
    return JSON.parse(fixtureStringBuffer.toString());
  } catch (err) {
    console.error(`Error reading JSON fixture at path: ${fixturePath}`); // eslint-disable-line no-console
    throw err;
  }
}

/**
 * Read fixture file provided relative path
 * @param fixturePath - Relative path of fixture file
 * @returns Fixture data
 */
function readFixture(fixturePath: string): any {
  let fixturesPath = join(DEFAULT_TEST_FOLDER_PATH, "fixtures");
  // Confirm fixture exists
  let pathToFixtureFile = join(fixturesPath, fixturePath);

  if (!existsSync(pathToFixtureFile)) {
    fixturesPath = join(FALLBACK_TEST_FOLDER_PATH, "fixtures");
    // Confirm fixture exists
    const newPathToFixture = join(fixturesPath, fixturePath);
    if (!existsSync(newPathToFixture)) {
      throw new Error(
        `Fixture not found at path: ${pathToFixtureFile} or ${newPathToFixture}`
      );
    }
    pathToFixtureFile = newPathToFixture;
  }
  const fixtureFileExtension = extname(fixturePath);
  switch (fixtureFileExtension) {
    case ".json":
      return readJsonFixture(pathToFixtureFile);
    default:
      return readFileSync(pathToFixtureFile);
  }
}

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
 * @param action - Firestore action to run
 * @param actionPath - Path at which Firestore action should be run
 * @param thirdArg - Either path to fixture or string containing object
 * of options (parsed by cy.callFirestore custom Cypress command)
 * @param options - Whether or not to include meta data
 * @param options.withMeta - Whether or not to include meta data
 * @returns Action within Firestore
 */
export async function firestoreWrite(
  action: FirestoreAction = "set",
  actionPath: string,
  thirdArg?: any,
  options?: any
): Promise<any> {
  const fbInstance = initializeFirebase();

  let fixtureData: any;
  let optionsToPass: any;
  const parsedVal = parseFixturePath(thirdArg);

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(
    fbInstance.firestore(),
    actionPath,
    options
  );

  // TODO: refactor to make the init for options and its structure more explicit
  // TODO: the fact that thirdArg can be of string type with value undefined suggests type coercion in the caller
  // Check to see if parsedVal is fixture path
  if (thirdArg && thirdArg !== "undefined" && isString(parsedVal)) {
    fixtureData = readFixture(parsedVal);
    // Add meta if withMeta option exists
    if (options && options.withMeta) {
      const actionPrefix = action === "update" ? "updated" : "created";
      fixtureData[`${actionPrefix}By`] = envVarBasedOnCIEnv("TEST_UID");
      fixtureData[
        `${actionPrefix}At`
      ] = (fbInstance.firestore as typeof admin.firestore).FieldValue.serverTimestamp();
    }
    optionsToPass = fixtureData;
  } else {
    // Otherwise handle third argument as an options object
    optionsToPass = parsedVal;
    // TODO: Support parsing other values to timestamps
    // Attempt to convert createdAt to a timestamp
    if (isObject(parsedVal) && optionsToPass.createdAt) {
      try {
        const dateVal = new Date(optionsToPass.createdAt);
        if (isDate(dateVal)) {
          optionsToPass.createdAt = dateVal;
        }
      } catch (err) {
        console.log('Error parsing date value for createdAt') // eslint-disable-line
      }
    }
  }

  // Confirm ref has action as a method
  if (!(ref as any)[action]) {
    // Otherwise throw error for ref not containg action
    const missingActionErr = `Ref at provided path "${actionPath}" does not have action "${action}"`;
    throw new Error(missingActionErr);
  }

  try {
    // Call action with fixture data
    return (ref as any)[action](optionsToPass)
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
