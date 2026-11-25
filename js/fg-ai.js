/* =====================================================================
 *  FG AI — السكرتير الذكي داخل لوحة FAROUK GRUP (V8.2)
 *  - يحوّل الكلام (كتابة أو صوت) إلى عمل: مواعيد، مهام، مهام الفريق، عملاء، مالية، حجوزات، رسائل، تجميد...
 *  - يعمل بصلاحيات الموظف فقط (التحقق في الخادم: Edge Function ai-assistant)
 *  - العمليات الحساسة تظهر كبطاقة تأكيد قبل التنفيذ
 * ===================================================================== */
(function () {
  'use strict';
  if (!window.FG) return;
  const URL_AI = FG.FN + '/ai-assistant';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
  const toast = (m, i, t) => (typeof showToast === 'function' ? showToast(m, i, t) : console.log(m));
  const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'; } catch (e) { return 'Europe/Istanbul'; } })();

  /* ---------- التنسيق ---------- */
  const css = document.createElement('style');
  css.textContent = `
  #fgAiFab{position:fixed;left:18px;bottom:18px;z-index:9990;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;
    background:linear-gradient(135deg,#f3d98b,#b8860b);color:#111;font-size:1.45rem;box-shadow:0 8px 26px rgba(184,134,11,.45);display:none;align-items:center;justify-content:center}
  #fgAiFab:hover{transform:scale(1.06)} #fgAiFab .dot{position:absolute;top:6px;right:6px;width:11px;height:11px;border-radius:50%;background:#2ecc71;border:2px solid #111}
  #fgAiPanel{position:fixed;left:18px;bottom:88px;z-index:9991;width:min(410px,calc(100vw - 24px));height:min(640px,calc(100vh - 110px));display:none;flex-direction:column;
    background:#11141c;border:1px solid rgba(184,134,11,.45);border-radius:18px;box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden;direction:rtl;font-family:inherit}
  #fgAiPanel.open{display:flex}
  .fgai-h{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(135deg,#1c1a12,#141210);border-bottom:1px solid rgba(184,134,11,.3)}
  .fgai-h .av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#f3d98b,#b8860b);color:#111;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
  .fgai-h b{color:#f3d98b;display:block;font-size:.98rem} .fgai-h small{color:#8a93a6;font-size:.74rem}
  .fgai-h .sp{flex:1} .fgai-h button{background:none;border:0;color:#aaa;cursor:pointer;font-size:1rem;padding:6px;border-radius:8px} .fgai-h button:hover{color:#f3d98b;background:#ffffff10}
  .fgai-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
  .fgai-m{max-width:88%;padding:9px 12px;border-radius:14px;font-size:.88rem;line-height:1.65;word-wrap:break-word;white-space:normal}
  .fgai-m.u{align-self:flex-start;background:#b8860b;color:#111;border-bottom-right-radius:4px}
  .fgai-m.a{align-self:flex-end;background:#1b2030;color:#e6e6e6;border:1px solid #262d40;border-bottom-left-radius:4px}
  .fgai-m.e{align-self:flex-end;background:#3b1a1f;color:#fca5a5;border:1px solid #5b2730}
  .fgai-m code{background:#00000040;padding:0 4px;border-radius:4px;direction:ltr;display:inline-block}
  .fgai-acts{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
  .fgai-acts span{font-size:.72rem;background:#2ecc7120;color:#6ee7b7;border:1px solid #2ecc7140;padding:2px 8px;border-radius:99px}
  .fgai-pend{align-self:stretch;background:#1d1a10;border:1px solid #b8860b80;border-radius:12px;padding:10px 12px;font-size:.84rem;color:#f0e6c8}
  .fgai-pend .t{white-space:pre-wrap;margin-bottom:8px} .fgai-pend .t b{color:#f3d98b}
  .fgai-pend button{border:0;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:700;font-size:.8rem;margin-left:6px}
  .fgai-pend .ok{background:linear-gradient(135deg,#f3d98b,#b8860b);color:#111} .fgai-pend .no{background:#2a2f3d;color:#ddd}
  .fgai-pend.done{opacity:.6} .fgai-pend.done button{display:none}
  .fgai-typing{align-self:flex-end;color:#8a93a6;font-size:.8rem;display:flex;gap:6px;align-items:center}
  .fgai-chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 8px}
  .fgai-chips span{font-size:.74rem;border:1px solid #2a334b;color:#c9cfdb;border-radius:99px;padding:4px 10px;cursor:pointer;background:#151a26} .fgai-chips span:hover{border-color:#b8860b;color:#f3d98b}
  .fgai-in{display:flex;gap:8px;align-items:flex-end;padding:10px 12px;border-top:1px solid #222838;background:#0e1118}
  .fgai-in textarea{flex:1;resize:none;max-height:120px;min-height:40px;padding:9px 11px;border-radius:12px;border:1px solid #2a334b;background:#0b0e17;color:#fff;font:inherit;font-size:.88rem;line-height:1.5}
  .fgai-in textarea:focus{outline:none;border-color:#b8860b}
  .fgai-in button{width:40px;height:40px;border-radius:12px;border:0;cursor:pointer;font-size:1rem;flex-shrink:0}
  .fgai-send{background:linear-gradient(135deg,#f3d98b,#b8860b);color:#111} .fgai-send:disabled{opacity:.5;cursor:default}
  .fgai-mic{background:#1b2030;color:#f3d98b;border:1px solid #2a334b !important} .fgai-mic.rec{background:#e74c3c;color:#fff;animation:fgaiPulse 1.2s infinite}
  @keyframes fgaiPulse{0%,100%{box-shadow:0 0 0 0 rgba(231,76,60,.6)}50%{box-shadow:0 0 0 8px rgba(231,76,60,0)}}
  body.fgai-on .toast-container{left:90px}
  @media (max-width:600px){#fgAiPanel{left:8px;right:8px;width:auto;bottom:80px;height:calc(100vh - 100px)}#fgAiFab{left:12px;bottom:12px;width:52px;height:52px}}
  `;
  document.head.appendChild(css);

  /* ---------- الواجهة ---------- */
  const fab = document.createElement('button');
  fab.id = 'fgAiFab'; fab.title = 'السكرتير الذكي'; fab.setAttribute('aria-label', 'السكرتير الذكي');
  fab.innerHTML = '<i class="fas fa-user-tie"></i><span class="dot"></span>';
  const panel = document.createElement('div');
  panel.id = 'fgAiPanel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'السكرتير الذكي');
  panel.innerHTML = `
    <div class="fgai-h"><div class="av"><i class="fas fa-user-tie"></i></div><div><b>السكرتير الذكي</b><small id="fgAiSub">اكتب أو تحدّث وسأنفّذ داخل المنصة</small></div><div class="sp"></div>
      <button id="fgAiClear" title="محادثة جديدة"><i class="fas fa-broom"></i></button><button id="fgAiClose" title="إغلاق"><i class="fas fa-times"></i></button></div>
    <div class="fgai-body" id="fgAiBody"></div>
    <div class="fgai-chips" id="fgAiChips"></div>
    <div class="fgai-in"><button class="fgai-mic" id="fgAiMic" title="تحدّث (اضغط للتسجيل ثم اضغط للإرسال)"><i class="fas fa-microphone"></i></button>
      <textarea id="fgAiInput" rows="1" placeholder="اكتب طلبك... مثل: أضف موعد الخميس 3 العصر"></textarea>
      <button class="fgai-send" id="fgAiSend" title="إرسال"><i class="fas fa-paper-plane"></i></button></div>`;
  document.body.appendChild(fab); document.body.appendChild(panel);

  const body = $('fgAiBody'), input = $('fgAiInput'), sendBtn = $('fgAiSend'), micBtn = $('fgAiMic');
  const me = () => { try { return currentUser || {}; } catch (e) { return {}; } };
  const allowed = () => { try { return !!(localStorage.getItem('userToken') && me().email && typeof hasPerm === 'function' && hasPerm('ai_assistant')); } catch (e) { return false; } };
  const KEY = () => 'fgAiChat_' + (me().email || 'x');
  let hist = [], busy = false;

  function load() { try { hist = JSON.parse(sessionStorage.getItem(KEY()) || '[]'); } catch (e) { hist = []; } }
  function save() { try { sessionStorage.setItem(KEY(), JSON.stringify(hist.slice(-40))); } catch (e) {} }
  function scroll() { body.scrollTop = body.scrollHeight; }

  function chips() {
    const L = ['ما جدولي اليوم؟', 'أضف مهمة لي غداً: ', 'أضف موعد '];
    if (hasPerm('biz_projects')) L.push('كلّف أحمد بمهمة ');
    if (Object.keys(PLATFORMS || {}).some(k => hasPlatform(k))) L.push('ابحث عن المشترك ');
    if (hasPerm('inbound_mp_ratings')) L.push('ملخص تقييمات مطعمي برو هذا الشهر');
    if (hasPerm('bookings_view')) L.push('حجوزات هذا الأسبوع');
    $('fgAiChips').innerHTML = hist.length ? '' : L.map(t => `<span data-chip="${esc(t)}">${esc(t)}</span>`).join('');
  }
  function welcome() {
    const n = (me().name || '').split(' ')[0];
    return `أهلاً${n ? ' ' + n : ''}، أنا سكرتيرك داخل المنصة. قل لي ما تريد وسأنفّذه مباشرة، مثلاً:\n• **أضف موعد** يوم الأحد الساعة 11 صباحاً مع العميل فلان تحت بند المتابعات\n• **ذكّرني** بإرسال العرض غداً\n• **كلّف** موظفاً بمهمة وحدد موعد التسليم\n• **ما جدولي** هذا الأسبوع؟\nأعمل ضمن صلاحياتك فقط، والعمليات الحساسة أطلب تأكيدك قبل تنفيذها.`;
  }
  const TOOL_AR = { add_todo: 'مهمة شخصية', add_appointment: 'موعد', update_todo: 'تعديل مهمة', update_appointment: 'تعديل موعد', create_task: 'مهمة فريق', update_task: 'تحديث مهمة', create_project: 'مشروع', create_client: 'عميل', add_finance: 'قيد مالي', create_booking: 'حجز' };

  function render() {
    body.innerHTML = '';
    add('a', welcome(), null, true);
    hist.forEach(m => add(m.role === 'user' ? 'u' : (m.err ? 'e' : 'a'), m.content, m.acts, true));
    chips(); scroll();
  }
  function add(cls, text, acts, quiet) {
    const d = document.createElement('div'); d.className = 'fgai-m ' + cls;
    d.innerHTML = md(text) + (acts && acts.length ? '<div class="fgai-acts">' + acts.map(a => `<span><i class="fas fa-check"></i> ${esc(TOOL_AR[a] || a)}</span>`).join('') + '</div>' : '');
    body.appendChild(d); if (!quiet) scroll(); return d;
  }
  function addPending(p) {
    const d = document.createElement('div'); d.className = 'fgai-pend';
    const lines = String(p.summary || '').split('\n');
    d.innerHTML = `<div class="t"><i class="fas fa-shield-halved" style="color:#f3d98b"></i> <b>${esc(lines[0])}</b>${lines.length > 1 ? '\n' + esc(lines.slice(1).join('\n')) : ''}</div><button class="ok"><i class="fas fa-check"></i> تأكيد التنفيذ</button><button class="no">إلغاء</button>`;
    d.querySelector('.ok').onclick = () => decide(d, p, 'confirm');
    d.querySelector('.no').onclick = () => decide(d, p, 'cancel');
    body.appendChild(d); scroll();
  }
  async function decide(card, p, action) {
    card.querySelectorAll('button').forEach(b => b.disabled = true);
    const r = await call({ action, op: p.op });
    card.classList.add('done');
    const msg = r.reply || r.message || (action === 'cancel' ? 'تم الإلغاء.' : 'تم.');
    hist.push({ role: 'assistant', content: msg, err: r.status !== 'success' }); save();
    add(r.status === 'success' ? 'a' : 'e', msg);
    if (r.status === 'success' && action === 'confirm') toast(msg.replace(/^تم التنفيذ: /, ''), 'fa-check');
    await refresh(r.refresh);
  }

  async function call(payload, isForm) {
    try {
      const res = await fetch(URL_AI, isForm ? { method: 'POST', body: payload } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json().catch(() => ({ status: 'error', message: 'رد غير صالح من الخادم' }));
      if (res.status === 404) return { status: 'error', message: 'دالة ai-assistant غير منشورة في Supabase بعد' };
      return j;
    } catch (e) { return { status: 'error', message: 'تعذر الاتصال بالمساعد' }; }
  }

  async function refresh(list) {
    list = list || [];
    try {
      if (list.includes('personal') && typeof fetchPersonalDataFromServer === 'function') await fetchPersonalDataFromServer();
      if (list.includes('biz') && window.FGBiz) {
        const v = $('bizView'); if (v && v.style.display !== 'none' && v.innerHTML) FGBiz.refresh();
        if (typeof FGBiz.refreshTaskBadge === 'function') FGBiz.refreshTaskBadge();
      }
      if (list.includes('bookings')) {
        try { bookingsLoaded = false; } catch (e) {}
        const v = $('bookingsView'); if (v && v.style.display === 'block' && typeof loadBookings === 'function') loadBookings();
      }
      if (list.includes('subscribers') && typeof fetchDashboardData === 'function') fetchDashboardData(true, true);
    } catch (e) { console.warn('[FG AI] refresh', e); }
  }

  async function send(text) {
    text = String(text || input.value).trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true; input.value = ''; autosize();
    hist.push({ role: 'user', content: text }); save(); add('u', text); $('fgAiChips').innerHTML = '';
    const typing = document.createElement('div'); typing.className = 'fgai-typing'; typing.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> جارٍ التنفيذ...'; body.appendChild(typing); scroll();
    try {
      // مزامنة أي تعديل محلي على مهامي/مواعيدي قبل أن يعدّلها المساعد في الخادم
      try { if (typeof personalDataDirty !== 'undefined' && personalDataDirty && typeof pushPersonalDataToServer === 'function') await pushPersonalDataToServer(); } catch (e) {}
      const msgs = hist.filter(m => !m.err).slice(-14).map(m => ({ role: m.role, content: m.content }));
      const r = await call({ action: 'chat', messages: msgs, tz: TZ });
      typing.remove();
      if (r.status === 'expired') { add('e', 'انتهت الجلسة، أعد تسجيل الدخول.'); return; }
      const ok = r.status === 'success';
      const acts = (r.actions || []).map(a => a.tool);
      const reply = ok ? (r.reply || 'تم.') : (r.message || 'تعذر التنفيذ');
      hist.push({ role: 'assistant', content: reply, acts, err: !ok }); save();
      add(ok ? 'a' : 'e', reply, acts);
      (r.pending || []).forEach(addPending);
      if (acts.length) toast('نفّذ السكرتير ' + acts.length + ' عملية', 'fa-user-tie');
      await refresh(r.refresh);
    } finally { typing.remove(); busy = false; sendBtn.disabled = false; input.focus(); }
  }

  /* ---------- الصوت ---------- */
  let rec = null, chunks = [], stream = null;
  async function toggleMic() {
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast('المتصفح لا يدعم التسجيل الصوتي', 'fa-microphone-slash', 'danger'); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { toast('اسمح باستخدام الميكروفون', 'fa-microphone-slash', 'danger'); return; }
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined); chunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      micBtn.classList.remove('rec'); micBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      if (blob.size < 1200) { micBtn.innerHTML = '<i class="fas fa-microphone"></i>'; return; }
      const fd = new FormData(); fd.append('audio', blob, 'voice.' + (/mp4/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm')); fd.append('lang', 'ar');
      const r = await call(fd, true);
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      if (r.status === 'success' && r.text) send(r.text);
      else toast(r.message || 'لم أتمكن من فهم التسجيل', 'fa-microphone-slash', 'danger');
    };
    rec.start(); micBtn.classList.add('rec'); micBtn.innerHTML = '<i class="fas fa-stop"></i>';
    setTimeout(() => { if (rec && rec.state === 'recording') rec.stop(); }, 90000);
  }

  /* ---------- الأحداث ---------- */
  function autosize() { if (!input.value) { input.style.height = ''; return; } input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; }
  function openPanel() { load(); render(); panel.classList.add('open'); setTimeout(() => input.focus(), 50); }
  fab.onclick = () => panel.classList.contains('open') ? panel.classList.remove('open') : openPanel();
  $('fgAiClose').onclick = () => panel.classList.remove('open');
  $('fgAiClear').onclick = () => { hist = []; save(); render(); };
  sendBtn.onclick = () => send();
  micBtn.onclick = toggleMic;
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
  $('fgAiChips').addEventListener('click', e => { const c = e.target.closest('[data-chip]'); if (!c) return; const t = c.dataset.chip; if (/ $/.test(t)) { input.value = t; input.focus(); autosize(); } else send(t); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) panel.classList.remove('open'); });

  // إظهار الزر فقط لمن يملك صلاحية المساعد وبعد تسجيل الدخول
  function sync() { const ok = allowed(); fab.style.display = ok ? 'flex' : 'none'; document.body.classList.toggle('fgai-on', ok); if (!ok) panel.classList.remove('open'); }
  setInterval(sync, 1500); sync();
  window.FGAI = { open: openPanel, send, refresh };
})();
