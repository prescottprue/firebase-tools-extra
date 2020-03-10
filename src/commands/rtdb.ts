import * as admin from 'firebase-admin'
import { isObject, isDate } from "lodash";
import { parseFixturePath, initializeFirebase } from "../utils";

export type RTDBAction = 'get' | 'set' | 'push' | 'update' | 'remove'
export type RTDBMethod = 'once' | 'set' | 'push' | 'update' | 'remove'

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
  const validActionNames: RTDBAction[] = ['get', 'set', 'push', 'update', 'remove']
  // Throw for invalid action name
  if (!validActionNames.includes(action)) {
    throw new Error(`"${action}" is not a valid RTDB action. Use one of the following: ${validActionNames.join(', ')}`)
  }

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
    get: 'once'
  }

  const cleanActionName: RTDBMethod = (actionNameMap as any)[action] || action

  try {
    // Call action with fixture data
    const ref: admin.database.Reference = fbInstance.database().ref(actionPath)
    const res = await ref[cleanActionName](action === 'get' ? 'value' : options)
    
    // Write results to stdout
    if (res && typeof (res as admin.database.DataSnapshot).val === 'function' && action === "get") {
      const dataToWrite = (res as admin.database.DataSnapshot).val()
      process.stdout.write(JSON.stringify(dataToWrite));
    }
  } catch (err) {
    console.error(`Error with RTDB ${action} at path "${actionPath}": `, err.message); // eslint-disable-line no-console
    throw err;
  }
}
