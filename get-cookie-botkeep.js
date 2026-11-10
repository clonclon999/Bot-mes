/**
 * SCRIPT LAY COOKIE - CHAY THANG TREN BOTKEEP (KHONG CAN MAY TINH)
 *
 * Cach dung tren Botkeep:
 *  1. Tao 1 project tam (Application -> Node.js 24 -> ZIP bot-messenger-fca.zip)
 *  2. Start Command: node get-cookie-botkeep.js
 *  3. Them Environment:
 *       FB_EMAIL=accphu@email.com
 *       FB_PASSWORD=matkhau
 *       FB_2FA_SECRET=ma_2fa (neu co, de trong neu khong co)
 *  4. Start project, vao tab Console/Logs
 *  5. Copy doan JSON nam giua ===APPSTATE_START=== va ===APPSTATE_END===
 *  6. Xoa project tam nay, dan doan JSON do vao bien APPSTATE cua project bot chinh
 *
 * CANH BAO: Khong share doan JSON nay cho ai! Ai co la dieu khien duoc acc.
 */

const fs = require('fs');

const email = process.env.FB_EMAIL;
const password = process.env.FB_PASSWORD;
const twofactor = process.env.FB_2FA_SECRET;

if (!email || !password) {
  console.error('❌ Thieu FB_EMAIL hoac FB_PASSWORD!');
  console.error('Hay them 2 bien nay vao Environment tren Botkeep roi Restart.');
  process.exit(1);
}

console.log('🔄 Dang dang nhap bang acc phu... doi xiu, co the mat 1-2 phut.');
console.log('⚠️  Neu acc co 2FA ma ban khong nhap FB_2FA_SECRET thi se loi.');

let login;
try {
  login = require('@dongdev/fca-unofficial');
} catch (e) {
  console.error('❌ Chua cai thu vien. Hay chac chan da chay npm install (Botkeep tu chay khi deploy).');
  process.exit(1);
}

const creds = { email, password };
if (twofactor) creds.twofactor = twofactor;

login(creds, (err, api) => {
  if (err) {
    console.error('❌ Dang nhap that bai:', err.message || err);
    console.error('💡 Meo:');
    console.error(' - Kiem tra lai email/mat khau co dung khong');
    console.error(' - Acc co bat 2FA thi phai nhap FB_2FA_SECRET');
    console.error(' - Acc bi checkpoint thi doi acc phu khac');
    process.exit(1);
  }

  console.log('✅ Dang nhap thanh cong! ID:', api.getCurrentUserID());

  try {
    const appState = api.getAppState();
    fs.writeFileSync('appstate.json', JSON.stringify(appState));
    console.log('💾 Da luu appstate.json');
  } catch (e) {
    console.log('⚠️ Khong luu duoc file, nhung van in JSON ben duoi.');
  }

  const appState = api.getAppState();
  console.log('\n===APPSTATE_START===');
  console.log(JSON.stringify(appState));
  console.log('===APPSTATE_END===\n');
  console.log('👉 Copy TOAN BO dong JSON o giua 2 dong ===APPSTATE===');
  console.log('👉 Dan vao bien APPSTATE cua project bot chinh tren Botkeep');
  console.log('⚠️  KHONG share doan nay cho ai!');

  // Thoat sau 3 giay de Botkeep biet xong
  setTimeout(() => process.exit(0), 3000);
});
