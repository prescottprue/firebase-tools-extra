/// <reference types="node" />
declare module "logger" {
    export const log: {
        (message?: any, ...optionalParams: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    /**
     * Log info within console
     * @param message - Message containing info to log
     * @param other - Other values to pass to info
     * @returns undefined
     */
    export function info(message: string, other?: any): void;
    /**
     * Log a success within console (colorized with green)
     * @param message - Success message to log
     * @param other - Other values to pass to info
     * @returns undefined
     */
    export function success(message: string, other?: any): void;
    /**
     * Log a warning within the console (colorized with yellow)
     * @param message - Warning message to log
     * @param other - Other values to pass to info
     * @returns undefined
     */
    export function warn(message: string, other?: any): void;
    /**
     * Log an error within console (colorized with red)
     * @param message - Error message to log
     * @param other - Other values to pass to info
     * @returns undefined
     */
    export function error(message: string, other?: any): void;
}
declare module "utils" {
    import * as admin from 'firebase-admin';
    import { writeFile } from 'fs';
    export const writeFilePromise: typeof writeFile.__promisify__;
    /**
     * Check whether a value is a string or not
     * @param valToCheck - Value to check
     * @returns Whether or not value is a string
     */
    export function isString(valToCheck: any): boolean;
    /**
     * Get settings from firebaserc file
     * @param filePath - Path for file
     * @returns Firebase settings object
     */
    export function readJsonFile(filePath: string): any;
    /**
     * Parse fixture path string into JSON with error handling
     * @param unparsed - Unparsed string to be parsed into JSON
     * @returns Parsed fixture value or path
     */
    export function tryToJsonParse(unparsed: any): any;
    /**
     * Get environment variable based on the current CI environment
     * @param varNameRoot - variable name without the environment prefix
     * @param envName - Environment option
     * @returns Value of the environment variable
     * @example
     * envVarBasedOnCIEnv('FIREBASE_PROJECT_ID')
     * // => 'fireadmin-stage' (value of 'STAGE_FIREBASE_PROJECT_ID' environment var)
     */
    export function envVarBasedOnCIEnv(varNameRoot: string, envName?: string): any;
    interface ServiceAccount {
        type: string;
        project_id: string;
        private_key_id: string;
        private_key: string;
        client_email: string;
        client_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_x509_cert_url: string;
    }
    /**
     * Get service account from either local file or environment variables
     * @param envSlug - Slug for current environment
     * @returns Service account object
     */
    export function getServiceAccount(envSlug?: string): ServiceAccount;
    /**
     * Get service account from either local file or environment variables
     * @param envSlug - Environment option
     * @returns Service account object
     */
    export function getServiceAccountWithoutWarning(envSlug?: string): ServiceAccount | null;
    interface InitOptions {
        emulator?: boolean;
        debug?: boolean;
    }
    /**
     * Initialize Firebase instance from service account (from either local
     * serviceAccount.json or environment variables)
     *
     * @returns Initialized Firebase instance
     * @param options
     */
    export function initializeFirebase(options?: InitOptions): admin.app.App;
    /**
     * Check with or not a slash path is the path of a document
     * @param slashPath - Path to check for whether or not it is a doc
     * @returns Whether or not slash path is a document path
     */
    export function isDocPath(slashPath: string): boolean;
    /**
     * Convert slash path to Firestore reference
     * @param firestoreInstance - Instance on which to
     * create ref
     * @param slashPath - Path to convert into firestore refernce
     * @param options - Options object
     * @returns Ref at slash path
     */
    export function slashPathToFirestoreRef(firestoreInstance: any, slashPath: string, options?: any): admin.firestore.CollectionReference | admin.firestore.DocumentReference | admin.firestore.Query;
    /**
     * @param firestoreInstance - Instance of firestore from which to delete collection
     * @param collectionPath - Path of collection to delete
     * @param batchSize - Size of batch
     * @returns Promise which resolves when collection has been deleted
     */
    export function deleteFirestoreCollection(firestoreInstance: any, collectionPath: string, batchSize?: number): Promise<any>;
}
declare module "actions/firestore" {
    export type FirestoreAction = 'get' | 'set' | 'add' | 'update' | 'delete';
    /**
     * Methods that are applicabale on a ref for a get action
     */
    export interface FirestoreQueryMethods {
        orderBy?: string;
        startAt?: any;
        startAfter?: any;
        where?: [string | FirebaseFirestore.FieldPath, FirebaseFirestore.WhereFilterOp, any];
        limit?: number;
    }
    /**
     * Options for Firestore get action
     */
    export interface FirestoreGetOptions extends FirestoreQueryMethods {
        pretty?: boolean;
        output?: boolean;
        emulator?: boolean;
        debug?: boolean;
    }
    /**
     * Get data from Firestore at given path (works for documents & collections)
     * @param actionPath - Path where to run firestore get
     * @param options - Options object
     * @returns Data value that results from running get within Firestore
     */
    export function firestoreGet(actionPath: string, options?: any): Promise<any>;
    /**
     * Run write action for Firestore
     * @param action - Firestore action to run
     * @param actionPath - Path at which Firestore action should be run
     * @param filePath - Path to file to write
     * @param options - Options object
     * @returns Results of running action within Firestore
     */
    export function firestoreWrite(action: "add" | "update" | "get" | "set" | "delete" | undefined, actionPath: string, filePath?: string, options?: any): Promise<any>;
    interface FirestoreDeleteOptions {
        batchSize?: number;
        emulator?: boolean;
        debug?: boolean;
    }
    /**
     * Delete data from Firestore
     * @param actionPath - Path at which Firestore action should be run
     * @param options - Options object
     * @returns Action within Firestore
     */
    export function firestoreDelete(actionPath: string, options?: FirestoreDeleteOptions): Promise<any>;
}
declare module "actions/rtdb" {
    export type RTDBWriteAction = 'set' | 'push' | 'update';
    /**
     * Methods that are applicable on a ref for a get action
     */
    export interface RTDBQueryMethods {
        orderBy?: string;
        orderByKey?: string;
        orderByValue?: string;
        equalTo?: any;
        startAt?: any;
        endAt?: any;
        limitToFirst?: number;
        limitToLast?: number;
    }
    /**
     * Options for RTDB get action
     */
    export interface RTDBGetOptions extends RTDBQueryMethods {
        shallow?: boolean;
        pretty?: boolean;
        output?: boolean;
        emulator?: boolean;
        debug?: boolean;
    }
    /**
     * Write data to path of Real Time Database
     * @param actionPath - Pat of get
     * @param options - Get options object
     */
    export function rtdbGet(actionPath: string, options?: RTDBGetOptions): Promise<any>;
    /**
     * Write data to path of Real Time Database. Also works with server timestamps
     * passed as {.sv: "timestamp"}.
     * @param action - Write action to run
     * @param actionPath - Path of action
     * @param filePath - Path of file to write to RTDB
     * @param options - Options
     */
    export function rtdbWrite(action: "push" | "update" | "set" | undefined, actionPath: string, filePath?: string, options?: any): Promise<any>;
    /**
     * Remove data from path of Real Time Database
     * @param actionPath - Path to remove from database
     * @param options - Options
     */
    export function rtdbRemove(actionPath: string, options?: any): Promise<void>;
}
declare module "index" {
    export * from "actions/firestore";
    export * from "actions/rtdb";
}
declare module "commands/database-get" {
    import { Command } from 'commander';
    /**
     * @name databaseGet
     * fetch and print JSON data at the specified path from database emulator
     * @param {object} program - Commander program
     */
    export default function databaseGetCommand(program: Command): void;
}
declare module "commands/database-push" {
    import { Command } from 'commander';
    /**
     * @name databasePush
     * Add a new JSON object to a list of data in your Firebase
     * @param program - Commander program
     */
    export default function databasePushCommand(program: Command): void;
}
declare module "commands/database-remove" {
    import { Command } from 'commander';
    /**
     * @name databasePush
     * Add a new JSON object to a list of data in your Firebase
     * @param program - Commander program
     */
    export default function databasePushCommand(program: Command): void;
}
declare module "commands/database-set" {
    import { Command } from 'commander';
    /**
     * @name databaseSet
     * store JSON data at the specified path
     * @param program - Commander program
     */
    export default function databaseSetCommand(program: Command): void;
}
declare module "commands/database-update" {
    import { Command } from 'commander';
    /**
     * @name databaseUpdate
     * fetch and print JSON data at the specified path from database emulator
     * @param program - Commander program
     */
    export default function databaseUpdateCommand(program: Command): void;
}
declare module "commands/firestore-add" {
    import { Command } from 'commander';
    /**
     * @name firestoreAdd
     * Add data to specified collection or sub-collection of Firestore. Work for both hosted and emulated environments
     * @param {object} program - Commander program
     */
    export default function firestoreAddCommand(program: Command): void;
}
declare module "commands/firestore-delete" {
    import { Command } from 'commander';
    /**
     * @name firestoreDelete
     * Delete data from Cloud Firestore. Works for both hosted and emulated environments
     * @param {object} program - Commander program
     */
    export default function firestoreDeleteCommand(program: Command): void;
}
declare module "commands/firestore-get" {
    import { Command } from 'commander';
    /**
     * @name firestoreGet
     * fetch and print JSON data at the specified path of Firestore. Works for both hosted and emulated environments
     * @param {object} program - Commander program
     */
    export default function firestoreGetCommand(program: Command): void;
}
declare module "commands/firestore-set" {
    import { Command } from 'commander';
    /**
     * @name firestoreSet
     * set data to specified path of Firestore. Work for both hosted and emulated environments
     * @param {object} program - Commander program
     */
    export default function firestoreSetCommand(program: Command): void;
}
declare module "commands/firestore-update" {
    import { Command } from 'commander';
    /**
     * @name firestoreUpdate
     * update data at specified path of Firestore. Work for both hosted and emulated environments
     * @param {object} program - Commander program
     */
    export default function firestoreUpdateCommand(program: Command): void;
}
