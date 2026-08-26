const BestTime = (() => {
  function start(){
    const btn=document.getElementById("besttime-btn"),out=document.getElementById("besttime-results");
    if(!btn||!out)return;
    btn.addEventListener("click",()=>{
      const now=new Date();
      const candidates=[];
      for(let h=0;h<24;h++){
        const base=new Date(now); base.setMinutes(0,0,0); base.setHours(h);
        let score=0, rows=[];
        FRIENDS.forEach(f=>{
          const local=new Intl.DateTimeFormat("en-GB",{timeZone:f.tz,hour:"2-digit",minute:"2-digit",hour12:false}).format(base);
          const hour=Number(local.split(":")[0]);
          let points=hour>=8&&hour<22?2:hour>=7&&hour<23?1:0;
          score+=points; rows.push(`${f.name}: ${local}`);
        });
        candidates.push({score,h,rows});
      }
      candidates.sort((a,b)=>b.score-a.score||Math.abs(a.h-now.getHours())-Math.abs(b.h-now.getHours()));
      const best=candidates[0];
      const base=new Date(now);base.setMinutes(0,0,0);base.setHours(best.h);
      const time=base.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
      out.innerHTML=`<div class="besttime-card"><strong>Best overlap: ${time}</strong><div class="hint">${best.rows.join(" · ")}</div></div>`;
    });
  }
  return {start};
})();
