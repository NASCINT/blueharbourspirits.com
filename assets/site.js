/* Blue Harbour Spirits — site behaviour */
(function () {
  var page = document.body.getAttribute('data-page');
  var hdr = document.getElementById('siteHeader');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  var yr = document.getElementById('year'); if (yr) yr.textContent = new Date().getFullYear();

  // header: every page opens with the big transparent logo over its top section, then a slim bar once scrolled
  function updateHeader() { hdr.classList.toggle('scrolled', window.scrollY > 60); }
  window.addEventListener('scroll', updateHeader, { passive: true }); updateHeader();
  if (toggle) toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', open);
  });
  if (links) links.addEventListener('click', function (e) { if (e.target.closest('a')) links.classList.remove('open'); });

  // Collection drop-down: opens on hover/focus, and on tap via the small arrow button
  document.querySelectorAll('.has-sub').forEach(function (li) {
    var btn = li.querySelector('.sub-toggle');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation(); var open = li.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open));
    });
    li.addEventListener('keydown', function (e) { if (e.key === 'Escape') { li.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.has-sub.open').forEach(function (li) { if (!li.contains(e.target)) { li.classList.remove('open'); li.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); } });
  });

  // home hero film: music button and header logo timing
  var hv = document.getElementById('heroVideo'), hs = document.getElementById('heroSound'), ha = document.getElementById('heroAudio');
  function soundLabel(on) { hs.textContent = on ? 'Sound off' : 'Sound on'; hs.setAttribute('aria-pressed', String(on)); }
  function stopMusic() { if (ha && !ha.paused) ha.pause(); if (hs) soundLabel(false); }
  if (hv && hs && ha) {
    hs.addEventListener('click', async function () {
      if (!ha.paused) { stopMusic(); return; }
      try { ha.volume = 1; if (isFinite(ha.duration)) ha.currentTime = hv.currentTime % ha.duration; await ha.play(); soundLabel(true); }
      catch (err) { hs.textContent = 'Sound unavailable'; setTimeout(function () { soundLabel(false); }, 2500); }
    });
    hv.addEventListener('timeupdate', function () {
      if (!ha.paused && isFinite(ha.duration)) { var t = hv.currentTime % ha.duration; if (Math.abs(ha.currentTime - t) > 0.35) ha.currentTime = t; }
      hdr.classList.toggle('hide-logo', !hv.paused && hv.currentTime < 4.5 && window.scrollY < 60);
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopMusic(); });
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelectorAll('video').forEach(function (v) { v.pause(); });

  // destinations: city tabs and product toggle
  var dExp = document.querySelector('.dest-explorer');
  if (dExp) {
    dExp.querySelectorAll('.dtab').forEach(function (t) { t.addEventListener('click', function () {
      var c = t.dataset.city;
      dExp.querySelectorAll('.dtab').forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
      dExp.querySelectorAll('.dcity').forEach(function (x) { x.classList.toggle('on', x.dataset.city === c); });
      dExp.querySelectorAll('.dbg').forEach(function (x) { x.classList.toggle('on', x.dataset.city === c); });
    }); });
    dExp.querySelectorAll('.dpbtn').forEach(function (b) { b.addEventListener('click', function () {
      var city = b.closest('.dcity'), p = b.dataset.prod;
      city.querySelectorAll('.dpbtn').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      city.querySelectorAll('.dprod').forEach(function (x) { x.classList.toggle('on', x.dataset.prod === p); });
    }); });
  }

  // contact form (Splitforms)
  var form = document.getElementById('bhContactForm'), status = document.getElementById('bhFormStatus');
  if (form) form.addEventListener('submit', async function (e) {
    e.preventDefault(); status.textContent = 'Sending…'; status.className = 'form-status';
    try {
      var res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      var data = await res.json().catch(function () { return {}; });
      if (res.ok && data.success !== false) { status.textContent = 'Thank you — your enquiry has been sent. We will be in touch soon.'; status.className = 'form-status ok'; form.reset(); }
      else { status.textContent = data.message || 'Something went wrong. Please email info@nascspirits.com directly.'; status.className = 'form-status err'; }
    } catch (err) { status.textContent = 'Something went wrong. Please email info@nascspirits.com directly.'; status.className = 'form-status err'; }
  });

  // age gate: YES lets the visitor in for 30 days, NO sends them to Google
  var gate = document.getElementById('ageGate');
  if (gate) {
    var yes = document.getElementById('ageYes'), no = document.getElementById('ageNo');
    if (!document.documentElement.classList.contains('age-ok')) setTimeout(function () { yes.focus(); }, 60);
    yes.addEventListener('click', function () { try { localStorage.setItem('bh-age-ok', String(Date.now())); } catch (e) {} document.documentElement.classList.add('age-ok'); });
    no.addEventListener('click', function () { window.location.href = 'https://www.google.com'; });
    gate.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return; var f = [yes, no], i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[1].focus(); } else if (!e.shiftKey && i === 1) { e.preventDefault(); f[0].focus(); }
    });
  }
})();

/* Blue Harbour Spirits — product page photo slides: endless in both directions */
(function () {
  document.querySelectorAll('.pp-carousel').forEach(function (c) {
    var track = c.querySelector('.pp-track'), prev = c.querySelector('.pp-arrow-prev'), next = c.querySelector('.pp-arrow-next');
    var originals = Array.prototype.slice.call(track.children), n = originals.length;
    if (!n) return;
    // two copies of the photos on each side, so it can keep going whichever arrow is pressed
    function copy() {
      var f = document.createDocumentFragment();
      originals.forEach(function (s) {
        var k = s.cloneNode(true); k.setAttribute('aria-hidden', 'true');
        var im = k.querySelector('img'); if (im) { im.alt = ''; im.loading = 'eager'; }
        f.appendChild(k);
      });
      return f;
    }
    track.insertBefore(copy(), track.firstChild); track.insertBefore(copy(), track.firstChild);
    track.appendChild(copy()); track.appendChild(copy());
    function step() { var a = track.children[0].getBoundingClientRect(), b = track.children[1].getBoundingClientRect(); return b.left - a.left; }
    function setW() { return step() * n; }
    function jump(to) { track.style.scrollSnapType = 'none'; track.scrollLeft = to; track.offsetHeight; track.style.scrollSnapType = ''; }
    function recentre() {
      var w = setW(), x = track.scrollLeft;
      if (x < w * 1.5) jump(x + w);
      else if (x > w * 2.5) jump(x - w);
    }
    jump(setW() * 2);
    var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(recentre, 140); }, { passive: true });
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    });
    var lastW = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; jump(setW() * 2); } });
  });
})();
