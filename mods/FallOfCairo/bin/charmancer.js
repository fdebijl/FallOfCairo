const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.git'];

/**
 * Check if a character is outside the Latin-1 block (0x00-0xFF)
 * @param {string} char - Single character to check
 * @returns {boolean}
 */
function isOutsideLatin1(char) {
  const code = char.charCodeAt(0);
  return code > 0x7F;
}

/**
 * Scan a file for non-Latin-1 characters
 * @param {string} filePath - Path to the file
 * @returns {Array} Array of issues found
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, lineIndex) => {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (isOutsideLatin1(char)) {
        issues.push({
          line: lineIndex + 1,
          column: i + 1,
          char: char,
          code: '0x' + char.charCodeAt(0).toString(16).toUpperCase(),
          context: line.substring(Math.max(0, i - 20), Math.min(line.length, i + 20))
        });
      }
    }
  });

  return issues;
}

/**
 * Recursively find files matching patterns
 * @param {string} dir - Directory to search
 * @param {Array<string>} patterns - File patterns to match
 * @returns {Array<string>} Array of file paths
 */
function findFiles(dir, patterns) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other common directories
        if (!excludeDirs.includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        // Check if file matches any pattern
        if (patterns.some(pattern => {
          if (pattern.startsWith('*.')) {
            return entry.name.endsWith(pattern.substring(1));
          }

          return entry.name === pattern;
        })) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Main function
 */
function main() {
  console.log('━'.repeat(60));
  console.log('🔍 Checking for non-Basic Latin characters in Portal SDK files...\n');

  const workingDir = process.cwd();
  const patterns = ['*.ts', '*.strings.json'];

  const files = findFiles(workingDir, patterns);
  console.log(`Found ${files.length} files to check\n`);

  let totalIssues = 0;
  const filesWithIssues = [];

  for (const file of files) {
    const relativePath = path.relative(workingDir, file);
    const issues = scanFile(file);

    if (issues.length > 0) {
      totalIssues += issues.length;
      filesWithIssues.push({ file: relativePath, issues });

      console.log(`❌ ${relativePath}`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}:${issue.column} - '${issue.char}' (${issue.code})`);
        console.log(`   Context: ...${issue.context}...`);
      });
      console.log();
    }
  }

  if (totalIssues === 0) {
    console.log('✅ No non-Basic Latin characters found!');
  } else {
    console.log(`⚠️  Found ${totalIssues} non-Basic Latin character(s) in ${filesWithIssues.length} file(s)`);
    console.log('\nFiles with issues:');
    filesWithIssues.forEach(({ file, issues }) => {
      console.log(`  - ${file} (${issues.length} issue${issues.length > 1 ? 's' : ''})`);
    });
  }

  process.exit(totalIssues > 0 ? 1 : 0);
}

// Run the script
main();
