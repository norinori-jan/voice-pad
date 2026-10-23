// voice-pad -> flow-hub semantic activity tracker
(function(){
  const KEY='voice_pad_hub_activity_v1';
  const SESSION='voice_pad_hub_activity_session_v1';
  const MAX=120;
  const HUB='https://norinori-jan.github.io/flow-hub/';
  function read(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function clean(v){return String(v||'').replace(/\s+/g,' ').trim().slice(0,160)}
  function push(e){const all=read(KEY);all.push(e);while(all.length>MAX)all.shift();write(KEY,all);const s=read(SESSION);s.push(e);write(SESSION,s);return e}
  function semantic(type,detail,meta){return push({at:new Date().toISOString(),app:'voice-pad',stage:'capture',kind:'semantic',type,detail:clean(detail),...(meta||{})})}
  function record(action,detail,meta){return push({at:new Date().toISOString(),app:'voice-pad',stage:'capture',kind:'action',action:clean(action),detail:clean(detail),...(meta||{})})}
  function clearSession(){write(SESSION,[])}
  function session(){return read(SESSION)}
  function all(){return read(KEY)}
  function targetFromSession(){const e=session().filter(x=>x.kind==='semantic'&&x.type==='sent'&&x.target);return e.length?e[e.length-1].target:null}
  function openHub(){const builder=window.VoicePadHandoff;if(!builder)return;const h=builder.build();const target=targetFromSession();if(target==='table-pad'){h.payload.recommendation={app:'table-pad',action:'review',label:'table-padで預けた表・フローを確認する',sourceRef:'https://norinori-jan.github.io/table-pad/'};h.payload.nextAction='review';h.payload.message='voice-padで記録した内容をtable-padへ預けました。'}else if(target==='quick-ref'){h.payload.recommendation={app:'quick-ref',action:'review',label:'quick-refで預けた内容を確認する',sourceRef:'https://norinori-jan.github.io/quick-ref/'};h.payload.nextAction='review';h.payload.message='voice-padで記録した内容をquick-refへ預けました。'}location.href=HUB+'#hub_handoff_v1='+encodeURIComponent(JSON.stringify(h));}
  function addHubButton(){if(document.getElementById('hubReturnBtn'))return;const b=document.createElement('button');b.id='hubReturnBtn';b.className='btn';b.type='button';b.textContent='⌂ flow-hubへ戻る';b.style.cssText='position:fixed;right:14px;bottom:14px;z-index:50;box-shadow:0 4px 18px rgba(0,0,0,.15)';b.addEventListener('click',openHub);document.body.appendChild(b)}
  window.VoiceActivity={semantic,mark:semantic,record,clearSession,session,all,openHub};
  if(!session().some(e=>e.kind==='semantic'&&e.type==='opened'))semantic('opened','voice-padを開いた');
  document.addEventListener('click',function(e){const b=e.target.closest('button');if(!b)return;const text=clean(b.innerText||b.getAttribute('aria-label')||b.title);if(!text)return;record('click',text);if(/table-padへ預ける/.test(text))semantic('sent',text,{source:'ui',target:'table-pad'});else if(/quick-refへ預ける/.test(text))semantic('sent',text,{source:'ui',target:'quick-ref'});else if(/文字起こしする|もう一度文字起こし/.test(text))semantic('edited',text,{source:'ui'});else if(/コピー/.test(text))semantic('reviewed',text,{source:'ui'});},true);
  document.addEventListener('input',function(e){if(e.target.matches('textarea,input[type="text"]'))semantic('edited',e.target.id||e.target.name||'本文を編集',{source:'input'});},true);
  const obs=new MutationObserver(function(){const done=document.querySelectorAll('.chip.done').length;if(done>0&&!session().some(e=>e.kind==='semantic'&&e.type==='completed'))semantic('completed','文字起こし・本文作成が完了',{source:'ui'});});
  function boot(){const list=document.getElementById('list');if(list)obs.observe(list,{subtree:true,childList:true,characterData:true});addHubButton()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();