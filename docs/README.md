# AgriSim Global

Website mô phỏng kinh tế và chuỗi cung ứng phục vụ mục đích giáo dục.
Người chơi tham gia các hoạt động sản xuất, quản lý hàng tồn kho, vận
chuyển, giao dịch và cung cấp thanh khoản trong môi trường kinh tế giả
lập.

------------------------------------------------------------------------

## 1. Giới thiệu dự án

**AgriSim Global** là nền tảng mô phỏng kinh tế và chuỗi cung ứng, giúp
người học tiếp cận kiến thức kinh doanh thông qua trải nghiệm tương tác
và ra quyết định.

Hệ thống mô phỏng các hoạt động:

-   Sản xuất và thu hoạch nông sản.
-   Quản lý tài sản và hàng tồn kho.
-   Giao dịch và vận chuyển hàng hóa.
-   Cung cấp thanh khoản và giao dịch thông qua AMM.
-   Theo dõi biến động kinh tế theo từng vòng chơi.

Hệ thống sử dụng USDG làm đơn vị tiền tệ giả lập. Các giao dịch chỉ phục
vụ mục đích mô phỏng, không phát sinh giao dịch tài chính thực tế.

## 2. Công nghệ sử dụng

  -----------------------------------------------------------------------
  Thành phần              Công nghệ               Vai trò
  ----------------------- ----------------------- -----------------------
  Frontend                HTML5, CSS3, JavaScript Xây dựng giao diện và
                          ES6+                    tương tác

  UI Framework            Bootstrap 5.3,          Thiết kế giao diện và
                          Bootstrap Icons         component

  Backend                 Node.js, Express.js     Xây dựng REST API và xử
                                                  lý nghiệp vụ

  Database                SQLite                  Lưu trữ dữ liệu kịch
                                                  bản tĩnh

  Authentication          Firebase Authentication Đăng ký, đăng nhập và
                                                  xác thực người chơi

  Cloud Database          Cloud Firestore         Lưu trữ dữ liệu người
                                                  chơi và trạng thái trò
                                                  chơi

  Firebase SDK            Firebase JavaScript     Kết nối Firebase từ
                          SDK, Firebase Admin SDK frontend và backend

  Deployment              Firebase Hosting        Triển khai frontend
  -----------------------------------------------------------------------

## 3. Kiến trúc hệ thống

AgriSim Global sử dụng kiến trúc tách biệt Frontend và Backend, kết hợp
Firebase và SQLite để quản lý các nhóm dữ liệu khác nhau.

### 3.1. Frontend

Frontend chịu trách nhiệm:

-   Hiển thị giao diện người dùng.
-   Tiếp nhận thao tác của người chơi.
-   Đăng ký, đăng nhập và đăng xuất thông qua Firebase Authentication.
-   Lấy Firebase ID Token sau khi xác thực thành công.
-   Gửi yêu cầu đến Express Backend thông qua REST API.
-   Hiển thị dữ liệu và kết quả xử lý từ backend.

### 3.2. Backend

Backend sử dụng Node.js và Express.js để:

-   Cung cấp REST API cho frontend.
-   Xác minh Firebase ID Token thông qua Firebase Admin SDK.
-   Kiểm tra quyền truy cập và tính hợp lệ của yêu cầu.
-   Xử lý các nghiệp vụ quan trọng của trò chơi.
-   Đọc dữ liệu kịch bản từ SQLite.
-   Đọc và cập nhật dữ liệu người chơi trên Cloud Firestore.

### 3.3. Hệ thống cơ sở dữ liệu

  -----------------------------------------------------------------------
  Cơ sở dữ liệu                       Loại dữ liệu
  ----------------------------------- -----------------------------------
  SQLite                              Kịch bản, thông số vòng chơi, thông
                                      báo và cấu hình trò chơi

  Firebase Authentication             Tài khoản và thông tin xác thực
                                      người chơi

  Cloud Firestore                     Hồ sơ người chơi, tài sản, lượt
                                      chơi và lịch sử hoạt động
  -----------------------------------------------------------------------

**Nguyên tắc phân quyền dữ liệu:** Frontend sử dụng Firebase
Authentication để xác thực danh tính. Các thao tác ảnh hưởng đến tài
sản, số dư và kết quả giao dịch phải được xử lý và kiểm tra tại backend
trước khi cập nhật Firestore.

## 4. Cấu trúc thư mục dự án

``` text
AgriSim-Global/
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── farm/
│   │   ├── inventory/
│   │   ├── pool/
│   │   ├── market/
│   │   └── profile/
│   │
│   ├── components/
│   │   ├── navbar/
│   │   ├── sidebar/
│   │   ├── modal/
│   │   └── notifications/
│   │
│   ├── services/
│   │   ├── firebase/
│   │   │   ├── firebase.js
│   │   │   └── auth.js
│   │   │
│   │   └── api/
│   │       └── apiClient.js
│   │
│   ├── utils/
│   └── index.html
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── firebaseAdmin.js
│   │   │
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js
│   │   │
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── data/
│   │   ├── scenario.db
│   │   └── schema.sql
│   │
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── architecture/
│   ├── database/
│   ├── use-cases/
│   └── diagrams/
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── .gitignore
└── README.md
```

### 4.1. Thư mục `frontend/`

Chứa toàn bộ mã nguồn giao diện website.

  Thư mục/File           Công dụng
  ---------------------- ---------------------------------------------
  `assets/css/`          Lưu các file CSS định dạng giao diện
  `assets/js/`           Lưu JavaScript phục vụ xử lý giao diện
  `assets/images/`       Lưu hình ảnh sử dụng trong website
  `assets/icons/`        Lưu icon và tài nguyên biểu tượng
  `pages/`               Chứa các trang chức năng của hệ thống
  `pages/auth/`          Giao diện đăng nhập và đăng ký
  `pages/dashboard/`     Trang tổng quan người chơi
  `pages/farm/`          Giao diện hoạt động sản xuất và thu hoạch
  `pages/inventory/`     Giao diện quản lý hàng tồn kho
  `pages/pool/`          Giao diện quản lý pool thanh khoản
  `pages/market/`        Giao diện thị trường và vận chuyển
  `pages/profile/`       Giao diện hồ sơ và lịch sử người chơi
  `components/`          Các thành phần giao diện có thể tái sử dụng
  `services/firebase/`   Khởi tạo Firebase và xử lý Authentication
  `services/api/`        Gửi HTTP request đến Express Backend
  `utils/`               Các hàm tiện ích dùng chung
  `index.html`           Trang HTML mặc định khi truy cập website

### 4.2. Thư mục `backend/`

Chứa mã nguồn xử lý nghiệp vụ và cung cấp API.

  Thư mục/File                Công dụng
  --------------------------- ---------------------------------------------------
  `src/config/`               Cấu hình kết nối database và các dịch vụ
  `config/database.js`        Khởi tạo và quản lý kết nối SQLite
  `config/firebaseAdmin.js`   Khởi tạo Firebase Admin SDK
  `routes/`                   Khai báo các endpoint REST API
  `controllers/`              Tiếp nhận request và trả response
  `services/`                 Xử lý nghiệp vụ và tương tác với database
  `middlewares/`              Xử lý trung gian trước khi request đến controller
  `authMiddleware.js`         Xác minh Firebase ID Token
  `utils/`                    Các hàm tiện ích dùng chung trong backend
  `app.js`                    Khởi tạo Express, middleware và đăng ký routes
  `server.js`                 Khởi động HTTP server
  `data/`                     Lưu trữ dữ liệu SQLite và cấu trúc bảng
  `scenario.db`               Database chứa dữ liệu kịch bản
  `schema.sql`                Khai báo cấu trúc các bảng SQLite
  `package.json`              Quản lý dependencies và scripts của backend
  `.env.example`              Mẫu các biến môi trường cần thiết

### 4.3. Thư mục `docs/`

Chứa tài liệu kỹ thuật và thiết kế của dự án.

  Thư mục           Công dụng
  ----------------- --------------------------------------------------
  `architecture/`   Tài liệu kiến trúc tổng thể hệ thống
  `database/`       ERD, mô hình dữ liệu và tài liệu database
  `use-cases/`      Đặc tả các trường hợp sử dụng
  `diagrams/`       Các sơ đồ UML, Sequence, Activity và luồng xử lý

### 4.4. Các file cấu hình tại thư mục gốc

  -----------------------------------------------------------------------
  File                                Công dụng
  ----------------------------------- -----------------------------------
  `firebase.json`                     Cấu hình Firebase Hosting và đường
                                      dẫn Firestore Rules, Indexes

  `firestore.rules`                   Khai báo quy tắc bảo mật và quyền
                                      truy cập Firestore từ client

  `firestore.indexes.json`            Khai báo các Composite Indexes của
                                      Firestore

  `.gitignore`                        Khai báo những file và thư mục
                                      không đưa lên GitHub

  `README.md`                         Tài liệu giới thiệu và mô tả
                                      repository
  -----------------------------------------------------------------------

## 5. Quy tắc bảo mật và quản lý mã nguồn

-   Không commit file `.env` chứa thông tin bí mật.
-   Không commit Service Account private key.
-   Không đặt thông tin xác thực đặc quyền trong Frontend.
-   Backend phải xác minh Firebase ID Token trước khi xử lý API cần đăng
    nhập.
-   Không tin tưởng UID, số dư hoặc tài sản do Frontend tự gửi lên mà
    chưa xác minh.
-   Sử dụng Firestore Security Rules để giới hạn truy cập trực tiếp từ
    client.
-   Không đưa `node_modules/` lên GitHub.
-   Không lưu thông tin đăng nhập dạng mật khẩu thuần trong Firestore.

## 6. Quy ước Git Branch

  Branch                           Mục đích
  -------------------------------- --------------------------------
  `main`                           Phiên bản ổn định của dự án
  `develop`                        Nhánh tích hợp các tính năng
  `feature/auth`                   Chức năng đăng ký và đăng nhập
  `feature/dashboard`              Chức năng Dashboard
  `feature/farm`                   Chức năng Farm
  `feature/inventory`              Chức năng Inventory
  `feature/pool`                   Chức năng Pool
  `feature/market`                 Chức năng Market
  `feature/firebase-integration`   Tích hợp Firebase

Các tính năng mới nên được phát triển trên nhánh riêng, sau đó tạo Pull
Request để tích hợp vào `develop`.

## 7. Định hướng phát triển

AgriSim Global được phát triển theo từng giai đoạn. Cấu trúc repository
có thể được mở rộng khi bổ sung các nhóm chức năng mới, cải thiện kiến
trúc nghiệp vụ và hoàn thiện trải nghiệm người dùng.

Các thành phần chưa được triển khai hoàn chỉnh sẽ tiếp tục được cập nhật
trong quá trình phát triển dự án.
