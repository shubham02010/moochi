export function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now();
}
