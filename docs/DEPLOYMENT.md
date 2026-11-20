# Triển khai AgriSim Global

## Chuẩn bị

1. Triển khai Express backend lên một dịch vụ có HTTPS (Render, Railway, Cloud Run hoặc tương đương).
2. Cấu hình biến môi trường trên backend:

   ```text
   NODE_ENV=production
   PORT=<port do nền tảng cung cấp>
   FIREBASE_PROJECT_ID=web1-agrisim-global
   FIREBASE_SERVICE_ACCOUNT_JSON=<JSON service account một dòng>
   FRONTEND_URL=https://<firebase-hosting-domain>
   ```

   Không đưa service account hoặc file `.env` vào Git.

3. Trong `frontend/config/runtimeConfig.js`, đặt URL API public, không có dấu `/` cuối:

   ```js
   export const API_BASE_URL = "https://<backend-domain>/api";
   ```

4. Bổ sung domain Firebase Hosting vào Firebase Authentication → Settings → Authorized domains.

## Firebase

Từ thư mục gốc dự án, đăng nhập đúng Firebase project rồi triển khai quy tắc và frontend:

```powershell
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

`firestore.rules` đang chặn toàn bộ truy cập trực tiếp từ browser. Đây là chủ đích: mọi dữ liệu game đi qua backend đã xác minh Firebase ID Token.

## Kiểm tra sau triển khai

1. Mở `<backend-domain>/api/health` và kiểm tra HTTP 200.
2. Đăng ký/đăng nhập trên Firebase Hosting.
3. Chơi một flow ngắn: bắt đầu lượt → trồng → chuyển vòng → thu hoạch → kho/Pool.
4. Gọi một endpoint game không kèm token và xác nhận nhận HTTP 401.

## Chạy cục bộ

```powershell
cd backend
npm.cmd run db:init
npm.cmd start
```

Mở `frontend/` bằng Live Server tại `http://127.0.0.1:5500`.
