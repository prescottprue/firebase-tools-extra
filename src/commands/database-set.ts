import { Command } from 'commander';
import { rtdbWrite } from '../actions/rtdb';

/**
 * @name databaseSet
 * store JSON data at the specified path
 * @param program - Commander program
 */
export default function databaseSetCommand(program: Command): void {
  program
    .command('database:set <path> [infile]')
    .description('store JSON data at the specified path')
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .option('--emulator', 'use RTDB emulator')
    .action((dbPath, inFile, options) => {
      return rtdbWrite('set', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
