/*
 * AgriSim.page(cfg) – dựng khung chuẩn (sidebar | topbar | nội dung | panel) cho mọi trang trong game.
 * cfg: {id, title, sub, greeting, bg, guard:'game', panel:'market|ship|none', render(ctx)->html, bind(ctx), skeleton()}
 * ?state=loading|error|empty để xem nhanh trạng thái theo Figma (empty do trang tự xử lý).
 */
(function(w){var A=w.AgriSim=w.AgriSim||{};var F=A.fmt;
  /* Gắn nhãn cột (data-label) cho từng ô để bảng hiển thị dạng thẻ trên điện thoại; ô chứa nút = hàng thao tác */
  function labelTables(root){root.querySelectorAll('table.tbl').forEach(function(t){
    var heads=[].map.call(t.querySelectorAll('thead th'),function(th){return th.textContent.trim();});
    t.querySelectorAll('tbody tr').forEach(function(tr){[].forEach.call(tr.children,function(td,i){td.setAttribute('data-label',heads[i]||'');if(td.querySelector('button,.btn'))td.classList.add('act');});});});}
  A.labelTables=labelTables;
  function skeleton(){return '<div class="stat-grid">'+[1,2,3,4].map(function(){return '<div class="skel" style="height:104px;border-radius:20px"></div>';}).join('')+'</div><div class="skel" style="height:220px;border-radius:24px"></div><div class="skel" style="height:260px;border-radius:24px"></div>';}
  A.page=function(cfg){
    if(!A.guard(cfg.guard||'game'))return;
    document.body.setAttribute('data-bg',cfg.bg||'cream-hills');
    var state=A.qs('state');var root=document.getElementById('app');
    var g0=A.store.peek()||{status:'playing',round:1,usdg:0,topup:0,plots:[],lots:[],shipments:[],pools:{rice:{asset:0,usdg:0},gold:{asset:0,usdg:0}},history:[]};var ro=g0.status==='ended';
    var hasPanel=cfg.panel&&cfg.panel!=='none';
    root.className='shell'+(hasPanel?' has-panel':'')+(ro?' is-end':'');
    var ctx={g:g0,d:A.store.derive(g0),ro:ro,cfg:cfg};
    root.innerHTML='<aside class="sidebar" id="sb"></aside><div class="main"><header class="topbar" id="tb"></header><div class="content" id="view"></div></div>'+(hasPanel?'<aside class="panel" id="pn"></aside>':'')+'<nav class="tabbar" id="tabs" aria-label="Điều hướng"></nav>';
    var view=document.getElementById('view');
    function shell(){var g=ctx.g;
      document.getElementById('sb').innerHTML=A.sidebar.html(cfg.id,ctx);
      document.getElementById('tabs').innerHTML=A.sidebar.tabbar(cfg.id);
      var tb=document.getElementById('tb');tb.innerHTML=A.navbar.html(cfg,g,ro);A.navbar.bind(tb,ctx);
      if(hasPanel)document.getElementById('pn').innerHTML=A.panel(cfg.panel,ctx);}
    /* Lượt đã kết thúc: mọi trang chỉ xem + liên kết quay về Tổng kết (trừ chính trang Tổng kết) */
    function banner(){if(!ro)return '';var link=cfg.guard==='end'?'':'<span class="sp"></span><a class="banner-link" href="'+A.url('end')+'">Xem tổng kết →</a>';
      return '<div class="banner banner-info" role="status">'+A.icon('info')+'<span>Lượt chơi đã kết thúc – bạn chỉ có thể xem.</span>'+link+'</div>';}
    async function load(showSk){
      if(showSk)view.innerHTML=banner()+(cfg.skeleton?cfg.skeleton():skeleton());
      try{
        if(state==='loading'&&showSk){return;}
        if(state==='error'&&showSk){await A.sleep(400);throw new Error('Không tải được dữ liệu. Dữ liệu của bạn vẫn an toàn.');}
        var g=await A.api.getGame();ctx.g=g;ctx.d=A.store.derive(g);ctx.ro=ro=g.status==='ended';
        root.classList.toggle('is-end',ro);shell();
        view.innerHTML=banner()+cfg.render(ctx);
        labelTables(view);
        if(cfg.bind)cfg.bind(ctx,view);
      }catch(e){
        shell();
        view.innerHTML='<div class="banner banner-error" role="alert">'+A.icon('err')+'<span>'+F.esc(e.message||'Không tải được dữ liệu.')+'</span><span class="sp"></span><button class="btn btn-outline btn-sm" id="retry">Thử lại</button></div>'+(cfg.errorHint||'');
        document.getElementById('retry').onclick=function(){state=null;history.replaceState(null,'',location.pathname);load(true);};
      }
    }
    ctx.refresh=function(){return load(false);};
    ctx.ui={F:F,A:A};
    shell();load(true);
    return ctx;
  };
  /* Panel navy bên phải */
  A.panel=function(kind,ctx){var g=ctx.g,d=ctx.d,n=A.store.notice(g.round);
    var scene=kind==='ship'?'bg-navy-panel.jpg':'illus-farm-landscape.jpg';
    var h='<div class="scene" style="background-image:url('+A.ROOT+'assets/images/'+scene+')" role="img" aria-label="Minh họa nông trại"></div>';
    h+='<h4>'+(kind==='ship'?'Thông báo vận chuyển':'Thông báo thị trường')+' <span class="badge b-orange" style="margin-left:6px">!</span></h4>';
    h+='<div class="pn-notice"><span class="badge b-warning">'+A.icon('alert')+' Vòng '+g.round+' · '+F.esc(n.t)+'</span><div>'+F.esc(n.short||n.d)+'</div></div>';
    if(kind==='market'){
      h+='<div class="sub">Lịch trình sắp tới</div>';
      var items=[];
      d.ready.forEach(function(p){items.push(['check','Thu hoạch Ô ruộng '+p.id,'✓ Sẵn sàng · Vòng '+g.round]);});
      d.growing.forEach(function(p){items.push(['sprout','Ô ruộng '+p.id+' đang trồng','Thu hoạch ở Vòng '+p.readyRound]);});
      g.shipments.slice(0,2).forEach(function(s){items.push(['truck','Chuyến '+s.id+' · '+s.qty+' '+F.good(s.type).toLowerCase(),F.region(s.from)+' → '+F.region(s.to)+' · Đến Vòng '+s.arriveRound]);});
      if(!items.length)items.push(['clock','Chưa có lịch trình','Hãy trồng lúa hoặc gửi hàng.']);
      h+=items.slice(0,4).map(function(i){return '<div class="pn-item"><span class="ic">'+A.icon(i[0])+'</span><div><b>'+F.esc(i[1])+'</b><small>'+F.esc(i[2])+'</small></div></div>';}).join('');
      h+='<a class="link" href="'+A.url('notices')+'">Xem tất cả thông báo →</a>';
    }else{
      h+='<div class="pn-item"><span class="ic">'+A.icon('info')+'</span><div><small>Phí vận chuyển hiện tại là <b style="display:inline">'+F.usdg(A.store.shipUnit(g.round),2)+'</b> cho mỗi đơn vị hàng'+(A.store.shipMultiplier(g.round)!==1?' (cước ×'+A.store.shipMultiplier(g.round)+' ở vòng này)':'')+'. Hàng đang đi không thể hủy và không thể bán.</small></div></div>';
      h+='<a class="link" href="'+A.url('inventory')+'">Xem kho hàng →</a>';
    }
    return h;};
})(window);
