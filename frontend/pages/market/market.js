(function(){var A=AgriSim,F=A.fmt,C=A.CFG;
  var tab=A.qs('tab')==='ship'?'ship':'market';var reg=null;
  function tabs(){return '<div class="seg" id="tabs"><button data-t="market" class="'+(tab==='market'?'on':'')+'">Thị trường</button><button data-t="ship" class="'+(tab==='ship'?'on':'')+'">Chuyến hàng</button></div>';}
  function regionCard(r,ctx){var g=ctx.g,n=A.store.notice(g.round);var pr=function(t){return A.store.price(r,t,g.round);},prev=function(t){return g.round>1?A.store.price(r,t,g.round-1):pr(t);};
    function ch(t){var d=pr(t)-prev(t);return d>0?'<div class="up">▲ +'+F.num(d)+'</div>':d<0?'<div class="down">▼ −'+F.num(-d)+'</div>':'<div class="hint">Ổn định</div>';}
    var have={rice:0,gold:0};g.lots.forEach(function(l){if(l.region===r&&l.quality>0)have[l.type]+=l.qty;});
    return '<button class="region-card '+(reg===r?'on':'')+'" data-r="'+r+'"><div style="display:flex;justify-content:space-between;align-items:center">'+F.regionBadge(r)+(reg===r?'<span class="badge b-success">'+A.icon('check')+' Đang xem</span>':'<span class="link" style="font-size:12px">Xem khu vực →</span>')+'</div>'+
      '<div class="hint" style="margin-top:8px;color:var(--orange-600);font-weight:700">Giai đoạn '+Math.min(g.round,3)+' · '+F.esc(n.t)+'</div><div class="goods"><div class="good"><small>Lúa</small><b class="num">'+F.usdg2(pr('rice'))+'</b>'+ch('rice')+'</div><div class="good"><small>Vàng</small><b class="num">'+F.usdg2(pr('gold'))+'</b>'+ch('gold')+'</div></div>'+
      '<div class="hint">Hàng bạn đang có tại đây: <b>'+have.rice+' lúa · '+have.gold+' vàng</b></div></button>';}
  function marketTab(ctx){var g=ctx.g;reg=reg||g.startRegion;var other=reg==='asia'?'europe':'asia';
    var lots=g.lots.filter(function(l){return l.region===reg&&l.quality>0;});
    var body=lots.length||A.qs('state')==='empty'&&false?'':'';
    if(!lots.length)body='<div class="empty"><div class="ic">'+A.icon('box')+'</div><h3>Chưa có hàng tại khu vực này.</h3><p>Hãy thu hoạch, hoặc gửi hàng từ khu vực khác sang '+F.region(reg)+'.</p><div class="acts"><button class="btn btn-primary" data-shipgo'+(ctx.ro?' disabled':'')+'>Gửi hàng</button></div></div>';
    else body='<div class="table-wrap"><table class="tbl"><thead><tr><th>Mã lô</th><th>Loại</th><th class="r">Số lượng</th><th class="r">Chất lượng</th><th class="r">Giá</th><th class="r">Doanh thu ước tính</th><th class="r">Thao tác</th></tr></thead><tbody>'+
      lots.map(function(l){var p=A.store.price(reg,l.type,g.round);return '<tr><td><b>'+l.id+'</b></td><td>'+F.good(l.type)+'</td><td class="r num">'+F.num(l.qty,l.qty%1?2:0)+'</td><td class="r num">'+l.quality+'%</td><td class="r num">'+F.usdg2(p)+'</td><td class="r num pos">'+F.usdg2(p*l.qty*l.quality/100)+'</td><td class="r"><button class="btn btn-primary btn-sm" data-sell="'+l.id+'"'+(ctx.ro?' disabled':'')+'>Bán</button></td></tr>';}).join('')+'</tbody></table></div>';
    return '<div class="region-cards">'+regionCard('asia',ctx)+regionCard('europe',ctx)+'</div><div class="card"><div class="card-head"><h3>Các lô có thể bán tại '+F.region(reg)+'</h3><span class="hint">Doanh thu = Giá × Số lượng × Chất lượng</span></div>'+body+
      '<div style="text-align:right;margin-top:10px"><a href="#" data-shipgo style="font-size:13px">Gửi hàng sang '+F.region(other)+' →</a></div></div>';}
  function shipTab(ctx){var g=ctx.g;var ss=g.shipments;
    var head='<div class="card-head"><h3>Danh sách chuyến hàng</h3><span class="hint">Phí vận chuyển: '+F.usdg2(C.shipFeePerUnit)+'/đơn vị · Thời gian: '+C.shipRounds+' vòng</span></div>';
    if(A.qs('state')==='empty'||!ss.length)return '<div class="card">'+head+'<div class="empty"><div class="ic">'+A.icon('truck')+'</div><h3>Chưa có chuyến hàng nào.</h3><p>Gửi lô hàng từ kho sang khu vực khác để tận dụng chênh lệch giá mỗi vòng.</p><div class="acts"><button class="btn btn-primary" data-shipgo'+(ctx.ro?' disabled':'')+'>Gửi hàng</button></div></div></div>';
    return '<div class="card">'+head+'<div class="table-wrap"><table class="tbl"><thead><tr><th>Mã chuyến</th><th>Hàng</th><th class="r">Số lượng</th><th>Nơi đi → Nơi đến</th><th class="r">Phí đã trả</th><th class="r">Vòng gửi</th><th class="r">Vòng đến</th></tr></thead><tbody>'+
      ss.map(function(s){return '<tr><td><b>'+s.id+'</b></td><td>'+F.good(s.type)+'</td><td class="r num">'+s.qty+'</td><td>'+F.regionBadge(s.from)+' → '+F.regionBadge(s.to)+'</td><td class="r num">'+F.usdg2(s.fee)+'</td><td class="r">'+s.sentRound+'</td><td class="r">'+s.arriveRound+'</td></tr>';}).join('')+'</tbody></table></div><div class="hint" style="margin-top:10px">'+A.icon('info')+' Chuyến đang đi không thể hủy và hàng trong chuyến không thể bán.</div></div>';}
  A.page({id:'market',title:'Thị trường & Vận chuyển',sub:'Giá hai khu vực và các chuyến hàng của bạn.',bg:'mint-house',guard:'game',panel:'market',
    skeleton:function(){return '<div class="skel" style="height:44px;width:260px;border-radius:999px"></div><div class="region-cards"><div class="skel" style="height:200px;border-radius:24px"></div><div class="skel" style="height:200px;border-radius:24px"></div></div><div class="skel" style="height:240px;border-radius:24px"></div>';},
    render:function(ctx){var hd='<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">'+tabs()+(tab==='ship'&&!ctx.ro?'<button class="btn btn-primary btn-sm" data-shipgo>'+A.icon('truck')+' Gửi hàng</button>':'')+'</div>';
      return hd+(tab==='ship'?shipTab(ctx):marketTab(ctx));},
    bind:function(ctx,v){
      v.querySelectorAll('#tabs button').forEach(function(b){b.onclick=function(){tab=b.dataset.t;history.replaceState(null,'',location.pathname+(tab==='ship'?'?tab=ship':''));ctx.refresh();};});
      v.querySelectorAll('[data-r]').forEach(function(b){b.onclick=function(){reg=b.dataset.r;ctx.refresh();};});
      v.querySelectorAll('[data-sell]').forEach(function(b){b.onclick=function(){A.flows.sell(ctx,b.dataset.sell);};});
      v.querySelectorAll('[data-shipgo]').forEach(function(b){b.onclick=function(e){e.preventDefault();if(ctx.ro)return;A.flows.ship(ctx);};});}
  });
})();
