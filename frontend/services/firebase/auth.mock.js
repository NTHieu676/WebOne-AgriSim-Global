/* Compatibility facade: exposes the ZIP's AgriSim.auth API over Firebase Auth. */
(function (w) {
  var A = w.AgriSim = w.AgriSim || {}, currentUser = null, demoUser = null, demoApi = null, ready = false, resolveReady;
  var sourceUrl = document.currentScript && document.currentScript.src;
  var authCacheKey = "agrisim.auth-cache.v1";
  var readyPromise = new Promise(function (resolve) { resolveReady = resolve; });
  function readCachedUser() { try { return JSON.parse(sessionStorage.getItem(authCacheKey) || "null"); } catch (_) { return null; } }
  function cacheUser(user) { if (!user) { sessionStorage.removeItem(authCacheKey); return; } sessionStorage.setItem(authCacheKey, JSON.stringify({ uid: user.uid, email: user.email || "", name: user.displayName || user.name || user.email || "Nông dân" })); }
  try { var savedDemo = JSON.parse(sessionStorage.getItem("agrisim.demo-session.v1") || "null"); if (savedDemo && savedDemo.mode === "demo" && savedDemo.profile) demoUser = { uid: savedDemo.profile.uid, email: savedDemo.profile.email || "", displayName: savedDemo.profile.displayName || "Nông dân dùng thử" }; } catch (_) {}
  /* Mã lỗi Firebase -> mã UI zip (NO_USER, BAD_PASS, EMAIL_EXISTS, BAD_EMAIL) + câu tiếng Việt.
     Firebase v10 bật "email enumeration protection" nên sai email hay sai mật khẩu đều trả auth/invalid-credential. */
  var AUTH_ERRORS = {
    "auth/user-not-found": ["NO_USER", "Không tìm thấy tài khoản với email này."],
    "auth/wrong-password": ["BAD_PASS", "Mật khẩu không đúng."],
    "auth/invalid-credential": ["BAD_PASS", "Email hoặc mật khẩu không đúng."],
    "auth/invalid-login-credentials": ["BAD_PASS", "Email hoặc mật khẩu không đúng."],
    "auth/email-already-in-use": ["EMAIL_EXISTS", "Email này đã được đăng ký."],
    "auth/invalid-email": ["BAD_EMAIL", "Email chưa đúng định dạng."],
    "auth/missing-password": ["BAD_PASS", "Vui lòng nhập mật khẩu."],
    "auth/weak-password": ["AUTH", "Mật khẩu quá yếu. Hãy dùng ít nhất 8 ký tự."],
    "auth/too-many-requests": ["AUTH", "Bạn đã thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại."],
    "auth/network-request-failed": ["AUTH", "Không kết nối được máy chủ xác thực. Kiểm tra mạng rồi thử lại."],
    "auth/user-disabled": ["AUTH", "Tài khoản này đã bị vô hiệu hóa."],
    "auth/operation-not-allowed": ["AUTH", "Đăng nhập bằng email chưa được bật cho ứng dụng."],
    "auth/internal-error": ["AUTH", "Dịch vụ xác thực đang gặp sự cố. Vui lòng thử lại sau."]
  };
  function mapError(error) {
    error = error || new Error("");
    var hit = AUTH_ERRORS[error.code || ""];
    if (hit) { error.firebaseCode = error.code; error.code = hit[0]; error.message = hit[1]; error.friendly = hit[1]; }
    else if (/[^\x00-\x7F]/.test(error.message || "")) error.friendly = error.message; // đã là câu tiếng Việt (vd. lỗi tải Firebase SDK)
    return error;
  }
  function loadDemoApi() { return demoApi ? Promise.resolve(demoApi) : import(new URL("../demo/demoSession.js", sourceUrl).href).then(function (module) { demoApi = module; return module; }); }
  A.auth = {
    ready: function () { return readyPromise; }, isReady: function () { return true; }, isDemo: function () { return !!demoUser; }, user: function () { var user = demoUser || currentUser || readCachedUser(); return user ? { uid: user.uid, email: user.email || "", name: user.displayName || user.name || user.email || "Nông dân" } : null; },
    token: function (force) { return currentUser ? currentUser.getIdToken(!!force) : Promise.reject(Object.assign(new Error("Bạn chưa đăng nhập."), { code: "AUTH_REQUIRED" })); },
    register: function (name, email, password) { return A.firebaseReady.then(function (auth) { return auth.createUserWithEmailAndPassword(email, password).then(function (result) { return result.user.updateProfile({ displayName: name }).then(function () { currentUser = result.user; cacheUser(currentUser); return result.user.getIdToken(true).then(function () { return result.user; }); }); }); }).catch(function (error) { throw mapError(error); }); },
    login: function (email, password) { return A.firebaseReady.then(function (auth) { return auth.signInWithEmailAndPassword(email, password).then(function (result) { currentUser = result.user; cacheUser(currentUser); return result.user; }); }).catch(function (error) { throw mapError(error); }); },
    logout: function () { A.store.clear(); A.store.setRestartIntent(false); cacheUser(null); if (demoUser && demoApi) { demoApi.clearDemoSession(); demoUser = null; return Promise.resolve(); } return A.firebaseReady.then(function (auth) { return auth.signOut(); }); },
    demo: function () { return import(new URL("../demo/demoSession.js", sourceUrl).href).then(function (module) { demoApi = module; demoApi.startDemoSession(); var profile = demoApi.getRuntimeProfile(); demoUser = { uid: profile.uid, email: profile.email, displayName: profile.displayName }; cacheUser(demoUser); A.store.clear(); return demoUser; }); },
    // Sau khi chuyển trang, demoUser được khôi phục từ sessionStorage nhưng module demo chưa nạp -> nạp lại khi cần.
    demoRequest: function (endpoint, options) { return loadDemoApi().then(function (module) { return module.demoRequest(endpoint, options); }); }
  };
  A.firebaseReady.then(function (auth) { auth.onAuthStateChanged(function (user) { var hadCache = !!readCachedUser(); currentUser = user || null; if (user) cacheUser(user); else if (!demoUser) cacheUser(null); ready = true; resolveReady(currentUser); if (user && !hadCache) location.replace(location.href); }); }).catch(function () { ready = true; resolveReady(null); });
})(window);
