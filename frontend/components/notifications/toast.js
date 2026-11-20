(function(w){var A=w.AgriSim=w.AgriSim||{};var host;
  A.toast=function(msg,type){if(!host){host=document.createElement('div');host.className='toast-host';host.setAttribute('role','status');document.body.appendChild(host);}
    var t=document.createElement('div');t.className='toast'+(type==='err'?' err':'');t.innerHTML=A.icon(type==='err'?'err':'check')+'<span>'+A.fmt.esc(msg)+'</span>';host.appendChild(t);
    setTimeout(function(){t.remove();},type==='err'?5200:3600);};
})(window);
