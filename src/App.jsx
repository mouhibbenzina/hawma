import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Droplets,
  Lightbulb,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Signpost,
  Trash2,
  X,
} from 'lucide-react';

const copy = {
  fr: {
    tagline: 'Le quartier, en clair.',
    navBoard: 'Le tableau',
    navAbout: 'À propos',
    language: 'العربية',
    languageLabel: 'Afficher en arabe',
    headline: 'Un quartier plus clair commence par un signal.',
    intro: 'Un problème près de chez vous ? Décrivez-le, situez-le. Le voisinage peut suivre son évolution.',
    reportButton: 'Signaler un problème',
    browseButton: 'Voir les signalements',
    demo: 'Données de démonstration',
    demoHint: 'Exemples fictifs · non vérifiés · aucune connexion aux services municipaux',
    communityData: 'Signalements publics · non vérifiés · aucune transmission officielle',
    localMode: 'Stockage persistant de ce serveur',
    mongoMode: 'Connecté à MongoDB',
    allAreas: 'Toutes les villes',
    areaLabel: 'Ville',
    boardTitle: 'Signalements du quartier',
    boardSub: 'Des repères partagés, pas des dossiers officiels.',
    search: 'Rechercher un lieu ou un problème',
    searchLabel: 'Rechercher dans les signalements',
    allCategories: 'Tout',
    water: 'Eau',
    waste: 'Déchets',
    road: 'Voirie',
    lighting: 'Éclairage',
    other: 'Autre',
    results: 'signalements',
    new: 'Nouveau',
    in_progress: 'En cours',
    resolved: 'Résolu',
    location: 'Lieu',
    type: 'Type',
    status: 'État',
    details: 'Voir le détail',
    closeDetails: 'Fermer le détail',
    sample: 'Exemple fictif',
    submitted: 'Signalement envoyé',
    submittedText: 'Merci. Votre signalement est maintenant visible dans le tableau.',
    formTitle: 'Décrire un problème',
    formNote: 'Le signalement sera public. Ne partagez pas de données personnelles. Il ne sera pas transmis automatiquement à une municipalité.',
    titleLabel: 'En quelques mots',
    titlePlaceholder: 'Ex. : Éclairage public en panne',
    categoryLabel: 'Type de problème',
    locationLabel: 'Adresse ou repère',
    locationPlaceholder: 'Ex. : Rue et repère à proximité',
    cityLabel: 'Ville ou quartier',
    cityPlaceholder: 'Ex. : Tunis',
    descriptionLabel: 'Ce que vous avez constaté',
    descriptionPlaceholder: 'Décrivez le problème simplement : où, depuis quand, et ce qui gêne.',
    sendReport: 'Publier le signalement',
    cancel: 'Annuler',
    required: 'Champ obligatoire',
    loadError: 'Impossible de charger les signalements.',
    retry: 'Réessayer',
    empty: 'Aucun signalement ne correspond.',
    emptyHint: 'Essayez un autre filtre ou ajoutez le premier repère.',
    feedError: 'Le signalement n’a pas pu être publié. Vérifiez votre connexion et réessayez.',
    rateLimited: 'Trop de signalements ont été envoyés depuis cette connexion. Réessayez dans quelques minutes.',
    moderationLink: 'Espace modération',
    moderationTitle: 'Modération communautaire',
    moderationIntro: 'Vérifiez les signalements, ajustez leur état et masquez ceux qui ne doivent plus apparaître. Les états ne confirment jamais une intervention officielle.',
    moderationPassword: 'Clé de modération',
    moderationSignIn: 'Ouvrir la modération',
    moderationLoadError: 'Impossible de charger les signalements à modérer.',
    moderationUnavailable: 'La modération n’est pas configurée. Définissez ADMIN_TOKEN côté serveur.',
    moderationUnauthorized: 'Clé incorrecte ou session expirée. Vérifiez la clé et réessayez.',
    moderationStatus: 'État affiché',
    moderationVisibility: 'Visibilité',
    moderationPublic: 'Visible publiquement',
    moderationHidden: 'Masqué du tableau',
    moderationNote: 'Note interne (privée)',
    moderationNotePlaceholder: 'Pourquoi ce changement ?',
    moderationSave: 'Enregistrer',
    moderationSaved: 'Changements enregistrés.',
    moderationSample: 'Exemple fictif — non modifiable',
    moderationEmpty: 'Aucun signalement à modérer.',
    moderatedOn: 'État du tableau mis à jour le',
    shareReport: 'Copier le lien de ce signalement',
    linkCopied: 'Lien copié.',
    linkShareError: 'Impossible de partager ce lien dans ce navigateur.',
    statusExplainer: 'Les états décrivent uniquement ce qui est indiqué sur ce tableau. Ils ne confirment pas une intervention officielle.',
    footer: 'Un outil communautaire indépendant · Pas un service d’urgence',
    whyLink: 'Pourquoi Hawma ?',
    sourceLabel: 'Contexte',
    sourceText: 'Le rapport climat-développement de la Banque mondiale cite notamment la rareté de l’eau et le risque accru d’inondation parmi les défis climatiques de la Tunisie.',
    sourceLink: 'Lire la synthèse de la Banque mondiale',
    reportSent: 'Publié',
    requiredFields: 'Complétez les champs signalés pour continuer.',
  },
  ar: {
    tagline: 'الحيّ، بوضوح.',
    navBoard: 'لوحة الحيّ',
    navAbout: 'عن هوما',
    language: 'Français',
    languageLabel: 'عرض بالفرنسية',
    headline: 'حيّ أوضح يبدأ بإشارة.',
    intro: 'هل لاحظت مشكلة قربك؟ صِفها وحدّد مكانها، ويمكن للجيران متابعة مستجدّاتها.',
    reportButton: 'الإبلاغ عن مشكلة',
    browseButton: 'عرض البلاغات',
    demo: 'بيانات تجريبية',
    demoHint: 'أمثلة خيالية · غير مؤكّدة · لا اتصال بالبلديات',
    communityData: 'بلاغات عامة · غير مؤكّدة · لا إرسال رسمي',
    localMode: 'تخزين دائم على هذا الخادم',
    mongoMode: 'متصل بقاعدة MongoDB',
    allAreas: 'كل المدن',
    areaLabel: 'المدينة',
    boardTitle: 'بلاغات الحيّ',
    boardSub: 'معلومات يتشاركها السكان، وليست ملفات رسمية.',
    search: 'ابحث عن مكان أو مشكلة',
    searchLabel: 'ابحث في البلاغات',
    allCategories: 'الكل',
    water: 'المياه',
    waste: 'النفايات',
    road: 'الطرقات',
    lighting: 'الإنارة',
    other: 'أخرى',
    results: 'بلاغات',
    new: 'جديد',
    in_progress: 'قيد المتابعة',
    resolved: 'تمّت المعالجة',
    location: 'المكان',
    type: 'النوع',
    status: 'الحالة',
    details: 'التفاصيل',
    closeDetails: 'إخفاء التفاصيل',
    sample: 'مثال خيالي',
    submitted: 'تمّ إرسال البلاغ',
    submittedText: 'شكراً. أصبح بلاغك ظاهراً الآن في لوحة الحيّ.',
    formTitle: 'وصف المشكلة',
    formNote: 'سيكون البلاغ ظاهراً للجميع. لا تشارك بيانات شخصية. لن يُرسل تلقائياً إلى البلدية.',
    titleLabel: 'عنوان مختصر',
    titlePlaceholder: 'مثال: عطب في الإنارة العمومية',
    categoryLabel: 'نوع المشكلة',
    locationLabel: 'العنوان أو علامة قريبة',
    locationPlaceholder: 'اسم الشارع أو مكان قريب',
    cityLabel: 'المدينة أو الحيّ',
    cityPlaceholder: 'مثال: تونس',
    descriptionLabel: 'ما الذي لاحظته؟',
    descriptionPlaceholder: 'صِف المشكلة باختصار: أين ومتى بدأت وما أثرها؟',
    sendReport: 'نشر البلاغ',
    cancel: 'إلغاء',
    required: 'حقل مطلوب',
    loadError: 'تعذّر تحميل البلاغات.',
    retry: 'إعادة المحاولة',
    empty: 'لا توجد بلاغات مطابقة.',
    emptyHint: 'جرّب مرشّحاً آخر أو أضف أول إشارة.',
    feedError: 'تعذّر نشر البلاغ. تحقّق من الاتصال ثم أعد المحاولة.',
    rateLimited: 'تم إرسال بلاغات كثيرة من هذا الاتصال. حاول مجدداً بعد بضع دقائق.',
    moderationLink: 'مساحة الإشراف',
    moderationTitle: 'الإشراف المجتمعي',
    moderationIntro: 'راجع البلاغات وعدّل حالتها أو أخفِ ما لا ينبغي أن يظهر. الحالات لا تؤكد تدخلاً رسمياً.',
    moderationPassword: 'مفتاح الإشراف',
    moderationSignIn: 'فتح لوحة الإشراف',
    moderationLoadError: 'تعذّر تحميل البلاغات للإشراف.',
    moderationUnavailable: 'الإشراف غير مفعّل. أضف ADMIN_TOKEN إلى إعدادات الخادم.',
    moderationUnauthorized: 'المفتاح غير صحيح أو انتهت الجلسة. تحقّق منه وأعد المحاولة.',
    moderationStatus: 'الحالة المعروضة',
    moderationVisibility: 'إمكانية الظهور',
    moderationPublic: 'ظاهر للجميع',
    moderationHidden: 'مخفي عن اللوحة',
    moderationNote: 'ملاحظة داخلية (خاصة)',
    moderationNotePlaceholder: 'سبب هذا التغيير؟',
    moderationSave: 'حفظ',
    moderationSaved: 'تم حفظ التغييرات.',
    moderationSample: 'مثال تجريبي — غير قابل للتعديل',
    moderationEmpty: 'لا توجد بلاغات للإشراف.',
    moderatedOn: 'آخر تحديث لحالة اللوحة:',
    shareReport: 'نسخ رابط هذا البلاغ',
    linkCopied: 'تم نسخ الرابط.',
    linkShareError: 'تعذّرت مشاركة الرابط في هذا المتصفح.',
    statusExplainer: 'تعرض الحالات ما هو مذكور في هذه اللوحة فقط، ولا تؤكّد تدخّلاً رسمياً.',
    footer: 'أداة مجتمعية مستقلّة · ليست خدمة طوارئ',
    whyLink: 'لماذا هوما؟',
    sourceLabel: 'السياق',
    sourceText: 'يشير تقرير البنك الدولي حول المناخ والتنمية في تونس إلى ندرة المياه وازدياد مخاطر الفيضانات ضمن التحديات المناخية.',
    sourceLink: 'اقرأ ملخّص البنك الدولي',
    reportSent: 'منشور',
    requiredFields: 'أكمل الحقول المطلوبة للمتابعة.',
  },
};

const categories = ['water', 'waste', 'road', 'lighting', 'other'];
const cities = ['Tunis', 'Sfax', 'Sousse'];

function CategoryIcon({ category, size = 16 }) {
  const common = { size, strokeWidth: 1.8, 'aria-hidden': true };
  if (category === 'water') return <Droplets {...common} />;
  if (category === 'waste') return <Trash2 {...common} />;
  if (category === 'lighting') return <Lightbulb {...common} />;
  if (category === 'road') return <Signpost {...common} />;
  return <CircleAlert {...common} />;
}

function App() {
  const [language, setLanguage] = useState('fr');
  const [reports, setReports] = useState([]);
  const [mode, setMode] = useState('demo');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [category, setCategory] = useState('all');
  const [area, setArea] = useState('all');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'water',
    location: '',
    area: '',
    description: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderatorToken, setModeratorToken] = useState('');
  const [moderatorReady, setModeratorReady] = useState(false);
  const [moderationReports, setModerationReports] = useState([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationSaving, setModerationSaving] = useState('');
  const [moderationError, setModerationError] = useState('');
  const [moderationMessage, setModerationMessage] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');

  const t = copy[language];
  const isArabic = language === 'ar';

  async function shareReport(report) {
    const url = new URL(window.location.href);
    url.hash = `report-${encodeURIComponent(report.id)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.href);
      } else if (navigator.share) {
        await navigator.share({
          title: isArabic ? (report.titleAr || report.title) : report.title,
          text: report.location,
          url: url.href,
        });
      } else {
        throw new Error(t.linkShareError);
      }
      setShareFeedback(`${report.id}:${t.linkCopied}`);
    } catch (error) {
      if (error.name !== 'AbortError') setShareFeedback(`${report.id}:${t.linkShareError}`);
    }
  }

  async function loadReports(signal) {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/reports?${params.toString()}`, { signal });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const data = await response.json();
      setReports(data.reports);
      setMode(data.mode);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setLoadError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadReports(controller.signal), query ? 220 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [category, query]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.title = isArabic ? 'هوما — الحيّ، بوضوح' : 'Hawma — Le quartier, en clair';
  }, [language, isArabic]);

  useEffect(() => {
    if (!window.location.hash.startsWith('#report-')) return;
    let reportId;
    try {
      reportId = decodeURIComponent(window.location.hash.slice('#report-'.length));
    } catch {
      return;
    }
    if (!reports.some((report) => report.id === reportId)) return;
    setExpandedId(reportId);
    window.requestAnimationFrame(() => document.getElementById(`report-${reportId}`)?.scrollIntoView({ block: 'center' }));
  }, [reports]);

  const visibleReports = useMemo(
    () => reports.filter((report) => area === 'all' || report.area.toLocaleLowerCase() === area.toLocaleLowerCase()),
    [reports, area],
  );
  const statusCounts = useMemo(
    () => ({
      new: reports.filter((report) => report.status === 'new').length,
      in_progress: reports.filter((report) => report.status === 'in_progress').length,
      resolved: reports.filter((report) => report.status === 'resolved').length,
    }),
    [reports],
  );
  const areas = useMemo(
    () => [...new Set([...cities, ...reports.map((report) => report.area.trim()).filter(Boolean)])],
    [reports],
  );

  function startReport() {
    setFormOpen(true);
    setSuccess(false);
    setSubmitError('');
    window.setTimeout(() => document.getElementById('report-title')?.focus(), 30);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: '' }));
  }

  function validateForm() {
    const errors = {};
    if (form.title.trim().length < 4) errors.title = t.required;
    if (!categories.includes(form.category)) errors.category = t.required;
    if (form.location.trim().length < 3) errors.location = t.required;
    if (form.area.trim().length < 2) errors.area = t.required;
    if (form.description.trim().length < 10) errors.description = t.required;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!validateForm()) {
      setSubmitError(t.requiredFields);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          titleAr: language === 'ar' ? form.title : '',
          descriptionAr: language === 'ar' ? form.description : '',
          lang: language,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFieldErrors(Object.fromEntries(Object.keys(data.fields || {}).map((field) => [field, t.required])));
        throw new Error(response.status === 429 ? t.rateLimited : data.fields ? t.requiredFields : t.feedError);
      }
      setReports((previous) => [data.report, ...previous]);
      setForm({ title: '', category: 'water', location: '', area: '', description: '' });
      setFormOpen(false);
      setSuccess(true);
      setCategory('all');
      setArea('all');
      setQuery('');
      document.getElementById('reports-heading')?.focus();
    } catch (error) {
      setSubmitError(error.message || t.feedError);
    } finally {
      setSubmitting(false);
    }
  }

  function closeForm() {
    setFormOpen(false);
    setSubmitError('');
    setFieldErrors({});
  }

  function statusLabel(status) {
    return t[status] || t.new;
  }

  function formatModerationDate(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    return new Intl.DateTimeFormat(isArabic ? 'ar-TN' : 'fr-TN', { dateStyle: 'medium' }).format(date);
  }

  async function loadModerationReports(event) {
    event?.preventDefault();
    setModerationLoading(true);
    setModerationError('');
    setModerationMessage('');
    try {
      const response = await fetch('/api/moderation/reports', {
        headers: { Authorization: `Bearer ${moderatorToken}` },
      });
      if (!response.ok) {
        throw new Error(response.status === 503 ? t.moderationUnavailable : response.status === 401 ? t.moderationUnauthorized : t.moderationLoadError);
      }
      const data = await response.json();
      setModerationReports(data.reports);
      setModeratorReady(true);
    } catch (error) {
      setModeratorReady(false);
      setModerationError(error.message || t.moderationLoadError);
    } finally {
      setModerationLoading(false);
    }
  }

  function updateModerationField(reportId, field, value) {
    setModerationReports((previous) => previous.map((report) => (
      report.id === reportId ? { ...report, [field]: value } : report
    )));
    setModerationMessage('');
  }

  async function saveModeration(report) {
    setModerationSaving(report.id);
    setModerationError('');
    setModerationMessage('');
    try {
      const response = await fetch(`/api/moderation/reports/${encodeURIComponent(report.id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${moderatorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: report.status,
          visibility: report.visibility || 'public',
          moderationNote: report.moderationNote || '',
        }),
      });
      if (!response.ok) {
        throw new Error(response.status === 401 ? t.moderationUnauthorized : t.moderationLoadError);
      }
      const data = await response.json();
      setModerationReports((previous) => previous.map((item) => item.id === report.id ? data.report : item));
      setModerationMessage(t.moderationSaved);
      await loadReports();
    } catch (error) {
      setModerationError(error.message || t.moderationLoadError);
    } finally {
      setModerationSaving('');
    }
  }

  return (
    <div className={`app-shell${isArabic ? ' is-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'} lang={language}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label={`Hawma — ${t.tagline}`}>
          <span className="brand-mark" aria-hidden="true">
            <span /><span /><span />
          </span>
          <span className="brand-name">hawma</span>
          <span className="brand-tagline">{t.tagline}</span>
        </a>
        <nav className="top-nav" aria-label={isArabic ? 'التنقّل الرئيسي' : 'Navigation principale'}>
          <a className="nav-link is-active" href="#reports">{t.navBoard}</a>
          <a className="nav-link" href="#about">{t.navAbout}</a>
        </nav>
        <button
          className="language-toggle"
          type="button"
          onClick={() => setLanguage(isArabic ? 'fr' : 'ar')}
          aria-label={t.languageLabel}
        >
          {t.language}
        </button>
      </header>

      <main id="top">
        <section className="intro-band" aria-labelledby="main-heading">
          <div className="intro-copy">
            <span className="intro-rule" aria-hidden="true" />
            <h1 id="main-heading">{t.headline}</h1>
            <p>{t.intro}</p>
            <div className="intro-actions">
              <button className="button button-primary" type="button" onClick={startReport}>
                <Plus size={17} aria-hidden="true" />
                {t.reportButton}
              </button>
              <a className="text-link" href="#reports">
                {t.browseButton}
                <ArrowDownRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="status-board" aria-label={t.boardTitle}>
            <div className="status-board-heading">
              <span className="status-light" aria-hidden="true" />
              <span>{t.boardTitle}</span>
              <span className="board-index">HW—01</span>
            </div>
            <div className="status-counts">
              <div className="count-cell">
                <span className="count-symbol symbol-new" aria-hidden="true">●</span>
                <strong>{statusCounts.new}</strong>
                <span>{t.new}</span>
              </div>
              <div className="count-cell">
                <span className="count-symbol symbol-progress" aria-hidden="true">◷</span>
                <strong>{statusCounts.in_progress}</strong>
                <span>{t.in_progress}</span>
              </div>
              <div className="count-cell">
                <span className="count-symbol symbol-resolved" aria-hidden="true">✓</span>
                <strong>{statusCounts.resolved}</strong>
                <span>{t.resolved}</span>
              </div>
            </div>
            <div className="status-board-foot">
              <Clock3 size={14} aria-hidden="true" />
              <span>{t.statusExplainer}</span>
            </div>
          </div>
        </section>

        <section className="demo-strip" aria-label={reports.some((report) => report.sample) ? t.demo : t.boardTitle}>
          <span className="demo-stamp"><span aria-hidden="true">!</span>{reports.some((report) => report.sample) ? t.demo : t.boardTitle}</span>
          <p>{reports.some((report) => report.sample) ? t.demoHint : t.communityData}</p>
          <span className={`mode-stamp ${mode === 'mongodb' ? 'is-connected' : ''}`}>
            <span className="mode-dot" aria-hidden="true" />
            {mode === 'mongodb' ? t.mongoMode : t.localMode}
          </span>
        </section>

        {formOpen && (
          <section className="report-form-panel" aria-labelledby="form-heading">
            <div className="form-panel-title">
              <div>
                <span className="panel-overline">{isArabic ? 'إشارة جديدة / رقم 01' : 'NOUVEAU REPÈRE / SIGNAL 01'}</span>
                <h2 id="form-heading">{t.formTitle}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm} aria-label={t.cancel}>
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <p className="form-note">{t.formNote}</p>
            <form className="report-form" onSubmit={submitReport} noValidate>
              <div className="form-grid">
                <label className="field field-wide">
                  <span>{t.titleLabel}</span>
                  <input
                    id="report-title"
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    maxLength={100}
                    minLength={4}
                    placeholder={t.titlePlaceholder}
                    aria-invalid={Boolean(fieldErrors.title)}
                    aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                    required
                  />
                  {fieldErrors.title && <small id="title-error" className="field-error">{fieldErrors.title}</small>}
                </label>
                <label className="field">
                  <span>{t.categoryLabel}</span>
                  <span className="select-wrap">
                    <select
                      name="category"
                      value={form.category}
                      onChange={updateField}
                      aria-invalid={Boolean(fieldErrors.category)}
                      aria-describedby={fieldErrors.category ? 'category-error' : undefined}
                      required
                    >
                      {categories.map((item) => <option value={item} key={item}>{t[item]}</option>)}
                    </select>
                    <ChevronDown size={16} aria-hidden="true" />
                  </span>
                  {fieldErrors.category && <small id="category-error" className="field-error">{t.required}</small>}
                </label>
                <label className="field">
                  <span>{t.cityLabel}</span>
                  <input
                    name="area"
                    value={form.area}
                    onChange={updateField}
                    maxLength={80}
                    placeholder={t.cityPlaceholder}
                    aria-invalid={Boolean(fieldErrors.area)}
                    aria-describedby={fieldErrors.area ? 'area-error' : undefined}
                    required
                  />
                  {fieldErrors.area && <small id="area-error" className="field-error">{t.required}</small>}
                </label>
                <label className="field field-wide">
                  <span>{t.locationLabel}</span>
                  <span className="input-with-icon">
                    <MapPin size={16} aria-hidden="true" />
                    <input
                      name="location"
                      value={form.location}
                      onChange={updateField}
                      maxLength={160}
                      placeholder={t.locationPlaceholder}
                      aria-invalid={Boolean(fieldErrors.location)}
                      aria-describedby={fieldErrors.location ? 'location-error' : undefined}
                      required
                    />
                  </span>
                  {fieldErrors.location && <small id="location-error" className="field-error">{t.required}</small>}
                </label>
                <label className="field field-wide">
                  <span>{t.descriptionLabel}</span>
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={updateField}
                    maxLength={1000}
                    minLength={10}
                    placeholder={t.descriptionPlaceholder}
                    aria-invalid={Boolean(fieldErrors.description)}
                    aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                    required
                  />
                  {fieldErrors.description && <small id="description-error" className="field-error">{t.required}</small>}
                </label>
              </div>
              {submitError && <p className="form-error" role="alert">{submitError}</p>}
              <div className="form-actions">
                <button className="button button-dark" type="submit" disabled={submitting}>
                  {submitting ? <LoaderCircle className="spin" size={17} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                  {submitting ? t.submitted : t.sendReport}
                </button>
                <button className="button button-plain" type="button" onClick={closeForm}>{t.cancel}</button>
              </div>
            </form>
          </section>
        )}

        {success && (
          <div className="success-ribbon" role="status">
            <span className="success-mark"><Check size={15} aria-hidden="true" /></span>
            <strong>{t.submitted}</strong>
            <span>{t.submittedText}</span>
            <button type="button" className="success-close" onClick={() => setSuccess(false)} aria-label={t.cancel}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {moderationOpen && (
          <section className="moderation-panel" id="moderation" aria-labelledby="moderation-heading">
            <div className="form-panel-title">
              <div>
                <h2 id="moderation-heading">{t.moderationTitle}</h2>
                <p className="moderation-intro">{t.moderationIntro}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setModerationOpen(false)} aria-label={t.cancel}>
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            {!moderatorReady ? (
              <form className="moderation-login" onSubmit={loadModerationReports}>
                <label className="field">
                  <span>{t.moderationPassword}</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={moderatorToken}
                    onChange={(event) => setModeratorToken(event.target.value)}
                    required
                  />
                </label>
                <button className="button button-dark" type="submit" disabled={moderationLoading || !moderatorToken}>
                  {moderationLoading && <LoaderCircle className="spin" size={17} aria-hidden="true" />}
                  {t.moderationSignIn}
                </button>
              </form>
            ) : moderationLoading ? (
              <div className="feed-state" role="status"><LoaderCircle className="spin" size={20} aria-hidden="true" />{isArabic ? 'جارٍ التحميل…' : 'Chargement…'}</div>
            ) : moderationReports.length === 0 ? (
              <p className="moderation-empty">{t.moderationEmpty}</p>
            ) : (
              <div className="moderation-list">
                {moderationReports.map((report) => (
                  <article className="moderation-row" key={report.id}>
                    <div className="moderation-report-title">
                      <strong dir="auto">{isArabic ? (report.titleAr || report.title) : report.title}</strong>
                      <span dir="auto">{report.area} · {report.location}</span>
                      {report.sample && <small>{t.moderationSample}</small>}
                    </div>
                    <label className="field">
                      <span>{t.moderationStatus}</span>
                      <select
                        value={report.status}
                        disabled={report.sample}
                        onChange={(event) => updateModerationField(report.id, 'status', event.target.value)}
                      >
                        {['new', 'in_progress', 'resolved'].map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}
                      </select>
                    </label>
                    <label className="field">
                      <span>{t.moderationVisibility}</span>
                      <select
                        value={report.visibility || 'public'}
                        disabled={report.sample}
                        onChange={(event) => updateModerationField(report.id, 'visibility', event.target.value)}
                      >
                        <option value="public">{t.moderationPublic}</option>
                        <option value="hidden">{t.moderationHidden}</option>
                      </select>
                    </label>
                    <label className="field moderation-note-field">
                      <span>{t.moderationNote}</span>
                      <input
                        value={report.moderationNote || ''}
                        maxLength={300}
                        disabled={report.sample}
                        placeholder={t.moderationNotePlaceholder}
                        onChange={(event) => updateModerationField(report.id, 'moderationNote', event.target.value)}
                      />
                    </label>
                    <button
                      className="button button-dark button-small"
                      type="button"
                      disabled={report.sample || moderationSaving === report.id}
                      onClick={() => saveModeration(report)}
                    >
                      {moderationSaving === report.id && <LoaderCircle className="spin" size={15} aria-hidden="true" />}
                      {t.moderationSave}
                    </button>
                  </article>
                ))}
              </div>
            )}
            {moderationError && <p className="form-error" role="alert">{moderationError}</p>}
            {moderationMessage && <p className="moderation-success" role="status">{moderationMessage}</p>}
          </section>
        )}

        <section className="reports-section" id="reports" aria-labelledby="reports-heading">
          <div className="section-heading">
            <div className="section-title-group">
              <span className="section-mark" aria-hidden="true">↗</span>
              <div>
                <h2 id="reports-heading" tabIndex="-1">{t.boardTitle}</h2>
                <p>{t.boardSub}</p>
              </div>
            </div>
            <label className="area-select">
              <span>{t.areaLabel}</span>
              <span className="select-wrap">
                <select value={area} onChange={(event) => setArea(event.target.value)} aria-label={t.areaLabel}>
                  <option value="all">{t.allAreas}</option>
                  {areas.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </span>
            </label>
          </div>

          <div className="rack-controls">
            <div className="category-tabs" role="group" aria-label={t.type}>
              <button
                className={`category-tab${category === 'all' ? ' is-selected' : ''}`}
                type="button"
                aria-pressed={category === 'all'}
                onClick={() => setCategory('all')}
              >
                {t.allCategories}<span>{reports.length}</span>
              </button>
              {categories.map((item) => (
                <button
                  className={`category-tab${category === item ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  key={item}
                >
                  <CategoryIcon category={item} size={14} />
                  {t[item]}
                </button>
              ))}
            </div>
            <label className="search-field">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                aria-label={t.searchLabel}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label={isArabic ? 'مسح البحث' : 'Effacer la recherche'}>
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </label>
          </div>

          <div className="rack-meta" aria-live="polite">
            <span>{visibleReports.length} {t.results}</span>
            <span className="rack-meta-line" aria-hidden="true" />
            <span className="rack-meta-key"><span className="meta-key-dot" />{t.status}</span>
          </div>

          {loading ? (
            <div className="feed-state" role="status">
              <LoaderCircle className="spin" size={20} aria-hidden="true" />
              <span>{isArabic ? 'جارٍ تحميل البلاغات…' : 'Chargement des signalements…'}</span>
            </div>
          ) : loadError ? (
            <div className="feed-state feed-error" role="alert">
              <CircleAlert size={20} aria-hidden="true" />
              <span>{t.loadError}</span>
              <button className="button button-dark button-small" type="button" onClick={loadReports}>
                <RefreshCw size={14} aria-hidden="true" />{t.retry}
              </button>
            </div>
          ) : visibleReports.length === 0 ? (
            <div className="feed-state empty-state">
              <MapPin size={22} aria-hidden="true" />
              <strong>{t.empty}</strong>
              <span>{t.emptyHint}</span>
              <button className="text-link" type="button" onClick={startReport}>{t.reportButton}<ArrowRight size={15} aria-hidden="true" /></button>
            </div>
          ) : (
            <div className="report-rack">
              <div className="rack-column-head" aria-hidden="true">
                <span>{t.type}</span>
                <span>{isArabic ? 'الإشارة والمكان' : 'Signal & lieu'}</span>
                <span>{t.status}</span>
              </div>
              {visibleReports.map((report, index) => {
                const expanded = expandedId === report.id;
                return (
                  <article className={`report-row${expanded ? ' is-expanded' : ''}`} id={`report-${report.id}`} key={report.id}>
                    <button
                      className="report-row-button"
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`details-${report.id}`}
                      onClick={() => setExpandedId(expanded ? null : report.id)}
                    >
                      <span className={`type-cell type-${report.category}`}>
                        <CategoryIcon category={report.category} />
                        <span>{t[report.category]}</span>
                      </span>
                      <span className="report-main">
                        <span className="report-sequence">#{String(index + 1).padStart(2, '0')}</span>
                        <strong dir="auto">{isArabic ? (report.titleAr || report.title) : report.title}</strong>
                        <span className="report-location" dir="auto"><MapPin size={13} aria-hidden="true" />{report.location}</span>
                      </span>
                      <span className={`report-status status-${report.status}`}>
                        <span className="status-glyph" aria-hidden="true">{report.status === 'resolved' ? '✓' : report.status === 'in_progress' ? '◷' : '●'}</span>
                        {statusLabel(report.status)}
                      </span>
                    </button>
                    <div className="report-details" id={`details-${report.id}`} hidden={!expanded}>
                      <p dir="auto">{isArabic ? (report.descriptionAr || report.description) : report.description}</p>
                      {report.moderatedAt && <span className="detail-disclaimer">{t.moderatedOn} {formatModerationDate(report.moderatedAt)}</span>}
                      <span className="detail-disclaimer">{report.sample ? t.sample : t.reportSent}</span>
                      <span className="detail-disclaimer">{t.statusExplainer}</span>
                      <button className="detail-share" type="button" onClick={() => shareReport(report)}>{t.shareReport}</button>
                      {shareFeedback.startsWith(`${report.id}:`) && <span className="detail-disclaimer" role="status">{shareFeedback.slice(report.id.length + 1)}</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="context-band" id="about" aria-label={t.whyLink}>
          <div className="context-symbol" aria-hidden="true">HW</div>
          <div className="context-copy">
            <span>{t.sourceLabel}</span>
            <p>{t.sourceText}</p>
          </div>
          <a href="https://www.worldbank.org/en/country/tunisia/publication/tunisia-country-climate-and-development-report" target="_blank" rel="noreferrer">
            {t.sourceLink}<ArrowRight size={15} aria-hidden="true" />
          </a>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-brand" href="#top">HAWMA <span>·</span> {t.tagline}</a>
        <p>{t.footer}</p>
        <button
          className="moderation-link"
          type="button"
          aria-expanded={moderationOpen}
          aria-controls={moderationOpen ? 'moderation' : undefined}
          onClick={() => {
            setModerationOpen((open) => !open);
            window.setTimeout(() => document.getElementById('moderation')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
          }}
        >
          {t.moderationLink}
        </button>
        <span className="footer-license">MIT</span>
      </footer>
    </div>
  );
}

export default App;
