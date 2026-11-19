(function(){var A=AgriSim;
  if(!A.guard('public'))return;
  document.body.setAttribute('data-bg','terrace');
  var app=document.getElementById('app');app.className='auth';
  var $=function(i){return document.getElementById(i);};
  function eye(id){return '<button type="button" class="eye" data-for="'+id+'" aria-label="Hiện mật khẩu">'+A.icon('eye')+'</button>';}
  app.innerHTML='<a class="brand" href="../landing/landing.html" aria-label="Về trang giới thiệu"><span class="mark">'+A.icon('leaf')+'</span><div><b>AGRISIM</b><small>GLOBAL</small></div></a>'+
  '<form class="auth-card" id="f" novalidate><h1>Tạo tài khoản</h1><p class="lead">Bắt đầu hành trình nông dân của bạn.</p>'+
  '<div class="banner banner-error" id="gerr" role="alert" hidden></div>'+
  '<div class="field"><label for="nm">Tên hiển thị</label><input class="input" id="nm" placeholder="Ví dụ: Minh Anh" maxlength="40"><div class="err-text" id="enm" hidden></div></div>'+
  '<div class="field"><label for="em">Email</label><input class="input" id="em" type="email" placeholder="ten@example.com"><div class="err-text" id="eem" hidden></div></div>'+
  '<div class="field"><label for="pw">Mật khẩu</label><div class="input-wrap"><input class="input" id="pw" type="password" placeholder="Tối thiểu 8 ký tự">'+eye('pw')+'</div><div class="help">Mật khẩu được lưu ở dạng băm, không ai đọc được.</div><div class="err-text" id="epw" hidden></div></div>'+
  '<div class="field"><label for="pw2">Xác nhận mật khẩu</label><div class="input-wrap"><input class="input" id="pw2" type="password" placeholder="Nhập lại mật khẩu">'+eye('pw2')+'</div><div class="err-text" id="epw2" hidden></div></div>'+
  '<button class="btn btn-primary btn-block btn-lg" id="go" type="submit">Đăng ký</button><div class="foot">Đã có tài khoản? <a href="login.html">Đăng nhập</a></div></form>';
  function err(id,inp,msg){var e=$(id);e.hidden=!msg;if(msg)e.innerHTML=A.icon('err')+msg;$(inp).classList.toggle('is-invalid',!!msg);return !!msg;}
  document.querySelectorAll('.eye').forEach(function(b){b.onclick=function(){var p=$(b.dataset.for);var s=p.type==='password';p.type=s?'text':'password';b.innerHTML=A.icon(s?'eyeoff':'eye');};});
  function busy(b){$('go').disabled=b;$('go').innerHTML=b?'<span class="spin"></span> Đang tạo tài khoản…':'Đăng ký';}
  $('f').onsubmit=async function(e){e.preventDefault();$('gerr').hidden=true;
    var nm=$('nm').value.trim(),em=$('em').value.trim(),pw=$('pw').value,pw2=$('pw2').value,bad=false;
    bad=err('enm','nm',nm.length<2?'Tên hiển thị tối thiểu 2 ký tự.':'')|bad;
    bad=err('eem','em',!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)?'Email chưa đúng định dạng.':'')|bad;
    bad=err('epw','pw',pw.length<8?'Mật khẩu tối thiểu 8 ký tự.':'')|bad;
    bad=err('epw2','pw2',pw2!==pw?'Mật khẩu xác nhận chưa khớp.':'')|bad;if(bad)return;
    busy(true);
    try{await A.auth.register(nm,em,pw);
      app.innerHTML='<div class="brand"><span class="mark">'+A.icon('leaf')+'</span><div><b>AGRISIM</b><small>GLOBAL</small></div></div><div class="auth-card" style="text-align:center"><div class="empty"><div class="ic" style="background:var(--success-bg);color:var(--success)">'+A.icon('check')+'</div><h3>Tạo tài khoản thành công</h3><p>Hãy đăng nhập để chọn khu vực và bắt đầu lượt chơi.</p><div class="acts"><a class="btn btn-primary" href="login.html">Đến trang đăng nhập</a></div></div></div>';}
    catch(x){busy(false);if(x.code==='EMAIL_EXISTS')err('eem','em','Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.');else{$('gerr').hidden=false;$('gerr').innerHTML=A.icon('err')+'<span>Chưa tạo được tài khoản. Vui lòng thử lại.</span>';}}};
  if(A.qs('state')==='loading')busy(true);
})();
