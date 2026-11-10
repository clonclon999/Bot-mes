/**
 * BOT MESSENGER NICK CA NHAN (FCA) - VAO NHOM CHAT
 * Node.js + @dongdev/fca-unofficial - Deploy len Botkeep.cloud
 *
 * CANH BAO: Day la API khong chinh thuc, vi pham dieu khoan Meta.
 * Chi dung acc phu, khong dung acc chinh. Co the bi khoa / checkpoint.
 *
 * Len h co san (chi tra loi khi nhan !):
 *  !help / !menu  - Danh sach lenh
 *  !hi            - Chao hoi
 *  !ping          - Kiem tra bot
 *  !time / !gio   - Gio hien tai
 *  !echo <text>   - Lap lai
 *  !joke          - Chuyen cuoi
 *  !info          - Thong tin bot
 */

require('dotenv').config(); // Botkeep ghi bien moi truong vao file .env, phai load file nay
const fs = require('fs');
const path = require('path');
const express = require('express');

// ===== HEALTH CHECK (de Botkeep biet bot con song) =====
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const healthApp = express();
healthApp.get('/', (req, res) => res.send('🤖 Bot nick FCA dang chay!'));
healthApp.listen(PORT, '0.0.0.0', () => console.log(`🌐 Health-check tren port ${PORT}`));

// ===== LAY THONG TIN DANG NHAP =====
function getCredentials() {
  // Cach 1: APPSTATE tu bien moi truong (khuyen dung tren Botkeep)
  if (process.env.APPSTATE) {
    try {
      const parsed = JSON.parse(process.env.APPSTATE);
      console.log('🔑 Dang nhap bang APPSTATE (env)');
      return { appState: parsed };
    } catch (e) {
      console.error('❌ APPSTATE khong phai JSON hop le:', e.message);
    }
  }

  // Cach 1b: file appstate.json o may (chay local)
  const filePath = path.join(__dirname, 'appstate.json');
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log('🔑 Dang nhap bang appstate.json');
      return { appState: parsed };
    } catch (e) {
      console.error('❌ appstate.json loi:', e.message);
    }
  }

  // Cach 2: Email / mat khau
  if (process.env.FB_EMAIL && process.env.FB_PASSWORD) {
    console.log('🔑 Dang nhap bang Email/Password');
    const creds = { email: process.env.FB_EMAIL, password: process.env.FB_PASSWORD };
    if (process.env.FB_2FA_SECRET) creds.twofactor = process.env.FB_2FA_SECRET;
    return creds;
  }

  console.error('❌ Chua co thong tin dang nhap! Hay them APPSTATE hoac FB_EMAIL/FB_PASSWORD vao Environment tren Botkeep.');
  process.exit(1);
}

// ===== XU LY LENH =====
const JOKES = [
  '😂 Tai sao lap trinh vien hay nham Halloween voi Giang sinh? Vi OCT 31 == DEC 25!',
  '🤣 Co 10 loai nguoi tren doi: nguoi hieu nhi phan va nguoi khong hieu.',
  '😆 Debug la qua trinh loai bo bug... bang cach them bug moi vao!',
  '🙃 Lap trinh vien khong chet vi code, ho chet vi... "chi sua 1 dong thoi" roi sua ca ngay!',
];

function handleCommand(api, event) {
  const text = (event.body || '').trim();
  const lower = text.toLowerCase();
  const threadID = event.threadID;
  const senderID = event.senderID;

  const reply = (msg) => api.sendMessage(msg, threadID, (err) => {
    if (err) console.error('❌ Loi gui tin:', err.message || err);
  });

  if (lower === '!help' || lower === '!menu' || lower === 'menu') {
    reply('🤖 DANH SACH LENH:\n\n• !hi - Chao hoi\n• !ping - Kiem tra bot\n• !time / !gio - Xem gio\n• !echo <text> - Lap lai\n• !joke - Chuyen cuoi\n• !info - Thong tin bot\n\nBot chi tra loi khi co dau ! de tranh spam nhom.');
    return;
  }
  if (lower === '!hi' || lower === 'hi' || lower === 'hello') {
    reply('👋 Xin chao! Minh la bot nick FCA. Go !help de xem lenh nhe!');
    return;
  }
  if (lower === '!ping') {
    reply('🏓 Pong! Bot van online ✅');
    return;
  }
  if (lower === '!time' || lower === '!gio') {
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    reply(`⏰ Bay gio la: ${now} (gio Viet Nam)`);
    return;
  }
  if (lower.startsWith('!echo')) {
    const content = text.slice(5).trim();
    reply(content ? `🔁 Ban noi: ${content}` : 'Ban muon minh lap lai gi? Vd: !echo xin chao');
    return;
  }
  if (lower === '!joke') {
    reply(JOKES[Math.floor(Math.random() * JOKES.length)]);
    return;
  }
  if (lower === '!info') {
    reply('ℹ️ Bot nick FCA v1.0\n• Node.js + FCA unofficial\n• Hosting: Botkeep.cloud\n• Chi dung acc phu!');
    return;
  }
  // Khong phai lenh thi khong tra loi (tranh spam nhom)
}

// ===== DANG NHAP VA CHAY BOT =====
async function main() {
  let login;
  try {
    login = require('@dongdev/fca-unofficial');
  } catch (e) {
    console.error('❌ Chua cai thu vien. Hay chay npm install truoc.');
    process.exit(1);
  }

  const credentials = getCredentials();

  login(credentials, (err, api) => {
    if (err) {
      console.error('❌ Dang nhap that bai:', err.message || err);
      console.error('💡 Meo: Cookie het han? Hay lay lai APPSTATE moi. Acc bi checkpoint? Hay doi acc phu khac.');
      // Thoat de Botkeep restart lai sau vai phut
      setTimeout(() => process.exit(1), 5000);
      return;
    }

    console.log('✅ Dang nhap thanh cong! ID cua bot:', api.getCurrentUserID());

    // Luu appState neu dang nhap bang email/pass (de lan sau dung lai)
    try {
      const appState = api.getAppState();
      if (appState && appState.length) {
        fs.writeFileSync(path.join(__dirname, 'appstate.json'), JSON.stringify(appState));
        console.log('💾 Da luu appstate.json (neu Botkeep co persistent volume thi lan sau se dung lai duoc)');
      }
    } catch (e) {
      console.log('⚠️ Khong luu duoc appstate:', e.message);
    }

    api.setOptions({ listenEvents: true });

    api.listenMqtt((listenErr, event) => {
      if (listenErr) {
        console.error('❌ Loi listen:', listenErr.message || listenErr);
        return;
      }
      if (!event || event.type !== 'message' || !event.body) return;

      // Bo qua tin nhan cua chinh minh
      if (event.senderID === api.getCurrentUserID()) return;

      console.log(`💬 [${event.threadID}] ${event.senderID}: ${event.body}`);

      // Chi xu ly khi la lenh bat dau bang !
      if (event.body.trim().startsWith('!')) {
        handleCommand(api, event);
      }
    });

    console.log('🚀 Bot dang lang nghe tin nhan trong nhom + inbox...');
    console.log('💡 Them acc bot vao nhom chat Messenger (thu cong) roi nhan !ping de test.');
  });
}

main();
