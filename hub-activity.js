// voice-pad -> flow-hub semantic activity tracker
(function(){
  const KEY='voice_pad_hub_activity_v1';
  const SESSION='voice_pad_hub_activity_session_v1';
  const MAX=120;
  function read(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function clean(v){return String(v||'').replace(/\s+/g,' ').trim().slice(0,160)}
  function push(e){const all=read(KEY);all.push(e);while(all.length>MAX)all.shift();write(KEY,all);const s=read(SESSION);s.push(e);write(SESSION,s);return e}
  function semantic(type,detail,meta){return push({at:new Date().toISOString(),app:'voice-pad',stage:'capture',kind:'semantic',type,detail:clean(detail),...(meta||{})})}
  function record(action,detail,meta){return push({at:new Date().toISOString(),app:'voice-pad',stage:'capture',kind:'action',action:clean(action),detail:clean(detail),...(meta||{})})}
  function clearSession(){write(SESSION,[])}
  function session(){return read(SESSION)}
  function all(){return read(KEY)}
  window.VoiceActivity={semantic,mark:semantic,record,clearSession,session,all};
  if(!session().some(e=>e.kind==='semantic'&&e.type==='opened'))semantic('opened','voice-padを開いた');
  document.addEventListener('click',function(e){
    const b=e.target.closest('button');if(!b)return;
    const text=clean(b.innerText||b.getAttribute('aria-label')||b.title);
    if(!text)return;record('click',text);
    if(/quick-refへ預ける|預ける/.test(text)) semantic('sent',text,{source:'ui'});
    else if(/table-padへ預ける/.test(text)) semantic('sent',text,{source:'ui',target:'table-pad'});
    else if(/文字起こしする|もう一度文字起こし/.test(text)) semantic('edited',text,{source:'ui'});
    else if(/コピー/.test(text)) semantic('reviewed',text,{source:'ui'});
  },true);
  document.addEventListener('input',function(e){if(e.target.matches('textarea,input[type="text"]'))semantic('edited',e.target.id||e.target.name||'本文を編集',{source:'input'});},true);
  const obs=new MutationObserver(function(){
    const done=document.querySelectorAll('.chip.done').length;
    if(done>0 && !session().some(e=>e.kind==='semantic'&&e.type==='completed')) semantic('completed','文字起こし・本文作成が完了',{source:'ui'});
  });
  window.addEventListener('DOMContentLoaded',function(){const list=document.getElementById('list');if(list)obs.observe(list,{subtree:true,childList:true,characterData:true});});
})();
