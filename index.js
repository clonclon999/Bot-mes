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
 *  --- TRO CHOI TIEN AO VND (giai tri, khong dung tien that) ---
 *  !balance       - Xem so du VNĐ
 *  !daily         - Nhan 50.000 VNĐ moi ngay
 *  !diemdanh      - Diem danh nhan tien theo streak
 *  !work          - Lam viec nhan VNĐ (cooldown 60s)
 *  !fish          - Di cau ca (cooldown 120s)
 *  !farm          - Trong cay thu hoach (cooldown 180s)
 *  !bank <tien> @ten - Chuyen tien cho nguoi khac
 *  !taixiu <tai|xiu|so> <cuoc>  - Vd: !taixiu tai 10000
 *  !baucua <bau|cua|tom|ca|ga|nai> <cuoc> - Vd: !baucua cua 10000
 *  !slot <cuoc>   - Quay xeng: !slot 10000
 *  !lotto <so 00-99> <cuoc> - Xo so: !lotto 69 10000
 *  !lixi <tien>   - Tha lixi, nguoi khac go !nhan de nhan
 *  !quiz          - Do vui co thuong (tra loi dung dau tien duoc tien)
 *  !soicau        - Xem lich su + thong ke Tai/Xiu (chi thong ke, khong du doan duoc ket qua that)
 *  !top           - Bang xep hang dai gia
 *  --- ADMIN (chi admin moi dung duoc, go !adminhelp) ---
 *  !addadmin / !deladmin / !admins - Quan ly admin
 *  !kick / !ban / !unban / !mute / !unmute / !warn - Dieu hanh thanh vien
 *  !give / !reset - Tang / reset tien
 *  !stats / !settitle / !color / !emoji - Thong ke & tuy chinh nhom
 *
 * Chong spam / do bi Facebook quet + chay nhe tren goi free Botkeep:
 *  - Chi tra loi lenh co dau !, cooldown moi lenh, delay ngau nhien giong nguoi
 *  - Khong tu nhan truoc, khong spam tin, gioi han lich su, khong nang
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

// ===== HE THONG XU AO + TRO CHOI =====
// Luu y: Chi dung tien ao VNĐ de giai tri trong nhom, KHONG dung tien that, KHONG dung de choi co bac that.
const START_BALANCE = 100000; // 100.000 VNĐ
const DAILY_REWARD = 50000; // 50.000 VNĐ
const DATA_FILE = path.join(__dirname, 'data.json');

let users = {}; // senderID -> { balance, lastDaily, lastWork, wins, losses, lastCheckin, streak, banned, mutedUntil, warns }
let taixiuHistory = []; // [{ sum, result: 'tai'|'xiu', dice: [a,b,c] }]
let admins = []; // [senderID, ...] - admin cua bot
const cooldowns = {}; // senderID -> timestamp (chong spam)
const activeLixi = {}; // threadID -> { amount, creatorID, expiresAt }
const activeQuiz = {}; // threadID -> { question, answer, reward, expiresAt }

const QUIZ_QUESTIONS = [
  { q: 'Con gi keu "meo meo"?', a: 'meo' },
  { q: 'Viet Nam thu do la gi?', a: 'ha noi' },
  { q: 'Mau gi la mau cua bao la Viet Nam?', a: 'do' },
  { q: '1 + 1 = ?', a: '2' },
  { q: 'Con gi co 4 chan va sua "moo moo"?', a: 'bo' },
  { q: 'Ngay le Quoc khanh Viet Nam la ngay may?', a: '2/9' },
  { q: 'Con gi bay tren troi va keu "o o"?', a: 'ga' },
  { q: 'Nuoc gi dai nhat the gioi?', a: 'nga' },
  { q: 'Con gi song duoi nuoc va co 8 chan?', a: 'bach tuoc' },
  { q: 'Dong tien Viet Nam goi la gi?', a: 'dong' },
  { q: 'Con gi an chuoi va leo cay?', a: 'khoi' },
  { q: 'Mua gi la mua cua hoa mai?', a: 'tet' },
  { q: 'Con gi co mai cung va bo trong nuoc?', a: 'rua' },
  { q: 'So lon nhat co 1 chu so la?', a: '9' },
  { q: 'Con gi keu "u u" va thich an co?', a: 'trau' },
];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      users = data.users || {};
      taixiuHistory = data.taixiuHistory || [];
      admins = data.admins || [];
      console.log(`💾 Da load du lieu: ${Object.keys(users).length} nguoi choi, ${taixiuHistory.length} van Tai Xiu, ${admins.length} admin`);
    }
  } catch (e) {
    console.log('⚠️ Khong load duoc data.json:', e.message);
  }
}
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users, taixiuHistory: taixiuHistory.slice(-100), admins }, null, 2));
  } catch (e) {
    // Botkeep co the khong ghi duoc file, bo qua
  }
}
function isAdmin(id) {
  return admins.includes(String(id));
}
loadData();

// Admin co dinh qua bien moi truong ADMIN_IDS (khong can go lenh trong nhom)
// Vi du tren Botkeep: ADMIN_IDS=1234567890123,9876543210987
if (process.env.ADMIN_IDS || process.env.ADMIN_ID) {
  const envAdmins = (process.env.ADMIN_IDS || process.env.ADMIN_ID).split(',').map(s => s.trim()).filter(Boolean);
  for (const id of envAdmins) {
    if (!admins.includes(id)) admins.push(id);
  }
  if (envAdmins.length) console.log(`🛡️ Da load ${envAdmins.length} admin tu bien ADMIN_IDS`);
}

function getUser(id) {
  if (!users[id]) {
    users[id] = { balance: START_BALANCE, lastDaily: 0, lastWork: 0, wins: 0, losses: 0, lastCheckin: 0, streak: 0, banned: false, mutedUntil: 0, warns: 0 };
    saveData();
  }
  // migrate user cu thieu truong moi
  if (users[id].lastCheckin === undefined) users[id].lastCheckin = 0;
  if (users[id].streak === undefined) users[id].streak = 0;
  if (users[id].banned === undefined) users[id].banned = false;
  if (users[id].mutedUntil === undefined) users[id].mutedUntil = 0;
  if (users[id].warns === undefined) users[id].warns = 0;
  return users[id];
}

function normalize(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
}

function checkCooldown(senderID, seconds) {
  const now = Date.now();
  if (cooldowns[senderID] && now - cooldowns[senderID] < seconds * 1000) {
    return Math.ceil((seconds * 1000 - (now - cooldowns[senderID])) / 1000);
  }
  cooldowns[senderID] = now;
  return 0;
}

function parseBet(args, user) {
  const bet = parseInt(args[args.length - 1], 10);
  if (isNaN(bet) || bet <= 0) return { error: 'Cuoc phai la so > 0. Vd: !taixiu tai 10000' };
  if (bet > user.balance) return { error: `Khong du VNĐ! So du cua ban: ${user.balance} VNĐ` };
  if (bet > 10000000) return { error: 'Cuoc toi da 10.000.000 VNĐ/van.' };
  return { bet };
}

function handleCommand(api, event) {
  const text = (event.body || '').trim();
  const lower = text.toLowerCase();
  const threadID = event.threadID;
  const senderID = event.senderID;

  // Chong spam / giong nguoi: delay ngau nhien 400-1000ms + typing indicator
  const reply = (msg) => {
    const delay = 400 + Math.floor(Math.random() * 601);
    try { if (api.sendTypingIndicator) api.sendTypingIndicator(threadID); } catch (e) {}
    setTimeout(() => {
      api.sendMessage(msg, threadID, (err) => {
        if (err) console.error('❌ Loi gui tin:', err.message || err);
      });
    }, delay);
  };

  // Kiem tra ban / mute (admin van dung duoc lenh unban/unmute)
  const senderUser = getUser(senderID);
  const isSenderAdmin = isAdmin(senderID);
  if (senderUser.banned && !isSenderAdmin && lower !== '!unban' && lower !== '!admins') {
    return; // im lang, khong tra loi
  }
  if (senderUser.mutedUntil && Date.now() < senderUser.mutedUntil && !isSenderAdmin) {
    return; // dang bi mute thi im lang
  }

  if (lower === '!help' || lower === '!menu' || lower === 'menu') {
    reply('🤖 DANH SACH LENH:\n\n' +
      '• !hi - Chao hoi\n• !ping - Kiem tra bot\n• !time / !gio - Xem gio\n' +
      '• !echo <text> - Lap lai\n• !joke - Chuyen cuoi\n• !info - Thong tin bot\n\n' +
      '🎮 TRO CHOI TIEN AO VND (giai tri, khong dung tien that):\n' +
      '• !balance - Xem so du\n• !daily - Nhan 50.000 VNĐ moi ngay\n• !diemdanh - Diem danh theo streak\n• !work - Lam viec nhan VNĐ\n' +
      '• !fish - Di cau ca\n• !farm - Trong cay thu hoach\n' +
      '• !bank <so tien> @ten - Chuyen tien cho nguoi khac\n' +
      '  Vd: !bank 50000 @TenBan\n' +
      '• !taixiu <tai|xiu|so> <cuoc> - Vd: !taixiu tai 10000\n' +
      '• !baucua <bau|cua|tom|ca|ga|nai> <cuoc> - Vd: !baucua cua 10000\n' +
      '• !slot <cuoc> - Quay xeng, Vd: !slot 10000\n' +
      '• !lotto <so 00-99> <cuoc> - Xo so, Vd: !lotto 69 10000\n' +
      '• !lixi <tien> - Tha lixi, nguoi khac go !nhan de nhan\n' +
      '• !quiz - Do vui co thuong (tra loi dung dau tien)\n' +
      '• !soicau - Xem lich su Tai/Xiu\n• !top - Dai gia nhat nhom\n\n' +
      'Bot chi tra loi khi co dau ! de tranh spam nhom.\nAdmin go !adminhelp de xem lenh quan tri.');
    return;
  }
  if (lower === '!hi' || lower === 'hi' || lower === 'hello') {
    reply('👋 Xin chao! Minh la bot nick FCA. Go !help de xem lenh nhe!');
    return;
  }
  if (lower === '!id' || lower === '!myid' || lower === '!uid') {
    reply(`🪪 ID cua ban la: ${senderID}\nCopy ID nay dan vao bien ADMIN_IDS tren Botkeep de lam admin vinh vien, khong can go lenh trong nhom.`);
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
    reply('ℹ️ Bot nick FCA v1.1\n• Node.js + FCA unofficial\n• Hosting: Botkeep.cloud\n• Chi dung acc phu!');
    return;
  }

  // ===== TIEN XU AO =====
  if (lower === '!balance' || lower === '!bal' || lower === '!tien') {
    const u = getUser(senderID);
    reply(`💰 So du cua ban: ${u.balance} VNĐ\n🏆 Thang: ${u.wins} | Thua: ${u.losses}`);
    return;
  }
  if (lower === '!daily') {
    const u = getUser(senderID);
    const now = Date.now();
    if (now - u.lastDaily < 24 * 60 * 60 * 1000) {
      const left = Math.ceil((24 * 60 * 60 * 1000 - (now - u.lastDaily)) / 1000 / 60 / 60);
      reply(`⏳ Ban da nhan daily roi, quay lai sau ${left} gio nua.`);
      return;
    }
    u.lastDaily = now;
    u.balance += DAILY_REWARD;
    saveData();
    reply(`🎁 Nhan daily thanh cong! +${DAILY_REWARD} VNĐ\n💰 So du hien tai: ${u.balance} VNĐ`);
    return;
  }
  if (lower === '!work') {
    const u = getUser(senderID);
    const cd = checkCooldown(senderID + '_work', 60);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nua moi lam viec duoc.`); return; }
    const earn = 5000 + Math.floor(Math.random() * 15001); // 5.000 - 20.000 VNĐ
    u.balance += earn;
    saveData();
    reply(`💼 Ban da lam viec va nhan duoc ${earn} VNĐ!\n💰 So du: ${u.balance} VNĐ`);
    return;
  }
  if (lower === '!top') {
    const sorted = Object.entries(users).sort((a, b) => b[1].balance - a[1].balance).slice(0, 10);
    if (!sorted.length) { reply('Chua co ai choi. Go !daily de nhan VNĐ dau tien!'); return; }
    let msg = '🏆 BANG XEP HANG DAI GIA:\n\n';
    sorted.forEach(([id, u], i) => { msg += `${i + 1}. ${id.slice(-6)}... - ${u.balance} VNĐ\n`; });
    reply(msg);
    return;
  }

  // ===== BANK / CHUYEN TIEN =====
  if (lower.startsWith('!bank') || lower.startsWith('!chuyen') || lower.startsWith('!pay') || lower.startsWith('!transfer')) {
    const cd = checkCooldown(senderID + '_bank', 5);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nua moi chuyen duoc.`); return; }
    const parts = text.split(/\s+/);

    // Lay nguoi nhan: uu tien mention, sau do den ID so trong tin nhan
    let recipientID = null;
    let recipientName = '';
    if (event.mentions && event.mentions.length > 0) {
      recipientID = String(event.mentions[0].id);
      recipientName = event.mentions[0].name || '';
    } else {
      for (const p of parts) {
        if (/^\d{10,}$/.test(p)) { recipientID = p; break; }
      }
    }

    // Lay so tien: so dau tien trong parts sau lenh
    let amount = null;
    for (let i = 1; i < parts.length; i++) {
      const n = parseInt(parts[i], 10);
      if (!isNaN(n) && n > 0 && String(n) === parts[i].replace(/,/g, '')) { amount = n; break; }
      if (!isNaN(n) && n > 0) { amount = n; break; }
    }

    if (!recipientID) {
      reply('Cu phap: !bank <so tien> @ten\nVd: !bank 50000 @TenBan\n(Hay @ ten nguoi nhan trong tin nhan)');
      return;
    }
    if (!amount || amount <= 0) {
      reply('So tien chuyen phai > 0. Vd: !bank 50000 @TenBan');
      return;
    }
    if (recipientID === String(senderID)) {
      reply('Khong the tu chuyen tien cho chinh minh dau!');
      return;
    }
    const sender = getUser(senderID);
    if (amount > sender.balance) {
      reply(`Khong du VNĐ! So du cua ban: ${sender.balance} VNĐ`);
      return;
    }
    if (amount > 10000000) {
      reply('Moi lan chuyen toi da 10.000.000 VNĐ.');
      return;
    }
    const receiver = getUser(recipientID);
    sender.balance -= amount;
    receiver.balance += amount;
    saveData();
    reply(`💸 CHUYEN TIEN THANH CONG!\nTu: ${String(senderID).slice(-6)}...\nDen: ${recipientName || ('...' + String(recipientID).slice(-6))}\nSo tien: ${amount} VNĐ\n💰 So du cua ban: ${sender.balance} VNĐ`);
    return;
  }

  // ===== DIEM DANH =====
  if (lower === '!diemdanh') {
    const u = getUser(senderID);
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    if (now - u.lastCheckin < DAY) {
      const left = Math.ceil((DAY - (now - u.lastCheckin)) / 1000 / 60 / 60);
      reply(`⏳ Ban da diem danh roi, quay lai sau ${left} gio nua. Streak hien tai: ${u.streak} ngay`);
      return;
    }
    // neu miss 1 ngay thi reset streak
    if (u.lastCheckin && now - u.lastCheckin > DAY * 2) u.streak = 0;
    u.streak += 1;
    u.lastCheckin = now;
    const reward = 30000 + u.streak * 5000;
    u.balance += reward;
    saveData();
    reply(`📅 DIEM DANH THANH CONG! Ngay thu ${u.streak}\nNhan: ${reward} VNĐ\n💰 So du: ${u.balance} VNĐ`);
    return;
  }

  // ===== CAU CA / TRONG CAY =====
  if (lower === '!fish' || lower === '!cauca') {
    const cd = checkCooldown(senderID + '_fish', 120);
    if (cd > 0) { reply(`🎣 Cho ${Math.ceil(cd / 60)} phut nua moi cau duoc.`); return; }
    const u = getUser(senderID);
    const r = Math.random();
    let earn = 0, msg = '🎣 Ban da di cau ca...\n';
    if (r < 0.3) { msg += '😢 Khong cau duoc con nao!'; }
    else if (r < 0.8) { earn = 5000 + Math.floor(Math.random() * 10001); msg += `🐟 Cau duoc ca nho! +${earn} VNĐ`; }
    else if (r < 0.95) { earn = 20000 + Math.floor(Math.random() * 30001); msg += `🐠 Cau duoc ca to! +${earn} VNĐ`; }
    else { earn = 100000 + Math.floor(Math.random() * 100001); msg += `✨ CAU DUOC CA VANG! +${earn} VNĐ`; }
    u.balance += earn;
    saveData();
    msg += `\n💰 So du: ${u.balance} VNĐ`;
    reply(msg);
    return;
  }
  if (lower === '!farm' || lower === '!trongcay') {
    const cd = checkCooldown(senderID + '_farm', 180);
    if (cd > 0) { reply(`🌱 Cho ${Math.ceil(cd / 60)} phut nua moi thu hoach duoc.`); return; }
    const u = getUser(senderID);
    const r = Math.random();
    let earn = 0, msg = '🌱 Ban da thu hoach vuon cay...\n';
    if (r < 0.2) { msg += '🥀 Cay bi sau an, mat trang!'; }
    else if (r < 0.75) { earn = 10000 + Math.floor(Math.random() * 20001); msg += `🍚 Thu hoach lua/rau! +${earn} VNĐ`; }
    else { earn = 40000 + Math.floor(Math.random() * 60001); msg += `🍉 Thu hoach duoc qua ngon! +${earn} VNĐ`; }
    u.balance += earn;
    saveData();
    msg += `\n💰 So du: ${u.balance} VNĐ`;
    reply(msg);
    return;
  }

  // ===== QUAY XENG =====
  if (lower.startsWith('!slot')) {
    const cd = checkCooldown(senderID, 5);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nua moi quay duoc.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 2) { reply('Cu phap: !slot <cuoc>\nVd: !slot 10000'); return; }
    const { bet, error } = parseBet(parts, getUser(senderID));
    if (error) { reply(error); return; }
    const u = getUser(senderID);
    u.balance -= bet;
    const syms = ['🍒', '🍋', '🍇', '⭐', '💎', '7️⃣'];
    const spin = [syms[Math.floor(Math.random() * 6)], syms[Math.floor(Math.random() * 6)], syms[Math.floor(Math.random() * 6)]];
    let payout = 0, msg = `🎰 QUAY XENG\n${spin.join(' | ')}\nCuoc: ${bet} VNĐ\n`;
    if (spin[0] === spin[1] && spin[1] === spin[2]) {
      payout = bet * 10;
      msg += `🎉 JACKPOT 3 GIONG NHAU! Nhan ${payout} VNĐ`;
    } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
      payout = bet * 2;
      msg += `😊 Trung 2 o! Nhan ${payout} VNĐ`;
    } else {
      msg += `😢 Khong trung. Mat ${bet} VNĐ`;
    }
    u.balance += payout;
    if (payout > 0) u.wins++; else u.losses++;
    saveData();
    msg += `\n💰 So du: ${u.balance} VNĐ`;
    reply(msg);
    return;
  }

  // ===== XO SO =====
  if (lower.startsWith('!lotto')) {
    const cd = checkCooldown(senderID, 5);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nua moi choi duoc.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 3) { reply('Cu phap: !lotto <so 00-99> <cuoc>\nVd: !lotto 69 10000'); return; }
    const guess = parseInt(parts[1], 10);
    if (isNaN(guess) || guess < 0 || guess > 99) { reply('So phai tu 00 den 99.'); return; }
    const { bet, error } = parseBet(parts, getUser(senderID));
    if (error) { reply(error); return; }
    const u = getUser(senderID);
    u.balance -= bet;
    const draw = Math.floor(Math.random() * 100);
    const win = guess === draw;
    const payout = win ? bet * 50 : 0;
    u.balance += payout;
    if (win) u.wins++; else u.losses++;
    saveData();
    reply(`🎯 XO SO\nBan doan: ${String(guess).padStart(2, '0')} - Cuoc: ${bet} VNĐ\nKet qua: ${String(draw).padStart(2, '0')}\n` +
      (win ? `🎉 TRUNG DOC DAC! Nhan ${payout} VNĐ\n💰 So du: ${u.balance} VNĐ` : `😢 Khong trung. Mat ${bet} VNĐ\n💰 So du: ${u.balance} VNĐ`));
    return;
  }

  // ===== LI XI =====
  if (lower.startsWith('!lixi')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      // Bot li xi mien phi cho nhom
      const amount = 10000 + Math.floor(Math.random() * 20001);
      activeLixi[threadID] = { amount, creatorID: 'bot', expiresAt: Date.now() + 60000 };
      reply(`🧧 BOT LI XI ${amount} VNĐ! Ai nhanh tay go !nhan truoc thi duoc! (het han sau 60s)`);
      return;
    }
    const amount = parseInt(parts[1], 10);
    if (isNaN(amount) || amount <= 0) { reply('So tien li xi phai > 0. Vd: !lixi 50000'); return; }
    const u = getUser(senderID);
    if (amount > u.balance) { reply(`Khong du VNĐ! So du: ${u.balance} VNĐ`); return; }
    if (activeLixi[threadID] && Date.now() < activeLixi[threadID].expiresAt) {
      reply('Da co li xi dang cho, cho nguoi ta nhan xong hoac het han moi tha tiep.');
      return;
    }
    u.balance -= amount;
    activeLixi[threadID] = { amount, creatorID: senderID, expiresAt: Date.now() + 60000 };
    saveData();
    reply(`🧧 Da tha li xi ${amount} VNĐ! Ai nhanh tay go !nhan truoc thi duoc! (het han sau 60s)`);
    return;
  }
  if (lower === '!nhan') {
    const lixi = activeLixi[threadID];
    if (!lixi || Date.now() > lixi.expiresAt) { reply('Khong co li xi nao dang cho.'); return; }
    if (String(lixi.creatorID) === String(senderID)) { reply('Ban la nguoi tha li xi, khong the tu nhan dau!'); return; }
    const u = getUser(senderID);
    u.balance += lixi.amount;
    saveData();
    reply(`🧧 Chuc mung ban nhan duoc li xi ${lixi.amount} VNĐ!\n💰 So du: ${u.balance} VNĐ`);
    delete activeLixi[threadID];
    return;
  }

  // ===== DO VUI / QUIZ =====
  if (lower === '!quiz') {
    if (activeQuiz[threadID] && Date.now() < activeQuiz[threadID].expiresAt) {
      reply('Da co cau hoi dang cho, tra loi dung de nhan thuong nhe!');
      return;
    }
    const q = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
    const reward = 20000;
    activeQuiz[threadID] = { question: q.q, answer: normalize(q.a), reward, expiresAt: Date.now() + 60000 };
    reply(`🧠 DO VUI CO THUONG ${reward} VNĐ!\n${q.q}\nTra loi dung dau tien (go dap an, khong can dau !) se duoc thuong! (60s)`);
    return;
  }
  // Kiem tra tra loi quiz (tin nhan khong co dau !)
  if (activeQuiz[threadID]) {
    const quiz = activeQuiz[threadID];
    if (Date.now() > quiz.expiresAt) {
      delete activeQuiz[threadID];
    } else if (normalize(text) === quiz.answer) {
      const u = getUser(senderID);
      u.balance += quiz.reward;
      saveData();
      reply(`🎉 Chinh xac! Ban nhan duoc ${quiz.reward} VNĐ!\nDap an: ${quiz.answer}\n💰 So du: ${u.balance} VNĐ`);
      delete activeQuiz[threadID];
      return;
    }
  }

  // ===== ADMIN =====
  const getMentionID = () => {
    if (event.mentions && event.mentions.length > 0) return String(event.mentions[0].id);
    const parts = text.split(/\s+/);
    for (const part of parts) if (/^\d{10,}$/.test(part)) return part;
    return null;
  };
  const getMentionName = () => {
    if (event.mentions && event.mentions.length > 0) return event.mentions[0].name || '';
    return '';
  };

  if (lower === '!adminhelp') {
    if (!isSenderAdmin) { reply('Chi admin moi xem duoc lenh nay.'); return; }
    reply('🛡️ LENH ADMIN:\n\n' +
      '• !addadmin @ten - Them admin\n• !deladmin @ten - Xoa admin\n• !admins - Danh sach admin\n' +
      '• !kick @ten - Kick khoi nhom (neu bot la admin nhom)\n' +
      '• !ban @ten / !unban @ten - Cam bot / Go cam\n' +
      '• !mute @ten <phut> / !unmute @ten - Tat tieng tam thoi\n' +
      '• !warn @ten - Canh cao (3 lan = mute 10 phut)\n' +
      '• !give @ten <tien> - Tang tien\n• !reset @ten - Reset tien ve 100.000\n' +
      '• !stats - Thong ke nhom\n• !settitle <ten moi> - Doi ten nhom\n' +
      '• !color <ma mau> - Doi mau nhom (vd: !color #FF0000)\n' +
      '• !emoji <emoji> - Doi emoji nhom');
    return;
  }
  if (lower === '!admins') {
    if (!admins.length) { reply('Chua co admin nao. Hay them admin qua bien ADMIN_IDS tren Botkeep (go !id de lay ID).'); return; }
    reply('🛡️ DANH SACH ADMIN:\n' + admins.map(id => '• ...' + String(id).slice(-6)).join('\n'));
    return;
  }
  if (lower.startsWith('!addadmin')) {
    if (!isSenderAdmin) { reply('Chi admin moi them duoc admin. Admin dau tien phai them qua bien ADMIN_IDS tren Botkeep.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !addadmin @ten'); return; }
    if (isAdmin(target)) { reply('Nguoi nay da la admin roi.'); return; }
    admins.push(String(target));
    saveData();
    reply(`🛡️ Da them admin: ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!deladmin')) {
    if (!isSenderAdmin) { reply('Chi admin moi xoa duoc admin.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !deladmin @ten'); return; }
    admins = admins.filter(id => String(id) !== String(target));
    saveData();
    reply(`Da xoa admin: ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!kick')) {
    if (!isSenderAdmin) { reply('Chi admin moi kick duoc.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !kick @ten'); return; }
    if (String(target) === String(senderID)) { reply('Khong the tu kick chinh minh!'); return; }
    // Thu kick that khoi nhom neu API ho tro, dong thoi ban khoi bot
    getUser(target).banned = true;
    saveData();
    if (api.removeUserFromGroup) {
      api.removeUserFromGroup(threadID, target, (err) => {
        if (err) reply(`Da ban khoi bot: ${getMentionName() || target} (khong kick duoc khoi nhom that: ${err.message || err})`);
        else reply(`👢 Da kick ${getMentionName() || target} khoi nhom!`);
      });
    } else {
      reply(`👢 Da ban ${getMentionName() || target} khoi bot (bot khong co quyen kick that khoi nhom).`);
    }
    return;
  }
  if (lower.startsWith('!ban')) {
    if (!isSenderAdmin) { reply('Chi admin moi ban duoc.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !ban @ten'); return; }
    getUser(target).banned = true;
    saveData();
    reply(`🚫 Da ban ${getMentionName() || ('...' + String(target).slice(-6))} khoi bot.`);
    return;
  }
  if (lower.startsWith('!unban')) {
    if (!isSenderAdmin) { reply('Chi admin moi go ban duoc.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !unban @ten'); return; }
    getUser(target).banned = false;
    saveData();
    reply(`✅ Da go ban ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!mute')) {
    if (!isSenderAdmin) { reply('Chi admin moi mute duoc.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !mute @ten <phut>\nVd: !mute @TenBan 5'); return; }
    const parts = text.split(/\s+/);
    let minutes = 5;
    for (const part of parts) { const n = parseInt(part, 10); if (!isNaN(n) && n > 0 && n < 10080) { minutes = n; break; } }
    getUser(target).mutedUntil = Date.now() + minutes * 60 * 1000;
    saveData();
    reply(`🔇 Da mute ${getMentionName() || ('...' + String(target).slice(-6))} trong ${minutes} phut.`);
    return;
  }
  if (lower.startsWith('!unmute')) {
    if (!isSenderAdmin) { reply('Chi admin moi unmute duoc.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !unmute @ten'); return; }
    getUser(target).mutedUntil = 0;
    saveData();
    reply(`🔊 Da unmute ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!warn')) {
    if (!isSenderAdmin) { reply('Chi admin moi warn duoc.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !warn @ten'); return; }
    const tu = getUser(target);
    tu.warns += 1;
    let msg = `⚠️ Da canh cao ${getMentionName() || ('...' + String(target).slice(-6))} lan ${tu.warns}/3`;
    if (tu.warns >= 3) {
      tu.mutedUntil = Date.now() + 10 * 60 * 1000;
      tu.warns = 0;
      msg += `\n🔇 3 lan canh cao -> mute 10 phut!`;
    }
    saveData();
    reply(msg);
    return;
  }
  if (lower.startsWith('!give')) {
    if (!isSenderAdmin) { reply('Chi admin moi tang tien duoc.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !give @ten <tien>\nVd: !give @TenBan 50000'); return; }
    const parts = text.split(/\s+/);
    let amount = null;
    for (const part of parts) { const n = parseInt(part, 10); if (!isNaN(n) && n > 0) { amount = n; break; } }
    if (!amount) { reply('So tien phai > 0.'); return; }
    getUser(target).balance += amount;
    saveData();
    reply(`🎁 Admin da tang ${amount} VNĐ cho ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!reset')) {
    if (!isSenderAdmin) { reply('Chi admin moi reset duoc.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !reset @ten'); return; }
    getUser(target).balance = START_BALANCE;
    saveData();
    reply(`🔄 Da reset tien cua ${getMentionName() || ('...' + String(target).slice(-6))} ve ${START_BALANCE} VNĐ`);
    return;
  }
  if (lower === '!stats') {
    const totalUsers = Object.keys(users).length;
    const totalMoney = Object.values(users).reduce((s, u) => s + (u.balance || 0), 0);
    const totalWins = Object.values(users).reduce((s, u) => s + (u.wins || 0), 0);
    const totalLosses = Object.values(users).reduce((s, u) => s + (u.losses || 0), 0);
    reply(`📊 THONG KE NHOM:\n• Tong nguoi choi: ${totalUsers}\n• Tong tien luu thong: ${totalMoney} VNĐ\n• Tong van thang: ${totalWins}\n• Tong van thua: ${totalLosses}\n• So admin: ${admins.length}\n• Lich su Tai Xiu: ${taixiuHistory.length} van`);
    return;
  }
  if (lower.startsWith('!settitle')) {
    if (!isSenderAdmin) { reply('Chi admin moi doi ten nhom duoc.'); return; }
    const newTitle = text.slice(10).trim();
    if (!newTitle) { reply('Cu phap: !settitle <ten moi>'); return; }
    if (api.setTitle) {
      api.setTitle(newTitle, threadID, (err) => {
        reply(err ? `Khong doi duoc ten nhom: ${err.message || err}` : `✅ Da doi ten nhom thanh: ${newTitle}`);
      });
    } else {
      reply('Bot khong ho tro doi ten nhom.');
    }
    return;
  }
  if (lower.startsWith('!color')) {
    if (!isSenderAdmin) { reply('Chi admin moi doi mau duoc.'); return; }
    const color = text.slice(6).trim();
    if (!color) { reply('Cu phap: !color <ma mau>\nVd: !color #FF0000'); return; }
    if (api.changeThreadColor) {
      api.changeThreadColor(color, threadID, (err) => {
        reply(err ? `Khong doi duoc mau: ${err.message || err}` : `🎨 Da doi mau nhom thanh ${color}`);
      });
    } else {
      reply('Bot khong ho tro doi mau nhom.');
    }
    return;
  }
  if (lower.startsWith('!emoji')) {
    if (!isSenderAdmin) { reply('Chi admin moi doi emoji duoc.'); return; }
    const emoji = text.slice(6).trim();
    if (!emoji) { reply('Cu phap: !emoji <emoji>\nVd: !emoji 🔥'); return; }
    if (api.changeThreadEmoji) {
      api.changeThreadEmoji(emoji, threadID, (err) => {
        reply(err ? `Khong doi duoc emoji: ${err.message || err}` : `✅ Da doi emoji nhom thanh ${emoji}`);
      });
    } else {
      reply('Bot khong ho tro doi emoji nhom.');
    }
    return;
  }

  // ===== TAI XIU =====
  if (lower.startsWith('!taixiu')) {
    const cd = checkCooldown(senderID, 3);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nua moi choi duoc.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 3) { reply('Cu phap: !taixiu <tai|xiu|so> <cuoc>\nVd: !taixiu tai 10000\nVd: !taixiu 11 100 (doan tong = 11)'); return; }
    const choiceRaw = normalize(parts[1]);
    const { bet, error } = parseBet(parts, getUser(senderID));
    if (error) { reply(error); return; }
    const u = getUser(senderID);
    u.balance -= bet;

    const dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    const sum = dice[0] + dice[1] + dice[2];
    const isTriple = dice[0] === dice[1] && dice[1] === dice[2];
    const result = (sum >= 11 && !isTriple) ? 'tai' : 'xiu';
    taixiuHistory.push({ sum, result, dice });
    if (taixiuHistory.length > 100) taixiuHistory = taixiuHistory.slice(-100);

    let win = false, payout = 0, msg = '';
    if (choiceRaw === 'tai' || choiceRaw === 'xiu') {
      win = (choiceRaw === result);
      payout = win ? bet * 2 : 0;
      msg = `🎲 TAI XIU\nXuc xac: ${dice.join(' - ')} = ${sum} => ${result.toUpperCase()}${isTriple ? ' (BO BAO - tinh XIU)' : ''}\nBan cuoc: ${choiceRaw.toUpperCase()} ${bet} VNĐ\n`;
    } else if (!isNaN(parseInt(choiceRaw, 10))) {
      const guess = parseInt(choiceRaw, 10);
      if (guess < 3 || guess > 18) { u.balance += bet; reply('Tong phai tu 3 den 18. Da hoan VNĐ.'); return; }
      win = (guess === sum);
      payout = win ? bet * 5 : 0;
      msg = `🎲 TAI XIU (doan tong)\nXuc xac: ${dice.join(' - ')} = ${sum}\nBan doan: ${guess} - Cuoc: ${bet} VNĐ\n`;
    } else {
      u.balance += bet;
      reply('Lua chon phai la: tai / xiu / so (3-18). Da hoan VNĐ.');
      return;
    }
    u.balance += payout;
    if (win) u.wins++; else u.losses++;
    saveData();
    msg += win ? `🎉 THANG! Nhan ${payout} VNĐ\n💰 So du: ${u.balance} VNĐ` : `😢 THUA! Mat ${bet} VNĐ\n💰 So du: ${u.balance} VNĐ`;
    reply(msg);
    return;
  }

  // ===== BAU CUA CA TOM =====
  if (lower.startsWith('!baucua')) {
    const BAU_CUA_IMG = path.join(__dirname, 'baucua.jpg');
    const sendWithImage = (msg) => {
      if (fs.existsSync(BAU_CUA_IMG)) {
        api.sendMessage({ body: msg, attachment: fs.createReadStream(BAU_CUA_IMG) }, threadID, (err) => {
          if (err) { console.error('❌ Loi gui anh Bau Cua:', err.message || err); reply(msg); }
        });
      } else {
        reply(msg);
      }
    };
    const cd = checkCooldown(senderID, 3);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nua moi choi duoc.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      sendWithImage('🦀 BAU CUA CA TOM\nCu phap: !baucua <bau|cua|tom|ca|ga|nai> <cuoc>\nVd: !baucua cua 10000\nVd: !baucua tom 200');
      return;
    }
    const choice = normalize(parts[1]);
    const valid = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
    if (!valid.includes(choice)) { reply('Lua chon phai la: bau / cua / tom / ca / ga / nai'); return; }
    const { bet, error } = parseBet(parts, getUser(senderID));
    if (error) { reply(error); return; }
    const u = getUser(senderID);
    u.balance -= bet;

    const faces = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
    const icons = { bau: '🍐 Bau', cua: '🦀 Cua', tom: '🦐 Tom', ca: '🐟 Ca', ga: '🐓 Ga', nai: '🦌 Nai' };
    const dice = [faces[Math.floor(Math.random() * 6)], faces[Math.floor(Math.random() * 6)], faces[Math.floor(Math.random() * 6)]];
    const count = dice.filter(d => d === choice).length;
    const payout = count === 0 ? 0 : bet * (count + 1); // 1 con nhan 2x, 2 con nhan 3x, 3 con nhan 4x
    u.balance += payout;
    if (count > 0) u.wins++; else u.losses++;
    saveData();

    let msg = `🦀 BAU CUA CA TOM\nXuc xac: ${dice.map(d => icons[d]).join(' - ')}\nBan cuoc: ${icons[choice]} ${bet} VNĐ\n`;
    msg += count === 0 ? `😢 Khong trung con nao! Mat ${bet} VNĐ\n💰 So du: ${u.balance} VNĐ`
      : `🎉 Trung ${count} con! Nhan ${payout} VNĐ\n💰 So du: ${u.balance} VNĐ`;
    sendWithImage(msg);
    return;
  }

  // ===== SOI CAU (chi thong ke lich su bot, khong du doan duoc ket qua that) =====
  if (lower === '!soicau' || lower === '!cau' || lower === '!history') {
    if (!taixiuHistory.length) { reply('Chua co lich su van Tai Xiu nao. Cho nguooi choi vai van roi soi nhe!'); return; }
    const last20 = taixiuHistory.slice(-20).reverse();
    const str = last20.map(h => h.result === 'tai' ? 'T' : 'X').join(' ');
    const taiCount = taixiuHistory.filter(h => h.result === 'tai').length;
    const xiuCount = taixiuHistory.length - taiCount;
    const taiPct = Math.round(taiCount / taixiuHistory.length * 100);
    // streak hien tai
    let streak = 1;
    for (let i = taixiuHistory.length - 2; i >= 0; i--) {
      if (taixiuHistory[i].result === taixiuHistory[taixiuHistory.length - 1].result) streak++;
      else break;
    }
    const lastResult = taixiuHistory[taixiuHistory.length - 1].result.toUpperCase();
    reply(`📊 SOI CAU TAI XIU (thong ke van cua bot)\n\n` +
      `20 van gan nhat (moi nhat ben trai):\n${str}\n\n` +
      `Tong ${taixiuHistory.length} van:\n• Tai: ${taiCount} (${taiPct}%)\n• Xiu: ${xiuCount} (${100 - taiPct}%)\n` +
      `Cau hien tai: ${lastResult} x${streak} lien tiep\n\n` +
      `⚠️ Day chi la thong ke lich su ngau nhien cua bot, KHONG du doan duoc ket qua that o ngoai. Dung dung de choi co bac that!`);
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
      // Cho 60s moi thoat de giam so lan thu login lien tuc (do bi Facebook quet)
      console.log('⏳ Cho 60s roi thoat de Botkeep restart lai...');
      setTimeout(() => process.exit(1), 60000);
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
      if (!event) return;

      // Chao mung / tam biet khi co nguoi vao / roi khoi nhom
      if (event.type === 'event') {
        try {
          if (event.logMessageType === 'log:subscribe') {
            const names = (event.addedParticipants || []).map(p => p.name || p.id).join(', ') || 'ban moi';
            api.sendMessage(`👋 Chao mung ${names} da tham gia nhom! Go !help de xem lenh, !daily de nhan tien.`, event.threadID);
          } else if (event.logMessageType === 'log:unsubscribe') {
            api.sendMessage(`👋 Tam biet! Hen gap lai sau nhe!`, event.threadID);
          }
        } catch (e) {}
        return;
      }

      if (event.type !== 'message' || !event.body) return;

      // Bo qua tin nhan cua chinh minh
      if (event.senderID === api.getCurrentUserID()) return;

      console.log(`💬 [${event.threadID}] ${event.senderID}: ${event.body}`);

      // Xu ly lenh bat dau bang ! HOAC tra loi quiz dang cho
      const isCommand = event.body.trim().startsWith('!');
      const hasQuiz = activeQuiz[event.threadID] && Date.now() < activeQuiz[event.threadID].expiresAt;
      if (isCommand || hasQuiz) {
        handleCommand(api, event);
      }
    });

    console.log('🚀 Bot dang lang nghe tin nhan trong nhom + inbox...');
    console.log('💡 Them acc bot vao nhom chat Messenger (thu cong) roi nhan !ping de test.');
  });
}

main();
