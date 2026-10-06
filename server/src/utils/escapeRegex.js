// Turns special regex characters into plain text
const escapeRegex = (text) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = escapeRegex;
