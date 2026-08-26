const Backend = (() => {
  let mode = "local", db = null;

  function waitForAuth() {
    return new Promise((resolve) => {
      if (typeof firebase === "undefined" || !firebase.auth) return resolve(null);
      const existing = firebase.auth().currentUser;
      if (existing) return resolve(existing);
      let settled = false;
      const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve(user || null);
      });
      setTimeout(() => {
        if (!settled) {
          settled = true;
          unsubscribe();
          resolve(firebase.auth().currentUser || null);
        }
      }, 5000);
    });
  }

  async function init() {
    mode = "local";
    db = null;
    if (typeof firebase === "undefined" || typeof firebaseConfig === "undefined" || !firebaseConfig?.apiKey || firebaseConfig.apiKey.startsWith("PASTE_")) return mode;
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const user = await waitForAuth();
      if (!user || !user.email) throw new Error("No authenticated FiveZone user.");
      await user.getIdToken(true);
      db = firebase.firestore();
      mode = "cloud";
    } catch (e) {
      console.error("Firebase init failed", e);
      mode = "local";
    }
    return mode;
  }

  function currentUser() { return firebase?.auth?.().currentUser || null; }
  function currentFriend() {
    const user = currentUser();
    return FRIENDS.find(f => f.email.toLowerCase() === (user?.email || "").toLowerCase()) || null;
  }

  function sendMessage(name, text) {
    const user = currentUser(), friend = currentFriend();
    if (mode !== "cloud" || !user || !friend || friend.name !== name) return Promise.reject(new Error("Not connected or invalid FiveZone user."));
    const clean = String(text || "").trim().slice(0, 2000);
    if (!clean) return Promise.resolve();
    return db.collection("messages").add({ uid: user.uid, email: user.email, name: friend.name, text: clean, ts: Date.now() });
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
    const allowed = ["Available", "Busy", "Sleeping", "Away"];
    if (!allowed.includes(status)) return Promise.reject(new Error("Invalid status."));
    return db.collection("statuses").doc(friend.name).set({ uid: user.uid, email: user.email, status, ts: Date.now() }, { merge: true });
  }

  function onStatuses(callback, onError) {
    if (mode === "cloud") return db.collection("statuses").onSnapshot(
      s => { const out = {}; s.forEach(d => out[d.id] = d.data()); callback(out); },
      e => { console.error("Status listener failed", e); if (onError) onError(e); }
    );
    callback({}); return () => {};
  }

  function setNextCall(isoString) {
    const user = currentUser();
    if (mode !== "cloud" || !user) return Promise.reject(new Error("Not connected to Firebase."));
    return db.collection("meta").doc("next_call").set({ when: isoString, uid: user.uid, email: user.email });
  }

  function onNextCall(callback, onError) {
    if (mode === "cloud") return db.collection("meta").doc("next_call").onSnapshot(
      d => callback(d.exists ? d.data().when : null),
      e => { console.error("Next call listener failed", e); if (onError) onError(e); }
    );
    callback(null); return () => {};
  }

  return { init, mode: () => mode, currentUser, currentFriend, sendMessage, onMessages, setStatus, onStatuses, setNextCall, onNextCall };
})();
