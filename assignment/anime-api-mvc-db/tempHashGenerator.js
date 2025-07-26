const bcrypt = require('bcryptjs');

async function generateHash() {
  const newHash = await bcrypt.hash("admin123", 10);
  console.log("NEW HASH FOR 'admin123':", newHash);
}

generateHash();