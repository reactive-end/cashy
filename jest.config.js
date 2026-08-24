/** Configuracion de Jest para la suite de Cashy */

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./tests/setup/jest.setup.ts'],
  setupFilesAfterEnv: ['./tests/setup/after-env.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^lucide-react-native$': '<rootDir>/tests/helpers/lucideStub.tsx',
    '^react-native-svg$': '<rootDir>/tests/helpers/svgStub.tsx',
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|jest-expo|expo(nent)?|@expo|nativewind|lucide-react-native|react-native-reanimated|react-native-worklets|react-native-svg|react-native-screens|react-native-safe-area-context|@testing-library)/'
  ],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/services/**/*.ts',
    'src/hooks/**/*.ts',
    'src/db/**/*.ts'
  ],
  testTimeout: 15000,
  coverageThreshold: {
    './src/lib/': { branches: 80, functions: 85, lines: 85, statements: 85 },
    './src/services/': { branches: 80, functions: 85, lines: 85, statements: 85 },
    './src/hooks/': { branches: 70, functions: 75, lines: 75, statements: 75 },
    './src/db/': { branches: 70, functions: 80, lines: 80, statements: 80 }
  }
}
