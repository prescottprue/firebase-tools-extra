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
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
  env: {
    browser: true,
    node: true
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 0,
    'import/prefer-default-export': 0,
    'no-shadow': 0,
    'consistent-return': 0,
    'no-new': 0,
    'new-cap': 0,
    'no-return-await': 2,
    'jsdoc/newline-after-description': 0,
    'jsdoc/require-returns-type': 0,
    'jsdoc/require-param-type': 0,
    'import/extensions': 0,
    'jsdoc/newline-after-description': 0,
    'jsdoc/require-returns-type': 0,
    'jsdoc/require-param-type': 0,
    'no-undef': 0, // handled by typescript noUnusedLocals: true option
    'prettier/prettier': [
      'error',
      {
        singleQuote: true, // airbnb
        trailingComma: 'all', // airbnb
      }
    ]
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
    },
    {
      files: ['test/unit/**/*.spec.ts'],
      globals:{ 
        sinon: true,
        expect: true,
        after: true,
        afterEach: true,
        before: true,
        beforeEach: true,
        it: true,
        describe: true
      },
      plugins: [
        'mocha',
        'chai-friendly'
      ],
      rules: {
        'no-unused-expressions': 0,
        'chai-friendly/no-unused-expressions': 2,
        'func-names': 0
      }
    }
  ]
};
