/* Các luồng thao tác có hộp xác nhận dùng chung (BR-03: mọi thao tác đổi tài sản đều phải xác nhận). */
(function(w){var A=w.AgriSim=w.AgriSim||{};var F=A.fmt;var C=A.CFG;
  var Fl=A.flows={};
  function usd(n){return F.usdg(n);}
  /* ---------- Trồng lúa ---------- */
  Fl.plant=function(ctx,plotId){var g=ctx.g;var late=g.round+C.growRounds>C.rounds;var poor=g.usdg<C.plantCost;
    A.modal.open({icon:'sprout',title:'Xác nhận trồng lúa',sub:'Ô ruộng '+plotId+' · Khu vực '+F.region(g.startRegion),
      rows:[['Trừ','−'+usd(C.plantCost),'neg'],['Nhận sau '+C.growRounds+' vòng','+'+C.plantYield+' lúa','pos'],['Thu hoạch dự kiến','Vòng '+(g.round+C.growRounds)],['Số dư sau khi trồng',usd(g.usdg-C.plantCost)]],
      note:late?{type:'warn',text:'Thu hoạch dự kiến vượt Vòng 6 nên không thể trồng thêm ở vòng này.'}:poor?{type:'err',text:'Không đủ USDG để trồng lúa.'}:null,
      actions:[{label:'Hủy',kind:'outline'},{label:'Xác nhận trồng',disabled:late||poor,onClick:async function(){await A.api.plant(plotId);A.toast('Đã trồng lúa. Thu hoạch được ở vòng '+(g.round+C.growRounds)+'.');ctx.refresh();}}]});};
  /* ---------- Thu hoạch ---------- */
  Fl.harvest=function(ctx,plotId){var g=ctx.g;
    A.modal.open({icon:'sprout',title:'Xác nhận thu hoạch',sub:'Ô ruộng '+plotId,
      rows:[['Nhận',C.plantYield+' lúa · chất lượng 100%','pos'],['Nhập vào','Kho · '+F.region(g.startRegion)]],
      note:{type:'info',text:'Chất lượng chỉ bắt đầu giảm sau khi lúa vào kho.'},
      actions:[{label:'Hủy',kind:'outline'},{label:'Xác nhận thu hoạch',onClick:async function(){await A.api.harvest(plotId);A.toast('Đã thu hoạch '+C.plantYield+' lúa.');ctx.refresh();}}]});};
  /* ---------- Mua thêm nông trại (theo BPMN-F4.4) ---------- */
  Fl.buyPlot=function(ctx){var g=ctx.g,n=g.plots.length;
    if(n>=C.maxPlots){return A.modal.open({icon:'sprout',title:'Không thể mở rộng thêm',sub:'Mua thêm nông trại',
      note:{type:'info',text:'Bạn đã đạt số ô ruộng tối đa ('+n+'/'+C.maxPlots+'). Không thể mua thêm.'},actions:[{label:'Đóng',kind:'outline'}]});}
    if(g.usdg<C.plotPrice){var need=C.plotPrice-g.usdg;
      return A.modal.open({icon:'sprout',title:'Mua thêm nông trại',sub:'Mở rộng thêm 1 ô ruộng mới',
        rows:[['Giá mở rộng','−'+usd(C.plotPrice),'neg'],['Số dư hiện có',usd(g.usdg)]],
        note:{type:'err',text:'Bạn thiếu <b>'+usd(need)+'</b> để mua thêm nông trại. Bạn có muốn nạp thêm USDG giả lập không?'},
        actions:[{label:'Không, chờ vòng sau',kind:'outline'},{label:'Nạp USDG',onClick:function(){setTimeout(function(){Fl.topupPick(ctx,{min:need,onDone:function(){ctx.refresh().then(function(){Fl.buyPlot(ctx);});}});},0);}}]});}
    A.modal.open({icon:'sprout',title:'Mua thêm nông trại',sub:'Mở rộng thêm 1 ô ruộng mới',
      rows:[['Giá mở rộng','−'+usd(C.plotPrice),'neg'],['Số ô hiện có → sau khi mua',n+' → '+(n+1)],['Phí giao dịch',usd(0)],['Số dư sau khi mua',usd(g.usdg-C.plotPrice)]],
      actions:[{label:'Hủy',kind:'outline'},{label:'Xác nhận mua',onClick:async function(){await A.api.buyPlot();A.toast('Đã mua thêm nông trại.');ctx.refresh();}}]});};
  /* ---------- Nạp USDG (BR-19: 100–5.000, bội số 100; tiền giả lập) ---------- */
  Fl.topupConfirm=function(ctx,amount,onDone){A.payment.open(ctx,{amount:amount,onDone:onDone});};  // mở quy trình thanh toán giả lập (components/payment)
  Fl.topupPick=function(ctx,o){o=o||{};var steps=C.topupSteps,def=Math.max(o.min||0,100);def=Math.ceil(def/100)*100;
    var body='<div class="field"><label>Số USDG muốn nạp</label><input class="input num" id="tpAmt" inputmode="numeric" value="'+def+'"><div class="help">Số nguyên từ 100 đến 5.000 USDG, mỗi lần.</div><div class="err-text" id="tpErr" hidden></div></div><div class="chips">'+steps.map(function(s){return '<button type="button" class="chip-btn" data-v="'+s+'">'+F.num(s)+'</button>';}).join('')+'</div><div style="height:12px"></div>';
    var b=A.modal.open({icon:'bank',title:'Nạp USDG giả lập',sub:'Chọn nhanh mệnh giá hoặc nhập số tiền',body:body,
      actions:[{label:'Hủy',kind:'outline'},{label:'Tiếp tục',keepOpen:true,onClick:async function(back){var v=Number(back.querySelector('#tpAmt').value);
        var e=Fl.checkTopup(v);if(e){var t=back.querySelector('#tpErr');t.hidden=false;t.innerHTML=A.icon('err')+e;back.querySelector('#tpAmt').classList.add('is-invalid');throw new Error(e);}
        A.modal.close();Fl.topupConfirm(ctx,v,o.onDone);}}]});
    b.querySelectorAll('.chip-btn').forEach(function(c){c.onclick=function(){b.querySelector('#tpAmt').value=c.dataset.v;};});};
  Fl.checkTopup=function(v){if(!isFinite(v)||v<C.topupMin||v>C.topupMax)return 'Số tiền nạp từ 100 đến 5.000 USDG.';if(v%100!==0)return 'Số tiền nạp phải là bội số của 100.';return null;};
  /* ---------- Bán hàng ---------- */
  Fl.sell=function(ctx,lotId){var g=ctx.g;var l=g.lots.filter(function(x){return x.id===lotId;})[0];if(!l)return A.toast('Lô hàng không còn tồn tại.','err');
    var price=A.store.price(l.region,l.type,g.round);
    var body='<div class="field"><label>Số lượng cần bán <span class="help" style="float:right">Tối đa '+l.qty+'</span></label><input class="input num" id="sqty" inputmode="decimal" value="'+l.qty+'"><div class="err-text" id="serr" hidden></div></div>'+
      '<div class="rows" id="srows"></div>';
    var b=A.modal.open({icon:'tag',title:'Bán hàng',sub:lotId+' · '+F.good(l.type)+' · Khu vực '+F.region(l.region),body:body,
      actions:[{label:'Hủy',kind:'outline'},{label:'Xác nhận bán',onClick:async function(back){var q=Number(back.querySelector('#sqty').value);var r=await A.api.sell(lotId,q);
        A.toast('Đã bán '+q+' '+F.good(l.type).toLowerCase()+' và nhận '+usd(r.revenue).replace(/(\d)(?= USDG)/,'$1')+'.');ctx.refresh();}}]});
    var inp=b.querySelector('#sqty'),ok=b.querySelector('[data-act="1"]');
    function upd(){var q=Number(inp.value);var err=null;if(l.quality<=0)err='Lô đã hỏng không thể bán.';else if(!(q>0))err='Nhập số lượng lớn hơn 0.';else if(q>l.qty)err='Không thể bán vượt số lượng trong kho.';
      var e=b.querySelector('#serr');e.hidden=!err;if(err)e.innerHTML=A.icon('err')+err;inp.classList.toggle('is-invalid',!!err);ok.disabled=!!err;
      var rev=err?0:price*q*l.quality/100;b.querySelector('#srows').innerHTML='<div class="row"><span>Giá thị trường</span><b>'+usd(price)+'</b></div><div class="row"><span>Chất lượng</span><b>'+l.quality+'%</b></div><div class="row"><span>Doanh thu thực nhận</span><b class="pos">'+F.usdg2(rev)+'</b></div>';}
    inp.oninput=upd;upd();};
  /* ---------- Gửi hàng ---------- */
  Fl.ship=function(ctx,lotId){var g=ctx.g;var lots=g.lots.filter(function(l){return l.quality>0;});
    if(!lots.length)return A.toast('Chưa có hàng hợp lệ để gửi.','err');
    var cur=lots.filter(function(l){return l.id===lotId;})[0]||lots[0];
    var body='<div class="field"><label>Chọn lô hàng</label><select class="input" id="slot">'+lots.map(function(l){return '<option value="'+l.id+'"'+(l.id===cur.id?' selected':'')+'>'+l.id+' · '+F.good(l.type)+' · '+l.qty+' đơn vị · '+F.region(l.region)+' ('+l.quality+'%)</option>';}).join('')+'</select></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>Số lượng</label><input class="input num" id="sqty" inputmode="decimal"></div><div class="field"><label>Khu vực đến</label><select class="input" id="sto"></select></div></div><div class="err-text" id="serr" hidden></div><div class="rows" id="srows" style="margin-top:10px"></div>';
    var b=A.modal.open({icon:'truck',title:'Gửi hàng',sub:'Vận chuyển lô hàng sang khu vực khác',body:body,
      actions:[{label:'Hủy',kind:'outline'},{label:'Xác nhận gửi hàng',onClick:async function(back){var l=pick();var q=Number(back.querySelector('#sqty').value);var r=await A.api.ship(l.id,q,back.querySelector('#sto').value);A.toast('Đã gửi '+q+' '+F.good(l.type).toLowerCase()+' sang '+F.region(back.querySelector('#sto').value)+'. Chuyến '+r.id+'.');ctx.refresh();}}]});
    var selL=b.querySelector('#slot'),qty=b.querySelector('#sqty'),to=b.querySelector('#sto'),ok=b.querySelector('[data-act="1"]');
    function pick(){return lots.filter(function(l){return l.id===selL.value;})[0];}
    function fillTo(){var l=pick();var other=l.region==='asia'?'europe':'asia';to.innerHTML='<option value="'+other+'">'+F.region(other)+'</option>';qty.value=l.qty;upd();}
    function upd(){var l=pick(),q=Number(qty.value),err=null;
      if(g.round+C.shipRounds>C.rounds)err='Hàng không kịp đến trước khi lượt chơi kết thúc.';else if(!(q>0&&q<=l.qty))err='Số lượng gửi phải lớn hơn 0 và không vượt '+l.qty+'.';
      var fee=(q>0?q:0)*C.shipFeePerUnit;if(!err&&fee>g.usdg)err='Không đủ USDG để trả phí vận chuyển.';
      var e=b.querySelector('#serr');e.hidden=!err;if(err)e.innerHTML=A.icon('err')+err;ok.disabled=!!err;
      var dp=A.store.price(to.value,l.type,Math.min(C.rounds,g.round+C.shipRounds));
      b.querySelector('#srows').innerHTML='<div class="row"><span>Đơn giá phí vận chuyển</span><b>'+F.usdg2(C.shipFeePerUnit)+'/đơn vị</b></div><div class="row"><span>Tổng phí</span><b class="neg">'+F.usdg2(fee)+'</b></div><div class="row"><span>Hàng đến ở</span><b>Vòng '+(g.round+C.shipRounds)+'</b></div><div class="row"><span>Chất lượng dự kiến khi đến</span><b>'+l.quality+'%</b></div><div class="row"><span>Giá thị trường tại '+F.region(to.value)+'</span><b>'+F.usdg2(dp)+'</b></div>';}
    selL.onchange=fillTo;qty.oninput=upd;fillTo();};
})(window);
