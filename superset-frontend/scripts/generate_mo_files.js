#!/usr/bin/env node
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

// This script generates .mo files from .po translation files.
// .mo files are used by the backend for translations.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths relative to the superset-frontend directory
const CWD = process.cwd();
const TRANSLATIONS_DIR = path.join(CWD, '..', 'superset', 'translations');

function findPoFiles(dir) {
  let poFiles = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      poFiles = poFiles.concat(findPoFiles(filePath));
    } else if (path.extname(filePath) === '.po') {
      poFiles.push(filePath);
    }
  }
  return poFiles;
}

try {
  // Check if gettext is installed
  try {
    execSync('msgfmt --version', { stdio: 'ignore' });
  } catch (e) {
    console.error(
      'Could not find `msgfmt`. Please make sure `gettext` is installed.',
    );
    process.exit(1);
  }

  console.log(`Searching for .po files in ${TRANSLATIONS_DIR}`);
  const poFiles = findPoFiles(TRANSLATIONS_DIR);

  if (poFiles.length === 0) {
    console.log('No .po files found.');
    process.exit(0);
  }

  for (const file of poFiles) {
    const extension = path.extname(file);
    const moFile = `${file.slice(0, -extension.length)}.mo`;

    // The command needs to be run from the parent `superset` directory
    // for the paths in the .po file to be resolved correctly.
    const command = `msgfmt -o "${path.relative(
      path.join(CWD, '..'),
      moFile,
    )}" "${path.relative(path.join(CWD, '..'), file)}"`;

    console.log(`Executing in ${path.join(CWD, '..')}: ${command}`);
    execSync(command, { stdio: 'inherit', cwd: path.join(CWD, '..') });
  }

  console.log('Successfully generated .mo files.');
} catch (e) {
  console.error('An error occurred during .mo file generation:');
  console.error(e);
  process.exit(1);
}
