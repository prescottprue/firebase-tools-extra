// We can modify this how we choose per mono-repo:
// https://github.com/conventional-changelog/commitlint/blob/master/docs/reference-rules.md
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      issuePrefixes: ['PLAT-', '#'],
      referenceActions: ['jira', 'closes', 'fixes']
    }
  },
  rules: {
    // 'references-empty': [2, 'never'],
    // 'scope-enum': [2, 'always', ['all', 'hello', 'world']],
  }
};