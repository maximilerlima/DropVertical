
// Explicit-language URLs are authoritative. No IP/browser-language redirect.
(() => {
  const config = JSON.parse(document.querySelector('#drop-config').textContent);
  window.DROP_CONFIG = config;
  const safeStore = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} },
  };
  safeStore.set('drop-language', config.language);
  const consentKey = 'drop-analytics-consent';
  let consent = safeStore.get(consentKey) === 'granted';
  let analyticsLoaded = false;
  function loadAnalytics() {
    if (!consent || !config.ga4Id || analyticsLoaded) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', config.ga4Id, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.ga4Id);
    document.head.append(script);
  }
  window.dropTrack = (event, properties = {}) => {
    // Strict allowlist: never send name, phone, form text, participant count or a wa.me URL.
    const safe = { language: config.language, page: config.page };
    for (const name of ['service', 'placement', 'target_language']) if (typeof properties[name] === 'string') safe[name] = properties[name].slice(0, 32);
    if (consent && config.ga4Id) { loadAnalytics(); window.gtag('event', event, safe); }
  };
  document.querySelectorAll('[data-language]').forEach(link => link.addEventListener('click', () => {
    safeStore.set('drop-language', link.dataset.language);
    window.dropTrack('language_change', { target_language: link.dataset.language });
  }));
  document.querySelectorAll('[data-track]').forEach(link => link.addEventListener('click', () => window.dropTrack(link.dataset.track, { placement: 'contact' })));
  const root = document.querySelector('main');
  const modal = document.querySelector('.booking-modal');
  if (root && modal) new MutationObserver(() => {
    const open = !modal.hidden;
    for (const el of [root, document.querySelector('header'), document.querySelector('footer'), document.querySelector('.wa-float')]) if (el) el.inert = open;
  }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
  function chooseConsent(grant) {
    consent = grant;
    safeStore.set(consentKey, grant ? 'granted' : 'denied');
    document.querySelector('#analytics-consent')?.remove();
    if (!grant && analyticsLoaded) { window['ga-disable-' + config.ga4Id] = true; location.reload(); }
    loadAnalytics();
  }
  function showConsent() {
    if (!config.ga4Id || document.querySelector('#analytics-consent')) return;
    const t = config.consent;
    const block = document.createElement('section');
    block.id = 'analytics-consent'; block.className = 'consent';
    block.setAttribute('aria-label', t[0]);
    const title = document.createElement('h2'); title.textContent = t[0];
    const p = document.createElement('p'); p.textContent = t[1];
    block.append(title, p);
    for (const [label, grant] of [[t[2], true], [t[3], false]]) {
      const button = document.createElement('button'); button.textContent = label; button.type = 'button'; button.className = 'btn';
      button.addEventListener('click', () => chooseConsent(grant)); block.append(button);
    }
    document.body.append(block);
  }
  if (config.ga4Id) {
    const preferences = document.createElement('button'); preferences.type = 'button'; preferences.textContent = config.consent[4];
    preferences.style.cssText = 'color:inherit;background:none;border:0;text-decoration:underline;cursor:pointer;padding:0;font:inherit';
    preferences.addEventListener('click', showConsent); document.querySelector('.footer-bottom')?.append(preferences);
    if (safeStore.get(consentKey) === null) showConsent();
  }
  loadAnalytics();
})();
