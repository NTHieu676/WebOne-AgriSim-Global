(function(){var A=AgriSim,F=A.fmt;
  A.page({id:'market',title:'Thông báo thị trường',sub:'Kịch bản: Đại dịch toàn cầu. Xem lại thông báo của các vòng.',bg:'misty-b',guard:'game',panel:'none',
    render:function(ctx){var g=ctx.g;if(A.qs('state')==='empty')return '<div class="card"><div class="empty"><div class="ic">'+A.icon('bell')+'</div><h3>Chưa có thông báo nào.</h3><p>Thông báo xuất hiện khi bạn chuyển vòng.</p></div></div>';
      var rows=A.NOTICES.map(function(n,i){var r=i+1;
        if(r>g.round)return '<div class="notice-row lock"><span class="r">Vòng '+r+'</span><div style="flex:1">Chưa mở – xuất hiện khi bạn chuyển vòng</div>'+A.icon('lock')+'</div>';
        var cur=r===g.round&&!ctx.ro;return '<div class="notice-row '+(cur?'cur':'')+'"><span class="r">Vòng '+r+'</span><div style="flex:1"><b>'+F.esc(n.t)+(cur?' <span class="badge b-warning" style="margin-left:6px">'+A.icon('alert')+' Hiện tại</span>':'')+'</b>'+F.esc(n.d)+'</div></div>';}).join('');
      return '<div class="card"><div class="notice-list">'+rows+'</div></div>';}
  });
})();
