import { Command } from 'commander';
import { rtdbWrite } from '../actions/rtdb';

/**
 * @name databaseUpdate
 * fetch and print JSON data at the specified path from database emulator
 * @param program - Commander program
 */
export default function databaseUpdateCommand(program: Command): void {
  program
    .command('database:update <path> [infile]')
    .description(
      'fetch and print JSON data at the specified path from database emulator',
    )
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .option('--emulator', 'use RTDB emulator')
    .action((dbPath, inFile, options) => {
      return rtdbWrite('update', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}
