const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\Dell\\Documents\\radja bekam';
const destDir = 'c:\\Users\\Dell\\Documents\\navara-reflexology';

const excludeDirs = ['.git', 'node_modules', '.next', 'scratch'];

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    const dirName = path.basename(src);
    if (excludeDirs.includes(dirName)) {
      return;
    }
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    // Only copy if it doesn't exist to prevent accidental overwrites if it already existed
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  }
}

try {
  console.log(`Copying from ${srcDir} to ${destDir}...`);
  copyRecursiveSync(srcDir, destDir);
  console.log('Copy complete!');
  
  // Also delete local.db in the new directory to ensure a fresh start
  const localDb = path.join(destDir, 'local.db');
  if (fs.existsSync(localDb)) {
    fs.unlinkSync(localDb);
    console.log('Deleted local.db in the new directory.');
  }
} catch (err) {
  console.error('Error copying directory:', err);
}
