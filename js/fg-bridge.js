/* =====================================================================
 *  FG Bridge — ربط لوحة الإدارة بـ Supabase
 *  - جلسة Supabase Auth (تجديد تلقائي للتوكن)
 *  - إضافة Authorization تلقائياً لكل طلب إلى admin-core / admin-proxy
 *  - تنبيهات منبثقة فورية (Realtime) للمواعيد والمهام والرسائل والحجوزات والبيانات الواردة
 *  - مركز إشعارات (الجرس) + Web Push للجوال (PWA) حتى والتطبيق مغلق
 *  - استعادة كلمة المرور
 * ===================================================================== */
(function () {
  'use strict';
  const C = window.FG_CONFIG || {};
  const BASE = String(C.SUPABASE_URL || '').replace(/\/$/, '');
  const FN = BASE + '/functions/v1';
  const configured = BASE && !/YOUR_/.test(BASE) && C.SUPABASE_ANON_KEY && !/YOUR_/.test(C.SUPABASE_ANON_KEY);
  if (!window.supabase || !window.supabase.createClient) { console.error('[FG] supabase-js not loaded'); }
  const sb = configured && window.supabase ? window.supabase.createClient(BASE, C.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'fg-admin-auth' }
  }) : null;

  let session = null;
  const ready = sb ? sb.auth.getSession().then(r => (session = r.data.session)).catch(() => null) : Promise.resolve(null);

  async function accessToken() {
    if (!sb) return '';
    try { const { data } = await sb.auth.getSession(); session = data.session; return session ? session.access_token : ''; } catch (e) { return ''; }
  }

  /* ---------- اعتراض fetch: إضافة التوكن لطلبات دوال اللوحة ---------- */
  const origFetch = window.fetch.bind(window);
  const isOurs = u => u.indexOf(FN + '/admin-core') === 0 || u.indexOf(FN + '/admin-proxy') === 0;
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!isOurs(url)) return origFetch(input, init);
    init = Object.assign({}, init || {});
    const h = new Headers(init.headers || {});
    h.delete('x-admin-key');
    await ready;
    const tok = await accessToken();
    if (tok) h.set('Authorization', 'Bearer ' + tok);
    h.set('apikey', C.SUPABASE_ANON_KEY);
    init.headers = h; init.cache = 'no-store';
    const res = await origFetch(url, init);
    if (res.status === 401 && isOurs(url) && url.indexOf('/admin-proxy') === -1) {
      const still = await accessToken();
      if (!still && typeof window.logoutAdmin === 'function' && localStorage.getItem('userToken')) setTimeout(() => window.logoutAdmin(), 0);
    }
    return res;
  };

  async function core(action, params) {
    const res = await fetch(FN + '/admin-core', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ action }, params || {})) });
    try { return await res.json(); } catch (e) { return { status: 'error', message: 'رد غير صالح' }; }
  }

  /* ---------- تسجيل الدخول / الخروج ---------- */
  async function signIn(email, password) {
    if (!sb) return { status: 'error', message: 'لم يتم ضبط إعدادات Supabase في js/fg-config.js' };
    const { data, error } = await sb.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password });
    if (error) {
      const m = /invalid/i.test(error.message) ? 'البريد أو كلمة المرور غير صحيحة' : /banned|disabled/i.test(error.message) ? 'الحساب معطل. تواصل مع المسؤول.' : error.message;
      return { status: 'error', message: m };
    }
    session = data.session;
    const r = await core('validate', { login: '1' });
    if (r.status !== 'success') { await sb.auth.signOut(); return { status: 'error', message: r.message || 'غير مصرح. هذه الصفحة لموظفي الشركة فقط.' }; }
    r.token = session.access_token;
    return r;
  }
  async function signOut() { stopRealtime(); try { if (sb) await sb.auth.signOut(); } catch (e) {} }
  async function resetPassword(email) {
    if (!sb) return { error: { message: 'غير مضبوط' } };
    return sb.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), { redirectTo: location.origin + location.pathname });
  }
  async function hasSession() { await ready; return !!(await accessToken()); }

  if (sb) sb.auth.onAuthStateChange((ev, s) => {
    session = s;
    if (s && localStorage.getItem('userToken')) localStorage.setItem('userToken', s.access_token);
    if (ev === 'PASSWORD_RECOVERY') setTimeout(showRecoveryModal, 300);
  });

  /* ---------- واجهة: أنماط ---------- */
  const css = `
  .fg-pop-wrap{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(4,6,12,.72);backdrop-filter:blur(3px);padding:16px}
  .fg-pop-wrap.show{display:flex;animation:fgFade .2s ease}
  .fg-pop{width:min(440px,100%);background:linear-gradient(160deg,#141a28,#0b0f18);border:1.5px solid #b8860b;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 0 6px rgba(184,134,11,.08);padding:22px 20px 16px;text-align:center;color:#eee;font-family:Tajawal,sans-serif;direction:rtl;animation:fgPop .28s cubic-bezier(.2,1.4,.4,1)}
  .fg-pop .ic{width:64px;height:64px;border-radius:50%;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:1.7rem;background:rgba(184,134,11,.15);color:#d4b15a;border:1px solid rgba(184,134,11,.5)}
  .fg-pop.high .ic{background:rgba(231,76,60,.15);color:#ff7b6b;border-color:rgba(231,76,60,.6);animation:fgRing 1.2s ease infinite}
  .fg-pop h3{margin:4px 0 6px;font-size:1.12rem;color:#f3d98b;line-height:1.5}
  .fg-pop p{margin:0 0 14px;color:#c9cfdb;font-size:.95rem;line-height:1.7;white-space:pre-wrap;word-break:break-word}
  .fg-pop .meta{font-size:.75rem;color:#8a93a6;margin-bottom:12px}
  .fg-pop .btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .fg-pop button{border:none;border-radius:10px;padding:10px 18px;font-family:inherit;font-size:.92rem;cursor:pointer;font-weight:700}
  .fg-pop .go{background:linear-gradient(135deg,#b8860b,#d4b15a);color:#111}
  .fg-pop .x{background:transparent;color:#ccc;border:1px solid #444}
  .fg-pop .more{margin-top:10px;font-size:.78rem;color:#d4b15a}
  .fg-bell{position:relative;background:rgba(184,134,11,.1);border:1px solid rgba(184,134,11,.4);color:#d4b15a;border-radius:10px;padding:7px 11px;cursor:pointer;font-size:1rem}
  .fg-bell .b{position:absolute;top:-6px;left:-6px;background:#e74c3c;color:#fff;font-size:.68rem;border-radius:10px;padding:1px 6px;display:none;font-weight:700}
  .fg-panel{position:fixed;top:64px;left:16px;width:min(380px,calc(100vw - 32px));max-height:70vh;overflow:auto;z-index:99990;background:#0f1420;border:1px solid rgba(184,134,11,.4);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.5);display:none;direction:rtl;font-family:Tajawal,sans-serif}
  .fg-panel.show{display:block}
  .fg-panel .hd{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #222a3a;color:#f3d98b;font-weight:700;position:sticky;top:0;background:#0f1420}
  .fg-panel .hd button{background:none;border:1px solid #333;color:#aaa;border-radius:8px;padding:4px 8px;font-family:inherit;font-size:.75rem;cursor:pointer;margin-right:4px}
  .fg-panel .it{padding:10px 12px;border-bottom:1px solid #1b2230;cursor:pointer;color:#ccd}
  .fg-panel .it.unread{background:rgba(184,134,11,.07);border-right:3px solid #b8860b}
  .fg-panel .it strong{display:block;color:#eee;font-size:.88rem}
  .fg-panel .it span{font-size:.8rem;color:#9aa3b5}
  .fg-panel .it em{font-style:normal;font-size:.7rem;color:#6d7689;display:block;margin-top:2px}
  .fg-panel .push{margin:10px 12px;padding:10px;border:1px dashed rgba(184,134,11,.5);border-radius:10px;font-size:.8rem;color:#c9cfdb}
  .fg-panel .push button{margin-top:6px;background:linear-gradient(135deg,#b8860b,#d4b15a);color:#111;border:none;border-radius:8px;padding:6px 12px;font-family:inherit;font-weight:700;cursor:pointer}
  .fg-modal{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px}
  .fg-modal .card{background:#0f1420;border:1px solid #b8860b;border-radius:16px;padding:22px;width:min(400px,100%);direction:rtl;font-family:Tajawal,sans-serif;color:#eee}
  .fg-modal input{width:100%;padding:11px;border-radius:10px;border:1px solid #333;background:#0a0e16;color:#fff;margin:8px 0;font-family:inherit;box-sizing:border-box}
  .fg-modal button{width:100%;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#b8860b,#d4b15a);color:#111;font-weight:700;font-family:inherit;cursor:pointer;margin-top:6px}
  @keyframes fgFade{from{opacity:0}to{opacity:1}}
  @keyframes fgPop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes fgRing{0%,100%{transform:rotate(0)}10%,30%{transform:rotate(-12deg)}20%,40%{transform:rotate(12deg)}50%{transform:rotate(0)}}`;
  function injectCss() { if (document.getElementById('fg-bridge-css')) return; const s = document.createElement('style'); s.id = 'fg-bridge-css'; s.textContent = css; document.head.appendChild(s); }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ICONS = { message: 'fa-envelope', booking: 'fa-calendar-check', appointment: 'fa-clock', todo: 'fa-tasks', inbound: 'fa-inbox', certificate: 'fa-award', system: 'fa-bell' };

  /* ---------- الصوت والاهتزاز ---------- */
  let actx = null;
  function beep(high) {
    if (localStorage.getItem('soundEnabled') === 'false') return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const notes = high ? [880, 660, 880, 660] : [660, 880];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(actx.destination);
        const t = actx.currentTime + i * 0.18; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.start(t); o.stop(t + 0.17);
      });
    } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate(high ? [300, 120, 300, 120, 300] : [200, 100, 200]); } catch (e) {}
  }
  document.addEventListener('click', () => { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) {} }, { once: true });

  /* ---------- النافذة المنبثقة ---------- */
  const queue = []; let showing = null;
  function ensurePop() {
    let w = document.getElementById('fgPopWrap');
    if (w) return w;
    w = document.createElement('div'); w.id = 'fgPopWrap'; w.className = 'fg-pop-wrap';
    w.innerHTML = '<div class="fg-pop" id="fgPop"><div class="ic"><i class="fas fa-bell"></i></div><h3></h3><p></p><div class="meta"></div><div class="btns"><button class="go">فتح</button><button class="x">إغلاق</button></div><div class="more"></div></div>';
    document.body.appendChild(w);
    w.querySelector('.x').onclick = () => closePop(false);
    w.querySelector('.go').onclick = () => closePop(true);
    w.addEventListener('click', e => { if (e.target === w) closePop(false); });
    return w;
  }
  function popup(n) {
    queue.push(n);
    if (!showing) nextPop(); else updateMore();
  }
  function updateMore() { const m = document.querySelector('#fgPop .more'); if (m) m.textContent = queue.length ? '+' + queue.length + ' تنبيه آخر' : ''; }
  function nextPop() {
    showing = queue.shift(); if (!showing) return;
    const w = ensurePop(), n = showing, box = w.querySelector('.fg-pop');
    box.classList.toggle('high', n.priority === 'high');
    w.querySelector('.ic i').className = 'fas ' + (ICONS[n.kind] || 'fa-bell');
    w.querySelector('h3').textContent = n.title || 'تنبيه';
    w.querySelector('p').textContent = n.body || '';
    w.querySelector('.meta').textContent = new Date(n.created_at || Date.now()).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    w.querySelector('.go').style.display = n.link ? '' : 'none';
    updateMore();
    w.classList.add('show');
    beep(n.priority === 'high');
  }
  function closePop(go) {
    const n = showing; const w = ensurePop(); w.classList.remove('show'); showing = null;
    if (n) { markRead([n.id]); if (go) navigate(n.link); }
    setTimeout(nextPop, 180);
  }
  function navigate(link) {
    try {
      link = String(link || '');
      if (link === 'messages' && window.showMessagesView) window.showMessagesView();
      else if (link === 'bookings' && window.showBookingsView) window.showBookingsView();
      else if (link.indexOf('inbound:') === 0 && window.showInboundView) window.showInboundView(link.split(':')[1], document.querySelector('.inbound-btn[onclick*="' + link.split(':')[1] + '"]'));
      else if (link === 'certificates' && window.showCertificatesView) window.showCertificatesView();
      else if (link.indexOf('biz:') === 0 && window.FGBiz) window.FGBiz.show(link.split(':')[1]);
      else if (link === 'fgAccounts' && window.showFgAccountsView) window.showFgAccountsView(document.getElementById('btnFgAccounts'));
      else if (link === 'mataamiPayments' && window.showMataamiPaymentsView) window.showMataamiPaymentsView(document.getElementById('btnMataamiPayments'));
      else if (window.loadData) window.loadData('all', document.querySelector('.sidebar-btn'));
    } catch (e) { console.warn(e); }
  }

  /* ---------- مركز الإشعارات (الجرس) ---------- */
  let items = [], lastId = 0;
  function ensureBell() {
    if (document.getElementById('fgBell')) return;
    const host = document.querySelector('.header-actions'); if (!host) return;
    const b = document.createElement('button'); b.id = 'fgBell'; b.className = 'fg-bell'; b.type = 'button'; b.title = 'الإشعارات';
    b.innerHTML = '<i class="fas fa-bell"></i><span class="b" id="fgBellBadge"></span>';
    host.insertBefore(b, host.firstChild);
    const panel = document.createElement('div'); panel.id = 'fgPanel'; panel.className = 'fg-panel'; document.body.appendChild(panel);
    b.onclick = e => { e.stopPropagation(); panel.classList.toggle('show'); if (panel.classList.contains('show')) renderPanel(); };
    document.addEventListener('click', e => { if (!panel.contains(e.target) && e.target !== b) panel.classList.remove('show'); });
  }
  function renderBadge() {
    const n = items.filter(i => !i.read_at).length, el = document.getElementById('fgBellBadge');
    if (el) { el.style.display = n ? 'block' : 'none'; el.textContent = n > 99 ? '99+' : n; }
    try { if (navigator.setAppBadge) n ? navigator.setAppBadge(n) : navigator.clearAppBadge(); } catch (e) {}
  }
  function renderPanel() {
    const p = document.getElementById('fgPanel'); if (!p) return;
    const perm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
    let pushBox = '';
    if (perm === 'default') pushBox = '<div class="push"><i class="fas fa-mobile-alt"></i> فعّل تنبيهات الجهاز لتصلك المواعيد والرسائل حتى والتطبيق مغلق.<br><button type="button" id="fgEnablePush">تفعيل التنبيهات</button></div>';
    else if (perm === 'denied') pushBox = '<div class="push">التنبيهات محظورة من إعدادات المتصفح لهذا الموقع. اسمح بها من إعدادات الموقع ثم أعد التحميل.</div>';
    else if (perm === 'unsupported') pushBox = '<div class="push">على iPhone: أضف اللوحة إلى الشاشة الرئيسية (مشاركة ← إضافة إلى الشاشة الرئيسية) ثم افتحها من الأيقونة لتفعيل التنبيهات.</div>';
    p.innerHTML = `<div class="hd"><span><i class="fas fa-bell"></i> الإشعارات</span><span><button type="button" id="fgTestPush">تجربة</button><button type="button" id="fgReadAll">تعليم الكل كمقروء</button></span></div>${pushBox}` +
      (items.length ? items.map(i => `<div class="it ${i.read_at ? '' : 'unread'}" data-id="${i.id}" data-link="${esc(i.link)}"><strong><i class="fas ${ICONS[i.kind] || 'fa-bell'}" style="color:#d4b15a;margin-left:6px"></i>${esc(i.title)}</strong><span>${esc(i.body)}</span><em>${new Date(i.created_at).toLocaleString('ar-EG')}</em></div>`).join('')
        : '<div style="padding:20px;text-align:center;color:#777">لا توجد إشعارات</div>');
    const ep = document.getElementById('fgEnablePush'); if (ep) ep.onclick = () => enablePush(true).then(renderPanel);
    document.getElementById('fgReadAll').onclick = () => { markRead([]); };
    document.getElementById('fgTestPush').onclick = async () => { const r = await core('testpush'); if (window.showToast) window.showToast(r.status === 'success' ? 'تم إرسال إشعار تجريبي' : (r.message || 'فشل'), 'fa-bell'); };
    p.querySelectorAll('.it').forEach(el => el.onclick = () => { markRead([+el.dataset.id]); p.classList.remove('show'); navigate(el.dataset.link); });
  }
  async function markRead(ids) {
    const now = new Date().toISOString();
    items.forEach(i => { if (!ids.length || ids.includes(i.id)) i.read_at = i.read_at || now; });
    renderBadge(); if (document.getElementById('fgPanel')?.classList.contains('show')) renderPanel();
    core('marknotificationsread', { ids: ids.join(',') }).catch(() => {});
  }
  async function loadNotifications(initial) {
    const r = await core('listnotifications');
    if (r.status !== 'success') return;
    const fresh = (r.data || []).filter(n => n.id > lastId);
    items = r.data || [];
    const maxId = items.reduce((m, n) => Math.max(m, n.id), 0);
    if (!initial && lastId) fresh.filter(n => !n.read_at).reverse().forEach(handleIncoming);
    // عند فتح اللوحة: إظهار التنبيهات العاجلة غير المقروءة من آخر ساعتين
    if (initial) items.filter(n => !n.read_at && n.priority === 'high' && Date.now() - new Date(n.created_at).getTime() < 2 * 3600e3).slice(0, 3).reverse().forEach(popup);
    lastId = Math.max(lastId, maxId);
    renderBadge();
  }

  /* ---------- Realtime ---------- */
  let channel = null, pollT = null, uid = null;
  function handleIncoming(n) {
    if (items.some(i => i.id === n.id && i._shown)) return;
    const existing = items.find(i => i.id === n.id);
    if (existing) existing._shown = true; else { n._shown = true; items.unshift(n); }
    lastId = Math.max(lastId, n.id);
    renderBadge();
    popup(n);
    if (document.hidden) showSw(n);
    if (n.kind === 'message' && typeof window.__fgPollUnread === 'function') window.__fgPollUnread();
    if (n.kind === 'message' && document.getElementById('messagesView')?.style.display === 'block' && window.loadMessagesFolder) window.loadMessagesFolder(undefined, true);
  }
  function showSw(n) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(reg => reg.showNotification(n.title, { body: n.body, tag: n.kind + '-' + n.id, icon: './icon-192.png', badge: './icon-192.png', requireInteraction: n.priority === 'high', vibrate: [200, 100, 200], data: { link: n.link } })).catch(() => {});
  }
  async function startRealtime() {
    if (!sb) return;
    injectCss(); ensureBell();
    const { data } = await sb.auth.getUser(); uid = data && data.user ? data.user.id : null;
    if (!uid) return;
    await loadNotifications(true);
    if (channel) sb.removeChannel(channel);
    channel = sb.channel('fg-notif-' + uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + uid }, payload => handleIncoming(payload.new))
      .subscribe();
    // احتياط: مزامنة كل دقيقة لو انقطع الاتصال اللحظي
    if (pollT) clearInterval(pollT);
    pollT = setInterval(() => { if (!document.hidden) loadNotifications(false); }, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && uid) loadNotifications(false); });
    const hm = /[#&]fg=([^&]+)/.exec(location.hash || '');
    if (hm) { const lk = decodeURIComponent(hm[1]); history.replaceState(null, '', location.pathname + location.search); setTimeout(() => navigate(lk), 1500); }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') enablePush(false);
    else if (typeof Notification !== 'undefined' && Notification.permission === 'default') setTimeout(() => { if (window.showToast) window.showToast('اضغط على الجرس 🔔 لتفعيل تنبيهات الجوال', 'fa-bell'); }, 4000);
  }
  function stopRealtime() {
    if (channel && sb) { sb.removeChannel(channel); channel = null; }
    if (pollT) { clearInterval(pollT); pollT = null; }
    items = []; lastId = 0; uid = null; renderBadge();
  }

  /* ---------- Web Push ---------- */
  function b64ToU8(b64) { const p = '='.repeat((4 - b64.length % 4) % 4); const s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...s].map(c => c.charCodeAt(0))); }
  let vapid = null;
  async function enablePush(ask) {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return false;
      if (Notification.permission === 'default' && ask) { const r = await Notification.requestPermission(); if (r !== 'granted') return false; }
      if (Notification.permission !== 'granted') return false;
      if (!vapid) { const c = await core('getconfig'); vapid = c.vapidPublicKey || ''; }
      if (!vapid) { console.warn('[FG] VAPID_PUBLIC_KEY not set'); return false; }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(vapid) });
      await core('savepushsub', { subscription: JSON.stringify(sub) });
      if (ask && window.showToast) window.showToast('تم تفعيل تنبيهات هذا الجهاز', 'fa-check-circle');
      return true;
    } catch (e) { console.warn('[FG] push', e); return false; }
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => {
    const d = e.data || {}; if (d.type === 'FG_NAVIGATE') navigate(d.link); if (d.type === 'FG_RESUBSCRIBE') enablePush(false);
  });

  /* ---------- استعادة كلمة المرور ---------- */
  function showRecoveryModal() {
    if (document.getElementById('fgRecovery')) return;
    const m = document.createElement('div'); m.className = 'fg-modal'; m.id = 'fgRecovery';
    m.innerHTML = '<div class="card"><h3 style="color:#f3d98b;margin-top:0"><i class="fas fa-key"></i> تعيين كلمة مرور جديدة</h3><input type="password" id="fgNewPass" placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)" autocomplete="new-password"><input type="password" id="fgNewPass2" placeholder="تأكيد كلمة المرور" autocomplete="new-password"><div id="fgRecErr" style="color:#e74c3c;font-size:.85rem;min-height:1.2em"></div><button type="button" id="fgRecBtn">حفظ</button></div>';
    document.body.appendChild(m);
    document.getElementById('fgRecBtn').onclick = async () => {
      const a = document.getElementById('fgNewPass').value, b = document.getElementById('fgNewPass2').value, er = document.getElementById('fgRecErr');
      if (a.length < 8) { er.textContent = 'كلمة المرور قصيرة'; return; }
      if (a !== b) { er.textContent = 'كلمتا المرور غير متطابقتين'; return; }
      const { error } = await sb.auth.updateUser({ password: a });
      if (error) { er.textContent = error.message; return; }
      m.remove(); await sb.auth.signOut();
      history.replaceState(null, '', location.pathname);
      alert('تم تغيير كلمة المرور. سجّل الدخول الآن.');
      location.reload();
    };
  }
  async function forgotPassword() {
    const email = (document.getElementById('usernameInput') || {}).value || prompt('أدخل بريدك الإلكتروني');
    if (!email) return;
    const { error } = await resetPassword(email);
    const er = document.getElementById('errorMsg');
    if (er) er.textContent = error ? '❌ ' + error.message : '✅ إن كان البريد مسجلاً فسيصلك رابط تعيين كلمة المرور.';
  }

  window.FG = { sb, core, signIn, signOut, hasSession, resetPassword, forgotPassword, startRealtime, stopRealtime, enablePush, ready, configured,
    FN, CORE_URL: FN + '/admin-core', PROXY_URL: FN + '/admin-proxy', PUBLIC_URL: FN + '/public-api', popup, navigate, esc };

  document.addEventListener('DOMContentLoaded', () => {
    injectCss();
    if (!configured) {
      const er = document.getElementById('errorMsg');
      if (er) er.textContent = '⚠️ اضبط SUPABASE_URL و SUPABASE_ANON_KEY في js/fg-config.js';
    }
  });
})();
