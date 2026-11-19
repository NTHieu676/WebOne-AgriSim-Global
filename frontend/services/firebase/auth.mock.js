/* Đăng ký / đăng nhập / đăng xuất. Hiện dùng mock; sau này đổi sang Firebase Authentication. */
(function(w){var A=w.AgriSim=w.AgriSim||{};
  A.auth={
    register:function(name,email,pass){return A.store.register(name,email,pass);},
    login:function(email,pass){return A.store.login(email,pass);},
    demo:function(){return A.store.demoLogin();},
    logout:function(){return A.store.logout();},
    user:function(){return A.store.me();},
    /* Firebase thật: lấy ID token để gửi kèm mỗi request backend (Authorization: Bearer <token>) */
    idToken:function(){return Promise.resolve(null);}
  };
})(window);
