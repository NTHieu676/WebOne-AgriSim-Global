/*
 * Cổng thanh toán GIẢ LẬP – AgriSim.payment.open(ctx,{amount,onDone})
 * Quy trình: (1) Chọn phương thức → (2) Thanh toán (QR / OTP thẻ / PIN ví) → (3) Kết quả (thành công / thất bại / hết hạn)
 * Chỉ khi ngân hàng giả lập xác nhận THÀNH CÔNG mới cộng USDG (mỗi đơn 1 lần). Đóng cửa sổ khi đang chờ = hủy đơn.
 * Thay bằng cổng thật: chỉ cần đổi AgriSim.api.createPayment / settlePayment.
 */
(function(w){var A=w.AgriSim=w.AgriSim||{};var F=A.fmt,C=A.CFG;var Pay=A.payment={};
  var DEMO_OTP='123456',DEMO_PIN='123456',DEMO_CARD='9704 0000 0000 0018';
  var st=null;

  /* ---- QR minh hoạ (không phải QR thật): ma trận 29×29 sinh từ mã giao dịch ---- */
  function seedOf(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function qrSvg(text){var N=29,r=rng(seedOf(text)),m=[],i,j;
    for(i=0;i<N;i++){m.push([]);for(j=0;j<N;j++)m[i].push(r()<0.48?1:0);}
    function finder(x,y){for(var a=-1;a<=7;a++)for(var b=-1;b<=7;b++){var X=x+a,Y=y+b;if(X<0||Y<0||X>=N||Y>=N)continue;
      var on=(a>=0&&a<=6&&b>=0&&b<=6)&&(a===0||a===6||b===0||b===6||(a>=2&&a<=4&&b>=2&&b<=4));m[Y][X]=on?1:0;}}
    finder(0,0);finder(N-7,0);finder(0,N-7);
    for(i=8;i<N-8;i++){m[6][i]=i%2?0:1;m[i][6]=i%2?0:1;}
    var d='';for(i=0;i<N;i++)for(j=0;j<N;j++)if(m[i][j])d+='M'+(j+2)+' '+(i+2)+'h1v1h-1z';
    return '<svg viewBox="0 0 '+(N+4)+' '+(N+4)+'" role="img" aria-label="Mã QR minh họa" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="'+d+'" fill="#12332E"/></svg>';}

  function usd(n){return F.usdg2?F.usdg2(n):F.num(n,2)+' USDG';}
  function clock(ms){var s=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
  function stopTimer(){if(st&&st.timer){clearInterval(st.timer);st.timer=null;}}

  Pay.close=function(){if(!st)return;stopTimer();var s=st;st=null;document.removeEventListener('keydown',s.key);s.back.remove();
    if(s.order&&s.order.status==='pending'){A.api.settlePayment(s.order.id,'cancelled','Người dùng đóng cửa sổ thanh toán').catch(function(){});}
  };

  Pay.open=function(ctx,o){if(A.modal)A.modal.close();Pay.close();
    var back=document.createElement('div');back.className='modal-back pay-back';back.innerHTML='<div class="modal pay" role="dialog" aria-modal="true" aria-label="Thanh toán nạp USDG"></div>';
    document.body.appendChild(back);
    st={ctx:ctx,amount:o.amount,onDone:o.onDone,back:back,box:back.firstChild,method:'qr',bank:A.PAY_BANKS[0],order:null,busy:false,tries:0,otpSent:false};
    st.key=function(e){if(e.key==='Escape'&&!st.busy)Pay.close();};document.addEventListener('keydown',st.key);
    back.addEventListener('mousedown',function(e){if(e.target===back&&!st.busy)Pay.close();});
    stepMethod();};

  function head(title,sub,step){var steps=['Phương thức','Thanh toán','Kết quả'];
    return '<div class="modal-head"><div class="ic">'+A.icon('bank')+'</div><div><h3>'+title+'</h3><div class="sub">'+sub+'</div></div><button class="x" aria-label="Đóng" data-close>'+A.icon('x')+'</button></div>'+
      '<ol class="pay-steps">'+steps.map(function(t,i){return '<li class="'+(i+1===step?'on':i+1<step?'done':'')+'"><span>'+(i+1<step?A.icon('check'):i+1)+'</span>'+t+'</li>';}).join('')+'</ol>';}
  function paint(html,bind){stopTimer();st.box.innerHTML=html;
    var x=st.box.querySelector('[data-close]');if(x)x.onclick=function(){if(!st.busy)Pay.close();};
    if(bind)bind(st.box);var f=st.box.querySelector('input:not([readonly]),select');if(f)f.focus();}
  function showErr(msg){var e=st.box.querySelector('[data-err]');if(!e)return;e.hidden=!msg;if(msg)e.innerHTML=A.icon('err')+'<span>'+F.esc(msg)+'</span>';}
  function setBusy(b,on,label){st.busy=on;st.box.querySelectorAll('button').forEach(function(x){if(x.hasAttribute('data-close')){x.disabled=on;return;}x.disabled=on;});
    if(b){if(on){b._l=b.innerHTML;b.innerHTML='<span class="spin"></span> '+label;}else if(b._l)b.innerHTML=b._l;}}

  /* ---------- Bước 1: chọn phương thức ---------- */
  function stepMethod(){
    var M=[['qr','qr','Chuyển khoản QR','Quét mã bằng ứng dụng ngân hàng giả lập'],['card','bank','Thẻ ngân hàng','Nhập thẻ mẫu và xác thực OTP'],['wallet','wallet','Ví AgriPay','Đăng nhập ví giả lập bằng mã PIN']];
    paint(head('Nạp USDG giả lập','Ngân hàng giả lập AgriSim',1)+
      '<div class="pay-amount"><span>Số tiền nạp</span><b class="num">+'+usd(st.amount)+'</b></div>'+
      '<div class="pay-label">Chọn phương thức thanh toán</div><div class="pay-methods" role="radiogroup">'+
      M.map(function(m){return '<button type="button" class="pay-opt'+(st.method===m[0]?' on':'')+'" role="radio" aria-checked="'+(st.method===m[0])+'" data-m="'+m[0]+'"><span class="ico">'+(m[1]==='qr'?qrIcon():A.icon(m[1]))+'</span><span><b>'+m[2]+'</b><small>'+m[3]+'</small></span><i class="dot"></i></button>';}).join('')+'</div>'+
      '<div class="field" id="bankField"'+(st.method==='wallet'?' hidden':'')+'><label for="bank">Ngân hàng giả lập</label><select class="input" id="bank">'+A.PAY_BANKS.map(function(b){return '<option'+(b===st.bank?' selected':'')+'>'+b+'</option>';}).join('')+'</select></div>'+
      '<div class="note note-warn">'+A.icon('info')+'<span>Đây là tiền giả lập. Không có giao dịch hay tài khoản ngân hàng thật nào được sử dụng.</span></div>'+
      '<div class="note note-err" data-err hidden></div>'+
      '<div class="modal-foot"><button class="btn btn-outline" data-close>Hủy</button><button class="btn btn-primary" id="payNext">Tiếp tục</button></div>',
      function(b){
        b.querySelectorAll('.pay-opt').forEach(function(x){x.onclick=function(){st.method=x.dataset.m;b.querySelectorAll('.pay-opt').forEach(function(y){var on=y===x;y.classList.toggle('on',on);y.setAttribute('aria-checked',on);});b.querySelector('#bankField').hidden=st.method==='wallet';};});
        b.querySelector('#bank').onchange=function(e){st.bank=e.target.value;};
        b.querySelectorAll('[data-close]').forEach(function(x){x.onclick=function(){if(!st.busy)Pay.close();};});
        var nx=b.querySelector('#payNext');
        nx.onclick=async function(){setBusy(nx,true,'Đang tạo giao dịch…');showErr('');
          try{st.order=await A.api.createPayment({amount:st.amount,method:st.method,bank:st.method==='wallet'?'':st.bank});st.tries=0;st.otpSent=false;setBusy(nx,false);stepPay();}
          catch(e){setBusy(nx,false);showErr(e.message||'Không tạo được giao dịch. Vui lòng thử lại.');}};});}
  function qrIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="1em" height="1em"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/></svg>';}

  /* ---------- Bước 2: thanh toán ---------- */
  function stepPay(){if(st.method==='qr')return stepQR();return stepVerify();}
  function foot(primary,pid){return '<div class="modal-foot"><button class="btn btn-outline" id="payBack">Đổi phương thức</button><button class="btn btn-primary" id="'+pid+'">'+primary+'</button></div>';}
  function bindBack(b){b.querySelector('#payBack').onclick=async function(){if(st.busy)return;var id=st.order&&st.order.id;st.order=null;if(id)A.api.settlePayment(id,'cancelled','Đổi phương thức').catch(function(){});stepMethod();};}

  function stepQR(){var o=st.order;
    paint(head('Quét mã QR để thanh toán','Dùng ứng dụng '+F.esc(o.bank)+' (giả lập)',2)+
      '<div class="qr-wrap"><div class="qr-box">'+qrSvg(o.code+o.id)+'</div><div class="qr-side">'+
        '<div class="qr-timer" id="qrT"><span>Mã hết hạn sau</span><b class="num" id="qrClock">'+clock(o.expiresAt-Date.now())+'</b></div>'+
        '<div class="qr-wait"><span class="spin"></span> Đang chờ thanh toán…</div></div></div>'+
      '<div class="rows pay-rows"><div class="row"><span>Ngân hàng nhận</span><b>Ngân hàng AgriSim (giả lập)</b></div><div class="row"><span>Số tài khoản</span><b class="num">9704 0000 1234</b></div>'+
      '<div class="row"><span>Số tiền</span><b class="num pos">'+usd(o.amount)+'</b></div><div class="row"><span>Nội dung chuyển khoản</span><b class="num">AGRISIM '+o.code+'</b></div><div class="row"><span>Mã giao dịch</span><b class="num">'+o.id+'</b></div></div>'+
      '<div class="qr-cap">Mã QR minh họa – không quét được bằng ứng dụng thật.</div>'+
      '<div class="pay-demo"><span>Giả lập phản hồi của ngân hàng:</span><button type="button" class="link" data-sim="failed">Thanh toán thất bại</button><button type="button" class="link" data-sim="expired">Mã hết hạn</button></div>'+
      '<div class="note note-err" data-err hidden></div>'+foot('Tôi đã chuyển khoản','payDone'),
      function(b){bindBack(b);startTimer(b);
        var d=b.querySelector('#payDone');d.onclick=function(){settle('success',d,'Đang xác nhận với ngân hàng…');};
        b.querySelectorAll('[data-sim]').forEach(function(x){x.onclick=function(){if(st.busy)return;settle(x.dataset.sim,null,'',x.dataset.sim==='failed'?'Ngân hàng từ chối giao dịch (giả lập)':'Mã QR đã hết hạn');};});});}
  function startTimer(b){st.timer=setInterval(function(){if(!st||!st.order)return;var left=st.order.expiresAt-Date.now();var c=b.querySelector('#qrClock');if(c)c.textContent=clock(left);
    var t=b.querySelector('#qrT');if(t)t.classList.toggle('low',left<60000);if(left<=0&&!st.busy){settle('expired',null,'','Mã QR đã hết hạn');}},500);}

  function stepVerify(){var o=st.order,isCard=st.method==='card';
    paint(head(isCard?'Thanh toán bằng thẻ':'Đăng nhập Ví AgriPay',isCard?'Thẻ '+F.esc(o.bank)+' (giả lập)':'Ví điện tử giả lập',2)+
      '<div class="pay-amount"><span>Số tiền</span><b class="num">'+usd(o.amount)+'</b></div>'+
      (isCard?'<div class="field"><label for="pCard">Số thẻ</label><input class="input num" id="pCard" value="'+DEMO_CARD+'" readonly><div class="help">Thẻ mẫu của hệ thống giả lập.</div></div>':
              '<div class="field"><label for="pPhone">Số điện thoại ví</label><input class="input num" id="pPhone" value="0900 000 000" readonly></div>')+
      '<div class="field"><label for="pCode">'+(isCard?'Mã OTP (6 số)':'Mã PIN (6 số)')+'</label><input class="input num" id="pCode" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="••••••" type="password"><div class="help">Dùng thử: nhập <b>'+DEMO_OTP+'</b> để thành công, số khác để thấy lỗi (tối đa '+C.payMaxTry+' lần).</div><div class="err-text" id="pErr" hidden></div></div>'+
      '<div class="note note-err" data-err hidden></div>'+foot(isCard?'Xác nhận OTP':'Xác nhận thanh toán','payDone'),
      function(b){bindBack(b);var d=b.querySelector('#payDone'),inp=b.querySelector('#pCode');
        inp.oninput=function(){inp.value=inp.value.replace(/\D/g,'');};
        d.onclick=function(){var v=inp.value,e=b.querySelector('#pErr');
          if(!/^\d{6}$/.test(v)){e.hidden=false;e.innerHTML=A.icon('err')+(isCard?'Vui lòng nhập đủ 6 số OTP.':'Vui lòng nhập đủ 6 số PIN.');inp.classList.add('is-invalid');return;}
          if(v!==(isCard?DEMO_OTP:DEMO_PIN)){st.tries++;var left=C.payMaxTry-st.tries;
            if(left<=0)return settle('failed',null,'',isCard?'Nhập sai OTP quá '+C.payMaxTry+' lần':'Nhập sai PIN quá '+C.payMaxTry+' lần');
            e.hidden=false;e.innerHTML=A.icon('err')+(isCard?'OTP không đúng.':'Mã PIN không đúng.')+' Còn '+left+' lần thử.';inp.classList.add('is-invalid');inp.value='';inp.focus();return;}
          settle('success',d,'Đang xác nhận…');};});}

  /* ---------- Chốt đơn → bước 3 ---------- */
  async function settle(result,btn,label,reason){if(st.busy)return;setBusy(btn,true,label||'Đang xử lý…');stopTimer();
    try{var r=await A.api.settlePayment(st.order.id,result,reason);st.order=r.order;st.balance=r.usdg;st.busy=false;if(r.order.status==='paid')st.paid=true;stepResult();}
    catch(e){st.busy=false;setBusy(btn,false);
      if(e.code==='ALREADY_PAID'||e.code==='ORDER_CLOSED'){st.order.status=e.code==='ALREADY_PAID'?'paid':'failed';st.order.reason=e.message;stepResult();return;}
      showErr(e.message||'Chưa xác nhận được. Số dư của bạn không thay đổi.');if(st.method==='qr')startTimer(st.box);}}

  function stepResult(){var o=st.order,ok=o.status==='paid',exp=o.status==='expired';
    var title=ok?'Nạp tiền thành công':exp?'Mã thanh toán đã hết hạn':'Thanh toán không thành công';
    var sub=ok?'Giao dịch đã được ghi nhận':(o.reason||'Giao dịch chưa hoàn tất');
    paint(head(title,sub,3)+
      '<div class="pay-result '+(ok?'ok':'bad')+'"><div class="big">'+A.icon(ok?'check':'err')+'</div>'+
        (ok?'<b class="num">+'+usd(o.amount)+'</b><span>đã được cộng vào ví của bạn</span>':'<b>'+(exp?'Giao dịch hết hạn':'Giao dịch thất bại')+'</b><span>Số dư của bạn không thay đổi.</span>')+'</div>'+
      '<div class="rows pay-rows"><div class="row"><span>Mã giao dịch</span><b class="num">'+o.id+' · '+o.code+'</b></div><div class="row"><span>Phương thức</span><b>'+A.PAY_METHODS[o.method]+(o.bank?' · '+F.esc(o.bank):'')+'</b></div>'+
        '<div class="row"><span>Số tiền</span><b class="num">'+usd(o.amount)+'</b></div>'+(ok?'<div class="row"><span>Số dư hiện tại</span><b class="num pos">'+usd(st.balance)+'</b></div>':'')+'</div>'+
      '<div class="modal-foot">'+(ok?'<button class="btn btn-primary" id="payFin">Hoàn tất</button>':'<button class="btn btn-outline" id="payClose">Đóng</button><button class="btn btn-primary" id="payRetry">Thử lại</button>')+'</div>',
      function(b){
        if(ok){b.querySelector('#payFin').onclick=function(){var cb=st.onDone,c=st.ctx;st.order.status='done';Pay.close();A.toast('Đã nạp '+usd(o.amount)+'.');if(cb)cb();else if(c&&c.refresh)c.refresh();};}
        else{b.querySelector('#payClose').onclick=function(){var c=st.ctx;Pay.close();if(c&&c.refresh)c.refresh();};b.querySelector('#payRetry').onclick=function(){st.order=null;stepMethod();};}});}
  /* đóng bằng X sau khi thành công vẫn phải làm mới số dư */
  var _close=Pay.close;Pay.close=function(){var s=st;_close();if(s&&s.paid&&s.order&&s.order.status!=='done'&&s.ctx&&s.ctx.refresh)s.ctx.refresh();};
})(window);
