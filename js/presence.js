const Presence = (() => {
  let timer = null;
  function start(){
    const who = sessionStorage.getItem("fivezone_user");
    if(!who) return;
    const beat=()=>Backend.heartbeat().catch(e=>console.warn("Presence heartbeat failed",e));
    beat(); clearInterval(timer); timer=setInterval(beat,30000);
    window.addEventListener("beforeunload",()=>{ /* stale timeout handles closed tabs */ });
  }
  function bind(){
    Backend.onPresence(all=>{
      FRIENDS.forEach(f=>{
        const row=document.getElementById(`status-${f.name.replace(/\s+/g,"_")}`);
        const p=all[f.name];
        if(!row||!p)return;
        const online=Date.now()-Number(p.lastSeen||0)<90000;
        row.dataset.presence=online?"online":"offline";
        if(!row.textContent||row.textContent==="—") row.textContent=online?"Online":"Offline";
      });
    });
  }
  return{start,bind};
})();