import { Command } from 'commander';
import { firestoreGet } from '../actions/firestore';

/**
 * @name firestoreGet
 * fetch and print JSON data at the specified path of Firestore. Works for both hosted and emulated environments
 * @param {object} program - Commander program
 */
export default function firestoreGetCommand(program: Command): void {
  program
    .command('firestore:get <path>')
    .description(
      'fetch and print JSON data at the specified path of Firestore. Works for both hosted and emulated environments',
    )
    .option('-o, --output <filename>', 'save output to the specified file')
    .option('--emulator', 'use Firestore emulator')
    .option('--debug', 'print verbose debug output to console')
    .action((dbPath: string, options?: any) => {
      return firestoreGet(dbPath, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
