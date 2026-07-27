/* ---------------------------------------------------------------------------
   Dodavanje na pocetni ekran.
   Android/Chrome: nativni dijalog preko beforeinstallprompt.
   iOS/Safari: nema programske instalacije, prikazujemo upute.
   In-app preglednici (Instagram, Facebook): instalacija nije moguca,
   nudimo kopiranje poveznice i otvaranje u pravom pregledniku.
--------------------------------------------------------------------------- */
(function(){
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault(); deferred = e;
    document.dispatchEvent(new CustomEvent('pwa:available'));
  });

  function standalone(){
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }
  function inApp(){
    var u = navigator.userAgent || '';
    return /FBAN|FBAV|Instagram|Line\/|Twitter|WhatsApp|LinkedInApp|MicroMessenger/i.test(u);
  }
  function isIOS(){
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function dismissed(){ try{ return localStorage.getItem('pwaDismissed')==='1'; }catch(e){ return false; } }
  function dismiss(){ try{ localStorage.setItem('pwaDismissed','1'); }catch(e){} }

  var CSS = '.pwa-scrim{position:fixed;inset:0;z-index:60;background:rgba(10,35,66,.45);opacity:0;'
   +'pointer-events:none;transition:opacity .24s}.pwa-scrim.on{opacity:1;pointer-events:auto}'
   +'.pwa-sh{position:fixed;left:0;right:0;bottom:0;z-index:61;background:#fff;border-radius:20px 20px 0 0;'
   +'transform:translateY(101%);transition:transform .3s cubic-bezier(.32,.72,0,1);'
   +'padding:0 18px calc(env(safe-area-inset-bottom) + 18px);box-shadow:0 -12px 40px rgba(0,41,116,.22)}'
   +'.pwa-sh.on{transform:translateY(0)}'
   +'.pwa-grab{width:38px;height:4px;border-radius:99px;background:#D3DAE7;margin:9px auto 14px}'
   +'.pwa-hd{display:flex;align-items:center;gap:13px}'
   +'.pwa-ic{width:52px;height:52px;border-radius:13px;flex:none;box-shadow:0 2px 8px rgba(0,41,116,.18)}'
   +'.pwa-t{font-size:18px;font-weight:700;color:#002974;letter-spacing:-.02em}'
   +'.pwa-s{font-size:13px;color:#6B7A99;margin-top:3px;line-height:1.4}'
   +'.pwa-steps{margin-top:16px}'
   +'.pwa-step{display:grid;grid-template-columns:24px 1fr;gap:11px;align-items:center;padding:7px 0}'
   +'.pwa-n{width:24px;height:24px;border-radius:50%;background:#EAF1FD;color:#0063F0;font:800 12px/24px '
   +'-apple-system,sans-serif;text-align:center}'
   +'.pwa-st{font-size:14px;color:#3C4E69;line-height:1.35}'
   +'.pwa-btn{display:block;width:100%;margin-top:16px;border:0;border-radius:13px;background:#0063F0;'
   +'color:#fff;padding:14px;font:700 16px/1.2 -apple-system,sans-serif;text-align:center;text-decoration:none}'
   +'.pwa-btn2{display:block;width:100%;margin-top:9px;border:0;background:none;color:#6B7A99;'
   +'padding:11px;font:600 14px/1 -apple-system,sans-serif}';

  function sheet(title, sub, stepsHtml, primary){
    var s=document.createElement('style'); s.textContent=CSS; document.head.appendChild(s);
    var scrim=document.createElement('div'); scrim.className='pwa-scrim';
    var sh=document.createElement('div'); sh.className='pwa-sh';
    sh.innerHTML='<div class="pwa-grab"></div>'
      +'<div class="pwa-hd"><img class="pwa-ic" src="./icon-192.png" alt="">'
      +'<div><div class="pwa-t">'+title+'</div><div class="pwa-s">'+sub+'</div></div></div>'
      +(stepsHtml||'')
      +(primary||'')
      +'<button class="pwa-btn2" id="pwaLater"></button>';
    document.body.appendChild(scrim); document.body.appendChild(sh);
    sh.querySelector('#pwaLater').textContent = window.__pwaT('pwa.later');
    requestAnimationFrame(function(){ scrim.classList.add('on'); sh.classList.add('on'); });
    function close(){ scrim.classList.remove('on'); sh.classList.remove('on');
      setTimeout(function(){ scrim.remove(); sh.remove(); }, 320); }
    scrim.onclick=function(){ dismiss(); close(); };
    sh.querySelector('#pwaLater').onclick=function(){ dismiss(); close(); };
    return {el:sh, close:close};
  }

  window.pwaCanOffer = function(){ return !standalone(); };

  window.pwaOffer = function(force){
    if(standalone()) return false;
    if(!force && dismissed()) return false;
    var T = window.__pwaT;
    if(inApp()){
      var s1 = sheet(T('pwa.inappTitle'), T('pwa.inapp'), '',
        '<button class="pwa-btn" id="pwaCopy">'+T('pwa.copy')+'</button>');
      s1.el.querySelector('#pwaCopy').onclick=function(){
        var b=this;
        if(navigator.clipboard) navigator.clipboard.writeText(location.href).then(function(){
          b.textContent=T('pwa.copied'); }).catch(function(){});
      };
      return true;
    }
    if(deferred){
      var s2 = sheet(T('pwa.title'), T('pwa.sub'), '',
        '<button class="pwa-btn" id="pwaAdd">'+T('pwa.add')+'</button>');
      s2.el.querySelector('#pwaAdd').onclick=function(){
        s2.close(); deferred.prompt();
        deferred.userChoice.then(function(){ deferred=null; dismiss(); });
      };
      return true;
    }
    if(isIOS()){
      var steps='<div class="pwa-steps">'
        +'<div class="pwa-step"><span class="pwa-n">1</span><span class="pwa-st">'+T('pwa.ios1')+'</span></div>'
        +'<div class="pwa-step"><span class="pwa-n">2</span><span class="pwa-st">'+T('pwa.ios2')+'</span></div>'
        +'<div class="pwa-step"><span class="pwa-n">3</span><span class="pwa-st">'+T('pwa.ios3')+'</span></div></div>';
      sheet(T('pwa.iosTitle'), T('pwa.sub'), steps, '');
      return true;
    }
    return false;
  };
})();
