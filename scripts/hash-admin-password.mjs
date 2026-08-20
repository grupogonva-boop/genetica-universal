// Genera el par (salt, hash) para configurar ADMIN_PASSWORD_SALT y
// ADMIN_PASSWORD_HASH como secretos del worker, usando los mismos parámetros
// PBKDF2 que worker/index.js. Uso: node scripts/hash-admin-password.mjs "la-contraseña"
import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];
if (!password) { console.error('Uso: node scripts/hash-admin-password.mjs "la-contraseña"'); process.exit(1); }

const saltBytes = crypto.getRandomValues(new Uint8Array(16));
const saltHex = [...saltBytes].map((b) => b.toString(16).padStart(2, '0')).join('');

const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' }, key, 256);
const hashHex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');

console.log('ADMIN_PASSWORD_SALT =', saltHex);
console.log('ADMIN_PASSWORD_HASH =', hashHex);
console.log('\nConfigura ambos con:');
console.log(`  npx wrangler secret put ADMIN_PASSWORD_SALT   # pega: ${saltHex}`);
console.log(`  npx wrangler secret put ADMIN_PASSWORD_HASH   # pega: ${hashHex}`);
