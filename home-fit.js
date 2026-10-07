// Keep the skin-tone chart below the opening phone view, behind the action bar.
// Measure the real header and text so font loading and device widths are respected.
(function(){
  const hero=document.querySelector('.hero'), skin=document.querySelector('.skin');
  const heading=skin.querySelector('.skin-head'), rail=document.querySelector('.action-rail');
  let frame;
  function fitOpening(){
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(function(){
      if(!matchMedia('(max-width:760px)').matches){hero.style.removeProperty('--opening-hero-height');return;}
      const headerHeight=document.querySelector('.hdr').getBoundingClientRect().height;
      const headingStyle=getComputedStyle(heading);
      const introHeight=parseFloat(getComputedStyle(skin).paddingTop)+heading.getBoundingClientRect().height+parseFloat(headingStyle.marginBottom);
      const available=document.documentElement.clientHeight-headerHeight-rail.getBoundingClientRect().height-introHeight+12;
      hero.style.setProperty('--opening-hero-height',Math.max(0,available)+'px');
    });
  }
  fitOpening();
  window.addEventListener('resize',fitOpening,{passive:true});
  if(document.fonts)document.fonts.ready.then(fitOpening);
})();
