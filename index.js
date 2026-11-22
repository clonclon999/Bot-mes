/**
 * BOT MESSENGER NICK CA NHAN (FCA) - VAO NHOM CHAT
 * Node.js + @dongdev/fca-unofficial - Deploy len Botkeep.cloud
 *
 * CANH BAO: Day la API không chinh thuc, vi pham dieu khoan Meta.
 * Chỉ đúng acc phu, không đúng acc chinh. Co the bi khóa / checkpoint.
 *
 * Lệnh có sẵn (chỉ trả lời khi nhận !):
 *  !help / !menu  - Danh sach lệnh
 *  !hi            - Chào hỏi
 *  !ping          - Kiểm tra bot
 *  !time / !giờ   - Gio hiện tại
 *  !echo <text>   - Lặp lại
 *  !joke          - Chuyện cười
 *  !info          - Thông tin bot
 *  --- TRÒ CHƠI TIỀN ẢO VND (giải trí, không dùng tiền thật) ---
 *  !balance       - Xem số dư VNĐ
 *  !daily         - Nhận 50.000 VNĐ mỗi ngày
 *  !diemdanh      - Điểm danh nhận tiền theo chuỗi
 *  !work          - Làm việc nhận VNĐ (cooldown 60s)
 *  !fish          - Đi câu cá (cooldown 120s)
 *  !farm          - Trồng cây thu hoạch (cooldown 180s)
 *  !bank <tiền> @tên - Chuyển tiền cho người khác
 *  !taixiu <tai|xiu|so> <cược>  - Vd: !taixiu tai 10k
 *  !baucua <bau|của|tom|ca|ga|nai> <cược> - Vd: !baucua cua 10k
 *  !slot <cược>   - Quay xeng: !slot 10k
 *  !lotto <so 00-99> <cược> - Xổ số: !lotto 69 10k
 *  !lixi <tiền>   - Thả lì xì, người khác gõ !nhận để nhận
 *  !quiz          - Do vui có thưởng (trả lời đúng đầu tiên được tiền)
 *  !soicau        - Xem lịch sử + thống kê Tài/Xỉu (chỉ thống kê, không đủ đoán được kết quả thật)
 *  !top           - Bang xếp hạng dai gia
 *  !level / !rank - Xem cấp độ / xếp hạng cấp độ
 *  !quest         - Nhiệm vụ hàng ngày
 *  !guess <số>    - Đoán số 1-100
 *  !reaction      - Gàme phản xạ: ai gõ !go nhanh nhất được tiền
 *  !trieuphu      - Ai là triệu phú: trả lời 5 câu liên tiếp
 *  --- ADMIN (chỉ admin mới dùng được, gõ !adminhelp) ---
 *  !addadmin / !deladmin / !admins - Quản lý admin
 *  !kick / !bạn / !unban / !mute / !unmute / !warn - Dieu hanh thành viên
 *  !give / !reset - Tặng / reset tiền
 *  !stats / !settitle / !color / !emoji - Thong ke & tuy chinh nhóm
 *
 * Chong spam / do bị Facebook quét + chay nhé tren goi free Botkeep:
 *  - Chỉ trả lời lệnh có dấu !, hồi chiêu mỗi lệnh, delay ngẫu nhiên giống người
 *  - Không tự nhắn trước, không spam tin, giới hạn lịch sử, không nặng
 */

require('dotenv').config(); // Botkeep ghi biến môi trường vao file .env, phải load file này
const fs = require('fs');
const path = require('path');
const express = require('express');
const sharp = require('sharp');

// ===== HEALTH CHECK (để Botkeep biet bot con song) =====
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const healthApp = express();
healthApp.get('/', (req, res) => res.send('🤖 Bot nick FCA đang chay!'));
healthApp.listen(PORT, '0.0.0.0', () => console.log(`🌐 Health-check tren port ${PORT}`));

// ===== LAY THONG TIN DANG NHAP =====
function getCredentials() {
  // Cách 1: APPSTATE từ biến mới truong (khuyên dùng trên Botkeep)
  if (process.env.APPSTATE) {
    try {
      let raw = String(process.env.APPSTATE).trim();
      // Fix lỗi hãy gap: Botkeep ghi .env làm hỏng JSON nhiều dòng / co \n \t
      raw = raw.replace(/\\n/g, ' ').replace(/\\t/g, ' ').replace(/\\r/g, ' ');
      // Neu JSON bi escape qua (\" thay vi "), sua lại
      if (raw.includes('\\"')) raw = raw.replace(/\\"/g, '"');
      // Chỉ lấy phần từ [ đầu tiên đến ] cuối cùng (bỏ chữ thừa ở ngoài)
      const startIdx = raw.indexOf('[');
      const endIdx = raw.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        raw = raw.slice(startIdx, endIdx + 1);
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) throw new Error('APPSTATE phải la mang JSON, không rong');
      console.log(`🔑 Đăng nhập bang APPSTATE (env) - ${parsed.length} cookies`);
      return { appState: parsed };
    } catch (e) {
      console.error('❌ APPSTATE không phải JSON hop le:', e.message);
      console.error('💡 Hãy dán APPSTATE dạng 1 dòng duy nhất (compact JSON), bắt đầu bằng [ và kết thúc bằng ], đừng dán nhiều dòng.');
    }
  }

  // Cách 1b: file appstate.json ở máy (chạy local)
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

  // Cách 2: Email / mật khẩu
  if (process.env.FB_EMAIL && process.env.FB_PASSWORD) {
    console.log('🔑 Đăng nhập bang Email/Password');
    const creds = { email: process.env.FB_EMAIL, password: process.env.FB_PASSWORD };
    if (process.env.FB_2FA_SECRET) creds.twofactor = process.env.FB_2FA_SECRET;
    return creds;
  }

  console.error('❌ Chưa có thông tin đăng nhập! Hãy thêm APPSTATE hoặc FB_EMAIL/FB_PASSWORD vào Environment trên Botkeep.');
  process.exit(1);
}

// ===== XU LY LENH =====
const JOKES = [
  '😂 Tại sao lập trình viên hay nhầm Halloween với Giáng sinh? Vì OCT 31 == DEC 25!',
  '🤣 Co 10 loai người tren đổi: người hieu nhi phan va người không hieu.',
  '😆 Debug là quá trình loại bỏ bug... bằng cách thêm bug mới vào!',
  '🙃 Lap trinh vien không chet vi code, ho chet vi... "chỉ sua 1 dong thôi" rồi sua ca ngày!',
];

// ===== HE THONG XU AO + TRO CHOI =====
// Lưu ý: Chỉ dùng tiền ảo VNĐ để giải trí trong nhóm, KHÔNG dùng tiền thật, KHÔNG dùng để chơi cờ bạc thật.
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
// Vòng cược nhiều người theo từng nhóm. Mỗi game chỉ có 1 vòng đang mở/thread.
const multiplayerRounds = {
  taixiu: {},
  baucua: {},
  lotto: {},
};
const MULTI_ROUND_MS = 45 * 1000;
const activeReaction = {}; // threadID -> { state: 'waiting'|'go', goTime, reward }
const activeTrieuphu = {}; // senderID -> { step, questions, earned }

const TRIEUPHU_QUESTIONS = [
  { q: 'Con gi keu meo meo?', a: 'meo' },
  { q: 'Viet Nam thứ do la gi?', a: 'ha noi' },
  { q: '1 + 1 = ?', a: '2' },
  { q: 'Con gi co 4 chan va sua moo moo?', a: 'bo' },
  { q: 'Nuoc gi dai nhat the gioi?', a: 'nga' },
  { q: 'Dong tiền Viet Nam goi la gi?', a: 'dong' },
  { q: 'Con gi an chuoi va leo cay?', a: 'khoi' },
  { q: 'So lon nhat co 1 chu so la?', a: '9' },
  { q: 'Con gi co mai cung va bo trong nuoc?', a: 'rua' },
  { q: 'Mau gi la màu của báo la Viet Nam?', a: 'do' },
  { q: 'Con gi bay tren troi va keu o o?', a: 'ga' },
  { q: 'Con gi song duoi nuoc va co 8 chan?', a: 'bach tuoc' },
  { q: 'Mua gi la mua của hoa mai?', a: 'tet' },
  { q: 'Con gi keu u u va thich an co?', a: 'trau' },
  { q: 'Ngày le Quoc khanh Viet Nam la ngày may?', a: '2/9' },
  { q: 'Con gi leo cay va an chuoi dai?', a: 'khoi' },
  { q: 'Hanh tinh gan mất nhat la?', a: 'sao kim' },
  { q: 'Con so đầu tiên trong day số từ nhien la?', a: '0' },
  { q: 'Con gi co 2 chan va biet bay?', a: 'chim' },
  { q: 'Nuoc nao co thap Eiffel?', a: 'phap' },
];
const TRIEUPHU_REWARDS = [10000, 20000, 30000, 50000, 100000];
const expCooldowns = {}; // senderID -> timestamp (chong farm EXP)

const QUEST_POOL = [
  { type: 'taixiu', desc: 'Chơi 3 ván Tài Xỉu', target: 3, reward: 30000 },
  { type: 'baucua', desc: 'Chơi 2 ván Bầu Cua', target: 2, reward: 30000 },
  { type: 'slot', desc: 'Quay xeng 2 lần', target: 2, reward: 25000 },
  { type: 'fish', desc: 'Đi câu cá 1 lần', target: 1, reward: 20000 },
  { type: 'work', desc: 'Làm việc 2 lần', target: 2, reward: 25000 },
  { type: 'bank', desc: 'Chuyển tiền cho người khác 1 lần', target: 1, reward: 20000 },
  { type: 'win', desc: 'Thắng 1 ván bat ky', target: 1, reward: 30000 },
  { type: 'quiz', desc: 'Trả lời đúng 1 câu do vui', target: 1, reward: 25000 },
  { type: 'lixi', desc: 'Nhận lì xì 1 lần', target: 1, reward: 20000 },
  { type: 'lotto', desc: 'Chơi xổ số 1 lần', target: 1, reward: 20000 },
];

const QUIZ_QUESTIONS = [
  { q: 'Con gi keu "meo meo"?', a: 'meo' },
  { q: 'Viet Nam thứ do la gi?', a: 'ha noi' },
  { q: 'Mau gi la màu của báo la Viet Nam?', a: 'do' },
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
      console.log(`💾 Đã tải dữ liệu: ${Object.keys(users).length} người chơi, ${taixiuHistory.length} ván Tài Xỉu, ${admins.length} admin`);
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

// Admin cố định qua biến môi trường ADMIN_IDS (không cần gõ lệnh trong nhóm)
// Vi du tren Botkeep: ADMIN_IDS=1234567890123,9876543210987
if (process.env.ADMIN_IDS || process.env.ADMIN_ID) {
  const envAdmins = (process.env.ADMIN_IDS || process.env.ADMIN_ID).split(',').map(s => s.trim()).filter(Boolean);
  for (const id of envAdmins) {
    if (!admins.includes(id)) admins.push(id);
  }
  if (envAdmins.length) console.log(`🛡️ Đã tải ${envAdmins.length} admin từ biến ADMIN_IDS`);
}

function getUser(id) {
  if (!users[id]) {
    users[id] = { balance: START_BALANCE, lastDaily: 0, lastWork: 0, wins: 0, losses: 0, lastCheckin: 0, streak: 0, banned: false, mutedUntil: 0, warns: 0, exp: 0, level: 1, quests: null };
    saveData();
  }
  // migrate user cu thieu truong mới
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
    // tra về thong báo len cấp qua reply ở ngoài neu can, o day chỉ cong tiền
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
        rewardMsg += `\n📜 Hoàn thành nhiệm vụ "${q.desc}"! +${formatVnd(q.reward)}`;
      }
    }
  }
  if (rewardMsg) saveData();
  return rewardMsg;
}
function normalize(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
}

// Định dạng tiền kiểu Việt Nam: 1000000 -> 1.000.000 VNĐ
function formatNumber(amount) {
  return Math.trunc(Number(amount) || 0).toLocaleString('vi-VN');
}
function formatVnd(amount) {
  return `${formatNumber(amount)} VNĐ`;
}

// Hỗ trợ: 10000, 10.000, 50k, 1,5tr, 1m, 1 tỷ, all/max/tất tay, half/nửa.
function parseAmountInput(raw, maxAvailable = 0) {
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  let str = normalize(String(raw || '')).replace(/₫/g, '').trim();
  if (!str) return 0;
  if (['all', 'max', 'tattay', 'tat tay'].includes(str)) return Math.max(0, Math.floor(Number(maxAvailable) || 0));
  if (['half', '1/2', 'nua'].includes(str)) return Math.max(0, Math.floor((Number(maxAvailable) || 0) / 2));
  str = str.replace(/\s+/g, '').replace(/vnd$/i, '');
  const match = str.match(/^(\d+(?:[.,]\d+)?)(k|nghin|ngan|m|tr|trieu|b|ty)?$/i);
  if (!match) return 0;
  const unit = (match[2] || '').toLowerCase();
  if (!unit) {
    const digits = match[1].replace(/[.,]/g, '');
    return /^\d+$/.test(digits) ? Math.floor(Number(digits)) : 0;
  }
  const value = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return 0;
  let mult = 1;
  if (['k', 'nghin', 'ngan'].includes(unit)) mult = 1_000;
  else if (['m', 'tr', 'trieu'].includes(unit)) mult = 1_000_000;
  else if (['b', 'ty'].includes(unit)) mult = 1_000_000_000;
  return Math.floor(value * mult);
}

function progressBar(current, total, size = 10) {
  const ratio = Math.max(0, Math.min(1, Number(current) / Math.max(1, Number(total))));
  const filled = Math.round(ratio * size);
  return `${'▰'.repeat(filled)}${'▱'.repeat(size - filled)} ${Math.round(ratio * 100)}%`;
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
  const bet = parseAmountInput(args[args.length - 1], user.balance);
  if (!bet || bet <= 0) return { error: 'Cược phải lớn hơn 0. Hỗ trợ: 10k, 1tr, all, half.\nVí dụ: !taixiu tai 10k' };
  if (bet > user.balance) return { error: `❌ Không đủ tiền!\n💰 Số dư: ${formatVnd(user.balance)}` };
  if (bet > 10000000) return { error: '⚠️ Mỗi ván cược tối đa 10.000.000 VNĐ.' };
  return { bet };
}

function sendRoundMessage(api, threadID, body, withBầucuaImage = false) {
  const msg = { body, noAck: true };
  if (withBầucuaImage) {
    const img = path.join(__dirname, 'baucua.jpg');
    if (fs.existsSync(img)) msg.attachment = fs.createReadStream(img);
  }
  api.sendMessage(msg, threadID, err => err && console.error('❌ Lỗi gửi kết quả vòng:', err.message || err));
}

function roundLabel(game) {
  return game === 'taixiu' ? 'TÀI XỈU' : game === 'baucua' ? 'BẦU CUA' : 'LOTTO';
}

function escapeSvg(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

async function createRoundResultCard(game, resultData, totalBet, winners, totalPlayers, entries) {
  const id = `${game}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const out = path.join(__dirname, 'tmp', `${id}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const labels = { bau: 'BẦU', cua: 'CUA', tom: 'TÔM', ca: 'CÁ', ga: 'GÀ', nai: 'NAI' };
  const colors = { bau: '#78c850', cua: '#ff7043', tom: '#ff5252', ca: '#42a5f5', ga: '#ffca28', nai: '#ab8262' };
  let resultBoxes = '';
  if (game === 'baucua') {
    resultBoxes = resultData.dice.map((face, i) => {
      const x = 75 + i * 270;
      return `<g><rect x="${x}" y="200" width="230" height="190" rx="28" fill="${colors[face]}" stroke="#ffd968" stroke-width="7"/><circle cx="${x + 115}" cy="270" r="46" fill="#fff" opacity=".94"/><text x="${x + 115}" y="286" class="face" text-anchor="middle">${escapeSvg(labels[face])}</text><text x="${x + 115}" y="360" class="box" text-anchor="middle">XÚC XẮC ${escapeSvg(labels[face])}</text></g>`;
    }).join('');
  } else if (game === 'taixiu') {
    resultBoxes = resultData.dice.map((n, i) => `<g><rect x="${105 + i * 245}" y="210" width="180" height="170" rx="28" fill="#fff8e7" stroke="#ffd968" stroke-width="7"/><text x="${195 + i * 245}" y="320" class="die" text-anchor="middle">${n}</text></g>`).join('');
  } else {
    resultBoxes = `<circle cx="450" cy="295" r="112" fill="#fff" stroke="#ffd968" stroke-width="10"/><text x="450" y="330" class="lotto" text-anchor="middle">${String(resultData.draw).padStart(2, '0')}</text>`;
  }
  const resultTitle = game === 'baucua' ? resultData.dice.map(x => labels[x]).join(' • ') : game === 'taixiu' ? `${resultData.dice.join(' + ')} = ${resultData.sum} • ${resultData.result.toUpperCase()}` : `SỐ MAY MẮN ${String(resultData.draw).padStart(2, '0')}`;
  const maxRows = 8;
  const rows = entries.slice(0, maxRows).map((e, i) => `<g><rect x="55" y="${585 + i * 55}" width="790" height="43" rx="12" fill="${e.win ? '#173f35' : '#40252d'}"/><text x="78" y="${615 + i * 55}" class="row">${e.win ? 'THẮNG' : 'THUA'}  •  ...${escapeSvg(e.uid.slice(-6))}  •  ${escapeSvg(e.choice.toUpperCase())}  •  ${e.win ? '+' : '-'}${escapeSvg(formatVnd(e.win ? e.payout : e.amount))}</text></g>`).join('');
  const extra = entries.length > maxRows ? `<text x="450" y="${610 + maxRows * 55}" class="small" text-anchor="middle">...và ${entries.length - maxRows} người chơi khác</text>` : '';
  const height = 670 + Math.min(entries.length, maxRows) * 55;
  const svg = `<svg width="900" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#25132f"/><stop offset="1" stop-color="#101b2d"/></linearGradient></defs><style>.title{font:700 44px sans-serif;fill:#fff}.sub{font:700 27px sans-serif;fill:#ffe17b}.face{font:800 25px sans-serif;fill:#32151a}.box{font:800 21px sans-serif;fill:#fff}.die{font:800 82px sans-serif;fill:#b71c35}.lotto{font:800 92px sans-serif;fill:#d51f3d}.stat{font:700 24px sans-serif;fill:#fff}.row{font:700 20px sans-serif;fill:#fff}.small{font:20px sans-serif;fill:#cdd7e8}</style><rect width="900" height="${height}" rx="34" fill="url(#bg)"/><rect x="18" y="18" width="864" height="${height - 36}" rx="28" fill="none" stroke="#e5ad32" stroke-width="5"/><text x="450" y="82" class="title" text-anchor="middle">KẾT QUẢ PHIÊN ${escapeSvg(roundLabel(game))}</text><text x="450" y="132" class="sub" text-anchor="middle">#${escapeSvg(id.toUpperCase())}</text><text x="450" y="178" class="sub" text-anchor="middle">${escapeSvg(resultTitle)}</text>${resultBoxes}<rect x="55" y="430" width="790" height="115" rx="22" fill="#ffffff" opacity=".09"/><text x="80" y="474" class="stat">NGƯỜI CHƠI: ${totalPlayers}     •     NGƯỜI THẮNG: ${winners}</text><text x="80" y="520" class="stat">TỔNG TIỀN CƯỢC: ${escapeSvg(formatVnd(totalBet))}</text><text x="55" y="570" class="sub">DANH SÁCH KẾT QUẢ</text>${rows}${extra}</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
  return out;
}

function openMultiplayerRound(game, api, threadID) {
  if (multiplayerRounds[game][threadID]) return false;
  const round = { game, api, threadID, bets: new Map(), closesAt: Date.now() + MULTI_ROUND_MS };
  multiplayerRounds[game][threadID] = round;
  round.timer = setTimeout(() => settleMultiplayerRound(game, threadID), MULTI_ROUND_MS);
  const examples = game === 'taixiu'
    ? '!taixiu tai 10k hoặc !taixiu 11 10k'
    : game === 'baucua'
      ? '!baucua cua 10k'
      : '!lotto 69 10k';
  sendRoundMessage(api, threadID,
    `╭── 🎮 ${roundLabel(game)} NHIỀU NGƯỜI ──╮\n` +
    `│ ⏳ Mở cược trong 45 giây\n│ 📝 ${examples}\n` +
    `│ 🔄 Mỗi người được đổi cửa trước khi khóa cược\n╰────────────────────╯`);
  return true;
}

function settleMultiplayerRound(game, threadID) {
  const round = multiplayerRounds[game][threadID];
  if (!round) return;

  // Messenger hỗ trợ GIF: phát hiệu ứng trước, sau đó mới công bố kết quả.
  if (!round.animationPlayed && round.bets.size > 0) {
    round.animationPlayed = true;
    clearTimeout(round.timer);
    const animations = {
      taixiu: ['taixiu_roll.gif', '🎲 ĐANG LẮC XÚC XẮC...'],
      baucua: ['baucua_roll.gif', '🦀 ĐANG XÓC BẦU CUA...'],
      lotto: ['lotto_draw.gif', '🎱 ĐANG QUAY LOTTO...'],
    };
    const [file, title] = animations[game] || [];
    const gif = file && path.join(__dirname, file);
    const loading = { body: `${title || '🎮 ĐANG QUAY...'} Kết quả sắp có!`, noAck: true };
    if (gif && fs.existsSync(gif)) loading.attachment = fs.createReadStream(gif);
    round.api.sendMessage(loading, threadID, err => err && console.error('❌ Lỗi gửi GIF trò chơi:', err.message || err));
    round.timer = setTimeout(() => settleMultiplayerRound(game, threadID), 2600);
    return;
  }

  delete multiplayerRounds[game][threadID];
  clearTimeout(round.timer);
  if (!round.bets.size) {
    // Không có người cược: hủy im lặng để tránh spam nhóm.
    return;
  }

  let header = '', resultData;
  if (game === 'taixiu') {
    const dice = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6));
    const sum = dice.reduce((a, b) => a + b, 0);
    const result = sum >= 11 && sum <= 17 ? 'tai' : 'xiu';
    resultData = { dice, sum, result };
    taixiuHistory.push({ sum, result, dice });
    if (taixiuHistory.length > 100) taixiuHistory = taixiuHistory.slice(-100);
    header = `🎲 Xúc xắc: ${dice.join(' - ')} = ${sum} → ${result.toUpperCase()}`;
  } else if (game === 'baucua') {
    const faces = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
    const dice = [1, 2, 3].map(() => faces[Math.floor(Math.random() * faces.length)]);
    resultData = { dice };
    const icon = { bau: '🍐 Bầu', cua: '🦀 Cua', tom: '🦐 Tôm', ca: '🐟 Cá', ga: '🐓 Gà', nai: '🦌 Nai' };
    header = `🎲 Kết quả: ${dice.map(x => icon[x]).join(' - ')}`;
  } else {
    const draw = Math.floor(Math.random() * 100);
    resultData = { draw };
    header = `🎱 Kết quả Lotto: ${String(draw).padStart(2, '0')}`;
  }

  let winners = 0, totalBet = 0;
  const lines = [];
  const resultEntries = [];
  for (const [uid, betInfo] of round.bets) {
    const u = getUser(uid);
    totalBet += betInfo.amount;
    let win = false, payout = 0;
    if (game === 'taixiu') {
      const numeric = /^\d+$/.test(betInfo.choice);
      win = numeric ? Number(betInfo.choice) === resultData.sum : betInfo.choice === resultData.result;
      payout = win ? betInfo.amount * (numeric ? 5 : 2) : 0;
    } else if (game === 'baucua') {
      const count = resultData.dice.filter(x => x === betInfo.choice).length;
      win = count > 0;
      payout = win ? betInfo.amount * (count + 1) : 0;
    } else {
      win = Number(betInfo.choice) === resultData.draw;
      payout = win ? betInfo.amount * 50 : 0;
    }
    if (win) {
      winners++;
      u.balance += payout;
      u.wins++;
      addExp(u, game === 'lotto' ? 15 : 10);
      addQuestProgress(u, 'win', 1);
      lines.push(`🏆 ...${uid.slice(-6)} | ${betInfo.choice} | +${formatVnd(payout)}`);
    } else {
      u.losses++;
      addExp(u, 2);
      lines.push(`💔 ...${uid.slice(-6)} | ${betInfo.choice} | -${formatVnd(betInfo.amount)}`);
    }
    resultEntries.push({ uid, choice: betInfo.choice, amount: betInfo.amount, payout, win });
    addQuestProgress(u, game, 1);
  }
  saveData();
  const resultBody =
    `╭── 📣 KẾT QUẢ ${roundLabel(game)} ──╮\n${header}\n` +
    `💰 Tổng cược: ${formatVnd(totalBet)} | 🏆 ${winners}/${round.bets.size} người thắng\n` +
    `────────────────────\n${lines.join('\n')}\n╰────────────────────╯`;
  createRoundResultCard(game, resultData, totalBet, winners, round.bets.size, resultEntries)
    .then(card => {
      round.api.sendMessage({ body: resultBody, attachment: fs.createReadStream(card), noAck: true }, threadID, err => {
        if (err) console.error('❌ Lỗi gửi ảnh tổng kết:', err.message || err);
        fs.unlink(card, () => {});
      });
    })
    .catch(err => {
      console.error('❌ Lỗi tạo ảnh tổng kết:', err.message || err);
      sendRoundMessage(round.api, threadID, resultBody, game === 'baucua');
    });
}

function placeMultiplayerBet(game, api, event, parts, reply) {
  const threadID = event.threadID;
  const senderID = String(event.senderID);
  const round = multiplayerRounds[game][threadID];
  if (!round) {
    reply(`Chưa có vòng ${roundLabel(game)}. Gõ !${game} start để mở vòng 45 giây.`);
    return true;
  }
  if (Date.now() >= round.closesAt) { reply('⏳ Vòng đang khóa cược, chờ kết quả nhé!'); return true; }
  if (parts.length < 3) { reply(`Thiếu lựa chọn hoặc tiền cược. Ví dụ: !${game} ${game === 'lotto' ? '69' : game === 'baucua' ? 'cua' : 'tai'} 10k`); return true; }
  let choice = normalize(parts[1]);
  if (game === 'baucua' && choice === 'của') choice = 'cua';
  const valid = game === 'taixiu'
    ? (['tai', 'xiu'].includes(choice) || (/^\d+$/.test(choice) && Number(choice) >= 3 && Number(choice) <= 18))
    : game === 'baucua'
      ? ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'].includes(choice)
      : /^\d{1,2}$/.test(choice) && Number(choice) <= 99;
  if (!valid) { reply('❌ Lựa chọn không hợp lệ. Hãy xem lại cú pháp trong !help.'); return true; }
  if (game === 'lotto') choice = String(Number(choice)).padStart(2, '0');

  const u = getUser(senderID);
  const old = round.bets.get(senderID);
  if (old) u.balance += old.amount; // đổi cửa: hoàn cược cũ trước
  const amount = parseAmountInput(parts[2], u.balance);
  if (!amount || amount <= 0 || amount > 10000000) {
    if (old) u.balance -= old.amount;
    reply('❌ Tiền cược phải từ 1 đến 10.000.000 VNĐ. Hỗ trợ 10k, 1tr, all, half.');
    return true;
  }
  if (amount > u.balance) {
    if (old) u.balance -= old.amount;
    reply(`❌ Không đủ tiền! Số dư: ${formatVnd(u.balance)}`);
    return true;
  }
  u.balance -= amount;
  round.bets.set(senderID, { choice, amount });
  saveData();
  const left = Math.max(1, Math.ceil((round.closesAt - Date.now()) / 1000));
  reply(`✅ Đã ${old ? 'đổi' : 'đặt'} cược: ${choice.toUpperCase()} — ${formatVnd(amount)}\n⏳ Còn ${left} giây | 👥 ${round.bets.size} người đã cược`);
  return true;
}

function handleCommand(api, event) {
  const text = (event.body || '').trim();
  const lower = text.toLowerCase();
  const threadID = event.threadID;
  const senderID = event.senderID;

  // Chong spam / giống người: delay ngẫu nhiên 400-1000ms + typing indicator
  const reply = (msg) => {
    const delay = 400 + Math.floor(Math.random() * 601);
    try { if (api.sendTypingIndicator) api.sendTypingIndicator(threadID); } catch (e) {}
    setTimeout(() => {
      // noAck tránh hàng đợi cả nhóm bị kẹt khi Facebook không trả /ls_resp.
      api.sendMessage({ body: msg, noAck: true }, threadID, (err) => {
        if (err) console.error('❌ Lỗi gửi tin:', err.message || err);
      });
    }, delay);
  };

  // Kiểm tra bạn / mute (admin ván đúng được lệnh unban/unmute)
  const senderUser = getUser(senderID);
  const isSenderAdmin = isAdmin(senderID);
  if (senderUser.banned && !isSenderAdmin && lower !== '!unban' && lower !== '!admins') {
    return; // im lang, không trả lời
  }
  if (senderUser.mutedUntil && Date.now() < senderUser.mutedUntil && !isSenderAdmin) {
    return; // đang bi mute thi im lang
  }

  // ===== PHÒNG CƯỢC NHIỀU NGƯỜI (45 GIÂY) =====
  for (const game of ['taixiu', 'baucua', 'lotto']) {
    if (lower === `!${game} start`) {
      if (!openMultiplayerRound(game, api, threadID)) {
        const r = multiplayerRounds[game][threadID];
        const left = Math.max(1, Math.ceil((r.closesAt - Date.now()) / 1000));
        reply(`⚠️ Đã có vòng ${roundLabel(game)} đang mở. Còn ${left} giây, ${r.bets.size} người đã cược.`);
      }
      return;
    }
    if (lower === `!${game}`) {
      const r = multiplayerRounds[game][threadID];
      if (!r) reply(`🎮 Gõ !${game} start để mở vòng cược chung 45 giây.`);
      else reply(`⏳ Vòng ${roundLabel(game)} còn ${Math.max(1, Math.ceil((r.closesAt - Date.now()) / 1000))} giây — ${r.bets.size} người đã cược.`);
      return;
    }
    if (lower.startsWith(`!${game} `)) {
      placeMultiplayerBet(game, api, event, text.split(/\s+/), reply);
      return;
    }
  }

  if (lower === '!help' || lower === '!menu' || lower === 'menu') {
    reply('🤖 DANH SÁCH LỆNH:\n\n' +
      '• !hi - Chào hỏi\n• !ping - Kiểm tra bot\n• !time / !giờ - Xem giờ\n' +
      '• !echo <text> - Lặp lại\n• !joke - Chuyện cười\n• !info - Thông tin bot\n\n' +
      '🎮 TRÒ CHƠI TIỀN ẢO VND (giải trí, không dùng tiền thật):\n' +
      '• !balance - Xem số dư\n• !daily - Nhận 50.000 VNĐ mỗi ngày\n• !diemdanh - Điểm danh theo chuỗi\n• !work - Làm việc nhận VNĐ\n' +
      '• !fish - Đi câu cá\n• !farm - Trồng cây thu hoạch\n' +
      '• !bank <số tiền> @tên - Chuyển tiền cho người khác\n' +
      '  Vd: !bank 50k @TenBan\n' +
      '• !taixiu start - Mở vòng chung 45s; cược: !taixiu tai 10k\n' +
      '• !baucua start - Mở vòng chung 45s; cược: !baucua cua 10k\n' +
      '• !slot <cược> - Quay xeng, Vd: !slot 10k\n' +
      '• !lotto start - Mở vòng chung 45s; cược: !lotto 69 10k\n' +
      '• !lixi <tiền> - Thả lì xì, người khác gõ !nhận để nhận\n' +
      '• !quiz - Do vui có thưởng (trả lời đúng đầu tiên)\n' +
      '• !soicau - Xem lịch sử Tài/Xỉu\n• !top - Đại gia nhất nhóm\n' +
      '• !level - Xem cấp độ của bạn\n• !rank - Xếp hạng cấp độ\n• !quest - Nhiệm vụ hàng ngày\n• !guess <số> - Đoán số 1-100\n' +
      '• !reaction - Gàme phản xạ, ai gõ !go nhanh nhất\n• !trieuphu - Ai là triệu phú 5 câu\n\n' +
      '💡 NHẬP TIỀN NHANH: 10k = 10.000 | 1tr = 1.000.000 | all = tất tay | half = nửa số dư\n\n' +
      'Bot chỉ trả lời khi có dấu ! để tránh spam nhóm.\nAdmin gõ !adminhelp để xem lệnh quản trị.');
    return;
  }
  if (lower === '!hi' || lower === 'hi' || lower === 'hello') {
    reply('👋 Xin chao! Minh la bot nick FCA. Gõ !help để xem lệnh nhé!');
    return;
  }
  if (lower === '!id' || lower === '!myid' || lower === '!uid') {
    reply(`🪪 ID của bạn là: ${senderID}\nCopy ID này dán vào biến ADMIN_IDS tren Botkeep để làm admin vĩnh viễn, không cần gõ lệnh trong nhóm.`);
    return;
  }
  if (lower === '!ping') {
    reply('🏓 Pong! Bot vẫn online ✅');
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
    reply(`╭─── 💳 VÍ CỦA BẠN ───╮\n│ 💰 Số dư: ${formatVnd(u.balance)}\n│ 🏆 Thắng: ${u.wins}   💔 Thua: ${u.losses}\n╰──────────────────╯`);
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
    reply(`╭── 🎁 QUÀ HẰNG NGÀY ──╮\n│ ✅ Nhận: +${formatVnd(DAILY_REWARD)}\n│ 💰 Số dư: ${formatVnd(u.balance)}\n╰──────────────────╯`);
    return;
  }
  if (lower === '!work') {
    const u = getUser(senderID);
    const cd = checkCooldown(senderID + '_work', 60);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa mới làm việc được.`); return; }
    const earn = 5000 + Math.floor(Math.random() * 15001); // 5.000 - 20.000 VNĐ
    u.balance += earn;
    addExp(u, 5);
    let qmsg6 = addQuestProgress(u, 'work', 1);
    saveData();
    reply(`╭─── 💼 LÀM VIỆC ───╮\n│ 💵 Thu nhập: +${formatVnd(earn)}\n│ 💰 Số dư: ${formatVnd(u.balance)}\n╰─────────────────╯`);
    return;
  }
  if (lower === '!top') {
    const sorted = Object.entries(users).sort((a, b) => b[1].balance - a[1].balance).slice(0, 10);
    if (!sorted.length) { reply('Chưa có ai chơi. Gõ !daily để nhận VNĐ đầu tiên!'); return; }
    let msg = '🏆 BANG XEP HANG DAI GIA:\n\n';
    sorted.forEach(([id, u], i) => { msg += `${i + 1}. ${id.slice(-6)}... - ${formatVnd(u.balance)}\n`; });
    reply(msg);
    return;
  }

  // ===== BANK / CHUYEN TIEN =====
  if (lower.startsWith('!bank') || lower.startsWith('!chuyển') || lower.startsWith('!pay') || lower.startsWith('!transfer')) {
    const cd = checkCooldown(senderID + '_bank', 5);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa mới chuyển được.`); return; }
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

    // Lay số tiền: so đầu tiên trong parts sau lệnh
    let amount = null;
    for (let i = 1; i < parts.length; i++) {
      const n = parseAmountInput(parts[i], getUser(senderID).balance);
      if (n > 0) { amount = n; break; }
    }

    if (!recipientID) {
      reply('Cú pháp: !bank <số tiền> @tên\nVd: !bank 50k @TenBan\n(Hãy @ tên người nhận trong tin nhắn)');
      return;
    }
    if (!amount || amount <= 0) {
      reply('Số tiền chuyển phải > 0. Vd: !bank 50k @TenBan');
      return;
    }
    if (recipientID === String(senderID)) {
      reply('Không thể tự chuyển tiền cho chính mình đâu!');
      return;
    }
    const sender = getUser(senderID);
    if (amount > sender.balance) {
      reply(`Không đủ VNĐ! Số dư của bạn: ${formatVnd(sender.balance)}`);
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
    reply(`💸 CHUYỂN TIỀN THÀNH CÔNG!\nTừ: ${String(senderID).slice(-6)}...\nĐến: ${recipientName || ('...' + String(recipientID).slice(-6))}\nSố tiền: ${formatVnd(amount)}\n💰 Số dư của bạn: ${formatVnd(sender.balance)}`);
    return;
  }

  // ===== DIEM DANH =====
  if (lower === '!diemdanh') {
    const u = getUser(senderID);
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    if (now - u.lastCheckin < DAY) {
      const left = Math.ceil((DAY - (now - u.lastCheckin)) / 1000 / 60 / 60);
      reply(`⏳ Bạn đã điểm danh rồi, quay lại sau ${left} giờ nữa. Streak hiện tại: ${u.streak} ngày`);
      return;
    }
    // neu miss 1 ngày thi reset streak
    if (u.lastCheckin && now - u.lastCheckin > DAY * 2) u.streak = 0;
    u.streak += 1;
    u.lastCheckin = now;
    const reward = 30000 + u.streak * 5000;
    u.balance += reward;
    saveData();
    reply(`📅 ĐIỂM DANH THÀNH CÔNG! Ngày thứ ${u.streak}\nNhận: ${formatVnd(reward)}\n💰 Số dư: ${formatVnd(u.balance)}`);
    return;
  }

  // ===== CAU CA / TRONG CAY =====
  if (lower === '!fish' || lower === '!cauca') {
    const cd = checkCooldown(senderID + '_fish', 120);
    if (cd > 0) { reply(`🎣 Cho ${Math.ceil(cd / 60)} phút nữa mới câu được.`); return; }
    const u = getUser(senderID);
    const r = Math.random();
    let earn = 0, msg = '🎣 Bạn đã đi câu cá...\n';
    if (r < 0.3) { msg += '😢 Không câu được con nào!'; }
    else if (r < 0.8) { earn = 5000 + Math.floor(Math.random() * 10001); msg += `🐟 Câu được cá nhỏ! +${formatVnd(earn)}`; }
    else if (r < 0.95) { earn = 20000 + Math.floor(Math.random() * 30001); msg += `🐠 Câu được cá to! +${formatVnd(earn)}`; }
    else { earn = 100000 + Math.floor(Math.random() * 100001); msg += `✨ CÂU ĐƯỢC CÁ VÀNG! +${formatVnd(earn)}`; }
    u.balance += earn;
    addExp(u, 5);
    let qmsg5 = addQuestProgress(u, 'fish', 1);
    saveData();
    msg += `\n💰 Số dư: ${formatVnd(u.balance)}`;
    reply(msg);
    return;
  }
  if (lower === '!farm' || lower === '!trongcay') {
    const cd = checkCooldown(senderID + '_farm', 180);
    if (cd > 0) { reply(`🌱 Cho ${Math.ceil(cd / 60)} phút nữa mới thu hoạch được.`); return; }
    const u = getUser(senderID);
    const r = Math.random();
    let earn = 0, msg = '🌱 Bạn đã thu hoạch vườn cây...\n';
    if (r < 0.2) { msg += '🥀 Cây bị sâu ăn, mất trắng!'; }
    else if (r < 0.75) { earn = 10000 + Math.floor(Math.random() * 20001); msg += `🍚 Thu hoạch lúa/rau! +${formatVnd(earn)}`; }
    else { earn = 40000 + Math.floor(Math.random() * 60001); msg += `🍉 Thu hoạch được quả ngon! +${formatVnd(earn)}`; }
    u.balance += earn;
    saveData();
    msg += `\n💰 Số dư: ${formatVnd(u.balance)}`;
    reply(msg);
    return;
  }

  // ===== QUAY XÈNG =====
  if (lower.startsWith('!slot')) {
    const cd = checkCooldown(senderID, 5);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa mới quay được.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 2) { reply('Cú pháp: !slot <cược>\nVd: !slot 10k'); return; }
    const { bet, error } = parseBet(parts, getUser(senderID));
    if (error) { reply(error); return; }
    const u = getUser(senderID);
    u.balance -= bet;
    const syms = ['🍒', '🍋', '🍇', '⭐', '💎', '7️⃣'];
    const spin = [syms[Math.floor(Math.random() * 6)], syms[Math.floor(Math.random() * 6)], syms[Math.floor(Math.random() * 6)]];
    let payout = 0, msg = `🎰 QUAY XÈNG\n${spin.join(' | ')}\nCược: ${formatVnd(bet)}\n`;
    if (spin[0] === spin[1] && spin[1] === spin[2]) {
      payout = bet * 10;
      msg += `🎉 JACKPOT 3 GIỐNG NHAU! Nhận ${formatVnd(payout)}`;
    } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
      payout = bet * 2;
      msg += `😊 Trúng 2 ô! Nhận ${formatVnd(payout)}`;
    } else {
      msg += `😢 Không trúng. Mất ${formatVnd(bet)}`;
    }
    u.balance += payout;
    if (payout > 0) u.wins++; else u.losses++;
    addExp(u, payout > 0 ? 10 : 2);
    let qmsg3 = addQuestProgress(u, 'slot', 1);
    if (payout > 0) qmsg3 += addQuestProgress(u, 'win', 1);
    saveData();
    msg += `\n💰 Số dư: ${formatVnd(u.balance)}`;
    const slotGif = path.join(__dirname, 'slot_spin.gif');
    const loading = { body: '🎰 ĐANG QUAY XÈNG... May mắn đang đến!', noAck: true };
    if (fs.existsSync(slotGif)) loading.attachment = fs.createReadStream(slotGif);
    api.sendMessage(loading, threadID, err => err && console.error('❌ Lỗi gửi GIF Slot:', err.message || err));
    setTimeout(() => reply(msg), 2300);
    return;
  }

  // ===== XỔ SỐ =====
  if (lower.startsWith('!lotto')) {
    const cd = checkCooldown(senderID, 5);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa mới chơi được.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 3) { reply('Cú pháp: !lotto <so 00-99> <cược>\nVd: !lotto 69 10k'); return; }
    const guess = parseInt(parts[1], 10);
    if (isNaN(guess) || guess < 0 || guess > 99) { reply('Số phải từ 00 đến 99.'); return; }
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
    reply(`🎯 XỔ SỐ\nBạn đoán: ${String(guess).padStart(2, '0')} - Cược: ${formatVnd(bet)}\nKết quả: ${String(draw).padStart(2, '0')}\n` +
      (win ? `🎉 TRÚNG ĐỘC ĐẮC! Nhận ${formatVnd(payout)}\n💰 Số dư: ${formatVnd(u.balance)}` : `😢 Không trúng. Mất ${formatVnd(bet)}\n💰 Số dư: ${formatVnd(u.balance)}`));
    return;
  }

  // ===== LI XI =====
  if (lower.startsWith('!lixi')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      // Bot lì xì mien phi cho nhóm
      const amount = 10000 + Math.floor(Math.random() * 20001);
      activeLixi[threadID] = { amount, creatorID: 'bot', expiresAt: Date.now() + 60000 };
      reply(`🧧 BOT LI XI ${formatVnd(amount)}! Ai nhanh tay gõ !nhận trước thì được! (hết hạn sau 60s)`);
      return;
    }
    const amount = parseAmountInput(parts[1], u.balance);
    if (isNaN(amount) || amount <= 0) { reply('Số tiền lì xì phải > 0. Vd: !lixi 50000'); return; }
    const u = getUser(senderID);
    if (amount > u.balance) { reply(`Không đủ VNĐ! Số dư: ${formatVnd(u.balance)}`); return; }
    if (activeLixi[threadID] && Date.now() < activeLixi[threadID].expiresAt) {
      reply('Đã có lì xì đang chờ, cho người ta nhận xong hoặc hết hạn mới thả tiếp.');
      return;
    }
    u.balance -= amount;
    activeLixi[threadID] = { amount, creatorID: senderID, expiresAt: Date.now() + 60000 };
    saveData();
    reply(`🧧 Đã thả lì xì ${formatVnd(amount)}! Ai nhanh tay gõ !nhận trước thì được! (hết hạn sau 60s)`);
    return;
  }
  if (lower === '!nhận') {
    const lixi = activeLixi[threadID];
    if (!lixi || Date.now() > lixi.expiresAt) { reply('Không có lì xì nào đang chờ.'); return; }
    if (String(lixi.creatorID) === String(senderID)) { reply('Bạn là người thả lì xì, không thể tự nhận đâu!'); return; }
    const u = getUser(senderID);
    u.balance += lixi.amount;
    addExp(u, 5);
    let qmsg9 = addQuestProgress(u, 'lixi', 1);
    saveData();
    reply(`🧧 Chúc mừng bạn nhận được lì xì ${formatVnd(lixi.amount)}!\n💰 Số dư: ${formatVnd(u.balance)}`);
    delete activeLixi[threadID];
    return;
  }

  // ===== DO VUI / QUIZ =====
  if (lower === '!quiz') {
    if (activeQuiz[threadID] && Date.now() < activeQuiz[threadID].expiresAt) {
      reply('Đã có câu hỏi đang chờ, trả lời đúng để nhận thưởng nhé!');
      return;
    }
    const q = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
    const reward = 20000;
    activeQuiz[threadID] = { question: q.q, answer: normalize(q.a), reward, expiresAt: Date.now() + 60000 };
    reply(`🧠 ĐỐ VUI CÓ THƯỞNG ${formatVnd(reward)}!\n${q.q}\nTrả lời đúng đầu tiên (go đáp án, không cần dấu !) sẽ được thưởng! (60s)`);
    return;
  }
  // Kiểm tra trả lời quiz (tin nhắn không có dấu !)
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
      reply(`🎉 Chính xác! Bạn nhận được ${formatVnd(quiz.reward)}!\nĐáp án: ${quiz.answer}\n💰 Số dư: ${formatVnd(u.balance)}`);
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
      '• !kick @tên - Kick khỏi nhóm (nếu bot là admin nhóm)\n' +
      '• !setbd @tên <biệt danh> - Đặt biệt danh\n• !setbd @tên clear - Xóa biệt danh\n' +
      '• !ban @tên / !unban @tên - Cấm bot / Gỡ cấm\n' +
      '• !mute @tên <phút> / !unmute @tên - Tắt tiếng tam thôi\n' +
      '• !warn @tên - Cảnh cáo (3 lần = mute 10 phút)\n' +
      '• !give @tên <tiền> - Tặng tiền\n• !reset @tên - Reset tiền về 100.000\n' +
      '• !stats - Thong ke nhóm\n• !settitle <tên mới> - Doi tên nhóm\n' +
      '• !color <mã màu> - Doi màu nhóm (vd: !color #FF0000)\n' +
      '• !emoji <emoji> - Doi emoji nhóm');
    return;
  }
  if (lower === '!admins') {
    if (!admins.length) { reply('Chưa có admin nào. Hãy thêm admin qua biến ADMIN_IDS tren Botkeep (gõ !id để lấy ID).'); return; }
    reply('🛡️ DANH SACH ADMIN:\n' + admins.map(id => '• ...' + String(id).slice(-6)).join('\n'));
    return;
  }
  if (lower.startsWith('!addadmin')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới thêm được admin. Admin đầu tiên phải thêm qua biến ADMIN_IDS tren Botkeep.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cú pháp: !addadmin @tên'); return; }
    if (isAdmin(target)) { reply('Người này đã là admin rồi.'); return; }
    admins.push(String(target));
    saveData();
    reply(`🛡️ Đã thêm admin: ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!deladmin')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới xóa được admin.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cú pháp: !deladmin @tên'); return; }
    admins = admins.filter(id => String(id) !== String(target));
    saveData();
    reply(`Đã xóa admin: ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!kick')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới kick được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cú pháp: !kick @tên'); return; }
    if (String(target) === String(senderID)) { reply('Không thể tự kick chính mình!'); return; }
    // Thử kick thật khỏi nhóm nếu API hỗ trợ, đồng thời cấm khỏi bot.
    getUser(target).banned = true;
    saveData();
    if (api.removeUserFromGroup) {
      api.removeUserFromGroup(threadID, target, (err) => {
        if (err) reply(`Đã cấm khỏi bot: ${getMentionName() || target} (không kick được khỏi nhóm thật: ${err.message || err})`);
        else reply(`👢 Đã kick ${getMentionName() || target} khỏi nhóm!`);
      });
    } else {
      reply(`👢 Đã cấm ${getMentionName() || target} khỏi bot (bot không có quyền kick thật khỏi nhóm).`);
    }
    return;
  }
  if (lower.startsWith('!setbd')) {
    if (!isSenderAdmin) { reply('Chỉ admin bot mới được đặt biệt danh.'); return; }
    const target = getMentionID();
    if (!target || !event.mentions || event.mentions.length === 0) {
      reply('Cú pháp: !setbd @tên <biệt danh mới>\nXóa biệt danh: !setbd @tên clear');
      return;
    }
    const mentionName = getMentionName();
    let nickname = text.slice('!setbd'.length).trim();
    // Xóa phần @tên khỏi câu lệnh, giữ nguyên dấu và khoảng trắng của biệt danh.
    if (mentionName) {
      const atName = '@' + mentionName;
      nickname = nickname.replace(atName, '').trim();
      if (nickname === text.slice('!setbd'.length).trim()) nickname = nickname.replace(mentionName, '').trim();
    }
    if (!nickname) {
      reply('Bạn chưa nhập biệt danh.\nVí dụ: !setbd @Nguyễn Mèo lười');
      return;
    }
    const clear = ['clear', 'xoa', 'xóa', 'none', 'reset'].includes(normalize(nickname));
    const newNickname = clear ? '' : nickname.slice(0, 80);
    if (typeof api.changeNickname !== 'function') {
      reply('Phiên bản API hiện tại không hỗ trợ đổi biệt danh.');
      return;
    }
    api.changeNickname(newNickname, threadID, target, err => {
      if (err) {
        reply(`❌ Không đổi được biệt danh. Hãy kiểm tra quyền của tài khoản bot.\nLỗi: ${err.message || err}`);
      } else if (clear) {
        reply(`✅ Đã xóa biệt danh của ${mentionName || ('...' + String(target).slice(-6))}.`);
      } else {
        reply(`✅ Đã đặt biệt danh của ${mentionName || ('...' + String(target).slice(-6))} thành “${newNickname}”.`);
      }
    });
    return;
  }
  if (lower.startsWith('!ban') || lower.startsWith('!bạn')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới bạn được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cú pháp: !bạn @tên'); return; }
    getUser(target).banned = true;
    saveData();
    reply(`🚫 Đã cấm ${getMentionName() || ('...' + String(target).slice(-6))} khỏi bot.`);
    return;
  }
  if (lower.startsWith('!unban')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới gỡ cấm được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cú pháp: !unban @tên'); return; }
    getUser(target).banned = false;
    saveData();
    reply(`✅ Đã gỡ cấm ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!mute')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới mute được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cú pháp: !mute @tên <phút>\nVd: !mute @TenBan 5'); return; }
    const parts = text.split(/\s+/);
    let minutes = 5;
    for (const part of parts) { const n = parseInt(part, 10); if (!isNaN(n) && n > 0 && n < 10080) { minutes = n; break; } }
    getUser(target).mutedUntil = Date.now() + minutes * 60 * 1000;
    saveData();
    reply(`🔇 Đã tắt tiếng ${getMentionName() || ('...' + String(target).slice(-6))} trong ${minutes} phút.`);
    return;
  }
  if (lower.startsWith('!unmute')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới unmute được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cú pháp: !unmute @tên'); return; }
    getUser(target).mutedUntil = 0;
    saveData();
    reply(`🔊 Đã bỏ tắt tiếng ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!warn')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới warn được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cú pháp: !warn @tên'); return; }
    const tu = getUser(target);
    tu.warns += 1;
    let msg = `⚠️ Đã cảnh cáo ${getMentionName() || ('...' + String(target).slice(-6))} lần ${tu.warns}/3`;
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
    if (!target) { reply('Cú pháp: !give @tên <tiền>\nVd: !give @TenBan 50000'); return; }
    const parts = text.split(/\s+/);
    let amount = null;
    for (const part of parts) { const n = parseAmountInput(part); if (n > 0) { amount = n; break; } }
    if (!amount) { reply('Số tiền phải > 0.'); return; }
    getUser(target).balance += amount;
    saveData();
    reply(`🎁 Admin đã tặng ${formatVnd(amount)} cho ${getMentionName() || ('...' + String(target).slice(-6))}`);
    return;
  }
  if (lower.startsWith('!reset')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới reset được.'); return; }
    const target = getMentionID();
    if (!target) { reply('Cú pháp: !reset @tên'); return; }
    getUser(target).balance = START_BALANCE;
    saveData();
    reply(`🔄 Đã đặt lại tiền của ${getMentionName() || ('...' + String(target).slice(-6))} về ${formatVnd(START_BALANCE)}`);
    return;
  }
  if (lower === '!stats') {
    const totalUsers = Object.keys(users).length;
    const totalMoney = Object.values(users).reduce((s, u) => s + (u.balance || 0), 0);
    const totalWins = Object.values(users).reduce((s, u) => s + (u.wins || 0), 0);
    const totalLosses = Object.values(users).reduce((s, u) => s + (u.losses || 0), 0);
    reply(`📊 THỐNG KÊ NHÓM:\n• Tổng người chơi: ${totalUsers}\n• Tổng tiền lưu thông: ${formatVnd(totalMoney)}\n• Tổng ván thắng: ${totalWins}\n• Tổng ván thua: ${totalLosses}\n• Số admin: ${admins.length}\n• Lịch sử Tài Xỉu: ${taixiuHistory.length} ván`);
    return;
  }
  if (lower.startsWith('!settitle')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới đổi tên nhóm được.'); return; }
    const newTitle = text.slice(10).trim();
    if (!newTitle) { reply('Cú pháp: !settitle <tên mới>'); return; }
    if (api.setTitle) {
      api.setTitle(newTitle, threadID, (err) => {
        reply(err ? `Không đổi được tên nhóm: ${err.message || err}` : `✅ Đã đổi tên nhóm thành: ${newTitle}`);
      });
    } else {
      reply('Bot không ho tro đổi tên nhóm.');
    }
    return;
  }
  if (lower.startsWith('!color')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới đổi màu được.'); return; }
    const color = text.slice(6).trim();
    if (!color) { reply('Cú pháp: !color <mã màu>\nVd: !color #FF0000'); return; }
    if (api.changeThreadColor) {
      api.changeThreadColor(color, threadID, (err) => {
        reply(err ? `Không đổi được màu: ${err.message || err}` : `🎨 Đã đổi màu nhóm thành ${color}`);
      });
    } else {
      reply('Bot không ho tro đổi màu nhóm.');
    }
    return;
  }
  if (lower.startsWith('!emoji')) {
    if (!isSenderAdmin) { reply('Chỉ admin mới đổi emoji được.'); return; }
    const emoji = text.slice(6).trim();
    if (!emoji) { reply('Cú pháp: !emoji <emoji>\nVd: !emoji 🔥'); return; }
    if (api.changeThreadEmoji) {
      api.changeThreadEmoji(emoji, threadID, (err) => {
        reply(err ? `Không đổi được emoji: ${err.message || err}` : `✅ Đã đổi emoji nhóm thành ${emoji}`);
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
    reply(`╭─── ⭐ HỒ SƠ CẤP ĐỘ ───╮\n│ Cấp: ${u.level}\n│ EXP: ${u.exp}/${need}\n│ ${progressBar(u.exp, need)}\n│ 💰 Số dư: ${formatVnd(u.balance)}\n│ 🎁 Lên cấp: +${formatVnd(u.level * 10000)}\n╰────────────────────╯`);
    return;
  }
  if (lower === '!rank') {
    const sorted = Object.entries(users).sort((a, b) => (b[1].level - a[1].level) || (b[1].exp - a[1].exp)).slice(0, 10);
    if (!sorted.length) { reply('Chưa có ai có cấp độ.'); return; }
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
      msg += `${q.done ? '✅' : '⬜'} ${i + 1}. ${q.desc} (${q.progress}/${q.target}) - ${formatVnd(q.reward)}\n`;
    });
    msg += '\nLàm nhiệm vụ để nhận tiền! Nhiệm vụ mới mỗi ngày.';
    reply(msg);
    return;
  }

  // ===== DOAN SO =====
  if (lower.startsWith('!guess')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      if (activeGuess[senderID]) {
        reply(`🎯 Bạn đang đoán so 1-100. Đã đoán ${activeGuess[senderID].attempts} lần. Gõ !guess <số> để đoán tiếp!`);
      } else {
        activeGuess[senderID] = { number: 1 + Math.floor(Math.random() * 100), attempts: 0 };
        reply('🎯 BẮT ĐẦU ĐOÁN SỐ!\nMình vừa nghĩ 1 số từ 1 đến 100.\nGõ !guess <số> để đoán, ví dụ: !guess 50');
      }
      return;
    }
    const guess = parseInt(parts[1], 10);
    if (isNaN(guess) || guess < 1 || guess > 100) { reply('Số phải từ 1 đến 100.'); return; }
    if (!activeGuess[senderID]) {
      activeGuess[senderID] = { number: 1 + Math.floor(Math.random() * 100), attempts: 0 };
      reply('🎯 Bắt đầu ván mới! Mình vừa nghĩ 1 số từ 1 đến 100. Gõ !guess <số> để đoán!');
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
      reply(`🎉 ĐOÁN ĐÚNG SỐ ${game.number} SAU ${game.attempts} LAN DOAN!\nNhận: ${formatVnd(reward)} + 20 EXP${qmsg}\n💰 Số dư: ${formatVnd(u.balance)}`);
      delete activeGuess[senderID];
    } else if (guess < game.number) {
      reply(`⬆️ Số bạn đoán nhỏ hơn! Đã đoán ${game.attempts} lần. Đoán tiếp đi!`);
    } else {
      reply(`⬇️ Số bạn đoán lớn hơn! Đã đoán ${game.attempts} lần. Đoán tiếp đi!`);
    }
    return;
  }

  // ===== GAME PHẢN XẠ =====
  if (lower === '!reaction') {
    if (activeReaction[threadID] && Date.now() < activeReaction[threadID].expiresAt) {
      reply('Đã có ván phản xạ đang chờ, cho ván này xong nhé!');
      return;
    }
    activeReaction[threadID] = { state: 'waiting', goTime: 0, expiresAt: Date.now() + 15000 };
    reply('⚡ GAME PHẢN XẠ!\nSẵn sàng chưa? Chờ xíu...\nKhi thấy chữ GO thì gõ !go thật nhanh!');
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
    if (!game) { reply('Chưa có ván phản xạ nao. Gõ !reaction để bắt đầu!'); return; }
    if (game.state === 'waiting') {
      reply('⏳ Chưa GO mà! Bạn go quá nhanh, bị loại ván này!');
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
    reply(`⚡ ${String(senderID).slice(-6)}... phản xạ trong ${(ms / 1000).toFixed(2)}s! Nhận ${formatVnd(reward)}\n💰 Số dư: ${formatVnd(u.balance)}`);
    delete activeReaction[threadID];
    return;
  }

  // ===== AI LÀ TRIỆU PHÚ =====
  if (lower === '!trieuphu') {
    if (activeTrieuphu[senderID]) {
      const g = activeTrieuphu[senderID];
      reply(`🎓 Bạn đang chơi Triệu Phú ở câu ${g.step + 1}/5.\nCâu hỏi: ${g.questions[g.step].q}\nTrả lời đúng (go đáp án, không cần dấu !) để qua câu!`);
      return;
    }
    const shuffled = [...TRIEUPHU_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
    activeTrieuphu[senderID] = { step: 0, questions: shuffled, earned: 0 };
    reply(`🎓 AI LÀ TRIỆU PHÚ!\nTrả lời đúng 5 câu liên tiếp để nhận tổng ${formatVnd(TRIEUPHU_REWARDS.reduce((a, b) => a + b, 0))}!\n\nCâu 1/5 (${formatVnd(TRIEUPHU_REWARDS[0])}): ${shuffled[0].q}\nTrả lời đúng (go đáp án) để qua câu!`);
    return;
  }
  // Kiểm tra trả lời Triệu Phú (tin nhắn không có dấu !)
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
        reply(`🎉 CHÚC MỪNG BẠN LÀ TRIỆU PHÚ!\nBạn đã trả lời đúng 5/5 câu!\nTổng nhận: ${formatVnd(g.earned)}\n💰 Số dư: ${formatVnd(u.balance)}`);
        delete activeTrieuphu[senderID];
      } else {
        reply(`✅ Đúng rồi! +${formatVnd(reward)} (tổng đã nhận: ${formatVnd(g.earned)})\n\nCâu ${g.step + 1}/5 (${formatVnd(TRIEUPHU_REWARDS[g.step])}): ${g.questions[g.step].q}`);
      }
      return;
    } else {
      const u = getUser(senderID);
      reply(`❌ Sai rồi! Đáp án la: ${current.a}\nBan đúng ở câu ${g.step + 1}/5, đã nhận được ${formatVnd(g.earned)}. Go !trieuphu để chơi lại!`);
      delete activeTrieuphu[senderID];
      return;
    }
  }

  // ===== TÀI XỈU =====
  if (lower.startsWith('!taixiu')) {
    const cd = checkCooldown(senderID, 3);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa mới chơi được.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 3) { reply('Cú pháp: !taixiu <tai|xiu|so> <cược>\nVd: !taixiu tai 10k\nVd: !taixiu 11 100 (đoán tổng = 11)'); return; }
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
      msg = `🎲 TÀI XỈU\nXúc xắc: ${dice.join(' - ')} = ${sum} => ${result.toUpperCase()}${isTriple ? ' (BỘ BAO - tính XỈU)' : ''}\nBạn cược: ${choiceRaw.toUpperCase()} ${formatVnd(bet)}\n`;
    } else if (!isNaN(parseInt(choiceRaw, 10))) {
      const guess = parseInt(choiceRaw, 10);
      if (guess < 3 || guess > 18) { u.balance += bet; reply('Tổng phải từ 3 đến 18. Đã hoàn VNĐ.'); return; }
      win = (guess === sum);
      payout = win ? bet * 5 : 0;
      msg = `🎲 TÀI XỈU (đoán tổng)\nXúc xắc: ${dice.join(' - ')} = ${sum}\nBạn đoán: ${guess} - Cược: ${formatVnd(bet)}\n`;
    } else {
      u.balance += bet;
      reply('Lựa chọn phải là: tai / xiu / so (3-18). Đã hoàn VNĐ.');
      return;
    }
    u.balance += payout;
    if (win) u.wins++; else u.losses++;
    addExp(u, win ? 10 : 2);
    let qmsg = addQuestProgress(u, 'taixiu', 1);
    if (win) qmsg += addQuestProgress(u, 'win', 1);
    saveData();
    msg += win ? `🎉 THẮNG! Nhận ${formatVnd(payout)}\n💰 Số dư: ${formatVnd(u.balance)}` : `😢 THUA! Mất ${formatVnd(bet)}\n💰 Số dư: ${formatVnd(u.balance)}`;
    reply(msg);
    return;
  }

  // ===== BẦU CUA CÁ TÔM =====
  if (lower.startsWith('!baucua')) {
    const BAU_CUA_IMG = path.join(__dirname, 'baucua.jpg');
    const sendWithImage = (msg) => {
      if (fs.existsSync(BAU_CUA_IMG)) {
        api.sendMessage({ body: msg, attachment: fs.createReadStream(BAU_CUA_IMG) }, threadID, (err) => {
          if (err) { console.error('❌ Lỗi gửi ảnh Bầu Cua:', err.message || err); reply(msg); }
        });
      } else {
        reply(msg);
      }
    };
    const cd = checkCooldown(senderID, 3);
    if (cd > 0) { reply(`⏳ Cho ${cd}s nữa mới chơi được.`); return; }
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      sendWithImage('🦀 BẦU CUA CÁ TÔM\nCú pháp: !baucua <bau|của|tom|ca|ga|nai> <cược>\nVd: !baucua cua 10k\nVd: !baucua tom 200');
      return;
    }
    const choice = normalize(parts[1]);
    const valid = ['bau', 'của', 'tom', 'ca', 'ga', 'nai'];
    if (!valid.includes(choice)) { reply('Lựa chọn phải là: bau / của / tom / ca / ga / nai'); return; }
    const { bet, error } = parseBet(parts, getUser(senderID));
    if (error) { reply(error); return; }
    const u = getUser(senderID);
    u.balance -= bet;

    const faces = ['bau', 'của', 'tom', 'ca', 'ga', 'nai'];
    const icons = { bau: '🍐 Bầu', của: '🦀 Cua', tom: '🦐 Tôm', ca: '🐟 Cá', ga: '🐓 Gà', nai: '🦌 Nai' };
    const dice = [faces[Math.floor(Math.random() * 6)], faces[Math.floor(Math.random() * 6)], faces[Math.floor(Math.random() * 6)]];
    const count = dice.filter(d => d === choice).length;
    const payout = count === 0 ? 0 : bet * (count + 1); // 1 con nhận 2x, 2 con nhận 3x, 3 con nhận 4x
    u.balance += payout;
    if (count > 0) u.wins++; else u.losses++;
    addExp(u, count > 0 ? 10 : 2);
    let qmsg2 = addQuestProgress(u, 'baucua', 1);
    if (count > 0) qmsg2 += addQuestProgress(u, 'win', 1);
    saveData();

    let msg = `🦀 BẦU CUA CÁ TÔM\nXúc xắc: ${dice.map(d => icons[d]).join(' - ')}\nBạn cược: ${icons[choice]} ${formatVnd(bet)}\n`;
    msg += count === 0 ? `😢 Không trúng con nào! Mất ${formatVnd(bet)}\n💰 Số dư: ${formatVnd(u.balance)}`
      : `🎉 Trúng ${count} con! Nhận ${formatVnd(payout)}\n💰 Số dư: ${formatVnd(u.balance)}`;
    sendWithImage(msg);
    return;
  }

  // ===== SOI CẦU (chỉ thống kê lịch sử bot, không đủ đoán được kết quả thật) =====
  if (lower === '!soicau' || lower === '!câu' || lower === '!history') {
    if (!taixiuHistory.length) { reply('Chưa có lịch sử ván Tài Xỉu nào. Chờ người chơi vài ván rồi soi nhé!'); return; }
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
      `20 ván gần nhất (mới nhất bên trái):\n${str}\n\n` +
      `Tổng ${taixiuHistory.length} ván:\n• Tài: ${taiCount} (${taiPct}%)\n• Xỉu: ${xiuCount} (${100 - taiPct}%)\n` +
      `Cầu hiện tại: ${lastResult} x${streak} liên tiếp\n\n` +
      `⚠️ Đây chỉ là thống kê lịch sử ngẫu nhiên của bot, KHÔNG dự đoán được kết quả thật ở ngoài. Đừng dùng để chơi cờ bạc thật!`);
    return;
  }

  // Không phải lệnh thi không trả lời (tránh spam nhóm)
}

// ===== DANG NHAP VA CHAY BOT =====
async function main() {
  let login;
  try {
    login = require('orion-fca');
  } catch (e) {
    console.error('❌ Chưa cai thứ vien. Hãy chay npm install trước.');
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
      console.error('💡 Mẹo: Cookie hết hạn? Hãy lấy lại APPSTATE mới. Acc bi checkpoint? Hãy đổi acc phu khác.');
      // Cho 60s mới thoát để giảm số lần thứ login liên tục (do bị Facebook quét)
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
        console.log('💾 Đã lưu appstate.json (nếu Botkeep có persistent volume thì lần sau sẽ dùng lại được)');
      }
    } catch (e) {
      console.log('⚠️ Không lưu được appstate:', e.message);
    }

    api.setOptions({ listenEvents: true });

    api.listenMqtt((listenErr, event) => {
      if (listenErr) {
        console.error('❌ Lỗi listen:', listenErr.message || listenErr);
        console.error('💡 Orion MQTT chưa kết nối được. Dừng bot và kiểm tra phiên Facebook; không Restart liên tục.');
        return;
      }
      if (!event) return;
      if (event.type === 'ready') {
        console.log('✅ MQTT đã kết nối! Bot sẵn sàng nhận lệnh trong nhóm + inbox.');
        return;
      }
      if (event.type === 'mqtt_status') {
        const extra = event.error ? ` — ${event.error}` : '';
        console.log(`📡 MQTT ${event.status}${event.endpoint ? ` (${event.endpoint})` : ''}${extra}`);
        return;
      }

      // Chào mừng / tạm biệt khi có người vào / rồi khỏi nhóm
      if (event.type === 'event') {
        try {
          if (event.logMessageType === 'log:subscribe') {
            const names = (event.addedParticipants || []).map(p => p.name || p.id).join(', ') || 'bạn mới';
            api.sendMessage(`👋 Chào mừng ${names} đã tham gia nhóm! Gõ !help để xem lệnh, !daily để nhận tiền.`, event.threadID);
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

      // Xu ly lệnh bắt đầu bang ! HOAC trả lời quiz đang chờ
      const isCommand = event.body.trim().startsWith('!');
      const hasQuiz = activeQuiz[event.threadID] && Date.now() < activeQuiz[event.threadID].expiresAt;
      const hasTrieuphu = activeTrieuphu[event.senderID];
      if (isCommand || hasQuiz || hasTrieuphu) {
        handleCommand(api, event);
      }
    });

    console.log('⏳ Đã đăng nhập, đang chờ kết nối MQTT...');
    console.log('💡 Chỉ khi thấy “MQTT đã kết nối” thì bot mới thật sự nhận được lệnh.');
  });
}

if (String(process.env.BOT_DISABLED || '').toLowerCase() === 'true') {
  console.log('⏸️ BOT_DISABLED=true — chỉ chạy health-check, chưa đăng nhập Facebook.');
} else {
  main();
}
