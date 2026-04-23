import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import astro from 'eslint-plugin-astro'
import prettier from 'eslint-config-prettier'
import checkFile from 'eslint-plugin-check-file'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import vitest from 'eslint-plugin-vitest'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist',
    '.astro',
    'coverage',
    '.claude',
    '.gemini',
    '.vscode',
    '.husky',
    'test-results',
    'playwright-report',
    'blob-report',
    'playwright/.cache',
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'check-file': checkFile,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{ts,tsx,astro}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'src/**/!(__tests__|pages)': 'KEBAB_CASE' },
      ],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['*.config.{js,mjs,cjs,ts}', 'astro.config.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    ...vitest.configs.recommended,
  },
  prettier,
])
