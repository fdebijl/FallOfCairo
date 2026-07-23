const { pathsToModuleNameMapper } = require('ts-jest');
const path = require('path');

// Manually resolve the extended tsconfig
const parentTsConfig = require('../tsconfig.json');
const compilerOptions = parentTsConfig.compilerOptions;

// The baseUrl in parent tsconfig is relative to the parent directory
// So we need to resolve paths relative to the parent tsconfig location
const parentDir = path.resolve(__dirname, '..');

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  modulePaths: [parentDir],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: parentDir + "/" }),
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        ...compilerOptions,
        types: ["jest", "node"]
      }
    }],
  },
  testRegex: "(\\.|/)test\\.tsx?$",
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
