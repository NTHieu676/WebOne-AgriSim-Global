/* Định dạng số kiểu Việt Nam: 2.000 · 123,50 */
(function(w){
  var A=w.AgriSim=w.AgriSim||{};
  A.fmt={
    num:function(n,d){d=d==null?0:d;return Number(n).toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d});},
    usdg:function(n,d){if(d==null)d=(Math.round(n*100)%100===0)?0:2;return this.num(n,d)+' USDG';},
    usdg2:function(n){return this.num(n,2)+' USDG';},
    signed:function(n,d){return (n>0?'+':n<0?'−':'')+this.num(Math.abs(n),d==null?2:d);},
    pct:function(n){return this.num(n,0)+'%';},
    region:function(r){return r==='asia'?'Châu Á':'Châu Âu';},
    regionBadge:function(r){return '<span class="badge b-'+(r==='asia'?'asia':'europe')+'">'+this.region(r)+'</span>';},
    good:function(t){return t==='gold'?'Vàng':'Lúa';},
    esc:function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  };
  A.qs=function(k){return new URLSearchParams(location.search).get(k);};
  A.sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
})(window);
