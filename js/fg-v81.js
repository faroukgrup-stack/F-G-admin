/* =====================================================================
 *  لوحة إدارة مجموعة فاروق — إضافات V8.1
 *  - عرض الصفحات (الشهادات / التحقق / الأدوات الاستشارية) داخل إطار اللوحة
 *  - مرفقات الرسائل (رفع وتنزيل عبر Supabase Storage بروابط موقّعة)
 *  - حسابي: تغيير كلمة المرور للمسؤول الرئيسي والموظفين + الاسم والجوال
 *  - حذف التقييمات والبيانات الواردة (فردي / جماعي / الأقدم من عدد أيام)
 *  - إدارة الشركة: لوحة أداء KPIs + العملاء + المشاريع + المهام + المالية
 *  يعتمد على دوال اللوحة العامة: hasPerm, currentUser, apiStaffPost, showToast ...
 * ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const toast = (m, i, t) => (typeof showToast === 'function' ? showToast(m, i || 'fa-info-circle', t || '') : alert(m));
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const fmtNum = n => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const post = (action, extra) => apiStaffPost(action, extra || {});

  /* ---------------- CSS ---------------- */
  const css = document.createElement('style');
  css.textContent = `
  .fg-frame{width:100%;height:calc(100vh - 190px);min-height:520px;border:1px solid rgba(184,134,11,.25);border-radius:12px;background:#0b0d14;display:block}
  .frame-card:fullscreen{padding:8px;background:#0a0e16}.frame-card:fullscreen .fg-frame{height:calc(100vh - 80px)}
  .att-bar{display:flex;align-items:center;gap:10px;margin:4px 0 6px;flex-wrap:wrap}.att-hint{font-size:.75rem;color:#888}
  .att-list{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
  .att-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(184,134,11,.12);border:1px solid rgba(184,134,11,.35);color:#e9d9a6;border-radius:20px;padding:4px 10px;font-size:.78rem;max-width:100%}
  .att-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px}
  .att-chip button{background:none;border:none;color:#e74c3c;cursor:pointer;padding:0 2px}
  .att-chip.up{opacity:.6}
  .bub-att{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .bub-att a{cursor:pointer;text-decoration:none}
  .del-sel{border-color:#e74c3c!important;color:#e74c3c!important}
  .biz-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
  .biz-tabs .filter-chip{font-size:.88rem;padding:7px 14px}
  .biz-tabs .filter-chip.active,.biz-tabs .filter-chip:hover{border-color:var(--gold);color:var(--gold-light)}
  .biz-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-bottom:14px}
  .biz-kpi{background:var(--panel-bg);border:1px solid var(--border-gold);border-radius:var(--radius);padding:14px;box-shadow:var(--shadow)}
  .biz-kpi h4{font-size:.8rem;color:var(--text-muted);font-weight:500;margin-bottom:6px}
  .biz-kpi .v{font-size:1.5rem;font-weight:900;color:var(--gold-light)}
  .biz-kpi .s{font-size:.74rem;color:#8a93a6;margin-top:4px}
  .biz-kpi.good .v{color:#2ecc71}.biz-kpi.bad .v{color:#e74c3c}.biz-kpi.warn .v{color:#f39c12}
  .biz-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
  @media(max-width:900px){.biz-2col{grid-template-columns:1fr}}
  .biz-tbl{width:100%;border-collapse:collapse;font-size:.85rem}
  .biz-tbl th,.biz-tbl td{padding:9px 8px;border-bottom:1px solid rgba(255,255,255,.06);text-align:right;vertical-align:middle}
  .biz-tbl th{color:var(--gold-light);white-space:nowrap;font-weight:700}
  .biz-tbl tr:hover td{background:rgba(184,134,11,.05)}
  .b-st{display:inline-block;padding:2px 10px;border-radius:12px;font-size:.74rem;font-weight:700;border:1px solid currentColor;white-space:nowrap}
  .biz-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .biz-prog{height:7px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden;min-width:70px}
  .biz-prog>div{height:100%;background:linear-gradient(90deg,var(--gold),#2ecc71)}
  .biz-alert{display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border-radius:10px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.3);margin-bottom:8px;font-size:.85rem}
  .biz-alert.w{background:rgba(243,156,18,.08);border-color:rgba(243,156,18,.3)}
  .biz-alert.ok{background:rgba(46,204,113,.08);border-color:rgba(46,204,113,.3)}
  .biz-form .row2{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}
  @media(max-width:600px){.biz-form .row2{grid-template-columns:1fr}}
  .kanban{display:grid;grid-template-columns:repeat(4,minmax(220px,1fr));gap:12px;overflow-x:auto}
  .kan-col{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px;min-height:120px}
  .kan-col h5{font-size:.85rem;margin-bottom:8px;display:flex;justify-content:space-between;color:var(--gold-light)}
  .kan-card{background:var(--panel-bg);border:1px solid rgba(184,134,11,.2);border-radius:10px;padding:10px;margin-bottom:8px;cursor:pointer;font-size:.82rem}
  .kan-card:hover{border-color:var(--gold)}
  .kan-card .t{font-weight:700;margin-bottom:4px}.kan-card .m{color:#8a93a6;font-size:.74rem;display:flex;gap:8px;flex-wrap:wrap}
  .kan-card.over{border-color:#e74c3c}
  `;
  document.head.appendChild(css);

  /* ================================================================
   *  1) عرض الصفحات داخل إطار اللوحة
   * ================================================================ */
  const FGFrame = {
    src: '',
    open(src, title, icon, btn) {
      if (/certificates/.test(src) && !hasPerm('certificates')) { toast('ليس لديك صلاحية الشهادات', 'fa-lock', 'danger'); return; }
      if (/audit|investment/.test(src) && !hasPerm('use_audit_tools')) { toast('ليس لديك صلاحية الأدوات الاستشارية', 'fa-lock', 'danger'); return; }
      hideMainSections(); if (btn) markSidebar(btn);
      $('frameView').style.display = 'block';
      $('frameTitle').innerHTML = `<i class="fas ${icon || 'fa-window-maximize'}"></i> ${esc(title || '')}`;
      const f = $('frameEl');
      if (this.src !== src) { f.src = src; this.src = src; }
      if (typeof closeMobileMenu === 'function') closeMobileMenu();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    reload() { try { $('frameEl').contentWindow.location.reload(); } catch (e) { $('frameEl').src = this.src; } },
    print() { try { $('frameEl').contentWindow.focus(); $('frameEl').contentWindow.print(); } catch (e) { toast('تعذر الطباعة من الإطار', 'fa-print', 'danger'); } },
    fullscreen() { const c = document.querySelector('#frameView .frame-card'); if (document.fullscreenElement) document.exitFullscreen(); else if (c && c.requestFullscreen) c.requestFullscreen(); },
    popout() { if (this.src) window.open(this.src.replace(/[?&]embed=1/, ''), '_blank'); }
  };
  window.FGFrame = FGFrame;

  /* ================================================================
   *  2) مرفقات الرسائل
   * ================================================================ */
  const MAX_FILES = 10, MAX_SIZE = 20 * 1024 * 1024;
  const BLOCKED = /\.(exe|bat|cmd|com|msi|scr|ps1|vbs|js|jar|sh|apk|dll|html?|svg)$/i;
  const FGAtt = {
    pending: { compose: [], reply: [] },
    reset(ctx) { this.pending[ctx] = []; this.render(ctx); },
    count(ctx) { return (this.pending[ctx] || []).length; },
    pick(ctx) {
      const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true;
      inp.onchange = () => {
        const list = this.pending[ctx] || (this.pending[ctx] = []);
        [...inp.files].forEach(f => {
          if (list.length >= MAX_FILES) { toast('الحد الأقصى 10 ملفات', 'fa-exclamation', 'danger'); return; }
          if (f.size > MAX_SIZE) { toast('الملف ' + f.name + ' أكبر من 20 ميغابايت', 'fa-exclamation', 'danger'); return; }
          if (BLOCKED.test(f.name)) { toast('نوع الملف ' + f.name + ' غير مسموح', 'fa-ban', 'danger'); return; }
          list.push({ file: f });
        });
        this.render(ctx);
      };
      inp.click();
    },
    remove(ctx, i) { this.pending[ctx].splice(i, 1); this.render(ctx); },
    render(ctx) {
      const box = $('att-' + ctx); if (!box) return;
      box.innerHTML = (this.pending[ctx] || []).map((a, i) => `<span class="att-chip${a.uploading ? ' up' : ''}"><i class="fas ${a.uploading ? 'fa-spinner fa-spin' : 'fa-paperclip'}"></i><span title="${esc(a.file.name)}">${esc(a.file.name)}</span><small>${fmtSize(a.file.size)}</small><button type="button" onclick="FGAtt.remove('${ctx}',${i})" title="إزالة">✕</button></span>`).join('');
    },
    /** يرفع كل الملفات المعلّقة ويعيد مصفوفة المرفقات، أو null عند الفشل */
    async uploadAll(ctx) {
      const list = this.pending[ctx] || [], out = [];
      if (!list.length) return out;
      if (!FG.sb) { toast('Supabase غير مضبوط', 'fa-times', 'danger'); return null; }
      for (const a of list) {
        if (a.done) { out.push(a.done); continue; }
        a.uploading = true; this.render(ctx);
        try {
          const r = await post('attachmentupload', { name: a.file.name, size: String(a.file.size), type: a.file.type || '' });
          if (r.status !== 'success') throw new Error(r.message || 'تعذر تجهيز الرفع');
          const { error } = await FG.sb.storage.from(r.bucket).uploadToSignedUrl(r.path, r.token, a.file, { contentType: a.file.type || 'application/octet-stream' });
          if (error) throw new Error(error.message);
          a.done = { path: r.path, name: a.file.name, size: a.file.size, type: a.file.type || '' };
          out.push(a.done);
        } catch (e) {
          a.uploading = false; this.render(ctx);
          toast('فشل رفع ' + a.file.name + ': ' + (e.message || ''), 'fa-times', 'danger');
          return null;
        }
        a.uploading = false; this.render(ctx);
      }
      this.pending[ctx] = [];
      this.render(ctx);
      return out;
    },
    html(m) {
      const at = (m && m.attachments) || [];
      if (!at.length) return '';
      return '<div class="bub-att">' + at.map(a => {
        const img = /^image\//.test(a.type || '');
        return `<a class="att-chip" onclick="FGAtt.open('${esc(m.id)}','${esc(a.path).replace(/'/g, '&#39;')}',${img ? 1 : 0})" title="تنزيل"><i class="fas ${img ? 'fa-image' : /pdf/.test(a.type || '') ? 'fa-file-pdf' : 'fa-file-download'}"></i><span>${esc(a.name)}</span>${a.size ? `<small>${fmtSize(a.size)}</small>` : ''}</a>`;
      }).join('') + '</div>';
    },
    async open(mid, path, preview) {
      try {
        const r = await post('attachmenturl', { messageId: mid, path, download: preview ? '0' : '1' });
        if (r.status !== 'success') { toast(r.message || 'الملف غير متاح', 'fa-times', 'danger'); return; }
        window.open(r.url, '_blank', 'noopener');
      } catch (e) { toast('خطأ في الاتصال', 'fa-times', 'danger'); }
    }
  };
  window.FGAtt = FGAtt;

  /* ================================================================
   *  3) حسابي — تغيير كلمة المرور (للجميع)
   * ================================================================ */
  function modal(html, width) {
    const m = document.createElement('div'); m.className = 'modal'; m.style.display = 'flex';
    m.innerHTML = `<div class="modal-content biz-form" style="max-width:${width || 480}px">${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    return m;
  }
  const FGAccount = {
    open() {
      const u = (typeof currentUser !== 'undefined' && currentUser) || {};
      const m = modal(`
        <h3 style="margin-bottom:14px;"><i class="fas fa-user-shield"></i> حسابي</h3>
        <div style="background:rgba(184,134,11,.08);border:1px dashed var(--border-gold);border-radius:10px;padding:10px;margin-bottom:14px;font-size:.85rem">
          <div><b>البريد:</b> <span dir="ltr">${esc(u.email || '')}</span></div>
          <div><b>الدور:</b> ${u.isSuperAdmin || u.role === 'super' ? 'المسؤول الرئيسي' : 'موظف'}</div>
        </div>
        <label>الاسم الظاهر</label><input type="text" id="accName" value="${esc(u.name || '')}">
        <label>رقم الجوال</label><input type="text" id="accPhone" dir="ltr" value="${esc(localStorage.getItem('userPhone') || u.phone || '')}">
        <div class="modal-buttons" style="margin-bottom:16px"><button class="btn-save" id="accSaveProfile"><i class="fas fa-save"></i> حفظ البيانات</button></div>
        <h4 style="color:var(--gold-light);margin:6px 0 10px;border-top:1px solid #333;padding-top:14px"><i class="fas fa-key"></i> تغيير كلمة المرور</h4>
        <label>كلمة المرور الحالية</label><input type="password" id="accCur" autocomplete="current-password">
        <label>كلمة المرور الجديدة (8 أحرف على الأقل)</label><input type="password" id="accNew" autocomplete="new-password">
        <label>تأكيد كلمة المرور الجديدة</label><input type="password" id="accNew2" autocomplete="new-password">
        <div id="accStrength" style="font-size:.78rem;color:#888;margin:-6px 0 10px"></div>
        <div class="modal-buttons">
          <button class="btn-save" id="accSavePass"><i class="fas fa-key"></i> تغيير كلمة المرور</button>
          <button class="btn-cancel" id="accClose">إغلاق</button>
        </div>`);
      m.querySelector('#accClose').onclick = () => m.remove();
      m.querySelector('#accNew').oninput = e => {
        const v = e.target.value; let sc = 0;
        if (v.length >= 8) sc++; if (v.length >= 12) sc++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) sc++; if (/\d/.test(v)) sc++; if (/[^A-Za-z0-9]/.test(v)) sc++;
        const lbl = ['ضعيفة جداً', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية', 'قوية جداً'][sc], col = ['#e74c3c', '#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#2ecc71'][sc];
        m.querySelector('#accStrength').innerHTML = v ? `قوة كلمة المرور: <b style="color:${col}">${lbl}</b>` : '';
      };
      m.querySelector('#accSaveProfile').onclick = async e => {
        const b = e.currentTarget; b.disabled = true;
        const r = await FG.core('updatemyprofile', { fullName: m.querySelector('#accName').value.trim(), phone: m.querySelector('#accPhone').value.trim() });
        b.disabled = false;
        if (r.status !== 'success') { toast(r.message || 'فشل الحفظ', 'fa-times', 'danger'); return; }
        const nm = m.querySelector('#accName').value.trim();
        if (nm) { localStorage.setItem('userName', nm); try { currentUser.name = nm; applyPermissionsUI(); } catch (x) {} }
        localStorage.setItem('userPhone', m.querySelector('#accPhone').value.trim());
        toast('تم حفظ بيانات الحساب', 'fa-check-circle');
      };
      m.querySelector('#accSavePass').onclick = async e => {
        const cur = m.querySelector('#accCur').value, a = m.querySelector('#accNew').value, b2 = m.querySelector('#accNew2').value;
        if (!cur) { toast('أدخل كلمة المرور الحالية', 'fa-exclamation', 'danger'); return; }
        if (a.length < 8) { toast('كلمة المرور الجديدة 8 أحرف على الأقل', 'fa-exclamation', 'danger'); return; }
        if (a !== b2) { toast('كلمتا المرور غير متطابقتين', 'fa-exclamation', 'danger'); return; }
        const btn = e.currentTarget; btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التغيير...';
        const r = await FG.core('changemypassword', { currentPassword: cur, newPassword: a });
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-key"></i> تغيير كلمة المرور';
        if (r.status !== 'success') { toast(r.message || 'فشل تغيير كلمة المرور', 'fa-times', 'danger'); return; }
        toast('تم تغيير كلمة المرور بنجاح', 'fa-check-circle');
        m.remove();
      };
    }
  };
  window.FGAccount = FGAccount;

  /* ================================================================
   *  4) حذف التقييمات والبيانات الواردة
   * ================================================================ */
  window.selectAllRows = function (master, cls) { document.querySelectorAll('.' + cls).forEach(c => { c.checked = master.checked; }); updateSelCounts(); };
  window.updateSelCounts = function () {
    const r = document.querySelectorAll('.rt-cb:checked').length, i = document.querySelectorAll('.ib-cb:checked').length;
    if ($('ratingsSelCount')) $('ratingsSelCount').textContent = r ? '(' + r + ')' : '';
    if ($('inboundSelCount')) $('inboundSelCount').textContent = i ? '(' + i + ')' : '';
  };
  async function ratingsCall(payload) {
    const res = await fetch(SUPABASE_ADMIN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' });
    const d = await res.json().catch(() => ({}));
    if (d.message === 'fn') d.message = 'دالة admin في المنصة الشاملة قديمة: الصق النسخة V8.1 واضغط Deploy';
    return d;
  }
  window.deleteRatings = async function (ids) {
    if (!hasPerm('delete_records')) { toast('ليس لديك صلاحية الحذف', 'fa-lock', 'danger'); return; }
    if (!ids.length || !confirm(ids.length === 1 ? 'حذف هذا التقييم نهائياً؟' : 'حذف ' + ids.length + ' تقييم نهائياً؟')) return;
    const r = await ratingsCall({ fn: 'deleteRatings', ids });
    if (r.status !== 'success') { toast(r.message || 'فشل الحذف', 'fa-times', 'danger'); return; }
    const set = new Set(ids.map(String));
    inbound.ratings = (inbound.ratings || []).filter(x => !set.has(String(x.id)));
    renderRatings(); updateSelCounts();
    toast('تم حذف ' + (r.count || ids.length) + ' تقييم', 'fa-trash');
  };
  window.deleteSelectedRatings = function () {
    const ids = [...document.querySelectorAll('.rt-cb:checked')].map(c => c.value);
    if (!ids.length) { toast('حدد تقييماً واحداً على الأقل', 'fa-exclamation', 'danger'); return; }
    deleteRatings(ids);
  };
  window.purgeRatings = async function () {
    const d = parseInt(prompt('حذف كل التقييمات الأقدم من كم يوم؟', '180'), 10);
    if (!d || d < 1) return;
    if (!confirm('سيتم حذف كل التقييمات الأقدم من ' + d + ' يوم نهائياً. متابعة؟')) return;
    const r = await ratingsCall({ fn: 'deleteRatings', olderThanDays: d });
    if (r.status !== 'success') { toast(r.message || 'فشل الحذف', 'fa-times', 'danger'); return; }
    toast('تم حذف ' + (r.count || 0) + ' تقييم', 'fa-broom'); loadRatings(false);
  };
  window.deleteInbound = async function (ids) {
    if (!hasPerm('delete_records')) { toast('ليس لديك صلاحية الحذف', 'fa-lock', 'danger'); return; }
    if (!ids.length || !confirm(ids.length === 1 ? 'حذف هذا السجل نهائياً؟' : 'حذف ' + ids.length + ' سجل نهائياً؟')) return;
    const r = await post('inbounddelete', { ids: ids.join(',') });
    if (r.status !== 'success') { toast(r.message || 'فشل الحذف', 'fa-times', 'danger'); return; }
    toast(r.message || 'تم الحذف', 'fa-trash');
    delete inbound.cache[inbound.source]; loadInbound(false);
  };
  window.deleteSelectedInbound = function () {
    const ids = [...document.querySelectorAll('.ib-cb:checked')].map(c => parseInt(c.value, 10)).filter(Boolean);
    if (!ids.length) { toast('حدد سجلاً واحداً على الأقل', 'fa-exclamation', 'danger'); return; }
    deleteInbound(ids);
  };
  window.purgeInbound = async function () {
    const s = inbound.sheets[inbound.sheetIdx]; const key = inbound.source;
    const d = parseInt(prompt('حذف سجلات «' + (s ? sheetLabel(s.name) : '') + '» الأقدم من كم يوم؟', '180'), 10);
    if (!d || d < 1) return;
    if (!confirm('سيتم حذف السجلات الأقدم من ' + d + ' يوم من هذا القسم نهائياً. متابعة؟')) return;
    const r = await post('inboundpurge', { kind: key, sheet: s ? s.name : '', olderThanDays: String(d) });
    if (r.status !== 'success') { toast(r.message || 'فشل الحذف', 'fa-times', 'danger'); return; }
    toast(r.message, 'fa-broom'); delete inbound.cache[key]; loadInbound(false);
  };
  const FGCleanup = {
    open() {
      if (!hasPerm('delete_records')) { toast('ليس لديك صلاحية حذف السجلات', 'fa-lock', 'danger'); return; }
      const m = modal(`<h3 style="margin-bottom:14px;"><i class="fas fa-broom"></i> تنظيف البيانات القديمة</h3>
        <p style="font-size:.85rem;color:#aab;margin-bottom:12px">احذف السجلات القديمة غير المفيدة حتى لا تتراكم البيانات. يُنصح بالتصدير CSV قبل الحذف.</p>
        <label>القسم</label><select id="clSrc">
          ${hasPerm('inbound_ratings') ? '<option value="ratings">تقييمات المنصة الشاملة</option>' : ''}
          ${hasPerm('inbound_books') ? '<option value="books">تحميل الكتب</option>' : ''}
          ${hasPerm('inbound_diagnostics') ? '<option value="diagnostics">التشخيص والأدوات المجانية</option>' : ''}
          ${hasPerm('inbound_requests') ? '<option value="requests">طلبات المواقع</option>' : ''}
        </select>
        <label>حذف الأقدم من (يوم)</label><input type="number" id="clDays" value="180" min="1">
        <div class="modal-buttons"><button class="btn-save" id="clGo" style="background:#e74c3c;color:#fff"><i class="fas fa-trash"></i> حذف</button><button class="btn-cancel" id="clX">إلغاء</button></div>`);
      m.querySelector('#clX').onclick = () => m.remove();
      m.querySelector('#clGo').onclick = async () => {
        const src = m.querySelector('#clSrc').value, d = parseInt(m.querySelector('#clDays').value, 10);
        if (!src || !d || d < 1) return;
        if (!confirm('تأكيد الحذف النهائي للسجلات الأقدم من ' + d + ' يوم؟')) return;
        const r = src === 'ratings' ? await ratingsCall({ fn: 'deleteRatings', olderThanDays: d }) : await post('inboundpurge', { kind: src, olderThanDays: String(d) });
        if (r.status !== 'success') { toast(r.message || 'فشل', 'fa-times', 'danger'); return; }
        toast('تم حذف ' + (r.count || 0) + ' سجل', 'fa-broom');
        if (src === 'ratings') inbound.ratings = null; else delete inbound.cache[src];
        m.remove();
      };
    }
  };
  window.FGCleanup = FGCleanup;

  /* ================================================================
   *  5) إدارة الشركة
   * ================================================================ */
  const ST = {
    clients: { lead: ['عميل محتمل', '#3498db'], prospect: ['قيد التفاوض', '#f39c12'], active: ['عميل نشط', '#2ecc71'], inactive: ['غير نشط', '#888'] },
    projects: { planned: ['مخطط', '#3498db'], active: ['قيد التنفيذ', '#f39c12'], onhold: ['متوقف مؤقتاً', '#9b59b6'], done: ['مكتمل', '#2ecc71'], cancelled: ['ملغي', '#888'] },
    tasks: { todo: ['جديدة', '#3498db'], doing: ['قيد العمل', '#f39c12'], review: ['مراجعة', '#9b59b6'], done: ['منجزة', '#2ecc71'] },
    finance: { income: ['إيراد', '#2ecc71'], expense: ['مصروف', '#e74c3c'], receivable: ['مستحق لنا', '#3498db'], payable: ['مستحق علينا', '#f39c12'] }
  };
  const PRIO = { low: ['منخفضة', '#888'], normal: ['عادية', '#3498db'], high: ['عالية', '#e74c3c'] };
  const TABS = [
    ['dashboard', 'لوحة الأداء', 'fa-tachometer-alt', 'biz_reports'],
    ['clients', 'العملاء', 'fa-address-book', 'biz_crm'],
    ['projects', 'المشاريع', 'fa-project-diagram', 'biz_projects'],
    ['tasks', 'المهام', 'fa-tasks', null],
    ['finance', 'المالية', 'fa-coins', 'biz_finance']
  ];
  const badge = (ent, st) => { const x = (ST[ent] || {})[st]; return x ? `<span class="b-st" style="color:${x[1]}">${x[0]}</span>` : esc(st || '—'); };
  const D = { clients: null, projects: null, tasks: null, finance: null, staff: null };
  const ui = { tab: 'dashboard', q: '', f: 'all', sel: new Set(), taskView: 'board', month: '' };
  let charts = [];

  async function load(ent, force) {
    if (D[ent] && !force) return D[ent];
    const r = await post('bizlist', { entity: ent });
    if (r.status !== 'success') throw new Error(r.message || 'تعذر التحميل');
    D[ent] = r.data || [];
    return D[ent];
  }
  async function staff() {
    if (D.staff) return D.staff;
    try { const r = await post('liststaff'); D.staff = (r.data || []).filter(s => s.active !== false); } catch (e) { D.staff = []; }
    return D.staff;
  }
  const staffName = em => { const s = (D.staff || []).find(x => x.email === em); return s ? (s.fullName || s.email) : (em || '—'); };
  const titleOf = (ent, id) => { const r = (D[ent] || []).find(x => x.id === id); return r ? r.title : ''; };
  const canFull = ent => hasPerm({ clients: 'biz_crm', projects: 'biz_projects', tasks: 'biz_projects', finance: 'biz_finance' }[ent]);
  const myEmail = () => ((typeof currentUser !== 'undefined' && currentUser.email) || '').toLowerCase();

  const FGBiz = {
    async show(tab, btn) {
      const allowed = TABS.filter(t => !t[3] || hasPerm(t[3]));
      if (!allowed.find(t => t[0] === tab)) tab = allowed[0] ? allowed[0][0] : 'tasks';
      ui.tab = tab; ui.q = ''; ui.f = 'all'; ui.sel.clear();
      hideMainSections();
      if (!btn) btn = document.querySelector(`.sidebar-btn[onclick*="FGBiz.show('${tab}'"]`);
      if (btn) markSidebar(btn);
      const v = $('bizView'); v.style.display = 'block';
      if (typeof closeMobileMenu === 'function') closeMobileMenu();
      v.innerHTML = `<div class="biz-tabs">${allowed.map(t => `<span class="filter-chip${t[0] === tab ? ' active' : ''}" onclick="FGBiz.show('${t[0]}')"><i class="fas ${t[2]}"></i> ${t[1]}</span>`).join('')}</div><div id="bizBody"><div class="loader"></div></div>`;
      try {
        await staff();
        if (tab === 'dashboard') await renderDashboard();
        else {
          const needs = { clients: ['clients', 'projects', 'finance'], projects: ['projects', 'clients', 'tasks'], tasks: ['tasks', 'projects'], finance: ['finance', 'clients', 'projects'] }[tab];
          for (const e of needs) { if (e === tab || canFull(e) || (e === 'projects' && hasPerm('biz_projects'))) { try { await load(e, e === tab); } catch (x) { if (e === tab) throw x; D[e] = D[e] || []; } } else D[e] = D[e] || []; }
          renderList();
        }
      } catch (e) { $('bizBody').innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i> ${esc(e.message || 'تعذر التحميل')}<br><small>تأكد من تشغيل ملف الترحيل 20261123000004_v81.sql ونشر admin-core V8.1</small></div>`; }
    },
    refresh() { Object.keys(D).forEach(k => { if (k !== 'staff') D[k] = null; }); this.show(ui.tab); },
    search(v) { ui.q = v; renderTable(); },
    filter(v, el) { ui.f = v; document.querySelectorAll('#bizFilters .filter-chip').forEach(c => c.classList.toggle('active', c === el)); renderTable(); },
    toggle(id, on) { if (on) ui.sel.add(id); else ui.sel.delete(id); const c = $('bizSelCount'); if (c) c.textContent = ui.sel.size ? '(' + ui.sel.size + ')' : ''; },
    toggleAll(on) { document.querySelectorAll('.biz-cb').forEach(c => { c.checked = on; this.toggle(c.value, on); }); },
    setTaskView(v) { ui.taskView = v; renderList(); },
    setMonth(v) { ui.month = v; renderTable(); },
    edit(id) { openForm(ui.tab, id); },
    add() { openForm(ui.tab, null); },
    async del(ids) {
      ids = ids || [...ui.sel];
      if (!ids.length) { toast('حدد سجلاً واحداً على الأقل', 'fa-exclamation', 'danger'); return; }
      if (!confirm(ids.length === 1 ? 'حذف هذا السجل نهائياً؟' : 'حذف ' + ids.length + ' سجل نهائياً؟')) return;
      const r = await post('bizdelete', { entity: ui.tab, ids: ids.join(',') });
      if (r.status !== 'success') { toast(r.message || 'فشل الحذف', 'fa-times', 'danger'); return; }
      const set = new Set(ids); D[ui.tab] = (D[ui.tab] || []).filter(x => !set.has(x.id)); ui.sel.clear();
      toast('تم الحذف', 'fa-trash'); renderList();
    },
    exportCsv() { exportCsv(); },
    async quickStatus(id, st) {
      const rec = (D.tasks || []).find(x => x.id === id); if (!rec) return;
      const payload = canFull('tasks') ? Object.assign({}, rec, { status: st, data: Object.assign({}, rec.data, st === 'done' ? { progress: 100 } : {}) }) : { id, status: st, progress: st === 'done' ? 100 : (rec.data || {}).progress, note: (rec.data || {}).note };
      const r = await post('bizsave', { entity: 'tasks', record: JSON.stringify(payload) });
      if (r.status !== 'success') { toast(r.message || 'فشل', 'fa-times', 'danger'); return; }
      rec.status = st; if (st === 'done') rec.data = Object.assign({}, rec.data, { progress: 100 });
      renderList(); refreshTaskBadge();
    }
  };
  window.FGBiz = FGBiz;

  /* ---------- القوائم ---------- */
  const COLS = {
    clients: [['الاسم', r => `<b>${esc(r.title)}</b>${r.data.company ? `<br><small style="color:#888">${esc(r.data.company)}</small>` : ''}`], ['التواصل', r => `<span dir="ltr" style="font-size:.8rem">${esc(r.data.phone || '')}${r.data.email ? '<br>' + esc(r.data.email) : ''}</span>`], ['المصدر', r => esc(r.data.source || '—')], ['الحالة', r => badge('clients', r.status)], ['المسؤول', r => esc(r.assignedTo ? staffName(r.assignedTo) : '—')], ['القيمة المتوقعة', r => r.amount ? fmtNum(r.amount) + ' ' + esc(r.currency) : '—'], ['المشاريع', r => (D.projects || []).filter(p => p.clientId === r.id).length], ['المتابعة القادمة', r => r.dueDate ? `<span style="color:${r.dueDate < today() ? '#e74c3c' : 'inherit'}">${esc(r.dueDate)}</span>` : '—']],
    projects: [['المشروع', r => `<b>${esc(r.title)}</b>`], ['العميل', r => esc(titleOf('clients', r.clientId) || '—')], ['مدير المشروع', r => esc(r.assignedTo ? staffName(r.assignedTo) : '—')], ['الحالة', r => badge('projects', r.status)], ['البداية', r => esc(r.refDate || '—')], ['التسليم', r => r.dueDate ? `<span style="color:${r.dueDate < today() && r.status !== 'done' && r.status !== 'cancelled' ? '#e74c3c' : 'inherit'}">${esc(r.dueDate)}</span>` : '—'], ['الميزانية', r => r.amount ? fmtNum(r.amount) + ' ' + esc(r.currency) : '—'], ['الإنجاز', r => { const t = (D.tasks || []).filter(x => x.projectId === r.id), dn = t.filter(x => x.status === 'done').length, p = t.length ? Math.round(dn / t.length * 100) : (parseInt(r.data.progress, 10) || 0); return `<div class="biz-prog" title="${p}%"><div style="width:${p}%"></div></div><small>${p}% ${t.length ? `(${dn}/${t.length} مهمة)` : ''}</small>`; }]],
    tasks: [['المهمة', r => `<b>${esc(r.title)}</b>${r.data.note ? `<br><small style="color:#888">${esc(String(r.data.note).slice(0, 80))}</small>` : ''}`], ['المشروع', r => esc(titleOf('projects', r.projectId) || '—')], ['المكلَّف', r => esc(r.assignedTo ? staffName(r.assignedTo) : '—')], ['الأولوية', r => { const p = PRIO[r.data.priority || 'normal'] || PRIO.normal; return `<span class="b-st" style="color:${p[1]}">${p[0]}</span>`; }], ['الاستحقاق', r => r.dueDate ? `<span style="color:${r.dueDate < today() && r.status !== 'done' ? '#e74c3c' : 'inherit'}">${esc(r.dueDate)}</span>` : '—'], ['الحالة', r => badge('tasks', r.status)], ['الإنجاز', r => { const p = parseInt(r.data.progress, 10) || (r.status === 'done' ? 100 : 0); return `<div class="biz-prog"><div style="width:${p}%"></div></div><small>${p}%</small>`; }]],
    finance: [['البيان', r => `<b>${esc(r.title)}</b>${r.data.ref ? `<br><small style="color:#888" dir="ltr">${esc(r.data.ref)}</small>` : ''}`], ['النوع', r => badge('finance', r.status)], ['التصنيف', r => esc(r.data.category || '—')], ['المبلغ', r => `<b style="color:${r.status === 'income' || r.status === 'receivable' ? '#2ecc71' : '#e74c3c'}">${fmtNum(r.amount)} ${esc(r.currency)}</b>`], ['التاريخ', r => esc(r.refDate || '—')], ['العميل / المشروع', r => esc([titleOf('clients', r.clientId), titleOf('projects', r.projectId)].filter(Boolean).join(' / ') || '—')], ['السداد', r => (r.status === 'receivable' || r.status === 'payable') ? (r.data.paid ? '<span class="b-st" style="color:#2ecc71">مسدد</span>' : `<span class="b-st" style="color:${r.dueDate && r.dueDate < today() ? '#e74c3c' : '#f39c12'}">غير مسدد${r.dueDate ? ' · ' + esc(r.dueDate) : ''}</span>`) : '—']]
  };
  const NAMES = { clients: ['العملاء (CRM)', 'عميل', 'fa-address-book'], projects: ['المشاريع', 'مشروع', 'fa-project-diagram'], tasks: ['المهام وتوزيع العمل', 'مهمة', 'fa-tasks'], finance: ['المالية', 'حركة مالية', 'fa-coins'] };

  function filtered() {
    const ent = ui.tab, q = ui.q.trim().toLowerCase(), me = myEmail();
    return (D[ent] || []).filter(r => {
      if (ui.f === 'mine' && r.assignedTo !== me) return false;
      if (ui.f === 'overdue' && !(r.dueDate && r.dueDate < today() && r.status !== 'done' && r.status !== 'cancelled' && !(r.data || {}).paid)) return false;
      if (ui.f === 'unpaid' && !((r.status === 'receivable' || r.status === 'payable') && !(r.data || {}).paid)) return false;
      if (ST[ent][ui.f] && r.status !== ui.f) return false;
      if (ent === 'finance' && ui.month && String(r.refDate || '').slice(0, 7) !== ui.month) return false;
      return !q || JSON.stringify([r.title, r.data, r.assignedTo, titleOf('clients', r.clientId), titleOf('projects', r.projectId)]).toLowerCase().includes(q);
    });
  }
  function summaryCards() {
    const ent = ui.tab, L = D[ent] || [], t = today();
    const k = (h, v, s, cls) => `<div class="biz-kpi ${cls || ''}"><h4>${h}</h4><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
    if (ent === 'clients') return k('إجمالي العملاء', L.length) + k('عملاء نشطون', L.filter(r => r.status === 'active').length, '', 'good') + k('عملاء محتملون', L.filter(r => r.status === 'lead' || r.status === 'prospect').length, 'فرص بيع مفتوحة') + k('متابعات متأخرة', L.filter(r => r.dueDate && r.dueDate < t && r.status !== 'inactive').length, '', 'bad') + k('قيمة الفرص', fmtNum(L.filter(r => r.status === 'lead' || r.status === 'prospect').reduce((s, r) => s + r.amount, 0)), 'إجمالي القيمة المتوقعة');
    if (ent === 'projects') return k('إجمالي المشاريع', L.length) + k('قيد التنفيذ', L.filter(r => r.status === 'active').length, '', 'warn') + k('مكتملة', L.filter(r => r.status === 'done').length, '', 'good') + k('متأخرة عن التسليم', L.filter(r => r.dueDate && r.dueDate < t && r.status !== 'done' && r.status !== 'cancelled').length, '', 'bad') + k('إجمالي الميزانيات', fmtNum(L.filter(r => r.status !== 'cancelled').reduce((s, r) => s + r.amount, 0)));
    if (ent === 'tasks') { const me = myEmail(); return k('كل المهام', L.length) + k('مفتوحة', L.filter(r => r.status !== 'done').length, '', 'warn') + k('مهامي المفتوحة', L.filter(r => r.assignedTo === me && r.status !== 'done').length) + k('متأخرة', L.filter(r => r.dueDate && r.dueDate < t && r.status !== 'done').length, '', 'bad') + k('منجزة', L.filter(r => r.status === 'done').length, L.length ? Math.round(L.filter(r => r.status === 'done').length / L.length * 100) + '% معدل الإنجاز' : '', 'good'); }
    const M = ui.month ? L.filter(r => String(r.refDate || '').slice(0, 7) === ui.month) : L;
    const inc = M.filter(r => r.status === 'income').reduce((s, r) => s + r.amount, 0), exp = M.filter(r => r.status === 'expense').reduce((s, r) => s + r.amount, 0);
    const rec = L.filter(r => r.status === 'receivable' && !r.data.paid).reduce((s, r) => s + r.amount, 0), pay = L.filter(r => r.status === 'payable' && !r.data.paid).reduce((s, r) => s + r.amount, 0);
    return k('الإيرادات' + (ui.month ? ' (' + ui.month + ')' : ''), fmtNum(inc), '', 'good') + k('المصروفات' + (ui.month ? ' (' + ui.month + ')' : ''), fmtNum(exp), '', 'bad') + k('صافي الربح', fmtNum(inc - exp), inc ? 'هامش ' + Math.round((inc - exp) / inc * 100) + '%' : '', inc - exp >= 0 ? 'good' : 'bad') + k('مستحقات لنا غير محصلة', fmtNum(rec), '', 'warn') + k('مستحقات علينا', fmtNum(pay), '', 'warn');
  }
  function renderList() {
    const ent = ui.tab, full = canFull(ent), n = NAMES[ent];
    const chips = [['all', 'الكل']].concat(Object.entries(ST[ent]).map(([k, v]) => [k, v[0]]));
    if (ent === 'tasks') chips.splice(1, 0, ['mine', 'مهامي']);
    if (ent !== 'finance') chips.push(['overdue', 'متأخرة']); else chips.push(['unpaid', 'غير مسددة']);
    $('bizBody').innerHTML = `
      <div class="biz-grid">${summaryCards()}</div>
      <div class="table-container">
        <div class="table-header">
          <h3><i class="fas ${n[2]}"></i> ${n[0]} <span id="bizCount" style="font-size:.85rem;color:var(--text-muted);font-weight:400"></span></h3>
          <div class="biz-toolbar">
            <input type="text" class="search-box" placeholder="بحث..." oninput="FGBiz.search(this.value)" value="${esc(ui.q)}">
            ${ent === 'finance' ? `<input type="month" class="search-box" style="min-width:auto" value="${esc(ui.month)}" onchange="FGBiz.setMonth(this.value)" title="تصفية بالشهر">` : ''}
            ${ent === 'tasks' ? `<button class="btn-outline-sm" onclick="FGBiz.setTaskView('${ui.taskView === 'board' ? 'table' : 'board'}')"><i class="fas ${ui.taskView === 'board' ? 'fa-list' : 'fa-columns'}"></i> ${ui.taskView === 'board' ? 'جدول' : 'لوحة كانبان'}</button>` : ''}
            <button class="refresh-btn" onclick="FGBiz.refresh()"><i class="fas fa-sync-alt"></i> تحديث</button>
            <button class="btn-outline-sm" onclick="FGBiz.exportCsv()"><i class="fas fa-file-csv"></i> تصدير</button>
            ${full ? `<button class="btn-outline-sm del-sel" onclick="FGBiz.del()"><i class="fas fa-trash"></i> حذف المحدد <span id="bizSelCount"></span></button><button class="btn-sm" onclick="FGBiz.add()"><i class="fas fa-plus"></i> ${n[1]} جديد${ent === 'tasks' || ent === 'finance' ? 'ة' : ''}</button>` : ''}
          </div>
        </div>
        <div class="filter-chips" id="bizFilters">${chips.map(([k, l]) => `<span class="filter-chip${ui.f === k ? ' active' : ''}" onclick="FGBiz.filter('${k}', this)">${l}</span>`).join('')}</div>
        <div id="bizTable"></div>
      </div>`;
    renderTable();
  }
  function renderTable() {
    const ent = ui.tab, full = canFull(ent), rows = filtered(), box = $('bizTable'); if (!box) return;
    $('bizCount').textContent = '(' + rows.length + ')';
    if (ent === 'tasks' && ui.taskView === 'board') {
      const t = today();
      box.innerHTML = `<div class="kanban">${Object.entries(ST.tasks).map(([k, v]) => { const L = rows.filter(r => r.status === k); return `<div class="kan-col"><h5><span style="color:${v[1]}">${v[0]}</span><span>${L.length}</span></h5>${L.map(r => { const p = PRIO[r.data.priority || 'normal'] || PRIO.normal, over = r.dueDate && r.dueDate < t && k !== 'done'; return `<div class="kan-card${over ? ' over' : ''}" onclick="FGBiz.edit('${r.id}')"><div class="t">${esc(r.title)}</div><div class="m"><span style="color:${p[1]}"><i class="fas fa-flag"></i> ${p[0]}</span>${r.assignedTo ? `<span><i class="fas fa-user"></i> ${esc(staffName(r.assignedTo))}</span>` : ''}${r.dueDate ? `<span style="color:${over ? '#e74c3c' : ''}"><i class="fas fa-calendar"></i> ${esc(r.dueDate)}</span>` : ''}${r.projectId ? `<span><i class="fas fa-project-diagram"></i> ${esc(titleOf('projects', r.projectId))}</span>` : ''}</div><div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap" onclick="event.stopPropagation()">${Object.entries(ST.tasks).filter(([s]) => s !== k).map(([s, sv]) => `<button class="btn-outline-sm" style="padding:2px 7px;font-size:.7rem;border-color:${sv[1]};color:${sv[1]}" onclick="FGBiz.quickStatus('${r.id}','${s}')">${sv[0]}</button>`).join('')}</div></div>`; }).join('') || '<div class="empty-state" style="padding:8px">—</div>'}</div>`; }).join('')}</div>`;
      return;
    }
    if (!rows.length) { box.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i> لا توجد سجلات${full ? ' — اضغط «جديد» للإضافة' : ''}</div>`; return; }
    const cols = COLS[ent];
    box.innerHTML = `<table class="biz-tbl"><thead><tr>${full ? '<th><input type="checkbox" onchange="FGBiz.toggleAll(this.checked)"></th>' : ''}${cols.map(c => `<th>${c[0]}</th>`).join('')}<th></th></tr></thead><tbody>${rows.slice(0, 1000).map(r => `<tr>${full ? `<td><input type="checkbox" class="biz-cb" value="${r.id}" ${ui.sel.has(r.id) ? 'checked' : ''} onchange="FGBiz.toggle(this.value,this.checked)"></td>` : ''}${cols.map(c => `<td>${c[1](r)}</td>`).join('')}<td style="white-space:nowrap"><button class="action-btn edit-btn" onclick="FGBiz.edit('${r.id}')" title="تعديل"><i class="fas fa-edit"></i></button>${full ? ` <button class="action-btn delete-btn-action" onclick="FGBiz.del(['${r.id}'])" title="حذف"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`).join('')}</tbody></table>`;
  }
  function exportCsv() {
    const ent = ui.tab, rows = filtered();
    const H = ['العنوان', 'الحالة', 'المبلغ', 'العملة', 'التاريخ', 'الاستحقاق', 'المسؤول', 'العميل', 'المشروع', 'تفاصيل'];
    downloadCSV(NAMES[ent][0], H, rows.map(r => [r.title, ((ST[ent] || {})[r.status] || [r.status])[0], r.amount, r.currency, r.refDate || '', r.dueDate || '', r.assignedTo || '', titleOf('clients', r.clientId), titleOf('projects', r.projectId), JSON.stringify(r.data || {})]));
  }

  /* ---------- نموذج الإضافة / التعديل ---------- */
  function opts(map, sel) { return Object.entries(map).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${Array.isArray(v) ? v[0] : v}</option>`).join(''); }
  function recOpts(ent, sel) { return '<option value="">— بدون —</option>' + (D[ent] || []).map(r => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.title)}</option>`).join(''); }
  function staffOpts(sel) { return '<option value="">— غير محدد —</option>' + (D.staff || []).map(s => `<option value="${esc(s.email)}" ${s.email === sel ? 'selected' : ''}>${esc(s.fullName || s.email)}</option>`).join(''); }
  const CUR = ['USD', 'TRY', 'EUR', 'SAR', 'AED', 'SYP'];
  function openForm(ent, id) {
    const r = id ? (D[ent] || []).find(x => x.id === id) : null;
    const d = (r && r.data) || {}, full = canFull(ent), n = NAMES[ent];
    const v = (x, def) => esc(x == null || x === '' ? (def || '') : x);
    let body = '';
    if (ent === 'tasks' && !full) {
      body = `<div style="background:rgba(0,0,0,.2);border-radius:10px;padding:10px;margin-bottom:12px;font-size:.88rem"><b>${esc(r.title)}</b><br><small>${esc(titleOf('projects', r.projectId) || '')} ${r.dueDate ? '· الاستحقاق ' + esc(r.dueDate) : ''}</small>${d.desc ? `<p style="margin-top:6px;white-space:pre-wrap">${esc(d.desc)}</p>` : ''}</div>
        <div class="row2"><div><label>الحالة</label><select id="bf_status">${opts(ST.tasks, r.status)}</select></div><div><label>نسبة الإنجاز %</label><input type="number" id="bf_progress" min="0" max="100" value="${v(d.progress, 0)}"></div></div>
        <label>ملاحظاتي / تحديث الحالة</label><textarea id="bf_note" rows="4">${v(d.note)}</textarea>`;
    } else if (ent === 'clients') {
      body = `<div class="row2"><div><label>اسم العميل *</label><input id="bf_title" value="${v(r && r.title)}"></div><div><label>الشركة / النشاط</label><input id="bf_company" value="${v(d.company)}"></div></div>
        <div class="row2"><div><label>الجوال</label><input id="bf_phone" dir="ltr" value="${v(d.phone)}"></div><div><label>البريد</label><input id="bf_email" dir="ltr" value="${v(d.email)}"></div></div>
        <div class="row2"><div><label>الحالة</label><select id="bf_status">${opts(ST.clients, r && r.status)}</select></div><div><label>مصدر العميل</label><input id="bf_source" list="bf_srcs" value="${v(d.source)}"><datalist id="bf_srcs"><option>الموقع</option><option>حجز استشارة</option><option>إحالة</option><option>وسائل التواصل</option><option>معرض / فعالية</option><option>دورة تدريبية</option></datalist></div></div>
        <div class="row2"><div><label>المدينة / الدولة</label><input id="bf_city" value="${v(d.city)}"></div><div><label>الموظف المسؤول</label><select id="bf_assigned">${staffOpts(r && r.assignedTo)}</select></div></div>
        <div class="row2"><div><label>القيمة المتوقعة</label><input type="number" id="bf_amount" step="0.01" value="${v(r && r.amount, '')}"></div><div><label>العملة</label><select id="bf_currency">${CUR.map(c => `<option ${c === (r ? r.currency : 'USD') ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
        <label>موعد المتابعة القادمة</label><input type="date" id="bf_due" value="${v(r && r.dueDate)}">
        <label>ملاحظات</label><textarea id="bf_notes" rows="3">${v(d.notes)}</textarea>`;
    } else if (ent === 'projects') {
      body = `<label>اسم المشروع *</label><input id="bf_title" value="${v(r && r.title)}">
        <div class="row2"><div><label>العميل</label><select id="bf_client">${recOpts('clients', r && r.clientId)}</select></div><div><label>مدير المشروع</label><select id="bf_assigned">${staffOpts(r && r.assignedTo)}</select></div></div>
        <div class="row2"><div><label>الحالة</label><select id="bf_status">${opts(ST.projects, r && r.status)}</select></div><div><label>نوع الخدمة</label><input id="bf_service" list="bf_svcs" value="${v(d.service)}"><datalist id="bf_svcs"><option>استشارة إدارية</option><option>دراسة جدوى</option><option>تدقيق أعمال</option><option>هندسة قائمة الطعام</option><option>تدريب</option><option>تأسيس مطعم</option></datalist></div></div>
        <div class="row2"><div><label>تاريخ البداية</label><input type="date" id="bf_ref" value="${v(r && r.refDate)}"></div><div><label>تاريخ التسليم</label><input type="date" id="bf_due" value="${v(r && r.dueDate)}"></div></div>
        <div class="row2"><div><label>الميزانية / قيمة العقد</label><input type="number" step="0.01" id="bf_amount" value="${v(r && r.amount, '')}"></div><div><label>العملة</label><select id="bf_currency">${CUR.map(c => `<option ${c === (r ? r.currency : 'USD') ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
        <label>نسبة الإنجاز اليدوية % (تُحسب تلقائياً من المهام إن وُجدت)</label><input type="number" id="bf_progress" min="0" max="100" value="${v(d.progress, 0)}">
        <label>الوصف والأهداف</label><textarea id="bf_desc" rows="3">${v(d.desc)}</textarea>`;
    } else if (ent === 'tasks') {
      body = `<label>عنوان المهمة *</label><input id="bf_title" value="${v(r && r.title)}">
        <div class="row2"><div><label>المشروع</label><select id="bf_project">${recOpts('projects', r && r.projectId)}</select></div><div><label>إسناد إلى</label><select id="bf_assigned">${staffOpts(r ? r.assignedTo : '')}</select></div></div>
        <div class="row2"><div><label>الأولوية</label><select id="bf_priority">${opts(PRIO, d.priority || 'normal')}</select></div><div><label>الحالة</label><select id="bf_status">${opts(ST.tasks, r && r.status)}</select></div></div>
        <div class="row2"><div><label>تاريخ الاستحقاق</label><input type="date" id="bf_due" value="${v(r && r.dueDate)}"></div><div><label>نسبة الإنجاز %</label><input type="number" id="bf_progress" min="0" max="100" value="${v(d.progress, 0)}"></div></div>
        <label>الوصف</label><textarea id="bf_desc" rows="3">${v(d.desc)}</textarea>
        <label>ملاحظات التنفيذ</label><textarea id="bf_note" rows="2">${v(d.note)}</textarea>
        <small style="color:#888">سيصل للموظف المكلَّف إشعار فوري عند الإسناد.</small>`;
    } else if (ent === 'finance') {
      body = `<label>البيان *</label><input id="bf_title" value="${v(r && r.title)}" placeholder="مثال: دفعة أولى — مشروع مطعم ...">
        <div class="row2"><div><label>النوع</label><select id="bf_status">${opts(ST.finance, r && r.status)}</select></div><div><label>التصنيف</label><input id="bf_category" list="bf_cats" value="${v(d.category)}"><datalist id="bf_cats"><option>استشارات</option><option>تدريب ودورات</option><option>اشتراكات المنصات</option><option>رواتب</option><option>إيجار</option><option>تسويق وإعلانات</option><option>اشتراكات برمجية</option><option>سفر ومواصلات</option><option>ضرائب ورسوم</option></datalist></div></div>
        <div class="row2"><div><label>المبلغ *</label><input type="number" step="0.01" id="bf_amount" value="${v(r && r.amount, '')}"></div><div><label>العملة</label><select id="bf_currency">${CUR.map(c => `<option ${c === (r ? r.currency : 'USD') ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
        <div class="row2"><div><label>التاريخ</label><input type="date" id="bf_ref" value="${v(r ? r.refDate : today())}"></div><div><label>تاريخ الاستحقاق (للمستحقات)</label><input type="date" id="bf_due" value="${v(r && r.dueDate)}"></div></div>
        <div class="row2"><div><label>العميل</label><select id="bf_client">${recOpts('clients', r && r.clientId)}</select></div><div><label>المشروع</label><select id="bf_project">${recOpts('projects', r && r.projectId)}</select></div></div>
        <div class="row2"><div><label>رقم الفاتورة / المرجع</label><input id="bf_ref2" dir="ltr" value="${v(d.ref)}"></div><div><label>طريقة الدفع</label><input id="bf_method" list="bf_meths" value="${v(d.method)}"><datalist id="bf_meths"><option>تحويل بنكي</option><option>نقداً</option><option>بطاقة</option><option>PayPal</option><option>Entervia</option></datalist></div></div>
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="bf_paid" style="width:auto;margin:0" ${d.paid ? 'checked' : ''}> تم السداد / التحصيل</label>
        <label>ملاحظات</label><textarea id="bf_notes" rows="2">${v(d.notes)}</textarea>`;
    }
    const m = modal(`<h3 style="margin-bottom:14px;"><i class="fas ${n[2]}"></i> ${r ? 'تعديل' : 'إضافة'} ${n[1]}</h3>${body}
      <div class="modal-buttons"><button class="btn-save" id="bfSave"><i class="fas fa-save"></i> حفظ</button>${r && full ? '<button class="btn-cancel" id="bfDel" style="border-color:#e74c3c;color:#e74c3c"><i class="fas fa-trash"></i> حذف</button>' : ''}<button class="btn-cancel" id="bfX">إلغاء</button></div>`, 640);
    const g = sel => { const el = m.querySelector('#' + sel); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : undefined; };
    m.querySelector('#bfX').onclick = () => m.remove();
    if (m.querySelector('#bfDel')) m.querySelector('#bfDel').onclick = async () => { m.remove(); await FGBiz.del([r.id]); };
    m.querySelector('#bfSave').onclick = async e => {
      let rec;
      if (ent === 'tasks' && !full) rec = { id: r.id, status: g('bf_status'), progress: g('bf_progress'), note: g('bf_note') };
      else {
        const data = {};
        const map = { clients: ['company', 'phone', 'email', 'source', 'city', 'notes'], projects: ['service', 'progress', 'desc'], tasks: ['priority', 'progress', 'desc', 'note'], finance: ['category', 'method', 'notes', 'paid'] }[ent];
        map.forEach(k => { const val = g('bf_' + k); if (val !== undefined && val !== '') data[k] = k === 'progress' ? (parseInt(val, 10) || 0) : val; });
        if (ent === 'finance') data.ref = g('bf_ref2');
        if (ent === 'tasks' && g('bf_status') === 'done') data.progress = 100;
        rec = { id: r ? r.id : '', title: g('bf_title'), status: g('bf_status'), amount: g('bf_amount'), currency: g('bf_currency'), refDate: g('bf_ref'), dueDate: g('bf_due'), assignedTo: g('bf_assigned'), clientId: g('bf_client'), projectId: g('bf_project'), data };
        if (!rec.title) { toast('العنوان / الاسم مطلوب', 'fa-exclamation', 'danger'); return; }
        if (ent === 'finance' && !(parseFloat(rec.amount) > 0)) { toast('أدخل مبلغاً صحيحاً', 'fa-exclamation', 'danger'); return; }
      }
      const b = e.currentTarget; b.disabled = true; b.innerHTML = '<i class="fas fa-spinner fa-spin"></i> حفظ...';
      const res = await post('bizsave', { entity: ent, record: JSON.stringify(rec) });
      b.disabled = false; b.innerHTML = '<i class="fas fa-save"></i> حفظ';
      if (res.status !== 'success') { toast(res.message || 'فشل الحفظ', 'fa-times', 'danger'); return; }
      m.remove(); toast('تم الحفظ', 'fa-check-circle');
      await load(ent, true).catch(() => {});
      if (ui.tab === ent) renderList();
      if (ent === 'tasks') refreshTaskBadge();
    };
  }

  /* ---------- لوحة الأداء ---------- */
  async function renderDashboard() {
    const r = await post('bizdashboard');
    if (r.status !== 'success') throw new Error(r.message || 'تعذر تحميل لوحة الأداء');
    const X = r.data, recs = X.records || [], t = today(), ym = t.slice(0, 7);
    ['clients', 'projects', 'tasks', 'finance'].forEach(e => { D[e] = recs.filter(x => x.entity === e); });
    const C = D.clients, P = D.projects, T = D.tasks, F = D.finance;
    const sum = (L, st, m) => L.filter(x => x.status === st && (!m || String(x.refDate || '').slice(0, 7) === m)).reduce((s, x) => s + x.amount, 0);
    const incM = sum(F, 'income', ym), expM = sum(F, 'expense', ym);
    const lastYm = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
    const incL = sum(F, 'income', lastYm);
    const growth = incL ? Math.round((incM - incL) / incL * 100) : null;
    const recv = F.filter(x => x.status === 'receivable' && !x.data.paid), recvOver = recv.filter(x => x.dueDate && x.dueDate < t);
    const openT = T.filter(x => x.status !== 'done'), overT = openT.filter(x => x.dueDate && x.dueDate < t);
    const overP = P.filter(x => x.dueDate && x.dueDate < t && x.status !== 'done' && x.status !== 'cancelled');
    const followC = C.filter(x => x.dueDate && x.dueDate <= t && x.status !== 'inactive');
    const leads = C.filter(x => x.status === 'lead' || x.status === 'prospect').length, act = C.filter(x => x.status === 'active').length;
    const conv = C.length ? Math.round(act / C.length * 100) : 0;
    const bk = X.bookings || [], bkDone = bk.filter(b => b.status === 'completed').length, bkCanc = bk.filter(b => b.status === 'cancelled').length;
    const yr = t.slice(0, 4), certY = (X.certificates || []).filter(c => String(c.issue_date).slice(0, 4) === yr && !c.revoked).length;
    const inb = X.inbound || [];
    const k = (h, v, s, cls, ic) => `<div class="biz-kpi ${cls || ''}"><h4>${ic ? `<i class="fas ${ic}"></i> ` : ''}${h}</h4><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
    // workload
    const wl = (X.staff || []).filter(s => s.active).map(s => { const mine = T.filter(x => x.assignedTo === s.email); return { s, open: mine.filter(x => x.status !== 'done').length, over: mine.filter(x => x.status !== 'done' && x.dueDate && x.dueDate < t).length, done: mine.filter(x => x.status === 'done').length }; }).sort((a, b) => b.open - a.open);
    const alerts = [];
    overT.slice(0, 5).forEach(x => alerts.push(['', `مهمة متأخرة: <b>${esc(x.title)}</b> — ${esc(staffName(x.assignedTo))} (استحقاق ${esc(x.dueDate)})`]));
    overP.slice(0, 3).forEach(x => alerts.push(['', `مشروع تجاوز موعد التسليم: <b>${esc(x.title)}</b> (${esc(x.dueDate)})`]));
    recvOver.slice(0, 3).forEach(x => alerts.push(['w', `مستحق متأخر التحصيل: <b>${esc(x.title)}</b> — ${fmtNum(x.amount)} ${esc(x.currency)}`]));
    followC.slice(0, 3).forEach(x => alerts.push(['w', `متابعة عميل مستحقة: <b>${esc(x.title)}</b> (${esc(x.dueDate)})`]));
    if (expM > incM && incM > 0) alerts.push(['', 'مصروفات هذا الشهر أعلى من الإيرادات — راجع بنود الإنفاق.']);
    if (!alerts.length) alerts.push(['ok', 'لا توجد تنبيهات حرجة — كل شيء ضمن الخطة.']);
    $('bizBody').innerHTML = `
      <div class="biz-grid">
        ${k('إيرادات الشهر', fmtNum(incM), growth == null ? 'لا توجد بيانات للشهر السابق' : (growth >= 0 ? '▲ ' : '▼ ') + Math.abs(growth) + '% عن الشهر السابق', 'good', 'fa-arrow-down')}
        ${k('مصروفات الشهر', fmtNum(expM), '', 'bad', 'fa-arrow-up')}
        ${k('صافي ربح الشهر', fmtNum(incM - expM), incM ? 'هامش ' + Math.round((incM - expM) / incM * 100) + '%' : '', incM - expM >= 0 ? 'good' : 'bad', 'fa-balance-scale')}
        ${k('مستحقات غير محصلة', fmtNum(recv.reduce((s, x) => s + x.amount, 0)), recvOver.length + ' متأخرة', recvOver.length ? 'warn' : '', 'fa-hand-holding-usd')}
        ${k('العملاء النشطون', act, leads + ' فرصة · تحويل ' + conv + '%', '', 'fa-users')}
        ${k('مشاريع قيد التنفيذ', P.filter(x => x.status === 'active').length, overP.length + ' متأخرة', overP.length ? 'warn' : '', 'fa-project-diagram')}
        ${k('المهام المفتوحة', openT.length, overT.length + ' متأخرة · إنجاز ' + (T.length ? Math.round((T.length - openT.length) / T.length * 100) : 0) + '%', overT.length ? 'bad' : '', 'fa-tasks')}
        ${k('حجوزات آخر 90 يوماً', bk.length, bkDone + ' مكتملة · ' + bkCanc + ' ملغاة', '', 'fa-calendar-check')}
        ${k('شهادات ' + yr, certY, 'صادرة هذا العام', '', 'fa-award')}
        ${k('بيانات واردة (30 يوماً)', inb.length, ['books', 'diagnostics', 'requests'].map(kk => ({ books: 'كتب', diagnostics: 'تشخيص', requests: 'طلبات' })[kk] + ' ' + inb.filter(i => i.kind === kk).length).join(' · '), '', 'fa-inbox')}
      </div>
      <div class="biz-2col">
        <div class="table-container"><div class="table-header"><h3><i class="fas fa-chart-line"></i> الإيرادات والمصروفات — آخر 6 أشهر</h3></div><div style="height:260px"><canvas id="bizChartFin"></canvas></div></div>
        <div class="table-container"><div class="table-header"><h3><i class="fas fa-bell"></i> تنبيهات ذكية</h3></div>${alerts.map(a => `<div class="biz-alert ${a[0]}"><i class="fas ${a[0] === 'ok' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i><div>${a[1]}</div></div>`).join('')}</div>
      </div>
      <div class="biz-2col">
        <div class="table-container"><div class="table-header"><h3><i class="fas fa-user-clock"></i> عبء العمل على الموظفين</h3></div>
          <table class="biz-tbl"><thead><tr><th>الموظف</th><th>مفتوحة</th><th>متأخرة</th><th>منجزة</th><th>آخر دخول</th></tr></thead><tbody>${wl.map(w => `<tr><td>${esc(w.s.name || w.s.email)}</td><td>${w.open}</td><td style="color:${w.over ? '#e74c3c' : 'inherit'}">${w.over}</td><td style="color:#2ecc71">${w.done}</td><td style="font-size:.78rem;color:#aab">${w.s.lastLogin ? new Date(w.s.lastLogin).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td></tr>`).join('') || '<tr><td colspan="5">—</td></tr>'}</tbody></table></div>
        <div class="table-container"><div class="table-header"><h3><i class="fas fa-chart-pie"></i> المصروفات حسب التصنيف (هذا العام)</h3></div><div style="height:260px"><canvas id="bizChartCat"></canvas></div></div>
      </div>`;
    // charts
    charts.forEach(c => { try { c.destroy(); } catch (e) {} }); charts = [];
    if (window.Chart) {
      const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push(d.toISOString().slice(0, 7)); }
      charts.push(new Chart($('bizChartFin'), { type: 'bar', data: { labels: months, datasets: [{ label: 'الإيرادات', data: months.map(m => sum(F, 'income', m)), backgroundColor: 'rgba(46,204,113,.6)' }, { label: 'المصروفات', data: months.map(m => sum(F, 'expense', m)), backgroundColor: 'rgba(231,76,60,.6)' }, { type: 'line', label: 'الصافي', data: months.map(m => sum(F, 'income', m) - sum(F, 'expense', m)), borderColor: '#d4b15a', backgroundColor: '#d4b15a', tension: .3 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#ccc', font: { family: 'Tajawal' } } } }, scales: { x: { ticks: { color: '#aaa' } }, y: { ticks: { color: '#aaa' } } } } }));
      const cats = {}; F.filter(x => x.status === 'expense' && String(x.refDate || '').slice(0, 4) === yr).forEach(x => { const c = x.data.category || 'غير مصنف'; cats[c] = (cats[c] || 0) + x.amount; });
      const ck = Object.keys(cats);
      if (ck.length) charts.push(new Chart($('bizChartCat'), { type: 'doughnut', data: { labels: ck, datasets: [{ data: ck.map(c => cats[c]), backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#9b59b6', '#2ecc71', '#d4b15a', '#1abc9c', '#e67e22', '#95a5a6'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#ccc', font: { family: 'Tajawal' } } } } } }));
      else $('bizChartCat').parentElement.innerHTML = '<div class="empty-state">لا توجد مصروفات مسجلة هذا العام</div>';
    }
  }

  /* ---------- شارة مهامي ---------- */
  async function refreshTaskBadge() {
    try {
      const r = await post('bizlist', { entity: 'tasks' });
      if (r.status !== 'success') return;
      const me = myEmail(), n = (r.data || []).filter(x => x.assignedTo === me && x.status !== 'done').length;
      const b = $('bizTaskBadge'); if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; }
    } catch (e) {}
  }
  window.FGBiz.refreshTaskBadge = refreshTaskBadge;
  // بعد تسجيل الدخول
  const startBadge = () => { if (localStorage.getItem('userToken')) { setTimeout(refreshTaskBadge, 4000); setInterval(refreshTaskBadge, 5 * 60 * 1000); } };
  if (document.readyState === 'complete') startBadge(); else window.addEventListener('load', startBadge);
})();
