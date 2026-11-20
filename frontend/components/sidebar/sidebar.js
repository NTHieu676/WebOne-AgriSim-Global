(function(w){var A=w.AgriSim=w.AgriSim||{};
  var ITEMS=[['home','Trang chủ','home'],['farm','Nông trại','sprout'],['inventory','Kho hàng','box'],['pool','Trao đổi','swap'],['market','Thị trường & Vận chuyển','truck'],['profile','Hồ sơ & Ngân hàng','bank']];
  A.sidebar={
    items:ITEMS,
    html:function(active,ctx){
      var nav=ITEMS.map(function(i){return '<a href="'+A.url(i[0])+'"'+(i[0]===active?' aria-current="page"':'')+'>'+A.icon(i[2])+'<span>'+i[1].replace('&','&amp;')+'</span></a>';}).join('');
      var atMax=ctx&&ctx.d&&ctx.d.atMax,ro=ctx&&ctx.ro;
      var btn=ro?'':'<a class="btn btn-accent btn-sm only-play" href="'+A.url('farm')+'?buy=1">+ Mua thêm nông trại</a>';
      var txt=atMax?'Bạn đã đạt số ô ruộng tối đa ('+ctx.d.plots.length+'/'+A.CFG.maxPlots+').':'Hết diện tích để trồng? Bạn có thể mở rộng nông trại tại đây.';
      if(atMax&&!ro)btn='<span class="btn btn-sm btn-block" aria-disabled="true">Đã đạt giới hạn ô</span>';
      return '<div class="brand"><span class="mark">'+A.icon('leaf')+'</span><div><b>AGRISIM</b><small>GLOBAL</small></div></div><nav class="nav" aria-label="Điều hướng chính">'+nav+'</nav>'+
        '<div class="promo"><div class="art">'+A.icon('sprout')+'</div>'+txt+btn+'</div>';
    },
    tabbar:function(active){var T=[['home','Trang chủ','home'],['farm','Nông trại','sprout'],['inventory','Kho hàng','box'],['pool','Trao đổi','swap'],['market','Thị trường','truck']];
      return T.map(function(i){return '<a href="'+A.url(i[0])+'"'+(i[0]===active?' aria-current="page"':'')+'>'+A.icon(i[2])+i[1]+'</a>';}).join('');}
  };
})(window);
