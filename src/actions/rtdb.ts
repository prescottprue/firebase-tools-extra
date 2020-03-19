import * as admin from 'firebase-admin';
import {
  initializeFirebase,
  readJsonFile,
  tryToJsonParse,
  writeFilePromise,
} from '../utils';
import { error } from '../logger';

export type RTDBWriteAction = 'set' | 'push' | 'update';

/**
 * Methods that are applicable on an RTDB ref for a get action
 */
export interface RTDBQueryMethods {
  /* select a child key by which to order results */
  orderBy?: string;
  /* order by key name */
  orderByKey?: string;
  /* order by primitive value */
  orderByValue?: string;
  /* restrict results to <val> (based on specified ordering) */
  equalTo?: any;
  /* start results at <val> (based on specified ordering) */
  startAt?: any;
  /* end results at <val> (based on specified ordering) */
  endAt?: any;
  /* limit to the first <num> results */
  limitToFirst?: number;
  /* limit to the last <num> results */
  limitToLast?: number;
}

/**
 * Options for RTDB get action
 */
export interface RTDBGetOptions extends RTDBQueryMethods {
  shallow?: boolean;
  /* pretty print response */
  pretty?: boolean;
  /* save output to the specified file */
  output?: boolean;
  /* use emulator */
  emulator?: boolean;
  /* print verbose debug output to console */
  debug?: boolean;
}

/**
 * Add query options to RTDB reference
 * @param baseRef - Base RTDB reference
 * @param options - Options for ref
 * @returns RTDB Reference
 */
function optionsToRtdbRef(
  baseRef: admin.database.Reference,
  options?: RTDBQueryMethods,
): admin.database.Reference | admin.database.Query {
  const optionsToAdd = [
    'orderByChild',
    'orderByKey',
    'orderByValue',
    'equalTo',
    'limitToFirst',
    'limitToLast',
    'startAt',
    'endAt',
  ];
  return optionsToAdd.reduce(
    (
      acc: admin.database.Reference | admin.database.Query,
      optionName: string,
    ) => {
      if (options && (options as any)[optionName]) {
        return (acc as any)[optionName]((options as any)[optionName]);
      }
      return acc;
    },
    baseRef,
  );
}

/**
 * Write data to path of Real Time Database
 * @param actionPath - Pat of get
 * @param options - Get options object
 */
export async function rtdbGet(
  actionPath: string,
  options?: RTDBGetOptions,
): Promise<any> {
  const { emulator, debug } = options || {};
  const fbInstance = initializeFirebase({ emulator, debug });

  try {
    const baseRef: admin.database.Reference = fbInstance
      .database()
      .ref(actionPath);
    const ref = optionsToRtdbRef(baseRef, options);
    const res = await ref.once('value');

    // Write results to stdout to be loaded in tests
    // TODO: Support acutal shallow queries (may require Legacy token to use REST API)
    const dataToWrite = options?.shallow ? Object.keys(res.val()) : res.val();
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
  } catch (err) {
    error(`Error with database:get at path "${actionPath}": `, err.message);
    throw err;
  }
}

/**
 * Write data to path of Real Time Database. Also works with server timestamps
 * passed as {.sv: "timestamp"}.
 * @param action - Write action to run
 * @param actionPath - Path of action
 * @param filePath - Path of file to write to RTDB
 * @param options - Options
 */
export async function rtdbWrite(
  action: RTDBWriteAction = 'set',
  actionPath: string,
  filePath?: string,
  options?: any,
): Promise<any> {
  const { emulator, debug } = options || {};
  const fbInstance = initializeFirebase({ emulator, debug });

  if (!filePath && !options?.data) {
    const errMsg = `File path or data is required to run ${action} at path "${actionPath}"`;
    error(errMsg);
    throw new Error(errMsg);
  }

  const dataToWrite = options?.data
    ? tryToJsonParse(options.data)
    : readJsonFile(filePath as string);

  try {
    const ref:
      | admin.database.Reference
      | admin.database.Query = fbInstance.database().ref(actionPath);
    return (ref as any)[action](dataToWrite);
  } catch (err) {
    error(
      `Error with database:${action} at path "${actionPath}": `,
      err.message,
    );
    throw err;
  }
}

/**
 * Remove data from path of Real Time Database
 * @param actionPath - Path to remove from database
 * @param options - Options
 */
export async function rtdbRemove(
  actionPath: string,
  options?: any,
): Promise<void> {
  const { emulator, debug } = options || {};
  const fbInstance = initializeFirebase({ emulator, debug });

  try {
    return fbInstance
      .database()
      .ref(actionPath)
      .remove();
  } catch (err) {
    error(`Error with database:remove at path "${actionPath}": `, err.message);
    throw err;
  }
}
