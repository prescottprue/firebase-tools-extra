import { Command } from 'commander';
import { firestoreWrite } from '../actions/firestore';

/**
 * @name firestoreAdd
 * Add data to specified collection or sub-collection of Firestore. Work for both hosted and emulated environments
 * @param {object} program - Commander program
 */
export default function firestoreAddCommand(program: Command): void {
  program
    .command('firestore:add <path> [infile]')
    .description(
      'Add data to specified collection or sub-collection of Firestore. Work for both hosted and emulated environments',
    )
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .option('--emulator', 'use Firestore emulator')
    .option('--debug', 'print verbose debug output to console')
    .action((dbPath: string, inFile?: string, options?: any) => {
      return firestoreWrite('add', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
