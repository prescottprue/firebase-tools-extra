declare module "constants" {
    export const DEFAULT_TEST_FOLDER_PATH = "test/e2e";
    export const FALLBACK_TEST_FOLDER_PATH = "cypress";
    export const FIREBASE_TOOLS_BASE_COMMAND = "$(npm bin)/firebase";
    export const FIREBASE_EXTRA_PATH = "$(npm bin)/firebase-extra";
    export const FIREBASE_TOOLS_YES_ARGUMENT = "-y";
}
declare module "utils" {
    import * as admin from "firebase-admin";
    export const DEFAULT_BASE_PATH: string;
    export function isString(valToCheck: any): boolean;
    export function readJsonFile(filePath: string): any;
    export function parseFixturePath(unparsed: string): any;
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
    export function getServiceAccount(envSlug?: string): ServiceAccount;
    export function initializeFirebase(): admin.app.App;
    export function slashPathToFirestoreRef(firestoreInstance: any, slashPath: string, options?: any): admin.firestore.CollectionReference | admin.firestore.DocumentReference | admin.firestore.Query;
    export function getArgsString(args: string[]): string;
}
declare module "commands/firestore" {
    export interface FirestoreCommandOptions {
        projectId?: string;
        disableYes?: boolean;
        shallow?: boolean;
        withMeta?: boolean;
        args?: string[];
        token?: string;
        recursive?: boolean;
    }
    export function buildFirestoreCommand(action: string, actionPath: string, data?: any, opts?: FirestoreCommandOptions): string;
    export type FirestoreAction = 'get' | 'set' | 'add' | 'update' | 'delete';
    export default function firestoreAction(action: "add" | "update" | "get" | "set" | "delete" | undefined, actionPath: string, thirdArg?: any, withMeta?: boolean): Promise<any>;
}
declare module "commands/rtdb" {
    export type RTDBAction = 'get' | 'set' | 'push' | 'update' | 'remove';
    export default function rtdbAction(action: "push" | "update" | "get" | "set" | "remove" | undefined, actionPath: string, thirdArg?: any): Promise<any>;
}
declare module "commands/createCustomToken" {
    export default function createCustomToken(uid: string, envName?: string): Promise<string>;
}
declare module "index" {
    import firestoreAction from "commands/firestore";
    import rtdbAction from "commands/rtdb";
    import createCustomToken from "commands/createCustomToken";
    export { rtdbAction, createCustomToken };
    export default firestoreAction;
}
