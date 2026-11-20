# AgriSim Global – Frontend (HTML/CSS/JS thuần)

Chuyển từ Figma sang web tĩnh nhiều trang, **không cần build**. Ứng dụng phải chạy qua web server (ví dụ VS Code Live Server), không mở bằng `file://`. Đăng nhập dùng Firebase Authentication; toàn bộ luồng chơi dùng API Express đã xác thực và dữ liệu Firestore.

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
│  ├─ mock/gameStore.js         # dữ liệu mẫu cũ, không dùng trong luồng game hiện tại
│  ├─ firebase/{firebase,auth}.js # Firebase Authentication thật cho trang auth
│  └─ api/apiClient.js          # tự đính Firebase ID Token khi gọi API thật
├─ utils/{format,guard}.js      # guard = phân luồng theo user journey
└─ tests/{e2e_journey,e2e_payment}.py   # kiểm thử luồng (Playwright)
```

## Chạy ứng dụng cục bộ

1. Trong thư mục `backend`, chạy một lần `npm.cmd install` và `npm.cmd run db:init`.
2. Chạy API: `npm.cmd start` (hoặc `npm.cmd run dev`). API health: `http://127.0.0.1:3000/api/health`.
3. Mở thư mục `frontend/` bằng Live Server tại `http://127.0.0.1:5500`.
4. Đăng ký hoặc đăng nhập bằng Firebase rồi bắt đầu lượt chơi. Sidebar và phần nội dung được chuyển trang không tải lại toàn bộ khung ứng dụng.

Backend chỉ chấp nhận origin `http://localhost:5500` và `http://127.0.0.1:5500` theo cấu hình hiện tại. Cần bảo đảm hai origin này được cho phép trong Firebase Authentication trước khi kiểm thử.

## Các chức năng đã nối API

- Khởi tạo, chuyển vòng, kết thúc và chơi lại lượt chơi.
- Ruộng: mua ô, gieo, thu hoạch.
- Kho và thị trường: xem lô hàng, vận chuyển, bán theo khu vực.
- Pool: báo giá và swap RICE/GOLD với USDG.
- Hồ sơ: nạp USDG mô phỏng và lịch sử giao dịch.
- Thông báo thị trường: mở bằng ngăn kéo bên phải, không che sidebar.

## Xem các trạng thái Figma
Thêm vào URL: `?state=loading`, `?state=error`, `?state=empty`. Trang game đã kết thúc tự vào chế độ chỉ-đọc.

## Phân luồng (guard)
| Trạng thái | Hành vi |
|---|---|
| Chưa đăng nhập | `index.html` → trang giới thiệu (có nút Đăng nhập / Đăng ký / Chơi thử); mọi trang game → login |
| Đã đăng nhập, chưa có game | → startgame (login/register chuyển về đây; trang giới thiệu vẫn xem được, hiện nút "Vào game") |
| Đang chơi | login/register/startgame/endgame → dashboard |
| Đã kết thúc | các trang xem ở chế độ chỉ-đọc; login/startgame → endgame; cần "Chơi lại" |

## Kiểm thử

- Backend: `cd backend` rồi `npm.cmd test`.
- Kiểm thử thao tác giao diện thủ công: đăng nhập → bắt đầu game → mua/gieo/thu hoạch → kho hoặc thị trường → Pool → chuyển vòng → tổng kết.
- Triển khai Firebase Hosting và backend HTTPS: xem [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

## Nạp tiền qua ngân hàng giả lập
Hồ sơ → Nạp USDG → chọn phương thức (QR / Thẻ / Ví) → thanh toán → kết quả. OTP/PIN đúng: `123456`. Chi tiết quy trình và quy tắc đề xuất: `docs/frontend/PAYMENT_FLOW.md`.

## Số liệu mẫu (cần nhóm xác nhận)
Phí swap 0,3%, phí ship 0,5/đơn vị, giá mảnh 500, tối đa 4 mảnh, nạp 100–5.000 bội số 100 (mã QR hết hạn 5 phút, tối đa 3 lần nhập OTP/PIN), lúa hao 5%/vòng.

## Chạy test
`python3 tests/e2e_journey.py` (cần Playwright + Chrome). Kết quả hiện tại: e2e_journey 76/76, e2e_payment 25/25 PASS.

## Không thấy trang giới thiệu?
Trình duyệt đang lưu phiên đăng nhập cũ nên `index.html` đưa thẳng vào game. Mở trực tiếp `pages/landing/landing.html`, hoặc đăng xuất, hoặc xoá Local Storage (F12 → Application) rồi mở lại `index.html`.
