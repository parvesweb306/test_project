/* ===== Voltix home page scripts ===== */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- 1. Three.js: drifting particles + wireframe icosahedron ---------- */
(function initScene() {
  const canvas = $('#bg');
  if (!window.THREE || reduce) return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); // cap for performance
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 8;

  // Particle field
  const N = innerWidth < 700 ? 250 : 600;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 24;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x6f8bff, size: 0.04, transparent: true, opacity: 0.8 }));
  scene.add(points);

  // Wireframe shape
  const shape = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.2, 1),
    new THREE.MeshBasicMaterial({ color: 0x22e3a0, wireframe: true, transparent: true, opacity: 0.18 })
  );
  shape.position.set(3.5, 0, -2);
  scene.add(shape);
  window.__recolor = () => { const s = getComputedStyle(document.documentElement); points.material.color.set(s.getPropertyValue("--p1").trim()); shape.material.color.set(s.getPropertyValue("--p2").trim()); };
  window.__recolor();

  let mx = 0, my = 0, visible = true;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  document.addEventListener('visibilitychange', () => (visible = !document.hidden));

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize); resize();

  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    points.rotation.y += 0.0008;
    shape.rotation.x += 0.003; shape.rotation.y += 0.004;
    camera.position.x += (mx * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (-my * 1.2 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  })();
})();

/* ---------- 2. Mobile menu ---------- */
const burger = $('#burger'), menu = $('#menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
$$('#menu a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));

/* ---------- 3. Card tilt (pointer-driven 3D) ---------- */
if (!reduce && matchMedia('(hover: hover)').matches) {
  $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotationY: x * 14, rotationX: -y * 14, transformPerspective: 800, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power3.out' }));
  });
}

/* ---------- 4. GSAP: hero intro + scroll reveals + counters ---------- */
gsap.registerPlugin(ScrollTrigger);
if (!reduce) {
  // One orchestrated hero entrance
  gsap.from('.hero-copy > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' });
  gsap.from('.tilt-card', { y: 60, rotationX: 25, opacity: 0, duration: 1.1, delay: 0.3, ease: 'power3.out' });
  // Light reveal on feature cards only
  gsap.from('#features .card', { scrollTrigger: { trigger: '#features', start: 'top 75%' }, y: 40, opacity: 0, duration: 0.7, stagger: 0.1 });
}
$$('[data-count]').forEach(el => {
  const end = +el.dataset.count, o = { v: 0 };
  const fmt = n => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? Math.round(n).toLocaleString() + '+' : Math.round(n));
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => reduce ? (el.textContent = fmt(end)) : gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => (el.textContent = fmt(o.v)) })
  });
});

/* ---------- 5. Steppers, brand tiles, marquee ---------- */
const ic = n => `<svg class="i"><use href="#i-${n}"/></svg>`;
const stepData = {
  steps1: [['cart','Choose','a brand and amount'],['mail','Enter','your email and pay'],['bolt','Receive','the code in seconds'],['check','Ready','to redeem instantly']],
  steps3: [['shield','Validate','balance and user ID'],['db','Debit','your wallet database'],['wallet','Payout','by API or admin'],['mail','Record','and notify you']],
  steps2: [['card','Choose','your card type'],['edit','Fill in','your details'],['globe','Select','your region'],['bolt','Use','it right away']]
};
Object.entries(stepData).forEach(([id, arr]) => {
  $('#' + id).innerHTML = arr.map(([i, b, r]) => `<li><span class="bub">${ic(i)}</span><p><em>${b}</em> ${r}</p></li>`).join('');
});
const brands = [['Streaming','play'],['Gaming','game'],['Rides','pin'],['Shopping','bag'],['Music','music'],['Food','food'],['Travel','plane'],['Cloud','cloud'],['Wallet','wallet']];
$$('[data-tiles]').forEach(c => c.innerHTML = brands.map(([n, i], k) =>
  `<a href="#" class="tile" style="--h:${(k * 41 + 210) % 360}" title="${n}" aria-label="${n}">${ic(i)}</a>`).join(''));
const pills = brands.map(([n, i]) => `<span class="mq">${ic(i)}${n}</span>`).join('');
$('[data-marquee]').innerHTML = pills + pills + pills + pills; // repeated for seamless loop
if (!reduce) gsap.from('.gcard', { scrollTrigger: { trigger: '#rewards', start: 'top 80%' }, y: 30, opacity: 0, duration: .7, stagger: .08 });

/* ---------- 5b. Cursor spotlight + glare on cards ---------- */
$$('.card,.gcard,.calc,.tilt-card,.toast').forEach(el => el.addEventListener('pointermove', e => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px');
  el.style.setProperty('--gx', (e.clientX - r.left) / r.width * 100 + '%'); el.style.setProperty('--gy', (e.clientY - r.top) / r.height * 100 + '%');
}));

/* ---------- 5c. Hero parallax: layers move at different depths ---------- */
const stage = $('#stage');
if (stage && !reduce && matchMedia('(hover: hover)').matches) {
  addEventListener('pointermove', e => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    gsap.to('.vcard.back', { x: x * -30, y: y * -20, duration: .8 });
    gsap.to('.t1', { x: x * 40, y: y * 30, duration: .8 });
    gsap.to('.t2', { x: x * 55, y: y * 40, duration: .8 });
  });
}

/* ---------- 6. Calculator ---------- */
const amt = $('#amt');
let rate = 0.02;
const money = n => '$' + n.toFixed(2);
function calc() {
  const v = +amt.value, fee = v * rate;
  $('#amtOut').textContent = '$' + v;
  $('#fee').textContent = money(fee);
  $('#total').textContent = money(v + fee);
}
amt.addEventListener('input', calc);
$$('#speed button').forEach(b => b.addEventListener('click', () => {
  $$('#speed button').forEach(x => x.classList.toggle('active', x === b));
  rate = +b.dataset.fee; calc();
}));
calc();

/* ================= Store, exchange, admin queue (demo state) ================= */
let bal = 150;
const RATE = 120, FEE = 0.015;           // 120 BDT = $1, 1.5% fee. Replace with server values.
const snackEl = Object.assign(document.createElement('div'), { className: 'snack', role: 'status' });
document.body.appendChild(snackEl);
let snackT;
function snack(msg) { snackEl.textContent = msg; snackEl.classList.add('show'); clearTimeout(snackT); snackT = setTimeout(() => snackEl.classList.remove('show'), 2400); }
const setBal = () => { $('#bal').textContent = money(bal); gsap.fromTo('.wallet', { scale: 1.08 }, { scale: 1, duration: .4 }); };

const cat = {
  ai: [['AI Assistant Plus','Monthly plan',10,'bolt'],['AI Image Studio','Image generation',30,'edit'],['AI Research Pro','Analysis tools',15,'globe'],['AI Support Desk','Customer care',12,'shield']],
  stream: [['Streaming UHD','1 month',45,'play'],['Music Premium','1 month',12,'music'],['Video Plus','1 month',18,'play'],['Cloud Gaming','1 month',20,'game']],
  gift: [['Universal Gift Card','Any store',30,'bag'],['Crypto Card','Prepaid',100,'wallet'],['Travel Card','Flights and stays',50,'plane'],['Food Card','Delivery',25,'food']]
};
function drawCat(k) {
  $('#catalog').innerHTML = cat[k].map(([n, s, p, i], x) => `<article class="gcard pc"><div class="art" style="--h:${(x * 55 + 200) % 360}">${ic(i)}</div>
    <strong>${n}</strong><small>${s}</small><div class="pr"><b>${money(p)}</b><button class="cartbtn" data-n="${n}" data-p="${p}" aria-label="Buy ${n}">${ic('cart')}</button></div></article>`).join('');
  if (!reduce) gsap.from('.pc', { y: 24, opacity: 0, duration: .45, stagger: .06 });
}
$$('#storeTabs .tab').forEach(t => t.addEventListener('click', () => {
  $$('#storeTabs .tab').forEach(x => x.classList.toggle('active', x === t));
  drawCat(t.dataset.cat);
}));
$('#catalog').addEventListener('click', e => {
  const b = e.target.closest('.cartbtn'); if (!b) return;
  const p = +b.dataset.p;
  if (p > bal) return snack('Not enough balance for ' + b.dataset.n);
  bal -= p; setBal(); snack(b.dataset.n + ' purchased for ' + money(p));
});
drawCat('ai');

/* Exchange form */
const xs = id => $('#' + id);
function xsum() {
  const a = +xs('xamt').value || 0, f = a * FEE;
  xs('xfee').textContent = a ? f.toFixed(2) + ' BDT' : '-';
  xs('xget').textContent = a ? (a - f).toFixed(2) + ' BDT' : '-';
}
xs('xamt').addEventListener('input', xsum); xsum();
xs('xswap').addEventListener('click', () => { const v = xs('xfrom').value; xs('xfrom').value = xs('xto').value; xs('xto').value = v; });

/* Admin queue */
let nid = 21006;
const reqs = [[21001,'Admin','bKash','Nagad',500,0],[21002,'Sameera','bKash','Nagad',500,0],[21003,'Nadia','Rocket','Nagad',300,0],[21004,'Karim','bKash','Rocket',300,0],[21005,'Imran','Nagad','bKash',300,0]];
function drawQ() {
  xs('queue').innerHTML = reqs.map(r => `<tr><td>000${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4].toFixed(2)}</td>
    <td><span class="st ${r[5] ? 'done' : ''}">${r[5] ? 'Completed' : 'Pending'}</span></td>
    <td>${r[5] ? '-' : `<button class="process" data-id="${r[0]}">Process payout</button>`}</td></tr>`).join('');
  xs('vol').textContent = reqs.reduce((s, r) => s + r[4], 0).toLocaleString() + ' BDT';
  xs('pend').textContent = reqs.filter(r => !r[5]).length;
}
xs('queue').addEventListener('click', e => {
  const b = e.target.closest('.process'); if (!b) return;
  b.textContent = 'Processing...'; b.disabled = true;
  setTimeout(() => { reqs.find(r => r[0] == b.dataset.id)[5] = 1; drawQ(); snack('Payout completed'); }, 800);
});
xs('xgo').addEventListener('click', () => {
  const a = +xs('xamt').value, f = xs('xfrom').value, t = xs('xto').value;
  if (f === t) return snack('Choose two different wallets');
  if (!(a >= 100)) return snack('Minimum exchange is 100 BDT');
  if (a / RATE > bal) return snack('Not enough wallet balance');
  bal -= a / RATE; setBal();                     // 1. validate and debit
  reqs.unshift([nid++, 'You', f, t, a, 0]); drawQ(); // 2. queue for admin payout
  xs('xnote').textContent = `Request 000${nid - 1} created. You will be notified after payout.`;
  snack('Exchange request submitted');
});
drawQ(); setBal();

/* ================= Theme switcher, scroll progress, magnetic buttons ================= */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch (e) {}
  window.__recolor && window.__recolor();
  $$('.themes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
}
let savedTheme = 'gold'; try { savedTheme = localStorage.getItem('theme') || 'gold'; } catch (e) {}
$$('.themes button').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.t)));
setTheme(savedTheme);

addEventListener('scroll', () => { $('#prog').style.transform = `scaleX(${scrollY / (document.documentElement.scrollHeight - innerHeight || 1)})`; }, { passive: true });

if (!reduce && matchMedia('(hover: hover)').matches) {
  $$('.btn-primary').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .3 }); });
    b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.5)' }));
  });
}

/* ================= Rewards slider ================= */
const svg = b => `<svg viewBox="0 0 300 190" class="art-svg" aria-hidden="true">${b}</svg>`;
const rArt = {
  phone: svg('<circle cx="150" cy="95" r="70" class="f" opacity=".22"/><g transform="rotate(-6 150 95)"><rect x="105" y="12" width="90" height="166" rx="16" fill="#0b0d1c" class="s" stroke-width="2"/><rect x="113" y="26" width="74" height="138" rx="9" class="f" opacity=".18"/><text x="150" y="88" text-anchor="middle" fill="#fff" font-size="22" font-weight="700" font-family="Space Grotesk,sans-serif">+$30</text><circle cx="150" cy="124" r="14" class="gr"/><path d="m144 124 4 4 8-8" stroke="#04150e" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>'),
  cards: svg('<g transform="rotate(-12 120 100)"><rect x="40" y="50" width="150" height="94" rx="12" class="f" opacity=".45"/></g><g transform="rotate(8 170 95)"><rect x="95" y="40" width="150" height="94" rx="12" fill="#0b0d1c" class="s" stroke-width="2"/><rect x="109" y="58" width="26" height="20" rx="4" class="f"/><path d="M109 112h60M109 122h36" stroke="#fff" opacity=".4" stroke-width="3" stroke-linecap="round"/><circle cx="222" cy="64" r="8" class="gr"/></g>'),
  tap: svg('<g class="s" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M170 60a50 50 0 0 1 0 70"/><path d="M188 45a75 75 0 0 1 0 100" opacity=".6"/><path d="M206 30a100 100 0 0 1 0 130" opacity=".3"/></g><rect x="70" y="30" width="70" height="130" rx="14" fill="#0b0d1c" class="s" stroke-width="2"/><circle cx="105" cy="95" r="14" class="f"/>'),
  play: svg('<rect x="50" y="30" width="200" height="120" rx="14" fill="#0b0d1c" class="s" stroke-width="2"/><rect x="58" y="38" width="184" height="104" rx="9" class="f" opacity=".2"/><circle cx="150" cy="90" r="26" class="f"/><path d="M143 78v24l20-12z" fill="#0a0a0a"/><rect x="70" y="128" width="160" height="5" rx="3" fill="#fff" opacity=".2"/><rect x="70" y="128" width="90" height="5" rx="3" class="gr"/>'),
  game: svg('<rect x="55" y="55" width="190" height="90" rx="45" fill="#0b0d1c" class="s" stroke-width="2.5"/><path d="M100 85v30M85 100h30" class="s" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="195" cy="88" r="9" class="f"/><circle cx="215" cy="108" r="9" class="gr"/><circle cx="175" cy="108" r="9" fill="#fff" opacity=".35"/>'),
  plane: svg('<path d="M30 150Q150 -20 270 120" fill="none" class="s" stroke-width="2" stroke-dasharray="4 7"/><circle cx="30" cy="150" r="6" class="gr"/><circle cx="270" cy="120" r="6" class="f"/><g transform="translate(122 24) scale(3.4)" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"><use href="#i-plane"/></g>')
};
const rSlides = [
  ['Receive your reward in seconds', ['Ready to use straight away','No waiting, no delays','20+ supported services'], 'Choose your reward', 'phone', 10],
  ['Flexible gift cards', ['Delivered in seconds','Spend anywhere','Reusable card'], 'Create a card', 'cards', 25],
  ['Accepted anywhere', ['Apple Pay and Google Pay','3D Secure optional','No credit check'], 'Learn more', 'tap', 10],
  ['Streaming credit', ['Movies, shows and music','Monthly or yearly plans','Switch anytime'], 'Browse streaming', 'play', 12],
  ['Gaming top-ups', ['Instant in-game credit','Major platforms','Gift it to a friend'], 'Browse gaming', 'game', 15],
  ['Travel vouchers', ['Flights and stays','Valid worldwide','Refundable if unused'], 'Browse travel', 'plane', 50]
];
const rail = $('#rail');
rail.innerHTML = rSlides.map(([t, l, c, k, p], i) => `<article class="gcard rs"><div class="sart">${rArt[k]}<span class="chip">from $${p}</span></div>
  <h3>${t}</h3><ul class="checks">${l.map(x => `<li>${x}</li>`).join('')}</ul>
  <a href="#store" class="btn ${i ? 'btn-ghost' : 'btn-primary'} wide">${c}</a></article>`).join('');
$$('.rs').forEach(el => el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px'); }));
function railUpdate() {
  const mid = rail.scrollLeft + rail.clientWidth / 2; let best = 0, bd = 1e9;
  [...rail.children].forEach((s, i) => { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
  [...rail.children].forEach((s, i) => s.classList.toggle('on', i === best));
  $('#rcount').textContent = `${best + 1} / ${rSlides.length}`;
  $('#rbar').style.transform = `scaleX(${Math.max(.1, rail.scrollLeft / (rail.scrollWidth - rail.clientWidth || 1))})`;
}
rail.addEventListener('scroll', railUpdate, { passive: true }); addEventListener('resize', railUpdate);
const step = () => rail.children[0].offsetWidth + 16;
$('#rprev').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
$('#rnext').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
rail.addEventListener('keydown', e => { if (e.key === 'ArrowRight') $('#rnext').click(); if (e.key === 'ArrowLeft') $('#rprev').click(); });
let dn = false, sx = 0, sl = 0;                       // mouse drag-to-scroll
rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; dn = true; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('drag'); });
addEventListener('pointerup', () => { dn = false; rail.classList.remove('drag'); });
rail.addEventListener('pointermove', e => { if (dn) rail.scrollLeft = sl - (e.clientX - sx); });
requestAnimationFrame(() => { rail.scrollLeft = 0; railUpdate(); });

/* ================= Rewards autoplay + popular wall ================= */
const D = {  // [fill shapes, stroke shapes] on a 48x48 grid. Custom duotone icons, not real brand logos.
  Streaming:['<rect x="6" y="9" width="36" height="25" rx="5"/>','<rect x="6" y="9" width="36" height="25" rx="5"/><path d="M20 15v13l11-6.5z"/><path d="M16 40h16"/>'],
  Gaming:['<rect x="5" y="14" width="38" height="22" rx="11"/>','<rect x="5" y="14" width="38" height="22" rx="11"/><path d="M15 25h8M19 21v8"/><circle cx="31" cy="22" r="1.5"/><circle cx="35" cy="27" r="1.5"/>'],
  Rides:['<path d="M8 28l4-10a4 4 0 0 1 4-3h16a4 4 0 0 1 4 3l4 10v8H8z"/>','<path d="M8 28l4-10a4 4 0 0 1 4-3h16a4 4 0 0 1 4 3l4 10v8H8zM8 28h32"/><circle cx="15" cy="32" r="1.5"/><circle cx="33" cy="32" r="1.5"/><path d="M12 36v4M36 36v4"/>'],
  Shopping:['<path d="M9 16h30l-2 24H11z"/>','<path d="M9 16h30l-2 24H11zM17 16a7 7 0 0 1 14 0"/>'],
  Music:['<circle cx="16" cy="36" r="6"/><circle cx="34" cy="32" r="6"/>','<circle cx="16" cy="36" r="6"/><circle cx="34" cy="32" r="6"/><path d="M22 36V12l18-4v24"/>'],
  Food:['<path d="M6 22h36a18 18 0 0 1-36 0z"/>','<path d="M6 22h36a18 18 0 0 1-36 0zM16 10c0 3 3 3 3 6M24 8c0 3 3 3 3 8M32 10c0 3 3 3 3 6"/>'],
  Travel:['<path d="M42 8 6 22l14 5 5 14z"/>','<path d="M42 8 6 22l14 5 5 14zM20 27 42 8"/>'],
  Cloud:['<path d="M34 38H14a8 8 0 0 1-1-16 11 11 0 0 1 21 3 7 7 0 0 1 0 13z"/>','<path d="M34 38H14a8 8 0 0 1-1-16 11 11 0 0 1 21 3 7 7 0 0 1 0 13zM24 32v-8m-4 4 4-4 4 4"/>'],
  Wallet:['<rect x="6" y="12" width="36" height="26" rx="5"/>','<path d="M6 17a5 5 0 0 1 5-5h26"/><rect x="6" y="12" width="36" height="26" rx="5"/><circle cx="34" cy="25" r="2.5"/>'],
  Crypto:['<circle cx="24" cy="24" r="17"/>','<circle cx="24" cy="24" r="17"/><path d="M20 15h7a4.5 4.5 0 0 1 0 9h-7m0 0h8a4.5 4.5 0 0 1 0 9h-8M20 12v24"/>'],
  Gift:['<rect x="8" y="20" width="32" height="20" rx="3"/>','<rect x="8" y="20" width="32" height="20" rx="3"/><rect x="6" y="14" width="36" height="6" rx="2"/><path d="M24 14v26M24 14c-4-6-10-5-9-1s6 1 9 1c3 0 8 3 9-1s-5-5-9 1"/>'],
  Security:['<path d="M24 6l15 6v11c0 9-6 15-15 19C15 38 9 32 9 23V12z"/>','<path d="M24 6l15 6v11c0 9-6 15-15 19C15 38 9 32 9 23V12zM17 24l5 5 9-10"/>']
};
const wallRows = { rowA: [['Streaming',12],['Gaming',15],['Rides',10],['Shopping',20],['Music',12],['Food',15]], rowB: [['Travel',50],['Cloud',10],['Wallet',25],['Crypto',100],['Gift',30],['Security',8]] };
Object.entries(wallRows).forEach(([id, list]) => {
  const set = list.map(([n, p]) => `<a href="#store" class="brand"><span class="bico"><svg viewBox="0 0 48 48" class="bi" aria-hidden="true"><g class="fl">${D[n][0]}</g><g class="sk">${D[n][1]}</g></svg></span><b>${n}</b><small>from $${p}</small></a>`).join('');
  $('#' + id).innerHTML = set.repeat(4);   // repeated for a seamless loop
});

/* Autoplay: pauses on hover, focus, touch, hidden tab, off-screen; has a visible pause button */
let playing = !reduce, hold = false, vis = true, auto;
const nextSlide = () => (rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4) ? rail.scrollTo({ left: 0, behavior: 'smooth' }) : rail.scrollBy({ left: step(), behavior: 'smooth' });
function startAuto() { clearInterval(auto); if (playing) auto = setInterval(() => { if (!hold && vis && !document.hidden) nextSlide(); }, 4500); }
['pointerenter', 'focusin', 'touchstart'].forEach(ev => rail.addEventListener(ev, () => (hold = true), { passive: true }));
['pointerleave', 'focusout', 'touchend'].forEach(ev => rail.addEventListener(ev, () => (hold = false)));
new IntersectionObserver(([e]) => (vis = e.isIntersecting), { threshold: .3 }).observe(rail);
['rprev', 'rnext'].forEach(id => $('#' + id).addEventListener('click', startAuto));
$('#rplay').addEventListener('click', () => {
  playing = !playing; startAuto();
  $('#rplay use').setAttribute('href', playing ? '#i-pause' : '#i-play');
  $('#rplay').setAttribute('aria-label', playing ? 'Pause autoplay' : 'Play autoplay');
});
if (reduce) { $('#rplay use').setAttribute('href', '#i-play'); }
startAuto();
