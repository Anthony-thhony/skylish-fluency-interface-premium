let state = {
  screen: 'landing',
  user: null,
  userId: null,
  userProfile: null,
  firebaseUser: null,
  users: {},
  videos: {},
  progress: {},
  selectedLevelIdx: 0,
  selectedLessonId: null,
  error: '',
  loading: true,
  authReady: false,
  content: { lessons: {}, deletedLessons: [], posts: [], comments: {} },
  teacherTab: 'overview',
  editingLessonId: null,
  students: []
};

function normalizeUserRecord(record){ return record || {}; }
function currentUserRecord(){ return state.userProfile || {}; }
function isTeacher(){ return currentUserRecord().role === 'teacher'; }

function getLevelLessons(level){
  const deleted = new Set(state.content.deletedLessons || []);
  const defaults = level.lessons
    .filter(ls => !deleted.has(ls.id))
    .map(ls => ({ ...ls, ...(state.content.lessons[ls.id] || {}), isDefault: true }));
  const customs = Object.values(state.content.lessons || {})
    .filter(ls => ls.level === level.code && !ls.isOverride && !deleted.has(ls.id))
    .sort((a,b)=>(a.order||999)-(b.order||999));
  return [...defaults, ...customs];
}
function totalLessons(){ return LEVELS.reduce((s,l)=>s+getLevelLessons(l).length,0); }
function levelDoneCount(level){ return getLevelLessons(level).filter(ls=>state.progress[ls.id]).length; }
function overallDoneCount(){ return LEVELS.reduce((s,l)=>s+levelDoneCount(l),0); }
function allLessons(){ return LEVELS.flatMap(level => getLevelLessons(level).map(lesson => ({...lesson, levelCode: level.code}))); }
function postTime(p){ return p.createdAtMs || p.createdAt || 0; }
function publishedPosts(){ return (state.content.posts || []).filter(p=>p.published !== false).sort((a,b)=>postTime(b)-postTime(a)); }

function youTubeEmbed(url){
  if(!url) return null;
  try{
    const u = new URL(url);
    let id = '';
    if(u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if(u.searchParams.get('v')) id = u.searchParams.get('v');
    else if(u.pathname.includes('/embed/')) id = u.pathname.split('/embed/')[1];
    if(!id) return null;
    return 'https://www.youtube.com/embed/' + id;
  }catch(e){ return null; }
}

async function waitForFirebase(){
  if(window.firebaseApi) return;
  await new Promise(resolve => window.addEventListener('firebase-ready', resolve, { once:true }));
}

async function refreshCloudContent(){
  const cloud = await window.firebaseApi.loadContent();
  state.content = { lessons:{}, deletedLessons:[], posts:[], comments:{}, ...cloud };
}

async function loadInitial(){
  await waitForFirebase();
  try{ await refreshCloudContent(); }catch(e){ console.error(e); }
  window.firebaseApi.onAuthStateChanged(async firebaseUser => {
    state.firebaseUser = firebaseUser;
    if(firebaseUser){
      try{
        state.userId = firebaseUser.uid;
        state.userProfile = await window.firebaseApi.ensureProfile(firebaseUser);
        state.user = state.userProfile.name || firebaseUser.email;
        state.progress = await window.firebaseApi.loadProgress(firebaseUser.uid);
        await refreshCloudContent();
        if(isTeacher()){
          try{ state.students = await window.firebaseApi.listStudents(); }catch(e){ state.students=[]; }
          state.screen = 'teacher';
        } else {
          state.screen = 'dashboard';
        }
      }catch(e){
        console.error(e);
        state.error = 'Não foi possível carregar sua conta.';
        state.screen = 'login';
      }
    }else{
      state.user = null;
      state.userId = null;
      state.userProfile = null;
      state.progress = {};
      if(!['landing','login','signup'].includes(state.screen)) state.screen='landing';
    }
    state.loading=false;
    state.authReady=true;
    render();
  });
}

async function loadProgress(){
  if(!state.userId) return;
  state.progress = await window.firebaseApi.loadProgress(state.userId);
}
async function saveUsers(){ return; }
async function saveProgress(lessonId){
  if(!state.userId || !lessonId) return;
  await window.firebaseApi.setProgress(state.userId, lessonId, !!state.progress[lessonId]);
}
async function saveVideos(){ return; }
async function saveContent(){ await refreshCloudContent(); }

function showToast(msg){
  const t = document.getElementById('toast'); if(!t) return;
  t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1800);
}

function el(tag, attrs, children){
  const e = document.createElement(tag);
  if(attrs) for(const k in attrs){
    if(k === 'class') e.className = attrs[k];
    else if(k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if(k === 'html') e.innerHTML = attrs[k];
    else if(k === 'disabled'){ if(attrs[k]) e.setAttribute('disabled','true'); }
    else if(attrs[k] === false || attrs[k] === null || attrs[k] === undefined){ /* skip */ }
    else e.setAttribute(k, attrs[k]);
  }
  (children||[]).forEach(c=>{ if(c!==null && c!==undefined) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}
function svg(html, viewBox){
  const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.setAttribute('viewBox', viewBox || '0 0 24 24'); s.innerHTML = html; return s;
}
const ICONS = {
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="#fff"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M20 3v15" stroke="currentColor" stroke-width="1.6"/>',
  pencil: '<path d="M4 20l1-4 11-11 3 3-11 11-4 1z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  chat: '<path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  mic: '<path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 19v2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  medal: '<circle cx="12" cy="14" r="6" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M9 3h6l-1.5 6h-3z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  globe: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.4 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.4-3.8-8.5S9.5 5.9 12 3.5z" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  check: '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
};
function iconEl(name, size, color){
  const s = svg(ICONS[name], '0 0 24 24');
  s.setAttribute('width', size||18); s.setAttribute('height', size||18);
  if(color) s.style.color = color;
  return s;
}

function logoRow(scale){
  return el('div',{class:'logo-row', onclick:()=>{ state.screen='landing'; render(); window.scrollTo(0,0); }},[
    el('img',{class:'logo-img', src:LOGO_SRC, alt:'Skylish Fluency'}),
  ]);
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
function renderLanding(){
  const app = document.getElementById('app'); app.innerHTML = '';

  // NAVBAR
  const nav = el('div',{class:'navbar'},[
    el('div',{class:'nav-inner'},[
      logoRow(),
      el('div',{class:'nav-links'},[
        el('a',{href:'#hero'},['Início']),
        el('a',{href:'#cursos'},['Cursos']),
        el('a',{href:'#metodo'},['Método Skylish']),
        el('a',{href:'#dashboard-preview'},['Recursos']),
        el('a',{href:'#depoimentos'},['Depoimentos']),
        el('a',{href:'#cta'},['Planos']),
      ]),
      el('div',{class:'nav-actions'},[
        el('button',{class:'link-btn', onclick:()=>{ state.screen='login'; state.error=''; render(); }},['Entrar']),
        el('button',{class:'btn-gold', onclick:()=>{ state.screen='signup'; state.error=''; render(); }},['Começar agora']),
      ])
    ])
  ]);
  app.appendChild(nav);

  // HERO
  const hero = el('section',{class:'hero', id:'hero'});
  const heroInner = el('div',{class:'wrap hero-grid'});
  const left = el('div',{},[
    el('div',{class:'eyebrow'},['✦ DO BÁSICO À FLUÊNCIA']),
    el('h1',{},['Domine o inglês. ', el('br'), el('span',{class:'accent'},['Expresse o mundo.'])]),
    el('p',{class:'lead'},['Aprenda inglês do básico ao avançado com um método exclusivo que combina prática, conversação e tecnologia para acelerar seus resultados.']),
    el('div',{class:'hero-ctas'},[
      el('button',{class:'btn-gold big', onclick:()=>{ state.screen='signup'; state.error=''; render(); }},['Começar agora ', iconEl('arrow',15)]),
      el('a',{class:'btn-ghost', href:'#cursos'},['Ver cursos ', iconEl('play',14)]),
    ]),
    el('div',{class:'feature-row'},[
      [ 'medal','Método exclusivo Skylish' ],
      [ 'pencil','Aulas práticas e interativas' ],
      [ 'check','Certificados reconhecidos' ],
      [ 'globe','Comunidade global' ],
    ].map(f=>el('div',{class:'feature-item'},[el('div',{class:'feature-icon'},[iconEl(f[0],17,'var(--purple-2)')]), f[1]])))
  ]);
  const destinationCard = (className, image, name, phrase) =>
    el('article',{class:`destination-card ${className}`, title:phrase},[
      el('img',{src:image, alt:name}),
      el('div',{class:'destination-content'},[
        el('span',{class:'destination-name'},[name]),
        el('span',{class:'destination-phrase'},[phrase])
      ])
    ]);

  const art = el('div',{class:'hero-art hero-travel'},[
    el('div',{class:'travel-orbit travel-orbit-one'}),
    el('div',{class:'travel-orbit travel-orbit-two'}),
    el('div',{class:'travel-plane','aria-hidden':'true'},['✈']),
    destinationCard('destination-france','assets/images/destinos/franca.jpg','🇫🇷 França','Seu inglês pode levar você até Paris.'),
    destinationCard('destination-uk','assets/images/destinos/reino-unido.jpg','🇬🇧 Reino Unido','Converse com confiança em Londres.'),
    destinationCard('destination-italy','assets/images/destinos/italia.jpg','🇮🇹 Itália','Explore culturas e viva novas histórias.'),
    destinationCard('destination-usa','assets/images/destinos/estados-unidos.jpg','🇺🇸 Estados Unidos','Imagine estudar, trabalhar e viajar em inglês.'),
    destinationCard('destination-japan','assets/images/destinos/japao.jpg','🇯🇵 Japão','Seu inglês conecta você ao mundo inteiro.'),
    el('div',{class:'travel-message travel-message-top'},['Explore o mundo']),
    el('div',{class:'travel-message travel-message-bottom'},['Seu inglês leva você mais longe ✦']),
    el('img',{class:'travel-mascot mascot-img', src:MASCOT_SRC, alt:'Aluna da Skylish Fluency explorando o mundo'})
  ]);
  heroInner.appendChild(left); heroInner.appendChild(art);
  hero.appendChild(heroInner); app.appendChild(hero);

  // COURSES / LEVELS
  const courses = el('section',{class:'section', id:'cursos'});
  const cInner = el('div',{class:'wrap'});
  cInner.appendChild(el('div',{class:'section-head'},[
    el('h2',{},['Cursos de inglês do básico ao máximo']),
    el('p',{},['Uma jornada completa para todos os níveis, guiada pelo padrão internacional CEFR.'])
  ]));
  const grid = el('div',{class:'level-grid'});
  LEVELS.forEach(lv=>{
    const card = el('div',{class:'lvl-card', style:`--accent:${lv.accent};`, onclick:()=>{ state.screen='signup'; state.error=''; render(); }},[
      el('div',{class:'lvl-code-badge'},[lv.code]),
      el('div',{class:'lvl-tag'},[lv.name]),
      el('div',{class:'lvl-name'},[lv.ptName]),
      el('div',{class:'lvl-desc'},[lv.desc])
    ]);
    grid.appendChild(card);
  });
  cInner.appendChild(grid);
  cInner.appendChild(el('div',{class:'center-btn'},[el('button',{class:'btn-ghost', onclick:()=>{ state.screen='signup'; state.error=''; render(); }},['Ver todos os cursos'])]));
  courses.appendChild(cInner); app.appendChild(courses);

  // METHOD + CHALLENGE
  const method = el('section',{class:'section alt', id:'metodo'});
  const mInner = el('div',{class:'wrap'});
  mInner.appendChild(el('div',{class:'section-head'},[
    el('h2',{},['Método Skylish: aprenda de verdade!']),
    el('p',{},['Nossa metodologia exclusiva combina prática, conversação e imersão para acelerar seu aprendizado.'])
  ]));
  const mGrid = el('div',{class:'method-grid'});
  const stepsBox = el('div',{class:'method-steps'});
  const stepsData = [
    ['book','Aprenda','Conteúdos objetivos com explicações claras.'],
    ['pencil','Pratique','Exercícios interativos e desafios diários.'],
    ['chat','Fale','Conversação real e situações do dia a dia.'],
  ];
  stepsData.forEach((s,i)=>{
    stepsBox.appendChild(el('div',{class:'step'},[
      el('div',{class:'step-icon'},[iconEl(s[0],24), el('div',{class:'step-num'},[String(i+1)])]),
      el('h3',{},[s[1]]),
      el('p',{},[s[2]])
    ]));
    if(i<stepsData.length-1) stepsBox.appendChild(el('div',{class:'step-arrow'},[iconEl('arrow',18)]));
  });
  mGrid.appendChild(stepsBox);
  const challenge = el('div',{class:'challenge-card'},[
    el('div',{class:'challenge-tag'},['Desafio diário']),
    el('div',{class:'challenge-mic'},[iconEl('mic',22,'#241705')]),
    el('h3',{},['Falar por 5 minutos sobre seu dia']),
    el('p',{},['Complete o desafio de hoje e mantenha sua sequência!']),
    el('div',{class:'xp-row'},['XP ', el('b',{},['+20'])]),
    el('button',{class:'btn-gold', onclick:()=>{ state.screen='signup'; state.error=''; render(); }},['Iniciar desafio'])
  ]);
  mGrid.appendChild(challenge);
  mInner.appendChild(mGrid);
  method.appendChild(mInner); app.appendChild(method);

  // DASHBOARD PREVIEW
  const dash = el('section',{class:'section', id:'dashboard-preview'});
  const dInner = el('div',{class:'wrap'});
  dInner.appendChild(el('div',{class:'section-head'},[
    el('h2',{},['Uma plataforma completa para você evoluir']),
    el('p',{},['Acompanhe seu progresso, conquiste certificados e alcance a fluência.'])
  ]));
  dInner.appendChild(buildDashboardPreview());
  dash.appendChild(dInner); app.appendChild(dash);

  // TESTIMONIALS
  const test = el('section',{class:'section alt', id:'depoimentos'});
  const tInner = el('div',{class:'wrap'});
  tInner.appendChild(el('div',{class:'section-head'},[
    el('h2',{},['O que nossos alunos dizem']),
    el('p',{},['Histórias reais de quem transformou o inglês e a vida.'])
  ]));
  const tGrid = el('div',{class:'test-grid'});
  TESTIMONIALS.forEach(t=>{
    tGrid.appendChild(el('div',{class:'test-card'},[
      el('div',{class:'test-top'},[
        el('div',{class:'test-avatar', style:`background:${t.color};`},[t.name.charAt(0)]),
        el('div',{},[el('div',{class:'test-name'},[t.name]), el('div',{class:'test-level'},[t.level])])
      ]),
      el('p',{class:'test-quote'},['"' + t.quote + '"']),
      el('div',{class:'stars'},['★★★★★'])
    ]));
  });
  tInner.appendChild(tGrid);
  test.appendChild(tInner); app.appendChild(test);

  // CTA BANNER
  const ctaSec = el('section',{class:'section', id:'cta', style:'padding-top:36px;'});
  const bannerWrap = el('div',{class:'cta-banner-wrap'});
  const banner = el('div',{class:'cta-banner'},[
    el('div',{},[
      el('h2',{},['Pronto para transformar seu inglês?']),
      el('p',{},['Junte-se a milhares de alunos e comece hoje mesmo.'])
    ]),
    el('div',{class:'cta-form'},[
      el('input',{type:'email', placeholder:'Seu melhor e-mail'}),
      el('button',{class:'btn-gold', onclick:()=>{ state.screen='signup'; state.error=''; render(); }},['Quero ser fluente!'])
    ])
  ]);
  bannerWrap.appendChild(banner);
  bannerWrap.appendChild(el('img',{class:'cta-mascot', src:MASCOT_SRC, alt:''}));
  ctaSec.appendChild(el('div',{class:'wrap'},[bannerWrap]));
  app.appendChild(ctaSec);

  // FOOTER
  const footer = el('footer',{class:'footer'});
  const fInner = el('div',{class:'wrap'});
  const fGrid = el('div',{class:'footer-grid'});
  fGrid.appendChild(el('div',{class:'footer-brand'},[
    logoRow(),
    el('p',{},['Do básico à fluência. Expresse o mundo.']),
    el('div',{class:'social-row'},[
      el('div',{class:'social-icon'},['ig']), el('div',{class:'social-icon'},['yt']), el('div',{class:'social-icon'},['tt']), el('div',{class:'social-icon'},['fb'])
    ])
  ]));
  fGrid.appendChild(el('div',{class:'footer-col'},[el('h4',{},['Navegação']), el('a',{href:'#hero'},['Início']), el('a',{href:'#cursos'},['Cursos']), el('a',{href:'#metodo'},['Método Skylish']), el('a',{href:'#dashboard-preview'},['Recursos']), el('a',{href:'#depoimentos'},['Blog'])]));
  fGrid.appendChild(el('div',{class:'footer-col'},[el('h4',{},['Ajuda']), el('a',{href:'#'},['Central de ajuda']), el('a',{href:'#'},['Perguntas frequentes']), el('a',{href:'#'},['Política de privacidade']), el('a',{href:'#'},['Termos de uso'])]));
  fGrid.appendChild(el('div',{class:'footer-col'},[el('h4',{},['Conecte-se']), el('a',{href:'#'},['Instagram']), el('a',{href:'#'},['YouTube']), el('a',{href:'#'},['TikTok']), el('a',{href:'#'},['Facebook'])]));
  fInner.appendChild(fGrid);
  fInner.appendChild(el('div',{class:'footer-bottom'},['© 2026 Skylish Fluency. Todos os direitos reservados.']));
  footer.appendChild(fInner); app.appendChild(footer);
}

function buildDashboardPreview(){
  const shell = el('div',{class:'preview-shell'});
  const side = el('div',{class:'preview-side'},[
    logoRow(),
    ...['Início','Meus cursos','Aulas','Desafios','Flashcards','Progresso'].map((t,i)=>el('div',{class:'p-nav-item' + (i===0?' active':'')},[t]))
  ]);
  const main = el('div',{class:'preview-main'});
  main.appendChild(el('div',{class:'preview-hello'},['Bem-vinda de volta, Ana! 👋']));
  main.appendChild(el('div',{class:'preview-sub'},['Continue sua jornada e alcance a fluência.']));
  const stats = el('div',{class:'stat-row'},[
    el('div',{class:'stat-card'},[el('div',{class:'stat-label'},['Nível atual']), el('div',{class:'stat-value'},['B1']), el('div',{class:'stat-sub'},['Intermediate'])]),
    el('div',{class:'stat-card'},[el('div',{class:'stat-label'},['Aulas concluídas']), el('div',{class:'stat-value'},['48']), el('div',{class:'stat-sub'},['de 120'])]),
    el('div',{class:'stat-card'},[el('div',{class:'stat-label'},['Sequência atual']), el('div',{class:'stat-value'},['12']), el('div',{class:'stat-sub'},['dias 🔥'])]),
  ]);
  main.appendChild(stats);
  main.appendChild(el('div',{class:'continue-card'},[
    el('div',{class:'continue-label'},['Continue de onde parou']),
    el('div',{class:'continue-row'},[
      el('div',{class:'continue-thumb'}),
      el('div',{class:'continue-info'},[
        el('div',{class:'continue-title'},['Lesson 24 — Past Experiences']),
        el('div',{class:'continue-meta'},['B1 · Intermediate']),
        el('div',{class:'bar-track'},[el('div',{class:'bar-fill', style:'width:75%;'})])
      ])
    ])
  ]));
  shell.appendChild(side); shell.appendChild(main);
  return shell;
}

/* ============================================================
   AUTH SCREENS
   ============================================================ */
function renderAuth(){
  const app = document.getElementById('app'); app.innerHTML = '';
  const wrap = el('div',{class:'app-wrap'});

  const left = el('div',{class:'auth-left'});
  left.appendChild(logoRow());
  const hero = el('div',{class:'auth-hero'},[
    el('h1',{},['Sua jornada até a fluência, um nível por vez.']),
    el('p',{},['Aulas organizadas pelo Quadro Europeu Comum de Referência (CEFR), de A1 a C2 — do primeiro "hello" à fluência profissional.'])
  ]);
  const ladder = el('div',{class:'ladder'});
  LEVELS.forEach((lv,i)=>{
    ladder.appendChild(el('div',{class:'rung'},[
      el('div',{class:'rung-badge', style:`color:${i<=3?'var(--purple-2)':'var(--text-faint)'};`},[lv.code]),
      el('div',{class:'rung-label'},[el('b',{},[lv.ptName])])
    ]));
  });
  hero.appendChild(ladder);
  left.appendChild(hero);
  left.appendChild(el('div',{class:'auth-foot'},['© 2026 Skylish Fluency — plataforma de aulas de inglês']));

  const right = el('div',{class:'auth-right'});
  const card = el('div',{class:'auth-card'});
  card.appendChild(el('button',{class:'back-home', onclick:()=>{ state.screen='landing'; render(); }},['← Voltar ao site']));

  if(state.screen === 'login'){
    card.appendChild(el('h2',{},['Bem-vindo de volta']));
    card.appendChild(el('p',{class:'auth-sub'},['Entre para continuar suas aulas.']));
    if(state.error) card.appendChild(el('div',{class:'auth-error'},[state.error]));
    const ui = el('input',{type:'email', placeholder:'seuemail@gmail.com', id:'login-user'});
    card.appendChild(el('div',{class:'field'},[el('label',{},['E-mail']), ui]));
    card.appendChild(el('div',{class:'field'},[el('label',{},['Senha']), el('input',{type:'password', placeholder:'••••••••', id:'login-pass'})]));
    card.appendChild(el('button',{class:'btn-primary', onclick: doLogin},['Entrar']));
    card.appendChild(el('button',{class:'forgot-btn', onclick: doResetPassword},['Esqueci minha senha']));
    card.appendChild(el('div',{class:'auth-switch'},['Ainda não tem conta? ', el('a',{onclick:()=>{ state.screen='signup'; state.error=''; render(); }},['Criar conta'])]));
    card.appendChild(el('div',{class:'auth-hint'},['Login protegido pelo Firebase Authentication.']));
  } else {
    card.appendChild(el('h2',{},['Criar sua conta']));
    card.appendChild(el('p',{class:'auth-sub'},['Comece sua trilha de inglês agora.']));
    if(state.error) card.appendChild(el('div',{class:'auth-error'},[state.error]));
    card.appendChild(el('div',{class:'field'},[el('label',{},['Nome completo']), el('input',{type:'text', placeholder:'Seu nome', id:'signup-name'})]));
    card.appendChild(el('div',{class:'field'},[el('label',{},['E-mail']), el('input',{type:'email', placeholder:'seuemail@gmail.com', id:'signup-user'})]));
    card.appendChild(el('div',{class:'field'},[el('label',{},['Senha']), el('input',{type:'password', placeholder:'mínimo de 6 caracteres', id:'signup-pass'})]));
    card.appendChild(el('button',{class:'btn-primary', onclick: doSignup},['Criar conta e começar']));
    card.appendChild(el('div',{class:'auth-switch'},['Já tem conta? ', el('a',{onclick:()=>{ state.screen='login'; state.error=''; render(); }},['Entrar'])]));
  }
  right.appendChild(card);
  wrap.appendChild(left); wrap.appendChild(right);
  app.appendChild(wrap);
}

async function doLogin(){
  const email = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  if(!email || !pass){ state.error='Preencha e-mail e senha.'; renderAuth(); return; }
  state.error='';
  try{
    await window.firebaseApi.login(email, pass);
  }catch(e){
    state.error=window.firebaseApi.friendlyError(e);
    renderAuth();
  }
}
async function doSignup(){
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-user').value.trim();
  const pass = document.getElementById('signup-pass').value;
  if(!name || !email || !pass){ state.error='Preencha nome, e-mail e senha.'; renderAuth(); return; }
  try{
    await window.firebaseApi.signup(name, email, pass);
  }catch(e){
    state.error=window.firebaseApi.friendlyError(e);
    renderAuth();
  }
}
async function doResetPassword(){
  const email = document.getElementById('login-user').value.trim();
  if(!email){ state.error='Digite seu e-mail para recuperar a senha.'; renderAuth(); return; }
  try{
    await window.firebaseApi.resetPassword(email);
    state.error='';
    renderAuth();
    setTimeout(()=>alert('Enviamos um e-mail para redefinir sua senha.'),50);
  }catch(e){
    state.error=window.firebaseApi.friendlyError(e);
    renderAuth();
  }
}
async function logout(){
  try{ await window.firebaseApi.logout(); }
  catch(e){ console.error(e); }
  state.screen='landing';
  render();
}

/* ============================================================
   DASHBOARD / LESSON APP
   ============================================================ */
function renderApp(){
  const app = document.getElementById('app'); app.innerHTML = '';
  const shell = el('div',{class:'shell'});
  shell.appendChild(renderSidebar());
  shell.appendChild(state.screen === 'lesson' ? renderLessonMain() : renderDashboardMain());
  app.appendChild(shell);
  app.appendChild(el('div',{class:'toast', id:'toast'}));
}
function renderSidebar(){
  const side = el('div',{class:'sidebar'});
  side.appendChild(logoRow());
  side.appendChild(el('div',{class:'side-section-label'},['Níveis (CEFR)']));
  const list = el('div',{class:'level-list'});
  LEVELS.forEach((lv,i)=>{
    const done = levelDoneCount(lv), total = getLevelLessons(lv).length;
    const isDone = done===total, isPartial = done>0 && !isDone;
    const badge = el('div',{class:'level-badge'+(isDone?' done':'')+(isPartial?' partial':'')},[isDone?'✓':lv.code]);
    const info = el('div',{class:'level-info'},[el('div',{class:'level-name'},[lv.ptName]), el('div',{class:'level-progress-txt'},[done+'/'+total+' aulas concluídas'])]);
    list.appendChild(el('div',{class:'level-item'+(state.selectedLevelIdx===i && state.screen!=='lesson'?' active':''), onclick:()=>{ state.selectedLevelIdx=i; state.screen='dashboard'; render(); }},[badge, info]));
  });
  side.appendChild(list);
  const bottom = el('div',{class:'sidebar-bottom'});
  bottom.appendChild(el('div',{class:'user-row'},[
    el('div',{class:'avatar'},[(state.user||'?').charAt(0).toUpperCase()]),
    el('div',{},[el('div',{class:'user-name'},[state.user]), el('div',{class:'user-overall'},[overallDoneCount()+'/'+totalLessons()+' aulas no total'])])
  ]));
  if(isTeacher()){
    bottom.appendChild(el('button',{class:'teacher-access-btn', onclick:()=>{ state.screen='teacher'; state.teacherTab='overview'; render(); }},['✦ Painel do Professor']));
  }
  bottom.appendChild(el('button',{class:'logout-btn', onclick: logout},['Sair']));
  side.appendChild(bottom);
  return side;
}
function renderDashboardMain(){
  const lv = LEVELS[state.selectedLevelIdx];
  const main = el('div',{class:'main'});
  main.appendChild(el('div',{class:'topbar'},[el('h2',{class:'level-title'},[lv.ptName]), el('div',{class:'level-code-pill'},[lv.code])]));
  main.appendChild(el('p',{class:'level-desc'},[lv.desc]));
  const posts = publishedPosts();
  if(posts.length){
    const mural = el('section',{class:'student-mural'},[
      el('div',{class:'student-mural-head'},[
        el('div',{},[el('span',{class:'teacher-kicker'},['MURAL DO PROFESSOR']), el('h3',{},['Avisos e novidades'])]),
        el('span',{class:'mural-count'},[String(posts.length)])
      ]),
      el('div',{class:'student-post-grid'},posts.slice(0,3).map(post=>el('article',{class:'student-post-card'},[
        el('div',{class:'post-icon'},['📢']),
        el('div',{},[
          el('h4',{},[post.title]),
          el('p',{},[post.message]),
          el('small',{},[new Date(postTime(post)).toLocaleDateString('pt-BR')])
        ])
      ])))
    ]);
    main.appendChild(mural);
  }
  const list = el('div',{class:'lesson-list'});
  getLevelLessons(lv).forEach((ls,i)=>{
    const done = !!state.progress[ls.id];
    list.appendChild(el('div',{class:'lesson-card', onclick:()=>{ state.selectedLessonId=ls.id; state.screen='lesson'; render(); }},[
      el('div',{class:'lesson-num mono'},[String(i+1).padStart(2,'0')]),
      el('div',{class:'lesson-check'+(done?' done':'')}, done?[iconEl('check',12,'#fff')]:[]),
      el('div',{class:'lesson-main'},[
        el('div',{class:'lesson-title'},[ls.title]),
        el('div',{class:'lesson-desc'},[ls.desc]),
        state.content.comments[ls.id] ? el('div',{class:'teacher-comment-mini'},['💬 ', state.content.comments[ls.id]]) : null
      ]),
      el('div',{class:'lesson-duration'},[ls.duration])
    ]));
  });
  main.appendChild(list);
  return main;
}
function findLessonContext(lessonId){
  for(let li=0; li<LEVELS.length; li++){
    const lessons = getLevelLessons(LEVELS[li]);
    const idx = lessons.findIndex(l=>l.id===lessonId);
    if(idx!==-1) return { levelIdx: li, lessonIdx: idx, level: LEVELS[li], lesson: lessons[idx] };
  }
  return null;
}
function renderLessonMain(){
  const ctx = findLessonContext(state.selectedLessonId);
  const main = el('div',{class:'main'});
  main.appendChild(el('button',{class:'back-link', onclick:()=>{ state.selectedLevelIdx=ctx.levelIdx; state.screen='dashboard'; render(); }},['← Voltar para '+ctx.level.ptName]));
  const videoUrl = ctx.lesson.videoUrl || state.videos[ctx.lesson.id];
  const embed = youTubeEmbed(videoUrl);
  const videoBox = el('div',{class:'video-box'});
  if(embed){ videoBox.appendChild(el('iframe',{src:embed, allowfullscreen:'true', title:ctx.lesson.title})); }
  else{
    const ph = el('div',{class:'video-placeholder'});
    ph.appendChild(el('div',{class:'play-circle'},[iconEl('play',20)]));
    ph.appendChild(el('div',{style:'font-size:13px;'},['Vídeo ainda não adicionado']));
    videoBox.appendChild(ph);
  }
  main.appendChild(videoBox);
  const editRow = el('div',{class:'video-edit'});
  const editInput = el('input',{type:'text', placeholder:'Colar link do YouTube para esta aula…', id:'video-url-input'});
  editInput.value = videoUrl || '';
  editRow.appendChild(editInput);
  editRow.appendChild(el('button',{onclick: async ()=>{
    const val = document.getElementById('video-url-input').value.trim();
    state.videos[ctx.lesson.id] = val;
    try{ await saveVideos(); showToast('Link do vídeo salvo'); }catch(e){ showToast('Erro ao salvar o link'); }
    render();
  }},['Salvar link']));
  if(isTeacher()) main.appendChild(editRow);
  const done = !!state.progress[ctx.lesson.id];
  main.appendChild(el('div',{class:'lesson-header'},[
    el('div',{},[
      el('h1',{class:'lesson-h-title'},[ctx.lesson.title]),
      el('div',{class:'lesson-h-meta'},[ctx.level.code+' · Aula '+String(ctx.lessonIdx+1).padStart(2,'0')+' · '+ctx.lesson.duration])
    ]),
    el('button',{class:'mark-btn'+(done?' done':''), onclick: async ()=>{
      state.progress[ctx.lesson.id] = !done;
      try{ await saveProgress(ctx.lesson.id); }catch(e){ showToast('Erro ao salvar progresso'); }
      render();
      showToast(state.progress[ctx.lesson.id] ? 'Aula marcada como concluída' : 'Aula desmarcada');
    }},[done?'✓ Concluída':'Marcar como concluída'])
  ]));
  main.appendChild(el('p',{class:'lesson-body-desc'},[ctx.lesson.content || (ctx.lesson.desc+' Assista ao vídeo acima, pratique com atenção e marque a aula como concluída ao finalizar.')]));
  if(state.content.comments[ctx.lesson.id]){
    main.appendChild(el('aside',{class:'teacher-note'},[
      el('div',{class:'teacher-note-icon'},['💬']),
      el('div',{},[el('b',{},['Comentário do professor']), el('p',{},[state.content.comments[ctx.lesson.id]])])
    ]));
  }
  const flat = allLessons();
  const fi = flat.findIndex(l=>l.id===ctx.lesson.id);
  const prev = flat[fi-1], next = flat[fi+1];
  main.appendChild(el('div',{class:'lesson-nav'},[
    el('button',{class:'nav-btn', disabled: !prev, onclick:()=>{ if(prev){ state.selectedLessonId=prev.id; render(); } }},['← Aula anterior']),
    el('button',{class:'nav-btn', disabled: !next, onclick:()=>{ if(next){ state.selectedLessonId=next.id; render(); } }},['Próxima aula →'])
  ]));
  return main;
}


/* ============================================================
   PAINEL DO PROFESSOR — DEMONSTRAÇÃO LOCAL
   ============================================================ */
function teacherMenuItem(tab, icon, label){
  return el('button',{
    class:'teacher-menu-item'+(state.teacherTab===tab?' active':''),
    onclick:()=>{ state.teacherTab=tab; state.editingLessonId=null; render(); }
  },[el('span',{class:'teacher-menu-icon'},[icon]), label]);
}

function renderTeacher(){
  if(!isTeacher()){ state.screen='dashboard'; render(); return; }
  const app = document.getElementById('app'); app.innerHTML='';
  const shell = el('div',{class:'teacher-shell'});
  const sidebar = el('aside',{class:'teacher-sidebar'},[
    logoRow(),
    el('div',{class:'teacher-profile'},[
      el('div',{class:'teacher-avatar'},['P']),
      el('div',{},[el('b',{},['Professor Skylish']),el('span',{},['Administrador'])])
    ]),
    el('nav',{class:'teacher-menu'},[
      teacherMenuItem('overview','⌂','Visão geral'),
      teacherMenuItem('lessons','▤','Aulas'),
      teacherMenuItem('new-lesson','＋','Criar aula'),
      teacherMenuItem('posts','◉','Avisos e posts'),
      teacherMenuItem('comments','💬','Comentários'),
      teacherMenuItem('students','♙','Alunos')
    ]),
    el('div',{class:'teacher-sidebar-bottom'},[
      el('button',{class:'teacher-student-view',onclick:()=>{state.screen='dashboard';state.selectedLevelIdx=0;render();}},['Ver painel do aluno']),
      el('button',{class:'logout-btn',onclick:logout},['Sair'])
    ])
  ]);
  const main = el('main',{class:'teacher-main'});
  const content = el('div',{class:'teacher-content'});
  const top = el('header',{class:'teacher-topbar'},[
    el('div',{},[
      el('span',{class:'teacher-kicker'},['ÁREA RESTRITA']),
      el('h1',{},[teacherTabTitle()])
    ]),
    el('button',{class:'btn-gold',onclick:()=>{state.teacherTab='new-lesson';state.editingLessonId=null;render();}},['＋ Nova aula'])
  ]);
  content.appendChild(top);
  if(state.teacherTab==='overview') content.appendChild(renderTeacherOverview());
  else if(state.teacherTab==='lessons') content.appendChild(renderTeacherLessons());
  else if(state.teacherTab==='new-lesson') content.appendChild(renderTeacherLessonForm());
  else if(state.teacherTab==='posts') content.appendChild(renderTeacherPosts());
  else if(state.teacherTab==='comments') content.appendChild(renderTeacherComments());
  else content.appendChild(renderTeacherStudents());
  main.appendChild(content);
  shell.appendChild(sidebar); shell.appendChild(main);
  app.appendChild(shell);
  app.appendChild(el('div',{class:'toast',id:'toast'}));
}

function teacherTabTitle(){
  return ({
    overview:'Painel do professor',
    lessons:'Gerenciar aulas',
    'new-lesson':state.editingLessonId?'Editar aula':'Criar nova aula',
    posts:'Avisos para os alunos',
    comments:'Comentários nas aulas',
    students:'Alunos cadastrados'
  })[state.teacherTab] || 'Painel do professor';
}

function metricCard(icon,label,value,detail){
  return el('article',{class:'teacher-metric'},[
    el('div',{class:'teacher-metric-icon'},[icon]),
    el('div',{},[el('span',{},[label]),el('strong',{},[String(value)]),el('small',{},[detail])])
  ]);
}

function renderTeacherOverview(){
  const students = (state.students||[]).length;
  const customLessons = Object.values(state.content.lessons||{}).filter(l=>!l.isOverride).length;
  const wrap = el('div',{class:'teacher-dashboard'});
  wrap.appendChild(el('div',{class:'teacher-metrics'},[
    metricCard('📚','Aulas disponíveis',totalLessons(),'em todos os níveis'),
    metricCard('👥','Alunos cadastrados',students,'sincronizados na nuvem'),
    metricCard('📢','Avisos publicados',publishedPosts().length,'visíveis aos alunos'),
    metricCard('✨','Aulas criadas',customLessons,'pelo painel do professor')
  ]));
  wrap.appendChild(el('div',{class:'teacher-two-columns'},[
    el('section',{class:'teacher-panel-card'},[
      el('div',{class:'panel-card-head'},[el('h3',{},['Ações rápidas']),el('span',{},['Gerencie a plataforma'])]),
      el('div',{class:'quick-actions'},[
        el('button',{onclick:()=>{state.teacherTab='new-lesson';render();}},['＋ Criar nova aula',el('small',{},['Adicione vídeo, texto e duração'])]),
        el('button',{onclick:()=>{state.teacherTab='posts';render();}},['📢 Publicar aviso',el('small',{},['Envie uma novidade para os alunos'])]),
        el('button',{onclick:()=>{state.teacherTab='comments';render();}},['💬 Escrever comentário',el('small',{},['Oriente os alunos em uma aula'])])
      ])
    ]),
    el('section',{class:'teacher-panel-card'},[
      el('div',{class:'panel-card-head'},[el('h3',{},['Últimos avisos']),el('span',{},['Mural dos alunos'])]),
      ...(publishedPosts().slice(0,4).length?publishedPosts().slice(0,4).map(p=>el('div',{class:'overview-post'},[
        el('b',{},[p.title]),el('p',{},[p.message]),el('small',{},[new Date(postTime(p)).toLocaleDateString('pt-BR')])
      ])):[el('div',{class:'teacher-empty'},['Nenhum aviso publicado ainda.'])])
    ])
  ]));
  return wrap;
}

function renderTeacherLessons(){
  const section=el('section',{class:'teacher-panel-card full'});
  const head=el('div',{class:'panel-card-head'},[
    el('div',{},[el('h3',{},['Todas as aulas']),el('span',{},['Edite conteúdos ou adicione novas aulas'])]),
    el('span',{class:'teacher-count'},[totalLessons()+' aulas'])
  ]);
  section.appendChild(head);
  LEVELS.forEach(level=>{
    const group=el('div',{class:'teacher-level-group'},[
      el('div',{class:'teacher-level-head'},[
        el('span',{class:'teacher-level-code'},[level.code]),
        el('div',{},[el('b',{},[level.ptName]),el('small',{},[getLevelLessons(level).length+' aulas'])])
      ])
    ]);
    getLevelLessons(level).forEach((lesson,index)=>{
      group.appendChild(el('div',{class:'teacher-lesson-row'},[
        el('span',{class:'teacher-row-number'},[String(index+1).padStart(2,'0')]),
        el('div',{class:'teacher-row-copy'},[
          el('b',{},[lesson.title]),
          el('span',{},[lesson.desc]),
          lesson.videoUrl?el('small',{class:'video-status ok'},['● Vídeo adicionado']):el('small',{class:'video-status'},['○ Sem vídeo'])
        ]),
        el('span',{class:'teacher-duration'},[lesson.duration]),
        el('div',{class:'teacher-row-actions'},[
          el('button',{title:'Editar',onclick:()=>{state.editingLessonId=lesson.id;state.teacherTab='new-lesson';render();}},['Editar']),
          el('button',{class:'danger',title:'Excluir',onclick:()=>deleteTeacherLesson(lesson.id)},['Excluir'])
        ])
      ]));
    });
    section.appendChild(group);
  });
  return section;
}

function lessonBeingEdited(){
  if(!state.editingLessonId) return null;
  return allLessons().find(l=>l.id===state.editingLessonId) || null;
}

function renderTeacherLessonForm(){
  const lesson=lessonBeingEdited();
  const section=el('section',{class:'teacher-panel-card full teacher-form-card'});
  section.appendChild(el('div',{class:'form-intro'},[
    el('div',{class:'form-intro-icon'},['📚']),
    el('div',{},[el('h3',{},[lesson?'Atualize esta aula':'Cadastre uma aula nova']),el('p',{},['O conteúdo salvo aparecerá automaticamente no painel dos alunos.'])])
  ]));
  const form=el('div',{class:'teacher-form-grid'});
  const levelSelect=el('select',{id:'teacher-lesson-level'});
  LEVELS.forEach(l=>{const o=el('option',{value:l.code},[l.code+' — '+l.ptName]);if((lesson?.levelCode||lesson?.level)===l.code)o.selected=true;levelSelect.appendChild(o);});
  form.appendChild(fieldWrap('Nível da aula',levelSelect));
  form.appendChild(fieldWrap('Duração',inputValue('teacher-lesson-duration',lesson?.duration||'10 min','Ex.: 10 min')));
  form.appendChild(fieldWrap('Título da aula',inputValue('teacher-lesson-title',lesson?.title||'','Ex.: Inglês no aeroporto'),'wide'));
  form.appendChild(fieldWrap('Descrição curta',inputValue('teacher-lesson-desc',lesson?.desc||'','Resumo mostrado na lista de aulas'),'wide'));
  form.appendChild(fieldWrap('Link do vídeo no YouTube',inputValue('teacher-lesson-video',lesson?.videoUrl||state.videos[lesson?.id]||'','https://youtube.com/...'),'wide'));
  const text=el('textarea',{id:'teacher-lesson-content',placeholder:'Escreva explicações, orientações, vocabulário e atividades...'});
  text.value=lesson?.content||'';
  form.appendChild(fieldWrap('Conteúdo e orientações da aula',text,'wide'));
  section.appendChild(form);
  section.appendChild(el('div',{class:'teacher-form-actions'},[
    el('button',{class:'btn-ghost',onclick:()=>{state.teacherTab='lessons';state.editingLessonId=null;render();}},['Cancelar']),
    el('button',{class:'btn-gold',onclick:saveTeacherLesson},[lesson?'Salvar alterações':'Publicar aula'])
  ]));
  return section;
}

function fieldWrap(label,control,extra=''){
  return el('label',{class:'teacher-field '+extra},[el('span',{},[label]),control]);
}
function inputValue(id,value,placeholder){
  const input=el('input',{id,type:'text',placeholder});input.value=value;return input;
}

async function saveTeacherLesson(){
  const level=document.getElementById('teacher-lesson-level').value;
  const title=document.getElementById('teacher-lesson-title').value.trim();
  const desc=document.getElementById('teacher-lesson-desc').value.trim();
  const duration=document.getElementById('teacher-lesson-duration').value.trim()||'10 min';
  const videoUrl=document.getElementById('teacher-lesson-video').value.trim();
  const content=document.getElementById('teacher-lesson-content').value.trim();
  if(!title||!desc){showToast('Preencha título e descrição');return;}
  const existing=lessonBeingEdited();
  const lesson={
    id: existing?.id || `custom-${Date.now()}`,
    title,desc,duration,videoUrl,content,
    level,levelCode:level,
    isOverride:!!existing?.isDefault,
    order:existing?.order||Date.now(),
    createdAtMs:existing?.createdAtMs||Date.now()
  };
  try{
    await window.firebaseApi.saveLesson(lesson);
    await refreshCloudContent();
    state.editingLessonId=null;state.teacherTab='lessons';render();
    setTimeout(()=>showToast(existing?'Aula atualizada':'Aula publicada'),50);
  }catch(e){ console.error(e); showToast('Erro ao salvar aula'); }
}

async function deleteTeacherLesson(id){
  if(!confirm('Excluir esta aula do painel dos alunos?'))return;
  const lesson=allLessons().find(l=>l.id===id);
  try{
    await window.firebaseApi.removeLesson(id, !!lesson?.isDefault);
    await refreshCloudContent();
    render();
    setTimeout(()=>showToast('Aula excluída'),50);
  }catch(e){ console.error(e); showToast('Erro ao excluir aula'); }
}

function renderTeacherPosts(){
  const wrap=el('div',{class:'teacher-two-columns posts-layout'});
  const create=el('section',{class:'teacher-panel-card'},[
    el('div',{class:'panel-card-head'},[el('div',{},[el('h3',{},['Novo aviso']),el('span',{},['Aparecerá no painel de todos os alunos'])])]),
    fieldWrap('Título',inputValue('teacher-post-title','','Ex.: Nova aula disponível'),'wide')
  ]);
  const ta=el('textarea',{id:'teacher-post-message',placeholder:'Escreva sua mensagem para os alunos...'});
  create.appendChild(fieldWrap('Mensagem',ta,'wide'));
  create.appendChild(el('button',{class:'btn-gold teacher-publish-btn',onclick:saveTeacherPost},['Publicar aviso']));
  const list=el('section',{class:'teacher-panel-card'},[
    el('div',{class:'panel-card-head'},[el('div',{},[el('h3',{},['Avisos publicados']),el('span',{},['Edite o mural dos alunos'])])])
  ]);
  const posts=publishedPosts();
  if(!posts.length) list.appendChild(el('div',{class:'teacher-empty'},['Nenhum aviso publicado.']));
  posts.forEach(post=>list.appendChild(el('article',{class:'teacher-post-admin'},[
    el('div',{class:'post-icon'},['📢']),
    el('div',{class:'teacher-post-copy'},[el('b',{},[post.title]),el('p',{},[post.message]),el('small',{},[new Date(postTime(post)).toLocaleString('pt-BR')])]),
    el('button',{class:'danger',onclick:()=>deleteTeacherPost(post.id)},['Excluir'])
  ])));
  wrap.appendChild(create);wrap.appendChild(list);return wrap;
}
async function saveTeacherPost(){
  const title=document.getElementById('teacher-post-title').value.trim();
  const message=document.getElementById('teacher-post-message').value.trim();
  if(!title||!message){showToast('Escreva título e mensagem');return;}
  try{
    await window.firebaseApi.savePost({title,message,createdAtMs:Date.now(),published:true});
    await refreshCloudContent();render();setTimeout(()=>showToast('Aviso publicado'),50);
  }catch(e){ console.error(e); showToast('Erro ao publicar aviso'); }
}
async function deleteTeacherPost(id){
  try{
    await window.firebaseApi.removePost(id);
    await refreshCloudContent();render();setTimeout(()=>showToast('Aviso excluído'),50);
  }catch(e){ console.error(e); showToast('Erro ao excluir aviso'); }
}

function renderTeacherComments(){
  const section=el('section',{class:'teacher-panel-card full'});
  section.appendChild(el('div',{class:'panel-card-head'},[el('div',{},[el('h3',{},['Comentários do professor']),el('span',{},['Escreva uma orientação diferente para cada aula'])])]));
  const grid=el('div',{class:'teacher-comments-grid'});
  LEVELS.forEach(level=>getLevelLessons(level).forEach(lesson=>{
    const ta=el('textarea',{id:'comment-'+lesson.id,placeholder:'Ex.: Preste atenção na pronúncia desta expressão.'});
    ta.value=state.content.comments[lesson.id]||'';
    grid.appendChild(el('article',{class:'teacher-comment-editor'},[
      el('div',{class:'comment-editor-head'},[el('span',{class:'teacher-level-code'},[level.code]),el('b',{},[lesson.title])]),
      ta,
      el('button',{onclick:()=>saveTeacherComment(lesson.id)},['Salvar comentário'])
    ]));
  }));
  section.appendChild(grid);return section;
}
async function saveTeacherComment(id){
  const value=document.getElementById('comment-'+id).value.trim();
  try{
    await window.firebaseApi.saveComment(id,value);
    await refreshCloudContent();
    showToast(value?'Comentário salvo':'Comentário removido');
  }catch(e){ console.error(e); showToast('Erro ao salvar comentário'); }
}

function renderTeacherStudents(){
  const section=el('section',{class:'teacher-panel-card full'});
  section.appendChild(el('div',{class:'panel-card-head'},[el('div',{},[el('h3',{},['Alunos cadastrados']),el('span',{},['Usuários cadastrados no Firebase Authentication'])])]));
  const students=state.students||[];
  if(!students.length){section.appendChild(el('div',{class:'teacher-empty'},['Nenhum aluno cadastrado ainda.']));return section;}
  const table=el('div',{class:'teacher-student-table'});
  students.forEach(student=>table.appendChild(el('div',{class:'teacher-student-row'},[
    el('div',{class:'avatar'},[(student.name||student.email||'A').charAt(0).toUpperCase()]),
    el('div',{},[el('b',{},[student.name||'Aluno']),el('span',{},[student.email||''])]),
    el('span',{class:'student-role'},['Aluno']),
    el('small',{},['Conta sincronizada pelo Firebase'])
  ])));
  section.appendChild(table);return section;
}

/* ============================================================
   ROUTER
   ============================================================ */
function render(){
  if(state.loading){
    document.getElementById('app').innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-family:Inter,sans-serif;background:var(--bg);">Carregando…</div>';
    return;
  }
  if(state.screen === 'landing'){ renderLanding(); return; }
  if(state.screen === 'login' || state.screen === 'signup'){ renderAuth(); return; }
  if(state.screen === 'teacher'){ renderTeacher(); return; }
  renderApp();
}

document.getElementById('app').innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:#7B72A3;font-family:Inter,sans-serif;background:#0C0920;">Carregando…</div>';
loadInitial();
