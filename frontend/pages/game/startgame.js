(function(){var A=AgriSim,F=A.fmt;
  if(!A.guard('start'))return;
  document.body.setAttribute('data-bg','terrace');
  var app=document.getElementById('app');app.className='auth';var sel=null;
  app.innerHTML='<div class="brand"><span class="mark">'+A.icon('leaf')+'</span><div><b>AGRISIM</b><small>GLOBAL</small></div></div>'+
  '<div class="auth-card start-card"><div class="role"><span class="badge b-info" style="align-self:flex-start">'+A.icon('user')+' Vai trò duy nhất</span><h1>Bạn là Nông dân</h1>'+
  '<p class="lead" style="margin:0">Quản lý mùa vụ, vận chuyển liên khu vực và giao dịch qua pool trong 6 vòng.</p>'+
  [['sprout','1. Trồng lúa và thu hoạch','Gieo trồng trên ô ruộng và thu hoạch đúng vòng để giữ chất lượng 100%.'],['swap','2. Bán, gửi hàng hoặc trao đổi qua pool','Tối ưu giá giữa Châu Á và Châu Âu hoặc hoán đổi Lúa – Vàng.'],['clock','3. Chuyển vòng — chơi tối đa 6 vòng','Theo dõi biến động thị trường qua từng vòng chơi.']].map(function(s){return '<div class="step"><span class="ic">'+A.icon(s[0])+'</span><div><b>'+s[1]+'</b>'+s[2]+'</div></div>';}).join('')+'</div>'+
  '<div><h2 style="font-size:19px;font-weight:800">Chọn khu vực khởi đầu</h2><p class="help" id="hint" style="margin-bottom:12px">Hãy chọn một khu vực để tiếp tục.</p>'+
  '<div class="banner banner-error" id="gerr" role="alert" hidden></div>'+
  '<div class="region-grid">'+[['asia','Vùng lúa đồng bằng'],['europe','Thị trường xuất khẩu']].map(function(r){return '<label class="region-opt" data-r="'+r[0]+'"><input type="radio" name="reg" value="'+r[0]+'">'+F.regionBadge(r[0])+'<b>'+r[1]+'</b><small>Lúa được thu hoạch tại khu vực này.</small></label>';}).join('')+'</div>'+
  '<div class="rows" style="margin-top:6px"><div class="row"><span>Tài sản ban đầu</span><b>'+F.usdg(A.CFG.startUSDG)+'</b></div><div class="row"><span>Ô ruộng</span><b>'+A.CFG.initPlots+' ô trống</b></div><div class="row"><span>Kho</span><b>Trống</b></div><div class="row"><span>Pool</span><b>Lúa–USDG, Vàng–USDG</b></div></div>'+
  '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><span class="help" id="hint2">Hãy chọn một khu vực để tiếp tục.</span><button class="btn btn-primary" id="go" disabled>Bắt đầu</button></div></div></div>';
  var go=document.getElementById('go');
  document.querySelectorAll('.region-opt').forEach(function(l){l.onclick=function(){sel=l.dataset.r;document.querySelectorAll('.region-opt').forEach(function(x){x.classList.toggle('sel',x===l);});
    l.querySelector('input').checked=true;go.disabled=false;document.getElementById('hint2').textContent='Bạn đã chọn khu vực khởi đầu: '+F.region(sel)+'.';};});
  if(A.qs('state')==='error'){var e=document.getElementById('gerr');e.hidden=false;e.innerHTML=A.icon('err')+'<span>Chưa tạo được lượt chơi. Dữ liệu của bạn không bị thay đổi.</span>';}
  go.onclick=function(){A.modal.open({icon:'leaf',title:'Xác nhận bắt đầu lượt chơi',sub:'Kiểm tra thông tin khởi tạo trước khi vào vòng 1.',
    rows:[['Khu vực khởi đầu',F.region(sel)],['Nhận',F.usdg(A.CFG.startUSDG),'pos'],['Ô ruộng',A.CFG.initPlots+' ô trống'],['Pool','Lúa–USDG, Vàng–USDG']],
    actions:[{label:'Hủy',kind:'outline'},{label:'Xác nhận bắt đầu',keepOpen:true,onClick:async function(){await A.api.startGame(sel);A.go('home');}}]});};
})();
