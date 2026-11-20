/*
 * MOCK BACKEND (localStorage) – chạy được khi chưa có Node/Express + Firestore.
 * Mọi luật chơi ở đây mô phỏng BRD để frontend chạy trọn luồng.
 * Khi backend thật xong: thay các hàm trong services/api/apiClient.js (giữ nguyên tên hàm),
 * KHÔNG cần sửa code trang.
 */
(function(w){
  var A=w.AgriSim=w.AgriSim||{};
  var KEY='agrisim.db.v1', SES='agrisim.session.v1';
  var CFG=A.CFG={rounds:6,startUSDG:2000,plantCost:100,plantYield:20,growRounds:1,plotPrice:500,maxPlots:4,initPlots:2,
    shipFeePerUnit:0.5,shipRounds:1,swapFee:0.003,decayPerRound:5,topupMin:100,topupMax:5000,topupSteps:[100,500,1000,5000],qrTtlSec:300,payMaxTry:3,latency:350};
  // GIÁ MẪU theo vòng (cần nhóm chốt số thật trong BRD)
  var PRICES={asia:{rice:[10,10,14,12,11,13],gold:[250,250,250,252,255,258]},europe:{rice:[12,13,18,16,15,17],gold:[255,255,255,257,260,262]}};
  var NOTICES=[
    {t:'Thị trường bình thường',d:'Giá lúa và phí vận chuyển ở mức ổn định ban đầu. Thời điểm thuận lợi để gieo trồng lúa đầu tiên.'},
    {t:'Nhu cầu tăng',d:'Giá lúa Châu Á tăng, phí vận chuyển tăng. Nguồn cung bắt đầu thắt chặt tại Châu Á.',tag:'Nhu cầu tăng'},
    {t:'Đỉnh giá — Đại dịch toàn cầu',d:'Giá lúa lên đỉnh tại cả hai khu vực, phí vận chuyển tăng cao. Ưu tiên bán hàng sẵn có hoặc thu hoạch ngay.',short:'Giá lúa lên đỉnh, phí vận chuyển tăng'},
    {t:'Giá hạ nhiệt',d:'Dịch bệnh được kiểm soát, nhu cầu giảm dần. Giá lúa điều chỉnh xuống ở cả hai khu vực.'},
    {t:'Thị trường ổn định',d:'Giá dao động nhẹ. Hàng gửi sang khu vực khác vẫn còn lợi thế chênh lệch giá.'},
    {t:'Vòng cuối',d:'Hãy bán hoặc quy đổi hàng còn lại trước khi kết thúc lượt chơi để tính tài sản ròng.'}
  ];
  A.NOTICES=NOTICES;

  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{users:{},games:{}};}catch(e){return {users:{},games:{}};}}
  function save(db){localStorage.setItem(KEY,JSON.stringify(db));}
  function fail(code,msg){var e=new Error(msg);e.code=code;return e;}
  function wait(v){return new Promise(function(r){setTimeout(function(){r(v);},CFG.latency);});}
  wait.reject=function(e){return new Promise(function(_,j){setTimeout(function(){j(e);},CFG.latency);});};
  function clone(o){return JSON.parse(JSON.stringify(o));}
  function round2(n){return Math.round(n*100)/100;}

  var S=A.store={};
  S.price=function(region,type,round){return PRICES[region][type==='gold'?'gold':'rice'][round-1];};
  S.notice=function(round){return NOTICES[round-1];};
  S.cfg=CFG;

  /* ---------- tài khoản ---------- */
  S.session=function(){return localStorage.getItem(SES);};
  S.register=function(name,email,pass){var db=load();email=email.trim().toLowerCase();
    if(db.users[email])return wait.reject(fail('EMAIL_EXISTS','Email này đã được đăng ký.'));
    db.users[email]={name:name.trim(),pass:pass};save(db);return wait({email:email});};
  S.login=function(email,pass){var db=load();email=email.trim().toLowerCase();var u=db.users[email];
    if(!u)return wait.reject(fail('NO_USER','Không tìm thấy tài khoản với email này.'));
    if(u.pass!==pass)return wait.reject(fail('BAD_PASS','Mật khẩu không đúng.'));
    localStorage.setItem(SES,email);return wait({email:email});};
  S.demoLogin=function(){var db=load();var e='demo@agrisim.vn';
    db.users[e]={name:'Minh Anh',pass:'demo1234'};db.games[e]=demoGame();save(db);localStorage.setItem(SES,e);return wait({email:e});};
  S.logout=function(){localStorage.removeItem(SES);return wait(true);};
  S.me=function(){var e=S.session();if(!e)return null;var u=load().users[e];return u?{email:e,name:u.name}:null;};

  /* ---------- trò chơi ---------- */
  function newGame(region){
    var plots=[];for(var i=1;i<=CFG.initPlots;i++)plots.push({id:i,status:'empty'});
    return {status:'playing',startRegion:region,round:1,usdg:CFG.startUSDG,topup:0,plots:plots,lots:[],shipments:[],
      pools:{rice:{asset:1000,usdg:10000},gold:{asset:500,usdg:15000}},history:[{round:1,title:'Bắt đầu lượt chơi',detail:'Vốn ban đầu',delta:CFG.startUSDG,balance:CFG.startUSDG}],
      stats:{swapFee:0,shipFee:0,tx:0},seq:{lot:1,ship:1}};
  }
  function demoGame(){
    return {status:'playing',startRegion:'asia',round:3,usdg:1785,topup:0,
      plots:[{id:1,status:'growing',plantedRound:2,readyRound:3},{id:2,status:'empty'}],
      lots:[{id:'L-0001',type:'rice',qty:20,quality:95,region:'asia'},{id:'L-0002',type:'rice',qty:10,quality:90,region:'europe'},{id:'L-0003',type:'rice',qty:5,quality:0,region:'asia'}],
      shipments:[{id:'T-0001',type:'rice',qty:12,quality:95,from:'asia',to:'europe',fee:15,sentRound:3,arriveRound:4}],
      pools:{rice:{asset:1000,usdg:10000},gold:{asset:500,usdg:15000}},
      history:[{round:3,title:'Gửi hàng sang Châu Âu',detail:'Chuyến T-0001 · 12 lúa',delta:-15,balance:1785},{round:2,title:'Gieo trồng lúa',detail:'Ô ruộng #1',delta:-100,balance:1800},
        {round:2,title:'Thu hoạch',detail:'Ô ruộng #2 · +20 lúa',delta:0,balance:1900},{round:1,title:'Gieo trồng lúa',detail:'Ô ruộng #1',delta:-100,balance:1900},{round:1,title:'Bắt đầu lượt chơi',detail:'Vốn ban đầu',delta:2000,balance:2000}],
      stats:{swapFee:0,shipFee:15,tx:1},seq:{lot:4,ship:2}};
  }
  function cur(){var e=S.session();if(!e)throw fail('NO_SESSION','Chưa đăng nhập.');var db=load();return {db:db,e:e,g:db.games[e]};}
  function mutate(fn){var c=cur();if(!c.g)throw fail('NO_GAME','Chưa bắt đầu lượt chơi.');if(c.g.status==='ended')throw fail('ENDED','Lượt chơi đã kết thúc – bạn chỉ có thể xem.');
    var r=fn(c.g);c.db.games[c.e]=c.g;save(c.db);return wait(r==null?clone(c.g):r);}
  function log(g,title,detail,delta){g.history.unshift({round:g.round,title:title,detail:detail,delta:round2(delta||0),balance:round2(g.usdg)});}

  S.hasGame=function(){var c=cur();return !!c.g;};
  S.getGame=function(){try{var c=cur();return wait(c.g?clone(c.g):null);}catch(e){return Promise.reject(e);}};
  S.peek=function(){try{var c=cur();return c.g?clone(c.g):null;}catch(e){return null;}};
  S.startGame=function(region){try{var c=cur();if(c.g&&c.g.status==='playing')throw fail('HAS_GAME','Bạn đang có một lượt chơi.');
    c.db.games[c.e]=newGame(region);save(c.db);return wait(clone(c.db.games[c.e]));}catch(e){return Promise.reject(e);}};
  S.replay=function(){try{var c=cur();delete c.db.games[c.e];save(c.db);return wait(true);}catch(e){return Promise.reject(e);}};
  S.endGame=function(){try{var c=cur();if(!c.g)throw fail('NO_GAME','Chưa có lượt chơi.');c.g.status='ended';c.db.games[c.e]=c.g;save(c.db);return wait(clone(c.g));}catch(e){return Promise.reject(e);}};

  S.plantTo=function(id){return call(function(){return mutate(function(g){var p=find(g,id);
    if(p.status!=='empty')throw fail('PLOT_BUSY','Ô ruộng này không còn trống.');
    if(g.usdg<CFG.plantCost)throw fail('NO_USDG','Không đủ USDG để trồng lúa.');
    g.usdg=round2(g.usdg-CFG.plantCost);p.status='growing';p.plantedRound=g.round;p.readyRound=g.round+CFG.growRounds;
    log(g,'Gieo trồng lúa','Ô ruộng #'+id,-CFG.plantCost);g.stats.tx+=0;});});};
  S.harvest=function(id){return call(function(){return mutate(function(g){var p=find(g,id);
    if(!((p.status==='growing'||p.status==='ready')&&g.round>=p.readyRound))throw fail('NOT_READY','Ô ruộng này vừa được cập nhật. Đã làm mới trạng thái.');
    p.status='empty';delete p.plantedRound;delete p.readyRound;
    g.lots.push({id:nextLot(g),type:'rice',qty:CFG.plantYield,quality:100,region:g.startRegion});
    log(g,'Thu hoạch','Ô ruộng #'+id+' · +'+CFG.plantYield+' lúa',0);});});};
  S.buyPlot=function(){return call(function(){return mutate(function(g){
    if(g.plots.length>=CFG.maxPlots)throw fail('MAX_PLOTS','Bạn đã đạt số ô ruộng tối đa.');
    if(g.usdg<CFG.plotPrice)throw fail('NO_USDG','Không đủ USDG để mua thêm ô.');
    g.usdg=round2(g.usdg-CFG.plotPrice);g.plots.push({id:g.plots.length+1,status:'empty'});
    log(g,'Mua thêm nông trại','Ô ruộng #'+g.plots.length,-CFG.plotPrice);});});};

  /* ---------- Cổng thanh toán giả lập (đơn nạp tiền có trạng thái) ----------
     pending -> paid | failed | expired | cancelled. Chỉ 'paid' mới cộng USDG; mỗi đơn chỉ cộng 1 lần (BR-27). */
  var PAY_METHODS={qr:'Chuyển khoản QR',card:'Thẻ ngân hàng',wallet:'Ví AgriPay'};
  A.PAY_METHODS=PAY_METHODS;
  A.PAY_BANKS=['AgriBank','GreenBank','SunRice Bank','Delta Bank','Harvest Bank'];
  function checkAmount(a){if(!(a>=CFG.topupMin&&a<=CFG.topupMax&&a%100===0))throw fail('BAD_AMOUNT','Số tiền nạp từ 100 đến 5.000 USDG, là bội số của 100.');}
  S.createPayment=function(o){return call(function(){checkAmount(o.amount);if(!PAY_METHODS[o.method])throw fail('BAD_METHOD','Phương thức thanh toán không hợp lệ.');
    return mutate(function(g){g.payments=g.payments||[];g.seq.pay=(g.seq.pay||0)+1;
      g.payments.forEach(function(x){if(x.status==='pending'&&Date.now()>x.expiresAt)x.status='expired';});
      var id='P-'+String(g.seq.pay).padStart(4,'0'),code='AGS'+String(1000+g.seq.pay*37+Math.floor(Math.random()*900));
      var ord={id:id,code:code,amount:o.amount,method:o.method,bank:o.bank||'',status:'pending',createdAt:Date.now(),expiresAt:Date.now()+CFG.qrTtlSec*1000,round:g.round,reason:''};
      g.payments.unshift(ord);g.payments=g.payments.slice(0,20);return clone(ord);});});};
  S.settlePayment=function(id,result,reason){return call(function(){return mutate(function(g){
    var o=(g.payments||[]).filter(function(x){return x.id===id;})[0];if(!o)throw fail('NO_ORDER','Không tìm thấy giao dịch.');
    if(o.status==='paid')throw fail('ALREADY_PAID','Giao dịch này đã được ghi nhận, sẽ không cộng tiền lần nữa.');
    if(o.status!=='pending')throw fail('ORDER_CLOSED','Giao dịch đã đóng ('+o.status+'). Vui lòng tạo giao dịch mới.');
    if(result==='success'&&Date.now()>o.expiresAt)result='expired';
    if(result==='success'){o.status='paid';o.paidAt=Date.now();g.usdg=round2(g.usdg+o.amount);g.topup=round2(g.topup+o.amount);
      log(g,'Nạp USDG qua '+PAY_METHODS[o.method],'Mã GD '+o.code+(o.bank?' · '+o.bank:''),o.amount);}
    else{o.status=result==='expired'?'expired':result==='cancelled'?'cancelled':'failed';o.reason=reason||'';}
    return {order:clone(o),usdg:g.usdg};});});};
  S.payments=function(){try{var c=cur();return ((c.g&&c.g.payments)||[]).map(function(x){var y=clone(x);if(y.status==='pending'&&Date.now()>y.expiresAt)y.status='expired';return y;});}catch(e){return [];}};
  S.topup=function(amount){return call(function(){return mutate(function(g){
    if(!(amount>=CFG.topupMin&&amount<=CFG.topupMax&&amount%100===0))throw fail('BAD_AMOUNT','Số tiền nạp từ 100 đến 5.000 USDG, là bội số của 100.');
    g.usdg=round2(g.usdg+amount);g.topup=round2(g.topup+amount);log(g,'Nạp USDG giả lập','Ngân hàng giả lập',amount);});});};
  S.sell=function(lotId,qty){return call(function(){return mutate(function(g){var l=findLot(g,lotId);
    if(l.quality<=0)throw fail('DEAD','Lô đã hỏng không thể bán.');
    if(!(qty>0&&qty<=l.qty))throw fail('BAD_QTY','Không thể bán vượt số lượng trong kho.');
    var rev=round2(S.price(l.region,l.type,g.round)*qty*l.quality/100);
    g.usdg=round2(g.usdg+rev);l.qty-=qty;if(l.qty===0)g.lots.splice(g.lots.indexOf(l),1);g.stats.tx++;
    log(g,'Bán hàng tại '+A.fmt.region(l.region),lotId+' · '+qty+' '+A.fmt.good(l.type).toLowerCase(),rev);return {revenue:rev,balance:g.usdg,qty:qty,type:l.type};});});};
  S.quoteShip=function(g,lotId,qty,to){var l=findLot(g,lotId);var fee=round2(qty*CFG.shipFeePerUnit);
    return {fee:fee,unit:CFG.shipFeePerUnit,arriveRound:g.round+CFG.shipRounds,quality:l.quality,destPrice:S.price(to,l.type,g.round+CFG.shipRounds>CFG.rounds?CFG.rounds:g.round+CFG.shipRounds)};};
  S.ship=function(lotId,qty,to){return call(function(){return mutate(function(g){var l=findLot(g,lotId);
    if(l.quality<=0)throw fail('DEAD','Lô đã hỏng không thể gửi.');if(to===l.region)throw fail('SAME_REGION','Khu vực đến phải khác khu vực hiện tại.');
    if(!(qty>0&&qty<=l.qty))throw fail('BAD_QTY','Số lượng gửi không hợp lệ.');
    if(g.round+CFG.shipRounds>CFG.rounds)throw fail('LATE','Hàng không kịp đến trước khi lượt chơi kết thúc.');
    var q=S.quoteShip(g,lotId,qty,to);if(g.usdg<q.fee)throw fail('NO_USDG','Không đủ USDG để trả phí vận chuyển.');
    g.usdg=round2(g.usdg-q.fee);g.stats.shipFee=round2(g.stats.shipFee+q.fee);g.stats.tx++;
    l.qty-=qty;if(l.qty===0)g.lots.splice(g.lots.indexOf(l),1);var id='T-'+String(g.seq.ship++).padStart(4,'0');
    g.shipments.unshift({id:id,type:l.type,qty:qty,quality:l.quality,from:l.region,to:to,fee:q.fee,sentRound:g.round,arriveRound:q.arriveRound});
    log(g,'Gửi hàng sang '+A.fmt.region(to),id+' · '+qty+' '+A.fmt.good(l.type).toLowerCase(),-q.fee);return {id:id,fee:q.fee};});});};

  /* ---------- pool / swap ---------- */
  S.quoteSwap=function(g,o){ // o:{type:'rice|gold',dir:'sell|buy',qty,usdg}
    var P=g.pools[o.type],f=CFG.swapFee,k=P.asset*P.usdg,spot=P.usdg/P.asset;
    var market=S.price(o.region||g.startRegion,o.type,g.round);
    if(o.dir==='sell'){var fee=round2(o.qty*f*1e4)/1e4;var net=o.qty-fee;var out=P.usdg-k/(P.asset+net);out=Math.round(out*100)/100;
      var eff=out/o.qty;return {inAmt:o.qty,fee:fee,feeUnit:o.type,out:out,outUnit:'USDG',spot:spot,market:market,eff:eff,dev:(spot-eff)/spot*100,after:g.usdg+out};}
    var fee2=round2(o.usdg*f*1e4)/1e4;var net2=o.usdg-fee2;var out2=P.asset-k/(P.usdg+net2);out2=Math.round(out2*100)/100;
    return {inAmt:o.usdg,fee:fee2,feeUnit:'USDG',out:out2,outUnit:o.type,spot:spot,market:market,eff:o.usdg/(out2||1),dev:((o.usdg/(out2||1))-spot)/spot*100,after:g.usdg-o.usdg};};
  S.swap=function(o){return call(function(){return mutate(function(g){var P=g.pools[o.type],q=S.quoteSwap(g,o);
    if(o.dir==='sell'){var l=findLot(g,o.lotId);if(l.quality<100)throw fail('QUALITY','Pool chỉ nhận hàng chất lượng 100%.');
      if(!(o.qty>0&&o.qty<=l.qty))throw fail('BAD_QTY','Số lượng không hợp lệ.');
      l.qty-=o.qty;if(l.qty===0)g.lots.splice(g.lots.indexOf(l),1);P.asset+=o.qty;P.usdg-=q.out;g.usdg=round2(g.usdg+q.out);g.stats.swapFee=round2(g.stats.swapFee+q.fee);g.stats.tx++;
      log(g,'Swap '+A.fmt.good(o.type).toLowerCase()+' → USDG',o.qty+' '+A.fmt.good(o.type).toLowerCase(),q.out);}
    else{if(!(o.usdg>0&&o.usdg<=g.usdg))throw fail('NO_USDG','Không đủ USDG để mua hàng.');
      g.usdg=round2(g.usdg-o.usdg);P.usdg+=o.usdg;P.asset-=q.out;g.lots.push({id:nextLot(g),type:o.type,qty:q.out,quality:100,region:g.startRegion});g.stats.swapFee=round2(g.stats.swapFee+q.fee*(P.usdg/P.asset)/1);g.stats.tx++;
      log(g,'Swap USDG → '+A.fmt.good(o.type).toLowerCase(),o.usdg+' USDG',-o.usdg);}
    return q;});});};

  /* ---------- chuyển vòng ---------- */
  S.nextRound=function(){return call(function(){return mutate(function(g){
    if(g.round>=CFG.rounds)throw fail('LAST','Đang ở vòng cuối. Hãy kết thúc lượt chơi.');
    g.round++;
    g.plots.forEach(function(p){if(p.status==='growing'&&g.round>=p.readyRound)p.status='ready';});
    g.lots.forEach(function(l){if(l.type==='rice'&&l.quality>0)l.quality=Math.max(0,l.quality-CFG.decayPerRound);});
    var arrived=[];g.shipments=g.shipments.filter(function(s){if(g.round>=s.arriveRound){
      var ex=g.lots.filter(function(l){return l.type===s.type&&l.region===s.to&&l.quality===s.quality;})[0];
      if(ex)ex.qty+=s.qty;else g.lots.push({id:nextLot(g),type:s.type,qty:s.qty,quality:s.quality,region:s.to});arrived.push(s);return false;}return true;});
    g.arrivedLast=arrived.map(function(s){return s.id;});return null;});});};

  /* ---------- tính toán ---------- */
  S.derive=function(g){
    var plots=g.plots.map(function(p){var st=p.status;if(st==='growing'&&g.round>=p.readyRound)st='ready';return Object.assign({},p,{status:st});});
    var stock={rice:0,gold:0},qSum=0,qN=0,val=0;
    g.lots.forEach(function(l){stock[l.type]+=l.qty;if(l.type==='rice'&&l.quality>0){qSum+=l.quality*l.qty;qN+=l.qty;}val+=S.price(l.region,l.type,g.round)*l.qty*l.quality/100;});
    var tv=0,tq={rice:0,gold:0};g.shipments.forEach(function(s){tv+=S.price(s.to,s.type,g.round)*s.qty*s.quality/100;tq[s.type]+=s.qty;});
    var net=round2(g.usdg+val+tv);
    return {plots:plots,stock:stock,avgQ:qN?Math.round(qSum/qN):0,goodsValue:round2(val),transitValue:round2(tv),net:net,gain:round2(net-CFG.startUSDG-g.topup),
      ready:plots.filter(function(p){return p.status==='ready';}),empty:plots.filter(function(p){return p.status==='empty';}),
      growing:plots.filter(function(p){return p.status==='growing';}),inTransit:g.shipments.length,
      canBuyPlot:plots.length<CFG.maxPlots,atMax:plots.length>=CFG.maxPlots};
  };
  function find(g,id){var p=g.plots.filter(function(x){return x.id==id;})[0];if(!p)throw fail('NO_PLOT','Không tìm thấy ô ruộng.');return p;}
  function findLot(g,id){var l=g.lots.filter(function(x){return x.id===id;})[0];if(!l)throw fail('NO_LOT','Lô hàng không còn tồn tại. Đã làm mới dữ liệu.');return l;}
  function nextLot(g){return 'L-'+String(g.seq.lot++).padStart(4,'0');}
  function call(fn){try{return fn();}catch(e){return Promise.reject(e);}}
  S.reset=function(){localStorage.removeItem(KEY);localStorage.removeItem(SES);};
})(window);
