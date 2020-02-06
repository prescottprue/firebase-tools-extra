module.exports = {
  parser: '@typescript-eslint/parser',
  'extends': [
    'airbnb-base',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:jsdoc/recommended'
  ],
  root: true,
  plugins: ['@typescript-eslint', 'prettier', 'jsdoc'],
  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules', '/'],
        extensions: [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  },
  env: {
    browser: true,
    node: true
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 0,
    'comma-dangle': [2, 'never'],
    'no-shadow': 0,
    'no-new': 0,
    'new-cap': 0,
    'max-len': 0,
    'no-return-await': 2,
    'import/extensions': 0,
    'jsdoc/newline-after-description': 0,
    'jsdoc/require-returns-type': 0,
    'jsdoc/require-param-type': 0,
  },
  overrides: [
    {
      files: ['cmds/**'],
      rules: {
        'comma-dangle': ['error', { 'functions': 'never' }],
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/no-var-requires': 0,
        'prettier/prettier': [
          'error',
          {
            singleQuote: true, // airbnb
            trailingComma: 'none', // airbnb
          }
        ]
      }
    }
  ]
};
