import * as admin from 'firebase-admin'
import { isObject, isDate } from "lodash";
import { existsSync, readFileSync } from "fs";
import { join, extname } from "path";
import {
  parseFixturePath,
  slashPathToFirestoreRef,
  initializeFirebase,
  envVarBasedOnCIEnv,
  getArgsString,
  isString
} from "../utils";
import {
  FIREBASE_TOOLS_BASE_COMMAND,
  FIREBASE_EXTRA_PATH,
  FIREBASE_TOOLS_YES_ARGUMENT,
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

/**
 * Add default Firebase arguments to arguments array.
 * @param args - arguments array
 * @param [opts={}] - Options object
 * @param [opts.disableYes=false] - Whether or not to disable the
 * yes argument
 * @returns List of default args
 */
function addDefaultArgs(args: string[], opts: FirestoreCommandOptions): string[] {
  const { projectId, disableYes = false } = opts;
  const newArgs = [...args];
  // Include project id command so command runs on the current project
  if (projectId && !args.includes("-P") && !args.includes("--project")) {
    newArgs.push("-P");
    newArgs.push(projectId);
  }
  // Add Firebase's automatic approval argument if it is not already in newArgs
  if (!disableYes && !newArgs.includes(FIREBASE_TOOLS_YES_ARGUMENT)) {
    newArgs.push(FIREBASE_TOOLS_YES_ARGUMENT);
  }
  return newArgs;
}

/**
 * Add command line options to args
 * @param opts - Options for args
 * @returns List of command options with args
 */
function optionsToArgs(opts: FirestoreCommandOptions): string[] {
  const { shallow, recursive } = opts;
  const newArgs = [];
  if (recursive) {
    newArgs.push("-r");
  }
  if (shallow) {
    newArgs.push("--shallow");
  }
  return newArgs;
}

/**
 * Options for firestore commands
 */
export interface FirestoreCommandOptions {
  projectId?: string
  disableYes?: boolean
  shallow?: boolean
  /**
   * Whether or not to include meta data
   */
  withMeta?: boolean;
  /**
   * Extra arguments to add to CLI call
   */
  args?: string[];
  /**
   * CI token to pass as argument
   */
  token?: string;
  /**
   * Whether or not to recursivley delete
   */
  recursive?: boolean;
}

/**
 * Build Command to run Firestore action. Commands call either firebase-extra
 * (in bin/firebaseExtra.js) or firebase-tools directly. FIREBASE_TOKEN must
 * exist in environment if running commands that call firebase-tools.
 * @param action - action to run on Firstore (i.e. "add", "delete")
 * @param actionPath - Firestore path where action should be run
 * @param data - Path to fixture. If object is passed, it is used as options.
 * @param [opts={}] - Options object
 * @param opts.args - Extra arguments to be passed with command
 * @returns Command string to be used with cy.exec
 */
export function buildFirestoreCommand(
  action: string,
  actionPath: string,
  data?: any,
  opts?: FirestoreCommandOptions
): string {
  const options: FirestoreCommandOptions = isObject(data) ? data : opts || {};
  const { args = [] } = options;
  const argsWithDefaults = addDefaultArgs(args, {
    ...options,
    disableYes: true
  });
  switch (action) {
    case "delete": {
      const deleteArgsWithDefaults = addDefaultArgs(args, {
        ...options,
        disableYes: true
      });
      // Add -r to args string (recursive) if recursive option is true otherwise specify shallow
      const optionsArgs = optionsToArgs(options);
      const finalDeleteArgs = deleteArgsWithDefaults.concat(optionsArgs);
      const deleteArgsStr = getArgsString(finalDeleteArgs);
      return `${FIREBASE_TOOLS_BASE_COMMAND} firestore:${action} ${actionPath}${deleteArgsStr}`;
    }
    case "set": {
      // Add -m to argsWithDefaults string (meta) if withmeta option is true
      return `${FIREBASE_EXTRA_PATH} firestore ${action} ${actionPath} '${JSON.stringify(
        data
      )}'${options.withMeta ? " -m" : ""}`;
    }
    default: {
      // Add -m to argsWithDefaults string (meta) if withmeta option is true
      if (options.withMeta) {
        argsWithDefaults.push("-m");
      }
      return `${FIREBASE_EXTRA_PATH} firestore ${action} ${actionPath} '${JSON.stringify(
        data
      )}'`;
    }
  }
}

export type FirestoreAction = 'get' | 'set' | 'add' | 'update' | 'delete'

/**
 * Run action for Firestore
 * @param action - Firestore action to run
 * @param actionPath - Path at which Firestore action should be run
 * @param thirdArg - Either path to fixture or string containing object
 * of options (parsed by cy.callFirestore custom Cypress command)
 * @param withMeta - Whether or not to include meta data
 * @returns Action within Firestore
 */
export default async function firestoreAction(
  action: FirestoreAction = "set",
  actionPath: string,
  thirdArg?: any,
  withMeta?: boolean
): Promise<any> {
  const fbInstance = initializeFirebase();

  let fixtureData: any;
  let options: any;
  const parsedVal = parseFixturePath(thirdArg);

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(
    fbInstance.firestore(),
    actionPath,
    options
  );

  // TODO: refactor to make the initialisation for options and its structure more explicit

  // TODO: the fact that thirdArg can be of string type with value undefined suggests type coercion in the caller
  // Check to see if parsedVal is fixture path
  if (thirdArg && thirdArg !== "undefined" && isString(parsedVal)) {
    fixtureData = readFixture(parsedVal);
    // Add meta if withMeta option exists
    if (withMeta) {
      const actionPrefix = action === "update" ? "updated" : "created";
      fixtureData[`${actionPrefix}By`] = envVarBasedOnCIEnv("TEST_UID");
      fixtureData[
        `${actionPrefix}At`
      ] = (fbInstance.firestore as typeof admin.firestore).FieldValue.serverTimestamp();
    }
    options = fixtureData;
  } else {
    // Otherwise handle third argument as an options object
    options = parsedVal;
    // TODO: Support parsing other values to timestamps
    // Attempt to convert createdAt to a timestamp
    if (isObject(parsedVal) && options.createdAt) {
      try {
        const dateVal = new Date(options.createdAt);
        if (isDate(dateVal)) {
          options.createdAt = dateVal;
        }
      } catch (err) {
        console.log('Error parsing date value for createdAt') // eslint-disable-line
      }
    }
  }

  // Confirm ref has action as a method
  if (typeof (ref as any)[action] !== "function") {
    const missingActionErr = `Ref at provided path "${actionPath}" does not have action "${action}"`;
    throw new Error(missingActionErr);
  }

  try {
    // Call action with fixture data
    const res = await (ref as any)[action](options)
    const dataToWrite = typeof res.data === 'function'
      ? res.data()
      : res.docs && res.docs.map((docSnap: admin.firestore.DocumentSnapshot) => {
        return {
          ...docSnap.data(),
          id: docSnap.id
        }
      })

    // Write results to stdout to be loaded in tests
    if (action === "get") {
      process.stdout.write(JSON.stringify(dataToWrite));
    }

    return dataToWrite;
  } catch (err) {
    console.error(`Error with ${action} at path "${actionPath}": `, err.message); // eslint-disable-line no-console
    throw err;
  }
}
