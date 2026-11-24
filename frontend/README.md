# AgriSim Global – Frontend (HTML/CSS/JS thuần)

Chuyển từ Figma sang web tĩnh nhiều trang, **không cần build**. Chạy bằng cách mở `index.html` (double-click) hoặc dùng VS Code Live Server.

## Cấu trúc
```
frontend/
├─ index.html                 # cổng vào: chưa đăng nhập → trang giới thiệu; còn lại điều hướng theo trạng thái game
├─ assets/{css,js,images}     # tokens, base, components, layout, pages; icons/layout/flows; ảnh nền & card
├─ components/{toast,modal,payment,sidebar,navbar}   # payment = cổng nạp tiền giả lập
├─ pages/
│  ├─ landing/landing           # trang giới thiệu (công khai)
│  ├─ auth/{login,register}
│  ├─ game/{startgame,endgame}
│  ├─ dashboard/ farm/ inventory/ pool/
│  ├─ market/{market,notices}   # market có tab ?tab=ship (Chuyến hàng)
│  └─ profile/profile           # tab ?tab=history (Lịch sử)
├─ services/
│  ├─ mock/gameStore.js         # backend giả bằng localStorage (luật BRD)
│  ├─ firebase/{firebase,auth}.mock.js
│  └─ api/apiClient.mock.js
├─ utils/{format,guard}.js      # guard = phân luồng theo user journey
└─ tests/{e2e_journey,e2e_payment}.py   # kiểm thử luồng (Playwright)
```

## Tài khoản demo
`demo@agrisim.vn` (vòng 3, 1.785 USDG) – hoặc đăng ký tài khoản mới (bắt đầu 2.000 USDG).
Reset dữ liệu: xoá localStorage của trang.

## Xem các trạng thái Figma
Thêm vào URL: `?state=loading`, `?state=error`, `?state=empty`. Trang game đã kết thúc tự vào chế độ chỉ-đọc.

## Phân luồng (guard)
| Trạng thái | Hành vi |
|---|---|
| Chưa đăng nhập | `index.html` → trang giới thiệu (có nút Đăng nhập / Đăng ký / Chơi thử); mọi trang game → login |
| Đã đăng nhập, chưa có game | → startgame (login/register chuyển về đây; trang giới thiệu vẫn xem được, hiện nút "Vào game") |
| Đang chơi | login/register/startgame/endgame → dashboard |
| Đã kết thúc | các trang xem ở chế độ chỉ-đọc; login/startgame → endgame; cần "Chơi lại" |

## Nối backend thật
Mock được thay qua 3 điểm: `AgriSim.auth`, `AgriSim.api`, `AgriSim.store`. Giữ nguyên tên hàm, thay phần thân bằng gọi Express/Firebase. File `*.mock.js` đặt tên riêng để **không ghi đè** `firebase.js`, `auth.js`, `apiClient.js` có sẵn của nhóm.

## Nạp tiền qua ngân hàng giả lập
Hồ sơ → Nạp USDG → chọn phương thức (QR / Thẻ / Ví) → thanh toán → kết quả. OTP/PIN đúng: `123456`. Chi tiết quy trình và quy tắc đề xuất: `docs/frontend/PAYMENT_FLOW.md`.

## Số liệu mẫu (cần nhóm xác nhận)
Phí swap 0,3%, phí ship 0,5/đơn vị, giá mảnh 500, tối đa 4 mảnh, nạp 100–5.000 bội số 100 (mã QR hết hạn 5 phút, tối đa 3 lần nhập OTP/PIN), lúa hao 5%/vòng.

## Chạy test
`python3 tests/e2e_journey.py` (cần Playwright + Chrome). Kết quả hiện tại: e2e_journey 76/76, e2e_payment 25/25 PASS.

## Không thấy trang giới thiệu?
Trình duyệt đang lưu phiên đăng nhập cũ nên `index.html` đưa thẳng vào game. Mở trực tiếp `pages/landing/landing.html`, hoặc đăng xuất, hoặc xoá Local Storage (F12 → Application) rồi mở lại `index.html`.
