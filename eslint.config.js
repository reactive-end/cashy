const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true
        }
      }
    },
    rules: {
      'import/no-unresolved': ['error', { ignore: ['\\.css$'] }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '@src/**', group: 'internal' }],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always'
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAnyKeyword',
          message: '"any" esta prohibido: define un tipo concreto o un generico acotado.'
        },
        {
          selector: 'TSUnknownKeyword',
          message: '"unknown" esta prohibido: define un tipo concreto o una interfaz de validacion.'
        }
      ]
    }
  }
])
