// Build hub_handoff_v1 from the current voice-pad capture session.
(function(){
  const SESSION='voice_pad_hub_activity_session_v1';
  const HUB='https://norinori-jan.github.io/flow-hub/';
  const APP='https://norinori-jan.github.io/voice-pad/';
  function read(){try{return JSON.parse(localStorage.getItem(SESSION)||'[]')}catch(e){return[]}}
  function clean(v){return String(v||'').replace(/\s+/g,' ').trim().slice(0,160)}
  function build(){
    const events=read();
    const semantic=events.filter(e=>e.kind==='semantic');
    const latest=[...semantic].reverse().find(e=>e.type);
    const hasText=semantic.some(e=>e.type==='completed');
    const sent=semantic.some(e=>e.type==='sent');
    const next=sent
      ? {app:'quick-ref',action:'review',label:'quick-refで預けた内容を確認する',sourceRef:'https://norinori-jan.github.io/quick-ref/'}
      : hasText
        ? {app:'quick-ref',action:'send',label:'voice-padの内容をquick-refへ預ける',sourceRef:APP}
        : {app:'voice-pad',action:'continue',label:'voice-padで録音を続ける',sourceRef:APP};
    const activity={
      app:'voice-pad',stage:'capture',stageLabel:'録音・文字化',
      sourceAction:latest?clean(latest.detail):'voice-pad',sourceRef:APP,
      appsUsed:['voice-pad'],completedSteps:hasText?['録音・文字起こし']:[],
      outputs:hasText?['文字化されたメモ／素材']:[],currentStatus:latest?latest.type:'opened',
      canAdvance:hasText||sent,semanticEvents:semantic.slice(-30),
      actions:events.map(e=>clean(e.action||e.detail)).filter(Boolean).slice(-20),
      summary:sent?'voice-padで記録した内容をquick-refへ預けました。':hasText?'voice-padで録音を文字化しました。':'voice-padで録音を開始しました。'
    };
    return {
      protocol:'hub_handoff_v1',id:crypto.randomUUID(),createdAt:new Date().toISOString(),source:'voice-pad',sourceRef:APP,
      intent:'capture.review',context:{text:activity.summary,tags:['voice-pad','capture'],emotion:null,focus:'review'},
      payload:{stage:'capture',status:'recorded',activity,nextAction:next.action,message:activity.summary,recommendation:next},
      next:{app:'flow-hub',action:'review'},returnTo:HUB
    };
  }
  window.VoicePadHandoff={build};
})();
