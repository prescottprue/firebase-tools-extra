module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      issuePrefixes: ['#'],
      referenceActions: ['closes', 'fixes']
    }
  },
  rules: {
    // 'references-empty': [2, 'never'],
    // 'scope-enum': [2, 'always', ['all', 'hello', 'world']],
  }
};