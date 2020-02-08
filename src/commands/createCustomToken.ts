import * as admin from 'firebase-admin'
import { getServiceAccount, envVarBasedOnCIEnv } from '../utils'


/**
 * @param uid - User's UID
 * @param envName - Name of the environment
 */
export default async function createCustomToken(uid: string, envName?: string): Promise<string> {
  // Get service account from local file falling back to environment variables
  const serviceAccount = getServiceAccount(envName);

  // Get projectId from service account (handling multiple types)
  const FIREBASE_PROJECT_ID =
    serviceAccount &&
    (serviceAccount.project_id || (serviceAccount as any).projectId);

  // Remove firebase- prefix (was added to database names for a short period of time)
  const cleanedProjectId = FIREBASE_PROJECT_ID.replace('firebase-', '');

  // Initialize Firebase app with service account
  const appFromSA = admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount as any),
      databaseURL: `https://${cleanedProjectId}.firebaseio.com`
    },
    'withServiceAccount'
  );

  // Read developer claims object from cypress/config.json
  const developerClaims = envVarBasedOnCIEnv('DEVELOPER_CLAIMS', envName);
  // Check if object is empty. If not, return it, otherwise set developer claims as { isTesting: true }
  const defaultDeveloperClaims =
    !!developerClaims && Object.keys(developerClaims).length > 0
      ? developerClaims
      : { isTesting: true };

  // Create auth token
  try {
    const token = await appFromSA.auth().createCustomToken(uid, defaultDeveloperClaims)
    process.stdout.write(token);
    return token
  } catch(err) {
    console.error(`Error generating custom token for uid: ${uid}`, err)  // eslint-disable-line no-console
    throw err
  }
}