/*
 * Gọi backend. Mọi trang chỉ gọi AgriSim.api.* — đổi sang fetch('/api/...') khi backend Express sẵn sàng.
 * Ví dụ: getGame: () => request('GET','/api/game')
 */
(function(w){var A=w.AgriSim=w.AgriSim||{};var S=A.store;
  A.API_BASE='';  // vd 'http://localhost:3000'
  A.api={
    getGame:function(){return S.getGame();},
    startGame:function(region){return S.startGame(region);},
    endGame:function(){return S.endGame();},
    replay:function(){return S.replay();},
    nextRound:function(){return S.nextRound();},
    plant:function(plotId){return S.plantTo(plotId);},
    harvest:function(plotId){return S.harvest(plotId);},
    buyPlot:function(){return S.buyPlot();},
    topup:function(amount){return S.topup(amount);},
    createPayment:function(o){return S.createPayment(o);},
    settlePayment:function(id,result,reason){return S.settlePayment(id,result,reason);},
    payments:function(){return S.payments();},
    sell:function(lotId,qty){return S.sell(lotId,qty);},
    ship:function(lotId,qty,to){return S.ship(lotId,qty,to);},
    swap:function(o){return S.swap(o);}
  };
})(window);
