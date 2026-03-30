#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), quiet: true });

const appUrl = process.env.APP_URL || 'http://localhost:3000';
const endpoint = `${appUrl}/api/questions?testCode=pt-6&subjectCode=da-105-linear-algebra`;

async function run() {
  try {
    console.log(`Smoke test endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body}`);
    }

    const payload = await response.json();

    if (!payload || !Array.isArray(payload.questions)) {
      throw new Error('Invalid response shape: questions array missing');
    }

    if (payload.questions.length === 0) {
      throw new Error('No questions returned from API');
    }

    const first = payload.questions[0];
    if (!first.id || !first.prompt || !Array.isArray(first.options)) {
      throw new Error('Question payload is missing required fields');
    }

    console.log('Smoke test passed');
    console.log(`Questions returned: ${payload.questions.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Smoke test failed');
    console.error(error.message || error);
    process.exit(1);
  }
}

run();
