import { Command } from 'commander';
import { firestoreDelete } from '../actions/firestore';

/**
 * @name firestoreDelete
 * Delete data from Cloud Firestore. Works for both hosted and emulated environments
 * @param {object} program - Commander program
 */
export default function firestoreDeleteCommand(program: Command): void {
  program
    .command('firestore:delete <path>')
    .description(
      'Delete data from Cloud Firestore. Works for both hosted and emulated environments',
    )
    .option(
      '--shallow',
      'Shallow. Delete only parent documents and ignore documents in subcollections. Any action which would orphan documents will fail if this argument is not passed. May not be passed along with -r.',
    )
    // .option(
    //   '-r, --recursive',
    //   'Recursive. Delete all documents and subcollections. Any action which would result in the deletion of child documents will fail if this argument is not passed. May not be passed along with --shallow.'
    // )
    .option('--emulator', 'use Firestore emulator')
    .action((dbPath, options) => {
      return firestoreDelete(dbPath, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
