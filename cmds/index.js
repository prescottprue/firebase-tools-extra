/* eslint-disable no-param-reassign */
module.exports = function setupCommands(client) {
  process.env.FORCE_COLOR = true;

  /**
   * Load command from file by name
   * @param name - Name of command
   * @returns {object} Command object
   */
  function loadCommand(name) {
    return require('./' + name)(client) // eslint-disable-line
  }

  client.createCustomToken = loadCommand('createCustomToken');
  client.databaseGet = loadCommand('database-get');
  client.databasePush = loadCommand('database-push');
  client.databaseRemove = loadCommand('database-remove');
  client.databaseSet = loadCommand('database-set');
  client.databaseUpdate = loadCommand('database-update');
  client.firestoreDelete = loadCommand('firestore-delete');
  client.firestoreGet = loadCommand('firestore-get');
  client.firestoreSet = loadCommand('firestore-set');
  client.firestoreUpdate = loadCommand('firestore-update');

  return client;
};
