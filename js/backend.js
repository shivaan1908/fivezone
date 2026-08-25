const Backend = (() => {
  let mode = "local", db = null;
  async function init() {
    if (typeof firebase !== "undefined" && firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_")) {
      try {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        const user = firebase.auth().currentUser;
        if (!user || !user.email) throw new Error("No authenticated FiveZone user.");
        await user.getIdToken(true);
        db = firebase.firestore();
        mode = "cloud";
      } catch (e) {
        console.error("Firebase init failed", e);
        mode = "local";
      }
    }
    return mode;
  }
  function currentUser() { return firebase.auth().currentUser; }
  function currentFriend() {
    const user = currentUser();
    return FRIENDS.find(f => f.email === user?.email) || null;
  }
  function sendMessage(name, text) {
    const user = currentUser(), friend = currentFriend();
    if (mode !== "cloud" || !user || !friend || friend.name !== name) throw new Error("Not connected or invalid FiveZone user.");
    const clean = String(text || "").trim().slice(0, 2000);
    if (!clean) return Promise.resolve();
    const msg = { uid: user.uid, email: user.email, name: friend.name, text: clean, ts: Date.now() };
    return db.collection("messages").add(msg).catch(e => { console.error("Message send failed", e); throw e; });
  }
  function onMessages(callback, onError) {
    if (mode === "cloud") return db.collection("messages").orderBy("ts", "asc").limit(200).onSnapshot(
      s => callback(s.docs.map(d => d.data())),
      e => { console.error("Messages listener failed", e); if (onError) onError(e); }
    );
    callback([]); return () => {};
  }
  function setStatus(name, status) {
    const user = currentUser(), friend = currentFriend();
    if (mode !== "cloud" || !user || !friend || friend.name !== name) return Promise.reject(new Error("Invalid FiveZone user."));
    return db.collection("statuses").doc(friend.name).set({ uid: user.uid, email: user.email, status, ts: Date.now() });
  }
  function onStatuses(callback, onError) {
    if (mode === "cloud") return db.collection("statuses").onSnapshot(s => { const out = {}; s.forEach(d => out[d.id] = d.data()); callback(out); }, e => { console.error("Status listener failed", e); if (onError) onError(e); });
    callback({}); return () => {};
  }
  function setNextCall(isoString) {
    const user = currentUser();
    if (mode !== "cloud" || !user) return Promise.reject(new Error("Not connected to Firebase."));
    return db.collection("meta").doc("next_call").set({ when: isoString, uid: user.uid, email: user.email });
  }
  function onNextCall(callback, onError) {
    if (mode === "cloud") return db.collection("meta").doc("next_call").onSnapshot(d => callback(d.exists ? d.data().when : null), e => { console.error("Next call listener failed", e); if (onError) onError(e); });
    callback(null); return () => {};
  }
  return { init, mode: () => mode, sendMessage, onMessages, setStatus, onStatuses, setNextCall, onNextCall };
})();