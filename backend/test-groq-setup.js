#!/usr/bin/env node

/**
 * Quick Test Script for Groq Backend Setup
 * Run from backend directory: node test-groq-setup.js
 * 
 * This script verifies:
 * 1. GROQ_API_KEY is set in environment
 * 2. Routes are properly exported
 * 3. Backend can connect to Groq API
 */

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

console.log('\n🔍 Groq Backend Setup Verification\n');
console.log('='.repeat(50));

// Test 1: Check environment variable
console.log('\n1️⃣  Checking GROQ_API_KEY in environment...');
if (GROQ_API_KEY) {
  const keyPreview = GROQ_API_KEY.substring(0, 10) + '...' + GROQ_API_KEY.substring(GROQ_API_KEY.length - 4);
  console.log(`✅ GROQ_API_KEY found: ${keyPreview}`);
} else {
  console.log('❌ GROQ_API_KEY not found in .env file');
  process.exit(1);
}

// Test 2: Check .env file exists
console.log('\n2️⃣  Checking .env file...');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`✅ .env file exists at: ${envPath}`);
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('GROQ_API_KEY')) {
    console.log('✅ GROQ_API_KEY is set in .env');
  } else {
    console.log('❌ GROQ_API_KEY not found in .env');
  }
} else {
  console.log(`❌ .env file not found at: ${envPath}`);
}

// Test 3: Check aiRoutes.js exists
console.log('\n3️⃣  Checking aiRoutes.js file...');
const routesPath = path.join(process.cwd(), 'routes', 'aiRoutes.js');
if (fs.existsSync(routesPath)) {
  console.log(`✅ aiRoutes.js exists at: ${routesPath}`);
} else {
  console.log(`❌ aiRoutes.js not found at: ${routesPath}`);
}

// Test 4: Check server.js imports
console.log('\n4️⃣  Checking server.js configuration...');
const serverPath = path.join(process.cwd(), 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  const hasImport = serverContent.includes('import aiRoutes from');
  const hasRoute = serverContent.includes('app.use("/api/ai", aiRoutes)');
  
  if (hasImport) {
    console.log('✅ aiRoutes import found in server.js');
  } else {
    console.log('❌ aiRoutes import NOT found in server.js');
  }
  
  if (hasRoute) {
    console.log('✅ AI routes mounted in server.js');
  } else {
    console.log('❌ AI routes NOT mounted in server.js');
  }
} else {
  console.log(`❌ server.js not found at: ${serverPath}`);
}

// Test 5: Test connection to Groq API
console.log('\n5️⃣  Testing Groq API connection...');
console.log('Sending test request to Groq...');

const testRequest = {
  model: GROQ_MODEL,
  messages: [
    {
      role: "user",
      content: "Respond with single word: OK"
    }
  ],
  max_tokens: 10,
  temperature: 0.3
};

axios.post(GROQ_API_URL, testRequest, {
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  const message = response.data.choices[0].message.content;
  console.log(`✅ Groq API connection successful!`);
  console.log(`   Model: ${GROQ_MODEL}`);
  console.log(`   Response: "${message}"`);
})
.catch(error => {
  console.log('❌ Groq API connection failed!');
  if (error.response) {
    console.log(`   Status: ${error.response.status}`);
    console.log(`   Error: ${error.response.data.error?.message || error.message}`);
  } else {
    console.log(`   Error: ${error.message}`);
  }
})
.finally(() => {
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Verification Complete!\n');
  console.log('Next steps:');
  console.log('1. Start backend: npm run dev');
  console.log('2. Test API endpoints with Postman/Curl');
  console.log('3. Check DoctorDashboard for AI features\n');
});
