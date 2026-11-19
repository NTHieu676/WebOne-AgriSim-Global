(function(){var A=AgriSim,F=A.fmt,C=A.CFG;
  var selPlot=1,region='asia';
  function stat(cls,lbl,val,unit,sub,ic,go){return '<a class="stat '+cls+'" href="'+A.url(go)+'" style="color:inherit"><div class="lbl"><span>'+lbl+'</span><span class="chip">'+A.icon(ic)+'</span></div><div class="val num">'+val+'<small>'+unit+'</small></div><div class="sub">'+sub+'</div></a>';}
  function growth(ctx){var g=ctx.g,p=ctx.d.plots.filter(function(x){return x.id===selPlot;})[0]||ctx.d.plots[0];
    if(p.status==='empty')return '<div class="empty" style="padding:22px"><div class="ic">'+A.icon('sprout')+'</div><h3>Ô ruộng '+p.id+' đang trống</h3><p>Chi phí '+F.usdg(C.plantCost)+' · thu '+C.plantYield+' lúa · chờ '+C.growRounds+' vòng.</p>'+(ctx.ro?'':'<div class="acts"><button class="btn btn-primary btn-sm" data-plant="'+p.id+'">Trồng lúa</button></div>')+'</div>';
    var ready=p.status==='ready';
    var st=['Đã trồng · V'+p.plantedRound,'Sinh trưởng · V'+p.plantedRound+' → '+p.readyRound,(ready?'Sẵn sàng':'Dự kiến')+' · V'+p.readyRound];
    var curIdx=ready?2:1;
    var h='<div class="growth"><div class="line"></div><div class="stages">'+st.map(function(t,i){return '<div class="stage '+(i===curIdx?'cur':i>curIdx?'off':'')+'">'+(i===curIdx?'<span class="here"><i style="width:6px;height:6px;border-radius:50%;background:var(--orange)"></i> Bạn đang ở đây</span>':'<div style="height:22px"></div>')+'<div class="dot"></div><div class="ill">'+A.icon(i===0?'plus':i===1?'sprout':'leaf')+'</div>'+t+'</div>';}).join('')+'</div></div>';
    h+='<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:12px"><span class="badge '+(ready?'b-success':'b-info')+'">'+A.icon(ready?'check':'clock')+(ready?' Sẵn sàng thu hoạch':' Đang sinh trưởng · còn '+(p.readyRound-g.round)+' vòng')+'</span><span class="hint farm-foot-hint">'+(ready?C.plantYield+' lúa · chất lượng 100% · nhận tại '+F.region(g.startRegion):'Thu hoạch dự kiến ở Vòng '+p.readyRound)+'</span>'+(ready&&!ctx.ro?'<button class="btn btn-primary btn-sm" data-harvest="'+p.id+'">Thu hoạch</button>':'')+'</div>';
    return h;}
  function chart(ctx){var g=ctx.g;var vals=[1,2,3,4,5,6].map(function(r){return r<=g.round?A.store.price(region,'rice',r):null;});var mx=Math.max.apply(null,vals.filter(Boolean))*1.15;
    return '<div class="chart" role="img" aria-label="Giá lúa '+F.region(region)+' qua các vòng đã mở">'+vals.map(function(v,i){var r=i+1;return v==null?'<div class="b fut"><span>–</span><i></i></div>':'<div class="b'+(r===g.round?' cur':'')+'"><span class="num">'+F.num(v)+'</span><i style="height:'+Math.round(v/mx*100)+'%"></i></div>';}).join('')+'</div><div class="chart-lbl">'+[1,2,3,4,5,6].map(function(r){return '<span class="'+(r===g.round?'cur':'')+'">V'+r+'</span>';}).join('')+'</div>';}
  A.page({id:'home',greeting:true,bg:'cream-hills',guard:'game',panel:'market',
    skeleton:function(){return '<div class="dash-top"><div class="skel" style="height:280px;border-radius:24px"></div><div class="stat-grid" style="grid-template-columns:1fr 1fr">'+[1,2,3,4].map(function(){return '<div class="skel" style="height:130px;border-radius:20px"></div>';}).join('')+'</div></div><div class="dash-mid"><div class="skel" style="height:260px;border-radius:24px"></div><div class="skel" style="height:260px;border-radius:24px;background:#7aa59d"></div></div><div class="skel" style="height:260px;border-radius:24px"></div>';},
    render:function(ctx){var g=ctx.g,d=ctx.d;var h=g.history.slice(0,5);var empty=A.qs('state')==='empty';
      var opts=d.plots.map(function(p){return '<option value="'+p.id+'"'+(p.id===selPlot?' selected':'')+'>Ô ruộng '+p.id+'</option>';}).join('');
      var warnFull=!d.empty.length&&!ctx.ro?'<div class="banner banner-warn" style="margin:0">'+A.icon('alert')+'<span>Hết diện tích để trồng.</span><span class="sp"></span><a class="btn btn-accent btn-sm" href="'+A.url('farm')+'?buy=1">Mua thêm nông trại</a></div>':'';
      var rows=empty?'':h.map(function(x){return '<tr><td>'+x.round+'</td><td>'+F.esc(x.title)+'</td><td>'+F.esc(x.detail)+'</td><td class="r num '+(x.delta>0?'pos':x.delta<0?'neg':'')+'">'+(x.delta?F.signed(x.delta,2):'–')+'</td><td class="r num">'+F.num(x.balance,2)+'</td></tr>';}).join('');
      return '<div class="dash-top"><div class="card"><div class="card-head"><div><h2>Tiến trình mùa vụ</h2><div class="hint">Trạng thái nông trại của bạn ở vòng '+g.round+'</div></div><select class="select-pill" id="plotSel" aria-label="Chọn ô ruộng">'+opts+'</select></div><div id="growth">'+growth(ctx)+'</div>'+warnFull+'</div>'+
        '<div class="stat-grid">'+
        stat('stat--usdg','Số dư USDG',F.num(g.usdg),'USDG','Đã nạp thêm: '+F.usdg(g.topup),'wallet','profile')+
        stat('stat--lua','Lúa trong kho',F.num(d.stock.rice),'đơn vị','Chất lượng TB '+(d.avgQ?d.avgQ+'%':'–'),'leaf','inventory')+
        stat('stat--vang','Vàng trong kho',F.num(d.stock.gold),'đơn vị',d.stock.gold?'Đang có trong kho':'Chưa có hàng','coin','inventory')+
        stat('stat--ship','Đang vận chuyển',F.num(d.inTransit),'chuyến',d.inTransit?'Chuyến gần nhất đến Vòng '+g.shipments[0].arriveRound:'Không có chuyến nào','truck','market')+'</div></div>'+
        '<div class="dash-mid"><div class="card"><div class="card-head"><div><h2>Giá lúa qua các vòng</h2><div class="hint">Đơn vị: USDG / đơn vị · giá vòng tương lai được ẩn</div></div><div class="seg" id="rg"><button data-r="asia" class="'+(region==='asia'?'on':'')+'">Châu Á</button><button data-r="europe" class="'+(region==='europe'?'on':'')+'">Châu Âu</button></div></div><div id="chart">'+chart(ctx)+'</div></div>'+
        '<div class="card net"><div class="card-head"><div><h2 style="color:#fff">Tài sản ròng ước tính</h2><div class="sub">Không phải điểm số</div></div><span class="badge b-muted" style="background:rgba(255,255,255,.2);color:#fff">'+g.round+'/6 vòng</span></div>'+
        '<div class="row"><div class="ring" style="--p:'+(g.round/6*100)+'%"><span>'+g.round+'/6</span></div><div><div class="big num">'+F.num(d.net,2)+' USDG</div><span class="gain '+(d.gain<0?'neg':'')+'">'+A.icon('up')+' '+F.signed(d.gain,2)+' USDG so với vốn</span></div></div><p class="sub" style="margin-top:12px">Gồm USDG, hàng trong kho và hàng đang vận chuyển. Hàng trong pool tính riêng.</p></div></div>'+
        '<div class="card"><div class="card-head"><h2>Hoạt động gần nhất</h2><a class="btn btn-outline btn-sm" href="'+A.url('profile')+'?tab=history">Xem lịch sử</a></div>'+
        (empty?'<div class="empty"><div class="ic">'+A.icon('sprout')+'</div><h3>Chưa có hoạt động nào.</h3><p>Hãy trồng lúa ở trang Nông trại để bắt đầu.</p><div class="acts"><a class="btn btn-primary" href="'+A.url('farm')+'">Đến Nông trại</a></div></div>':
        '<div class="table-wrap"><table class="tbl"><thead><tr><th>Vòng</th><th>Thao tác</th><th>Chi tiết</th><th class="r">USDG</th><th class="r">Số dư sau</th></tr></thead><tbody>'+rows+'</tbody></table></div>')+'</div>';},
    bind:function(ctx,v){
      var gr=function(){v.querySelector('#growth').innerHTML=growth(ctx);bindActs();};
      function bindActs(){v.querySelectorAll('[data-harvest]').forEach(function(b){b.onclick=function(){A.flows.harvest(ctx,+b.dataset.harvest);};});v.querySelectorAll('[data-plant]').forEach(function(b){b.onclick=function(){A.flows.plant(ctx,+b.dataset.plant);};});}
      bindActs();
      v.querySelector('#plotSel').onchange=function(e){selPlot=+e.target.value;gr();};
      v.querySelectorAll('#rg button').forEach(function(b){b.onclick=function(){region=b.dataset.r;v.querySelectorAll('#rg button').forEach(function(x){x.classList.toggle('on',x===b);});v.querySelector('#chart').innerHTML=chart(ctx);};});}
  });
})();
