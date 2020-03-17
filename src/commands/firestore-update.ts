import { Command } from 'commander';
import { firestoreWrite } from '../actions/firestore';

/**
 * @name firestoreUpdate
 * update data at specified path of Firestore. Work for both hosted and emulated environments
 * @param {object} program - Commander program
 */
export default function firestoreUpdateCommand(program: Command): void {
  program
    .command('firestore:update <path> [infile]')
    .description(
      'Update data at specified path of Firestore. Work for both hosted and emulated environments',
    )
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .option('--emulator', 'use Firestore emulator')
    .action((dbPath, inFile, options) => {
      return firestoreWrite('update', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
