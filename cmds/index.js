/* eslint-disable no-param-reassign */
module.exports = function setupCommands(client) {
  process.env.FORCE_COLOR = true;
  function loadCommand(name) {
    return require('./' + name)(client) // eslint-disable-line
  }

  client.firestore = loadCommand('firestore');

  return client;
};
