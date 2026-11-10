/**
 * SCRIPT LAY COOKIE (CHAY O MAY TINH CUA BAN, KHONG PHAI TREN BOTKEEP)
 *
 * Cach dung:
 *  1. npm install
 *  2. node get-cookie.js
 *  3. Nhap email, mat khau, ma 2FA (neu co)
 *  4. No se tao file appstate.json
 *  5. Copy toan bo noi dung appstate.json -> dan vao bien APPSTATE tren Botkeep
 *
 * CANH BAO: Khong bao gio share file appstate.json / cookie cho ai!
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

(async () => {
  const login = require('@dongdev/fca-unofficial');

  console.log('=== LAY COOKIE CHO BOT NICK FCA ===\n');
  const email = await ask('Nhap email / SDT Facebook (acc phu): ');
  const password = await ask('Nhap mat khau: ');
  const twofactor = await ask('Ma 2FA / TOTP secret (Enter neu khong co): ');

  const creds = { email, password };
  if (twofactor) creds.twofactor = twofactor;

  console.log('\nDang dang nhap... doi xiu.');
  login(creds, (err, api) => {
    rl.close();
    if (err) {
      console.error('❌ Dang nhap that bai:', err.message || err);
      console.error('💡 Thu lai, hoac dung cach lay cookie bang trinh duyet (xem README).');
      process.exit(1);
    }
    const appState = api.getAppState();
    fs.writeFileSync('appstate.json', JSON.stringify(appState, null, 2));
    console.log('✅ Thanh cong! Da tao file appstate.json');
    console.log('👉 Copy toan bo noi dung file nay -> dan vao bien APPSTATE tren Botkeep');
    console.log('⚠️  KHONG share file nay cho ai!');
  });
})();
