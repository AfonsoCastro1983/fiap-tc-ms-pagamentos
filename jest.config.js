/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    "^.+.tsx?$": ["ts-jest", {
      tsconfig: './tsconfig.test.json'
    }],
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/index.ts",
    "!src/infra/http/routes/*.ts"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "clover"],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  reporters: [
    "default",
    ['jest-sonar', {
      outputDirectory: 'test-reports',
      outputName: 'test-report.xml',
      reportedFilePath: 'relative',
    }]
  ]
};