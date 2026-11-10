# 🤖 Bot Messenger Nick Cá Nhân (FCA) - Vào Nhóm Chat

Bot này dùng **tài khoản Facebook cá nhân** (không phải Page) nên **vào được nhóm chat Messenger** như người thật.

> ⚠️ **CẢNH BÁO QUAN TRỌNG:**
> - Đây là API không chính thức, vi phạm điều khoản của Meta. Acc có thể bị khóa / checkpoint bất cứ lúc nào.
> - **Tuyệt đối dùng acc phụ (acc clone), KHÔNG dùng acc chính của bạn.**
> - Không share cookie / appstate cho ai. Ai có cookie là điều khiển được acc đó.

---

## Bot này làm được gì?
- Vào nhóm chat Messenger, trả lời các lệnh: `!help`, `!ping`, `!time`, `!echo`, `!joke`, `!hi`, `!info`
- Chỉ trả lời khi có dấu `!` để tránh spam nhóm
- Chạy 24/7 trên Botkeep.cloud

### 🎮 Trò chơi VNĐ ảo (giải trí, không dùng tiền thật)
> ⚠️ Chỉ dùng VNĐ ảo trong bot để chơi vui với bạn bè. Không dùng để chơi cờ bạc thật (bất hợp pháp ở Việt Nam).

- `!balance` - Xem số dư (người mới có sẵn 100.000 VNĐ)
- `!daily` - Nhận 50.000 VNĐ mỗi ngày
- `!diemdanh` - Điểm danh theo streak (30.000 + 5.000/ngày streak)
- `!work` - Làm việc nhận 5.000-20.000 VNĐ (chờ 60 giây)
- `!fish` - Đi câu cá (chờ 120 giây, trúng cá vàng ăn lớn)
- `!farm` - Trồng cây thu hoạch (chờ 180 giây)
- `!taixiu <tai|xiu|so> <cuoc>` - Tài Xỉu: `!taixiu tai 10000`, `!taixiu xiu 20000`, `!taixiu 11 10000` (đoán tổng = 11, ăn 1 ăn 5)
- `!baucua <bau|cua|tom|ca|ga|nai> <cuoc>` - Bầu Cua Cá Tôm: `!baucua cua 10000` (trúng 1 con ăn 2x, 2 con ăn 3x, 3 con ăn 4x, kèm ảnh bàn Bầu Cua)
- `!slot <cuoc>` - Quay xèng: `!slot 10000` (3 giống nhau ăn 10x, 2 giống nhau ăn 2x)
- `!lotto <so 00-99> <cuoc>` - Xổ số: `!lotto 69 10000` (trúng ăn 50x)
- `!lixi <tien>` - Thả lì xì, người khác gõ `!nhan` để nhận (hết hạn 60s). Gõ `!lixi` không kèm tiền thì bot lì xì miễn phí
- `!quiz` - Đố vui có thưởng 20.000 VNĐ (trả lời đúng đầu tiên, không cần dấu !)
- `!soicau` - Xem lịch sử 20 ván Tài Xỉu gần nhất + thống kê % Tài/Xỉu + cầu hiện tại (chỉ thống kê ván của bot, không dự đoán được kết quả thật)
- `!bank <so tien> @ten` - Chuyển tiền cho người khác: `!bank 50000 @TenBan`
- `!top` - Bảng xếp hạng đại gia trong nhóm
- Tự động chào mừng khi có người mới vào nhóm / tạm biệt khi rời nhóm

### 🛡️ Chức năng Admin (chỉ admin mới dùng được, gõ `!adminhelp`)

**Cách làm admin KHÔNG cần gõ lệnh trong nhóm (khuyên dùng):**
1. Trong nhóm, gõ `!id` → bot trả lời ID số của bạn (ví dụ: `1234567890123`)
2. Vào Botkeep → tab **Environment** → thêm biến:
   - **Key:** `ADMIN_IDS`
   - **Value:** ID số vừa lấy (nhiều admin thì cách nhau bằng dấu phẩy: `id1,id2`)
3. **Restart** server → bạn tự động là admin, không cần gõ `!addadmin` nữa

> Link share Facebook không chứa ID số, nên phải dùng lệnh `!id` để lấy ID số nhé.
- `!addadmin @ten` / `!deladmin @ten` / `!admins` - Thêm/xóa/xem danh sách admin (**chỉ admin mới dùng được**, admin đầu tiên phải thêm qua biến `ADMIN_IDS`)
- `!kick @ten` - Kick khỏi nhóm (nếu bot là admin nhóm) + ban khỏi bot
- `!ban @ten` / `!unban @ten` - Cấm bot / gỡ cấm
- `!mute @ten <phút>` / `!unmute @ten` - Tắt tiếng tạm thời
- `!warn @ten` - Cảnh cáo (3 lần = mute 10 phút)
- `!give @ten <tiền>` - Tặng tiền, `!reset @ten` - Reset tiền về 100.000 VNĐ
- `!stats` - Thống kê nhóm, `!settitle <tên>` - Đổi tên nhóm, `!color <màu>` - Đổi màu nhóm, `!emoji <emoji>` - Đổi emoji nhóm

### Chống spam / đỡ bị Facebook quét + chạy nhẹ trên gói free Botkeep
- Chỉ trả lời lệnh có dấu `!`, cooldown từng lệnh (3-180 giây), delay ngẫu nhiên 0.4-1s + typing indicator cho giống người
- Không tự nhắn trước, không spam, giới hạn lịch sử Tài Xỉu 100 ván, không thêm thư viện nặng
- Đăng nhập lỗi thì chờ 60s mới thoát (không thử login liên tục), dùng cookie APPSTATE thay vì email/password
- Code nhẹ, 1 process duy nhất, RAM khoảng 100-200MB, chạy tốt trên gói free 512MB-2GB của Botkeep

---

## PHẦN 1: Chuẩn bị acc phụ

1. Tạo 1 acc Facebook phụ (acc clone) - dùng SĐT / email phụ, đừng dùng acc chính
2. Acc phụ phải kết bạn với bạn (acc chính) để thêm vào nhóm được
3. **Thêm acc phụ vào nhóm chat:**
   - Mở nhóm chat Messenger trên điện thoại / máy tính
   - Bấm **Thêm thành viên** → tìm tên acc phụ → Thêm
   - Acc phụ phải **chấp nhận / tham gia** nhóm (mở Messenger của acc phụ để xác nhận nếu cần)

> 💡 Nếu nhóm của bạn là nhóm **mã hóa đầu-cuối (E2EE)** mới tạo gần đây, FCA có thể không đọc được tin nhắn. Hãy thử tạo nhóm mới và test trước. Một số bản FCA mới có hỗ trợ E2EE, nhưng vẫn có thể lỗi tùy nhóm.

---

## PHẦN 2: Lấy Cookie (APPSTATE) - chọn 1 trong 3 cách

### Cách 0: KHÔNG CẦN MÁY TÍNH - Lấy cookie thẳng trên Botkeep (khuyên dùng nếu bạn chỉ có điện thoại)

Bạn chỉ cần điện thoại + Botkeep là đủ, không cần PC:

1. Trên Botkeep, tạo 1 project **tạm** (Application → Node.js 24 → ZIP `bot-messenger-fca.zip`)
2. Start Command: `node get-cookie-botkeep.js`
3. Vào **Environment** thêm:
   - `FB_EMAIL` = email acc phụ
   - `FB_PASSWORD` = mật khẩu acc phụ
   - `FB_2FA_SECRET` = mã 2FA (nếu acc có bật 2FA, không có thì để trống)
4. **Start** project tạm, vào tab **Console / Logs**, chờ 1-2 phút
5. Tìm đoạn nằm giữa `===APPSTATE_START===` và `===APPSTATE_END===` → **copy toàn bộ dòng JSON** đó
6. **Xóa project tạm** này đi
7. Dán đoạn JSON vừa copy vào biến `APPSTATE` của project bot chính (Phần 3)

> Cách này dùng chính Botkeep làm "máy tính" để đăng nhập, bạn chỉ cần điện thoại.

### Cách A: Chạy script get-cookie.js trên máy tính (dễ nhất cho người mới)

1. Tải code này về máy tính, mở thư mục `bot-messenger-fca`
2. Cài Node.js (bản 20 hoặc 24) nếu chưa có: https://nodejs.org
3. Mở Terminal / Command Prompt trong thư mục đó, chạy:
   ```
   npm install
   node get-cookie.js
   ```
4. Nhập email + mật khẩu của **acc phụ**, nhập mã 2FA nếu có
5. Nó sẽ tạo file `appstate.json` → copy **toàn bộ** nội dung file đó lại

### Cách B: Lấy cookie bằng trình duyệt
1. Đăng nhập Facebook bằng **acc phụ** trên Chrome máy tính
2. Cài tiện ích **c3c-fbstate** (hoặc tiện ích lấy cookie Facebook tương tự) trên Chrome Web Store
3. Mở facebook.com, bấm vào tiện ích → Copy cookie
4. Dán vào file `appstate.json` theo đúng định dạng JSON

> Chọn Cách A nếu bạn không rành về cookie.

---

## PHẦN 3: Deploy lên Botkeep.cloud

1. Vào https://botkeep.cloud/app → **Create server → Application → Node.js 24**
2. Source: **GitHub** (push code lên repo của bạn) hoặc **ZIP** (upload file zip)
3. Start Command: `npm start`
4. Tạo server, vào tab **Environment**, thêm biến:

   | Tên biến | Giá trị |
   |---|---|
   | `APPSTATE` | Toàn bộ nội dung `appstate.json` bạn vừa lấy (dán nguyên 1 đoạn JSON) |

   > Nếu bạn dùng Cách 2 (email/password) thì thêm `FB_EMAIL`, `FB_PASSWORD`, `FB_2FA_SECRET` thay cho `APPSTATE`. Nhưng cách này dễ bị checkpoint hơn, nên khuyên dùng `APPSTATE`.

5. Bấm **Restart** và xem tab **Console / Logs**:
   - Thấy `✅ Dang nhap thanh cong!` là xong
   - Thấy `❌ Dang nhap that bai` → cookie hết hạn / sai, lấy lại cookie mới

---

## PHẦN 4: Test trong nhóm 🎉

1. Vào nhóm chat Messenger (đã thêm acc phụ vào)
2. Nhắn: `!ping`
3. Bot trả lời `Pong!` → thành công!
4. Thử thêm: `!help`, `!time`, `!joke`

---

## Lỗi thường gặp

| Lỗi | Cách sửa |
|---|---|
| `Login failed` / checkpoint | Cookie hết hạn hoặc acc bị Meta nghi ngờ. Lấy lại cookie mới, đổi acc phụ khác, đừng login acc phụ trên nhiều thiết bị cùng lúc |
| Bot không trả lời trong nhóm | Acc phụ chưa thực sự vào nhóm? Nhóm E2EE? Thử nhắn `!ping` trong inbox 1-1 với acc phụ xem bot có trả lời không |
| `APPSTATE is not valid JSON` | Bạn dán thiếu / thừa dấu. Phải dán nguyên JSON, bắt đầu bằng `[` và kết thúc bằng `]` |
| Bot trả lời chậm / mất kết nối | Botkeep restart hoặc MQTT rớt. Bot sẽ tự kết nối lại, chờ 1-2 phút |

---

## Bảo mật
- ❌ Không commit `appstate.json` lên GitHub (đã có trong `.gitignore`)
- ❌ Không share log có chứa cookie
- ✅ Cookie hết hạn thì lấy lại, đừng cố login bằng mật khẩu liên tục (dễ khóa acc)

Chúc bạn thành công! 🚀
