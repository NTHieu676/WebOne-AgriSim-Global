(function(w){var A=w.AgriSim=w.AgriSim||{};var F=A.fmt;
  function dots(r){var h='';for(var i=1;i<=6;i++)h+='<i'+(i<=r?' class="on"':'')+'></i>';return '<span class="dots" aria-hidden="true">'+h+'</span>';}
  A.navbar={
    html:function(o,g,ro){
      var u=A.auth.user()||{name:'?'};var ini=u.name.split(/\s+/).map(function(x){return x[0];}).slice(0,2).join('').toUpperCase();
      var ttl=o.greeting?'<small>Xin chào,</small><h1>'+F.esc(u.name)+'</h1>':'<h1>'+o.title+'</h1>'+(o.sub?'<p>'+o.sub+'</p>':'');
      /* Breadcrumb cho trang con: [[routeKey,'Nhãn'],…,[null,'Trang hiện tại']] – mục cuối in đậm, các mục trước là liên kết */
      if(o.crumbs&&o.crumbs.length)ttl='<nav class="crumbs" aria-label="Vị trí trang"><ol>'+o.crumbs.map(function(c,i){var last=i===o.crumbs.length-1;
        return '<li>'+(last||!c[0]?'<b aria-current="page">'+F.esc(c[1])+'</b>':'<a href="'+A.url(c[0])+'">'+F.esc(c[1])+'</a>')+'</li>';}).join('')+'</ol></nav>'+ttl;
      var btn;
      if(ro)btn='<span class="pill hide-m" style="color:var(--text-muted)">Lượt chơi đã kết thúc</span>';
      else if(g.round>=A.CFG.rounds)btn='<button class="btn btn-danger" data-act="end">Kết thúc lượt chơi</button>';
      else btn='<button class="btn btn-primary" data-act="next">Chuyển vòng → Vòng '+(g.round+1)+'</button>';
      return '<div class="ttl">'+ttl+'</div>'+
        '<div class="pill"><small>Vòng</small><span class="num">'+g.round+'/6</span>'+dots(g.round)+'</div>'+
        '<div class="pill"><small>Số dư</small><span class="num" data-balance>'+F.usdg(g.usdg)+'</span></div>'+btn+
        '<a class="iconbtn" href="'+A.url('notices')+'" aria-label="Thông báo thị trường">'+A.icon('bell')+(ro?'':'<span class="cnt">1</span>')+'</a>'+
        '<div class="userbox"><button class="avatar" aria-haspopup="true" aria-label="Tài khoản">'+F.esc(ini)+'</button><div class="menu" hidden><div class="who">'+F.esc(u.name)+'<br>'+F.esc(u.email||'')+'</div>'+
        '<a href="'+A.url('profile')+'">'+A.icon('bank')+'Hồ sơ & Ngân hàng</a><button data-act="logout">'+A.icon('logout')+'Đăng xuất</button></div></div>';
    },
    bind:function(root,ctx){
      var box=root.querySelector('.userbox');var menu=box.querySelector('.menu');
      box.querySelector('.avatar').onclick=function(e){e.stopPropagation();menu.hidden=!menu.hidden;};
      document.addEventListener('click',function(){menu.hidden=true;});
      root.querySelector('[data-act="logout"]').onclick=function(){A.logoutFlow();};
      var n=root.querySelector('[data-act="next"]');if(n)n.onclick=function(){A.nextRoundFlow(ctx);};
      var e=root.querySelector('[data-act="end"]');if(e)e.onclick=function(){A.endGameFlow();};
    }
  };
  /* ---- luồng dùng chung ---- */
  A.logoutFlow=function(){A.modal.open({icon:'logout',title:'Đăng xuất?',sub:'Tiến độ của bạn được giữ nguyên.',
    actions:[{label:'Hủy',kind:'outline'},{label:'Đăng xuất',kind:'danger',onClick:async function(){await A.auth.logout();location.replace(A.url('login')+'?out=1');},keepOpen:true}]});};
  A.nextRoundFlow=function(ctx){var g=ctx.g;A.modal.open({icon:'refresh',title:'Chuyển sang Vòng '+(g.round+1)+'?',sub:'Thao tác này không thể hoàn tác.',
    body:'<div class="rows"><div class="row"><span>Cây trồng</span><b>Tiếp tục lớn</b></div><div class="row"><span>Lúa trong kho</span><b>Giảm chất lượng '+A.CFG.decayPerRound+'%</b></div><div class="row"><span>Hàng đang vận chuyển</span><b>Tiếp tục di chuyển</b></div></div>',
    actions:[{label:'Hủy',kind:'outline'},{label:'Chuyển vòng',onClick:async function(){await A.api.nextRound();A.toast('Đã chuyển sang Vòng '+(g.round+1)+'.');ctx.refresh();}}]});};
  A.endGameFlow=function(){A.modal.open({icon:'lock',title:'Kết thúc lượt chơi?',sub:'Sau khi kết thúc, lượt chơi chỉ còn để xem và không thể thao tác tiếp.',
    note:{type:'warn',text:'Hãy bán hoặc quy đổi hàng còn lại trước khi kết thúc nếu muốn.'},
    actions:[{label:'Hủy',kind:'outline'},{label:'Xác nhận kết thúc',kind:'danger',onClick:async function(){await A.api.endGame();A.go('end');},keepOpen:true}]});};
})(window);
