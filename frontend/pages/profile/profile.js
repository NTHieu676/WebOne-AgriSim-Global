(function(){var A=AgriSim,F=A.fmt,C=A.CFG;
  var tab=A.qs('tab')==='history'?'history':'profile';var amt=500;
  function ini(n){return n.split(/\s+/).map(function(x){return x[0];}).slice(0,2).join('').toUpperCase();}
  var PST={paid:['b-success','Thành công'],failed:['b-danger','Thất bại'],expired:['b-warning','Hết hạn'],cancelled:['b-info','Đã hủy'],pending:['b-info','Đang chờ']};
  function payCard(){var l=A.api.payments();if(!l.length)return '';
    return '<div class="card" id="payList" style="margin-top:16px"><div class="card-head"><h3>Giao dịch nạp tiền gần đây</h3><span class="hint">'+l.length+' giao dịch</span></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Mã GD</th><th>Phương thức</th><th class="r">Số tiền</th><th>Trạng thái</th></tr></thead><tbody>'+
      l.slice(0,6).map(function(x){var t=PST[x.status]||PST.failed;return '<tr><td class="num">'+x.id+' · '+x.code+'</td><td>'+A.PAY_METHODS[x.method]+(x.bank?' · '+F.esc(x.bank):'')+'</td><td class="r num">'+F.usdg2(x.amount)+'</td><td><span class="badge '+t[0]+'">'+t[1]+'</span></td></tr>';}).join('')+'</tbody></table></div></div>';}
  A.page({id:'profile',title:'Hồ sơ & Ngân hàng giả lập',sub:'Quản lý thông tin người chơi và nạp thêm USDG giả lập cho lượt chơi.',bg:'terrace',guard:'game',panel:'none',
    skeleton:function(){return '<div class="skel" style="height:44px;width:260px;border-radius:999px"></div><div class="profile-grid"><div class="skel" style="height:300px;border-radius:24px"></div><div class="skel" style="height:300px;border-radius:24px"></div></div>';},
    render:function(ctx){var g=ctx.g,u=A.auth.user();
      var tb='<div class="seg" id="tabs"><button data-t="profile" class="'+(tab==='profile'?'on':'')+'">Hồ sơ</button><button data-t="history" class="'+(tab==='history'?'on':'')+'">Lịch sử hoạt động</button></div>';
      if(tab==='history'){var rows=g.history;
        if(A.qs('state')==='empty'||!rows.length)return tb+'<div class="card"><div class="empty"><div class="ic">'+A.icon('list')+'</div><h3>Chưa có hoạt động nào.</h3><p>Các thao tác thành công sẽ xuất hiện tại đây.</p></div></div>';
        return tb+'<div class="card"><div class="card-head"><h3>Nhật ký giao dịch USDG</h3><span class="hint">'+rows.length+' hoạt động · mới nhất ở trên</span></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Vòng</th><th>Hoạt động</th><th>Chi tiết</th><th class="r">Biến động</th><th class="r">Số dư sau</th></tr></thead><tbody>'+
          rows.map(function(x){return '<tr><td>Vòng '+x.round+'</td><td><b>'+F.esc(x.title)+'</b></td><td>'+F.esc(x.detail)+'</td><td class="r num '+(x.delta>0?'pos':x.delta<0?'neg':'')+'">'+(x.delta?F.signed(x.delta,2)+' USDG':'–')+'</td><td class="r num">'+F.usdg2(x.balance)+'</td></tr>';}).join('')+'</tbody></table></div></div>';}
      return tb+'<div class="profile-grid"><div class="card"><div class="card-head"><h3>Thông tin người chơi</h3><span class="badge b-success">Nông dân</span></div>'+
        '<div class="who"><span class="avatar">'+F.esc(ini(u.name))+'</span><div><div class="hint">Tên hiển thị</div><b style="font-size:16px">'+F.esc(u.name)+'</b><div class="hint">Khu vực khởi đầu: '+F.regionBadge(g.startRegion)+'</div></div></div>'+
        '<div class="bigmoney"><span>Số tiền còn lại</span><b class="num">'+F.usdg2(g.usdg)+'</b></div><div class="rows" style="margin-top:12px"><div class="row"><span>Tổng tiền đã nạp thêm</span><b>'+F.usdg2(g.topup)+'</b></div></div></div>'+
        '<div class="card"><div class="card-head"><h3>Nạp USDG giả lập</h3></div><div class="note note-warn">'+A.icon('info')+'<span>Đây là tiền giả lập. Sau khi bấm Nạp, bạn chọn phương thức (QR, thẻ, ví) và hoàn tất thanh toán giả lập.</span></div>'+
        '<div class="field"><label for="amt">Số USDG muốn nạp</label><input class="input num" id="amt" inputmode="numeric" value="'+amt+'"'+(ctx.ro?' disabled':'')+'><div class="help">Số nguyên từ 100 đến 5.000 USDG mỗi lần.</div><div class="err-text" id="aerr" hidden></div></div>'+
        '<div class="help" style="margin-bottom:6px">Chọn nhanh mệnh giá</div><div class="chips">'+C.topupSteps.map(function(s){return '<button type="button" class="chip-btn '+(s===amt?'on':'')+'" data-v="'+s+'"'+(ctx.ro?' disabled':'')+'>'+F.num(s)+'</button>';}).join('')+'</div>'+
        '<div style="text-align:right;margin-top:14px"><button class="btn btn-primary" id="go"'+(ctx.ro?' disabled':'')+'>Nạp</button></div></div></div>'+payCard();},
    bind:function(ctx,v){
      v.querySelectorAll('#tabs button').forEach(function(b){b.onclick=function(){tab=b.dataset.t;history.replaceState(null,'',location.pathname+(tab==='history'?'?tab=history':''));ctx.refresh();};});
      var inp=v.querySelector('#amt'),go=v.querySelector('#go');if(!inp)return;
      function check(){var e=A.flows.checkTopup(Number(inp.value));var t=v.querySelector('#aerr');t.hidden=!e;if(e)t.innerHTML=A.icon('err')+e;inp.classList.toggle('is-invalid',!!e);
        v.querySelectorAll('.chip-btn').forEach(function(c){c.classList.toggle('on',+c.dataset.v===Number(inp.value));});return !e;}
      inp.oninput=function(){amt=Number(inp.value);check();};
      v.querySelectorAll('.chip-btn').forEach(function(c){c.onclick=function(){inp.value=c.dataset.v;amt=+c.dataset.v;check();};});
      go.onclick=function(){if(!check())return;A.flows.topupConfirm(ctx,Number(inp.value));};}
  });
})();
