/* ============================================================
   نَفَس — JavaScript panel (paste into CodePen JS panel)
   Vanilla JS • LocalStorage • no backend • DEMO ONLY
   Sections:
   1 Helpers  2 Data  3 State  4 UI core  5 Navigation  6 Stars
   7 Coins & tasks  8 Home  9 Listener (engine+voice)  10 Journey
   11 Spiritual  12 Tasks page  13 Premium  14 Account  15 Init
   ============================================================ */
(() => {
'use strict';

/* ============ 1. HELPERS ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const delay = ms => new Promise(r => setTimeout(r, ms));
const nf = n => Number(n).toLocaleString('ar-EG');
const fmtTime = ts => new Date(ts).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
const fmtDate = ts => new Date(ts).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
const fmtDur = sec => `${nf(pad(Math.floor(sec / 60)))}:${nf(pad(Math.floor(sec % 60)))}`;
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ 2. STATIC DATA ============ */
const AVATARS = [
  { id: 'moon', icon: 'fa-moon' }, { id: 'star', icon: 'fa-star' }, { id: 'leaf', icon: 'fa-leaf' },
  { id: 'feather', icon: 'fa-feather' }, { id: 'sun', icon: 'fa-sun' }, { id: 'heart', icon: 'fa-heart' }
];

const TASKS = [
  { id: 'session', title: 'جلسة فضفضة', desc: 'خلّص جلسة فضفضة واحفظ ملخصها.', reward: 5, icon: 'fa-comments', mode: 'auto', go: 'listen' },
  { id: 'journey', title: 'رحلة خيال', desc: 'كمّل رحلة خيال للنهاية.', reward: 5, icon: 'fa-cloud-moon', mode: 'auto', go: 'journey' },
  { id: 'reflection', title: 'تأمل شخصي', desc: 'اكتب في دفتر التأمل ولو سطر واحد.', reward: 5, icon: 'fa-pen', mode: 'auto', go: 'reflection' },
  { id: 'habit', title: 'عادة صحية صغيرة', desc: 'مياه، مشي خفيف، نوم بدري… اختار اللي يناسبك وسجّله بنفسك.', reward: 5, icon: 'fa-glass-water', mode: 'self' },
  { id: 'quran', title: 'ورد قرآن (اختياري)', desc: 'لو قرأت جزء من القرآن النهارده، سجّله بنفسك.', reward: 10, icon: 'fa-book-quran', mode: 'self', spiritual: true },
  { id: 'prayer', title: 'مهمة صلاة (اختياري)', desc: 'لو حابب تسجّل صلاة أديتها، من غير أي إثبات.', reward: 10, icon: 'fa-hands-praying', mode: 'self', spiritual: true }
];

const MOODS = [
  { id: 'suffocated', label: 'أنا مخنوق', icon: 'fa-wind', rec: 'beach', intro: 'واضح إنك شايل حاجات تقيلة. قبل أي حاجة، خد نفس عميق من مناخيرك.. وطلّعه براحة. الرحلة دي استراحة قصيرة، مش هروب.' },
  { id: 'failure', label: 'حاسس بالفشل', icon: 'fa-arrow-trend-down', rec: 'strength', intro: 'إحساس الفشل تقيل، ومش بيعرّف إنت مين. خد نفس، وسيب نفسك تتخيل من غير ما تقيّم أي حاجة.' },
  { id: 'lonely', label: 'وحيد', icon: 'fa-user', rec: 'city', intro: 'الوحدة وجعها حقيقي. دلوقتي إنت مش لوحدك في الرحلة دي — أنا معاك خطوة خطوة. خد نفس.' },
  { id: 'lost', label: 'تايه', icon: 'fa-compass', rec: 'future', intro: 'مش لازم تعرف الطريق كله دلوقتي. كفاية نشوف أول ملامحه. خد نفس هادي وابدأ.' },
  { id: 'passion', label: 'فاقد الشغف', icon: 'fa-fire-flame-simple', rec: 'future', intro: 'الشغف ساعات بيهدى عشان الجسم والقلب محتاجين راحة. خلينا نرتاح ونشوف إيه اللي ممكن يصحى تاني.' },
  { id: 'rest', label: 'محتاج أرتاح', icon: 'fa-bed', rec: 'beach', intro: 'تستاهل لحظات هدوء. سيب كتفك ينزل، وخد نفس عميق.. ونبدأ.' },
  { id: 'future', label: 'عايز أتخيل مستقبلي الجميل', icon: 'fa-wand-magic-sparkles', rec: 'future', intro: 'تخيّل المستقبل بيدّي اتجاه، بس الخطوة الحقيقية دايمًا النهارده. خد نفس وتعالى نشوف.' }
];

const GROUND = 'دلوقتي ارجع للمكان اللي قاعد فيه.. حس بالكرسي تحتك وبرجليك على الأرض، وشوف تلات حاجات قدامك. الخيال خلّصنا استراحته، وحياتك الحقيقية مستنياك.';

const SCENARIOS = {
  beach: { id: 'beach', title: 'الشاطئ الهادي', icon: 'fa-umbrella-beach', desc: 'موج وغروب وراحة تنفس.', audio: 'waves', steps: [
    'تخيّل إنك واقف على شاطئ هادي.. الرمل دافي تحت رجليك، والهوا خفيف على وشك.',
    'اسمع صوت الموج وهو بييجي ويروح.. مع كل موجة، كأنه بياخد معاه جزء صغير من التعب.',
    'الشمس بتغرب ببطء، والسما بتتلوّن بدرجات من الذهبي والبنفسجي. مفيش حد مستني منك حاجة دلوقتي.',
    'خد نفس على إيقاع الموج: شهيق.. ببطء.. وزفير أطول. كرر ده تلات مرات.',
    'لاحظ إن جواك مساحة أهدى شوية من الأول. مش لازم المشاكل تختفي عشان تقدر تتنفس.',
    'الشاطئ ده هيفضل جواك وتقدر ترجعله وقت ما تحتاج.. بس مكانك الحقيقي هو حياتك، وانت راجعلها بقوة أكبر شوية.'] },
  future: { id: 'future', title: 'مستقبلك الجميل', icon: 'fa-sun', desc: 'نسختك بعد ما كمّلت.', audio: 'pad', steps: [
    'تخيّل نفسك بعد سنة أو اتنين.. مش نسخة خيالية كاملة، بس نسخة منك كمّلت ومعدتش وقفت.',
    'شوف يوم عادي من أيامك الجاية.. بتصحى براحة أكتر، وفي حاجة صغيرة بتعملها بتفرّحك.',
    'افتكر صعوبة عدّت عليك قبل كده.. إنت عدّيتها، حتى لو وقتها حسّيت إنك مش قادر.',
    'المستقبل ده اتبنى من خطوات صغيرة ومتكررة، مش من قفزة واحدة. شوف أول خطوة فيها.. شكلها إيه؟',
    'قول لنفسك الحالية جملة بسيطة: «مش لازم أوصل النهارده.. كفاية أتحرك خطوة».',
    'ارجع بالنفَس لوقتك الحقيقي، وخد معاك الصورة دي كبوصلة، مش كبديل عن الحاضر.'] },
  city: { id: 'city', title: 'مدينة الأحلام', icon: 'fa-city', desc: 'أنوار وشوارع هادية.', audio: 'pad', steps: [
    'إنت داخل مدينة هادية بالليل.. المباني بتلمع بأنوار ناعمة، والشوارع واسعة ونضيفة.',
    'بتمشي ببطء وسط ناس مرتاحين.. محدش مستعجل ومحدش بيحكم عليك.',
    'قدامك ميدان فيه نافورة منوّرة وكراسي هادية. تقعد، وتسمع صوت المية وهي بتنزل.',
    'حتى في أهدى مدينة، كل واحد عنده حكايته.. وإنت كمان جزء من حكاية الناس، مش غريب عنها.',
    'فكّر في شخص واحد في حياتك الحقيقية ممكن تبعتله رسالة بسيطة النهارده.. حتى مجرد «وحشتني».',
    'المدينة بتتلاشى بلطف.. وبترجع لأصوات وأنوار حياتك، وإنت أخف شوية.'] },
  strength: { id: 'strength', title: 'القوة الداخلية', icon: 'fa-mountain', desc: 'جبل وصخور وثقة هادية.', audio: 'pad', steps: [
    'تخيّل جبل قدامك.. مش مخيف، بس عالي. إنت واقف تحته وبتبص له بهدوء.',
    'ابدأ تطلع خطوة خطوة. مع كل خطوة بتحس رجليك أثبت من اللي قبلها.',
    'في نص الطريق بتقابل صخرة كبيرة.. بتقف وتاخد نفس. مش لازم تكسرها، ممكن تلف حواليها.',
    'افتكر موقف قبل كده كنت فيه أقوى مما توقعت. القوة دي ما راحتش، هي معاك.',
    'على القمة الهوا نضيف.. وحاسس إن اللي كان شايل صدرك بقى أخف. مش عشان الجبل اختفى، عشان إنت اتغيّرت.',
    'قول لنفسك بصوت واطي: «أنا ماشي حتى لو ببطء». وارجع.'] },
  spiritual: { id: 'spiritual', title: 'سكينة روحية', icon: 'fa-moon', desc: 'اختياري — صفاء وتأمل.', audio: 'pad', needsSpiritual: true, steps: [
    'تخيّل إنك قاعد في مكان هادي وقت الفجر.. الجو ساكن والنور بيطلع بنعومة.',
    'خد نفس عميق وقول في سرك: «الحمد لله على النفَس ده». ولو مش في بالك الجملة دي، كفاية إنك ساكن.',
    'قال الله تعالى: «أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» (الرعد: 28). سيب الآية تمشي جواك ببطء.',
    'افتكر نعمة صغيرة في يومك.. كوباية شاي، صوت حد بتحبه.. وقول: شكرًا.',
    'اطلب من ربنا اللي نفسك فيه بكلامك البسيط.. مفيش صيغة صح أو غلط.',
    'ارجع لحياتك بسكينة، وخد معاك خطوة واحدة تقدر تعملها النهارده.'] },
  desert: { id: 'desert', title: 'ليلة الصحرا', icon: 'fa-star', desc: 'نجوم ونار هادية.', audio: 'wind', premium: true, steps: [
    'تخيّل صحرا واسعة بالليل.. الرمل فضّي تحت ضوء القمر، والسما مليانة نجوم.',
    'قاعد جنب نار صغيرة، والدفا بيهدّي جسمك كله.',
    'بص للنجوم.. كل نجمة بعيدة جدًا، ومع ذلك ضوءها وصلك. إنك صغير قدام الكون مش معناه إنك مش مهم.',
    'في الهدوء ده، شوف أكتر حاجة بتتعبك كأنها حبة رمل.. حاجة ممكن تتحمل وتتغيّر مع الوقت.',
    'خد نفس طويل.. ريحة الدخان الخفيف والهوا البارد، وزفير براحة.',
    'الفجر هيطلع ويرجّعك لوقتك الحقيقي.. أقوى وأهدى.'] }
};
const SCN_ORDER = ['beach', 'future', 'city', 'strength', 'spiritual', 'desert'];

const REAL_ACTIONS = ['اشرب كوباية مية', 'امشي ٥ دقايق بره', 'ابعت رسالة لحد بتحبه', 'اكتب حاجة نجحت فيها النهارده', 'رتّب حاجة صغيرة قدامك', 'نام بدري شوية النهارده', 'كل وجبة بتحبها بهدوء'];

const VERSES = [
  { t: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', r: 'الرعد: 28 (جزء من الآية)', q: 'إيه الحاجة الصغيرة اللي بتهدّي قلبي لما أعملها؟' },
  { t: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾', r: 'الشرح: 5–6', q: 'افتكر موقف قديم حسّيت فيه إنه مفيش مخرج.. وبعدين اتفتح باب. إيه اللي اتعلمته منه؟' },
  { t: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', r: 'البقرة: 286 (جزء من الآية)', q: 'هل بحمّل نفسي فوق طاقتها؟ إيه الحاجة اللي أقدر أخففها النهارده؟' },
  { t: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ', r: 'الضحى: 3', q: 'لما بحس إني لوحدي، إيه العلامات الصغيرة اللي بتفكّرني إني مش متروك؟' },
  { t: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ', r: 'يوسف: 87 (جزء من الآية)', q: 'إيه الأمل اللي لسه ممكن أتمسّك بيه النهارده، حتى لو صغير؟' },
  { t: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ', r: 'آل عمران: 139', q: 'إيه الحزن اللي محتاج أسمح لنفسي أحسّه من غير ما أستسلم له؟' },
  { t: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', r: 'الطلاق: 3 (جزء من الآية)', q: 'إيه الحاجة اللي تعبت وأنا ماسك فيها، وممكن أعمل اللي عليّ فيها وأسلّم الباقي؟' },
  { t: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', r: 'البقرة: 152', q: 'إيه النعمة اللي ممكن أقول عليها «الحمد لله» النهارده من قلبي؟' }
];
const DUAS = [
  { t: 'رَبِّ اشْرَحْ لِي صَدْرِي ﴿٢٥﴾ وَيَسِّرْ لِي أَمْرِي ﴿٢٦﴾', r: 'طه: 25–26' },
  { t: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', r: 'الأنبياء: 87' },
  { t: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', r: 'البقرة: 201' },
  { t: 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', r: 'القصص: 24' },
  { t: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', r: 'آل عمران: 173 (جزء من الآية)' }
];
const DHIKR = ['سُبْحَانَ اللَّهِ', 'الْحَمْدُ لِلَّهِ', 'اللَّهُ أَكْبَرُ', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 'أَسْتَغْفِرُ اللَّهَ'];

const ENCOURAGE = {
  egy: ['مش لازم تكون كويس طول الوقت. يكفي إنك هنا النهارده.', 'خطوة صغيرة النهارده أحسن من خطة كبيرة مأجّلة.', 'تعبك حقيقي، وراحتك مش رفاهية.', 'مش لازم تحل كل حاجة النهارده، كفاية تعدّي اليوم برفق.', 'اسمح لنفسك تاخد استراحة من غير ذنب.', 'اللي بتحاول فيه مش بيتقاس بسرعة الناس حواليك.', 'خد نفس.. وابدأ بأصغر حاجة قدامك.'],
  msa: ['لا يلزمك أن تكون بخير طوال الوقت؛ يكفي أنك هنا اليوم.', 'خطوة صغيرة اليوم خير من خطة كبيرة مؤجَّلة.', 'تعبك حقيقي، وراحتك ليست ترفًا.', 'لا يلزمك حلّ كل شيء اليوم؛ يكفي أن تعبر يومك برفق.', 'اسمح لنفسك باستراحة بلا شعور بالذنب.', 'ما تسعى إليه لا يُقاس بسرعة من حولك.', 'خذ نفَسًا.. وابدأ بأصغر ما أمامك.']
};
const PROMPTS = ['إيه أكتر حاجة تقيلة عليّا النهارده؟', 'موقف صغير النهارده خلاني أبتسم:', 'لو كلّمت نفسي زي ما بكلّم صاحبي، كنت هقول إيه؟', 'إيه الحاجة اللي مأجّلها وبتتعبني؟', 'إيه الحاجة الصغيرة اللي أنا ممتن لها دلوقتي؟', 'إيه اللي محتاجه أسمعه من نفسي؟', 'لو غدًا أخف من النهارده، إيه اللي اتغيّر؟'];

/* ============ 3. STATE ============ */
const KEY = 'nafas_demo_v1';
function defaults() {
  const d = todayKey();
  return {
    started: false,
    profile: { name: 'صديقي', age: '', lang: 'egy', avatar: 'moon' },
    settings: { spiritual: false, notify: true, theme: 'night', saveChats: true, remindPrayer: false, prayerTime: '20:00', quranGoal: 0, qiyam: false },
    wallet: { balance: 50, earned: 50, spent: 0, tx: [{ id: uid(), t: Date.now(), amount: 50, reason: 'هدية البداية' }] },
    tasks: { date: d, status: {} },
    chat: [],
    chatSession: { startedAt: Date.now(), crisis: false },
    sessions: [],
    journeys: { date: d, count: 0, extra: 0, progress: null, history: [], lastMood: null, unlocked: { desert: false, aurora: false }, lastAction: '' },
    journal: [],
    spiritual: { journal: [], days: {}, dhikr: { date: d, idx: 0, count: 0 }, verse: { date: d, idx: -1 } },
    premium: { active: false, plan: null, since: null },
    flags: { crisisUntil: 0 },
    meta: { lastNudge: '', lastPrayerNudge: '', lastPage: 'home' }
  };
}
function merge(base, saved) {
  for (const k in saved) {
    const s = saved[k];
    if (s && typeof s === 'object' && !Array.isArray(s) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], s);
    else base[k] = s;
  }
  return base;
}
function load() {
  try { const raw = localStorage.getItem(KEY); return raw ? merge(defaults(), JSON.parse(raw)) : defaults(); }
  catch (e) { return defaults(); }
}
let S = load();
function save() {
  try {
    const copy = JSON.parse(JSON.stringify(S));
    if (!S.settings.saveChats) copy.chat = [];
    copy.chat = (copy.chat || []).slice(-200);
    localStorage.setItem(KEY, JSON.stringify(copy));
  } catch (e) { /* storage may be blocked (private mode / iframe) — app keeps working in memory */ }
}
const isPremium = () => !!S.premium.active;
const isCrisis = () => Date.now() < (S.flags.crisisUntil || 0);
const voiceUrls = {}; // in-memory only audio blobs

/* ============ 4. UI CORE ============ */
const TOAST_ICONS = { success: 'fa-circle-check', info: 'fa-circle-info', warn: 'fa-triangle-exclamation', error: 'fa-circle-xmark' };
function toast(msg, type = 'info') {
  const root = $('#toastRoot'); if (!root) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<i class="fa-solid ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i><span>${esc(msg)}</span>`;
  root.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 3400);
}
let modalOnClose = null, modalDismissible = true;
function openModal({ title = '', html = '', wide = false, dismissible = true, onClose = null }) {
  closeModal();
  const root = $('#modalRoot');
  modalDismissible = dismissible; modalOnClose = onClose;
  root.innerHTML = `<div class="modal-backdrop" data-backdrop="1"><div class="modal glass ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
    <button class="modal-x" data-action="modal-close" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
    ${title ? `<h3>${esc(title)}</h3>` : ''}<div class="modal-body">${html}</div></div></div>`;
  root.classList.add('open');
  const f = $('.modal-body input, .modal-body textarea, .modal-body button', root); if (f && !reduceMotion) { try { f.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  return $('.modal-body', root);
}
function closeModal() {
  const root = $('#modalRoot');
  if (!root.classList.contains('open')) return;
  root.classList.remove('open'); root.innerHTML = '';
  const cb = modalOnClose; modalOnClose = null; if (cb) cb();
}
function confirmModal(title, text, okLabel, onOk, danger = false) {
  const body = openModal({ title, html: `<p>${esc(text)}</p><div class="row-wrap"><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm-ok">${esc(okLabel)}</button><button class="btn btn-ghost" data-action="modal-close">إلغاء</button></div>` });
  $('[data-action="confirm-ok"]', body).addEventListener('click', () => { closeModal(); onOk(); }, { once: true });
}
function coinBurst(el, amount) {
  const r = (el || document.body).getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'coin-fly'; f.innerHTML = `+${nf(amount)} <i class="fa-solid fa-coins"></i>`;
  f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 1300);
  $$('.js-balance').forEach(b => { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
}

/* ---- Event delegation (single listener set → no duplicates) ---- */
const A = {};   // click actions
const C = {};   // change handlers
const F = {};   // submit handlers
document.addEventListener('click', e => {
  const bd = e.target.closest('[data-backdrop]');
  if (bd && e.target === bd && modalDismissible) { closeModal(); return; }
  const el = e.target.closest('[data-action]'); if (!el) return;
  const fn = A[el.dataset.action];
  if (!fn) { console.warn('Missing action:', el.dataset.action); return; }
  try { fn(el, e); } catch (err) { console.error(err); toast('حصلت مشكلة صغيرة، جرّب تاني.', 'error'); }
});
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && C[el.dataset.change]) C[el.dataset.change](el); });
document.addEventListener('submit', e => { const f = e.target.closest('[data-submit]'); if (f && F[f.dataset.submit]) { e.preventDefault(); F[f.dataset.submit](f); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modalRoot').classList.contains('open') && modalDismissible) closeModal(); });

/* ============ 5. NAVIGATION ============ */
const PAGES = ['home', 'listen', 'journey', 'spiritual', 'tasks', 'account', 'premium', 'privacy'];
const NAV_PARENT = { premium: 'account', privacy: 'account' };
let currentPage = 'home';
const RENDER = { home: renderHome, listen: renderListen, journey: renderJourneyPage, spiritual: renderSpiritual, tasks: renderTasks, account: renderAccount, premium: renderPremium, privacy: () => {} };

function enterApp() {
  S.started = true; save();
  $('#landing').classList.add('hidden'); $('#appShell').classList.remove('hidden');
  window.scrollTo(0, 0);
}
function goPage(p) {
  if (!PAGES.includes(p)) p = 'home';
  if ($('#appShell').classList.contains('hidden')) enterApp();
  currentPage = p; S.meta.lastPage = p; save();
  $$('.page').forEach(s => s.classList.toggle('active', s.id === 'page-' + p));
  const navKey = NAV_PARENT[p] || p;
  $$('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === navKey));
  renderSide(); updateModes();
  RENDER[p]();
  window.scrollTo(0, 0);
  const m = $('#main'); if (m) m.scrollTop = 0;
}
function refresh() { renderSide(); updateModes(); if (!$('#appShell').classList.contains('hidden')) RENDER[currentPage](); }
function updateModes() {
  const app = $('#app');
  app.classList.toggle('crisis-mode', isCrisis());
  app.dataset.theme = S.settings.theme;
}
function renderSide() {
  const box = $('#sideUser'); if (!box) return;
  box.innerHTML = `${avatarHTML()}<div><b>${esc(S.profile.name)}</b><small class="gamify"><i class="fa-solid fa-coins"></i> <span class="js-balance">${nf(S.wallet.balance)}</span> ${isPremium() ? '• <i class="fa-solid fa-crown"></i>' : ''}</small></div>`;
}
function avatarHTML(size = '') {
  const a = AVATARS.find(x => x.id === S.profile.avatar) || AVATARS[0];
  return `<span class="avatar ${size}"><i class="fa-solid ${a.icon}"></i></span>`;
}

Object.assign(A, {
  start: () => { goPage(S.started ? S.meta.lastPage || 'home' : 'home'); if (!S.started) enterApp(); },
  scroll: el => { const t = el.dataset.target === 'top' ? $('#top') : document.getElementById(el.dataset.target); if (t) t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); },
  nav: el => goPage(el.dataset.page),
  'back-landing': () => { $('#appShell').classList.add('hidden'); $('#landing').classList.remove('hidden'); window.scrollTo(0, 0); },
  'landing-journey': el => { goPage('journey'); startJourney(el.dataset.id, S.journeys.lastMood || 'rest'); },
  'modal-close': () => closeModal(),
  'coin-demo': el => { demoCoins++; $('#coinDemoCount').textContent = nf(demoCoins); coinBurst(el, 1); if (demoCoins === 5) toast('كده فهمت الفكرة! 🌙 الكوينز الحقيقية بتتجمع من مهام في الأب.', 'info'); }
});
let demoCoins = 0;

/* ============ 6. STARS BACKGROUND ============ */
function initStars() {
  const cv = $('#stars'); if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d'); let w = 0, h = 0, stars = [], raf = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    const n = innerWidth < 600 ? 55 : 95;
    stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.4 + .4) * dpr, p: Math.random() * 6.28, s: Math.random() * .02 + .005, dy: (Math.random() * .12 + .02) * dpr, hue: Math.random() > .75 ? '170,230,255' : '255,255,255' }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = .25 + .55 * (.5 + .5 * Math.sin(s.p + t * s.s));
      ctx.beginPath(); ctx.fillStyle = `rgba(${s.hue},${a})`; ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      if (!reduceMotion) { s.y -= s.dy; if (s.y < -5) { s.y = h + 5; s.x = Math.random() * w; } }
    }
    if (!reduceMotion) raf = requestAnimationFrame(draw);
  }
  resize(); draw(0);
  window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(0); });
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden && !reduceMotion) raf = requestAnimationFrame(draw); });
}

/* ============ 7. COINS & TASKS ============ */
function addCoins(n, reason) {
  if (isCrisis()) return;
  S.wallet.balance += n; S.wallet.earned += n;
  S.wallet.tx.unshift({ id: uid(), t: Date.now(), amount: n, reason }); S.wallet.tx = S.wallet.tx.slice(0, 60); save();
}
function spendCoins(n, reason) {
  if (S.wallet.balance < n) return false;
  S.wallet.balance -= n; S.wallet.spent += n;
  S.wallet.tx.unshift({ id: uid(), t: Date.now(), amount: -n, reason }); S.wallet.tx = S.wallet.tx.slice(0, 60); save();
  return true;
}
function ensureDays() {
  const d = todayKey();
  if (S.tasks.date !== d) { S.tasks = { date: d, status: {} }; }
  if (S.journeys.date !== d) { S.journeys.date = d; S.journeys.count = 0; S.journeys.extra = 0; }
  if (S.spiritual.dhikr.date !== d) S.spiritual.dhikr = { date: d, idx: S.spiritual.dhikr.idx || 0, count: 0 };
  if (S.spiritual.verse.date !== d) S.spiritual.verse = { date: d, idx: -1 };
}
const visibleTasks = () => TASKS.filter(t => !t.spiritual || S.settings.spiritual);
function markTask(id) {
  if (isCrisis()) return false;
  ensureDays();
  const t = TASKS.find(x => x.id === id); if (!t || (t.spiritual && !S.settings.spiritual)) return false;
  if (S.tasks.status[id]) return false;           // no duplicate rewards in a day
  S.tasks.status[id] = 'done'; save();
  toast(`خلّصت «${t.title}» — تقدر تستلم مكافأتك من صفحة المهام.`, 'success');
  return true;
}
function claimTask(id, el) {
  ensureDays();
  const t = TASKS.find(x => x.id === id);
  if (!t || S.tasks.status[id] !== 'done' || isCrisis()) return;
  S.tasks.status[id] = 'claimed';
  addCoins(t.reward, 'مهمة: ' + t.title);
  coinBurst(el, t.reward); toast(`+${nf(t.reward)} Hope Coins`, 'success');
  refresh();
}
function dayProgress() {
  ensureDays(); const list = visibleTasks();
  const done = list.filter(t => S.tasks.status[t.id]).length;
  return { done, total: list.length, pct: Math.round(done / list.length * 100) };
}
function markSpiritualDay() { S.spiritual.days[todayKey()] = true; save(); }

A['task-done'] = el => { const id = el.dataset.id; if (markTask(id)) { if (id === 'quran' || id === 'prayer') markSpiritualDay(); refresh(); } };
A['task-claim'] = el => claimTask(el.dataset.id, el);
A['task-go'] = el => { const g = el.dataset.go; if (g === 'reflection') openReflection(); else goPage(g); };

/* ============ 8. HOME ============ */
function greetingByTime() { const h = new Date().getHours(); return h < 12 ? 'صباح الخير' : h < 18 ? 'أهلًا' : 'مساء الخير'; }
function recommended() {
  const m = MOODS.find(x => x.id === S.journeys.lastMood);
  let id = m ? m.rec : (new Date().getHours() >= 18 || new Date().getHours() < 5 ? 'beach' : 'future');
  if (SCENARIOS[id].needsSpiritual && !S.settings.spiritual) id = 'beach';
  return SCENARIOS[id];
}
function renderHome() {
  ensureDays();
  const root = $('#page-home'), p = dayProgress(), rec = recommended();
  const lastMood = MOODS.find(m => m.id === S.journeys.lastMood);
  const enc = (ENCOURAGE[S.profile.lang] || ENCOURAGE.egy)[Math.floor(Date.now() / 864e5) % 7];
  const prog = S.journeys.progress;
  const recent = S.sessions.slice(0, 3);
  root.innerHTML = `
  <header class="page-head">${avatarHTML('lg')}
    <div class="grow"><p class="eyebrow">${greetingByTime()}، ${esc(S.profile.name)}</p><h1>أهلًا بيك في مساحتك الآمنة</h1></div>
    <span class="badge gamify ${isPremium() ? 'gold' : ''}">${isPremium() ? '<i class="fa-solid fa-crown"></i> بريميوم (تجريبي)' : 'الخطة المجانية'}</span>
  </header>
  ${isCrisis() ? `<div class="banner safe"><i class="fa-solid fa-life-ring"></i><div class="grow"><b>إنت مهم، ومش لازم تعدّي ده لوحدك.</b><p class="muted" style="margin:0">لو لسه محتاج مساعدة فورية: الإسعاف 123 • الشرطة 122 (مصر)، أو كلّم حد قريب منك دلوقتي.</p></div><button class="btn btn-ghost btn-sm" data-action="open-safety">اقرأ التفاصيل</button><button class="btn btn-ghost btn-sm" data-action="clear-crisis">أنا بخير دلوقتي</button></div>` : ''}
  <div class="grid stats">
    <div class="stat card glass gamify"><span class="ic"><i class="fa-solid fa-coins"></i></span><div><b class="js-balance">${nf(S.wallet.balance)}</b><small>Hope Coins</small></div></div>
    <div class="stat card glass gamify"><span class="ic"><i class="fa-solid fa-list-check"></i></span><div style="flex:1"><b>${nf(p.done)}/${nf(p.total)}</b><small>تقدّم النهارده (اختياري)</small><div class="bar"><span style="width:${p.pct}%"></span></div></div></div>
    <div class="stat card glass"><span class="ic"><i class="fa-solid fa-route"></i></span><div><b>${lastMood ? esc(lastMood.label) : 'لسه ما بدأتش'}</b><small>رحلتي الحالية${prog ? ' • فيه رحلة متوقفة' : ''}</small></div></div>
    <div class="stat card glass"><span class="ic"><i class="fa-solid fa-heart"></i></span><div><b>${nf(S.sessions.length)}</b><small>جلسات فضفضة</small></div></div>
  </div>
  <div class="grid two">
    <article class="card glass"><span class="eyebrow">تشجيع لطيف النهارده</span><h3 style="font-weight:600">${esc(enc)}</h3>
      <div class="row-wrap"><button class="btn btn-ghost btn-sm" data-action="breathe"><i class="fa-solid fa-wind"></i> تنفّس معايا دقيقة</button><button class="btn btn-ghost btn-sm" data-action="open-reflection"><i class="fa-solid fa-pen"></i> دفتر التأمل</button></div></article>
    <article class="card glass"><span class="eyebrow">رحلة مقترحة ليك</span><h3><i class="fa-solid ${rec.icon}"></i> ${esc(rec.title)}</h3><p class="muted">${esc(rec.desc)} — ${lastMood ? 'مناسبة لحالة «' + esc(lastMood.label) + '».' : 'اختارناها حسب وقت اليوم.'}</p>
      <div class="row-wrap"><button class="btn btn-primary btn-sm" data-action="start-journey" data-id="${rec.id}"><i class="fa-solid fa-play"></i> ابدأ الرحلة</button>${prog ? '<button class="btn btn-ghost btn-sm" data-action="j-resume">كمّل رحلتي المتوقفة</button>' : ''}</div></article>
  </div>
  <div class="grid quick">
    <button class="card glass" data-action="nav" data-page="listen"><span class="ic"><i class="fa-solid fa-comments"></i></span><h3>فضفضة</h3><p>اتكلم براحتك، أنا سامعك.</p></button>
    <button class="card glass" data-action="nav" data-page="spiritual"><span class="ic"><i class="fa-solid fa-hands-praying"></i></span><h3>رحلتي الروحية</h3><p>${S.settings.spiritual ? 'آية ودعاء وأذكار.' : 'اختياري — تقدر تفعّله من هنا.'}</p></button>
    <button class="card glass gamify" data-action="nav" data-page="tasks"><span class="ic"><i class="fa-solid fa-coins"></i></span><h3>المهام والمكافآت</h3><p>عادات لطيفة وعملات صغيرة.</p></button>
    <button class="card glass" data-action="open-reflection"><span class="ic"><i class="fa-solid fa-book-open"></i></span><h3>دفتر التأمل</h3><p>سطر واحد كفاية.</p></button>
  </div>
  <div class="grid two">
    <article class="card glass"><h3>آخر الجلسات</h3>${recent.length ? `<div class="list">${recent.map(s => `<div class="item"><i class="fa-solid fa-feather" style="color:var(--cyan)"></i><div class="grow"><b>${esc(s.title)}</b><small class="muted">${fmtDate(s.t)} • ${nf(s.msgs)} رسالة</small></div></div>`).join('')}</div>`
      : `<div class="empty"><i class="fa-solid fa-feather"></i>لسه مفيش جلسات. لما تخلّص أول فضفضة هتظهر هنا.<div class="row-wrap center"><button class="btn btn-primary btn-sm" data-action="nav" data-page="listen">ابدأ فضفضة</button></div></div>`}</article>
    <article class="card glass gamify"><h3><i class="fa-solid fa-crown" style="color:var(--gold)"></i> حالة العضوية</h3>
      ${isPremium() ? `<p>إنت على خطة <b>${S.premium.plan === 'annual' ? 'السنوية' : 'الشهرية'}</b> (تجريبية). شكرًا إنك جربت!</p>` : '<p class="muted">إنت على الخطة المجانية — والدعم الأساسي هيفضل مجاني دايمًا.</p>'}
      <button class="btn btn-ghost btn-sm" data-action="nav" data-page="premium">${isPremium() ? 'إدارة الاشتراك' : 'شوف مميزات بريميوم'}</button></article>
  </div>`;
}
A['open-reflection'] = () => openReflection();
A['start-journey'] = el => startJourney(el.dataset.id, S.journeys.lastMood || 'rest');
A['clear-crisis'] = () => { S.flags.crisisUntil = 0; S.chatSession.crisis = false; save(); toast('الحمد لله إنك أحسن. لو الإحساس رجع، كلّم حد قريب منك أو اتصل بالطوارئ.', 'info'); refresh(); };
A['open-safety'] = () => openSafetyModal();

/* ============ 9. LISTENER (engine + voice) ============ */
const norm = s => String(s || '').toLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^ء-يa-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const CRISIS_WORDS = ['انتحر', 'هنتحر', 'اقتل نفسي', 'هقتل نفسي', 'عايز اموت', 'عاوز اموت', 'عايزه اموت', 'نفسي اموت', 'نفسي اخلص من حياتي', 'انهي حياتي', 'انهاء حياتي', 'مش عايز اعيش', 'مش عاوز اعيش', 'مش عايزه اعيش', 'مش حابب اعيش', 'اذي نفسي', 'اوذي نفسي', 'ايذاء نفسي', 'احسن لو مت', 'اخلص على نفسي', 'اخلص حياتي', 'suicide', 'kill myself'].map(norm);
const isCrisisText = text => { const t = ' ' + norm(text) + ' '; return CRISIS_WORDS.some(w => t.includes(w)); };

const KW = {
  spiritual: ['ربنا', 'الله', 'صلاه', 'دعاء', 'قران', 'ايمان', 'ذنب', 'ذنوب', 'توبه', 'بعيد عن ربنا', 'تقصير', 'سجاد'],
  failure: ['فاشل', 'فشل', 'مش كفايه', 'ولا حاجه', 'متاخر', 'بيتقدم', 'بتقدم', 'ضيعت عمري', 'مش نافع', 'ما حققتش', 'مكاني'],
  loneliness: ['وحيد', 'لوحدي', 'مفيش حد', 'محدش', 'مفيش اصحاب', 'وحده', 'غريب', 'مفيش حد فاهمني'],
  anxiety: ['قلقان', 'قلق', 'خايف', 'خوف', 'متوتر', 'توتر', 'مرعوب', 'افكار كتير', 'مش قادر انام', 'قلبي بيدق', 'هاجس'],
  sadness: ['حزين', 'زعلان', 'بعيط', 'عياط', 'حزن', 'ضيق', 'وجع', 'مكسور', 'مخنوق', 'مكتئب', 'تعبان نفسيا', 'دموع'],
  stress: ['ضغط', 'مضغوط', 'زهقان', 'مرهق', 'مستنزف', 'تعبان', 'دوشه', 'مخنوق من', 'مش قادر استحمل', 'انهيار'],
  motivation: ['مش قادر اعمل', 'مفيش حماس', 'فاقد الشغف', 'كسلان', 'مش عايز اعمل', 'ملل', 'مفيش دافع', 'مش قادر اقوم', 'مفيش شغف', 'مش عارف ابدا'],
  work: ['شغل', 'مديري', 'مدير', 'وظيفه', 'ترقيه', 'استقاله', 'دوام', 'مذاكره', 'امتحان', 'كليه', 'دراسه', 'مشروع'],
  relationship: ['علاقه', 'خطيبي', 'خطيبتي', 'حبيبي', 'حبيبتي', 'جوزي', 'مراتي', 'صاحبي', 'اهلي', 'ابويا', 'امي', 'خناق', 'سابني', 'انفصال', 'فراق', 'خيانه', 'زعلت منه'],
  positive: ['الحمد لله', 'كويس', 'احسن', 'مبسوط', 'سعيد', 'فرحان', 'مرتاح', 'تحسن', 'شكرا', 'ممتن', 'حلو']
};
const KWN = {}; Object.keys(KW).forEach(k => { KWN[k] = KW[k].map(norm); });
const PRIORITY = ['spiritual', 'failure', 'loneliness', 'anxiety', 'sadness', 'stress', 'motivation', 'work', 'relationship', 'positive'];
function detect(text) {
  const t = ' ' + norm(text) + ' '; let best = null, top = 0;
  for (const c of PRIORITY) {
    let s = 0; KWN[c].forEach(k => { if (t.includes(k)) s++; });
    if (c === 'positive' && (t.includes(' مش ') || t.includes(' مفيش ') || t.includes(' مو '))) s = 0;
    if (s > top) { best = c; top = s; }
  }
  return best;
}
const BANK = {
  failure: {
    reflect: ['حاسس من كلامك إنك شايل ضغط كبير، ويمكن مقارنة نفسك باللي حواليك بتتعبك أكتر.', 'الإحساس بالفشل بيكبر لما بنقارن أسوأ أيامنا بأحسن اللي بنشوفه عند الناس.', 'اللي بتوصفه تقيل فعلًا، ومع ذلك إنك لسه بتفكر وبتحاول معناه إنك مش واقف تمامًا زي ما حاسس.'],
    ask: ['خلينا ناخد الموضوع واحدة واحدة.. إيه أكتر حاجة حاسس إنها واقفة في طريقك دلوقتي؟', 'لو قسمنا الموضوع: الضغط ده جاي من الشغل، الدراسة، الناس، ولا حاجة تانية؟', 'إيه آخر حاجة عملتها، حتى لو صغيرة، وكنت شايفها تستاهل تتحسب؟']
  },
  loneliness: {
    reflect: ['الوحدة وجعها مختلف.. خصوصًا لما تكون وسط ناس وبرضه تحس إنك لوحدك.', 'إنك تحس إن مفيش حد فاهمك حاجة بتوجع، ومحدش يستاهل يشيلها لوحده.', 'شكرًا إنك قلتها بصراحة، ده مش سهل.'],
    ask: ['في حد كان قريب منك زمان وبتفتقده؟', 'إمتى بتحس بالوحدة أكتر؟ بالليل؟ ولا وسط الزحمة؟', 'لو تقدر تتكلم مع شخص واحد دلوقتي، كنت تحب يكون مين؟']
  },
  anxiety: {
    reflect: ['القلق بيخلّي الدماغ يجري قدام الأحداث وجسمك يتعب معاه.', 'لما الأفكار بتزدحم كده، ده مرهق فعلًا ومحتاج مساحة تتفرّغ فيها.', 'واضح إن في حاجة شاغلة بالك جامد.'],
    ask: ['إيه أكتر فكرة بتلف في دماغك دلوقتي؟', 'جسمك بيحس بإيه وإنت قلقان: تقل في الصدر؟ توتر في الكتف؟', 'تحب نجرب مع بعض تمرين تنفس قصير، ولا تفضّل نكمّل كلام الأول؟']
  },
  sadness: {
    reflect: ['واضح إن في حزن تقيل جواك، وأنا مقدّر إنك قدرت تقوله.', 'الحزن ساعات بييجي من غير سبب واضح، وده مش معناه إن في حاجة غلط فيك.', 'كلامك طالع من تعب حقيقي، وأنا هنا معاك.'],
    ask: ['تحب تحكيلي إيه اللي حصل الفترة الأخيرة وخلّاك تحس كده؟', 'الحزن ده جاي من موقف معين، ولا حاسس بيه من فترة؟', 'لو الحزن ده ليه شكل أو لون، كان هيبقى إيه؟ (مفيش إجابة صح)']
  },
  stress: {
    reflect: ['يبدو إنك شايل أكتر من طاقتك الفترة دي.', 'الضغط المستمر بيستنزف حتى أقوى الناس.', 'مفهوم إنك مرهق.. ده مش ضعف.'],
    ask: ['إيه الحاجة اللي لو اتشالت من على كتفك النهارده هتحس بفرق؟', 'في حاجة واحدة تقدر تأجلها أو حد يشاركك فيها من غير ما تحس بالذنب؟', 'إيه أكتر حاجة بتستنزفك فيهم: الوقت، الناس، ولا التوقعات؟']
  },
  motivation: {
    reflect: ['فقدان الحماس ساعات بيبقى إشارة إن الجسم والدماغ محتاجين راحة، مش لوم.', 'إنك مش قادر تتحرك مش معناه إنك كسول.', 'ده إحساس معروف لما الدنيا تتقل، وتقدر تعدّي منه خطوة خطوة.'],
    ask: ['إيه آخر حاجة كانت بتحمّسك زمان؟', 'لو الخطوة المطلوبة ٥ دقايق بس، كانت هتبقى إيه؟', 'من إمتى حاسس بكده؟ حصل حاجة قبلها؟']
  },
  work: {
    reflect: ['ضغط الشغل أو الدراسة بيدخل بيتنا من غير استئذان.', 'واضح إن الموضوع ده واخد من طاقتك كتير.'],
    ask: ['الضغط ده من حجم الشغل، من الناس، ولا من إحساسك إن مجهودك مش بيتشاف؟', 'إيه الجزء الأصعب فيه بالنسبة لك دلوقتي؟']
  },
  relationship: {
    reflect: ['العلاقات القريبة بتأثر فينا أكتر من أي حاجة، فطبيعي إنها توجعك.', 'سيرة الناس اللي بنحبهم بتفتح جروح مش سهلة.'],
    ask: ['إيه اللي حصل بينكم وكان أكتر حاجة وجعتك؟', 'إيه اللي نفسك تسمعه من الطرف التاني؟', 'إنت عايز إيه من العلاقة دي دلوقتي: تصليح، مسافة، ولا فهم؟']
  },
  spiritual: {
    reflect: ['حلو إنك جبت سيرة ربنا في كلامك، وده باب مفتوح دايمًا.', 'الإحساس بالبُعد أو التقصير ممكن يوجع، وده نفسه دليل إن في حاجة جواك لسه حيّة.'],
    ask: ['إيه اللي حاسس إنه بعّدك الفترة الأخيرة؟ ومفيش أي لوم هنا.', 'تحب نتكلم أكتر، ولا نقعد مع آية أو دعاء بسيط؟']
  },
  positive: {
    reflect: ['ده خبر حلو، فرحتلك فعلًا!', 'حلو إنك حاسس بتحسّن، خلينا نلاحظ إيه اللي ساعد.'],
    ask: ['إيه اللي عمل الفرق النهارده؟', 'إيه الحاجة الصغيرة اللي تحب تحافظ عليها؟']
  },
  general: {
    reflect: ['أنا سامعك، وخد وقتك.', 'مش لازم تكون عارف تقول إيه بالظبط.'],
    ask: ['تحب تبدأ من إيه اللي مثقّل عليك النهارده؟', 'ممكن تقولي حاسس بإيه دلوقتي بكلمة واحدة؟']
  }
};
const CAT_TO_MOOD = { failure: 'failure', loneliness: 'lonely', anxiety: 'suffocated', sadness: 'suffocated', stress: 'rest', motivation: 'passion', work: 'rest', relationship: 'lonely', spiritual: 'rest', positive: 'future', general: 'rest' };
const SUMMARY = {
  failure: ['الجلسة دارت حوالين إحساس بالضغط والمقارنة بالناس.', 'إنك بتفكر في ده بصراحة معناه إنك بتاخد نفسك بجدية، مش إنك فاشل.', 'اكتب ٣ حاجات عملتها الأسبوع ده، مهما كانت صغيرة.'],
  loneliness: ['الجلسة كانت عن الإحساس بالوحدة وقلة الفهم.', 'إنك فتحت قلبك ولو لجهاز تجريبي، ده دليل إنك لسه محتاج تتواصل وده طبيعي.', 'ابعت رسالة بسيطة لشخص واحد تثق فيه.'],
  anxiety: ['الجلسة اتكلمت عن قلق وأفكار كتير.', 'تسمية القلق بصوت عالي بتخفّف من تقله حتى لو شوية.', 'خد ٣ دقايق تنفس هادي: شهيق ٤ وزفير ٦.'],
  sadness: ['الجلسة كان فيها حزن واضح وتعب حقيقي.', 'مفيش حاجة غلط في إنك تحزن، وإنك وصّلته لكلمات خطوة مهمة.', 'اعمل حاجة لطيفة لجسمك النهارده: مياه، دش دافي، أو قعدة هادية.'],
  stress: ['الجلسة اتركزت حوالين ضغط وإرهاق.', 'إنك بتشوف حدودك طاقتك ده وعي مش ضعف.', 'اختار حاجة واحدة تأجلها أو تطلب مساعدة فيها.'],
  motivation: ['الجلسة اتكلمت عن فقدان الحماس والرغبة.', 'ساعات الراحة هي اللي بترجّع الدافع، مش الضغط على النفس.', 'ابدأ بخطوة مدتها ٥ دقايق بس.'],
  work: ['الجلسة اتركزت على ضغط الشغل أو الدراسة.', 'الإحساس بالتقل ده معناه إنك مهتم، ومحتاج تحمي طاقتك.', 'اكتب أهم ٣ مهام وسيب الباقي لبكرة.'],
  relationship: ['الجلسة كانت عن علاقة بتأثر فيك.', 'مشاعرك تجاه الناس القريبة منك دليل إنهم مهمين ليك.', 'اكتب اللي نفسك تقوله للطرف التاني من غير ما تبعته.'],
  spiritual: ['الجلسة لمست جانب روحي.', 'سعيك للقرب أو راحة القلب شيء ثمين مهما كان حالك.', 'خد دقيقة سكون وقول اللي في قلبك بكلامك البسيط.'],
  positive: ['الجلسة كان فيها لحظات تحسّن وراحة.', 'ملاحظتك لللحظات الحلوة بتقويها.', 'اكتب اللي ساعدك النهارده عشان ترجعله وقت التعب.'],
  general: ['الجلسة كانت مساحة هادية للكلام.', 'إنك خصصت وقت لنفسك ده في حد ذاته استثمار.', 'خد كوباية مية ونفس عميق قبل ما ترجع ليومك.']
};
const CRISIS_FOLLOW = ['أنا هنا معاك. قبل أي حاجة: إنت في مكان آمن دلوقتي؟ وفي حد قريب منك تقدر تكلمه أو يجي عندك؟', 'خلّي بالك من نفسك. لو الأفكار دي زادت، اتصل بالإسعاف 123 أو الشرطة 122، أو اطلب من حد قريب يفضل معاك.', 'مهم تكون مع حد حقيقي دلوقتي. تقدر تبعتله «أنا مش بخير وعايزك جنبي». تحب أساعدك تكتب الرسالة دي؟'];
const SAFETY_TEXT = 'كلامك مهم، وأنا قلقان عليك فعلًا. اللي بتمر بيه دلوقتي أكبر من إن حد يشيله لوحده — وأنا برنامج تجريبي ومقدرش أكون مصدر الأمان الوحيد ليك.\n\nلو حاسس إنك ممكن تأذي نفسك:\n• كلّم شخص قريب تثق فيه دلوقتي، ولو بجملة واحدة: «أنا مش بخير وعايزك جنبي».\n• ابعد عن أي حاجة ممكن تأذيك، وحاول تفضل مع حد.\n• اتصل بالطوارئ — في مصر: الإسعاف 123 • الشرطة 122 — أو روح لأقرب طوارئ.\n• لو إنت في بلد تانية، دوّر على رقم الطوارئ أو خط الدعم النفسي المحلي.\n\nأنا موجود نكمّل كلام، بس من فضلك ما تكتفيش بيا.';

const turn = {}; let lastCat = null, busy = false, aiCount = 0;

/** Replace this function with a real API call later: send {text, history}, return {text, chips, category}. */
async function getAIReply(text, history) {
  await delay(900 + Math.min(text.length * 14, 1500));
  if (isCrisis()) return { text: CRISIS_FOLLOW[(turn.crisis = (turn.crisis || 0) + 1) % CRISIS_FOLLOW.length], chips: [], category: 'crisis' };
  const short = norm(text).split(' ').length < 3;
  const cat = detect(text) || (short && lastCat) || 'general';
  const bank = BANK[cat] || BANK.general;
  const n = turn[cat] = (turn[cat] || 0) + 1, i = n - 1;
  const reply = (short && lastCat && n > 1 ? '' : bank.reflect[i % bank.reflect.length] + ' ') + bank.ask[i % bank.ask.length];
  lastCat = cat; aiCount++;
  return { text: reply.trim(), chips: chipsFor(cat), category: cat };
}
function chipsFor(cat) {
  if (cat === 'spiritual') {
    return S.settings.spiritual
      ? [{ k: 'say', v: 'تحب أحكي أكتر', l: 'أحكي أكتر' }, { k: 'spirit', v: 'verse', l: 'أقرأ آية وأتدبرها' }, { k: 'spirit', v: 'dua', l: 'أسمع دعاء' }, { k: 'spirit', v: 'rest', l: 'أكتفي بالراحة دلوقتي' }]
      : [{ k: 'say', v: 'عايز أحكي أكتر عن الموضوع ده', l: 'أحكي أكتر' }, { k: 'enable-spirit', v: '', l: 'أفعّل القسم الروحي' }, { k: 'breathe', v: '', l: 'تنفّس هادي' }];
  }
  if (cat === 'anxiety') return [{ k: 'breathe', v: '', l: 'نجرّب تنفّس مع بعض' }, { k: 'say', v: 'عايز أكمّل كلام', l: 'أكمّل كلام' }, { k: 'end', v: '', l: 'كفاية كده دلوقتي' }];
  const mood = CAT_TO_MOOD[cat] || 'rest', scn = (MOODS.find(m => m.id === mood) || MOODS[5]).rec;
  const list = [{ k: 'say', v: 'عايز أحكي أكتر', l: 'أحكي أكتر' }, { k: 'breathe', v: '', l: 'محتاج أهدى شوية' }];
  if (aiCount % 2 === 0) list.push({ k: 'journey', v: scn, l: 'رحلة خيال تريّحني' });
  list.push({ k: 'end', v: '', l: 'كفاية كده دلوقتي' });
  return list;
}

function welcomeText() {
  return S.profile.lang === 'msa'
    ? 'أنا هنا لأسمعك.. دون أحكام.\nتحدّث براحتك، ولا يلزمك أن تعرف من أين تبدأ.'
    : 'أنا هنا أسمعك.. من غير أحكام.\nاحكيلي براحتك، مش لازم تكون عارف تبدأ منين.';
}
function ensureWelcome() {
  if (!S.chat.length) {
    S.chat.push({ id: uid(), role: 'ai', type: 'text', text: welcomeText(), t: Date.now(), welcome: true }); save();
  }
}
function msgHTML(m) {
  if (m.type === 'divider') return `<div class="divider" data-id="${m.id}">${esc(m.text)}</div>`;
  let body;
  if (m.type === 'voice') {
    const url = voiceUrls[m.id];
    body = `<i class="fa-solid fa-microphone"></i> رسالة صوتية (${fmtDur(m.dur || 0)})${url ? `<audio controls src="${url}"></audio>` : '<br><small>(التسجيل غير محفوظ بعد التحديث)</small>'}${m.text ? `<br><small>النص: ${esc(m.text)}</small>` : ''}`;
  } else body = esc(m.text);
  return `<div class="msg ${m.role} ${m.type === 'safety' ? 'safety' : ''}" data-id="${m.id}"><div class="bubble">${body}<span class="meta">${fmtTime(m.t)}</span></div></div>`;
}
function renderChat() {
  ensureWelcome();
  const log = $('#chatLog');
  log.innerHTML = S.chat.map(msgHTML).join('');
  log.scrollTop = log.scrollHeight;
}
function renderListen() { renderChat(); const last = S.chat[S.chat.length - 1]; renderChips(S.chat.length === 1 && last.welcome ? [{ k: 'say', v: 'مش عارف أبدأ منين', l: 'مش عارف أبدأ منين' }, { k: 'say', v: 'حاسس بضغط كبير', l: 'حاسس بضغط' }, { k: 'say', v: 'محتاج أرتاح', l: 'محتاج أرتاح' }, { k: 'journey', v: 'beach', l: 'عايز رحلة خيال' }] : []); }
function renderChips(list) {
  $('#quickReplies').innerHTML = (list || []).map(c => `<button class="pill" data-action="chip" data-kind="${c.k}" data-val="${esc(c.v)}">${esc(c.l)}</button>`).join('');
}
function addMsg(m) {
  m.id = m.id || uid(); m.t = m.t || Date.now();
  S.chat.push(m); save();
  const log = $('#chatLog'); log.insertAdjacentHTML('beforeend', msgHTML(m)); log.scrollTop = log.scrollHeight;
  return m;
}
function showTyping() {
  hideTyping();
  $('#chatLog').insertAdjacentHTML('beforeend', '<div class="msg ai" id="typingRow"><div class="bubble typing-bubble"><span class="typing"><i></i><i></i><i></i></span></div></div>');
  const log = $('#chatLog'); log.scrollTop = log.scrollHeight;
}
function hideTyping() { const t = $('#typingRow'); if (t) t.remove(); }

async function respond(text) {
  busy = true; renderChips([]);
  const send = $('#chatForm .send-btn'); if (send) send.disabled = true;
  try {
    if (isCrisisText(text)) { showTyping(); await delay(700); hideTyping(); triggerCrisis(); return; }
    showTyping();
    const r = await getAIReply(text, S.chat);
    hideTyping();
    addMsg({ role: 'ai', type: 'text', text: r.text });
    renderChips(r.chips);
    const userCount = sessionMsgs().filter(m => m.role === 'user').length;
    if (!isPremium() && !isCrisis() && userCount === 20) addMsg({ role: 'ai', type: 'text', text: 'ملاحظة لطيفة: إحنا اتكلمنا كتير 🌿 تقدر تكمّل فضفضة زي ما تحب — بريميوم بيضيف ملخصات أعمق للجلسات الطويلة، بس الفضفضة نفسها مش هتتقفل أبدًا.' });
  } catch (err) {
    console.error(err); hideTyping(); toast('حصلت مشكلة صغيرة. جرّب تبعت تاني.', 'error');
  } finally { busy = false; if (send) send.disabled = false; }
}
async function sendText(raw) {
  const text = String(raw || '').trim(); if (!text || busy) return;
  addMsg({ role: 'user', type: 'text', text });
  const inp = $('#chatInput'); inp.value = ''; autosize(inp);
  await respond(text);
}
function autosize(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px'; }
const sessionMsgs = () => S.chat.filter(m => m.t >= S.chatSession.startedAt && (m.type === 'text' || m.type === 'voice'));

function triggerCrisis() {
  S.flags.crisisUntil = Date.now() + 6 * 3600 * 1000; S.chatSession.crisis = true; save();
  if (J.active) closeJourney(true);
  addMsg({ role: 'ai', type: 'safety', text: SAFETY_TEXT });
  renderChips([]); updateModes(); renderSide();
  openSafetyModal();
}
function openSafetyModal() {
  openModal({ title: 'إنت مهم.. ومش لازم تعدّي ده لوحدك', html: `
    <p>${esc(SAFETY_TEXT).split('\n\n')[0]}</p>
    <div class="sec"><b>دلوقتي</b>كلّم شخص قريب تثق فيه، وحاول تفضل مع حد.</div>
    <div class="sec"><b>طوارئ (مصر)</b>الإسعاف <a href="tel:123">123</a> • الشرطة <a href="tel:122">122</a> — أو أقرب طوارئ. لو في بلد تانية دوّر على رقم الطوارئ المحلي.</div>
    <p class="muted tiny">نَفَس نموذج تجريبي ومش بديل عن مساعدة بشرية حقيقية. تم إيقاف الرحلات والمكافآت مؤقتًا.</p>
    <div class="row-wrap"><button class="btn btn-primary" data-action="modal-close">فاهم</button><button class="btn btn-ghost" data-action="clear-crisis">أنا بخير دلوقتي</button></div>` });
}

/* ---- session end ---- */
function endSession() {
  if (S.chatSession.crisis || isCrisis()) {
    openModal({ title: 'قبل ما نقفل', html: '<p>الأهم دلوقتي إنك مش لوحدك. من فضلك خلّي حد قريب منك يعرف إنك محتاج دعم، ولو فيه خطر فوري اتصل بالطوارئ (مصر: 123 / 122).</p><div class="row-wrap"><button class="btn btn-primary" data-action="modal-close">تمام</button></div>' });
    S.chatSession = { startedAt: Date.now(), crisis: S.chatSession.crisis }; save(); return;
  }
  const users = sessionMsgs().filter(m => m.role === 'user');
  if (users.length < 2) { toast('الجلسة لسه قصيرة — احكيلي شوية كمان لو حابب، وبعدين نلخّصها.', 'info'); return; }
  const counts = {}; users.forEach(m => { const c = detect(m.text || '') || 'general'; counts[c] = (counts[c] || 0) + 1; });
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const top = sorted[0] === 'general' && sorted[1] ? sorted[1] : sorted[0];
  const [sum, refl, act] = SUMMARY[top] || SUMMARY.general;
  const moodId = CAT_TO_MOOD[top] || 'rest', mood = MOODS.find(m => m.id === moodId) || MOODS[5];
  let scn = SCENARIOS[mood.rec]; if (scn.needsSpiritual && !S.settings.spiritual) scn = SCENARIOS.beach;
  const verse = VERSES[(users.length + (top || '').length) % VERSES.length];
  S.sessions.unshift({ id: uid(), t: Date.now(), title: 'فضفضة: ' + mood.label, msgs: users.length }); S.sessions = S.sessions.slice(0, 30);
  S.journeys.lastMood = moodId;
  addMsg({ role: 'ai', type: 'divider', text: '— انتهت الجلسة —' });
  S.chatSession = { startedAt: Date.now(), crisis: false }; save();
  markTask('session');
  const deep = isPremium() ? `<div class="sec"><b>تأمل أعمق (بريميوم)</b>لو رجعت لنفس الموضوع بعد أسبوع، إيه اللي تتوقع إنه اتغيّر؟ وإيه اللي تحب تبقى مختلف؟</div>` : '';
  const spirit = S.settings.spiritual ? `<div class="sec"><b>تأمل روحي (اختياري)</b><span class="quran-text sm" style="display:block;text-align:center">${esc(verse.t)}</span><small class="muted">${esc(verse.r)}</small><p style="margin:.6em 0 0">تحب نختم رحلتنا بحاجة بسيطة تقربك من السكينة؟</p>
    <div class="row-wrap"><button class="pill" data-action="spirit-choice" data-val="verse">أقرأ آية وأتدبرها</button><button class="pill" data-action="spirit-choice" data-val="dua">أسمع دعاء</button><button class="pill" data-action="spirit-choice" data-val="pray">أخصص وقت للصلاة</button><button class="pill" data-action="spirit-choice" data-val="rest">أكتفي بالراحة دلوقتي</button></div></div>` : '';
  openModal({ title: 'ملخص الجلسة', wide: true, html: `
    <div class="sec"><b>ملخص لطيف</b>${esc(sum)}</div>
    <div class="sec"><b>تأمل إيجابي</b>${esc(refl)}</div>
    <div class="sec"><b>رحلة مقترحة</b>${esc(scn.title)} — ${esc(scn.desc)}</div>
    <div class="sec"><b>خطوة صغيرة في حياتك الحقيقية</b>${esc(act)}</div>${deep}${spirit}
    <p class="tiny muted">ده ملخص تقريبي بسيط، مش تقييم نفسي ولا تشخيص.</p>
    <div class="row-wrap"><button class="btn btn-primary" data-action="start-journey" data-id="${scn.id}" data-modal-close="1">ابدأ الرحلة المقترحة</button><button class="btn btn-ghost" data-action="modal-close">إغلاق</button></div>` });
  refresh();
}

/* ---- breathing exercise ---- */
let breathTimer = 0;
function openBreathing() {
  openModal({ title: 'تمرين تنفّس قصير', onClose: () => clearTimeout(breathTimer), html: '<div class="center"><div class="breath big" id="bCircle" style="margin:20px auto;transform:scale(.7)"></div><p id="bText" class="lead-sm" style="font-size:1.2rem">استعد…</p><p class="muted tiny">٣ دورات • شهيق ٤ • حبس ٢ • زفير ٦</p></div>' });
  const circle = $('#bCircle'), text = $('#bText');
  const seq = [['شهيق براحة…', 4000, 1.5], ['امسك نفسك شوية', 2000, 1.5], ['زفير طويل وهادي…', 6000, .7]];
  let step = 0; const total = seq.length * 3;
  (function run() {
    if (!$('#bCircle')) return;
    if (step >= total) { text.textContent = 'خلّصنا. حاسس بفرق ولو بسيط؟'; circle.style.transform = 'scale(1)'; return; }
    const [label, ms, sc] = seq[step % 3];
    text.textContent = label; circle.style.transitionDuration = ms + 'ms'; circle.style.transform = `scale(${sc})`;
    step++; breathTimer = setTimeout(run, ms);
  })();
}

/* ---- voice recording ---- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const Rec = { mr: null, stream: null, chunks: [], t0: 0, timer: 0, recog: null, transcript: '', cancelled: false, pending: 0, finalized: false };
async function recStart() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') { toast('متصفحك مش بيدعم التسجيل الصوتي. تقدر تكتب رسالتك عادي.', 'warn'); return; }
  try { Rec.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (err) { toast(err && err.name === 'NotAllowedError' ? 'محتاجين إذن الميكروفون عشان التسجيل. تقدر تكتب بدله.' : 'مقدرناش نفتح الميكروفون على جهازك.', 'warn'); return; }
  Rec.chunks = []; Rec.transcript = ''; Rec.cancelled = false; Rec.finalized = false; Rec.pending = 1;
  try { Rec.mr = new MediaRecorder(Rec.stream); } catch (e) { toast('مقدرناش نبدأ التسجيل في المتصفح ده.', 'warn'); recCleanup(); return; }
  Rec.mr.ondataavailable = e => { if (e.data && e.data.size) Rec.chunks.push(e.data); };
  Rec.mr.onstop = () => recDone();
  Rec.mr.start(); Rec.t0 = Date.now();
  if (SR) {
    try {
      Rec.recog = new SR(); Rec.recog.lang = 'ar-EG'; Rec.recog.continuous = true; Rec.recog.interimResults = false; Rec.pending++;
      Rec.recog.onresult = ev => { for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) Rec.transcript += ev.results[i][0].transcript + ' '; };
      Rec.recog.onerror = () => {}; Rec.recog.onend = () => recDone();
      Rec.recog.start();
    } catch (e) { Rec.recog = null; Rec.pending = 1; }
  }
  $('#recBar').classList.remove('hidden'); $('#micBtn').classList.add('on');
  $('#recTime').textContent = fmtDur(0);
  Rec.timer = setInterval(() => { const s = (Date.now() - Rec.t0) / 1000; $('#recTime').textContent = fmtDur(s); if (s >= 180) recStop(); }, 250);
  if (!SR) toast('بيسجّل صوتك. تحويل الصوت لنص مش مدعوم في المتصفح ده.', 'info');
}
function recStop() {
  if (!Rec.mr || Rec.mr.state !== 'recording') return;
  clearInterval(Rec.timer);
  try { Rec.mr.stop(); } catch (e) { /* ignore */ }
  try { if (Rec.recog) Rec.recog.stop(); } catch (e) { /* ignore */ }
  setTimeout(() => { Rec.pending = 0; recDone(true); }, 1800);   // safety net
}
function recCancel() { Rec.cancelled = true; recStop(); if (!Rec.mr || Rec.mr.state !== 'recording') recCleanup(); }
function recCleanup() {
  clearInterval(Rec.timer);
  if (Rec.stream) Rec.stream.getTracks().forEach(t => t.stop());
  Rec.stream = null; Rec.mr = null; Rec.recog = null;
  $('#recBar').classList.add('hidden'); $('#micBtn').classList.remove('on');
}
function recDone(force) {
  if (!force) Rec.pending--;
  if (Rec.pending > 0 || Rec.finalized) return;
  Rec.finalized = true;
  const dur = Math.round((Date.now() - Rec.t0) / 1000), chunks = Rec.chunks.slice(), type = (Rec.mr && Rec.mr.mimeType) || 'audio/webm', text = Rec.transcript.trim(), cancelled = Rec.cancelled;
  recCleanup();
  if (cancelled || !chunks.length || dur < 1) { if (!cancelled) toast('التسجيل كان قصير جدًا.', 'warn'); return; }
  const url = URL.createObjectURL(new Blob(chunks, { type }));
  const m = addMsg({ role: 'user', type: 'voice', dur, text }); voiceUrls[m.id] = url;
  const row = $(`.msg[data-id="${m.id}"]`); if (row) row.outerHTML = msgHTML(m);
  if (text) respond(text);
  else {
    busy = true; showTyping();
    delay(1100).then(() => { hideTyping(); addMsg({ role: 'ai', type: 'text', text: 'وصلتني رسالتك الصوتية 🌿 في النسخة دي مقدرش أفهم الصوت لوحده — تحب تكتبلي الخلاصة بكلماتك؟ أو احكيلي بالكتابة اللي حاسس بيه.' }); busy = false; });
  }
}

Object.assign(A, {
  'rec-toggle': () => { if (Rec.mr && Rec.mr.state === 'recording') recStop(); else recStart(); },
  'rec-stop': recStop, 'rec-cancel': recCancel,
  'end-session': endSession, breathe: openBreathing,
  'delete-chat': () => confirmModal('مسح المحادثة', 'هتتمسح كل رسائل الفضفضة من متصفحك. الملخصات المحفوظة هتفضل.', 'امسح المحادثة', () => {
    S.chat = []; S.chatSession = { startedAt: Date.now(), crisis: false }; Object.keys(voiceUrls).forEach(k => delete voiceUrls[k]); lastCat = null; save(); toast('اتمسحت المحادثة.', 'success'); if (currentPage === 'listen') renderListen();
  }, true),
  chip: el => {
    const k = el.dataset.kind, v = el.dataset.val;
    if (k === 'say') sendText(v); else if (k === 'breathe') openBreathing(); else if (k === 'journey') startJourney(v, S.journeys.lastMood || 'rest');
    else if (k === 'end') endSession(); else if (k === 'spirit') spiritChoice(v); else if (k === 'enable-spirit') { setSpiritual(true); renderListen(); }
  },
  'spirit-choice': el => { closeModal(); spiritChoice(el.dataset.val); }
});
F.chat = () => sendText($('#chatInput').value);

/* ============ 10. DREAM JOURNEY ============ */
const J = { active: false, scn: null, mood: null, steps: [], i: 0, paused: false, timer: 0, muted: true, action: '' };
let pickedMood = null;

function renderJourneyPage() {
  ensureDays();
  const root = $('#page-journey'), sel = pickedMood || S.journeys.lastMood;
  const limit = isPremium() ? '∞' : nf(3 + S.journeys.extra);
  const prog = S.journeys.progress, hist = S.journeys.history.slice(0, 4);
  root.innerHTML = `
  <header class="page-head"><div class="grow"><p class="eyebrow">استراحة قصيرة • مش هروب</p><h1>رحلة الخيال</h1><p class="muted" style="margin:0">رحلات هادية ترجّعلك الأمل، وبتخلّصك بخطوة صغيرة في حياتك الحقيقية. اليوم: ${nf(S.journeys.count)} من ${limit}.</p></div></header>
  ${prog ? `<div class="banner info"><i class="fa-solid fa-play"></i><div class="grow"><b>عندك رحلة متوقفة: ${esc((SCENARIOS[prog.scn] || {}).title || '')}</b></div><button class="btn btn-primary btn-sm" data-action="j-resume">كمّل</button></div>` : ''}
  <h3>١. حاسس بإيه دلوقتي؟</h3>
  <div class="mood-grid">${MOODS.map(m => `<button class="mood glass ${sel === m.id ? 'sel' : ''}" data-action="pick-mood" data-id="${m.id}"><i class="fa-solid ${m.icon}"></i><span>${esc(m.label)}</span></button>`).join('')}</div>
  <h3>٢. اختار رحلتك ${sel ? '' : '<small class="muted">(اختار حالتك الأول عشان نرشّح لك)</small>'}</h3>
  <div class="grid cards-3">${SCN_ORDER.map(id => {
    const s = SCENARIOS[id], m = MOODS.find(x => x.id === sel), isRec = m && m.rec === id;
    const locked = s.premium && !isPremium() && !S.journeys.unlocked.desert, off = s.needsSpiritual && !S.settings.spiritual;
    return `<button class="card glass scn" data-action="start-journey-card" data-id="${id}">
      <span class="jc-art j-${id}"></span>${isRec ? '<span class="badge ok">مقترحة ليك</span>' : locked ? '<span class="badge gold"><i class="fa-solid fa-lock"></i> بريميوم</span>' : off ? '<span class="badge">اختياري</span>' : ''}
      <h3><i class="fa-solid ${s.icon}"></i> ${esc(s.title)}</h3><p>${esc(s.desc)}</p><small class="muted">${nf(s.steps.length + 2)} مشاهد</small></button>`;
  }).join('')}</div>
  <article class="card glass" style="margin-top:18px"><h3>آخر رحلاتك</h3>${hist.length ? `<div class="list">${hist.map(h => `<div class="item"><i class="fa-solid ${(SCENARIOS[h.id] || {}).icon || 'fa-star'}" style="color:var(--cyan)"></i><div class="grow"><b>${esc((SCENARIOS[h.id] || {}).title || '')}</b><small class="muted">${fmtDate(h.t)}${h.action ? ' • خطوتك: ' + esc(h.action) : ''}</small></div></div>`).join('')}</div>` : '<div class="empty"><i class="fa-solid fa-cloud-moon"></i>لسه ما بدأتش أي رحلة.</div>'}</article>`;
}
A['pick-mood'] = el => { pickedMood = el.dataset.id; S.journeys.lastMood = pickedMood; save(); renderJourneyPage(); };
A['start-journey-card'] = el => startJourney(el.dataset.id, pickedMood || S.journeys.lastMood || 'rest');

function buildSteps(moodId, scn) {
  const mood = MOODS.find(m => m.id === moodId) || MOODS[5];
  return [{ t: mood.intro, breath: true }, ...scn.steps.map(t => ({ t })), { t: GROUND, breath: true }];
}
function startJourney(scnId, moodId, resume) {
  closeModal();
  const scn = SCENARIOS[scnId]; if (!scn) return;
  if (isCrisis()) { openSafetyModal(); return; }
  ensureDays();
  if (scn.needsSpiritual && !S.settings.spiritual) {
    openModal({ title: 'القسم الروحي مقفول', html: '<p>رحلة «سكينة روحية» جزء من القسم الروحي الاختياري. تحب تفعّله؟ تقدر تقفله في أي وقت.</p><div class="row-wrap"><button class="btn btn-primary" data-action="enable-spirit-go">فعّله</button><button class="btn btn-ghost" data-action="modal-close">لا، شكرًا</button></div>' }); return;
  }
  if (scn.premium && !isPremium() && !S.journeys.unlocked.desert) {
    openModal({ title: 'بيئة بريميوم 🌙', html: `<p>«${esc(scn.title)}» بيئة سينمائية مميزة. تقدر تفتحها بـ ٣٠ Hope Coins (رصيدك: ${nf(S.wallet.balance)}) أو بالاشتراك التجريبي.</p><div class="row-wrap"><button class="btn btn-primary" data-action="shop-buy" data-id="desert">افتحها بـ ٣٠ عملة</button><button class="btn btn-ghost" data-action="nav" data-page="premium" data-modal-close="1">شوف بريميوم</button><button class="btn btn-ghost" data-action="modal-close">مش دلوقتي</button></div>` }); return;
  }
  if (!resume) {
    const limit = isPremium() ? Infinity : 3 + S.journeys.extra;
    if (S.journeys.count >= limit) {
      openModal({ title: 'وصلت لحد رحلات النهارده', html: `<p>الخطة المجانية فيها ٣ رحلات يوميًا — وده عشان الرحلات تفضل استراحة مش بديل عن يومك 🌿 تقدر تاخد رحلة إضافية بـ ١٠ عملات، أو تستنى بكرة، أو تجرّب بريميوم.</p><div class="row-wrap"><button class="btn btn-primary" data-action="shop-buy" data-id="extra" data-then="${scnId}:${moodId}">رحلة إضافية (١٠ عملات)</button><button class="btn btn-ghost" data-action="nav" data-page="premium" data-modal-close="1">بريميوم</button><button class="btn btn-ghost" data-action="modal-close">تمام</button></div>` }); return;
    }
    S.journeys.count++;
  }
  S.journeys.lastMood = moodId; pickedMood = moodId;
  J.scn = scn; J.mood = moodId; J.steps = buildSteps(moodId, scn); J.i = resume ? Math.min(resume.i, J.steps.length - 1) : 0; J.paused = false; J.active = true; J.action = '';
  S.journeys.progress = { scn: scn.id, mood: moodId, i: J.i }; save();
  $('#jDone').classList.add('hidden');
  $('#jScene').className = 'j-scene sc-' + scn.id; $('#jScene').innerHTML = sceneSVG(scn.id);
  $('#journey').classList.remove('hidden'); document.body.style.overflow = 'hidden';
  if (!J.muted) Ambient.start(scn.audio);
  showStep();
}
function showStep() {
  clearTimeout(J.timer);
  const st = J.steps[J.i], n = J.steps.length, p = $('#jText');
  p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; p.textContent = st.t;
  $('#jBreath').classList.toggle('show', !!st.breath);
  $('#jBar').style.width = Math.round(((J.i + 1) / n) * 100) + '%';
  $('#jCount').textContent = `${nf(J.i + 1)}/${nf(n)}`;
  $('#jPrev').disabled = J.i === 0;
  $('#jNext').innerHTML = J.i === n - 1 ? 'إنهاء الرحلة <i class="fa-solid fa-check"></i>' : 'التالي <i class="fa-solid fa-chevron-left"></i>';
  S.journeys.progress = { scn: J.scn.id, mood: J.mood, i: J.i }; save();
  if (!J.paused) J.timer = setTimeout(jNext, Math.min(15000, 6500 + st.t.length * 55));
}
function jNext() { if (!J.active) return; if (J.i >= J.steps.length - 1) completeJourney(); else { J.i++; showStep(); } }
function jPrev() { if (!J.active || J.i === 0) return; J.i--; showStep(); }
function jPause() {
  J.paused = !J.paused; clearTimeout(J.timer);
  $('#jPause').innerHTML = J.paused ? '<i class="fa-solid fa-play"></i> كمّل' : '<i class="fa-solid fa-pause"></i> إيقاف مؤقت';
  if (!J.paused) showStep();
}
function closeJourney(silent) {
  clearTimeout(J.timer); J.active = false; Ambient.stop();
  $('#journey').classList.add('hidden'); $('#jDone').classList.add('hidden'); document.body.style.overflow = '';
  $('#jPause').innerHTML = '<i class="fa-solid fa-pause"></i> إيقاف مؤقت';
  if (!silent) toast('اتحفظ تقدمك — تقدر تكمّل الرحلة وقت ما تحب.', 'info');
  refresh();
}
function completeJourney() {
  clearTimeout(J.timer); Ambient.stop();
  S.journeys.progress = null; S.journeys.history.unshift({ id: J.scn.id, mood: J.mood, t: Date.now(), action: '' }); S.journeys.history = S.journeys.history.slice(0, 20); save();
  markTask('journey');
  $('#jActions').innerHTML = REAL_ACTIONS.slice().sort(() => Math.random() - .5).slice(0, 4).map(a => `<button class="pill" data-action="j-pick" data-text="${esc(a)}">${esc(a)}</button>`).join('');
  $('#jCustom').value = ''; J.action = '';
  $('#jDone').classList.remove('hidden');
}
function jCommit() {
  const custom = $('#jCustom').value.trim(), act = custom || J.action;
  if (!act) { toast('اختار خطوة صغيرة أو اكتب واحدة من عندك.', 'warn'); return; }
  if (S.journeys.history[0]) S.journeys.history[0].action = act;
  S.journeys.lastAction = act; save();
  closeJourney(true); toast('حلو! خطوتك: «' + act + '» 🌱 بالتوفيق.', 'success');
  if (act.includes('اكتب حاجة')) openReflection('إيه حاجة نجحت فيها النهارده؟');
}
Object.assign(A, {
  'j-next': jNext, 'j-prev': jPrev, 'j-pause': jPause, 'j-exit': () => closeJourney(false),
  'j-finish': () => closeJourney(true),
  'j-pick': el => { J.action = el.dataset.text; $('#jCustom').value = ''; $$('#jActions .pill').forEach(b => b.classList.toggle('sel', b === el)); },
  'j-commit': jCommit,
  'j-mute': () => {
    J.muted = !J.muted; $('#jMute').innerHTML = `<i class="fa-solid ${J.muted ? 'fa-volume-xmark' : 'fa-volume-high'}"></i>`;
    if (J.muted) Ambient.stop(); else if (!Ambient.start(J.scn.audio)) { J.muted = true; $('#jMute').innerHTML = '<i class="fa-solid fa-volume-xmark"></i>'; toast('الصوت مش مدعوم في المتصفح ده.', 'warn'); }
  },
  'j-resume': () => { const p = S.journeys.progress; if (p && SCENARIOS[p.scn]) startJourney(p.scn, p.mood, p); },
  'enable-spirit-go': () => { closeModal(); setSpiritual(true); goPage('spiritual'); }
});

/* ---- procedural ambient audio (no external files) ---- */
const Ambient = {
  ctx: null, nodes: [],
  start(kind) {
    this.stop();
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      this.ctx = this.ctx || new AC(); if (this.ctx.state === 'suspended') this.ctx.resume();
      const ctx = this.ctx, master = ctx.createGain(); master.gain.setValueAtTime(0, ctx.currentTime); master.gain.linearRampToValueAtTime(.5, ctx.currentTime + 2.5); master.connect(ctx.destination);
      const nodes = [master];
      const osc = (f, g) => { const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; gn.gain.value = g; o.connect(gn); gn.connect(master); o.start(); nodes.push(o, gn); };
      const noise = (freq, type, rate, depth, base) => {
        const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
        const g = ctx.createGain(); g.gain.value = base;
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = rate; lg.gain.value = depth; lfo.connect(lg); lg.connect(g.gain);
        src.connect(f); f.connect(g); g.connect(master); src.start(); lfo.start(); nodes.push(src, f, g, lfo, lg);
      };
      if (kind === 'waves') { noise(500, 'lowpass', .1, .1, .14); osc(110, .04); }
      else if (kind === 'wind') { noise(900, 'bandpass', .07, .08, .1); osc(98, .035); osc(147, .025); }
      else { osc(110, .05); osc(165, .035); osc(220, .02); }
      this.nodes = nodes; return true;
    } catch (e) { return false; }
  },
  stop() { this.nodes.forEach(n => { try { if (n.stop) n.stop(); } catch (e) { /* ignore */ } try { n.disconnect(); } catch (e) { /* ignore */ } }); this.nodes = []; }
};

/* ---- scene illustrations (inline SVG) ---- */
function sceneSVG(id) {
  const open = '<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" aria-hidden="true">', close = '</svg>';
  const wavePath = y => `M0 ${y} Q100 ${y - 22} 200 ${y} T400 ${y} T600 ${y} T800 ${y} T1000 ${y} V450 H0Z`;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = n => Array.from({ length: n }, () => `<circle cx="${Math.round(rnd() * 800)}" cy="${Math.round(rnd() * 230)}" r="${(rnd() * 1.4 + .5).toFixed(1)}" fill="#fff" opacity="${(rnd() * .6 + .3).toFixed(2)}"/>`).join('');
  if (id === 'beach') return open + `<circle cx="400" cy="270" r="70" fill="#ffd9a0" opacity=".95"/><circle cx="400" cy="270" r="110" fill="#ffb38a" opacity=".25"/><path class="wave w3" d="${wavePath(300)}" fill="rgba(255,160,120,.35)"/><path class="wave w2" d="${wavePath(335)}" fill="rgba(80,70,160,.55)"/><path class="wave" d="${wavePath(375)}" fill="rgba(30,30,100,.75)"/><rect y="415" width="800" height="35" fill="#d9a56b" opacity=".6"/>` + close;
  if (id === 'future') return open + `<circle cx="400" cy="300" r="60" fill="#ffe6b0"/><path d="M0 330 Q150 260 300 320 T600 300 T800 320 V450 H0Z" fill="#4b3d9e"/><path d="M0 380 Q200 330 400 375 T800 360 V450 H0Z" fill="#2a2468"/><path d="M360 450 Q390 400 400 360 Q410 400 440 450Z" fill="#ffd6a5" opacity=".7"/>` + close;
  if (id === 'city') {
    let b = '', x = 0; while (x < 800) { const w = 40 + Math.round(rnd() * 40), h = 90 + Math.round(rnd() * 200); b += `<rect x="${x}" y="${450 - h}" width="${w}" height="${h}" fill="#0b0f3a" stroke="#4de3ff" stroke-opacity=".25"/>`; for (let wy = 450 - h + 12; wy < 440; wy += 20) for (let wx = x + 8; wx < x + w - 8; wx += 14) if (rnd() > .55) b += `<rect x="${wx}" y="${wy}" width="6" height="9" fill="#7fe7ff" opacity="${(rnd() * .5 + .4).toFixed(2)}"/>`; x += w + 4; }
    return open + stars(40) + b + close;
  }
  if (id === 'strength') return open + stars(30) + `<path d="M0 450 L180 230 L300 330 L470 120 L640 300 L720 240 L800 330 V450Z" fill="#26397f"/><path d="M470 120 L430 175 L470 160 L500 185Z" fill="#e8f0ff"/><path d="M0 450 L120 340 L260 400 L430 310 L600 410 L800 350 V450Z" fill="#14205a"/>` + close;
  if (id === 'spiritual') return open + stars(25) + `<path d="M640 70 a42 42 0 1 0 32 74 a34 34 0 1 1 -32 -74z" fill="#ffe9a8"/><path d="M250 450 V330 Q250 250 340 250 Q430 250 430 330 V450Z" fill="#0a2238"/><rect x="435" y="220" width="16" height="230" fill="#0a2238"/><path d="M431 220 L443 190 L455 220Z" fill="#0a2238"/><rect x="0" y="420" width="800" height="30" fill="#07141f"/>` + close;
  if (id === 'desert') return open + stars(70) + `<circle cx="620" cy="90" r="34" fill="#f4f1d8"/><path d="M0 360 Q200 300 400 350 T800 330 V450 H0Z" fill="#6b4e2e"/><path d="M0 410 Q250 360 500 405 T800 395 V450 H0Z" fill="#3d2b17"/><path d="M380 395 q10 -34 20 0 q-10 6 -20 0z" fill="#ff9a3c"/><circle cx="390" cy="385" r="26" fill="#ff9a3c" opacity=".25"/>` + close;
  return open + close;
}

/* ---- reflection journal (general) ---- */
function openReflection(prompt) {
  const p = prompt || PROMPTS[Math.floor(Date.now() / 864e5) % PROMPTS.length];
  const moods = isPremium() ? `<label class="muted tiny">المزاج (بريميوم)</label><select class="input" id="refMood">${['—', 'هادي', 'متعب', 'متفائل', 'قلقان', 'ممتن'].map(m => `<option>${m}</option>`).join('')}</select>` : '';
  const body = openModal({ title: 'دفتر التأمل', html: `<p class="muted">${esc(p)}</p><textarea class="input" id="refText" maxlength="1500" placeholder="اكتب براحتك… سطر واحد كفاية."></textarea>${moods}<div class="row-wrap"><button class="btn btn-primary" data-action="ref-save" data-prompt="${esc(p)}"><i class="fa-solid fa-floppy-disk"></i> احفظ</button><button class="btn btn-ghost" data-action="journal-all">كل تأملاتي</button></div>` });
  return body;
}
A['ref-save'] = el => {
  const text = $('#refText').value.trim(); if (!text) { toast('اكتب ولو كلمتين الأول.', 'warn'); return; }
  const mood = $('#refMood') ? $('#refMood').value : '';
  S.journal.unshift({ id: uid(), t: Date.now(), prompt: el.dataset.prompt, text, mood: mood === '—' ? '' : mood }); S.journal = S.journal.slice(0, 300); save();
  closeModal(); toast('اتحفظ تأملك.', 'success'); markTask('reflection'); refresh();
};
A['journal-all'] = () => {
  const list = isPremium() ? S.journal : S.journal.slice(0, 5);
  openModal({ title: 'تأملاتي', wide: true, html: (list.length ? `<div class="list">${list.map(j => `<div class="item"><div class="grow"><small class="muted">${fmtDate(j.t)}${j.mood ? ' • ' + esc(j.mood) : ''} — ${esc(j.prompt || '')}</small><b style="font-weight:400;white-space:pre-line">${esc(j.text)}</b></div><button class="icon-btn" data-action="journal-del" data-id="${j.id}" aria-label="حذف"><i class="fa-solid fa-trash"></i></button></div>`).join('')}</div>` : '<div class="empty"><i class="fa-solid fa-book-open"></i>لسه ما كتبتش تأمل.</div>') +
    `<div class="row-wrap">${isPremium() ? '<button class="btn btn-ghost btn-sm" data-action="journal-export"><i class="fa-solid fa-download"></i> تصدير كملف نصي</button>' : `<small class="muted">بتشوف آخر ٥ تأملات. البريميوم بيفتح الأرشيف الكامل والتصدير.</small>`}</div>` });
};
A['journal-del'] = el => { S.journal = S.journal.filter(j => j.id !== el.dataset.id); save(); A['journal-all'](); };
A['journal-export'] = () => {
  const txt = S.journal.map(j => `${new Date(j.t).toLocaleString('ar-EG')}${j.mood ? ' [' + j.mood + ']' : ''}\n${j.prompt || ''}\n${j.text}\n`).join('\n----\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); a.download = 'nafas-journal.txt'; document.body.appendChild(a); a.click(); a.remove(); toast('اتصدّر ملف التأملات.', 'success');
};

/* ============ 11. SPIRITUAL ============ */
function setSpiritual(on) {
  S.settings.spiritual = !!on; save(); refresh();
  toast(on ? 'اتفعّل القسم الروحي. تقدر تقفله وقت ما تحب.' : 'اتقفل القسم الروحي.', 'info');
}
function currentVerseIdx() {
  ensureDays(); if (S.spiritual.verse.idx < 0) S.spiritual.verse.idx = Math.floor(Date.now() / 864e5) % VERSES.length; return S.spiritual.verse.idx;
}
function weekDots() {
  return Array.from({ length: 7 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - (6 - k)); const on = S.spiritual.days[todayKey(d)]; return `<span class="dot ${on ? 'on' : ''}" title="${d.toLocaleDateString('ar-EG', { weekday: 'long' })}">${d.toLocaleDateString('ar-EG', { weekday: 'narrow' })}</span>`; }).join('');
}
function renderSpiritual() {
  const root = $('#page-spiritual');
  if (!S.settings.spiritual) {
    root.innerHTML = `<header class="page-head"><div><p class="eyebrow">اختياري بالكامل</p><h1>رحلتي الروحية</h1></div></header>
    <article class="card glass center" style="padding:44px 20px"><span class="ic big"><i class="fa-solid fa-moon"></i></span><h2>القسم ده مقفول، وإنت اللي تقرر</h2>
    <p class="muted" style="max-width:520px;margin-inline:auto">فيه آية وتدبّر يومي، أدعية من القرآن، أذكار، دفتر تدبّر، وأهداف لطيفة. مفيش إجبار ومفيش لوم، ومش مطلوب منك إثبات أي حاجة. تقدر تقفله تاني في أي وقت.</p>
    <button class="btn btn-primary" data-action="enable-spirit">فعّل القسم الروحي</button></article>`; return;
  }
  ensureDays();
  const vi = currentVerseIdx(), v = VERSES[vi], dh = S.spiritual.dhikr, goalOpts = [[0, 'من غير هدف'], [1, 'صفحة'], [2, 'صفحتين'], [5, '٥ صفحات']];
  const quranDone = S.tasks.status.quran, journals = S.spiritual.journal.slice(0, 5);
  const daysDone = Object.keys(S.spiritual.days).length;
  root.innerHTML = `
  <header class="page-head"><div class="grow"><p class="eyebrow">من غير لوم.. وبالسرعة اللي تناسبك</p><h1>رحلتي الروحية</h1></div><button class="btn btn-ghost btn-sm" data-action="spirit-disable"><i class="fa-solid fa-eye-slash"></i> قفل القسم</button></header>
  <article class="card glass verse-card"><span class="eyebrow">آية اليوم</span><p class="quran-text">${esc(v.t)}</p><p class="ref">${esc(v.r)}</p><p class="muted">سؤال للتأمل: ${esc(v.q)}</p>
    <div class="row-wrap center"><button class="btn btn-primary" data-action="verse-read"><i class="fa-solid fa-check"></i> قرأتها وتدبّرتها</button><button class="btn btn-ghost" data-action="verse-next"><i class="fa-solid fa-shuffle"></i> آية تانية</button></div>
    <p class="tiny muted" style="margin-top:12px">نص تجريبي — راجع المصحف للتأكد دايمًا. التأمل بالأسئلة وليس تفسيرًا.</p></article>
  <div class="grid two" style="margin-top:18px">
    <article class="card glass"><h3><i class="fa-solid fa-pen-nib"></i> دفتر التدبّر</h3><textarea class="input" id="tadText" rows="3" placeholder="إيه اللي لمسك في الآية؟"></textarea><div class="row-wrap"><button class="btn btn-primary btn-sm" data-action="verse-save">احفظ</button></div>
      ${journals.length ? `<div class="list" style="margin-top:12px">${journals.map(j => `<div class="item"><div class="grow"><small class="muted">${fmtDate(j.t)}</small><div style="white-space:pre-line">${esc(j.text)}</div></div><button class="icon-btn" data-action="tad-del" data-id="${j.id}" aria-label="حذف"><i class="fa-solid fa-trash"></i></button></div>`).join('')}</div>` : '<div class="empty tiny">لسه مفيش تدبّرات محفوظة.</div>'}</article>
    <article class="card glass"><h3><i class="fa-solid fa-chart-line"></i> تقدّمي الروحي</h3><p class="muted">آخر ٧ أيام — بدون مقارنة أو عدّاد ضغط.</p><div class="dots">${weekDots()}</div><p class="center muted" style="margin-top:12px">${nf(daysDone)} يوم فيه نشاط روحي، وأي يوم هادي برضه مقبول.</p></article>
  </div>
  <div class="grid two" style="margin-top:18px">
    <article class="card glass"><h3><i class="fa-solid fa-bullseye"></i> أهدافي اللطيفة (اختيارية)</h3>
      <div class="setting"><div class="grow"><b>ورد القرآن</b><small>هدف يومي مرن</small></div><select class="input" data-change="quran-goal">${goalOpts.map(([val, l]) => `<option value="${val}" ${+S.settings.quranGoal === val ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="setting"><div class="grow"><b>قيام الليل</b><small>هدف اختياري، من غير إلزام</small></div><label class="switch"><input type="checkbox" data-change="qiyam" ${S.settings.qiyam ? 'checked' : ''}><span></span></label></div>
      <div class="setting"><div class="grow"><b>تذكير هادي بالصلاة</b><small>يظهر لك لما الصفحة مفتوحة</small></div><input type="time" class="input" data-change="prayer-time" value="${esc(S.settings.prayerTime)}"><label class="switch"><input type="checkbox" data-change="prayer-remind" ${S.settings.remindPrayer ? 'checked' : ''}><span></span></label></div>
      <div class="row-wrap"><button class="btn btn-ghost btn-sm" data-action="spirit-log-quran" ${quranDone ? 'disabled' : ''}><i class="fa-solid fa-book-quran"></i> ${quranDone ? 'اتسجّل ورد النهارده ✓' : 'سجّل ورد النهارده'}</button>${S.settings.qiyam ? '<button class="btn btn-ghost btn-sm" data-action="spirit-log-qiyam"><i class="fa-solid fa-moon"></i> قمت الليلة دي</button>' : ''}</div></article>
    <article class="card glass center"><h3><i class="fa-solid fa-hand-holding-heart"></i> ذكر</h3>
      <select class="input" data-change="dhikr-pick" aria-label="اختار الذكر">${DHIKR.map((d, i) => `<option value="${i}" ${dh.idx === i ? 'selected' : ''}>${d}</option>`).join('')}</select>
      <button class="dhikr-btn" data-action="dhikr-tap" aria-label="عدّاد الذكر">${nf(dh.count)}</button>
      <div class="bar"><span style="width:${Math.min(100, dh.count / 33 * 100)}%"></span></div><p class="muted tiny">الهدف الاقتراحي ٣٣ — وتقدر تكمّل أكتر أو أقل.</p>
      <button class="btn btn-ghost btn-sm" data-action="dhikr-reset">ابدأ من الأول</button></article>
  </div>
  <article class="card glass" style="margin-top:18px"><h3><i class="fa-solid fa-hands-praying"></i> أدعية من القرآن</h3><div class="list">${DUAS.map((d, i) => `<div class="item"><div class="grow"><div class="quran-text sm">${esc(d.t)}</div><small class="muted">${esc(d.r)}</small></div><button class="icon-btn" data-action="dua-read" data-i="${i}" aria-label="اقرأ بصوت"><i class="fa-solid fa-volume-high"></i></button></div>`).join('')}</div></article>`;
}
function spiritChoice(v) {
  if (!S.settings.spiritual) { toast('القسم الروحي مقفول — تقدر تفعّله من صفحة رحلتي الروحية.', 'info'); return; }
  if (v === 'verse') goPage('spiritual');
  else if (v === 'dua') { goPage('spiritual'); setTimeout(() => { const l = $$('#page-spiritual .quran-text.sm'); if (l.length) l[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); }
  else if (v === 'pray') openPrayerTime();
  else toast('الراحة حقك. أنا هنا وقت ما تحتاج. 🌿', 'info');
}
function openPrayerTime() {
  openModal({ title: 'وقت هادي للصلاة', html: `<p class="muted">اختار وقت يناسبك وهنفكّرك بلطف لو الصفحة مفتوحة. مفيش أي التزام.</p><input type="time" class="input" id="ptime" value="${esc(S.settings.prayerTime)}"><div class="row-wrap"><button class="btn btn-primary" data-action="prayer-set">احفظ التذكير</button><button class="btn btn-ghost" data-action="modal-close">مش دلوقتي</button></div>` });
}
A['prayer-set'] = () => { const v = $('#ptime').value; if (v) S.settings.prayerTime = v; S.settings.remindPrayer = true; save(); closeModal(); toast('اتضبط تذكير هادي الساعة ' + S.settings.prayerTime, 'success'); requestNotify(); refresh(); };
function requestNotify() { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { /* ignore */ } }
Object.assign(A, {
  'enable-spirit': () => setSpiritual(true),
  'spirit-disable': () => confirmModal('قفل القسم الروحي', 'هيتخبّى القسم والمهام الروحية. بياناتك هتفضل محفوظة لو فعّلته تاني.', 'اقفله', () => setSpiritual(false)),
  'verse-next': () => { S.spiritual.verse.idx = (currentVerseIdx() + 1) % VERSES.length; save(); renderSpiritual(); },
  'verse-read': () => { markSpiritualDay(); if (!markTask('quran')) toast('جميل، ربنا يتقبل. 🤍', 'info'); refresh(); },
  'verse-save': () => { const t = $('#tadText').value.trim(); if (!t) { toast('اكتب كلمتين الأول.', 'warn'); return; } S.spiritual.journal.unshift({ id: uid(), t: Date.now(), text: t }); S.spiritual.journal = S.spiritual.journal.slice(0, 100); markSpiritualDay(); save(); toast('اتحفظ التدبّر.', 'success'); renderSpiritual(); },
  'tad-del': el => { S.spiritual.journal = S.spiritual.journal.filter(j => j.id !== el.dataset.id); save(); renderSpiritual(); },
  'spirit-log-quran': () => { markSpiritualDay(); markTask('quran'); refresh(); },
  'spirit-log-qiyam': () => { markSpiritualDay(); toast('تقبّل الله منك. (مسجّل للتقدّم الروحي فقط)', 'success'); renderSpiritual(); },
  'dhikr-tap': () => { ensureDays(); const dh = S.spiritual.dhikr; dh.count++; if (dh.count === 33) { markSpiritualDay(); toast('وصلت ٣٣ — تقدر تكمّل أو تكتفي.', 'success'); } save(); renderSpiritual(); },
  'dhikr-reset': () => { S.spiritual.dhikr.count = 0; save(); renderSpiritual(); },
  'dua-read': el => {
    const d = DUAS[+el.dataset.i];
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') { toast('القراءة بصوت مش مدعومة في المتصفح ده — اقرأ الدعاء من الشاشة.', 'warn'); return; }
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(d.t.replace(/[﴿﴾٠-٩]/g, '')); u.lang = 'ar-SA'; u.rate = .85; speechSynthesis.speak(u); } catch (e) { toast('مقدرناش نشغّل الصوت.', 'warn'); }
  }
});
Object.assign(C, {
  'quran-goal': el => { S.settings.quranGoal = +el.value; save(); toast('اتحفظ هدفك.', 'success'); },
  qiyam: el => { S.settings.qiyam = el.checked; save(); renderSpiritual(); },
  'prayer-time': el => { if (el.value) { S.settings.prayerTime = el.value; save(); toast('اتحفظ وقت التذكير.', 'success'); } },
  'prayer-remind': el => { S.settings.remindPrayer = el.checked; save(); if (el.checked) requestNotify(); toast(el.checked ? 'اتفعّل التذكير الهادي.' : 'اتقفل التذكير.', 'info'); },
  'dhikr-pick': el => { S.spiritual.dhikr = { date: todayKey(), idx: +el.value, count: 0 }; save(); renderSpiritual(); }
});

/* ============ 12. TASKS PAGE ============ */
const SHOP = [
  { id: 'desert', title: 'رحلة «ليلة الصحرا»', desc: 'بيئة سينمائية مميزة بصوت ريح هادي.', cost: 30, icon: 'fa-star', owned: () => S.journeys.unlocked.desert || isPremium() },
  { id: 'aurora', title: 'ثيم «الشفق»', desc: 'ألوان بنفسجية وسماوية دافية.', cost: 20, icon: 'fa-palette', owned: () => S.journeys.unlocked.aurora || isPremium() },
  { id: 'extra', title: 'رحلة إضافية النهارده', desc: 'تزوّد حد الرحلات اليومي مرة واحدة.', cost: 10, icon: 'fa-ticket', owned: () => isPremium() }
];
function renderTasks() {
  const root = $('#page-tasks');
  if (isCrisis()) { root.innerHTML = `<header class="page-head"><div><h1>المهام والمكافآت</h1></div></header><article class="card glass center" style="padding:40px"><span class="ic big"><i class="fa-solid fa-heart"></i></span><h3>النهارده الأهم هو إنت.</h3><p class="muted">أجّلنا المهام والمكافآت مؤقتًا. ركّز على اللي يريّحك، وكلّم حد قريب منك لو محتاج.</p><button class="btn btn-ghost" data-action="open-safety">تفاصيل المساعدة</button></article>`; return; }
  ensureDays();
  const rows = visibleTasks().map(t => {
    const st = S.tasks.status[t.id];
    const action = st === 'claimed' ? '<span class="badge ok">اتستلمت ✓</span>'
      : st === 'done' ? `<button class="btn btn-primary btn-sm" data-action="task-claim" data-id="${t.id}"><i class="fa-solid fa-coins"></i> استلم +${nf(t.reward)}</button>`
      : t.mode === 'self' ? `<button class="btn btn-ghost btn-sm" data-action="task-done" data-id="${t.id}">خلّصتها</button>`
      : `<button class="btn btn-ghost btn-sm" data-action="task-go" data-go="${t.go}">ابدأ</button>`;
    return `<div class="task ${st || ''}"><span class="ic"><i class="fa-solid ${t.icon}"></i></span><div class="grow"><b>${esc(t.title)}</b><small class="muted" style="display:block">${esc(t.desc)}</small></div><span class="reward">+${nf(t.reward)}</span>${action}</div>`;
  }).join('');
  root.innerHTML = `
  <header class="page-head"><div><p class="eyebrow">كله اختياري • من غير ضغط</p><h1>المهام والمكافآت</h1></div></header>
  <div class="grid stats">
    <div class="stat card glass"><span class="ic"><i class="fa-solid fa-wallet"></i></span><div><b class="js-balance">${nf(S.wallet.balance)}</b><small>الرصيد الحالي</small></div></div>
    <div class="stat card glass"><span class="ic"><i class="fa-solid fa-arrow-trend-up"></i></span><div><b>${nf(S.wallet.earned)}</b><small>إجمالي المكتسب</small></div></div>
    <div class="stat card glass"><span class="ic"><i class="fa-solid fa-bag-shopping"></i></span><div><b>${nf(S.wallet.spent)}</b><small>إجمالي المصروف</small></div></div>
  </div>
  <article class="card glass"><h3>مهام النهارده</h3><p class="muted tiny">المهام بتتجدد كل يوم، والمكافأة مرة واحدة لكل مهمة في اليوم. التسجيل بنفسك — مفيش إثبات.</p><div class="list">${rows}</div></article>
  <article class="card glass" style="margin-top:18px"><h3><i class="fa-solid fa-store"></i> اصرف عملاتك</h3><div class="list">${SHOP.map(s => `<div class="item shop-item"><span class="ic" style="margin:0"><i class="fa-solid ${s.icon}"></i></span><div class="grow"><b>${esc(s.title)}</b><small class="muted">${esc(s.desc)}</small></div>${s.owned() && s.id !== 'extra' ? '<span class="badge ok">مفتوح</span>' : s.owned() ? '<span class="badge gold">مش محتاج</span>' : `<button class="btn btn-ghost btn-sm" data-action="shop-buy" data-id="${s.id}"><i class="fa-solid fa-coins"></i> ${nf(s.cost)}</button>`}</div>`).join('')}</div></article>
  <article class="card glass" style="margin-top:18px"><h3>سجل العمليات</h3>${S.wallet.tx.length ? `<div class="list">${S.wallet.tx.slice(0, 12).map(x => `<div class="item"><div class="grow"><b>${esc(x.reason)}</b><small class="muted">${fmtDate(x.t)} • ${fmtTime(x.t)}</small></div><b class="tx-amt ${x.amount > 0 ? 'pos' : 'neg'}">${x.amount > 0 ? '+' : '−'}${nf(Math.abs(x.amount))}</b></div>`).join('')}</div>` : '<div class="empty"><i class="fa-solid fa-receipt"></i>لسه مفيش عمليات.</div>'}</article>`;
}
A['shop-buy'] = el => {
  const item = SHOP.find(s => s.id === el.dataset.id); if (!item) return;
  if (item.owned() && item.id !== 'extra') { toast('إنت فاتحه بالفعل.', 'info'); return; }
  if (!spendCoins(item.cost, 'شراء: ' + item.title)) { toast(`رصيدك مش كفاية (محتاج ${nf(item.cost)}). المهام اللطيفة هتجمعلك عملات.`, 'warn'); return; }
  if (item.id === 'desert') S.journeys.unlocked.desert = true;
  if (item.id === 'aurora') S.journeys.unlocked.aurora = true;
  if (item.id === 'extra') { ensureDays(); S.journeys.extra++; }
  save(); closeModal(); toast(`تم: ${item.title}`, 'success'); refresh();
  if (el.dataset.then) { const [sc, md] = el.dataset.then.split(':'); startJourney(sc, md); }
};

/* ============ 13. PREMIUM (DEMO) ============ */
const PLANS = { monthly: { name: 'شهري', price: 99, per: 'شهر' }, annual: { name: 'سنوي', price: 799, per: 'سنة', note: 'وفّر نحو ٣٣٪' } };
let planSel = 'annual';
function renderPremium() {
  const pl = PLANS[planSel];
  const rows = [['فضفضة أساسية', true, true], ['رحلات الخيال اليومية', '٣', 'غير محدودة'], ['ملخصات الجلسات', 'أساسي', 'أعمق'], ['بيئات سينمائية مميزة', false, true], ['أصوات وأجواء إضافية', false, true], ['دفتر تأمل متقدم + تصدير', false, true], ['ثيمات إضافية', false, true], ['المهام والمكافآت', true, true]];
  const cell = v => v === true ? '<i class="fa-solid fa-check" style="color:var(--ok)"></i>' : v === false ? '<i class="fa-solid fa-minus muted"></i>' : esc(v);
  $('#page-premium').innerHTML = `
  <header class="page-head"><div class="grow"><p class="eyebrow">اختياري — الدعم الأساسي مجاني دايمًا</p><h1>بريميوم <span class="demo-tag">DEMO</span></h1><p class="muted" style="margin:0">الدفع هنا تجريبي بالكامل ومفيش أي مبلغ بيتسحب.</p></div></header>
  ${isPremium() ? `<article class="card glass" style="border-color:rgba(255,207,107,.5)"><h3><i class="fa-solid fa-crown" style="color:var(--gold)"></i> إنت مشترك (تجريبي)</h3><p>الخطة: <b>${PLANS[S.premium.plan].name}</b> • من ${fmtDate(S.premium.since)}</p><button class="btn btn-danger btn-sm" data-action="cancel-sub">إلغاء الاشتراك التجريبي</button></article>` : `
  <div class="seg" role="tablist"><button class="${planSel === 'monthly' ? 'sel' : ''}" data-action="plan-select" data-plan="monthly">شهري</button><button class="${planSel === 'annual' ? 'sel' : ''}" data-action="plan-select" data-plan="annual">سنوي</button></div>
  <article class="card glass" style="border-color:rgba(255,207,107,.5)"><span class="badge gold">${pl.note || 'مرونة كاملة'}</span><p class="price">${nf(pl.price)} <small>ج.م / ${pl.per}</small></p><button class="btn btn-primary btn-lg" data-action="checkout"><i class="fa-solid fa-crown"></i> ترقية (تجريبي)</button></article>`}
  <div class="grid cards-3" style="margin:18px 0">
    <article class="card glass"><span class="ic"><i class="fa-solid fa-comments"></i></span><h3>جلسات أطول</h3><p class="muted">ملخصات أعمق وأسئلة تأمل إضافية.</p></article>
    <article class="card glass"><span class="ic"><i class="fa-solid fa-film"></i></span><h3>بيئات سينمائية</h3><p class="muted">ليلة الصحرا وأجواء صوتية إضافية.</p></article>
    <article class="card glass"><span class="ic"><i class="fa-solid fa-palette"></i></span><h3>تخصيص أكتر</h3><p class="muted">ثيم الشفق ودفتر تأمل متقدم.</p></article>
  </div>
  <article class="card glass"><h3>المجاني مقابل بريميوم</h3><div style="overflow-x:auto"><table class="cmp"><thead><tr><th></th><th>المجاني</th><th>بريميوم</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${cell(r[1])}</td><td>${cell(r[2])}</td></tr>`).join('')}</tbody></table></div></article>`;
}
A['plan-select'] = el => { planSel = el.dataset.plan; renderPremium(); };
A.checkout = () => {
  if (isCrisis()) { openSafetyModal(); return; }
  const pl = PLANS[planSel];
  openModal({ title: 'إتمام الاشتراك', html: `<p><span class="demo-tag">DEMO</span> ده دفع تجريبي — مفيش بطاقات ولا بيانات حقيقية وأي مبلغ مش هيتسحب.</p>
    <div class="sec"><b>${pl.name}</b>${nf(pl.price)} ج.م / ${pl.per}</div>
    <label class="muted tiny">اسم العرض</label><input class="input" value="${esc(S.profile.name)}" disabled>
    <div class="row-wrap"><button class="btn btn-primary" id="payBtn" data-action="pay">ادفع تجريبيًا</button><button class="btn btn-ghost" data-action="modal-close">إلغاء</button></div>` });
};
A.pay = el => {
  el.disabled = true; el.innerHTML = '<span class="spinner"></span> جاري المعالجة…';
  setTimeout(() => {
    if (!$('#payBtn')) return;
    S.premium = { active: true, plan: planSel, since: Date.now() }; save();
    $('.modal-body').innerHTML = `<div class="center"><span class="ic big"><i class="fa-solid fa-check"></i></span><h3>تم الاشتراك التجريبي 🎉</h3><p class="muted">مفيش أي دفع حقيقي حصل. كل مميزات بريميوم اتفتحت للتجربة.</p><button class="btn btn-primary" data-action="modal-close">تمام</button></div>`;
    refresh();
  }, 1600);
};
A['cancel-sub'] = () => confirmModal('إلغاء الاشتراك', 'هترجع للخطة المجانية. الدعم الأساسي هيفضل متاح دايمًا.', 'إلغاء الاشتراك', () => {
  S.premium = { active: false, plan: null, since: null }; if (['aurora'].includes(S.settings.theme) && !S.journeys.unlocked.aurora) S.settings.theme = 'night'; save(); toast('اتلغى الاشتراك التجريبي.', 'info'); refresh();
}, true);

/* ============ 14. ACCOUNT ============ */
const THEMES = [{ id: 'night', name: 'ليل', bg: 'linear-gradient(135deg,#050b1f,#0a1538)' }, { id: 'deep', name: 'عميق', bg: 'linear-gradient(135deg,#02040d,#050a1c)' }, { id: 'aurora', name: 'الشفق', bg: 'linear-gradient(135deg,#4de3ff55,#8b5cf655,#06122a)' }];
function renderAccount() {
  const p = S.profile, st = S.settings, ages = ['', 'أقل من ١٨', '١٨–٢٤', '٢٥–٣٤', '٣٥–٤٤', '٤٥+'];
  $('#page-account').innerHTML = `
  <header class="page-head">${avatarHTML('lg')}<div class="grow"><p class="eyebrow">حسابي</p><h1>${esc(p.name)}</h1></div></header>
  <div class="grid two">
    <article class="card glass"><h3>الملف الشخصي</h3>
      <div class="avatars" role="radiogroup" aria-label="الصورة الرمزية">${AVATARS.map(a => `<button class="${p.avatar === a.id ? 'sel' : ''}" data-action="avatar-pick" data-id="${a.id}" aria-label="${a.id}"><span class="avatar"><i class="fa-solid ${a.icon}"></i></span></button>`).join('')}</div>
      <form data-submit="save-name" style="margin-top:14px"><label class="muted tiny">الاسم الظاهر</label><div class="row-wrap" style="margin-top:4px"><input class="input" id="nameInput" maxlength="24" value="${esc(p.name)}" style="flex:1"><button class="btn btn-primary" type="submit">حفظ</button></div></form>
      <div class="setting"><div class="grow"><b>الفئة العمرية</b><small>اختياري</small></div><select class="input" data-change="age">${ages.map(a => `<option value="${a}" ${p.age === a ? 'selected' : ''}>${a || 'أفضّل ما أقولش'}</option>`).join('')}</select></div>
      <div class="setting"><div class="grow"><b>اللغة المفضلة</b><small>بتأثر على أسلوب الرسائل</small></div><select class="input" data-change="lang"><option value="egy" ${p.lang === 'egy' ? 'selected' : ''}>العربية (مصري)</option><option value="msa" ${p.lang === 'msa' ? 'selected' : ''}>العربية (فصحى مبسطة)</option></select></div></article>
    <article class="card glass"><h3>التفضيلات</h3>
      <div class="setting"><div class="grow"><b>القسم الروحي</b><small>اختياري — تقدر تفعّله أو تقفله</small></div><label class="switch"><input type="checkbox" data-change="spiritual" ${st.spiritual ? 'checked' : ''}><span></span></label></div>
      <div class="setting"><div class="grow"><b>تذكير يومي لطيف</b><small>رسالة تشجيع واحدة لما تفتح الموقع</small></div><label class="switch"><input type="checkbox" data-change="notify" ${st.notify ? 'checked' : ''}><span></span></label></div>
      <div class="setting"><div class="grow"><b>حفظ المحادثات محليًا</b><small>لو قفلته مش هتفضل بعد التحديث</small></div><label class="switch"><input type="checkbox" data-change="savechats" ${st.saveChats ? 'checked' : ''}><span></span></label></div>
      <h3 style="margin-top:16px">الثيم</h3><div class="themes">${THEMES.map(t => `<button class="theme-opt ${st.theme === t.id ? 'sel' : ''}" data-action="theme-pick" data-id="${t.id}"><i style="background:${t.bg}"></i>${t.name}${t.id === 'aurora' && !S.journeys.unlocked.aurora && !isPremium() ? ' <i class="fa-solid fa-lock" style="display:inline;background:none;height:auto"></i>' : ''}</button>`).join('')}</div></article>
  </div>
  <div class="grid two" style="margin-top:18px">
    <article class="card glass"><h3><i class="fa-solid fa-shield-heart"></i> الخصوصية والبيانات</h3><p class="muted">كل بياناتك في متصفحك فقط. تقدر تمسحها في أي وقت.</p>
      <div class="row-wrap"><button class="btn btn-ghost btn-sm" data-action="nav" data-page="privacy">الخصوصية والأمان</button><button class="btn btn-ghost btn-sm" data-action="delete-chat">امسح المحادثة</button><button class="btn btn-ghost btn-sm" data-action="reset-demo"><i class="fa-solid fa-rotate-left"></i> صفّر الديمو</button><button class="btn btn-danger btn-sm" data-action="delete-account">احذف الحساب التجريبي</button></div></article>
    <article class="card glass gamify"><h3><i class="fa-solid fa-crown" style="color:var(--gold)"></i> العضوية</h3><p class="muted">${isPremium() ? 'إنت على بريميوم (تجريبي).' : 'إنت على الخطة المجانية.'}</p><button class="btn btn-ghost btn-sm" data-action="nav" data-page="premium">${isPremium() ? 'إدارة الاشتراك' : 'شوف بريميوم'}</button></article>
  </div>`;
}
F['save-name'] = () => {
  const v = $('#nameInput').value.trim().slice(0, 24); if (!v) { toast('اكتب اسم من فضلك.', 'warn'); return; }
  S.profile.name = v; save(); toast('اتحفظ الاسم.', 'success'); refresh();
};
function setLang(l) {
  S.profile.lang = l;
  if (S.chat.length === 1 && S.chat[0].welcome) S.chat[0].text = welcomeText();
  save(); toast('اتحفظت اللغة.', 'success'); refresh();
}
Object.assign(A, {
  'avatar-pick': el => { S.profile.avatar = el.dataset.id; save(); refresh(); },
  'theme-pick': el => {
    const id = el.dataset.id;
    if (id === 'aurora' && !S.journeys.unlocked.aurora && !isPremium()) { confirmModal('ثيم «الشفق»', `الثيم ده بيتفتح بـ ٢٠ عملة أو بريميوم (رصيدك: ${nf(S.wallet.balance)}). تفتحه؟`, 'افتحه بـ ٢٠ عملة', () => { if (spendCoins(20, 'شراء: ثيم الشفق')) { S.journeys.unlocked.aurora = true; S.settings.theme = 'aurora'; save(); toast('اتفتح الثيم.', 'success'); refresh(); } else toast('رصيدك مش كفاية.', 'warn'); }); return; }
    S.settings.theme = id; save(); refresh();
  },
  'reset-demo': () => confirmModal('تصفير الديمو', 'هترجع كل البيانات للوضع الابتدائي (٥٠ عملة، من غير محادثات).', 'صفّر', () => resetAll(false), true),
  'delete-account': () => confirmModal('حذف الحساب التجريبي', 'هيتمسح كل حاجة من متصفحك وترجع للصفحة التعريفية.', 'احذف', () => resetAll(true), true)
});
Object.assign(C, {
  age: el => { S.profile.age = el.value; save(); toast('اتحفظت الفئة العمرية.', 'success'); },
  lang: el => setLang(el.value),
  spiritual: el => setSpiritual(el.checked),
  notify: el => { S.settings.notify = el.checked; save(); toast(el.checked ? 'اتفعّل التذكير اليومي.' : 'اتقفل التذكير اليومي.', 'info'); },
  savechats: el => { S.settings.saveChats = el.checked; save(); toast(el.checked ? 'المحادثات هتتحفظ محليًا.' : 'المحادثات مش هتتحفظ بعد التحديث.', 'info'); }
});
function resetAll(deleteAccount) {
  closeModal(); if (J.active) closeJourney(true); Ambient.stop();
  Object.keys(voiceUrls).forEach(k => delete voiceUrls[k]); Object.keys(turn).forEach(k => delete turn[k]); lastCat = null; aiCount = 0; pickedMood = null;
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  S = defaults();
  if (deleteAccount) { $('#appShell').classList.add('hidden'); $('#landing').classList.remove('hidden'); window.scrollTo(0, 0); updateModes(); toast('اتحذف الحساب التجريبي.', 'info'); }
  else { S.started = true; save(); goPage('home'); toast('اترجعت بيانات الديمو للوضع الابتدائي.', 'success'); }
}

/* ============ 15. INIT ============ */
function initReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 });
  els.forEach(e => io.observe(e));
}
function nudges() {
  setTimeout(() => { if (S.started && S.settings.notify && !isCrisis() && S.meta.lastNudge !== todayKey() && !$('#appShell').classList.contains('hidden')) { S.meta.lastNudge = todayKey(); save(); toast((ENCOURAGE[S.profile.lang] || ENCOURAGE.egy)[Math.floor(Date.now() / 864e5) % 7], 'info'); } }, 2500);
  setInterval(() => {
    const d = new Date(), hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (S.settings.spiritual && S.settings.remindPrayer && hm === S.settings.prayerTime && S.meta.lastPrayerNudge !== todayKey() && !isCrisis()) {
      S.meta.lastPrayerNudge = todayKey(); save(); toast('وقت هادي صغير.. لو تحب تاخد نفس وتصلّي. 🤍', 'info');
      try { if ('Notification' in window && Notification.permission === 'granted') new Notification('نَفَس', { body: 'وقت هادي صغير لو تحب.' }); } catch (e) { /* ignore */ }
    }
  }, 30000);
}
function init() {
  document.documentElement.setAttribute('dir', 'rtl'); document.documentElement.setAttribute('lang', 'ar');
  ensureDays(); updateModes(); initStars(); initReveal();
  const nav = $('#lNav'); window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
  const inp = $('#chatInput');
  inp.addEventListener('input', () => autosize(inp));
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendText(inp.value); } });
  if (S.started) { $('#landing').classList.add('hidden'); $('#appShell').classList.remove('hidden'); goPage(PAGES.includes(S.meta.lastPage) ? S.meta.lastPage : 'home'); }
  nudges();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

/* Extra actions referenced inside templates */
A['start-journey'] = el => { const id = el.dataset.id; if (el.dataset.modalClose) closeModal(); startJourney(id, S.journeys.lastMood || 'rest'); };
})();