# Báo cáo kiểm tra phân luồng (theo User Journey BA)
Kết quả tự động: **76 PASS / 0 FAIL, 0 lỗi JS** (chi tiết: e2e_result.json).

| Nhóm kiểm tra | Nội dung | Kết quả |
|---|---|---|
| Trang giới thiệu | anon vào `index.html` → landing; landing → Đăng nhập/Đăng ký; logo ở login về landing; đã đăng nhập mở landing vẫn xem được, nút "Vào game" dẫn vào game; "Chơi thử" → dashboard | PASS |
| Menu | "Trang chủ" thay cho "Tổng quan" (desktop + tabbar mobile) | PASS |
| Guard anon | 11 trang game → login | PASS |
| Guard chưa có game | → startgame | PASS |
| Guard đang chơi | login/register/startgame/endgame → dashboard | PASS |
| Đăng ký/Đăng nhập | lỗi sai mật khẩu, trùng email, validate | PASS |
| Bắt đầu game | tạo game, 2.000 USDG, 2 mảnh | PASS |
| Nông trại (BPMN-F4) | thiếu tiền → gợi ý nạp → kiểm tra lại; đủ 4/4 mảnh → chặn, không gợi ý nạp | PASS |
| Vòng chơi | chuyển vòng 1→6, thu hoạch, hao hụt | PASS |
| Pool/Market | swap 10 lúa → 98,72 USDG; ship 1 vòng | PASS |
| Nạp tiền | 100–5.000, bội số 100 | PASS |
| Cổng thanh toán giả lập | QR/Thẻ/Ví; thành công, thất bại, hết hạn, hủy; không cộng 2 lần; quay lại mua đất sau khi nạp (25/25, xem PAYMENT_FLOW.md) | PASS |
| Kết thúc | endgame, chỉ-đọc mọi trang, chơi lại | PASS |
| Đăng xuất | quay về login | PASS |
| Trạng thái | ?state=loading/error/empty | PASS |
| Mobile 390px | không tràn ngang ở 6 trang chính | PASS |
