const { execSync } = require('child_process');

console.log('🎨 Installing shadcn/ui components...');

try {
  // Install shadcn/ui CLI if not already installed
  execSync('npx shadcn-ui@latest init --yes', { stdio: 'inherit' });
  console.log('✅ shadcn/ui initialized successfully!');
} catch (error) {
  console.error('❌ Error installing shadcn/ui:', error.message);
  console.log('Please run manually: npx shadcn-ui@latest init');
}
