(function(){var A=AgriSim,F=A.fmt;
  var type='all',reg='all';
  function qcls(q){return q<50?'q-low':q<90?'q-mid':'';}
  function acts(l,ctx){if(ctx.ro)return '<button class="btn btn-sm" disabled>Bán</button> <button class="btn btn-sm" disabled>Gửi hàng</button> <button class="btn btn-sm" disabled>Swap</button>';
    var dead=l.quality<=0;return '<button class="btn btn-primary btn-sm" data-sell="'+l.id+'"'+(dead?' disabled':'')+'>Bán</button> <button class="btn btn-outline btn-sm" data-ship="'+l.id+'"'+(dead?' disabled':'')+'>Gửi hàng</button> <a class="btn btn-soft btn-sm" href="'+A.url('pool')+'?lot='+l.id+'"'+(l.quality<100?' aria-disabled="true" title="Pool chỉ nhận hàng chất lượng 100%"':'')+'>Swap</a>';}
  function ql(l){return l.quality<=0?'<span class="badge b-danger">'+A.icon('x')+' Đã hỏng · 0%</span>':'<div style="display:flex;gap:8px;align-items:center"><div class="bar '+qcls(l.quality)+'" style="flex:1"><i style="width:'+l.quality+'%"></i></div><b class="num">'+l.quality+'%</b></div>';}
  A.page({id:'inventory',title:'Kho hàng',sub:'Các lô hàng bạn đang sở hữu.',bg:'sunny-barn',guard:'game',panel:'none',
    skeleton:function(){return '<div class="skel" style="height:56px;border-radius:24px"></div><div class="skel" style="height:300px;border-radius:24px"></div>';},
    render:function(ctx){var g=ctx.g;var all=g.lots.slice().sort(function(a,b){return a.id<b.id?-1:1;});
      var lots=all.filter(function(l){return (type==='all'||(type==='rice'?l.type==='rice':l.type==='gold'))&&(reg==='all'||l.region===reg);});
      var total=lots.reduce(function(s,l){return s+l.qty;},0);
      if(A.qs('state')==='empty'||!all.length)return '<div class="card"><div class="empty"><div class="ic">'+A.icon('box')+'</div><h3>Kho đang trống</h3><p>Hãy thu hoạch lúa ở Nông trại hoặc mua hàng qua pool.</p><div class="acts"><a class="btn btn-primary" href="'+A.url('farm')+'">Đi tới Nông trại</a><a class="btn btn-outline" href="'+A.url('pool')+'">Đi tới Trao đổi</a></div></div></div>';
      var filt='<div class="filters"><div class="seg" id="ft">'+[['all','Tất cả'],['rice','Lúa'],['gold','Vàng']].map(function(t){return '<button data-t="'+t[0]+'" class="'+(type===t[0]?'on':'')+'">'+t[1]+'</button>';}).join('')+'</div>'+
        '<select class="select-pill" id="fr" aria-label="Lọc khu vực"><option value="all">Tất cả khu vực</option><option value="asia"'+(reg==='asia'?' selected':'')+'>Châu Á</option><option value="europe"'+(reg==='europe'?' selected':'')+'>Châu Âu</option></select>'+
        '<span class="hint">'+A.icon('info')+' Hàng đang vận chuyển và hàng trong pool được hiển thị riêng, không tính vào kho.</span></div>';
      var body;
      if(!lots.length)body='<div class="empty"><div class="ic">'+A.icon('box')+'</div><h3>Không có lô nào khớp bộ lọc</h3><p>Hãy đổi bộ lọc để xem các lô khác.</p><div class="acts"><button class="btn btn-outline" id="clr">Xóa bộ lọc</button></div></div>';
      else body='<div class="table-wrap tbl-lots"><table class="tbl"><thead><tr><th>Mã lô</th><th>Loại</th><th class="r">Số lượng</th><th style="width:200px">Chất lượng</th><th>Khu vực</th><th class="r">Thao tác</th></tr></thead><tbody>'+
        lots.map(function(l){return '<tr class="'+(l.quality<=0?'is-dead':'')+'"><td class="num"><b>'+l.id+'</b></td><td><span class="type-ico '+(l.type==='gold'?'gold':'')+'">'+A.icon(l.type==='gold'?'coin':'leaf')+'</span>'+F.good(l.type)+'</td><td class="r num">'+F.num(l.qty,l.qty%1?2:0)+' đơn vị</td><td>'+ql(l)+'</td><td>'+F.regionBadge(l.region)+'</td><td class="r" style="white-space:nowrap">'+acts(l,ctx)+'</td></tr>';}).join('')+'</tbody></table></div>'+
        '<div class="lot-cards">'+lots.map(function(l){return '<div class="lot-card"><div style="display:flex;justify-content:space-between;align-items:center"><b>'+l.id+' · '+F.good(l.type)+'</b>'+F.regionBadge(l.region)+'</div><div class="hint">'+F.num(l.qty,l.qty%1?2:0)+' đơn vị</div>'+ql(l)+'<div style="display:flex;gap:8px;flex-wrap:wrap">'+acts(l,ctx)+'</div></div>';}).join('')+'</div>';
      return '<div class="card">'+filt+'</div><div class="card"><div class="card-head"><h2>Danh sách lô hàng ('+lots.length+' lô)</h2><span class="hint">Tổng: '+F.num(total,total%1?2:0)+' đơn vị</span></div>'+body+
        '<div class="hint" style="margin-top:12px">Gợi ý: Pool chỉ nhận hàng chất lượng 100%. Lô đã hỏng (0%) chỉ để theo dõi, không thể giao dịch.</div></div>';},
    bind:function(ctx,v){
      v.querySelectorAll('#ft button').forEach(function(b){b.onclick=function(){type=b.dataset.t;ctx.refresh();};});
      var fr=v.querySelector('#fr');if(fr)fr.onchange=function(){reg=fr.value;ctx.refresh();};
      var c=v.querySelector('#clr');if(c)c.onclick=function(){type='all';reg='all';ctx.refresh();};
      v.querySelectorAll('[data-sell]').forEach(function(b){b.onclick=function(){A.flows.sell(ctx,b.dataset.sell);};});
      v.querySelectorAll('[data-ship]').forEach(function(b){b.onclick=function(){A.flows.ship(ctx,b.dataset.ship);};});
      v.querySelectorAll('a[aria-disabled="true"]').forEach(function(a){a.onclick=function(e){e.preventDefault();};});}
  });
})();
