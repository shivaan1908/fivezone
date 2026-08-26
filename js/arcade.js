(() => {
  const GAMES = { tetris: "Tetris", wordle: "Wordle", ttt: "Tic-Tac-Toe" };
  const WORDS = ["CLOCK","GLOBE","CHILL","BOARD","PLANS","SLEEP","PHONE","MANGO","SPACE","LIGHT","NIGHT","WORLD","CHESS","BRAIN","FRIEND"];
  let user = null, best = {};

  function esc(s){ const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
  function getName(){ return sessionStorage.getItem("fivezone_user") || "Player"; }
  function arcade(){ return document.getElementById("arcade"); }

  function shell(){
    const el=arcade(); if(!el)return;
    el.innerHTML=`<div class="arcade-head"><div><div class="eyebrow">FiveZone Arcade</div><h2>Play. Beat your friends.</h2><p class="hint">Three games, one leaderboard. Scores sync through Firebase.</p></div><div class="arcade-tabs"><button class="ghost active" data-game="tetris">🧱 Tetris</button><button class="ghost" data-game="wordle">🟩 Wordle</button><button class="ghost" data-game="ttt">❌⭕ Tic-Tac-Toe</button></div></div><div id="arcade-game"></div><div class="arcade-leader"><h3>🏆 Arcade leaderboard</h3><div id="arcade-leaderboard">Loading…</div></div>`;
    el.querySelectorAll("[data-game]").forEach(b=>b.addEventListener("click",()=>openGame(b.dataset.game)));
    openGame("tetris"); loadLeaderboard();
  }

  async function saveScore(game,score){
    try{ if(typeof Backend?.saveGameScore === "function") await Backend.saveGameScore(game,score); }catch(e){console.warn("Score save failed",e);}
    loadLeaderboard();
  }
  async function loadLeaderboard(){
    const box=document.getElementById("arcade-leaderboard"); if(!box)return;
    try{
      const rows=await Backend.getGameScores();
      const merged={}; rows.forEach(r=>{const k=r.game+"|"+r.name;if(!best[k]||r.score>best[k].score)best[k]=r;});
      const list=Object.values(best).sort((a,b)=>b.score-a.score).slice(0,10);
      box.innerHTML=list.length?list.map((r,i)=>`<div class="leader-row"><b>${i+1}. ${esc(r.name)}</b><span>${esc(r.game)}</span><strong>${r.score.toLocaleString()}</strong></div>`).join(""):"No scores yet — take the top spot.";
    }catch(e){box.textContent="Leaderboard unavailable.";}
  }

  function openGame(game){
    document.querySelectorAll("[data-game]").forEach(b=>b.classList.toggle("active",b.dataset.game===game));
    const root=document.getElementById("arcade-game"); if(!root)return;
    if(game==="tetris") tetris(root); else if(game==="wordle") wordle(root); else ttt(root);
  }

  function tetris(root){
    root.innerHTML=`<div class="game-card"><div class="game-title"><div><h3>🧱 Tetris</h3><p class="hint">Clear lines. Chase the high score.</p></div><div class="score-box">SCORE <b id="t-score">0</b></div></div><canvas id="tetris-canvas" width="240" height="480"></canvas><div class="t-controls"><button id="t-left">←</button><button id="t-rotate">↻</button><button id="t-right">→</button><button id="t-drop">↓</button></div><button id="t-start">Start game</button><p class="hint">Keyboard: ← → move · ↑ rotate · ↓ soft drop · Space hard drop.</p></div>`;
    const c=document.getElementById("tetris-canvas"),ctx=c.getContext("2d"),COLS=10,ROWS=20,S=24,colors=["#57D9C4","#F2A65A","#E8674B","#9B8CF2","#C9D96B"];
    let board,piece,score=0,running=false,last=0,acc=0,raf;
    const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
    function newPiece(){const s=shapes[Math.floor(Math.random()*shapes.length)].map(r=>r.slice());return {m:s,x:Math.floor((COLS-s[0].length)/2),y:0,color:Math.floor(Math.random()*colors.length)};}
    function collide(p){return p.m.some((r,y)=>r.some((v,x)=>v&&(p.y+y>=ROWS||p.x+x<0||p.x+x>=COLS||(board[p.y+y]&&board[p.y+y][p.x+x]))));}
    function merge(){p=piece;p.m.forEach((r,y)=>r.forEach((v,x)=>{if(v)board[p.y+y][p.x+x]=p.color+1;}));}
    function clear(){let n=0;for(let y=ROWS-1;y>=0;y--)if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(COLS).fill(0));n++;y++;}if(n){score+=[0,100,300,500,800][n];document.getElementById("t-score").textContent=score;}}
    function rotate(){const old=piece.m;piece.m=old[0].map((_,i)=>old.map(r=>r[i]).reverse());if(collide(piece))piece.m=old;}
    function move(dx){piece.x+=dx;if(collide(piece))piece.x-=dx;}
    function drop(){piece.y++;if(collide(piece)){piece.y--;merge();clear();piece=newPiece();if(collide(piece))end();}}
    function hard(){while(!collide(piece))piece.y++;piece.y--;merge();clear();piece=newPiece();if(collide(piece))end();}
    function draw(){ctx.fillStyle="#10151b";ctx.fillRect(0,0,c.width,c.height);board.forEach((r,y)=>r.forEach((v,x)=>{if(v){ctx.fillStyle=colors[v-1];ctx.fillRect(x*S+1,y*S+1,S-2,S-2);}}));if(piece)piece.m.forEach((r,y)=>r.forEach((v,x)=>{if(v){ctx.fillStyle=colors[piece.color];ctx.fillRect((piece.x+x)*S+1,(piece.y+y)*S+1,S-2,S-2);}}));}
    function loop(t){if(!running)return;const dt=t-last;last=t;acc+=dt;if(acc>Math.max(110,650-score/20)){drop();acc=0;}draw();raf=requestAnimationFrame(loop);}
    function start(){cancelAnimationFrame(raf);board=Array.from({length:ROWS},()=>Array(COLS).fill(0));score=0;piece=newPiece();running=true;document.getElementById("t-score").textContent="0";last=performance.now();raf=requestAnimationFrame(loop);}
    async function end(){running=false;draw();await saveScore("Tetris",score);}
    document.getElementById("t-start").onclick=start;document.getElementById("t-left").onclick=()=>running&&move(-1);document.getElementById("t-right").onclick=()=>running&&move(1);document.getElementById("t-rotate").onclick=()=>running&&rotate();document.getElementById("t-drop").onclick=()=>running&&hard();
    document.onkeydown=e=>{if(!running)return;if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(e.key))e.preventDefault();if(e.key==="ArrowLeft")move(-1);if(e.key==="ArrowRight")move(1);if(e.key==="ArrowUp")rotate();if(e.key==="ArrowDown")drop();if(e.key===" ")hard();};
  }

  function wordle(root){
    const day=Math.floor(Date.now()/86400000),answer=WORDS[day%WORDS.length];let guesses=[],current="";
    root.innerHTML=`<div class="game-card wordle-card"><div class="game-title"><div><h3>🟩 Wordle</h3><p class="hint">Everyone gets the same word today.</p></div><div class="score-box">BEST <b id="w-best">—</b></div></div><div id="w-grid" class="wordle-grid"></div><div id="w-keyboard" class="wordle-keyboard"></div><p id="w-msg" class="hint">Type a 5-letter word.</p></div>`;
    const grid=document.getElementById("w-grid");for(let i=0;i<30;i++)grid.insertAdjacentHTML("beforeend","<div class='w-cell'></div>");
    const keys="QWERTYUIOP ASDFGHJKL ZXCVBNM".replaceAll(" ","").split("");const kb=document.getElementById("w-keyboard");keys.forEach(k=>{const b=document.createElement("button");b.className="ghost";b.textContent=k;b.onclick=()=>press(k);kb.appendChild(b);});["ENTER","⌫"].forEach(k=>{const b=document.createElement("button");b.className="ghost wide";b.textContent=k;b.onclick=()=>k==="ENTER"?submit():press("BACK");kb.appendChild(b);});
    function render(){for(let i=0;i<30;i++){const cell=grid.children[i];cell.textContent=(guesses[Math.floor(i/5)]||"")[i%5]||"";cell.className="w-cell";}}
    function submit(){if(current.length!==5){document.getElementById("w-msg").textContent="Need 5 letters.";return;}const guess=current.toUpperCase(),idx=guesses.length;guesses.push(guess);const counts={};answer.split("").forEach(ch=>counts[ch]=(counts[ch]||0)+1);const state=Array(5).fill("absent");guess.split("").forEach((ch,i)=>{if(ch===answer[i]){state[i]="correct";counts[ch]--;}});guess.split("").forEach((ch,i)=>{if(state[i]==="absent"&&counts[ch]>0){state[i]="present";counts[ch]--;}});for(let i=0;i<5;i++)grid.children[idx*5+i].classList.add(state[i]);current="";render();if(guess===answer){const s=Math.max(100,700-idx*100);document.getElementById("w-msg").textContent=`Solved in ${idx+1}/6 · +${s}`;saveScore("Wordle",s);}else if(guesses.length===6){document.getElementById("w-msg").textContent=`The word was ${answer}.`;saveScore("Wordle",0);}else document.getElementById("w-msg").textContent="Keep going!";}
    function press(k){if(guesses.length>=6||guesses.at(-1)===answer)return;if(k==="BACK")current=current.slice(0,-1);else if(current.length<5)current+=k;render();}
    document.onkeydown=e=>{if(/^[a-zA-Z]$/.test(e.key))press(e.key.toUpperCase());else if(e.key==="Backspace")press("BACK");else if(e.key==="Enter")submit();};
  }

  function ttt(root){
    let state={board:Array(9).fill(""),turn:"X",x:"",o:"",status:"waiting"};
    root.innerHTML=`<div class="game-card"><div class="game-title"><div><h3>❌⭕ Tic-Tac-Toe</h3><p class="hint">Challenge a friend. One shared board.</p></div><div class="score-box" id="ttt-status">Waiting</div></div><div id="ttt-board" class="ttt-board"></div><div class="ttt-actions"><button id="ttt-create">Create / reset game</button><select id="ttt-opponent"><option value="">Choose opponent…</option>${FRIENDS.filter(f=>f.name!==getName()).map(f=>`<option>${esc(f.name)}</option>`).join("")}</select></div><p id="ttt-msg" class="hint">Create a game and choose who gets O.</p></div>`;
    const boardEl=document.getElementById("ttt-board");for(let i=0;i<9;i++){const b=document.createElement("button");b.className="ttt-cell ghost";b.onclick=()=>play(i);boardEl.appendChild(b);}
    async function refresh(){try{const s=await Backend.getTTT();if(s)state=s;}catch(e){}draw();}
    function draw(){boardEl.querySelectorAll("button").forEach((b,i)=>b.textContent=state.board[i]||"");document.getElementById("ttt-status").textContent=state.status==="won"?`${state.winner} wins`:state.status==="draw"?"Draw":`${state.turn}'s turn`;document.getElementById("ttt-msg").textContent=state.x&&state.o?`${state.x} = X · ${state.o} = O`:"Create a game and choose who gets O.";}
    async function create(){const opp=document.getElementById("ttt-opponent").value;if(!opp)return;state={board:Array(9).fill(""),turn:"X",x:getName(),o:opp,status:"playing"};await Backend.saveTTT(state);draw();}
    async function play(i){if(state.status!=="playing"||state.board[i]||state[state.turn.toLowerCase()]!==getName())return;state.board[i]=state.turn;const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];const win=wins.some(a=>a.every(j=>state.board[j]===state.turn));if(win){state.status="won";state.winner=getName();await saveScore("Tic-Tac-Toe",100);}else if(state.board.every(Boolean)){state.status="draw";await saveScore("Tic-Tac-Toe",25);}else state.turn=state.turn==="X"?"O":"X";await Backend.saveTTT(state);draw();}
    document.getElementById("ttt-create").onclick=create;Backend.watchTTT(s=>{if(s)state=s;draw();});refresh();
  }

  window.Arcade={start:()=>{user=getName();shell();}};
})();