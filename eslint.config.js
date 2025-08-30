import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // JavaScript rules
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': 'off', // Using TypeScript version instead

      // Code quality
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Best practices
      curly: ['error', 'all'],
      'dot-notation': 'error',
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
  {
    files: ['**/*.test.js', '**/*.test.ts', '**/tests/**/*', 'jest.config.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        global: 'readonly',
        console: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Allow console in tests
      'no-undef': 'off', // Allow test globals
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '*.min.js', 'coverage/**'],
  },
];
