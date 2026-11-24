(function(){var A=AgriSim,F=A.fmt,C=A.CFG;
  var st={type:'rice',dir:'sell',lot:A.qs('lot'),amt:''};
  function eligible(g){return g.lots.filter(function(l){return l.type===st.type&&l.quality>=100;});}
  A.page({id:'pool',title:'Trao đổi qua pool',sub:'Đổi hàng lấy USDG hoặc đổi USDG lấy hàng với pool thanh khoản.',bg:'sunny-barn',guard:'game',panel:'none',
    skeleton:function(){return '<div class="pool-grid"><div class="skel" style="height:460px;border-radius:24px"></div><div class="skel" style="height:360px;border-radius:24px"></div></div>';},
    render:function(ctx){var g=ctx.g;var P=g.pools;
      var po=['rice','gold'].map(function(t){var p=P[t];return '<button class="pool-opt '+(st.type===t?'on':'')+'" data-pool="'+t+'"><b>Pool '+F.good(t)+'–USDG <span class="badge b-muted">Phí '+F.num(C.swapFee*100,1)+'%</span></b><small>Dự trữ: '+F.num(p.asset)+' '+F.good(t).toLowerCase()+' · '+F.num(p.usdg)+' USDG</small></button>';}).join('');
      return '<div class="pool-grid"><div class="card"><div class="step-t" style="margin-top:0">1. Chọn pool</div><div class="pool-opts">'+po+'</div>'+
        '<div class="step-t">2. Chiều trao đổi</div><div class="seg seg--full" id="dir"><button data-d="sell" class="'+(st.dir==='sell'?'on':'')+'">'+A.icon('swap')+' Bán hàng lấy USDG</button><button data-d="buy" class="'+(st.dir==='buy'?'on':'')+'">'+A.icon('swap')+' Mua hàng bằng USDG</button></div>'+
        '<div id="inputs"></div></div><div class="card" id="res"></div></div>';},
    bind:function(ctx,v){var g=ctx.g;
      function inputs(){var h='';var el=eligible(g);
        if(st.dir==='sell'){
          if(!el.some(function(l){return l.id===st.lot;}))st.lot=el[0]&&el[0].id;
          h+='<div class="step-t">3. Chọn lô</div>'+(el.length?'<select class="input" id="lot">'+el.map(function(l){return '<option value="'+l.id+'"'+(l.id===st.lot?' selected':'')+'>'+l.id+' · '+F.good(l.type)+' · '+l.qty+' đơn vị · chất lượng '+l.quality+'% · '+F.region(l.region)+'</option>';}).join('')+'</select><div class="help" style="margin-top:6px">Pool chỉ nhận hàng chất lượng 100%.</div>':'<div class="note note-warn">'+A.icon('alert')+'<span>Bạn chưa có lô '+F.good(st.type).toLowerCase()+' chất lượng 100% để đưa vào pool. Hãy thu hoạch thêm ở Nông trại.</span></div>');
          var l=el.filter(function(x){return x.id===st.lot;})[0];
          h+='<div class="step-t">4. Số lượng <span class="help" style="float:right;font-weight:400">Khả dụng: '+(l?l.qty:0)+' '+F.good(st.type).toLowerCase()+'</span></div><div class="input-wrap"><input class="input num" id="amt" inputmode="decimal" value="'+(st.amt||'')+'" placeholder="Nhập số lượng"'+(l?'':' disabled')+'><button type="button" class="btn btn-soft btn-sm" id="max" style="position:absolute;right:8px;top:6px">Tối đa</button></div>';}
        else h+='<div class="step-t">3. Số USDG muốn dùng <span class="help" style="float:right;font-weight:400">Khả dụng: '+F.num(g.usdg,2)+' USDG</span></div><div class="input-wrap"><input class="input num" id="amt" inputmode="decimal" value="'+(st.amt||'')+'" placeholder="Nhập số USDG"><button type="button" class="btn btn-soft btn-sm" id="max" style="position:absolute;right:8px;top:6px">Tối đa</button></div>';
        h+='<div class="err-text" id="aerr" style="margin-top:6px" hidden></div>';
        v.querySelector('#inputs').innerHTML=h;
        var lot=v.querySelector('#lot');if(lot)lot.onchange=function(){st.lot=lot.value;st.amt='';inputs();quote();};
        var amt=v.querySelector('#amt'),mx=v.querySelector('#max');
        if(amt)amt.oninput=function(){st.amt=amt.value.replace(',','.');quote();};
        if(mx)mx.onclick=function(){var l2=eligible(g).filter(function(x){return x.id===st.lot;})[0];st.amt=String(st.dir==='sell'?(l2?l2.qty:0):Math.floor(g.usdg));amt.value=st.amt;quote();};}
      var q=null;
      function quote(){var res=v.querySelector('#res');var n=Number(st.amt);var err=null;var l=eligible(g).filter(function(x){return x.id===st.lot;})[0];
        if(ctx.ro)err=null;
        if(st.amt!==''){if(!(n>0))err='Nhập số lớn hơn 0.';else if(st.dir==='sell'&&(!l||n>l.qty))err='Số lượng vượt mức khả dụng.';else if(st.dir==='buy'&&n>g.usdg)err='Số USDG vượt số dư hiện có.';}
        var e=v.querySelector('#aerr');e.hidden=!err;if(err)e.innerHTML=A.icon('err')+err;var amt=v.querySelector('#amt');if(amt)amt.classList.toggle('is-invalid',!!err);
        q=(st.amt!==''&&!err&&(st.dir==='buy'||l))?A.store.quoteSwap(g,st.dir==='sell'?{type:st.type,dir:'sell',qty:n,region:l.region}:{type:st.type,dir:'buy',usdg:n}):null;
        var gd=F.good(st.type).toLowerCase();
        function row(a,b,c){return '<div class="row"><span>'+a+'</span><b class="'+(c||'')+'">'+b+'</b></div>';}
        var rows=q?(row('Lượng đưa vào',q.inAmt+' '+(st.dir==='sell'?gd:'USDG'))+row('Phí',F.num(q.fee,q.feeUnit==='USDG'?2:2)+' '+(q.feeUnit==='USDG'?'USDG':gd))+row('Lượng nhận',F.num(q.out,2)+' '+(q.outUnit==='USDG'?'USDG':gd),'pos')+row('Tỷ giá pool',F.num(q.spot,3))+row('Giá thị trường cùng mặt hàng',F.usdg2(q.market))+row('Tỷ giá thực hiện',F.num(q.eff,3))+row('Chênh lệch so với tỷ giá pool',F.num(Math.abs(q.dev),2)+'%',Math.abs(q.dev)>3?'neg':'')):
          '<div class="row"><span>Nhập số lượng để xem kết quả dự kiến.</span><b></b></div>';
        res.innerHTML='<div class="card-head"><h3>Kết quả dự kiến</h3><span class="badge b-success">'+A.icon('check')+' Sẵn sàng</span></div><div class="rows">'+rows+'</div>'+
          (q&&Math.abs(q.dev)>2?'<div class="note note-info">'+A.icon('info')+'<span>Bạn nhận ít hơn theo tỷ lệ khi giao dịch lớn so với quy mô pool.</span></div>':'')+
          '<button class="btn btn-primary btn-block" id="ok"'+(!q||ctx.ro?' disabled':'')+'>Xác nhận swap</button>';
        var ok=v.querySelector('#ok');ok.onclick=confirm;}
      function confirm(){if(!q)return;var gd=F.good(st.type).toLowerCase();var l=eligible(g).filter(function(x){return x.id===st.lot;})[0];
        var rows=st.dir==='sell'?[['Đưa vào','−'+q.inAmt+' '+gd+' (lô '+st.lot+')','neg'],['Phí',F.num(q.fee,2)+' '+gd],['Nhận','+'+F.num(q.out,2)+' USDG','pos'],['Tỷ giá thực hiện',F.num(q.eff,3)+' (chênh lệch '+F.num(Math.abs(q.dev),2)+'%)'],['Số dư sau swap',F.usdg2(q.after)]]:
          [['Đưa vào','−'+F.num(q.inAmt,2)+' USDG','neg'],['Phí',F.num(q.fee,2)+' USDG'],['Nhận','+'+F.num(q.out,2)+' '+gd,'pos'],['Tỷ giá thực hiện',F.num(q.eff,3)],['Số dư sau swap',F.usdg2(q.after)]];
        var o=st.dir==='sell'?{type:st.type,dir:'sell',lotId:st.lot,qty:Number(st.amt),region:l.region}:{type:st.type,dir:'buy',usdg:Number(st.amt)};
        A.modal.open({icon:'swap',title:'Xác nhận swap',sub:'Pool '+F.good(st.type)+'–USDG · '+(st.dir==='sell'?'Bán hàng lấy USDG':'Mua hàng bằng USDG'),rows:rows,
          actions:[{label:'Hủy',kind:'outline'},{label:'Xác nhận swap',onClick:async function(){var r=await A.api.swap(o);st.amt='';
            A.toast(st.dir==='sell'?'Đã bán '+o.qty+' '+gd+' và nhận '+F.usdg2(r.out)+'.':'Đã mua '+F.num(r.out,2)+' '+gd+' bằng '+F.usdg2(o.usdg)+'.');ctx.refresh();}}]});}
      v.querySelectorAll('[data-pool]').forEach(function(b){b.onclick=function(){st.type=b.dataset.pool;st.amt='';st.lot=null;v.querySelectorAll('[data-pool]').forEach(function(x){x.classList.toggle('on',x===b);});inputs();quote();};});
      v.querySelectorAll('#dir button').forEach(function(b){b.onclick=function(){st.dir=b.dataset.d;st.amt='';v.querySelectorAll('#dir button').forEach(function(x){x.classList.toggle('on',x===b);});inputs();quote();};});
      if(st.lot){var li=g.lots.filter(function(l){return l.id===st.lot;})[0];if(li){st.type=li.type;v.querySelectorAll('[data-pool]').forEach(function(x){x.classList.toggle('on',x.dataset.pool===st.type);});}}
      inputs();quote();}
  });
})();
