# Báo cáo rà soát chất lượng code — AgriSim Global

Ngày rà soát: 23/11/2026  
Phạm vi: frontend, backend, test, tài liệu và cấu trúc dự án hiện tại.  
Nguyên tắc: chỉ phân tích; không sửa hoặc xóa source code trong đợt rà soát.

## Tóm tắt kết quả

- Backend: `npm.cmd --prefix backend test` chạy thành công, **6/6 test pass**.
- Frontend: **36/36 file JavaScript** qua kiểm tra cú pháp bằng `node --check`.
- Chưa có E2E còn phù hợp với luồng Firebase/API/demo session hiện tại.
- Dự án có hai thế hệ frontend cùng tồn tại: luồng hiện hành dùng Firebase + API + Firestore và một stack mock cũ dùng `AgriSim.store` + `localStorage`.

## P0 — Cần xử lý trước khi tiếp tục mở rộng

### 1. Sai map khu vực Châu Âu tại trang Nông trại

**Vị trí:** `frontend/pages/farm/farm.js`

`regionName()` đang dùng `String(region).includes("CHAU_A")`. Giá trị `CHAU_AU` cũng chứa chuỗi `CHAU_A`, nên Châu Âu sẽ bị hiển thị thành Châu Á trong thông tin ruộng/trạng thái.

**Tác động:** sai thông tin nghiệp vụ hiển thị cho người chơi.

**Hướng xử lý:** so sánh chính xác, ví dụ `region === "CHAU_AU" ? "Châu Âu" : "Châu Á"`, đồng bộ với mapper đang dùng ở Kho, Pool và Thị trường.

### 2. Markup HTML không hợp lệ ở Start Game

**Vị trí:** `frontend/pages/game/startgame.js`

Trong mô tả vùng hiện có thẻ `<p>` lồng trong `<p>`, dạng `... <p>này.</p></p>`.

**Tác động:** trình duyệt tự sửa DOM, có thể làm CSS/ràng buộc layout thay đổi theo browser và giảm accessibility.

**Hướng xử lý:** dùng một thẻ `<p>` duy nhất; chuyển `style="font-size:16px"` đang đặt inline vào CSS của Start Game.

## P1 — Ảnh hưởng rõ đến bảo trì, test và độ tin cậy

### 3. Stack mock legacy không còn được nạp

Các entry HTML hiện tại chỉ nạp `icons.js`, `navigation.js` và module JS của từng trang. Các file dưới đây không thấy được nạp bởi luồng hiện tại:

- `frontend/assets/js/flows.js`
- `frontend/assets/js/layout.js`
- `frontend/components/modal/modal.js`
- `frontend/components/navbar/navbar.js`
- `frontend/components/notifications/toast.js`
- `frontend/components/payment/payment.js`
- `frontend/components/sidebar/sidebar.js`
- `frontend/services/mock/gameStore.js`
- `frontend/services/api/apiClient.mock.js`
- `frontend/services/firebase/auth.mock.js`
- `frontend/services/firebase/firebase.mock.js`
- `frontend/utils/format.js`
- `frontend/utils/guard.js`

Chúng tạo một kiến trúc khác: `AgriSim.store`, mock authentication, payment giả lập, state trong `localStorage` và routing cũ.

**Rủi ro:** người bảo trì khó xác định đâu là code thật; test/tài liệu có thể vô tình dựa vào hệ cũ.

**Hướng xử lý:** xác nhận không còn yêu cầu demo mock legacy. Sau đó xóa theo một commit/PR độc lập hoặc chuyển tạm vào `legacy/` trước khi xóa. Không nên để hai mô hình game song song lâu dài.

### 4. Chế độ demo mới lệch rule backend thật

**Vị trí:** `frontend/services/demo/demoSession.js`, `backend/sqlite/seed.sql`, `backend/src/services/marketService.js`

Ví dụ:

- Demo dùng bộ giá và pool reserve khác scenario SQLite.
- Demo ship luôn thu `15 USDG`.
- Backend tính phí ship theo `quantity × 0.5 × shippingMultiplier` của vòng.

**Rủi ro:** người chơi trải nghiệm demo bằng luật khác game thật; khó debug khi tái hiện hành vi.

**Hướng xử lý:** hoặc đồng bộ hằng số demo với scenario/backend, hoặc ghi rõ demo là mô phỏng rút gọn. Nếu giữ demo lâu dài, tách một module scenario dùng chung thay vì sao chép giá/rule.

### 5. E2E frontend lỗi thời

**Vị trí:** `frontend/tests/e2e_journey.py`, `frontend/tests/e2e_payment.py`, `docs/frontend/FLOW_CHECK.md`, `frontend/README.md`

Các test này dùng `file://`, selector cũ (`#demo`, `#go`), `AgriSim.store`, mock payment và `localStorage`. Luồng hiện hành dùng Firebase Authentication, Express API, Firestore và demo `sessionStorage`.

**Rủi ro:** kết quả PASS lịch sử không còn là bằng chứng chất lượng cho ứng dụng hiện tại.

**Hướng xử lý tối thiểu:** viết lại/thu gọn test theo các flow quan trọng:

1. Login Firebase thật hoặc mock Firebase có chủ đích.
2. Demo session: bắt đầu, chọn vùng, logout, mở lại phiên mới.
3. Bắt đầu game, trồng, chuyển vòng, thu hoạch.
4. Swap, ship/sell, xử lý lỗi API.
5. Điều hướng SPA giữ sidebar và logout.

### 6. Duplicated UI helpers và navigation

Lặp lại ở nhiều page:

- `toast()` tại Dashboard, Farm, Inventory, Market, Pool.
- `fmt`, `regionName`, `assetName` tại nhiều module.
- Sidebar/tabbar: `gameScreen.shell()`, `dashboard.js`, `farm.js`; đồng thời còn bản sidebar legacy.

**Hướng xử lý:** chỉ tách các helper nhỏ không làm đổi kiến trúc:

- `services/ui/toast.js`
- `utils/gameFormatters.js`
- `renderTabbar()`/danh sách link chung

Dashboard và Farm vẫn có thể truyền phần header/promo riêng để giữ UI hiện tại.

### 7. CSS khó bảo trì do rule dài và cascade override

**Vị trí:** `frontend/assets/css/pages.css`, `dashboard.css`, `login.css`

- `pages.css` khoảng 50 KB nhưng chỉ 242 dòng do nhiều rule nén rất dài.
- `login.css` khoảng 8 KB nhưng 13 dòng.
- `pages.css` chứa nhiều phần UI khác nhau, rule bổ sung nằm cuối file và ghi đè style trước đó.

**Rủi ro:** khó review, khó tìm nguyên nhân responsive regression, dễ ảnh hưởng chéo giữa page.

**Hướng xử lý:** không refactor toàn bộ một lần. Khi chạm vào màn hình nào thì format CSS liên quan, tách scope theo page (`auth`, `farm`, `market`, `profile`) và ưu tiên class thay cho inline style.

### 8. Template HTML quá lớn trong page JS

Dashboard và Farm dựng phần lớn trang bằng một template literal, đồng thời chứa fetch API, formatting, event binding và render.

**Hướng xử lý:** giữ vanilla JS nhưng tách thành các hàm render nhỏ như `renderHeader`, `renderStats`, `renderPlotCard`, `renderMarketPanel`. Điều này không yêu cầu framework hoặc thay đổi API.

### 9. Inline style còn rải rác

Xuất hiện tại Start Game, Profile, Pool, End Game, Notices, Landing và skeleton loading.

**Hướng xử lý:** chuyển dần sang class CSS trong lúc chỉnh từng màn hình. Ưu tiên Start Game/End Game vì hiện ảnh hưởng trực tiếp bố cục.

### 10. Documentation chưa đồng bộ với runtime hiện tại

`frontend/README.md` và tài liệu flow vẫn mô tả mock/store/payment legacy, trong khi frontend runtime hiện dùng Firebase/API và `runtimeConfig.js` trỏ Render.

**Hướng xử lý:** sau khi xử lý stack mock, cập nhật README với:

- kiến trúc thật hiện tại;
- demo dùng `sessionStorage`;
- lệnh backend test chuẩn `npm.cmd --prefix backend test`;
- cách chạy frontend qua web server;
- trạng thái E2E thực tế.

## P2 — Dọn dẹp có kế hoạch

### 11. Hàm chưa dùng trong demo

**Vị trí:** `frontend/services/demo/demoSession.js`

- `activeGame()`
- `totalAmount()`

Không có call site hiện tại.

**Hướng xử lý:** xóa trong commit cleanup demo nhỏ, sau khi kiểm tra lại bằng search/import.

### 12. Module API config chưa dùng

**Vị trí:** `frontend/services/api/configApi.js`

Không thấy import từ runtime hiện tại.

**Hướng xử lý:** xóa nếu không có kế hoạch dùng; nếu giữ, sử dụng nó thay vì từng page gọi `apiRequest` trực tiếp cho config.

### 13. Style và naming backend chưa đồng đều

Backend nhìn chung có tổ chức tốt route → controller → service → repository. Tuy vậy một số file, nhất là `poolController.js`, `topupService.js`, `swapService.js`, đặt nhiều statement trên một dòng.

**Hướng xử lý:** format cục bộ khi chạm file để tăng readability; không cần refactor logic đang chạy ổn.

### 14. Không có command chuẩn ở root

Root không có `package.json`; lệnh test nằm tại backend.

**Hướng xử lý:** chỉ thêm root script/CI nếu nhóm cần pipeline thống nhất. Hiện tại có thể dùng rõ ràng `npm.cmd --prefix backend test`.

### 15. Git hygiene

- `.firebase/hosting.ZnJvbnRlbmQ.cache` đang được theo dõi và có thay đổi.
- `dashboard.css`, `login.css`, demo service và một số SVG đang là file untracked trong worktree tại thời điểm rà soát.

**Hướng xử lý:** xác nhận cache Firebase có cần commit hay không; khi commit UI/demo cần thêm đủ CSS, JS, asset liên quan, không chỉ thêm file page JS.

## Điểm tốt hiện có

- Backend tách route → controller → service → repository tương đối rõ.
- Mutation game sử dụng transaction và `requestId`/idempotency.
- Backend có health check, CORS, giới hạn JSON body và error handler tập trung.
- Demo hiện hành dùng `sessionStorage`, không gọi Firebase/backend khi chạy demo.
- `apiRequest` tập trung việc lấy Firebase ID token và retry 401 một lần.

## Thứ tự xử lý đề xuất

1. Sửa P0: mapper khu vực ở Farm và markup Start Game.
2. Viết lại E2E tối thiểu theo kiến trúc Firebase/API/demo hiện tại.
3. Xác nhận và bỏ stack mock legacy cùng test/docs cũ liên quan.
4. Tách helper nhỏ dùng chung cho toast, formatter, region/asset label và navigation.
5. Dọn CSS/inline style theo từng màn hình có chỉnh sửa; tránh big-bang refactor.
6. Chuẩn hóa README, cách chạy test và quy trình commit.

## Lưu ý về trạng thái audit

Worktree có nhiều thay đổi UI/demo chưa commit tại thời điểm rà soát. Báo cáo đánh giá theo đúng trạng thái code hiện tại, bao gồm các thay đổi đó.
