(function(){var A=AgriSim,F=A.fmt,C=A.CFG;
  function plotCard(p,ctx){var g=ctx.g,ro=ctx.ro,s=p.status;
    var badge,detail,btn;
    if(s==='ready'){badge='<span class="badge b-success">'+A.icon('check')+' Sẵn sàng thu hoạch</span>';detail='<div class="detail">'+C.plantYield+' lúa · chất lượng 100% · nhận tại '+F.region(g.startRegion)+'<small>Chất lượng chỉ bắt đầu giảm sau khi lúa vào kho.</small></div>';btn='<button class="btn btn-primary btn-block" data-harvest="'+p.id+'"'+(ro?' disabled':'')+'>'+A.icon('sprout')+' Thu hoạch</button>';}
    else if(s==='growing'){badge='<span class="badge b-info">'+A.icon('clock')+' Đang sinh trưởng</span>';detail='<div class="detail">Còn '+(p.readyRound-g.round)+' vòng · thu '+C.plantYield+' lúa<small>Thu hoạch dự kiến vào Vòng '+p.readyRound+'.</small></div>';btn='<button class="btn btn-soft btn-block" disabled>Chờ đến vòng sau</button>';}
    else{badge='<span class="badge b-muted">○ Trống</span>';detail='<div class="detail">Chi phí '+F.usdg(C.plantCost)+' · thu '+C.plantYield+' lúa · chờ '+C.growRounds+' vòng<small>Thu hoạch dự kiến vào Vòng '+(g.round+C.growRounds)+' tại '+F.region(g.startRegion)+'.</small></div>';btn='<button class="btn btn-primary btn-block" data-plant="'+p.id+'"'+(ro?' disabled':'')+'>'+A.icon('sprout')+' Trồng lúa</button>';}
    return '<article class="plot '+(s==='ready'?'is-ready':s==='growing'?'is-grow':'is-empty')+'"><div class="top"><span class="ico">'+A.icon('sprout')+'</span>'+badge+'</div><div><h3>Ô ruộng '+p.id+'</h3><div class="sub">'+(s==='empty'?'Đất trống sẵn sàng gieo':s==='ready'?'Đã trồng ở vòng '+p.plantedRound:'Đang phát triển')+'</div></div>'+detail+btn+'</article>';}
  A.page({id:'farm',title:'Nông trại',sub:'Trồng lúa, thu hoạch và mở rộng diện tích.',bg:'misty-a',guard:'game',panel:'market',
    skeleton:function(){return '<div class="stat-grid">'+[1,2,3,4].map(function(){return '<div class="skel" style="height:70px;border-radius:20px"></div>';}).join('')+'</div><div class="skel" style="height:80px;border-radius:24px"></div><div class="plot-grid">'+[1,2].map(function(){return '<div class="skel" style="height:230px;border-radius:24px"></div>';}).join('')+'</div>';},
    render:function(ctx){var g=ctx.g,d=ctx.d,ro=ctx.ro;var n=d.plots.length;
      var acts=[];if(ro)acts.push('Chỉ xem (lượt chơi đã kết thúc)');else{if(d.ready.length)acts.push('Thu hoạch '+d.ready.length+' ô');if(d.empty.length)acts.push('Trồng lúa '+d.empty.length+' ô');if(!d.empty.length)acts.push(d.atMax?'Không thể mua thêm ô':'Mua thêm nông trại');}
      var full=!d.empty.length;var cls=full?'':'ok';
      var call='<div class="callout '+(full?'':'ok')+'"><span class="ico">'+A.icon(full?'alert':'check')+'</span><div class="t"><b>Trạng thái nông trại '+(full?'<span class="badge b-warning" style="margin-left:6px">Hết diện tích để trồng</span>':'<span class="badge b-success" style="margin-left:6px">Sẵn sàng</span>')+'</b><span class="hint">Có thể: '+acts.join(' · ')+'</span></div>'+
        (full&&!ro&&!d.atMax?'<div class="acts"><button class="btn btn-primary btn-sm" data-buy>Mua thêm nông trại</button><button class="btn btn-ghost btn-sm" data-wait>Chờ đến vòng sau</button></div>':'')+'<span class="badge b-'+(g.startRegion==='asia'?'asia':'europe')+'">Khu vực: '+F.region(g.startRegion)+'</span></div>';
      var buy='';
      if(full){buy=d.atMax?'<article class="plot plot--buy"><div class="top"><h3>Mua thêm nông trại</h3><span class="badge b-muted">'+A.icon('lock')+' Đã đạt giới hạn</span></div><div class="detail">Bạn đã đạt số ô ruộng tối đa ('+n+'/'+C.maxPlots+').<small>Không thể mua thêm.</small></div><button class="btn btn-soft btn-block" disabled>Không thể mua thêm</button></article>':
        '<article class="plot plot--buy"><div class="top"><div><h3>Mua thêm nông trại</h3><div class="sub">Mở rộng thêm 1 ô ruộng</div></div><span class="ico">'+A.icon('plus')+'</span></div><div class="detail">Giá mở rộng: '+F.usdg(C.plotPrice)+'<small>Số ô hiện có: '+n+'/'+C.maxPlots+'</small></div><button class="btn btn-primary btn-block" data-buy'+(ro?' disabled':'')+'>Mua thêm nông trại</button><button class="btn btn-ghost btn-block" data-wait'+(ro?' disabled':'')+'>Chờ</button></article>';}
      return '<div class="stat-grid">'+[['Số ô ruộng',n+'/'+C.maxPlots+' ô','grid'],['Chi phí trồng',F.usdg(C.plantCost),''],['Sản lượng dự kiến',C.plantYield+' lúa / ô',''],['Thời gian chờ',C.growRounds+' vòng','']].map(function(x){return '<div class="stat" style="background:var(--surface);padding:12px 14px"><div class="lbl"><span>'+x[0]+'</span></div><div class="val" style="font-size:var(--fs-xl)">'+x[1]+'</div></div>';}).join('')+'</div>'+call+
        '<div class="plot-grid">'+d.plots.map(function(p){return plotCard(p,ctx);}).join('')+buy+'</div>';},
    bind:function(ctx,v){
      v.querySelectorAll('[data-plant]').forEach(function(b){b.onclick=function(){A.flows.plant(ctx,+b.dataset.plant);};});
      v.querySelectorAll('[data-harvest]').forEach(function(b){b.onclick=function(){A.flows.harvest(ctx,+b.dataset.harvest);};});
      v.querySelectorAll('[data-buy]').forEach(function(b){b.onclick=function(){A.flows.buyPlot(ctx);};});
      v.querySelectorAll('[data-wait]').forEach(function(b){b.onclick=function(){A.toast('Đã bỏ qua. Hãy quay lại ở vòng sau khi có ô sẵn sàng.');};});
      if(A.qs('buy')&&!ctx.ro&&!ctx._buyOpened){ctx._buyOpened=true;history.replaceState(null,'',location.pathname);
        if(ctx.d.empty.length)A.toast('Bạn vẫn còn ô trống để trồng lúa.');else A.flows.buyPlot(ctx);}}
  });
})();
