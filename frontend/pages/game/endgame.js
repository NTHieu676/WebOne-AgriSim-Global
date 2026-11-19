(function(){var A=AgriSim,F=A.fmt;
  A.page({id:'home',title:'Tổng kết',sub:'Kết quả lượt chơi của bạn.',bg:'sunny-barn',guard:'end',panel:'none',
    render:function(ctx){var g=ctx.g,d=ctx.d,s=g.stats;var left=g.lots.filter(function(l){return l.quality>0;});
      var goods=left.length?left.map(function(l){return F.num(l.qty)+' '+F.good(l.type).toLowerCase()+' · chất lượng '+l.quality+'% · '+F.region(l.region);}).join('<br>'):'Không còn hàng';
      var ok=d.gain>=0;
      return '<div class="end-hero"><div><div style="opacity:.85">Tài sản ròng ước tính</div><div class="big num">'+F.usdg2(d.net)+'</div><div style="opacity:.8;font-size:12px">Ước tính, không phải điểm số.</div></div>'+
        '<img src="'+A.ROOT+'assets/images/coins.png" alt=""><div class="net"><span class="gain '+(ok?'':'neg')+'" style="margin:0">'+A.icon('chart')+' '+F.signed(d.gain,2)+' USDG so với vốn</span></div></div>'+
        '<div class="end-stats">'+
        card('wallet','USDG còn lại','<span class="val num">'+F.num(g.usdg,2)+'<small>USDG</small></span>')+
        card('box','Hàng còn lại','<span class="sub" style="font-size:13px;color:var(--text)">'+goods+'</span>')+
        card('bank','Tổng tiền đã nạp thêm','<span class="val num">'+F.num(g.topup,2)+'<small>USDG</small></span>')+
        card('swap','Tổng phí swap','<span class="val num">'+F.num(s.swapFee,2)+'<small>USDG</small></span>')+
        card('truck','Tổng phí vận chuyển','<span class="val num">'+F.num(s.shipFee,2)+'<small>USDG</small></span>')+
        card('list','Số giao dịch (swap + bán)','<span class="val num">'+s.tx+'<small>giao dịch</small></span>')+'</div>'+
        '<div class="card"><div class="card-head"><h3>'+A.icon('calc')+' Cách tính</h3></div><p>Tài sản ròng = USDG hiện có + giá trị hàng trong kho + giá trị hàng đang vận chuyển. Thay đổi so với vốn = tài sản ròng − '+F.num(A.CFG.startUSDG)+' − tổng tiền nạp.</p>'+
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap"><button class="btn btn-danger" id="lo">Đăng xuất</button><button class="btn btn-primary" id="rp">Chơi lại</button></div></div>';
      function card(ic,l,v){return '<div class="stat"><div class="lbl"><span>'+l+'</span><span class="chip">'+A.icon(ic)+'</span></div>'+v+'</div>';}},
    bind:function(ctx,v){v.querySelector('#lo').onclick=A.logoutFlow;
      v.querySelector('#rp').onclick=function(){A.modal.open({icon:'refresh',title:'Chơi lại?',sub:'Tiến độ và lịch sử của lượt hiện tại sẽ bị thay thế bằng lượt mới.',
        note:{type:'warn',text:'Thao tác này không thể hoàn tác.'},actions:[{label:'Hủy',kind:'outline'},{label:'Xác nhận chơi lại',kind:'danger',keepOpen:true,onClick:async function(){await A.api.replay();A.go('start');}}]});};}
  });
})();
