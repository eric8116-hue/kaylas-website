document.querySelectorAll('.yr').forEach(el => el.textContent = new Date().getFullYear());
/* Anchor-jump fix: the browser's native jump to #hash gets lost on this host
   (redirect strips .html) and lazy-loaded images shift the layout after load.
   Re-scroll to the hash target once now, and again after everything has loaded. */
(function(){
  function goHash(){
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({behavior:'instant', block:'start'});
  }
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', goHash); } else { goHash(); }
  window.addEventListener('load', function(){ goHash(); setTimeout(goHash, 350); });
})();
