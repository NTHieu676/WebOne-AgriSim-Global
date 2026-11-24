/*
 * Thanh cuộn nổi (overlay) – không chiếm chỗ trong bố cục.
 * Thanh cuộn gốc của trang / panel / modal bị ẩn bằng CSS (base.css); file này vẽ một con trượt mảnh,
 * nền trong suốt, nổi lên trên nội dung:
 *  - hiện khi đang cuộn, khi rê chuột sát mép phải vùng cuộn, và chớp 1 lần lúc mở trang (gợi ý "còn nội dung");
 *  - tự ẩn sau ~1 giây; kéo được bằng chuột; trang không cuộn được thì không hiện gì.
 */
(function(){
  var SEL='.panel,.modal';           // các vùng cuộn bên trong được hỗ trợ (ngoài trang)
  var root=document.scrollingElement||document.documentElement;
  var bars=new Map();                // element cuộn -> {el, t (con trượt), timer}

  function isRoot(el){return el===root||el===document.documentElement||el===document.body||el===document;}
  function bar(el){
    if(isRoot(el))el=root;
    var b=bars.get(el);if(b)return b;
    var t=document.createElement('div');t.className='osb'+(el!==root&&el.closest('.panel')?' dark':'');t.setAttribute('aria-hidden','true');
    document.body.appendChild(t);b={el:el,t:t,timer:0};bars.set(el,b);drag(b);return b;}

  /* Vùng hiển thị của vùng cuộn (trang: cả cửa sổ trừ thanh tab dưới trên điện thoại) */
  function box(el){
    if(el===root){var tb=document.querySelector('.tabbar'),bot=innerHeight;
      if(tb&&tb.offsetHeight&&getComputedStyle(tb).position==='fixed')bot-=tb.offsetHeight;
      return {top:0,bottom:bot,right:innerWidth};}
    var r=el.getBoundingClientRect();return {top:Math.max(r.top,0),bottom:Math.min(r.bottom,innerHeight),right:r.right};}

  function geom(b){var el=b.el,vh=el.clientHeight,sh=el.scrollHeight;
    if(!el.isConnected||sh<=vh+1)return null;
    var bx=box(el),trackTop=bx.top+4,trackH=bx.bottom-bx.top-8;if(trackH<40)return null;
    var th=Math.max(36,trackH*vh/sh),max=sh-vh,top=trackTop+(trackH-th)*Math.min(1,el.scrollTop/max);
    return {top:top,h:th,right:innerWidth-bx.right+3,trackH:trackH,max:max};}

  function place(b){if(!b.el.isConnected){b.t.remove();bars.delete(b.el);return false;}var g=geom(b);if(!g){b.t.classList.remove('on');return false;}
    var s=b.t.style;s.top=g.top+'px';s.height=g.h+'px';s.right=g.right+'px';return true;}

  function show(el,ms){var b=bar(el);if(!place(b))return;
    b.t.classList.add('on');clearTimeout(b.timer);
    if(!b.hold&&!b.drag)b.timer=setTimeout(function(){b.t.classList.remove('on');},ms||1000);}

  /* Kéo con trượt bằng chuột */
  function drag(b){b.t.addEventListener('pointerdown',function(e){
    if(e.pointerType==='touch')return;e.preventDefault();var g=geom(b);if(!g)return;
    var y0=e.clientY,s0=b.el.scrollTop,k=g.max/Math.max(1,g.trackH-g.h);
    b.drag=true;b.t.classList.add('drag');b.t.setPointerCapture(e.pointerId);document.documentElement.classList.add('osb-dragging');
    function mv(ev){b.el.scrollTop=s0+(ev.clientY-y0)*k;}
    function up(){b.drag=false;b.t.classList.remove('drag');document.documentElement.classList.remove('osb-dragging');
      b.t.removeEventListener('pointermove',mv);b.t.removeEventListener('pointerup',up);b.t.removeEventListener('pointercancel',up);show(b.el);}
    b.t.addEventListener('pointermove',mv);b.t.addEventListener('pointerup',up);b.t.addEventListener('pointercancel',up);});
    b.t.addEventListener('pointerenter',function(){b.hold=true;show(b.el);});
    b.t.addEventListener('pointerleave',function(){b.hold=false;show(b.el,600);});}

  /* Cuộn ở bất kỳ đâu (bắt ở pha capture vì sự kiện scroll không nổi bọt) */
  document.addEventListener('scroll',function(e){var el=e.target;
    if(isRoot(el))show(root);else if(el.matches&&el.matches(SEL))show(el);},true);

  /* Rê chuột sát mép phải của vùng cuộn -> hiện để người dùng biết có thể kéo */
  var raf=0;
  document.addEventListener('mousemove',function(e){if(raf)return;raf=requestAnimationFrame(function(){raf=0;
    var x=e.clientX,y=e.clientY,hit=document.elementFromPoint(x,y),inner=hit&&hit.closest&&hit.closest(SEL);
    if(inner){var r=inner.getBoundingClientRect();if(r.right-x<16)show(inner);}
    else if(innerWidth-x<16)show(root);});},{passive:true});

  addEventListener('resize',function(){bars.forEach(function(b){if(b.t.classList.contains('on'))place(b);});});

  /* Mở trang: chớp con trượt 1 lần nếu trang dài hơn màn hình (nội dung render bất đồng bộ nên chờ một nhịp) */
  addEventListener('load',function(){setTimeout(function(){show(root,1400);},700);});
})();
