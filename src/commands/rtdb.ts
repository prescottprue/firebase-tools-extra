import * as admin from 'firebase-admin'
import { isObject, isDate } from "lodash";
import { parseFixturePath, initializeFirebase } from "../utils";

export type RTDBWriteAction = 'set' | 'push' | 'update'

export interface RTDBGetOptions {
  shallow?: boolean
  orderBy?: string
  orderByKey?: string
  orderByValue?: string
  equalTo?: any
  startAt?: any
  endAt?: any
  limitToFirst?: number
  limitToLast?: number
}

/**
 * Write data to path of Real Time Database
 * @param actionPath - Pat of get
 * @param options - Get options object
 */
export async function rtdbGet(actionPath: string, options?: RTDBGetOptions): Promise<any> {
  const fbInstance = initializeFirebase();

  try {
    let ref: admin.database.Reference | admin.database.Query = fbInstance.database().ref(actionPath)
    if (options) {
      if(options.orderBy) {
        ref = ref.orderByChild(options.orderBy)
      }
      if(options.equalTo) {
        ref = ref.equalTo(options.equalTo)
      }
      if (options.limitToLast) {
        ref = ref.limitToLast(options.limitToLast)
      }
    }
    const res = await (ref as any).once('value')
    
    // Write results to stdout to be loaded in tests
    let dataToWrite = res.val()
    if (options) {
      if (options.shallow) {
        dataToWrite = Object.keys(dataToWrite)
      }
    }
    process.stdout.write(dataToWrite && JSON.stringify(dataToWrite));
  } catch (err) {
    console.error(`Error with database:get at path "${actionPath}": `, err.message); // eslint-disable-line no-console
    throw err;
  }
}

/**
 * Write data to path of Real Time Database
 * @param action - Write action to run
 * @param actionPath - Path of action
 * @param thirdArg - Options
 */
export async function rtdbWrite(action: RTDBWriteAction = "set", actionPath: string, thirdArg?: any): Promise<any> {
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

  try {
    const ref: admin.database.Reference | admin.database.Query = fbInstance.database().ref(actionPath)
    return (ref as any)[action](options)
  } catch (err) {
    console.error(`Error with database:${action} at path "${actionPath}": `, err.message); // eslint-disable-line no-console
    throw err;
  }
}

/**
 * Remove data from path of Real Time Database
 * @param actionPath - Path to remove from database
 */
export async function rtdbRemove(actionPath: string): Promise<void> {
  const fbInstance = initializeFirebase();

  try {
    return fbInstance.database().ref(actionPath).remove()
  } catch (err) {
    console.error(`Error with database:remove at path "${actionPath}": `, err.message); // eslint-disable-line no-console
    throw err;
  }
}
