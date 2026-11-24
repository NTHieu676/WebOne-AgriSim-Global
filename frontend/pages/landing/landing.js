/* Trang giới thiệu (công khai). Ai cũng xem được; người đã đăng nhập thấy nút "Vào game" thay cho Đăng nhập/Đăng ký. */
(function(){var A=AgriSim;
  if(!A.guard('public'))return;
  var ST=A.gameState(),IN=ST!=='anon',GAME=A.url(ST==='nogame'?'start':ST==='ended'?'end':'home');
  var IMG=A.ROOT+'assets/images/';
  var app=document.getElementById('app');app.className='lp';
  var bg=function(f){return 'style="background-image:url('+IMG+f+')"';};
  app.innerHTML=
  '<header class="lp-nav"><a class="brand" href="landing.html" aria-label="AgriSim Global"><span class="mark">'+A.icon('leaf')+'</span><div><b>AGRISIM</b><small>GLOBAL</small></div></a>'+
    '<nav><a class="lp-link" href="#how">Cách chơi</a>'+(IN?'<a class="btn btn-primary" id="enter" href="'+GAME+'">Vào game</a>':'<a class="btn btn-outline" href="'+A.url('login')+'">Đăng nhập</a><a class="btn btn-primary" href="'+A.url('register')+'">Đăng ký</a>')+'</nav></header>'+
  '<section class="lp-hero" '+bg('bg-terrace.jpg')+'><div class="lp-shade"></div><div class="lp-hero-in">'+
    '<span class="badge b-success">'+A.icon('sprout')+' Trò chơi mô phỏng nông nghiệp toàn cầu</span>'+
    '<h1>Gieo trồng, vận chuyển và giao thương cùng thế giới</h1>'+
    '<p>Làm nông dân trong 6 vòng chơi: trồng lúa, gửi hàng giữa Châu Á và Châu Âu, rồi trao đổi để tăng tài sản ròng.</p>'+
    '<div class="lp-cta">'+(IN?'<a class="btn btn-primary btn-lg" id="start" href="'+GAME+'">'+(ST==='playing'?'Tiếp tục chơi':'Vào game')+'</a>':'<a class="btn btn-primary btn-lg" id="start" href="'+A.url('register')+'">Bắt đầu chơi</a><button class="btn btn-outline btn-lg" id="demo" type="button">Chơi thử bằng tài khoản mẫu</button>')+'</div>'+
    '<div class="lp-note">'+A.icon('info')+'<span>Toàn bộ là tiền giả lập (USDG), không dùng tiền thật.</span></div>'+
  '</div></section>'+
  '<section class="lp-facts" aria-label="Thông tin nhanh">'+
    fact('clock','6','vòng chơi')+fact('coin','2.000','USDG vốn ban đầu')+fact('truck','2','khu vực: Châu Á · Châu Âu')+fact('leaf','2','hàng hóa: Lúa · Vàng')+
  '</section>'+
  '<section class="lp-sec" id="how"><h2>Cách chơi</h2><p class="lp-sub">Ba việc chính trong mỗi vòng</p><div class="lp-steps">'+
    step('1','card-lua-cream.jpg','sprout','Trồng &amp; thu hoạch','Dùng 100 USDG gieo lúa, sau 1 vòng thu về 20 lúa. Mua thêm mảnh đất để mở rộng nông trại.')+
    step('2','card-vanchuyen-blue.jpg','truck','Vận chuyển &amp; trao đổi','Gửi hàng sang khu vực khác hoặc đổi qua pool. Theo dõi thông báo thị trường để chọn thời điểm.')+
    step('3','card-networth-dark.jpg','chart','Chốt tài sản ròng','Sau vòng 6, tài sản ròng gồm USDG, hàng trong kho và hàng đang vận chuyển.','dark')+
  '</div></section>'+
  '<section class="lp-band" '+bg('illus-rice-banner.jpg')+'><div><h2>Sẵn sàng làm nông dân?</h2><p>Tạo tài khoản miễn phí và bắt đầu lượt chơi đầu tiên.</p></div>'+
    '<div class="lp-cta">'+(IN?'<a class="btn btn-primary btn-lg" href="'+GAME+'">Vào game</a>':'<a class="btn btn-primary btn-lg" href="'+A.url('register')+'">Đăng ký ngay</a><a class="btn btn-outline btn-lg lp-ghost" href="'+A.url('login')+'">Tôi đã có tài khoản</a>')+'</div></section>'+
  '<footer class="lp-foot">AgriSim Global · Dự án học tập · Tiền trong game là tiền giả lập</footer>';
  function fact(ic,v,t){return '<div class="lp-fact"><span class="ic">'+A.icon(ic)+'</span><b class="num">'+v+'</b><small>'+t+'</small></div>';}
  function step(n,img,ic,t,d,dark){return '<article class="lp-step'+(dark?' dark':'')+'" '+bg(img)+'><span class="n">'+n+'</span><span class="ic">'+A.icon(ic)+'</span><h3>'+t+'</h3><p>'+d+'</p></article>';}
  var dm=document.getElementById('demo');if(dm)dm.onclick=async function(){this.disabled=true;this.innerHTML='<span class="spin"></span> Đang vào…';await A.auth.demo();var s=A.gameState();A.go(s==='nogame'?'start':s==='ended'?'end':'home');};
})();
