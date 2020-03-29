/* eslint-disable @typescript-eslint/no-var-requires */
import { Command } from 'commander';
import { rtdbRemove } from '../actions/rtdb';

/**
 * @name databasePush
 * Add a new JSON object to a list of data in your Firebase
 * @param program - Commander program
 */
export default function databasePushCommand(program: Command): void {
  program
    .command('database:remove <path>')
    .description('remove data from your Firebase at the specified path')
    .option('--emulator', 'use RTDB emulator')
    .option('--debug', 'print verbose debug output to console')
    .action((dbPath: string, options?: any) => {
      return rtdbRemove(dbPath, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
