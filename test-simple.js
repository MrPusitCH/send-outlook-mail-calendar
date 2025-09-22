// Simple test without TypeScript
console.log('Testing UID generation...');

// Simulate the generateEventUID function
function generateEventUID() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  // Extract domain from SMTP_FROM_EMAIL or FROM_EMAIL
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp';
  const domain = fromEmail.split('@')[1] || 'dit.daikin.co.jp';
  
  return `${timestamp}-${random}@${domain}`;
}

// Test the function
const uid = generateEventUID();
console.log('Generated UID:', uid);

// Check UID format
const atCount = (uid.match(/@/g) || []).length;
console.log('Number of @ characters:', atCount);
console.log('Has exactly one @:', atCount === 1);

const uidPattern = /^[A-Za-z0-9-]+@[A-Za-z0-9.-]+$/;
console.log('Matches pattern:', uidPattern.test(uid));

// Test multiple UIDs
console.log('\nTesting multiple UIDs:');
for (let i = 0; i < 3; i++) {
  const testUid = generateEventUID();
  const testAtCount = (testUid.match(/@/g) || []).length;
  console.log(`${i + 1}. ${testUid} (${testAtCount} @ chars)`);
}
