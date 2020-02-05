import * as admin from 'firebase-admin'
import { isObject, isDate } from "lodash";
import { parseFixturePath, initializeFirebase } from "../utils";

export type RTDBAction = 'get' | 'set' | 'push' | 'update' | 'delete'

/**
 * Run action for Firestore
 * @param action - Firestore action to run
 * @param actionPath - Path at which Firestore action should be run
 * @param thirdArg - Either path to fixture or string containing object
 * of options (parsed by cy.callFirestore custom Cypress command)
 * @returns Action within Firestore
 */
export default async function rtdbAction(
  action: RTDBAction = "set",
  actionPath: string,
  thirdArg?: any
): Promise<any> {
  const fbInstance = initializeFirebase();

  const parsedVal = parseFixturePath(thirdArg);
  const options = parsedVal;

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

  const actionNameMap = {
    delete: 'remove',
    get: 'once'
  }

  const cleanActionName = (actionNameMap as any)[action] || action

  try {
    // Call action with fixture data
    const ref: admin.database.Reference = fbInstance.database().ref(actionPath)
    const res = await (ref as any)[cleanActionName](action === 'get' ? 'value' : options)
    
    // Write results to stdout to be loaded in tests
    if (action === "get") {
      const dataToWrite = res.val()
      process.stdout.write(JSON.stringify(dataToWrite));
    }
  } catch (err) {
    console.error(`Error with ${action} at path "${actionPath}": `, err.message); // eslint-disable-line no-console
    throw err;
  }
}
