module.exports = {
  moduleNameMapper: {
    "^@testing-library/jest-dom/extend-expect$": "@testing-library/jest-dom"
  },

  // preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};