const Notifications = (() => {
  let enabled=false,lastMessageTs=0,lastCall=null;
  function notify(title,body){if(!enabled||Notification.permission!=="granted"||document.visibilityState!=="hidden")return;new Notification(title,{body,icon:"icons/icon-192.png"})}
  async function enable(){if(!("Notification" in window))return false;const p=await Notification.requestPermission();enabled=p==="granted";localStorage.setItem("fz_notifications",enabled?"1":"0");return enabled}
  function start(){
    const toggle=document.getElementById("notif-toggle");
    enabled=localStorage.getItem("fz_notifications")==="1"&&Notification?.permission==="granted";
    if(toggle){toggle.checked=enabled;toggle.addEventListener("change",async()=>{if(toggle.checked)toggle.checked=await enable();else{enabled=false;localStorage.setItem("fz_notifications","0")}})}
    Backend.onMessages(msgs=>{const latest=msgs[msgs.length-1];if(latest&&latest.ts>lastMessageTs){if(lastMessageTs&&latest.name!==sessionStorage.getItem("fivezone_user"))notify(`💬 ${latest.name}`,latest.text);lastMessageTs=latest.ts}});
    Backend.onNextCall(iso=>{lastCall=iso});
    setInterval(()=>{if(!lastCall)return;const mins=(new Date(lastCall)-Date.now())/60000;if(mins>0&&mins<=15&&mins>14.4)notify("📞 FiveZone call","Call starts in 15 minutes.")},30000);
  }
  return{start};
})();