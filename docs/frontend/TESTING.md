# Smoke test frontend — AgriSim Global

Các test Playwright cũ dựa vào `file://`, mock authentication và `localStorage` đã bị loại bỏ vì không còn kiểm tra đúng runtime Firebase/API. Thực hiện checklist này sau mỗi thay đổi luồng game lớn.

## Chuẩn bị

1. Khởi động backend và mở `/api/health` để xác nhận API hoạt động.
2. Mở frontend qua `http://127.0.0.1:5500`, không dùng `file://`.
3. Dùng một tài khoản Firebase thử nghiệm hoặc nút **Dùng thử bằng tài khoản mẫu**.

## Luồng bắt buộc

1. Đăng ký/đăng nhập Firebase và kiểm tra hồ sơ được tạo/cập nhật.
2. Dùng thử: chọn vùng, vào dashboard, đóng trang hoặc logout, mở lại và xác nhận phiên demo mới.
3. Game thật: chọn vùng, gieo, chuyển vòng, thu hoạch và kiểm tra Kho.
4. Bán một lô hàng; gửi một lô sang khu vực còn lại; chuyển vòng và kiểm tra chuyến hàng đến.
5. Swap theo cả hai chiều, kiểm tra số dư, tồn kho và lịch sử thay đổi.
6. Điều hướng giữa Dashboard, Nông trại, Kho, Pool, Thị trường và Hồ sơ; sidebar phải giữ nguyên khi chuyển trong app.
7. Logout từ avatar/sidebar; xác nhận hộp thoại đếm 5 giây hoạt động.
8. Kiểm tra tại desktop và mobile: không tràn ngang, nút bấm có thể chạm và không có thông báo thị trường trùng lặp.

## Khi tự động hóa lại

Tạo test mới chạy qua web server, mock Firebase có chủ đích hoặc test account riêng, và mock/cô lập backend test. Không đưa lại selector, mock payment hay `AgriSim.store` của kiến trúc cũ.
