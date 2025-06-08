// utils.js
export function generateProductCode(seed) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let hash = seed * 9999;
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[hash % chars.length];
    hash = Math.floor(hash / chars.length);
  }
  return code;
}
