/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  clearMocks: true,

  collectCoverage: false,

  coverageDirectory: 'coverage',

  coveragePathIgnorePatterns: ['__tests__'],

  coverageProvider: 'v8',

  coverageReporters: [ "text", "json-summary", "html" ],

  resolver: "ts-jest-resolver",

  // setupFiles: ['./setup.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.(spec|test).[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
};

export default config;
