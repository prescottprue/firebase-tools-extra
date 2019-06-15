import { isObject, isDate, isString } from "lodash";
import fs from "fs";
import path from "path";
import {
  dataArrayFromSnap,
  parseFixturePath,
  slashPathToFirestoreRef,
  initializeFirebase,
  envVarBasedOnCIEnv
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
 * @param {String} fixturePath - Fixture's path from root
 */
function readJsonFixture(fixturePath) {
  const fixtureString = fs.readFileSync(fixturePath);
  try {
    return JSON.parse(fixtureString);
  }
 catch (err) {
    console.error(`Error reading JSON fixture at path: ${fixturePath}`); // eslint-disable-line no-console
    throw err;
  }
}

/**
 * Read fixture file provided relative path
 * @param {String} fixturePath - Relative path of fixture file
 */
function readFixture(fixturePath) {
  let fixturesPath = path.join(DEFAULT_TEST_FOLDER_PATH, "fixtures");
  // Confirm fixture exists
  let pathToFixtureFile = path.join(fixturesPath, fixturePath);

  if (!fs.existsSync(pathToFixtureFile)) {
    fixturesPath = path.join(FALLBACK_TEST_FOLDER_PATH, "fixtures");
    // Confirm fixture exists
    const newPathToFixture = path.join(fixturesPath, fixturePath);
    if (!fs.existsSync(pathToFixtureFile)) {
      throw new Error(
        `Fixture not found at path: ${pathToFixtureFile} or ${newPathToFixture}`
      );
    }
    pathToFixtureFile = newPathToFixture;
  }
  const fixtureFileExtension = path.extname(fixturePath);
  switch (fixtureFileExtension) {
    case ".json":
      return readJsonFixture(fixturePath);
    default:
      return fs.readFileSync(pathToFixtureFile);
  }
}

/**
 * Add default Firebase arguments to arguments array.
 * @param {Array} args - arguments array
 * @param  {Object} [opts={}] - Options object
 * @param {Boolean} [opts.disableYes=false] - Whether or not to disable the
 * yes argument
 */
function addDefaultArgs(args, opts = {}) {
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

function optionsToArgs(opts) {
  const { shallow, recursive } = opts || {};
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
 * Create command arguments string from an array of arguments by joining them
 * with a space including a leading space. If no args provided, empty string
 * is returned
 * @param  {Array} args - Command arguments to convert into a string
 * @return {String} Arguments section of command string
 */
function getArgsString(args) {
  return args && args.length ? ` ${args.join(" ")}` : "";
}

/**
 * Build Command to run Firestore action. Commands call either firebase-extra
 * (in bin/firebaseExtra.js) or firebase-tools directly. FIREBASE_TOKEN must
 * exist in environment if running commands that call firebase-tools.
 * @param  {String} action - action to run on Firstore (i.e. "add", "delete")
 * @param  {String} actionPath - Firestore path where action should be run
 * @param  {String|Object} fixturePath - Path to fixture. If object is passed,
 * it is used as options.
 * @param  {Object} [opts={}] - Options object
 * @param  {Object} opts.args - Extra arguments to be passed with command
 * @return {String} Command string to be used with cy.exec
 */
export function buildFirestoreCommand(action, actionPath, data, opts = {}) {
  const options = isObject(data) ? data : opts;
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

/**
 *
 * @param {String} action - Firestore action to run
 * @param {String} actionPath - Path at which Firestore action should be run
 * @param {String} thirdArg - Either path to fixture or string containing object
 * of options (parsed by cy.callFirestore custom Cypress command)
 * @param {String} withMeta -
 */
export default function firestoreAction(
  originalArgv,
  action = "set",
  actionPath,
  thirdArg,
  withMeta
) {
  const fbInstance = initializeFirebase();

  let fixtureData;
  let options = {};
  const parsedVal = parseFixturePath(thirdArg);

  // Create ref from slash and any provided query options
  const ref = slashPathToFirestoreRef(
    fbInstance.firestore(),
    actionPath,
    options
  );

  // Check to see if parsedVal is fixture path
  if (isString(parsedVal)) {
    fixtureData = readFixture(thirdArg);
    // Add meta if withMeta option exists
    if (withMeta) {
      const actionPrefix = action === "update" ? "updated" : "created";
      fixtureData[`${actionPrefix}By`] = envVarBasedOnCIEnv("TEST_UID");
      /* eslint-disable standard/computed-property-even-spacing */
      fixtureData[
        `${actionPrefix}At`
      ] = fbInstance.firestore.FieldValue.serverTimestamp();
      /* eslint-enable standard/computed-property-even-spacing */
    }
  }
 else {
    // Otherwise handle third argument as an options object
    options = parsedVal;
    // TODO: Support parsing other values to timestamps
    // Attempt to convert createdAt to a timestamp
    if (isObject(parsedVal) && parsedVal.createdAt) {
      try {
        const dateVal = new Date(parsedVal.createdAt);
        if (isDate(dateVal)) {
          parsedVal.createdAt = dateVal;
        }
      } catch (err) {} // eslint-disable-line
    }
  }

  // Confirm ref has action as a method
  if (typeof ref[action] !== "function") {
    const missingActionErr = `Ref at provided path "${actionPath}" does not have action "${action}"`;
    throw new Error(missingActionErr);
  }

  try {
    // Call action with fixture data
    return ref[action](options)
      .then(res => {
        const dataArray = dataArrayFromSnap(res);

        // Write results to stdout to be loaded in tests
        if (action === "get") {
          process.stdout.write(JSON.stringify(dataArray));
        }

        return dataArray;
      })
      .catch(err => {
        console.error(`Error with ${action} at path "${actionPath}": `, err); // eslint-disable-line no-console
        return Promise.reject(err);
      });
  }
 catch (err) {
    console.error(`${action} at path "${actionPath}" threw an error: `, err); // eslint-disable-line no-console
    throw err;
  }
}
