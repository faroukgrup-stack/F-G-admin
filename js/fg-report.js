/* مجموعة فاروق – مولّد التقارير التشخيصية القابلة للطباعة (نفس تصميم تقرير البريد) */
(function () {
  'use strict';
  const GOLD = '#b8860b';
  const MQ = ["تفرض أن الموظفين يجب عليهم أن يخبروك بما يرغبون فيه من عملهم وسيفعلون ذلك؟", "تعتقد أن الاحتفاظ بالموظفين هو وظيفة قسم الموارد البشرية أو مختصي التعويضات؟", "تعد المسارات المهنية للموظفين من شأنهم هم وليست من شأنك؟", "تعد معرفة الموظفين باحترامك لهم أمرًا مسلما به ولهذا أنت لا تحتاج إلى أن تظهر ذلك؟", "تعتقد أنه يجب على الموظفين أن يخبروك إذا لم يشعروا بالتحدي في عملهم؟", "تتوقع من الموظفين ترك حياتهم الشخصية عند الباب والشعور بأن حياتهم العملية فحسب في موضع اهتمامك؟", "تتجنب مناقشة الخيارات المهنية مع الموظفين خاصة عندما لا تكون الترقيات متاحة بسهولة؟", "توظف بصفة أساسية بناءً على المهارات العملية أو الفنية؟", "تمنح معلومات للموظفين عندما تكون هناك حاجة إلى معرفتها فحسب؟", "تعتقد أنك هنا لتأدية الوظيفة وأنه ليس على الموظفين أن يحبوك؟", "تعتقد أنك لست في العمل لك تحظى بالمرح؟", "تخشى أنك إذا قدمت الموظفين إلى آخرين في شبكتك، فإنهم قد يغرونهم بترك؟", "تشعر أنه ليس لديك وقت للإرشاد؟", "هل تدرك فعلاً كم يكلفك فقدان الموظفين الأكفاء والمتميزين؟", "تميل إلى اكتناز الأشخاص الجيدين بدلا من مساعدتهم على السعي وراء فرص أخرى؟", "تتفق على أننا لا نملك رفاهية محبة ما نقوم به؟", "تفشل في التشكيك في السياسات لصالح موظفيك؟", "تعتبر العمل الجيد مكافأة في حد ذاته؟", "تعتقد أنك إذا لم تتحكم في الأشخاص والكيفية والأماكن والوقت فإن العمل لن يتم على نحو جيد؟", "تتجنب منح تقييم سلبي أو تصحيح لموظفيك؟", "تعتبر نفسك منشغلا للغاية إلى حد يمنعك من أن تكون مستمعا جيدا؟", "تنظر إلى قيم الموظفين على أنها شأنهم الخاص وبهذا لا تناقشها إلا نادرا؟", "تعتقد أن مبادرات البرامج الصحية للموظفين تكاليف غير ضرورية؟", "تعتقد أن الاختلافات بين الأجيال لا علاقة لها بمكان العمل؟", "تعتقد أنه يجب على الموظفين عادة انتظارك لتملي عليهم ما يقومون به؟", "تصر على أن مشاركة الموظفين والاحتفاظ بهم ليست مهارات قيادة جوهرية ولا تحتاج إلى تمضية وقت لتحسينها؟"];
  const MOPT = { 1: 'دائمًا / نعم', 2: 'في الغالب / كثيرًا', 3: 'أحيانًا', 4: 'مطلقًا / لا' };
  const RQ = ['جودة الخدمة وسرعة الاستجابة', 'كفاءة إدارة المطبخ وسرعة التحضير', 'وجود أدلة تشغيل قياسية (SOPs)', 'تطبيق معايير سلامة غذائية HACCP',
    'نظام محاسبي وقوائم مالية دورية', 'مراقبة التكاليف وهوامش الربح', 'إدارة التدفقات النقدية والسيولة', 'تحليل ربحية الأصناف (Menu Engineering)',
    'التواجد الرقمي والتسويق عبر التواصل', 'برامج ولاء العملاء والعروض', 'خطة تسويقية سنوية بميزانية', 'خطة تدريب وتأهيل الموظفين',
    'معدل دوران الموظفين ونظام حوافز', 'قابلية تكرار نموذج العمل', 'توثيق شامل للعمليات', 'تسجيل العلامة التجارية'];
  const RSEC = [['العمليات والتشغيل', 'Operations', [1, 2, 3, 4], 20, 0.25], ['الإدارة المالية', 'Finance', [5, 6, 7, 8], 20, 0.25],
    ['التسويق والمبيعات', 'Marketing', [9, 10, 11], 15, 0.18], ['الموارد البشرية', 'HR', [12, 13], 10, 0.12], ['التوسع والامتياز', 'Expansion', [14, 15, 16], 15, 0.20]];
  const QLBL = { 1: 'ضعيف', 2: 'مقبول', 3: 'جيد', 4: 'جيد جداً', 5: 'ممتاز' };

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? null : n; };
  const fmt = v => { const n = num(v); return n == null ? (v || '—') : n.toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  const has = v => v != null && String(v).trim() !== '' && String(v) !== 'null';
  function pick(o, keys) { for (const k of keys) if (has(o[k])) return o[k]; return ''; }
  function dateOf(o) {
    const v = pick(o, ['Timestamp', 'timestamp', 'التاريخ']); const d = new Date(String(v).replace(' ', 'T'));
    return isNaN(d) ? (v || '') : d.toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' });
  }
  const secCls = p => p >= 85 ? ['ممتاز', '#1e8449'] : p >= 70 ? ['جيد جداً', '#b8860b'] : p >= 55 ? ['جيد', '#d68910'] : ['يحتاج تطوير', '#c0392b'];
  const finalCls = s => s >= 85 ? 'ممتاز - جاهز للتوسع والامتياز' : s >= 70 ? 'جيد جداً - يحتاج تحسينات محدودة' : s >= 55 ? 'جيد - يحتاج إعادة هيكلة جزئية' : 'يحتاج تطوير - إعادة بناء المنظومة';

  /* ---------- عناصر التصميم (مطابقة لقالب البريد) ---------- */
  const h2 = t => `<h2 class="h2">${esc(t)}</h2>`;
  const infoTable = rows => '<table class="info">' + rows.filter(r => has(r[1])).map(r => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('') + '</table>';
  const scoreBox = (val, label, sub) => `<div class="score"><div class="sv">${esc(val)}</div><div class="sl">${esc(label)}</div>${sub ? `<div class="ss">${esc(sub)}</div>` : ''}</div>`;
  const bar = (p, color) => `<div class="bar"><span style="width:${Math.max(0, Math.min(100, p))}%;background:${color}"></span></div>`;

  function wrap(title, subtitle, reportNo, inner) {
    const logo = location.origin + location.pathname.replace(/[^/]*$/, '') + 'icon-192.png';
    const now = new Date().toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' });
    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} – FAROUK GRUP</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;background:#f9f6f0;font-family:Tajawal,Tahoma,Arial,sans-serif;color:#222;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:900px;margin:24px auto;background:#fff;border-radius:20px;border:1px solid ${GOLD}30;box-shadow:0 6px 30px rgba(0,0,0,.06);padding:34px 38px}
.hdr{text-align:center;border-bottom:4px solid ${GOLD};padding-bottom:18px;margin-bottom:24px}
.hdr img{width:78px;height:78px;border-radius:16px;display:block;margin:0 auto 10px}
.hdr h1{color:${GOLD};font-size:26px;margin:0 0 6px;font-weight:800}
.hdr .brand{font-size:15px;color:#444}.hdr .meta{font-size:13px;color:#777;margin-top:6px}
.h2{color:${GOLD};border-right:6px solid ${GOLD};padding:4px 12px 4px 0;font-size:19px;margin:26px 0 12px;page-break-after:avoid;break-after:avoid}
table{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px}
table th,table td{border:1px solid ${GOLD};padding:8px 10px;text-align:right;vertical-align:top}
table.info td{unicode-bidi:plaintext}
table.info th{width:32%;background:#fbf7ec;color:#5a4300;font-weight:700}
table.grid thead th{background:${GOLD};color:#fff;font-weight:700}
table.grid tbody tr:nth-child(even) td{background:#fdfaf2}
tr{page-break-inside:avoid;break-inside:avoid}
.score{background:#f5f0e0;border:2px solid ${GOLD};border-radius:16px;text-align:center;padding:18px;margin:18px auto;max-width:440px;page-break-inside:avoid}
.score .sv{direction:ltr;unicode-bidi:isolate;font-size:48px;font-weight:800;color:${GOLD};line-height:1.2}.score .sl{font-size:17px;font-weight:700;color:#333}.score .ss{font-size:13px;color:#666;margin-top:4px}
.bar{height:10px;background:#eee;border-radius:6px;overflow:hidden;min-width:90px}.bar span{display:block;height:100%;border-radius:6px}
.pill{display:inline-block;padding:2px 10px;border-radius:20px;color:#fff;font-size:12px;font-weight:700;white-space:nowrap}
.note{background:#fbf7ec;border-right:4px solid ${GOLD};padding:10px 14px;border-radius:8px;margin:8px 0;font-size:14px;white-space:pre-wrap}
ul.rec{margin:0;padding-right:20px}ul.rec li{margin:6px 0}
.muted{color:#888;font-size:12px}
.sign{display:flex;justify-content:space-between;gap:20px;margin-top:40px;font-size:13px;color:#555;page-break-inside:avoid}
.sign div{flex:1;text-align:center;border-top:1px dashed ${GOLD};padding-top:8px}
.ftr{text-align:center;color:#888;font-size:12px;border-top:1px solid ${GOLD}40;margin-top:28px;padding-top:14px}
@page{size:A4;margin:12mm}
@media print{body{background:#fff}.page{margin:0;max-width:none;border:none;box-shadow:none;border-radius:0;padding:0}}
@media (max-width:600px){.page{margin:0;border-radius:0;padding:20px 14px}.hdr h1{font-size:21px}table{font-size:12.5px}}
</style></head><body><div class="page">
<div class="hdr"><img src="${logo}" alt="FAROUK GRUP" onerror="this.style.display='none'">
<h1>${esc(title)}</h1><div class="brand"><strong>FAROUK GRUP</strong> – ${esc(subtitle)}</div>
<div class="meta">تاريخ التقرير: ${esc(now)}${reportNo ? ' &nbsp;|&nbsp; رقم السجل: ' + esc(reportNo) : ''}</div></div>
${inner}
<div class="sign"><div>إعداد: فريق مجموعة فاروق للاستشارات والأعمال</div><div>الختم / التوقيع</div></div>
<div class="ftr">تقرير صادر من منصة إدارة مجموعة فاروق للاستشارات والأعمال<br>FAROUK GRUP © ${new Date().getFullYear()} – farouk-grup.com</div>
</div></body></html>`;
  }

  /* ---------- تشخيص المطاعم ---------- */
  function restaurant(o, no) {
    const q = i => num(pick(o, ['Q' + i + ' Score', 'q' + i + '_score'])) || 0;
    const qn = i => pick(o, ['Q' + i + ' Note', 'q' + i + '_note', 'note_q' + i]);
    const secs = RSEC.map(([name, en, qs, max, w], i) => {
      const raw = qs.reduce((s, k) => s + q(k), 0);
      let pct = num(pick(o, ['Sec' + (i + 1) + ': ' + en + ' (%)', 'sec' + (i + 1) + '_score']));
      if (pct == null) pct = Math.round(raw / max * 100);
      return { name, raw, max, pct, w, note: pick(o, ['Note Sec' + (i + 1), 'note_sec' + (i + 1)]), qs };
    });
    let fin = num(pick(o, ['Final Score (%)', 'finalScore']));
    if (fin == null) fin = Math.round(secs.reduce((s, x) => s + x.pct * x.w, 0));
    const weak = secs.filter(s => s.pct < 55).map(s => s.name);
    const recs = fin >= 85 ? ['المنظومة متكاملة، يُوصى بالتحسين المستمر والتوسع المدروس.', 'توثيق الإجراءات بشكل أكثر احترافية للامتياز التجاري.', 'الاستثمار في التسويق الرقمي وبرامج الولاء لتعزيز الميزة التنافسية.']
      : fin >= 70 ? ['تحسين التوثيق التشغيلي وأدلة الإجراءات (SOPs).', 'تعزيز نظام الرقابة المالية وتحليل التكاليف بشكل دوري.'].concat(weak.length ? ['التركيز على تحسين: ' + weak.join('، ') + '.'] : [])
      : fin >= 55 ? ['إعادة هيكلة العمليات الأساسية وتوحيد الإجراءات.', 'وضع خطة مالية واضحة مع ميزانيات تشغيلية.', 'تدريب الموظفين وتحسين معدلات الاحتفاظ بهم.'].concat(weak.length ? ['الأولوية لتطوير: ' + weak.join('، ') + '.'] : [])
      : ['إعادة بناء المنظومة التشغيلية والإدارية من الأساس.', 'تطبيق نظام محاسبي متكامل ومراقبة التكاليف بشكل صارم.', 'وضع خطة تسويقية ورقمية فعالة لزيادة المبيعات.', 'تدريب وتأهيل الكوادر البشرية وتحسين ثقافة العمل.', 'توثيق جميع العمليات كخطوة أولى نحو التوسع.'];
    const cc = pick(o, ['Country Code', 'countryCode']), ph = pick(o, ['Phone', 'phone']);
    let h = h2('بيانات العميل') + infoTable([
      ['اسم المنشأة', pick(o, ['Restaurant Name', 'restaurantName'])], ['اسم المالك', pick(o, ['Owner Name', 'ownerName', 'name'])],
      ['البريد الإلكتروني', pick(o, ['Email', 'email'])], ['الهاتف', (cc + ' ' + ph).trim()], ['المدينة', pick(o, ['City', 'city'])],
      ['سنة التأسيس', pick(o, ['Est. Year', 'estYear'])], ['عدد الفروع', pick(o, ['Branches', 'branches'])],
      ['نوع النشاط', pick(o, ['Activity Type', 'activity'])], ['عدد الموظفين', pick(o, ['Employees', 'employees'])], ['تاريخ التقييم', dateOf(o)]]);
    h += scoreBox(fin + '%', 'النتيجة النهائية', 'التصنيف العام: ' + finalCls(fin));
    h += h2('نتائج المحاور') + '<table class="grid"><thead><tr><th>المحور</th><th>الدرجة</th><th>النسبة</th><th style="width:28%">المؤشر</th><th>التصنيف</th></tr></thead><tbody>'
      + secs.map(s => { const [l, c] = secCls(s.pct); return `<tr><td>${esc(s.name)}</td><td>${s.raw}/${s.max}</td><td><b>${s.pct}%</b></td><td>${bar(s.pct, c)}</td><td><span class="pill" style="background:${c}">${l}</span></td></tr>`; }).join('') + '</tbody></table>';
    h += h2('تفاصيل الإجابات');
    secs.forEach(s => {
      h += `<table class="grid"><thead><tr><th colspan="4">${esc(s.name)} – ${s.pct}%</th></tr><tr><th style="width:6%">#</th><th>البند</th><th style="width:16%">التقييم</th><th style="width:30%">ملاحظات</th></tr></thead><tbody>`
        + s.qs.map(i => { const v = q(i); return `<tr><td>${i}</td><td>${esc(RQ[i - 1])}</td><td>${v ? v + '/5 – ' + QLBL[v] : '—'}</td><td>${esc(qn(i)) || '<span class="muted">—</span>'}</td></tr>`; }).join('') + '</tbody></table>';
      if (has(s.note)) h += `<div class="note"><b>ملاحظة المحور:</b> ${esc(s.note)}</div>`;
    });
    h += h2('التوصيات الاستشارية') + '<ul class="rec">' + recs.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul>';
    h += extras(o, /^(Timestamp|Restaurant Name|Owner Name|Email|Country Code|Phone|City|Est\. Year|Branches|Activity Type|Employees|Final Score \(%\)|Sec\d.*|Note Sec\d|Q\d+ (Score|Note)|timestamp|name|email|phone|countryCode|restaurantName|ownerName|city|estYear|branches|activity|employees|finalScore|lang)$/);
    return wrap('التقرير التشخيصي الاستشاري', 'تقييم شامل للمنشآت الغذائية', no, h);
  }

  /* ---------- مقياس تحديد الإداري ---------- */
  function management(o, no) {
    let ans = [];
    for (let i = 1; i <= 26; i++) ans.push(num(o['A' + i]));
    if (ans.every(v => v == null) && has(o.answers)) { try { ans = JSON.parse(o.answers).map(num); } catch (e) { } }
    let total = num(pick(o, ['Total Score', 'totalScore']));
    if (total == null) total = ans.reduce((s, v) => s + (v || 0), 0);
    const max = num(pick(o, ['Max Score', 'maxScore'])) || 104;
    const level = pick(o, ['Level', 'level']), msg = pick(o, ['Message', 'message']);
    const pct = Math.round(total / max * 100);
    const color = total >= 80 ? '#1e8449' : total >= 53 ? '#d68910' : '#c0392b';
    const cc = pick(o, ['Country Code', 'countryCode']);
    let h = h2('بيانات العميل') + infoTable([['الاسم', pick(o, ['Name', 'name'])], ['البريد الإلكتروني', pick(o, ['Email', 'email'])],
      ['الهاتف', (cc + ' ' + pick(o, ['Phone', 'phone'])).trim()], ['تاريخ التقييم', dateOf(o)]]);
    h += scoreBox(total + ' / ' + max, level || 'النتيجة', pct + '%');
    if (has(msg)) h += h2('التحليل والتوصية') + `<div class="note">${esc(msg)}</div>`;
    const weak = ans.map((v, i) => ({ v, i })).filter(x => x.v != null && x.v <= 2);
    h += h2('توزيع الإجابات') + '<table class="grid"><thead><tr><th>الإجابة</th><th>العدد</th><th style="width:45%">النسبة</th></tr></thead><tbody>'
      + [4, 3, 2, 1].map(k => { const n = ans.filter(v => v === k).length; const p = Math.round(n / 26 * 100); return `<tr><td>${MOPT[k]} (${k})</td><td>${n}</td><td>${bar(p, k >= 3 ? '#1e8449' : k === 2 ? '#d68910' : '#c0392b')} ${p}%</td></tr>`; }).join('') + '</tbody></table>';
    h += h2('تفاصيل الإجابات (26 عبارة)') + '<table class="grid"><thead><tr><th style="width:6%">#</th><th>العبارة</th><th style="width:22%">الإجابة</th><th style="width:9%">النقاط</th></tr></thead><tbody>'
      + MQ.map((t, i) => { const v = ans[i]; const c = v == null ? '#999' : v >= 3 ? '#1e8449' : v === 2 ? '#d68910' : '#c0392b'; return `<tr><td>${i + 1}</td><td>${esc(t)}</td><td><span class="pill" style="background:${c}">${v == null ? '—' : MOPT[v]}</span></td><td>${v == null ? '—' : v + '/4'}</td></tr>`; }).join('') + '</tbody></table>';
    if (weak.length) h += h2('نقاط تحتاج إلى معالجة') + '<ul class="rec">' + weak.map(x => `<li>${esc(MQ[x.i])} – <b>${MOPT[x.v]}</b></li>`).join('') + '</ul>';
    h += `<p class="muted">مقياس التقييم: كل عبارة من 1 إلى 4 (4 = مطلقًا / لا وهي الإجابة الأفضل). 80 فأكثر: ممتاز، 53–79: متوسط، 52: منخفض، أقل من 52: حرج.</p>`;
    h += extras(o, /^(Timestamp|Name|Email|Country Code|Phone|Total Score|Max Score|Level|Message|A\d+|timestamp|name|email|phone|countryCode|lang)$/);
    return wrap('مقياس تحديد الإداري', 'تقييم القيادة والاحتفاظ بالموظفين', no, h);
  }

  /* ---------- تقييم الجدوى ---------- */
  function feasibility(o, no) {
    const g = (a, b) => pick(o, [a, b]);
    const cur = g('Currency', 'currency');
    const money = v => has(v) ? fmt(v) + (cur ? ' ' + cur : '') : '';
    const score = num(g('Score', 'score')) || 0, grade = g('Grade', 'grade');
    const npv = num(g('NPV', 'npv')), irr = num(g('IRR', 'irr')), pb = num(g('Payback', 'payback')), pi = num(g('PI', 'pi')), life = num(g('Life Years', 'lifeYears'));
    const irrTxt = irr == null ? 'غير محدد' : (Math.abs(irr) <= 5 ? (irr * 100).toFixed(1) : irr.toFixed(1)) + '%';
    const cc = g('Country Code', 'countryCode');
    let h = h2('بيانات العميل والمشروع') + infoTable([['الاسم', g('Name', 'name')], ['البريد الإلكتروني', g('Email', 'email')],
      ['الهاتف', (cc + ' ' + g('Phone', 'phone')).trim()], ['اسم المشروع', g('Project Name', 'projectName')], ['العملة', cur], ['تاريخ التقييم', dateOf(o)]]);
    h += scoreBox(score + ' / 100', grade || 'تقييم الجدوى');
    const ind = (ok, t) => `<span class="pill" style="background:${ok == null ? '#999' : ok ? '#1e8449' : '#c0392b'}">${t}</span>`;
    h += h2('المؤشرات المالية') + '<table class="grid"><thead><tr><th>المؤشر</th><th>القيمة</th><th>الحكم</th></tr></thead><tbody>'
      + `<tr><td>صافي القيمة الحالية (NPV)</td><td>${esc(money(npv))}</td><td>${ind(npv == null ? null : npv > 0, npv == null ? '—' : npv > 0 ? 'يخلق قيمة' : 'لا يخلق قيمة')}</td></tr>`
      + `<tr><td>معدل العائد الداخلي (IRR)</td><td>${esc(irrTxt)}</td><td>${ind(irr == null ? false : irr > 0, irr == null ? 'غير محدد' : irr > 0 ? 'عائد موجب' : 'عائد سالب')}</td></tr>`
      + `<tr><td>مؤشر الربحية (PI)</td><td>${esc(pi == null ? '—' : pi.toFixed(2))}</td><td>${ind(pi == null ? null : pi >= 1, pi == null ? '—' : pi >= 1 ? 'مجدٍ' : 'أقل من الاستثمار')}</td></tr>`
      + `<tr><td>فترة الاسترداد</td><td>${pb == null ? 'لا يوجد استرداد' : pb.toFixed(1) + ' سنة'}</td><td>${ind(pb == null ? false : (life ? pb < life / 2 : null), pb == null ? 'لا استرداد' : life && pb < life / 2 ? 'استرداد سريع' : 'استرداد بطيء')}</td></tr>`
      + '</tbody></table>';
    h += h2('مدخلات المشروع') + infoTable([['إجمالي الاستثمار', money(g('Total Investment', 'totalInvestment'))], ['رأس المال الثابت', money(g('Fixed Capital', 'fixedCapital'))],
      ['تكاليف التأسيس', money(g('Setup Capital', 'setupCapital'))], ['المبيعات الشهرية المتوقعة', money(g('Monthly Sales', 'monthlySales'))],
      ['عمر المشروع', life ? life + ' سنة' : ''], ['عدد الموظفين', g('Employees', 'employees')]]);
    const rec = score >= 80 ? 'المشروع يتمتع بجدوى عالية، يُنصح بالانتقال إلى دراسة جدوى تفصيلية وخطة تنفيذ.' : score >= 60 ? 'جدوى متوسطة، يُنصح بمراجعة التكاليف التشغيلية وتحسين هامش الربح قبل التنفيذ.'
      : score >= 40 ? 'الجدوى مقبولة لكنها تحتاج تحسين: راجع حجم الاستثمار والمبيعات المتوقعة وفترة الاسترداد.' : 'المشروع عالي المخاطر بالمعطيات الحالية، يُنصح بإعادة هيكلة النموذج المالي قبل أي استثمار.';
    h += h2('التوصية') + `<div class="note">${esc(rec)}</div><p class="muted">هذا تقييم فوري مختصر مبني على المدخلات المرسلة، ولا يغني عن دراسة الجدوى التفصيلية.</p>`;
    h += extras(o, /^(Timestamp|Name|Email|Country Code|Phone|Project Name|Currency|Score|Grade|NPV|IRR|Payback|PI|Total Investment|Life Years|Fixed Capital|Setup Capital|Monthly Sales|Employees|timestamp|name|email|phone|countryCode|projectName|currency|score|grade|npv|irr|payback|pi|totalInvestment|lifeYears|fixedCapital|setupCapital|monthlySales|employees|lang)$/);
    return wrap('تقييم فوري للمشروع', 'دراسة جدوى مختصرة', no, h);
  }

  function extras(o, skip) {
    const rows = Object.keys(o).filter(k => !skip.test(k) && has(o[k])).map(k => [k, o[k]]);
    return rows.length ? h2('بيانات إضافية') + infoTable(rows) : '';
  }
  function generic(o, no, title) { return wrap(title || 'تقرير', 'بيانات السجل', no, h2('تفاصيل السجل') + infoTable(Object.keys(o).map(k => [k, o[k]]))); }

  function build(sheet, o, no, title) {
    if (sheet === 'ManagementResponses') return management(o, no);
    if (sheet === 'FeasibilityResponses') return feasibility(o, no);
    if (sheet === 'FormResponses' && (has(o['Final Score (%)']) || has(o['Q1 Score']) || has(o['Restaurant Name']))) return restaurant(o, no);
    return generic(o, no, title);
  }

  /* ---------- نافذة العرض والطباعة ---------- */
  function ensureViewer() {
    let v = document.getElementById('fgReportViewer'); if (v) return v;
    v = document.createElement('div'); v.id = 'fgReportViewer';
    v.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(5,8,14,.85);display:none;flex-direction:column';
    v.innerHTML = '<div style="display:flex;gap:8px;align-items:center;padding:10px 14px;background:#0a0e16;border-bottom:2px solid #b8860b;flex-wrap:wrap">'
      + '<b id="fgReportTitle" style="color:#d4b15a;flex:1;font-family:Tajawal,sans-serif;min-width:150px"></b>'
      + '<button type="button" id="fgRepPrint" style="background:#b8860b;color:#fff;border:0;border-radius:10px;padding:9px 16px;font-family:Tajawal,sans-serif;font-weight:700;cursor:pointer"><i class="fas fa-print"></i> طباعة / حفظ PDF</button>'
      + '<button type="button" id="fgRepOpen" style="background:#1c2433;color:#fff;border:1px solid #b8860b;border-radius:10px;padding:9px 14px;font-family:Tajawal,sans-serif;cursor:pointer"><i class="fas fa-external-link-alt"></i> فتح في نافذة</button>'
      + '<button type="button" id="fgRepClose" style="background:#c0392b;color:#fff;border:0;border-radius:10px;padding:9px 14px;font-family:Tajawal,sans-serif;cursor:pointer"><i class="fas fa-times"></i> إغلاق</button></div>'
      + '<iframe id="fgReportFrame" title="التقرير" style="flex:1;border:0;width:100%;background:#f9f6f0"></iframe>';
    document.body.appendChild(v);
    v.querySelector('#fgRepClose').onclick = () => { v.style.display = 'none'; document.body.style.overflow = ''; };
    v.querySelector('#fgRepPrint').onclick = () => { const f = document.getElementById('fgReportFrame'); try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { openWin(); } };
    v.querySelector('#fgRepOpen').onclick = openWin;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && v.style.display === 'flex') v.querySelector('#fgRepClose').click(); });
    return v;
  }
  let lastHtml = '';
  function openWin() {
    const url = URL.createObjectURL(new Blob([lastHtml], { type: 'text/html;charset=utf-8' }));
    const w = window.open(url, '_blank'); if (!w) location.href = url;
  }
  function show(html, title) {
    lastHtml = html; const v = ensureViewer();
    document.getElementById('fgReportTitle').textContent = title || 'التقرير';
    document.getElementById('fgReportFrame').srcdoc = html;
    v.style.display = 'flex'; document.body.style.overflow = 'hidden';
  }

  window.FGReport = {
    isDiagnostic: sheet => ['FormResponses', 'ManagementResponses', 'FeasibilityResponses'].includes(sheet),
    /* headers + row (مصفوفة) أو كائن */
    open(sheet, headers, row, no, title) {
      const o = Array.isArray(row) ? Object.fromEntries(headers.map((h, i) => [h, row[i]])) : row;
      show(build(sheet, o, no, title), (title || 'التقرير') + (no ? ' – سجل ' + no : ''));
    },
    html: build
  };
})();
