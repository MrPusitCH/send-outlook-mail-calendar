const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Internal Email Sender...');

// Check if .env.local exists, if not create from .env.example
if (!fs.existsSync('.env.local')) {
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env.local');
    console.log('✅ Created .env.local from .env.example');
  } else {
    console.log('⚠️  No .env.example found. Please create .env.local manually.');
  }
}

console.log('✅ Setup complete!');
console.log('📝 Next steps:');
console.log('1. Update .env.local with your email configuration');
console.log('2. Run: npm install');
console.log('3. Run: npm run dev');
