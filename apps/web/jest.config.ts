import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/e2e/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);
