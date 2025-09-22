// Simple test for Phase 1 - UID format fix
console.log('Starting Phase 1 test...');

try {
  const { generateEventUID } = require('./lib/calendar.ts');
  console.log('Module loaded successfully');
  
  const uid = generateEventUID();
  console.log('Generated UID:', uid);
  
  // Check UID format
  const atCount = (uid.match(/@/g) || []).length;
  console.log('Number of @ characters:', atCount);
  console.log('Has exactly one @:', atCount === 1);
  
  const uidPattern = /^[A-Za-z0-9-]+@[A-Za-z0-9.-]+$/;
  console.log('Matches pattern:', uidPattern.test(uid));
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
