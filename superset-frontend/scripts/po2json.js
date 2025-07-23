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

// This script generates .json files from .po translation files
// these json files are used by the frontend to load translations

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths relative to the script location
const CWD = path.resolve(path.dirname(__dirname));
const TRANSLATIONS_DIR = path.join(CWD, '..', 'superset', 'translations');
const PO2JSON_BIN = path.join(CWD, 'node_modules', '.bin', 'po2json');
const PRETTIER_BIN = path.join(CWD, 'node_modules', '.bin', 'prettier');

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
  console.log(`Searching for .po files in ${TRANSLATIONS_DIR}`);
  const poFiles = findPoFiles(TRANSLATIONS_DIR);

  if (poFiles.length === 0) {
    console.log('No .po files found.');
    process.exit(0);
  }

  for (const file of poFiles) {
    const extension = path.extname(file);
    const filename = file.slice(0, -extension.length);
    const jsonFile = `${filename}.json`;

    const po2jsonCmd = `${PO2JSON_BIN} --domain superset --format jed1.x "${file}" "${jsonFile}"`;
    console.log(po2jsonCmd);
    execSync(po2jsonCmd, { stdio: 'inherit' });

    const prettierCmd = `${PRETTIER_BIN} --write "${jsonFile}"`;
    console.log(prettierCmd);
    execSync(prettierCmd, { stdio: 'inherit' });
  }
} catch (e) {
  console.error('An error occurred during translation conversion:');
  console.error(e);
  process.exit(1);
}
