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
     * Get settings from firebaserc file
     * @param filePath - Path for file
     * @returns Firebase settings object
     */
    export function readJsonFile(filePath: string): any;
    /**
     * Parse fixture path string into JSON with error handling
     * @param valueToParse - valueToParse string to be parsed into JSON
     * @returns Parsed fixture value or path
     */
    export function tryToJsonParse(valueToParse: any): any;
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
     * @returns Service account object
     */
    export function getServiceAccount(): ServiceAccount | null;
    interface InitOptions {
        emulator?: boolean;
        debug?: boolean;
    }
    /**
     * Initialize Firebase instance from service account (from either local
     * serviceAccount.json or environment variables)
     *
     * @returns Initialized Firebase instance
     * @param options - Options object
     */
    export function initializeFirebase(options?: InitOptions): admin.app.App;
    /**
     * Convert slash path to Firestore reference
     * @param firestoreInstance - Instance on which to
     * create ref
     * @param slashPath - Path to convert into firestore reference
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
    /**
     * Run promises in a waterfall instead of all the same time (Promise.all)
     * @param {Array} callbacks - List of promises to run in order
     * @returns {Promise} Resolves when all promises have completed in order
     */
    export function promiseWaterfall(callbacks: any[]): Promise<any[]>;
    /**
     * Converts a JSON object into data to be written to Firestore
     * @param {object} data An exported object property from `firestore-backup-restore`
     * @returns {object} JSON object representing Firestore data
     */
    export function typedJSONToObject(data: any): any;
    /**
     * Converts an array 'property' exported via `firestore-backup-restore` to a JS
     * object.
     * @param {Array} data An exported array property from `firestore-backup-restore`
     * @returns {object} JSON object representing Firestore data
     */
    export function typedJSONToArray(data: any): any[];
    /**
     * Convert a JS object to a JSON object that includes type information.
     * @param {object} obj - Object to convert to typed JSON
     * @returns {Array} Object with typed values
     */
    export function objectToTypedJSON(obj: any): any;
    /**
     * Convert a JS array to a JSON array that includes type information.
     * @param {Array} arr - Array to add type information to
     * @returns {Array} Array with typed info
     */
    export function arrayToTypedJSON(arr: any): any[];
}
declare module "actions/firestore" {
    export type FirestoreAction = 'get' | 'set' | 'add' | 'update' | 'delete';
    /**
     * Methods that are applicable on a ref for a get action
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
    interface FirestoreImportOptions {
        emulator?: boolean;
        debug?: boolean;
    }
    /**
     * @param importFolderPath - Path from which to import Firestore data
     * @param options - Options for import
     */
    export function firestoreImport(importFolderPath: string, options?: FirestoreImportOptions): Promise<any>;
    interface FirestoreExportOptions {
        collections?: string[];
        ignoreCollections?: string[];
        emulator?: boolean;
        debug?: boolean;
    }
    /**
     * @param exportFolderPath - Path of folder to export Firestore contents to
     * @param options - Options for export
     */
    export function firestoreExport(exportFolderPath: string, options?: FirestoreExportOptions): Promise<any>;
}
declare module "actions/rtdb" {
    export type RTDBWriteAction = 'set' | 'push' | 'update';
    /**
     * Methods that are applicable on an RTDB ref for a get action
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
declare module "commands/firestore-export" {
    import { Command } from 'commander';
    /**
     * @name firestoreExport
     * Export data from Firestore instance (either hosted or emulator). Stores
     * type information for use with firebase:import command.
     * @param {object} program - Commander program
     */
    export default function firestoreExportCommand(program: Command): void;
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
declare module "commands/firestore-import" {
    import { Command } from 'commander';
    /**
     * @name databaseGet
     * fetch and print JSON data at the specified path from database emulator
     * @param {object} program - Commander program
     */
    export default function databaseGetCommand(program: Command): void;
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
