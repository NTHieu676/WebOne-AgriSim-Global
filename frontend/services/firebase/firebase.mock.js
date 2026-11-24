/* Firebase browser bootstrap for the static ZIP frontend. */
(function (w) {
  var A = w.AgriSim = w.AgriSim || {};
  var config = {
    apiKey: "AIzaSyAiUB0xwr5QO-zPwKSwXglhBeJeTSI_BF4", authDomain: "web1-agrisim-global.firebaseapp.com",
    projectId: "web1-agrisim-global", storageBucket: "web1-agrisim-global.firebasestorage.app",
    messagingSenderId: "676156200632", appId: "1:676156200632:web:af9878d6781f6bcb30064d"
  };
  function load(src) { return new Promise(function (resolve, reject) { var tag = document.createElement("script"); tag.src = src; tag.onload = resolve; tag.onerror = function () { reject(new Error("Không tải được Firebase Authentication.")); }; document.head.appendChild(tag); }); }
  A.firebaseReady = Promise.resolve().then(function () { return w.firebase ? null : load("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"); }).then(function () { return w.firebase && w.firebase.auth ? null : load("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"); }).then(function () { if (!w.firebase.apps.length) w.firebase.initializeApp(config); return w.firebase.auth(); });
})(window);
