import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import checkFile from 'eslint-plugin-check-file'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import vitest from 'eslint-plugin-vitest'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const ignoreConfig = globalIgnores([
  'dist',
  'dist-ssr',
  'coverage',
  '.claude',
  '.gemini',
  '.vscode',
  '.husky',
  'test-results',
  'playwright-report',
  'blob-report',
  'playwright/.cache',
])

const featureConfig = {
  name: 'feature/conventions',
  plugins: {
    'simple-import-sort': simpleImportSort,
    'check-file': checkFile,
  },
  rules: {
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'check-file/filename-naming-convention': [
      'error',
      { '**/*.{ts,tsx}': 'KEBAB_CASE' },
      { ignoreMiddleExtensions: true },
    ],
    'check-file/folder-naming-convention': [
      'error',
      { 'src/**/!(__tests__)': 'KEBAB_CASE' },
    ],
  },
}

const reactConfig = {
  name: 'feature/react',
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}

const testConfig = {
  name: 'feature/testing',
  files: ['**/*.test.{ts,tsx}'],
  languageOptions: {
    globals: vitest.environments.env.globals,
  },
  plugins: { vitest },
  rules: {
    ...vitest.configs.recommended.rules,
  },
}

export default defineConfig([
  ignoreConfig,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  featureConfig,
  reactConfig,
  testConfig,
  eslintConfigPrettier,
])
