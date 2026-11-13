/**
 * BOT MESSENGER NICK CA NHAN (FCA) - VAO NHOM CHAT
 * Node.js + @dongdev/fca-unofficial - Deploy len Botkeep.cloud
 *
 * CANH BAO: Day la API không chinh thuc, vi pham dieu khoan Meta.
 * Chỉ đúng acc phu, không đúng acc chinh. Co the bi khóa / checkpoint.
 *
 * Len h co san (chỉ trả lời khi nhận !):
 *  !help / !menu  - Danh sach lệnh
 *  !hi            - Chao hoi
 *  !ping          - Kiem tra bot
 *  !time / !giờ   - Gio hiện tại
 *  !echo <text>   - Lap lại
 *  !joke          - Chuyển cuoi
 *  !info          - Thông tin bot
 *  --- TRO CHOI TIEN AO VND (giai tri, không đúng tiền that) ---
 *  !balance       - Xem số dư VNĐ
 *  !daily         - Nhận 50.000 VNĐ mỗi ngày
 *  !diemdanh      - Diem danh nhận tiền theo streak
 *  !work          - Lam viec nhận VNĐ (cooldown 60s)
 *  !fish          - Di câu cá (cooldown 120s)
 *  !farm          - Trong cay thu hoach (cooldown 180s)
 *  !bank <tiền> @tên - Chuyển tiền cho người khác
 *  !taixiu <tai|xiu|so> <cược>  - Vd: !taixiu tai 10000
 *  !baucua <bau|của|tom|ca|ga|nai> <cược> - Vd: !baucua của 10000
 *  !slot <cược>   - Quay xeng: !slot 10000
 *  !lotto <so 00-99> <cược> - Xo so: !lotto 69 10000
 *  !lixi <tiền>   - Tha lixi, người khác go !nhận để nhận
 *  !quiz          - Do vui co thưởng (trả lời đúng dau tiền được tiền)
 *  !soicau        - Xem lịch sử + thống kê Tai/Xiu (chỉ thống kê, không đủ đoán được kết quả that)
 *  !top           - Bang xếp hạng dai gia
 *  !level / !rank - Xem cấp độ / xếp hạng cấp độ
 *  !quest         - Nhiem vu hàng ngày
 *  !guess <so>    - Đoán so 1-100
 *  !reaction      - Game phản xạ: ai go !go nhanh nhat được tiền
 *  !trieuphu      - Ai la trieu phu: trả lời 5 câu liên tiếp
 *  --- ADMIN (chỉ admin mới đúng được, go !adminhelp) ---
 *  !addadmin / !deladmin / !admins - Quản lý admin
 *  !kick / !bạn / !unban / !mute / !unmute / !warn - Dieu hanh thành viên
 *  !give / !reset - Tặng / reset tiền
 *  !stats / !settitle / !color / !emoji - Thong ke & tuy chinh nhóm
 *
 * Chong spam / do bi Facebook quet + chay nhé tren goi free Botkeep:
 *  - Chỉ trả lời lệnh co dau !, cooldown moi lệnh, delay ngẫu nhiên giong người
 *  - Không tu nhận trước, không spam tin, gioi han lịch sử, không nang
 */

require('dotenv').config(); // Botkeep ghi bien moi truong vao file .env, phai load file nay
const fs = require('fs');
const path = require('path');
const express = require('express');

// ===== HEALTH CHECK (để Botkeep biet bot con song) =====
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const healthApp = express();
healthApp.get('/', (req, res) => res.send('🤖 Bot nick FCA đang chay!'));
healthApp.listen(PORT, '0.0.0.0', () => console.log(`🌐 Health-check tren port ${PORT}`));

// ===== LAY THONG TIN DANG NHAP =====
function getCredentials() {
  // Cach 1: APPSTATE tu bien moi truong (khuyen đúng tren Botkeep)
  if (process.env.APPSTATE) {
    try {
      let raw = String(process.env.APPSTATE).trim();
      // Fix lỗi hãy gap: Botkeep ghi .env lam hong JSON nhiều dong / co \n \t
      raw = raw.replace(/\\n/g, ' ').replace(/\\t/g, ' ').replace(/\\r/g, ' ');
      // Neu JSON bi escape qua (\" thay vi "), sua lại
      if (raw.includes('\\"')) raw = raw.replace(/\\"/g, '"');
      // Chỉ lay phan tu [ dau tiền đến ] cuoi cung (bo chu thua o ngoai)
      const startIdx = raw.indexOf('[');
      const endIdx = raw.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        raw = raw.slice(startIdx, endIdx + 1);
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) throw new Error('APPSTATE phai la mang JSON, không rong');
      console.log(`🔑 Đăng nhập bang APPSTATE (env) - ${parsed.length} cookies`);
      return { appState: parsed };
    } catch (e) {
      console.error('❌ APPSTATE không phai JSON hop le:', e.message);
      console.error('💡 Hãy dan APPSTATE đang 1 dong duy nhat (compact JSON), bắt đầu bang [ va ket thuc bang ], đúng dan nhiều dong.');
    }
  }

  // Cach 1b: file appstate.json o may (chay local)
  const filePath = path.join(__dirname, 'appstate.json');
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log('🔑 Đăng nhập bang appstate.json');
      return { appState: parsed };
    } catch (e) {
      console.error('❌ appstate.json lỗi:', e.message);
    }
  }

  // Cach 2: Email / mất khau
  if (process.env.FB_EMAIL && process.env.FB_PASSWORD) {
    console.log('🔑 Đăng nhập bang Email/Password');
    const creds = { email: process.env.FB_EMAIL, password: process.env.FB_PASSWORD };
    if (process.env.FB_2FA_SECRET) creds.twofactor = process.env.FB_2FA_SECRET;
    return creds;
  }

  console.error('❌ Chưa co thông tin đăng nhập! Hãy thêm APPSTATE hoặc FB_EMAIL/FB_PASSWORD vao Environment tren Botkeep.');
  process.exit(1);
}

// ===== XU LY LENH =====
const JOKES = [
  '😂 Tai sao lap trinh vien hãy nham Halloween với Giang sinh? Vi OCT 31 == DEC 25!',
  '🤣 Co 10 loai người tren đổi: người hieu nhi phan va người không hieu.',
  '😆 Debug la qua trinh loai bo bug... bang cach thêm bug moi vao!',
  '🙃 Lap trinh vien không chet vi code, ho chet vi... "chỉ sua 1 dong thôi" rồi sua ca ngày!',
];

// ===== HE THONG XU AO + TRO CHOI =====
// Lưu ý: Chỉ đúng tiền ao VNĐ để giai tri trong nhóm, KHONG đúng tiền that, KHONG đúng để chơi co bac that.
const START_BALANCE = 100000; // 100.000 VNĐ
const DAILY_REWARD = 50000; // 50.000 VNĐ
const DATA_FILE = path.join(__dirname, 'data.json');

let users = {}; // senderID -> { balance, lastDaily, lastWork, wins, losses, lastCheckin, streak, banned, mutedUntil, warns }
let taixiuHistory = []; // [{ sum, result: 'tai'|'xiu', dice: [a,b,c] }]
let admins = []; // [senderID, ...] - admin của bot
const cooldowns = {}; // senderID -> timestamp (chong spam)
const activeLixi = {}; // threadID -> { amount, creatorID, expiresAt }
const activeQuiz = {}; // threadID -> { question, answer, reward, expiresAt }
const activeGuess = {}; // senderID -> { number, attempts }
const activeReaction = {}; // threadID -> { state: 'waiting'|'go', goTime, reward }
const activeTrieuphu = {}; // senderID -> { step, questions, earned }

const TRIEUPHU_QUESTIONS = [
  { q: 'Con gi keu meo meo?', a: 'meo' },
  { q: 'Viet Nam thu do la gi?', a: 'ha noi' },
  { q: '1 + 1 = ?', a: '2' },
  { q: 'Con gi co 4 chan va sua moo moo?', a: 'bo' },
  { q: 'Nuoc gi dai nhat the gioi?', a: 'nga' },
  { q: 'Dong tiền Viet Nam goi la gi?', a: 'dong' },
  { q: 'Con gi an chuoi va leo cay?', a: 'khoi' },
  { q: 'So lon nhat co 1 chu so la?', a: '9' },
  { q: 'Con gi co mai cung va bo trong nuoc?', a: 'rua' },
  { q: 'Mau gi la mau của báo la Viet Nam?', a: 'do' },
  { q: 'Con gi bay tren troi va keu o o?', a: 'ga' },
  { q: 'Con gi song duoi nuoc va co 8 chan?', a: 'bach tuoc' },
  { q: 'Mua gi la mua của hoa mai?', a: 'tet' },
  { q: 'Con gi keu u u va thich an co?', a: 'trau' },
  { q: 'Ngày le Quoc khanh Viet Nam la ngày may?', a: '2/9' },
  { q: 'Con gi leo cay va an chuoi dai?', a: 'khoi' },
  { q: 'Hanh tinh gan mất nhat la?', a: 'sao kim' },
  { q: 'Con so dau tiền trong day so tu nhien la?', a: '0' },
  { q: 'Con gi co 2 chan va biet bay?', a: 'chim' },
  { q: 'Nuoc nao co thap Eiffel?', a: 'phap' },
];
const TRIEUPHU_REWARDS = [10000, 20000, 30000, 50000, 100000];
const expCooldowns = {}; // senderID -> timestamp (chong farm EXP)

const QUEST_POOL = [
  { type: 'taixiu', desc: 'Choi 3 ván Tai Xiu', target: 3, reward: 30000 },
  { type: 'baucua', desc: 'Choi 2 ván Bau Cua', target: 2, reward: 30000 },
  { type: 'slot', desc: 'Quay xeng 2 lần', target: 2, reward: 25000 },
  { type: 'fish', desc: 'Di câu cá 1 lần', target: 1, reward: 20000 },
  { type: 'work', desc: 'Lam viec 2 lần', target: 2, reward: 25000 },
  { type: 'bank', desc: 'Chuyển tiền cho người khác 1 lần', target: 1, reward: 20000 },
  { type: 'win', desc: 'Thắng 1 ván bat ky', target: 1, reward: 30000 },
  { type: 'quiz', desc: 'Tra lỗi đúng 1 câu do vui', target: 1, reward: 25000 },
  { type: 'lixi', desc: 'Nhận lì xì 1 lần', target: 1, reward: 20000 },
  { type: 'lotto', desc: 'Choi xo so 1 lần', target: 1, reward: 20000 },
];

const QUIZ_QUESTIONS = [
  { q: 'Con gi keu "meo meo"?', a: 'meo' },
  { q: 'Viet Nam thu do la gi?', a: 'ha noi' },
  { q: 'Mau gi la mau của báo la Viet Nam?', a: 'do' },
  { q: '1 + 1 = ?', a: '2' },
  { q: 'Con gi co 4 chan va sua "moo moo"?', a: 'bo' },
  { q: 'Ngày le Quoc khanh Viet Nam la ngày may?', a: '2/9' },
  { q: 'Con gi bay tren troi va keu "o o"?', a: 'ga' },
  { q: 'Nuoc gi dai nhat the gioi?', a: 'nga' },
  { q: 'Con gi song duoi nuoc va co 8 chan?', a: 'bach tuoc' },
  { q: 'Dong tiền Viet Nam goi la gi?', a: 'dong' },
  { q: 'Con gi an chuoi va leo cay?', a: 'khoi' },
  { q: 'Mua gi la mua của hoa mai?', a: 'tet' },
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
      console.log(`💾 Da load du lieu: ${Object.keys(users).length} người chơi, ${taixiuHistory.length} ván Tai Xiu, ${admins.length} admin`);
    }
  } catch (e) {
    console.log('⚠️ Không load được data.json:', e.message);
  }
}
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users, taixiuHistory: taixiuHistory.slice(-100), admins }, null, 2));
  } catch (e) {
    // Botkeep có thể không ghi được file, bo qua
  }
}
function isAdmin(id) {
  return admins.includes(String(id));
}
loadData();

// Admin co dinh qua bien moi truong ADMIN_IDS (không can go lệnh trong nhóm)
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
    users[id] = { balance: START_BALANCE, lastDaily: 0, lastWork: 0, wins: 0, losses: 0, lastCheckin: 0, streak: 0, banned: false, mutedUntil: 0, warns: 0, exp: 0, level: 1, quests: null };
    saveData();
  }
  // migrate user cu thieu truong moi
  if (users[id].lastCheckin === undefined) users[id].lastCheckin = 0;
  if (users[id].streak === undefined) users[id].streak = 0;
  if (users[id].banned === undefined) users[id].banned = false;
  if (users[id].mutedUntil === undefined) users[id].mutedUntil = 0;
  if (users[id].warns === undefined) users[id].warns = 0;
  if (users[id].exp === undefined) users[id].exp = 0;
  if (users[id].level === undefined) users[id].level = 1;
  if (users[id].quests === undefined) users[id].quests = null;
  return users[id];
}

function addExp(user, amount) {
  user.exp += amount;
  let need = user.level * 100;
  while (user.exp >= need) {
    user.exp -= need;
    user.level += 1;
    const bonus = user.level * 10000;
    user.balance += bonus;
    need = user.level * 100;
    // tra ve thong báo len cấp qua reply o ngoai neu can, o day chỉ cong tiền
    user._levelUpBonus = (user._levelUpBonus || 0) + bonus;
  }
}
function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}
function getQuests(user) {
  const today = todayStr();
  if (!user.quests || user.quests.date !== today) {
    // tao 3 nhiệm vụ ngẫu nhiên mỗi ngày
    const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
    user.quests = {
      date: today,
      list: shuffled.map(q => ({ type: q.type, desc: q.desc, target: q.target, progress: 0, reward: q.reward, done: false }))
    };
    saveData();
  }
  return user.quests.list;
}
function addQuestProgress(user, type, amount = 1) {
  const quests = getQuests(user);
  let rewardMsg = '';
  for (const q of quests) {
    if (q.type === type && !q.done) {
      q.progress += amount;
      if (q.progress >= q.target) {
        q.done = true;
        user.balance += q.reward;
        rewardMsg += `\n📜 Hoan thanh nhiệm vụ "${q.desc}"! +${q.reward} VNĐ`;
      }
    }
  }
  if (rewardMsg) saveData();
  return rewardMsg;
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
  if (bet > user.balance) return { error: `Không du VNĐ! Số dư của bạn: ${user.balance} VNĐ` };
  if (bet > 10000000) return { error: 'Cuoc tối đa 10.000.000 VNĐ/ván.' };
  return { bet };
}

function handleCommand(api, event) {
  const text = (event.body || '').trim();
  const lower = text.toLowerCase();
  const threadID = event.threadID;
  const senderID = event.senderID;

  // Chong spam / giong người: delay ngẫu nhiên 400-1000ms + typing indicator
  const reply = (msg) => {
    const delay = 400 + Math.floor(Math.random() * 601);
    try { if (api.sendTypingIndicator) api.sendTypingIndicator(threadID); } catch (e) {}
    setTimeout(() => {
      api.sendMessage(msg, threadID, (err) => {
        if (err) console.error('❌ Lỗi gửi tin:', err.message || err);
      });
    }, delay);
  };

  // Kiem tra bạn / mute (admin ván đúng được lệnh unban/unmute)
  const senderUser = getUser(senderID);
  const isSenderAdmin = isAdmin(senderID);
  if (senderUser.banned && !isSenderAdmin && lower !== '!unban' && lower !== '!admins') {
    return; // im lang, không trả lời
  }
  if (senderUser.mutedUntil && Date.now() < senderUser.mutedUntil && !isSenderAdmin) {
    return; // đang bi mute thi im lang
  }

  if (lower === '!help' || lower === '!menu' || lower === 'menu') {
    reply('🤖 DANH SACH LENH:\n\n' +
      '• !hi - Chao hoi\n• !ping - Kiem tra bot\n• !time / !giờ - Xem giờ\n' +
      '• !echo <text> - Lap lại\n• !joke - Chuyển cuoi\n• !info - Thông tin bot\n\n' +
      '🎮 TRO CHOI TIEN AO VND (giai tri, không đúng tiền that):\n' +
      '• !balance - Xem số dư\n• !daily - Nhận 50.000 VNĐ mỗi ngày\n• !diemdanh - Diem danh theo streak\n• !work - Lam viec nhận VNĐ\n' +
      '• !fish - Di câu cá\n• !farm - Trong cay thu hoach\n' +
      '• !bank <số tiền> @tên - Chuyển tiền cho người khác\n' +
      '  Vd: !bank 50000 @TenBan\n' +
      '• !taixiu <tai|xiu|so> <cược> - Vd: !taixiu tai 10000\n' +
      '• !baucua <bau|của|tom|ca|ga|nai> <cược> - Vd: !baucua của 10000\n' +
      '• !slot <cược> - Quay xeng, Vd: !slot 10000\n' +
      '• !lotto <so 00-99> <cược> - Xo so, Vd: !lotto 69 10000\n' +
      '• !lixi <tiền> - Tha lixi, người khác go !nhận để nhận\n' +
      '• !quiz - Do vui co thưởng (trả lời đúng dau tiền)\n' +
      '• !soicau - Xem lịch sử Tai/Xiu\n• !top - Dai gia nhat nhóm\n' +
      '• !level - Xem cấp độ của bạn\n• !rank - Xếp hạng cấp độ\n• !quest - Nhiem vu hàng ngày\n• !guess <so> - Đoán so 1-100\n' +
      '• !reaction - Game phản xạ, ai go !go nhanh nhat\n• !trieuphu - Ai la trieu phu 5 câu\n\n' +
      'Bot chỉ trả lời khi co dau ! để tranh spam nhóm.\nAdmin go !adminhelp để xem lệnh quan tri.');
    return;
  }
  if (lower === '!hi' || lower === 'hi' || lower === 'hello') {
    reply('👋 Xin chao! Minh la bot nick FCA. Go !help để xem lệnh nhé!');
    return;
  }
  if (lower === '!id' || lower === '!myid' || lower === '!uid') {
    reply(`🪪 ID của bạn la: ${senderID}\nCopy ID nay dan vao bien ADMIN_IDS tren Botkeep để lam admin vinh vien, không can go lệnh trong nhóm.`);
    return;
  }
  if (lower === '!ping') {
    reply('🏓 Pong! Bot ván online ✅');
    return;
  }
  if (lower === '!time' || lower === '!giờ') {
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    reply(`⏰ Bay giờ la: ${now} (giờ Viet Nam)`);
    return;
  }
  if (lower.startsWith('!echo')) {
    const content = text.slice(5).trim();
    reply(content ? `🔁 Bạn noi: ${content}` : 'Bạn muon mình lặp lại gi? Vd: !echo xin chao');
    return;
  }
  if (lower === '!joke') {
    reply(JOKES[Math.floor(Math.random() * JOKES.length)]);
    return;
  }
  if (lower === '!info') {
    reply('ℹ️ Bot nick FCA v1.1\n• Node.js + FCA unofficial\n• Hosting: Botkeep.cloud\n• Chỉ đúng acc phu!');
    return;
  }

  // ===== TIEN XU AO =====
  if (lower === '!balance' || lower === '!bal' || lower === '!tiền') {
    const u = getUser(senderID);
    reply(`💰 Số dư của bạn: ${u.balance} VNĐ\n🏆 Thắng: ${u.wins} | Thua: ${u.losses}`);
    return;
  }
  if (lower === '!daily') {
    const u = getUser(senderID);
    const now = Date.now();
    if (now - u.lastDaily < 24 * 60 * 60 * 1000) {
      const left = Math.ceil((24 * 60 * 60 * 1000 - (now - u.lastDaily)) / 1000 / 60 / 60);
      reply(`⏳ Bạn đã nhận daily rồi, quay lại sau ${left} giờ nữa.`);
      return;
    }
    u.lastDaily = now;
    u.balance += DAILY_REWARD;
    saveData();
    reply(`🎁 Nhận daily thành công! +${DAILY_REWARD} VNĐ\n💰 Số dư hiện tại: ${u.balance} VNĐ`);
    return;
  }
  if (lower === '!work') {
    const u = getUser(senderID);
    const cd = checkCooldown(senderID + '_work', 60);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa moi làm việc được.`); return; }
    const earn = 5000 + Math.floor(Math.random() * 15001); // 5.000 - 20.000 VNĐ
    u.balance += earn;
    addExp(u, 5);
    let qmsg6 = addQuestProgress(u, 'work', 1);
    saveData();
    reply(`💼 Bạn da làm việc va nhận được ${earn} VNĐ!\n💰 Số dư: ${u.balance} VNĐ`);
    return;
  }
  if (lower === '!top') {
    const sorted = Object.entries(users).sort((a, b) => b[1].balance - a[1].balance).slice(0, 10);
    if (!sorted.length) { reply('Chưa co ai chơi. Go !daily để nhận VNĐ dau tiền!'); return; }
    let msg = '🏆 BANG XEP HANG DAI GIA:\n\n';
    sorted.forEach(([id, u], i) => { msg += `${i + 1}. ${id.slice(-6)}... - ${u.balance} VNĐ\n`; });
    reply(msg);
    return;
  }

  // ===== BANK / CHUYEN TIEN =====
  if (lower.startsWith('!bank') || lower.startsWith('!chuyển') || lower.startsWith('!pay') || lower.startsWith('!transfer')) {
    const cd = checkCooldown(senderID + '_bank', 5);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa moi chuyển được.`); return; }
    const parts = text.split(/\s+/);

    // Lay người nhận: uu tiền mention, sau do đến ID so trong tin nhắn
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

    // Lay số tiền: so dau tiền trong parts sau lệnh
    let amount = null;
    for (let i = 1; i < parts.length; i++) {
      const n = parseInt(parts[i], 10);
      if (!isNaN(n) && n > 0 && String(n) === parts[i].replace(/,/g, '')) { amount = n; break; }
      if (!isNaN(n) && n > 0) { amount = n; break; }
    }

    if (!recipientID) {
      reply('Cu phap: !bank <số tiền> @tên\nVd: !bank 50000 @TenBan\n(Hãy @ tên người nhận trong tin nhắn)');
      return;
    }
    if (!amount || amount <= 0) {
      reply('So tiền chuyển phai > 0. Vd: !bank 50000 @TenBan');
      return;
    }
    if (recipientID === String(senderID)) {
      reply('Không the tu chuyển tiền cho chính mình dau!');
      return;
    }
    const sender = getUser(senderID);
    if (amount > sender.balance) {
      reply(`Không du VNĐ! Số dư của bạn: ${sender.balance} VNĐ`);
      return;
    }
    if (amount > 10000000) {
      reply('Moi lần chuyển tối đa 10.000.000 VNĐ.');
      return;
    }
    const receiver = getUser(recipientID);
    sender.balance -= amount;
    receiver.balance += amount;
    addExp(sender, 5);
    let qmsg7 = addQuestProgress(sender, 'bank', 1);
    saveData();
    reply(`💸 CHUYỂN TIỀN THÀNH CÔNG!\nTu: ${String(senderID).slice(-6)}...\nDen: ${recipientName || ('...' + String(recipientID).slice(-6))}\nSo tiền: ${amount} VNĐ\n💰 Số dư của bạn: ${sender.balance} VNĐ`);
    return;
  }

  // ===== DIEM DANH =====
  if (lower === '!diemdanh') {
    const u = getUser(senderID);
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    if (now - u.lastCheckin < DAY) {
      const left = Math.ceil((DAY - (now - u.lastCheckin)) / 1000 / 60 / 60);
      reply(`⏳ Bạn da điểm danh rồi, quay lại sau ${left} giờ nữa. Streak hiện tại: ${u.streak} ngày`);
      return;
    }
    // neu miss 1 ngày thi reset streak
    if (u.lastCheckin && now - u.lastCheckin > DAY * 2) u.streak = 0;
    u.streak += 1;
    u.lastCheckin = now;
    const reward = 30000 + u.streak * 5000;
    u.balance += reward;
    saveData();
    reply(`📅 ĐIỂM DANH THÀNH CÔNG! Ngày thu ${u.streak}\nNhan: ${reward} VNĐ\n💰 Số dư: ${u.balance} VNĐ`);
    return;
  }

  // ===== CAU CA / TRONG CAY =====
  if (lower === '!fish' || lower === '!cauca') {
    const cd = checkCooldown(senderID + '_fish', 120);
    if (cd > 0) { reply(`🎣 Cho ${Math.ceil(cd / 60)} phút nữa moi câu được.`); return; }
    const u = getUser(senderID);
    const r = Math.random();
    let earn = 0, msg = '🎣 Bạn da di câu cá...\n';
    if (r < 0.3) { msg += '😢 Không câu được con nao!'; }
    else if (r < 0.8) { earn = 5000 + Math.floor(Math.random() * 10001); msg += `🐟 Cau được ca nho! +${earn} VNĐ`; }
    else if (r < 0.95) { earn = 20000 + Math.floor(Math.random() * 30001); msg += `🐠 Cau được ca to! +${earn} VNĐ`; }
    else { earn = 100000 + Math.floor(Math.random() * 100001); msg += `✨ CAU DUOC CA VANG! +${earn} VNĐ`; }
    u.balance += earn;
    addExp(u, 5);
    let qmsg5 = addQuestProgress(u, 'fish', 1);
    saveData();
    msg += `\n💰 Số dư: ${u.balance} VNĐ`;
    reply(msg);
    return;
  }
  if (lower === '!farm' || lower === '!trongcay') {
    const cd = checkCooldown(senderID + '_farm', 180);
    if (cd > 0) { reply(`🌱 Cho ${Math.ceil(cd / 60)} phút nữa moi thu hoach được.`); return; }
    const u = getUser(senderID);
    const r = Math.random();
    let earn = 0, msg = '🌱 Bạn da thu hoach vuon cay...\n';
    if (r < 0.2) { msg += '🥀 Cay bi sau an, mất trang!'; }
    else if (r < 0.75) { earn = 10000 + Math.floor(Math.random() * 20001); msg += `🍚 Thu hoach lua/rau! +${earn} VNĐ`; }
    else { earn = 40000 + Math.floor(Math.random() * 60001); msg += `🍉 Thu hoach được qua ngon! +${earn} VNĐ`; }
    u.balance += earn;
    saveData();
    msg += `\n💰 Số dư: ${u.balance} VNĐ`;
    reply(msg);
    return;
  }

  // ===== QUAY XENG =====
  if (lower.startsWith('!slot')) {
    const cd = checkCooldown(senderID, 5);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa moi quay được.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 2) { reply('Cu phap: !slot <cược>\nVd: !slot 10000'); return; }
    const { bet, error } = parseBet(parts, getUser(senderID));
    if (error) { reply(error); return; }
    const u = getUser(senderID);
    u.balance -= bet;
    const syms = ['🍒', '🍋', '🍇', '⭐', '💎', '7️⃣'];
    const spin = [syms[Math.floor(Math.random() * 6)], syms[Math.floor(Math.random() * 6)], syms[Math.floor(Math.random() * 6)]];
    let payout = 0, msg = `🎰 QUAY XENG\n${spin.join(' | ')}\nCuoc: ${bet} VNĐ\n`;
    if (spin[0] === spin[1] && spin[1] === spin[2]) {
      payout = bet * 10;
      msg += `🎉 JACKPOT 3 GIONG NHAU! Nhận ${payout} VNĐ`;
    } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
      payout = bet * 2;
      msg += `😊 Trúng 2 o! Nhận ${payout} VNĐ`;
    } else {
      msg += `😢 Không trúng. Mat ${bet} VNĐ`;
    }
    u.balance += payout;
    if (payout > 0) u.wins++; else u.losses++;
    addExp(u, payout > 0 ? 10 : 2);
    let qmsg3 = addQuestProgress(u, 'slot', 1);
    if (payout > 0) qmsg3 += addQuestProgress(u, 'win', 1);
    saveData();
    msg += `\n💰 Số dư: ${u.balance} VNĐ`;
    reply(msg);
    return;
  }

  // ===== XO SO =====
  if (lower.startsWith('!lotto')) {
    const cd = checkCooldown(senderID, 5);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa moi chơi được.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 3) { reply('Cu phap: !lotto <so 00-99> <cược>\nVd: !lotto 69 10000'); return; }
    const guess = parseInt(parts[1], 10);
    if (isNaN(guess) || guess < 0 || guess > 99) { reply('So phai tu 00 đến 99.'); return; }
    const { bet, error } = parseBet(parts, getUser(senderID));
    if (error) { reply(error); return; }
    const u = getUser(senderID);
    u.balance -= bet;
    const draw = Math.floor(Math.random() * 100);
    const win = guess === draw;
    const payout = win ? bet * 50 : 0;
    u.balance += payout;
    if (win) u.wins++; else u.losses++;
    addExp(u, win ? 15 : 2);
    let qmsg4 = addQuestProgress(u, 'lotto', 1);
    if (win) qmsg4 += addQuestProgress(u, 'win', 1);
    saveData();
    reply(`🎯 XO SO\nBan đoán: ${String(guess).padStart(2, '0')} - Cuoc: ${bet} VNĐ\nKet qua: ${String(draw).padStart(2, '0')}\n` +
      (win ? `🎉 TRUNG DOC DAC! Nhận ${payout} VNĐ\n💰 Số dư: ${u.balance} VNĐ` : `😢 Không trúng. Mat ${bet} VNĐ\n💰 Số dư: ${u.balance} VNĐ`));
    return;
  }

  // ===== LI XI =====
  if (lower.startsWith('!lixi')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      // Bot lì xì mien phi cho nhóm
      const amount = 10000 + Math.floor(Math.random() * 20001);
      activeLixi[threadID] = { amount, creatorID: 'bot', expiresAt: Date.now() + 60000 };
      reply(`🧧 BOT LI XI ${amount} VNĐ! Ai nhanh tay go !nhận trước thi được! (hết hạn sau 60s)`);
      return;
    }
    const amount = parseInt(parts[1], 10);
    if (isNaN(amount) || amount <= 0) { reply('So tiền lì xì phai > 0. Vd: !lixi 50000'); return; }
    const u = getUser(senderID);
    if (amount > u.balance) { reply(`Không du VNĐ! Số dư: ${u.balance} VNĐ`); return; }
    if (activeLixi[threadID] && Date.now() < activeLixi[threadID].expiresAt) {
      reply('Da co lì xì đang cho, cho người ta nhận xong hoặc hết hạn moi tha tiếp.');
      return;
    }
    u.balance -= amount;
    activeLixi[threadID] = { amount, creatorID: senderID, expiresAt: Date.now() + 60000 };
    saveData();
    reply(`🧧 Da tha lì xì ${amount} VNĐ! Ai nhanh tay go !nhận trước thi được! (hết hạn sau 60s)`);
    return;
  }
  if (lower === '!nhận') {
    const lixi = activeLixi[threadID];
    if (!lixi || Date.now() > lixi.expiresAt) { reply('Không co lì xì nao đang cho.'); return; }
    if (String(lixi.creatorID) === String(senderID)) { reply('Bạn la người tha lì xì, không the tu nhận dau!'); return; }
    const u = getUser(senderID);
    u.balance += lixi.amount;
    addExp(u, 5);
    let qmsg9 = addQuestProgress(u, 'lixi', 1);
    saveData();
    reply(`🧧 Chúc mừng bạn nhận được lì xì ${lixi.amount} VNĐ!\n💰 Số dư: ${u.balance} VNĐ`);
    delete activeLixi[threadID];
    return;
  }

  // ===== DO VUI / QUIZ =====
  if (lower === '!quiz') {
    if (activeQuiz[threadID] && Date.now() < activeQuiz[threadID].expiresAt) {
      reply('Da co câu hỏi đang cho, trả lời đúng để nhận thưởng nhé!');
      return;
    }
    const q = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
    const reward = 20000;
    activeQuiz[threadID] = { question: q.q, answer: normalize(q.a), reward, expiresAt: Date.now() + 60000 };
    reply(`🧠 DO VUI CO THUONG ${reward} VNĐ!\n${q.q}\nTra lỗi đúng dau tiền (go đáp án, không can dau !) se được thưởng! (60s)`);
    return;
  }
  // Kiem tra trả lời quiz (tin nhắn không co dau !)
  if (activeQuiz[threadID]) {
    const quiz = activeQuiz[threadID];
    if (Date.now() > quiz.expiresAt) {
      delete activeQuiz[threadID];
    } else if (normalize(text) === quiz.answer) {
      const u = getUser(senderID);
      u.balance += quiz.reward;
      addExp(u, 10);
      let qmsg8 = addQuestProgress(u, 'quiz', 1);
      qmsg8 += addQuestProgress(u, 'win', 1);
      saveData();
      reply(`🎉 Chinh xac! Bạn nhận được ${quiz.reward} VNĐ!\nDap an: ${quiz.answer}\n💰 Số dư: ${u.balance} VNĐ`);
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
    if (!isSenderAdmin) { reply('Chỉ admin mới xem được lệnh nay.'); return; }
    reply('🛡️ LENH ADMIN:\n\n' +
      '• !addadmin @tên - Thêm admin\n• !deladmin @tên - Xóa admin\n• !admins - Danh sach admin\n' +
      '• !kick @tên - Kick khoi nhóm (neu bot la admin nhóm)\n' +
      '• !bạn @tên / !unban @tên - Cấm bot / Go cấm\n' +
      '• !mute @tên <phút> / !unmute @tên - Tắt tiếng tam thôi\n' +
      '• !warn @tên - Canh cao (3 lần = mute 10 phút)\n' +
      '• !give @tên <tiền> - Tặng tiền\n• !reset @tên - Reset tiền ve 100.000\n' +
      '• !stats - Thong ke nhóm\n• !settitle <tên moi> - Doi tên nhóm\n' +
      '• !color <ma mau> - Doi mau nhóm (vd: !color #FF0000)\n' +
      '• !emoji <emoji> - Doi emoji nhóm');
    return;
  }
  if (lower === '!admins') {
    if (!admins.length) { reply('Chưa co admin nao. Hãy thêm admin qua bien ADMIN_IDS tren Botkeep (go !id để lay ID).'); return; }
    reply('🛡️ DANH SACH ADMIN:\n' + admins.map(id => '• ...' + String(id).slice(-6)).join('\n'));
    return;
  }
  if (lower.startsWith('!addadmin')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới thêm được admin. Admin dau tiền phai thêm qua bien ADMIN_IDS tren Botkeep.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !addadmin @tên'); return; }
    if (isAdmin(target)) { reply('Người nay da la admin rồi.'); return; }
    admins.push(String(target));
    saveData();
    reply(`🛡️ Da thêm admin: ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!deladmin')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới xóa được admin.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !deladmin @tên'); return; }
    admins = admins.filter(id => String(id) !== String(target));
    saveData();
    reply(`Da xóa admin: ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!kick')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới kick được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !kick @tên'); return; }
    if (String(target) === String(senderID)) { reply('Không the tu kick chính mình!'); return; }
    // Thu kick that khoi nhóm neu API ho tro, dong thôi bạn khoi bot
    getUser(target).banned = true;
    saveData();
    if (api.removeUserFromGroup) {
      api.removeUserFromGroup(threadID, target, (err) => {
        if (err) reply(`Da bạn khoi bot: ${getMentionName() || target} (không kick được khoi nhóm that: ${err.message || err})`);
        else reply(`👢 Da kick ${getMentionName() || target} khoi nhóm!`);
      });
    } else {
      reply(`👢 Da bạn ${getMentionName() || target} khoi bot (bot không co quyen kick that khoi nhóm).`);
    }
    return;
  }
  if (lower.startsWith('!bạn')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới bạn được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !bạn @tên'); return; }
    getUser(target).banned = true;
    saveData();
    reply(`🚫 Da bạn ${getMentionName() || ('...' + String(target).slice(-6))} khoi bot.`);
    return;
  }
  if (lower.startsWith('!unban')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới go bạn được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !unban @tên'); return; }
    getUser(target).banned = false;
    saveData();
    reply(`✅ Da go bạn ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!mute')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới mute được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !mute @tên <phút>\nVd: !mute @TenBan 5'); return; }
    const parts = text.split(/\s+/);
    let minutes = 5;
    for (const part of parts) { const n = parseInt(part, 10); if (!isNaN(n) && n > 0 && n < 10080) { minutes = n; break; } }
    getUser(target).mutedUntil = Date.now() + minutes * 60 * 1000;
    saveData();
    reply(`🔇 Da mute ${getMentionName() || ('...' + String(target).slice(-6))} trong ${minutes} phút.`);
    return;
  }
  if (lower.startsWith('!unmute')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới unmute được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !unmute @tên'); return; }
    getUser(target).mutedUntil = 0;
    saveData();
    reply(`🔊 Da unmute ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!warn')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới warn được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !warn @tên'); return; }
    const tu = getUser(target);
    tu.warns += 1;
    let msg = `⚠️ Da canh cao ${getMentionName() || ('...' + String(target).slice(-6))} lần ${tu.warns}/3`;
    if (tu.warns >= 3) {
      tu.mutedUntil = Date.now() + 10 * 60 * 1000;
      tu.warns = 0;
      msg += `\n🔇 3 lần canh cao -> mute 10 phút!`;
    }
    saveData();
    reply(msg);
    return;
  }
  if (lower.startsWith('!give')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới tặng tiền được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !give @tên <tiền>\nVd: !give @TenBan 50000'); return; }
    const parts = text.split(/\s+/);
    let amount = null;
    for (const part of parts) { const n = parseInt(part, 10); if (!isNaN(n) && n > 0) { amount = n; break; } }
    if (!amount) { reply('So tiền phai > 0.'); return; }
    getUser(target).balance += amount;
    saveData();
    reply(`🎁 Admin da tặng ${amount} VNĐ cho ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!reset')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới reset được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cu phap: !reset @tên'); return; }
    getUser(target).balance = START_BALANCE;
    saveData();
    reply(`🔄 Da reset tiền của ${getMentionName() || ('...' + String(target).slice(-6))} ve ${START_BALANCE} VNĐ`);
    return;
  }
  if (lower === '!stats') {
    const totalUsers = Object.keys(users).length;
    const totalMoney = Object.values(users).reduce((s, u) => s + (u.balance || 0), 0);
    const totalWins = Object.values(users).reduce((s, u) => s + (u.wins || 0), 0);
    const totalLosses = Object.values(users).reduce((s, u) => s + (u.losses || 0), 0);
    reply(`📊 THONG KE NHOM:\n• Tổng người chơi: ${totalUsers}\n• Tổng tiền luu thong: ${totalMoney} VNĐ\n• Tổng ván thắng: ${totalWins}\n• Tổng ván thua: ${totalLosses}\n• So admin: ${admins.length}\n• Lich su Tai Xiu: ${taixiuHistory.length} ván`);
    return;
  }
  if (lower.startsWith('!settitle')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới đổi tên nhóm được.'); return; }
    const newTitle = text.slice(10).trim();
    if (!newTitle) { reply('Cu phap: !settitle <tên moi>'); return; }
    if (api.setTitle) {
      api.setTitle(newTitle, threadID, (err) => {
        reply(err ? `Không đổi được tên nhóm: ${err.message || err}` : `✅ Da đổi tên nhóm thanh: ${newTitle}`);
      });
    } else {
      reply('Bot không ho tro đổi tên nhóm.');
    }
    return;
  }
  if (lower.startsWith('!color')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới đổi mau được.'); return; }
    const color = text.slice(6).trim();
    if (!color) { reply('Cu phap: !color <ma mau>\nVd: !color #FF0000'); return; }
    if (api.changeThreadColor) {
      api.changeThreadColor(color, threadID, (err) => {
        reply(err ? `Không đổi được mau: ${err.message || err}` : `🎨 Da đổi mau nhóm thanh ${color}`);
      });
    } else {
      reply('Bot không ho tro đổi mau nhóm.');
    }
    return;
  }
  if (lower.startsWith('!emoji')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới đổi emoji được.'); return; }
    const emoji = text.slice(6).trim();
    if (!emoji) { reply('Cu phap: !emoji <emoji>\nVd: !emoji 🔥'); return; }
    if (api.changeThreadEmoji) {
      api.changeThreadEmoji(emoji, threadID, (err) => {
        reply(err ? `Không đổi được emoji: ${err.message || err}` : `✅ Da đổi emoji nhóm thanh ${emoji}`);
      });
    } else {
      reply('Bot không ho tro đổi emoji nhóm.');
    }
    return;
  }

  // ===== LEVEL / EXP =====
  if (lower === '!level') {
    const u = getUser(senderID);
    const need = u.level * 100;
    reply(`⭐ CẤP ĐỘ CỦA BẠN:\nCap: ${u.level}\nEXP: ${u.exp}/${need}\n💰 Số dư: ${u.balance} VNĐ\nLen cấp se nhận thưởng: cấp * 10.000 VNĐ\nChat nhiều va chơi game để nhận EXP!`);
    return;
  }
  if (lower === '!rank') {
    const sorted = Object.entries(users).sort((a, b) => (b[1].level - a[1].level) || (b[1].exp - a[1].exp)).slice(0, 10);
    if (!sorted.length) { reply('Chưa co ai co cấp độ.'); return; }
    let msg = '⭐ BANG XEP HANG CAP DO:\n\n';
    sorted.forEach(([id, u], i) => { msg += `${i + 1}. ...${String(id).slice(-6)} - Cấp ${u.level} (${u.exp} EXP)\n`; });
    reply(msg);
    return;
  }

  // ===== NHIEM VU HANG NGAY =====
  if (lower === '!quest') {
    const u = getUser(senderID);
    const quests = getQuests(u);
    let msg = '📜 NHIEM VU HOM NAY:\n\n';
    quests.forEach((q, i) => {
      msg += `${q.done ? '✅' : '⬜'} ${i + 1}. ${q.desc} (${q.progress}/${q.target}) - ${q.reward} VNĐ\n`;
    });
    msg += '\nLam nhiệm vụ để nhận tiền! Nhiem vu moi mỗi ngày.';
    reply(msg);
    return;
  }

  // ===== DOAN SO =====
  if (lower.startsWith('!guess')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      if (activeGuess[senderID]) {
        reply(`🎯 Bạn đang đoán so 1-100. Da đoán ${activeGuess[senderID].attempts} lần. Go !guess <so> để đoán tiếp!`);
      } else {
        activeGuess[senderID] = { number: 1 + Math.floor(Math.random() * 100), attempts: 0 };
        reply('🎯 BAT DAU DOAN SO!\nMinh vua nghi 1 so tu 1 đến 100.\nGo !guess <so> để đoán, vi du: !guess 50');
      }
      return;
    }
    const guess = parseInt(parts[1], 10);
    if (isNaN(guess) || guess < 1 || guess > 100) { reply('So phai tu 1 đến 100.'); return; }
    if (!activeGuess[senderID]) {
      activeGuess[senderID] = { number: 1 + Math.floor(Math.random() * 100), attempts: 0 };
      reply('🎯 Bắt đầu ván moi! Minh vua nghi 1 so tu 1 đến 100. Go !guess <so> để đoán!');
      return;
    }
    const game = activeGuess[senderID];
    game.attempts += 1;
    if (guess === game.number) {
      const reward = Math.max(10000, 50000 - game.attempts * 5000);
      const u = getUser(senderID);
      u.balance += reward;
      addExp(u, 20);
      const qmsg = addQuestProgress(u, 'win', 1);
      saveData();
      reply(`🎉 ĐOÁN ĐÚNG SỐ ${game.number} SAU ${game.attempts} LAN DOAN!\nNhan: ${reward} VNĐ + 20 EXP${qmsg}\n💰 Số dư: ${u.balance} VNĐ`);
      delete activeGuess[senderID];
    } else if (guess < game.number) {
      reply(`⬆️ So bạn đoán nhỏ hơn! Da đoán ${game.attempts} lần. Đoán tiếp di!`);
    } else {
      reply(`⬇️ So bạn đoán lớn hơn! Da đoán ${game.attempts} lần. Đoán tiếp di!`);
    }
    return;
  }

  // ===== GAME PHAN XA =====
  if (lower === '!reaction') {
    if (activeReaction[threadID] && Date.now() < activeReaction[threadID].expiresAt) {
      reply('Da co ván phản xạ đang cho, cho ván nay xong nhé!');
      return;
    }
    activeReaction[threadID] = { state: 'waiting', goTime: 0, expiresAt: Date.now() + 15000 };
    reply('⚡ GAME PHAN XA!\nSan sang chưa? Chờ xíu...\nKhi thay chu GO thi go !go that nhanh!');
    const waitMs = 3000 + Math.floor(Math.random() * 4000); // 3-7s
    setTimeout(() => {
      if (!activeReaction[threadID] || activeReaction[threadID].state !== 'waiting') return;
      activeReaction[threadID].state = 'go';
      activeReaction[threadID].goTime = Date.now();
      activeReaction[threadID].expiresAt = Date.now() + 10000;
      api.sendMessage('🚦 GO! Go !go nhanh lên!', threadID);
    }, waitMs);
    return;
  }
  if (lower === '!go') {
    const game = activeReaction[threadID];
    if (!game) { reply('Chưa co ván phản xạ nao. Go !reaction để bắt đầu!'); return; }
    if (game.state === 'waiting') {
      reply('⏳ Chưa GO ma! Bạn go quá nhanh, bị loại ván nay!');
      delete activeReaction[threadID];
      return;
    }
    if (Date.now() > game.expiresAt) {
      reply('Het han! Không ai phản xạ kip.');
      delete activeReaction[threadID];
      return;
    }
    const ms = Date.now() - game.goTime;
    let reward = 5000;
    if (ms < 1000) reward = 30000;
    else if (ms < 2000) reward = 20000;
    else if (ms < 3000) reward = 10000;
    const u = getUser(senderID);
    u.balance += reward;
    addExp(u, 10);
    saveData();
    reply(`⚡ ${String(senderID).slice(-6)}... phản xạ trong ${(ms / 1000).toFixed(2)}s! Nhận ${reward} VNĐ\n💰 Số dư: ${u.balance} VNĐ`);
    delete activeReaction[threadID];
    return;
  }

  // ===== AI LA TRIEU PHU =====
  if (lower === '!trieuphu') {
    if (activeTrieuphu[senderID]) {
      const g = activeTrieuphu[senderID];
      reply(`🎓 Bạn đang chơi Trieu Phu o câu ${g.step + 1}/5.\nCau hoi: ${g.questions[g.step].q}\nTra lỗi đúng (go đáp án, không can dau !) để qua câu!`);
      return;
    }
    const shuffled = [...TRIEUPHU_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
    activeTrieuphu[senderID] = { step: 0, questions: shuffled, earned: 0 };
    reply(`🎓 AI LA TRIEU PHU!\nTra lỗi đúng 5 câu liên tiếp để nhận tổng ${TRIEUPHU_REWARDS.reduce((a, b) => a + b, 0)} VNĐ!\n\nCau 1/5 (${TRIEUPHU_REWARDS[0]} VNĐ): ${shuffled[0].q}\nTra lỗi đúng (go đáp án) để qua câu!`);
    return;
  }
  // Kiem tra trả lời Trieu Phu (tin nhắn không co dau !)
  if (activeTrieuphu[senderID]) {
    const g = activeTrieuphu[senderID];
    const current = g.questions[g.step];
    if (normalize(text) === normalize(current.a)) {
      const reward = TRIEUPHU_REWARDS[g.step];
      g.earned += reward;
      const u = getUser(senderID);
      u.balance += reward;
      addExp(u, 10);
      g.step += 1;
      saveData();
      if (g.step >= 5) {
        reply(`🎉 CHÚC MỪNG BẠN LÀ TRIỆU PHÚ!\nBan da trả lời đúng 5/5 câu!\nTong nhận: ${g.earned} VNĐ\n💰 Số dư: ${u.balance} VNĐ`);
        delete activeTrieuphu[senderID];
      } else {
        reply(`✅ Đúng rồi! +${reward} VNĐ (tổng đã nhận: ${g.earned} VNĐ)\n\nCau ${g.step + 1}/5 (${TRIEUPHU_REWARDS[g.step]} VNĐ): ${g.questions[g.step].q}`);
      }
      return;
    } else {
      const u = getUser(senderID);
      reply(`❌ Sai rồi! Đáp án la: ${current.a}\nBan đúng o câu ${g.step + 1}/5, đã nhận được ${g.earned} VNĐ. Go !trieuphu để chơi lại!`);
      delete activeTrieuphu[senderID];
      return;
    }
  }

  // ===== TÀI XỈU =====
  if (lower.startsWith('!taixiu')) {
    const cd = checkCooldown(senderID, 3);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa moi chơi được.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 3) { reply('Cu phap: !taixiu <tai|xiu|so> <cược>\nVd: !taixiu tai 10000\nVd: !taixiu 11 100 (đoán tổng = 11)'); return; }
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
      msg = `🎲 TÀI XỈU\nXuc xac: ${dice.join(' - ')} = ${sum} => ${result.toUpperCase()}${isTriple ? ' (BO BAO - tinh XIU)' : ''}\nBan cược: ${choiceRaw.toUpperCase()} ${bet} VNĐ\n`;
    } else if (!isNaN(parseInt(choiceRaw, 10))) {
      const guess = parseInt(choiceRaw, 10);
      if (guess < 3 || guess > 18) { u.balance += bet; reply('Tổng phai tu 3 đến 18. Da hoan VNĐ.'); return; }
      win = (guess === sum);
      payout = win ? bet * 5 : 0;
      msg = `🎲 TÀI XỈU (đoán tổng)\nXuc xac: ${dice.join(' - ')} = ${sum}\nBan đoán: ${guess} - Cuoc: ${bet} VNĐ\n`;
    } else {
      u.balance += bet;
      reply('Lua chon phai la: tai / xiu / so (3-18). Da hoan VNĐ.');
      return;
    }
    u.balance += payout;
    if (win) u.wins++; else u.losses++;
    addExp(u, win ? 10 : 2);
    let qmsg = addQuestProgress(u, 'taixiu', 1);
    if (win) qmsg += addQuestProgress(u, 'win', 1);
    saveData();
    msg += win ? `🎉 THANG! Nhận ${payout} VNĐ\n💰 Số dư: ${u.balance} VNĐ` : `😢 THUA! Mat ${bet} VNĐ\n💰 Số dư: ${u.balance} VNĐ`;
    reply(msg);
    return;
  }

  // ===== BẦU CUA CÁ TÔM =====
  if (lower.startsWith('!baucua')) {
    const BAU_CUA_IMG = path.join(__dirname, 'baucua.jpg');
    const sendWithImage = (msg) => {
      if (fs.existsSync(BAU_CUA_IMG)) {
        api.sendMessage({ body: msg, attachment: fs.createReadStream(BAU_CUA_IMG) }, threadID, (err) => {
          if (err) { console.error('❌ Lỗi gửi anh Bau Cua:', err.message || err); reply(msg); }
        });
      } else {
        reply(msg);
      }
    };
    const cd = checkCooldown(senderID, 3);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa moi chơi được.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      sendWithImage('🦀 BẦU CUA CÁ TÔM\nCu phap: !baucua <bau|của|tom|ca|ga|nai> <cược>\nVd: !baucua của 10000\nVd: !baucua tom 200');
      return;
    }
    const choice = normalize(parts[1]);
    const valid = ['bau', 'của', 'tom', 'ca', 'ga', 'nai'];
    if (!valid.includes(choice)) { reply('Lua chon phai la: bau / của / tom / ca / ga / nai'); return; }
    const { bet, error } = parseBet(parts, getUser(senderID));
    if (error) { reply(error); return; }
    const u = getUser(senderID);
    u.balance -= bet;

    const faces = ['bau', 'của', 'tom', 'ca', 'ga', 'nai'];
    const icons = { bau: '🍐 Bau', của: '🦀 Cua', tom: '🦐 Tom', ca: '🐟 Ca', ga: '🐓 Ga', nai: '🦌 Nai' };
    const dice = [faces[Math.floor(Math.random() * 6)], faces[Math.floor(Math.random() * 6)], faces[Math.floor(Math.random() * 6)]];
    const count = dice.filter(d => d === choice).length;
    const payout = count === 0 ? 0 : bet * (count + 1); // 1 con nhận 2x, 2 con nhận 3x, 3 con nhận 4x
    u.balance += payout;
    if (count > 0) u.wins++; else u.losses++;
    addExp(u, count > 0 ? 10 : 2);
    let qmsg2 = addQuestProgress(u, 'baucua', 1);
    if (count > 0) qmsg2 += addQuestProgress(u, 'win', 1);
    saveData();

    let msg = `🦀 BẦU CUA CÁ TÔM\nXuc xac: ${dice.map(d => icons[d]).join(' - ')}\nBan cược: ${icons[choice]} ${bet} VNĐ\n`;
    msg += count === 0 ? `😢 Không trúng con nao! Mat ${bet} VNĐ\n💰 Số dư: ${u.balance} VNĐ`
      : `🎉 Trúng ${count} con! Nhận ${payout} VNĐ\n💰 Số dư: ${u.balance} VNĐ`;
    sendWithImage(msg);
    return;
  }

  // ===== SOI CẦU (chỉ thống kê lịch sử bot, không đủ đoán được kết quả that) =====
  if (lower === '!soicau' || lower === '!câu' || lower === '!history') {
    if (!taixiuHistory.length) { reply('Chưa co lịch sử ván Tai Xiu nao. Cho nguooi chơi vai ván rồi soi nhé!'); return; }
    const last20 = taixiuHistory.slice(-20).reverse();
    const str = last20.map(h => h.result === 'tai' ? 'T' : 'X').join(' ');
    const taiCount = taixiuHistory.filter(h => h.result === 'tai').length;
    const xiuCount = taixiuHistory.length - taiCount;
    const taiPct = Math.round(taiCount / taixiuHistory.length * 100);
    // streak hiện tại
    let streak = 1;
    for (let i = taixiuHistory.length - 2; i >= 0; i--) {
      if (taixiuHistory[i].result === taixiuHistory[taixiuHistory.length - 1].result) streak++;
      else break;
    }
    const lastResult = taixiuHistory[taixiuHistory.length - 1].result.toUpperCase();
    reply(`📊 SOI CẦU TÀI XỈU (thống kê ván của bot)\n\n` +
      `20 ván gần nhất (mới nhất ben trai):\n${str}\n\n` +
      `Tổng ${taixiuHistory.length} ván:\n• Tai: ${taiCount} (${taiPct}%)\n• Xiu: ${xiuCount} (${100 - taiPct}%)\n` +
      `Cau hiện tại: ${lastResult} x${streak} liên tiếp\n\n` +
      `⚠️ Day chỉ la thống kê lịch sử ngẫu nhiên của bot, KHONG dự đoán được kết quả that o ngoai. Đúng đúng để chơi co bac that!`);
    return;
  }

  // Không phai lệnh thi không trả lời (tranh spam nhóm)
}

// ===== DANG NHAP VA CHAY BOT =====
async function main() {
  let login;
  try {
    login = require('orion-fca');
  } catch (e) {
    console.error('❌ Chưa cai thu vien. Hãy chay npm install trước.');
    process.exit(1);
  }

  const credentials = getCredentials();

  console.log('⏳ Đang kết nối Facebook bằng Orion FCA (tối đa 90 giây)...');
  let loginFinished = false;
  const loginTimeout = setTimeout(() => {
    if (loginFinished) return;
    console.error('❌ Đăng nhập bị treo qua 90 giây. Bot sẽ dừng để tránh tốn CPU va đăng nhập lặp lại.');
    console.error('💡 APPSTATE có thể hết hạn/checkpoint, hoặc Facebook chan IP may chu. Không Restart liên tục.');
    process.exit(1);
  }, 90000);

  const loginOptions = {
    forceLogin: true,
    autoReconnect: false,
    userAgent: process.env.FB_USER_AGENT || 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
  };

  login(credentials, loginOptions, (err, api) => {
    loginFinished = true;
    clearTimeout(loginTimeout);
    if (err) {
      console.error('❌ Đăng nhập thất bại:', err.message || err);
      console.error('💡 Mẹo: Cookie hết hạn? Hãy lấy lại APPSTATE moi. Acc bi checkpoint? Hãy đổi acc phu khác.');
      // Cho 60s moi thoát để giam so lần thu login liên tục (do bi Facebook quet)
      console.log('⏳ Cho 60s rồi thoát để Botkeep restart lại...');
      setTimeout(() => process.exit(1), 60000);
      return;
    }

    console.log('✅ Đăng nhập thành công! ID của bot:', api.getCurrentUserID());

    // Luu appState neu đăng nhập bang email/pass (để lần sau dùng lại)
    try {
      const appState = api.getAppState();
      if (appState && appState.length) {
        fs.writeFileSync(path.join(__dirname, 'appstate.json'), JSON.stringify(appState));
        console.log('💾 Đã lưu appstate.json (neu Botkeep co persistent volume thi lần sau se dùng lại được)');
      }
    } catch (e) {
      console.log('⚠️ Không luu được appstate:', e.message);
    }

    api.setOptions({ listenEvents: true });

    api.listenMqtt((listenErr, event) => {
      if (listenErr) {
        console.error('❌ Lỗi listen:', listenErr.message || listenErr);
        console.error('💡 Orion MQTT chưa kết nối được. Dừng bot và kiểm tra phiên Facebook; không Restart liên tục.');
        return;
      }
      if (!event) return;

      // Chào mừng / tam biet khi co người vao / rồi khoi nhóm
      if (event.type === 'event') {
        try {
          if (event.logMessageType === 'log:subscribe') {
            const names = (event.addedParticipants || []).map(p => p.name || p.id).join(', ') || 'bạn mới';
            api.sendMessage(`👋 Chào mừng ${names} da tham gia nhóm! Go !help để xem lệnh, !daily để nhận tiền.`, event.threadID);
          } else if (event.logMessageType === 'log:unsubscribe') {
            api.sendMessage(`👋 Tạm biệt! Hẹn gặp lại sau nhé!`, event.threadID);
          }
        } catch (e) {}
        return;
      }

      if (event.type !== 'message' || !event.body) return;

      // Bo qua tin nhắn của chính mình
      if (event.senderID === api.getCurrentUserID()) return;

      console.log(`💬 [${event.threadID}] ${event.senderID}: ${event.body}`);

      // Nhận EXP khi chat (cooldown 60s/người để chong farm)
      try {
        const nowExp = Date.now();
        if (!expCooldowns[event.senderID] || nowExp - expCooldowns[event.senderID] > 60000) {
          expCooldowns[event.senderID] = nowExp;
          const eu = getUser(event.senderID);
          addExp(eu, 1);
          saveData();
        }
      } catch (e) {}

      // Xu ly lệnh bắt đầu bang ! HOAC trả lời quiz đang cho
      const isCommand = event.body.trim().startsWith('!');
      const hasQuiz = activeQuiz[event.threadID] && Date.now() < activeQuiz[event.threadID].expiresAt;
      const hasTrieuphu = activeTrieuphu[event.senderID];
      if (isCommand || hasQuiz || hasTrieuphu) {
        handleCommand(api, event);
      }
    });

    console.log('🚀 Bot đang lang nghe tin nhắn trong nhóm + inbox...');
    console.log('💡 Thêm acc bot vao nhóm chat Messenger (thủ công) rồi nhắn !ping để test.');
  });
}

main();
