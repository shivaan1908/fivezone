const Backend = (() => {
  let mode = "local", db = null;
  async function init() {
    if (typeof firebase !== "undefined" && firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_")) {
      try {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        if (!firebase.auth().currentUser) await firebase.auth().signInAnonymously();
        await firebase.auth().currentUser.getIdToken();
        db = firebase.firestore();
        mode = "cloud";
      } catch (e) {
        console.error("Firebase init failed", e);
        mode = "local";
      }
    }
    return mode;
  }
  function sendMessage(name, text) {
    const msg = { name, text, ts: Date.now() };
    if (mode === "cloud") return db.collection("messages").add(msg).catch(e => { console.error("Message send failed", e); throw e; });
    const all = JSON.parse(localStorage.getItem("fz_messages") || "[]"); all.push(msg); localStorage.setItem("fz_messages", JSON.stringify(all)); window.dispatchEvent(new Event("fz_messages_updated"));
  }
  function onMessages(callback) {
    if (mode === "cloud") return db.collection("messages").orderBy("ts", "asc").limit(200).onSnapshot(s => callback(s.docs.map(d => d.data())), e => { console.error("Messages listener failed", e); callback([]); });
    const read=()=>callback(JSON.parse(localStorage.getItem("fz_messages")||"[]")); window.addEventListener("fz_messages_updated",read); window.addEventListener("storage",read); read(); return ()=>{};
  }
  function setStatus(name,status) { if(mode==="cloud") return db.collection("statuses").doc(name).set({status,ts:Date.now()}); const all=JSON.parse(localStorage.getItem("fz_statuses")||"{}"); all[name]={status,ts:Date.now()}; localStorage.setItem("fz_statuses",JSON.stringify(all)); window.dispatchEvent(new Event("fz_statuses_updated")); }
  function onStatuses(callback) { if(mode==="cloud") return db.collection("statuses").onSnapshot(s=>{const out={};s.forEach(d=>out[d.id]=d.data());callback(out);},e=>console.error("Status listener failed",e)); const read=()=>callback(JSON.parse(localStorage.getItem("fz_statuses")||"{}")); window.addEventListener("fz_statuses_updated",read); window.addEventListener("storage",read); read(); return ()=>{}; }
  function setNextCall(isoString) { if(mode==="cloud") return db.collection("meta").doc("next_call").set({when:isoString}); localStorage.setItem("fz_next_call",isoString); window.dispatchEvent(new Event("fz_next_call_updated")); }
  function onNextCall(callback) { if(mode==="cloud") return db.collection("meta").doc("next_call").onSnapshot(d=>callback(d.exists?d.data().when:null),e=>console.error("Next call listener failed",e)); const read=()=>callback(localStorage.getItem("fz_next_call")); window.addEventListener("fz_next_call_updated",read); window.addEventListener("storage",read); read(); return ()=>{}; }
  return {init, mode:()=>mode, sendMessage,onMessages,setStatus,onStatuses,setNextCall,onNextCall};
})();