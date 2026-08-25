document.addEventListener("DOMContentLoaded", async ()=>{
  const who=requireLogin();if(!who)return;document.getElementById("who-am-i").textContent=who;
  const mode=await Backend.init();document.getElementById("mode-note").textContent=mode==="cloud"?"Connected to shared FiveZone data.":"Local demo mode — Firebase is not connected.";
  Clocks.start(); Globe.start(); Planner.start();
  const status=document.getElementById("my-status");
  status.addEventListener("change",()=>Backend.setStatus(who,status.value));
  Backend.onStatuses(all=>{FRIENDS.forEach(f=>{const el=document.getElementById(`status-${f.name.replace(/\s+/g,"_")}`),v=all[f.name]?.status;if(el){el.textContent=v||"—";el.className=`badge ${v?v.toLowerCase():"away"}`;}});if(all[who]?.status)status.value=all[who].status;});
  const log=document.getElementById("chat-log");Backend.onMessages(msgs=>{log.innerHTML=msgs.length?msgs.map(m=>`<div class="chat-msg"><div class="meta"><span>${escapeHtml(m.name)}</span><span>${new Date(m.ts).toLocaleString()}</span></div><div>${escapeHtml(m.text)}</div></div>`).join(""):"<div class=\"chat-empty\">No messages yet.</div>";log.scrollTop=log.scrollHeight;});
  document.getElementById("chat-form").addEventListener("submit",async e=>{e.preventDefault();const input=document.getElementById("chat-input"),text=input.value.trim();if(!text)return;try{await Backend.sendMessage(who,text);input.value="";}catch(err){console.error("Could not send message",err);}});
  let nextCall=null;const display=document.getElementById("nextcall-display");Backend.onNextCall(v=>{nextCall=v;renderCountdown();});setInterval(renderCountdown,1000);
  function renderCountdown(){if(!nextCall){display.textContent="No call scheduled yet.";return;}const diff=new Date(nextCall)-new Date();if(diff<=0){display.innerHTML='<div class="cd-time">Call time!</div>';return;}const s=Math.floor(diff/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sec=s%60;display.innerHTML=`<div><div class="eyebrow">Next call</div><div class="cd-time">${d?d+"d ":""}${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}</div></div>`;}
  document.getElementById("nextcall-form").addEventListener("submit",e=>{e.preventDefault();const v=document.getElementById("nextcall-input").value;if(v)Backend.setNextCall(new Date(v).toISOString());});
  document.getElementById("logout-btn").addEventListener("click",logout);
});
function escapeHtml(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML;}