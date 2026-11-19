(function(){var A=AgriSim,F=A.fmt;
  if(!A.guard('public'))return;
  document.body.setAttribute('data-bg','terrace');
  var out=A.qs('out');
  var app=document.getElementById('app');app.className='auth';
  app.innerHTML='<a class="brand" href="../landing/landing.html" aria-label="Về trang giới thiệu"><span class="mark">'+A.icon('leaf')+'</span><div><b>AGRISIM</b><small>GLOBAL</small></div></a>'+
  '<form class="auth-card" id="f" novalidate><h1>Đăng nhập</h1><p class="lead">Tiếp tục lượt chơi của bạn.</p>'+
  (out?'<div class="banner banner-info" role="status">'+A.icon('info')+'<span>Bạn đã đăng xuất. Hẹn gặp lại!</span></div>':'')+
  '<div class="banner banner-error" id="gerr" role="alert" hidden></div>'+
  '<div class="field"><label for="em">Email</label><input class="input" id="em" type="email" autocomplete="email" placeholder="ten@example.com"><div class="err-text" id="eem" hidden></div></div>'+
  '<div class="field"><label for="pw">Mật khẩu</label><div class="input-wrap"><input class="input" id="pw" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"><button type="button" class="eye" aria-label="Hiện mật khẩu">'+A.icon('eye')+'</button></div><div class="err-text" id="epw" hidden></div></div>'+
  '<button class="btn btn-primary btn-block btn-lg" id="go" type="submit">Đăng nhập</button><div class="or">hoặc</div>'+
  '<button class="btn btn-outline btn-block" id="demo" type="button">Dùng thử bằng tài khoản mẫu</button>'+
  '<div class="note note-info" style="margin-top:12px">'+A.icon('info')+'<span>Tài khoản mẫu giúp bạn trải nghiệm ngay, không cần đăng ký.</span></div>'+
  '<div class="foot">Chưa có tài khoản? <a href="register.html">Đăng ký</a></div></form>';
  var $=function(i){return document.getElementById(i);};
  function err(id,inp,msg){var e=$(id);e.hidden=!msg;if(msg)e.innerHTML=A.icon('err')+msg;$(inp).classList.toggle('is-invalid',!!msg);}
  document.querySelector('.eye').onclick=function(){var p=$('pw');var show=p.type==='password';p.type=show?'text':'password';this.innerHTML=A.icon(show?'eyeoff':'eye');};
  function busy(b,t){var btn=$('go');btn.disabled=b;$('demo').disabled=b;btn.innerHTML=b?'<span class="spin"></span> '+t:'Đăng nhập';}
  function next(){var s=A.gameState();A.go(s==='nogame'?'start':s==='ended'?'end':'home');}
  $('f').onsubmit=async function(e){e.preventDefault();$('gerr').hidden=true;
    var em=$('em').value.trim(),pw=$('pw').value,bad=false;
    err('eem','em',!em?'Vui lòng nhập email.':!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)?'Email chưa đúng định dạng.':'');bad=!!$('eem').innerHTML&&!$('eem').hidden;
    err('epw','pw',!pw?'Vui lòng nhập mật khẩu.':'');bad=bad||!$('epw').hidden;if(bad)return;
    busy(true,'Đang đăng nhập…');
    try{await A.auth.login(em,pw);next();}
    catch(x){busy(false);if(x.code==='NO_USER')err('eem','em',x.message);else if(x.code==='BAD_PASS')err('epw','pw',x.message);else{$('gerr').hidden=false;$('gerr').innerHTML=A.icon('err')+'<span>Chưa đăng nhập được. Vui lòng thử lại.</span>';}}};
  $('demo').onclick=async function(){busy(true,'Đang vào…');await A.auth.demo();next();};
  if(A.qs('state')==='loading')busy(true,'Đang đăng nhập…');
})();
