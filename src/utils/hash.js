// hash.js
const bcrypt = require('bcrypt');

// Number of salt rounds (higher = more secure but slower)
const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password
 * @param {string} plainPassword - Password to hash
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(plainPassword) {
  try {
    if (!plainPassword) throw new Error("Password is required for hashing.");
    const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hashed;
  } catch (err) {
    console.error("Error hashing password:", err.message);
    throw err;
  }
}

/**
 * Compares a plain password with a hashed password
 * @param {string} plainPassword - Password entered by user
 * @param {string} hashedPassword - Password stored in database
 * @returns {Promise<boolean>} - True if match, else false
 */
async function comparePassword(plainPassword, hashedPassword) {
  try {
    if (!plainPassword || !hashedPassword) {
      throw new Error("Both plain and hashed passwords are required for comparison.");
    }
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (err) {
    console.error("Error comparing passwords:", err.message);
    throw err;
  }
}

module.exports = { hashPassword, comparePassword };
