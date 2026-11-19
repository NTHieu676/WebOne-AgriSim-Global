/*
 * Modal dùng chung. AgriSim.modal.open({icon,title,sub,body,rows:[[label,value]],note:{type,text},
 *   actions:[{label,kind,onClick:async()=>{}, keepOpen}] , onClose})
 * - Nút xác nhận tự khóa + hiện "Đang lưu…" khi đang xử lý (BR-27).
 * - Lỗi trả về hiện ngay trong modal, dữ liệu không đổi (BR-26).
 */
(function(w){var A=w.AgriSim=w.AgriSim||{};var F=A.fmt;
  var M=A.modal={};var cur=null;
  M.close=function(){if(cur){cur.back.remove();document.removeEventListener('keydown',cur.key);var cb=cur.onClose;cur=null;if(cb)cb();}};
  M.open=function(o){M.close();
    var back=document.createElement('div');back.className='modal-back';
    var rows=(o.rows||[]).map(function(r){return '<div class="row"><span>'+r[0]+'</span><b class="'+(r[2]||'')+'">'+r[1]+'</b></div>';}).join('');
    var h='<div class="modal" role="dialog" aria-modal="true" aria-label="'+F.esc(o.title)+'"><div class="modal-head">'+(o.icon?'<div class="ic">'+A.icon(o.icon)+'</div>':'')+
      '<div><h3>'+o.title+'</h3>'+(o.sub?'<div class="sub">'+o.sub+'</div>':'')+'</div><button class="x" aria-label="Đóng" data-close>'+A.icon('x')+'</button></div>'+
      (o.body?'<div class="modal-body">'+o.body+'</div>':'')+(rows?'<div class="rows">'+rows+'</div>':'')+
      (o.note?'<div class="note note-'+o.note.type+'" data-note>'+A.icon(o.note.type==='err'?'err':o.note.type==='warn'?'alert':'info')+'<span>'+o.note.text+'</span></div>':'')+
      '<div class="note note-err" data-err hidden></div><div class="modal-foot">'+(o.actions||[{label:'Đóng',kind:'outline'}]).map(function(a,i){return '<button class="btn btn-'+(a.kind||'primary')+'" data-act="'+i+'"'+(a.disabled?' disabled':'')+'>'+a.label+'</button>';}).join('')+'</div></div>';
    back.innerHTML=h;document.body.appendChild(back);
    var key=function(e){if(e.key==='Escape')M.close();};document.addEventListener('keydown',key);
    cur={back:back,key:key,onClose:o.onClose};
    back.addEventListener('mousedown',function(e){if(e.target===back&&!back.classList.contains('busy'))M.close();});
    back.querySelector('[data-close]').onclick=function(){if(!back.classList.contains('busy'))M.close();};
    var errBox=back.querySelector('[data-err]');
    (o.actions||[{}]).forEach(function(a,i){var b=back.querySelector('[data-act="'+i+'"]');
      b.onclick=async function(){
        if(!a.onClick){M.close();return;}
        var label=b.innerHTML;back.classList.add('busy');b.classList.add('is-busy');
        back.querySelectorAll('.modal-foot .btn').forEach(function(x){x.disabled=true;});
        if(a.kind!=='outline'&&a.kind!=='ghost')b.innerHTML='<span class="spin"></span> Đang lưu…';
        errBox.hidden=true;
        try{await a.onClick(back);if(!a.keepOpen)M.close();}
        catch(e){back.classList.remove('busy');b.classList.remove('is-busy');b.innerHTML=label;
          back.querySelectorAll('.modal-foot .btn').forEach(function(x){x.disabled=false;});
          errBox.hidden=false;errBox.innerHTML=A.icon('err')+'<span>'+F.esc(e.message||'Chưa lưu được. Dữ liệu của bạn không bị thay đổi.')+'</span>';}
      };});
    var first=back.querySelector('input,select');if(first)first.focus();
    return back;};
  A.confirmBox=M.open;
})(window);
