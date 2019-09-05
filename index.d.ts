declare module "constants" {
    export const DEFAULT_TEST_FOLDER_PATH = "test/e2e";
    export const FALLBACK_TEST_FOLDER_PATH = "cypress";
    export const DEFAULT_SERVICE_ACCOUNT_PATH = "serviceAccount.json";
    export const DEFAULT_TEST_ENV_FILE_PATH = "cypress.env.json";
    export const DEFAULT_CONFIG_FILE_PATH = "config.json";
    export const FIREBASE_TOOLS_BASE_COMMAND = "$(npm bin)/firebase";
    export const FIREBASE_EXTRA_PATH = "$(npm bin)/firebase-extra";
    export const FIREBASE_TOOLS_YES_ARGUMENT = "-y";
    export const DEFAULT_BASE_PATH: string;
}
declare module "utils" {
    import * as admin from "firebase-admin";
    export function readJsonFile(filePath: string): any;
    interface DataItem {
        id: string;
        data: any;
    }
    export function dataArrayFromSnap(snap: admin.firestore.QuerySnapshot | admin.firestore.DocumentSnapshot): DataItem[];
    export function parseFixturePath(unparsed: string): any;
    export function getEnvPrefix(envName?: string): string;
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
    export function slashPathToFirestoreRef(firestoreInstance: any, slashPath: string, options?: any): admin.firestore.CollectionReference & admin.firestore.DocumentReference;
    export function getArgsString(args: string[]): string;
}
declare module "commands/firestore" {
    export interface FirestoreCommandOptions {
        projectId?: string;
        disableYes?: boolean;
        shallow?: boolean;
        recursive?: boolean;
    }
    export interface FirestoreCommandOptions {
        withMeta?: boolean;
        args?: string[];
        token?: string;
        recursive?: boolean;
    }
    export function buildFirestoreCommand(action: string, actionPath: string, data?: any, opts?: FirestoreCommandOptions): string;
    export type FirestoreAction = 'get' | 'set' | 'update' | 'delete';
    export default function firestoreAction(action: "update" | "get" | "set" | "delete" | undefined, actionPath: string, thirdArg?: any, withMeta?: boolean): Promise<any>;
}
declare module "index" {
    import firestoreAction from "commands/firestore";
    export default firestoreAction;
}
