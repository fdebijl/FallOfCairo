#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Validates that all string keys referenced in Widget files exist in the strings.json file
 */
function validateStringKeys() {
  console.log('━'.repeat(60));
  console.log('🔍 Validating string keys in Widget files...\n');

  // Find all *Widget.ts files
  const widgetFiles = glob.sync('**/*Widget.ts', {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**']
  });

  if (widgetFiles.length === 0) {
    console.log('⚠️  No Widget files found');
    return true;
  }

  console.log(`Found ${widgetFiles.length} Widget file(s)\n`);

  // Collect all string key references
  const stringKeyReferences = [];
  const stringKeyPattern = /mod\.stringkeys\.(\w+)/g;

  widgetFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('textLabel')) {
        let match;
        while ((match = stringKeyPattern.exec(line)) !== null) {
          stringKeyReferences.push({
            key: match[1],
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            fullMatch: match[0]
          });
        }
        // Reset regex state for next line
        stringKeyPattern.lastIndex = 0;
      }
    });
  });

  if (stringKeyReferences.length === 0) {
    console.log('✅ No string key references found in Widget files');
    return true;
  }

  console.log(`Found ${stringKeyReferences.length} string key reference(s)\n`);

  // Find the strings.json file
  const stringsFiles = glob.sync('*.strings.json', {
    cwd: process.cwd(),
    absolute: true
  });

  if (stringsFiles.length === 0) {
    console.error('❌ No *.strings.json file found');
    process.exit(1);
  }

  const stringsFilePath = stringsFiles[0];
  console.log(`Using strings file: ${path.relative(process.cwd(), stringsFilePath)}\n`);

  // Load and parse the strings file
  let stringsData;
  try {
    const stringsContent = fs.readFileSync(stringsFilePath, 'utf8');
    stringsData = JSON.parse(stringsContent);
  } catch (error) {
    console.error(`❌ Failed to parse strings file: ${error.message}`);
    process.exit(1);
  }

  // Validate each reference
  const missingKeys = [];
  const validKeys = [];

  stringKeyReferences.forEach(ref => {
    if (stringsData.hasOwnProperty(ref.key)) {
      validKeys.push(ref);
    } else {
      missingKeys.push(ref);
    }
  });

  // Report results
  if (validKeys.length > 0) {
    console.log(`✅ ${validKeys.length} valid string key(s):`);
    validKeys.forEach(ref => {
      console.log(`   ${ref.key} (${ref.file}:${ref.line})`);
    });
    console.log();
  }

  if (missingKeys.length > 0) {
    console.error(`❌ ${missingKeys.length} missing string key(s):\n`);
    missingKeys.forEach(ref => {
      console.error(`   ${ref.key}`);
      console.error(`     Referenced in: ${ref.file}:${ref.line}`);
      console.error(`     Full reference: ${ref.fullMatch}\n`);
    });
    process.exit(1);
  }

  console.log('✅ All string keys validated successfully!\n');
  return true;
}

// Run validation
try {
  validateStringKeys();
} catch (error) {
  console.error(`❌ Validation failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
