/* eslint-disable @typescript-eslint/no-var-requires */
import { Command } from 'commander';
import { firestoreExport } from '../actions/firestore';

/**
 * @name firestoreExport
 * Export data from Firestore instance (either hosted or emulator). Stores
 * type information for use with firebase:import command.
 * @param {object} program - Commander program
 */
export default function firestoreExportCommand(program: Command): void {
  program
    .command('firestore:export <path>')
    .description(
      'fetch and print JSON data at the specified path from database emulator',
    )
    .option('--debug', 'print verbose debug output to console')
    .option('--collections <paths>', 'List of collections to export')
    .option(
      '--ignoreCollections <paths>',
      'List of collections to ignore in export',
    )
    .action((localPath: string, options?: any) => {
      const cleanedOptions: any = {};
      if (options?.collections) {
        cleanedOptions.collections = options.collections
          .replace(/ /g, '')
          .split(',');
      }
      if (options?.ignoreCollections) {
        cleanedOptions.ignoreCollections = options.ignoreCollections
          .replace(/ /g, '')
          .split(',');
      }
      return firestoreExport(localPath, cleanedOptions)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
