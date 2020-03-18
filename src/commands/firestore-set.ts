import { Command } from 'commander';
import { firestoreWrite } from '../actions/firestore';

/**
 * @name firestoreSet
 * set data to specified path of Firestore. Work for both hosted and emulated environments
 * @param {object} program - Commander program
 */
export default function firestoreSetCommand(program: Command): void {
  program
    .command('firestore:set <path> [infile]')
    .description(
      'set data to specified path of Firestore. Work for both hosted and emulated environments',
    )
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .option('--emulator', 'use Firestore emulator')
    .action((dbPath, inFile, options) => {
      return firestoreWrite('set', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
