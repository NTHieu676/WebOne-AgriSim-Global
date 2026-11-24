/*
 * PHÂN LUỒNG theo user journey (BA):
 *  chưa đăng nhập  -> trang giới thiệu (index) -> login/register; các trang game -> login
 *  (trang giới thiệu ai cũng mở được; đã đăng nhập thì hiện nút "Vào game")
 *  đã đăng nhập, chưa có lượt chơi -> startgame
 *  đang chơi -> dashboard (các trang game), không vào lại login/register/startgame
 *  đã kết thúc -> chỉ xem (mọi trang game ở chế độ read-only) + trang Tổng kết; muốn chơi tiếp phải "Chơi lại"
 */
(function(w){var A=w.AgriSim=w.AgriSim||{};
  var cs=document.currentScript;A.ROOT=cs.src.replace(/utils\/guard\.js.*$/,'');
  var R=A.ROUTES={landing:'pages/landing/landing.html',login:'pages/auth/login.html',register:'pages/auth/register.html',start:'pages/game/startgame.html',end:'pages/game/endgame.html',
    home:'pages/dashboard/dashboard.html',farm:'pages/farm/farm.html',inventory:'pages/inventory/inventory.html',pool:'pages/pool/pool.html',
    market:'pages/market/market.html',ship:'pages/market/market.html?tab=ship',notices:'pages/market/notices.html',profile:'pages/profile/profile.html'};
  A.url=function(k){return A.ROOT+(R[k]||k);};
  A.go=function(k){location.replace(A.url(k));};
  A.gameState=function(){var s=A.store.session();if(!s)return 'anon';if(A.store.hasRestartIntent&&A.store.hasRestartIntent())return 'nogame';var g=A.store.peek();return g?g.status:(A.store.persistedState&&A.store.persistedState()||'nogame');};
  /* kind: public | start | game | end */
  A.guard=function(kind){
    if(A.store.session()&&A.store.isGameLoaded&&!A.store.isGameLoaded()){
      /* Tải trạng thái lượt chơi rồi vào lại trang. Lỗi thì KHÔNG tải lại vô hạn: hiện thông báo + nút thử lại. */
      A.api.getGame().then(function(){location.replace(location.href);},function(e){
        var msg=(e&&e.message)||'Không tải được dữ liệu lượt chơi.';
        var box=document.getElementById('app')||document.body;
        box.className='auth';
        box.innerHTML='<div class="auth-card" role="alert"><h1 style="font-size:var(--fs-xl)">Chưa tải được dữ liệu</h1><p class="lead">'+(A.fmt?A.fmt.esc(msg):msg)+'</p><button class="btn btn-primary btn-block" id="guardRetry" type="button">Thử lại</button></div>';
        var b=document.getElementById('guardRetry');if(b)b.onclick=function(){location.reload();};
      });return false;
    }
    var st=A.gameState();
    var to=null;
    if(kind==='public'){ if(st==='nogame')to='start'; else if(st==='playing')to='home'; else if(st==='ended')to='end'; }
    else if(st==='anon')to='login';
    else if(kind==='start'){ if(st==='playing')to='home'; else if(st==='ended'&&!(A.store.hasRestartIntent&&A.store.hasRestartIntent()))to='end'; }
    else if(kind==='game'){ if(st==='nogame')to='start'; }
    else if(kind==='end'){ if(st==='nogame')to='start'; else if(st==='playing')to='home'; }
    if(to){A.go(to);return false;}
    return true;
  };
})(window);
