/* eslint-disable @typescript-eslint/no-var-requires */
import { Command } from 'commander';
import { rtdbWrite } from '../actions/rtdb';

/**
 * @name databasePush
 * Add a new JSON object to a list of data in your Firebase
 * @param program - Commander program
 */
export default function databasePushCommand(program: Command): void {
  program
    .command('database:push <path> [infile]')
    .description('add a new JSON object to a list of data in your Firebase')
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .option('--emulator', 'use RTDB emulator')
    .option('--debug', 'print verbose debug output to console')
    .action((dbPath: string, inFile?: string, options?: any) => {
      return rtdbWrite('push', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
