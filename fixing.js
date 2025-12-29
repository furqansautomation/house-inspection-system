const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing User.js model...');

// Read User.js
const userPath = path.join(__dirname, 'src/models/User.js');
let userContent = fs.readFileSync(userPath, 'utf8');

// Find and remove the duplicate pre-save hook
const lines = userContent.split('\n');
let inPreSaveHook = false;
let hookStart = -1;
let hookEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('userSchema.pre(\'save\', function(next)') && 
      lines[i+1] && lines[i+1].includes('this.updatedAt = Date.now()')) {
    // Found the duplicate hook
    hookStart = i;
    inPreSaveHook = true;
  }
  
  if (inPreSaveHook && lines[i].includes('next();') && 
      lines[i+1] && lines[i+1].includes('});')) {
    hookEnd = i + 2; // Include the closing brace
    break;
  }
}

if (hookStart !== -1 && hookEnd !== -1) {
  // Remove the lines
  lines.splice(hookStart, hookEnd - hookStart);
  console.log('✅ Removed duplicate pre-save hook from User.js');
  
  // Write back
  fs.writeFileSync(userPath, lines.join('\n'));
} else {
  console.log('⚠️  Could not find duplicate hook. Checking manually...');
  
  // Manual fix - remove lines 96-100
  const manualFixedContent = userContent.replace(
    /\/\/ Update the updatedAt timestamp before saving[\s\S]*?userSchema\.pre\('save', function\(next\) \{[\s\S]*?this\.updatedAt = Date\.now\(\);[\s\S]*?next\(\);[\s\S]*?\}\);/,
    ''
  );
  
  fs.writeFileSync(userPath, manualFixedContent);
  console.log('✅ Manually fixed User.js');
}

console.log('🎉 Fix applied. Now restart your server with: npm run dev');