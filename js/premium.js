
/* ============================================================
   FASE 2 — EFEITOS PREMIUM E INTERAÇÕES
   ============================================================ */
(function premiumInterface(){
  const skylineSvg = `
    <svg class="london-skyline" viewBox="0 0 1600 300" preserveAspectRatio="none"
         aria-hidden="true">
      <defs>
        <linearGradient id="skylineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#30236d" stop-opacity=".84"/>
          <stop offset="1" stop-color="#0b071d" stop-opacity=".98"/>
        </linearGradient>
        <linearGradient id="riverGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#8b5cf6" stop-opacity="0"/>
          <stop offset=".5" stop-color="#a78bfa" stop-opacity=".22"/>
          <stop offset="1" stop-color="#d6479b" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path fill="url(#skylineFill)" d="
        M0 257 L0 214 L45 214 L45 189 L80 189 L80 226 L115 226 L115 175
        L140 175 L140 226 L180 226 L180 203 L215 203 L215 158 L229 158
        L229 119 L240 119 L240 158 L255 158 L255 203 L296 203 L296 225
        L335 225 L335 181 L370 181 L370 219 L405 219 L405 198 L450 198
        L450 224 L505 224 L505 191 L530 191 L530 167 L548 167 L548 191
        L572 191 L572 225 L620 225 L620 204 L658 204 L658 224 L705 224
        L705 186 L730 186 L730 150 L741 150 L741 99 L749 72 L757 99
        L757 150 L770 150 L770 186 L797 186 L797 224 L836 224 L836 198
        L875 198 L875 224 L924 224 L924 184 L948 184 L948 141 L962 141
        L962 184 L986 184 L986 224 L1028 224 L1028 200 L1065 200
        L1065 224 L1102 224 L1102 176 L1125 176 L1125 121 L1136 121
        L1136 176 L1164 176 L1164 224 L1208 224 L1208 198 L1246 198
        L1246 224 L1285 224 L1285 181 L1318 181 L1318 224 L1360 224
        L1360 202 L1398 202 L1398 224 L1438 224 L1438 174 L1463 174
        L1463 225 L1500 225 L1500 195 L1538 195 L1538 225 L1600 225
        L1600 300 L0 300 Z"/>
      <path d="M0 259 Q390 241 760 259 T1600 257 V300 H0 Z" fill="url(#riverGlow)"/>
      <g fill="#ffd166" opacity=".34">
        <rect x="207" y="170" width="4" height="7" rx="1"/>
        <rect x="219" y="170" width="4" height="7" rx="1"/>
        <rect x="716" y="198" width="4" height="7" rx="1"/>
        <rect x="728" y="198" width="4" height="7" rx="1"/>
        <rect x="941" y="195" width="4" height="7" rx="1"/>
        <rect x="953" y="195" width="4" height="7" rx="1"/>
        <rect x="1302" y="194" width="4" height="7" rx="1"/>
      </g>
    </svg>`;

  function enhance(){
    const hero = document.querySelector('.hero');
    if(hero && !hero.querySelector('.london-scene')){
      const scene = document.createElement('div');
      scene.className = 'london-scene';
      scene.innerHTML = skylineSvg + '<div class="london-fog"></div>';
      hero.appendChild(scene);
    }

    const navActions = document.querySelector('.nav-actions');
    if(navActions && !navActions.querySelector('.premium-theme-btn')){
      const button = document.createElement('button');
      button.className = 'premium-theme-btn';
      button.type = 'button';
      button.title = 'Alternar intensidade do modo escuro';
      button.setAttribute('aria-label','Alternar intensidade do modo escuro');
      button.textContent = document.body.classList.contains('deep-night') ? '☀' : '☾';
      button.addEventListener('click',()=>{
        document.body.classList.toggle('deep-night');
        button.textContent = document.body.classList.contains('deep-night') ? '☀' : '☾';
      });
      navActions.prepend(button);
    }

    document.querySelectorAll('.section-head,.lvl-card,.method-grid,.preview-shell,.test-card,.cta-banner-wrap')
      .forEach((node,index)=>{
        if(node.dataset.premiumReady) return;
        node.dataset.premiumReady = 'true';
        node.classList.add('reveal-premium');
        node.style.transitionDelay = Math.min(index % 4,3) * 70 + 'ms';
        revealObserver.observe(node);
      });

    const mascot = document.querySelector('.hero .mascot-img');
    const art = document.querySelector('.hero-art');
    if(mascot && art && !art.dataset.interactive){
      art.dataset.interactive = 'true';
      art.addEventListener('pointermove',(event)=>{
        if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = art.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        mascot.style.transform = `translate3d(${x*15}px,${y*10-5}px,35px) rotateY(${x*7}deg)`;
      });
      art.addEventListener('pointerleave',()=>{ mascot.style.transform=''; });
      mascot.style.cursor='pointer';
      mascot.title='Clique para interagir';
      mascot.addEventListener('click',()=>{
        mascot.classList.remove('is-waving');
        void mascot.offsetWidth;
        mascot.classList.add('is-waving');
      });
    }
  }

  const revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },{threshold:.12});

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',enhance);
  enhance();
})();
