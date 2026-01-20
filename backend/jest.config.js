module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/**/*.test.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    moduleNameMapper: {
        '^uuid$': '<rootDir>/__mocks__/uuid.js',
    },
};
