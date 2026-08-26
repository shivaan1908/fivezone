(() => {
  function apply(theme){
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fz_theme", theme);
    document.querySelectorAll("[data-theme-btn]").forEach(btn=>{btn.textContent=theme==="dark"?"☀ Daylight mode":"☾ Night mode";});
  }
  function init(){
    apply(localStorage.getItem("fz_theme")||"dark");
    document.querySelectorAll("[data-theme-btn]").forEach(btn=>btn.addEventListener("click",()=>apply(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark")));
  }
  document.addEventListener("DOMContentLoaded",init);
})();
