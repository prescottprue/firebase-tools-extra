/* eslint-disable @typescript-eslint/no-var-requires */
import { Command } from 'commander';
import { firestoreExport } from '../actions/firestore';

/**
 * @name databaseGet
 * fetch and print JSON data at the specified path from database emulator
 * @param {object} program - Commander program
 */
export default function databaseGetCommand(program: Command): void {
  program
    .command('firestore:export <path>')
    .description(
      'fetch and print JSON data at the specified path from database emulator',
    )
    .option('--debug', 'print verbose debug output to console')
    .action((localPath: string, options?: any) => {
      return firestoreExport(localPath, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
