/*
 * Firebase SDK – khởi tạo (CHƯA bật). Khi nối Firebase thật:
 * 1) Thêm firebase-app/auth SDK (CDN hoặc npm), 2) điền firebaseConfig, 3) đặt AgriSim.USE_FIREBASE = true.
 * Không commit khóa bí mật; apiKey web là public nhưng vẫn lấy từ cấu hình riêng.
 */
(function(w){var A=w.AgriSim=w.AgriSim||{};
  A.USE_FIREBASE=false;
  A.firebaseConfig={apiKey:'',authDomain:'',projectId:'',appId:''};
})(window);
