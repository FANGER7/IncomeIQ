document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('predict-form');
  const predictBtn = document.getElementById('predict-btn');
  const formError = document.getElementById('form-error');
  const formErrorText = formError.querySelector('.form-error-text');

  const resultCard = document.getElementById('result-card');
  const resultBadge = document.getElementById('result-badge');
  const resultBadgeText = resultBadge.querySelector('.result-badge-text');
  const resultLabel = document.getElementById('result-label');
  const confidenceNum = document.getElementById('confidence-num');
  const confidenceFill = document.getElementById('confidence-fill');

  const historyTbody = document.getElementById('history-tbody');
  const historyEmpty = document.getElementById('history-empty');
  const historyCards = document.getElementById('history-cards');
  const historySearchInput = document.getElementById('history-search-input');
  const historyTableWrap = document.querySelector('.table-wrap');

  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  const toastStack = document.getElementById('toast-stack');
  const particlesContainer = document.getElementById('particles');

  const THEME_STORAGE_KEY = 'incomeiq-theme';
  const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 68;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    if (themeToggleIcon) {
      themeToggleIcon.className = theme === 'light' ? 'bi bi-sun' : 'bi bi-moon-stars';
    }
  }

  function initTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const preferred = stored || 'dark';
    applyTheme(preferred);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  initTheme();

  function showToast(type, message, duration) {
    if (!toastStack) return;

    const icons = {
      success: 'bi-check-circle',
      error: 'bi-exclamation-circle',
      loading: 'bi-arrow-repeat'
    };

    const toast = document.createElement('div');
    toast.className = `iq-toast toast-${type}`;
    toast.innerHTML = `<i class="bi ${icons[type] || 'bi-info-circle'}"></i><span>${message}</span>`;
    toastStack.appendChild(toast);

    const lifespan = duration || (type === 'loading' ? 1600 : 3200);

    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 300);
    }, lifespan);

    return toast;
  }

  function initParticles() {
    if (!particlesContainer) return;
    const count = window.innerWidth < 700 ? 10 : 18;

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.className = 'particle';
      dot.style.setProperty('--p-left', `${Math.random() * 100}%`);
      dot.style.setProperty('--p-top', `${Math.random() * 100}%`);
      dot.style.setProperty('--p-size', `${2 + Math.random() * 3}px`);
      dot.style.setProperty('--p-duration', `${10 + Math.random() * 10}s`);
      dot.style.setProperty('--p-delay', `${Math.random() * 10}s`);
      particlesContainer.appendChild(dot);
    }
  }

  initParticles();

  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal-section');
    if (!revealEls.length) return;

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  }

  initScrollReveal();

  const PREDICT_URL = '/predictor/predict/';
  const HISTORY_URL = '/predictor/predictions/';

  let historyData = [];

  const FIELD_KEY_MAP = {
    age: 'age',
    workclass: 'workclass',
    fnlwgt: 'fnlwgt',
    education: 'education',
    education_num: 'education.num',
    marital_status: 'marital.status',
    occupation: 'occupation',
    relationship: 'relationship',
    race: 'race',
    sex: 'sex',
    capital_gain: 'capital.gain',
    capital_loss: 'capital.loss',
    hours_per_week: 'hours.per.week',
    native_country: 'native.country'
  };

  const NUMERIC_FIELDS = new Set([
    'age',
    'fnlwgt',
    'education_num',
    'capital_gain',
    'capital_loss',
    'hours_per_week'
  ]);

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  function buildPayload() {
    const payload = {};
    const formData = new FormData(form);

    for (const [fieldId, backendKey] of Object.entries(FIELD_KEY_MAP)) {
      const rawValue = formData.get(fieldId);

      if (rawValue === null || rawValue === '') {
        return { error: fieldId };
      }

      if (NUMERIC_FIELDS.has(fieldId)) {
        const numValue = Number(rawValue);
        if (Number.isNaN(numValue)) {
          return { error: fieldId };
        }
        payload[backendKey] = numValue;
      } else {
        payload[backendKey] = rawValue;
      }
    }

    return { payload };
  }

  function showFormError(message) {
    formErrorText.textContent = message;
    formError.classList.add('is-visible');
  }

  function hideFormError() {
    formError.classList.remove('is-visible');
    formErrorText.textContent = '';
  }

  function setButtonLoading(isLoading) {
    predictBtn.classList.toggle('is-loading', isLoading);
    predictBtn.disabled = isLoading;
    predictBtn.setAttribute('aria-busy', String(isLoading));
  }

  function triggerRipple() {
    predictBtn.classList.remove('rippling');
    void predictBtn.offsetWidth;
    predictBtn.classList.add('rippling');
  }

  function classifyLabel(label, probability) {
    const normalized = String(label || '').trim();
    return normalized.startsWith('>') || normalized.includes('>50K') ? 'high' : 'low';
  }

  function renderResult(data) {
    const label = data.label ?? (data.prediction === 1 ? '>50K' : '<=50K');
    const probability = typeof data.probability === 'number' ? data.probability : 0;
    const probabilityPct = Math.round(probability * 1000) / 10;

    const tier = classifyLabel(label, probability);

    resultLabel.textContent = label;

    resultBadge.classList.remove('badge-high', 'badge-low');
    const badgeIcon = resultBadge.querySelector('i');

    if (tier === 'high') {
      resultBadge.classList.add('badge-high');
      badgeIcon.className = 'bi bi-arrow-up-circle';
      resultBadgeText.textContent = 'Above threshold';
    } else {
      resultBadge.classList.add('badge-low');
      badgeIcon.className = 'bi bi-arrow-down-circle';
      resultBadgeText.textContent = 'Below threshold';
    }

    resultCard.classList.remove('is-entering');
    void resultCard.offsetWidth;
    resultCard.classList.add('is-active', 'is-entering');

    const clampedPct = Math.min(Math.max(probabilityPct, 0), 100);
    confidenceFill.style.strokeDasharray = `${GAUGE_CIRCUMFERENCE}`;
    confidenceFill.style.strokeDashoffset = `${GAUGE_CIRCUMFERENCE}`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const offset = GAUGE_CIRCUMFERENCE - (clampedPct / 100) * GAUGE_CIRCUMFERENCE;
        confidenceFill.style.strokeDashoffset = `${offset}`;
      });
    });

    animateCounter(confidenceNum, clampedPct);
  }

  function animateCounter(el, target) {
    const start = 0;
    const duration = 900;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = (start + (target - start) * eased).toFixed(1);
      el.textContent = `${current}%`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${target}%`;
      }
    }

    requestAnimationFrame(step);
  }

  function readableKey(fieldId) {
    const labels = {
      age: 'Age',
      workclass: 'Workclass',
      fnlwgt: 'Fnlwgt',
      education: 'Education',
      education_num: 'Education Number',
      marital_status: 'Marital Status',
      occupation: 'Occupation',
      relationship: 'Relationship',
      race: 'Race',
      sex: 'Sex',
      capital_gain: 'Capital Gain',
      capital_loss: 'Capital Loss',
      hours_per_week: 'Hours Per Week',
      native_country: 'Native Country'
    };
    return labels[fieldId] || fieldId;
  }

  async function submitPrediction(event) {
    event.preventDefault();
    hideFormError();

    const { payload, error } = buildPayload();

    if (error) {
      showFormError(`Please fill in the "${readableKey(error)}" field before predicting.`);
      const el = document.getElementById(error);
      if (el) {
        el.focus();
      }
      return;
    }

    triggerRipple();
    setButtonLoading(true);

    try {
      const csrfToken = getCookie('csrftoken');
      const headers = { 'Content-Type': 'application/json' };
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const response = await fetch(PREDICT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      renderResult(data);
      showToast('success', 'Prediction complete');
      await loadHistory();

      resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      showFormError('Something went wrong while contacting the prediction service. Please try again.');
      showToast('error', 'Server unavailable');
      console.error('Prediction request failed:', err);
    } finally {
      setButtonLoading(false);
    }
  }

  function normalizeHistoryItem(item, index) {
    const label = item.label ?? (item.prediction === 1 ? '>50K' : '<=50K');
    const probability = typeof item.probability === 'number' ? item.probability : 0;

    return {
      index: index + 1,
      age: item.age ?? '—',
      occupation: item.occupation ?? '—',
      hoursPerWeek: item['hours.per.week'] ?? item.hours_per_week ?? item.hours ?? '—',
      label,
      probability,
      tier: classifyLabel(label, probability),
      raw: item
    };
  }

  function matchesSearch(entry, query) {
    if (!query) return true;
    const haystack = `${entry.age} ${entry.occupation} ${entry.hoursPerWeek} ${entry.label}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }

  function renderHistoryTable(entries) {
    historyTbody.innerHTML = '';

    if (entries.length === 0) {
      historyEmpty.classList.add('is-visible');
      historyTableWrap.style.display = 'none';
      historyCards.innerHTML = '';
      return;
    }

    historyEmpty.classList.remove('is-visible');
    historyTableWrap.style.display = '';

    entries.forEach((entry, i) => {
      const tr = document.createElement('tr');
      tr.style.animationDelay = `${Math.min(i, 12) * 0.03}s`;

      const badgeClass = entry.tier === 'high' ? 'badge-high' : 'badge-low';
      const badgeIcon = entry.tier === 'high' ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle';
      const probabilityPct = Math.round(entry.probability * 1000) / 10;

      tr.innerHTML = `
        <td class="muted-cell">${entry.index}</td>
        <td>${entry.age}</td>
        <td>${entry.occupation}</td>
        <td>${entry.hoursPerWeek}</td>
        <td><span class="row-badge ${badgeClass}"><i class="bi ${badgeIcon}"></i>${entry.label}</span></td>
        <td class="muted-cell">${probabilityPct}%</td>
      `;

      historyTbody.appendChild(tr);
    });

    renderHistoryCards(entries);
  }

  function renderHistoryCards(entries) {
    historyCards.innerHTML = '';

    entries.forEach((entry) => {
      const probabilityPct = Math.round(entry.probability * 1000) / 10;
      const badgeClass = entry.tier === 'high' ? 'badge-high' : 'badge-low';
      const badgeIcon = entry.tier === 'high' ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle';

      const card = document.createElement('div');
      card.className = 'history-mobile-card';
      card.innerHTML = `
        <div class="history-mobile-card-row">
          <span><i class="bi bi-hash"></i> Entry</span>
          <span>${entry.index}</span>
        </div>
        <div class="history-mobile-card-row">
          <span><i class="bi bi-person"></i> Age</span>
          <span>${entry.age}</span>
        </div>
        <div class="history-mobile-card-row">
          <span><i class="bi bi-tools"></i> Occupation</span>
          <span>${entry.occupation}</span>
        </div>
        <div class="history-mobile-card-row">
          <span><i class="bi bi-clock"></i> Hours/wk</span>
          <span>${entry.hoursPerWeek}</span>
        </div>
        <div class="history-mobile-card-row">
          <span><i class="bi bi-patch-check"></i> Label</span>
          <span class="row-badge ${badgeClass}"><i class="bi ${badgeIcon}"></i>${entry.label}</span>
        </div>
        <div class="history-mobile-card-row">
          <span><i class="bi bi-speedometer2"></i> Probability</span>
          <span>${probabilityPct}%</span>
        </div>
      `;

      historyCards.appendChild(card);
    });
  }

  function applyFilterAndRender() {
    const query = historySearchInput.value.trim();
    const filtered = historyData.filter((entry) => matchesSearch(entry, query));
    renderHistoryTable(filtered);
  }

  async function loadHistory(announce) {
    let loadingToast;
    if (announce) {
      loadingToast = showToast('loading', 'Fetching history', 6000);
    }

    try {
      const response = await fetch(HISTORY_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`History request failed with status ${response.status}`);
      }

      const data = await response.json();
      const rawList = Array.isArray(data) ? data : (data.results || data.predictions || []);

      const sorted = [...rawList].sort((a, b) => {
        const aId = a.id ?? a.created_at ?? 0;
        const bId = b.id ?? b.created_at ?? 0;
        return bId > aId ? 1 : bId < aId ? -1 : 0;
      });

      historyData = sorted.map((item, index) => normalizeHistoryItem(item, index));
      applyFilterAndRender();
    } catch (err) {
      console.error('Failed to load prediction history:', err);
      historyEmpty.classList.add('is-visible');
      historyTableWrap.style.display = 'none';
    } finally {
      if (loadingToast) {
        loadingToast.classList.add('is-leaving');
        setTimeout(() => loadingToast.remove(), 300);
      }
    }
  }

  let searchDebounceTimer = null;
  historySearchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      applyFilterAndRender();
    }, 150);
  });

  form.addEventListener('submit', submitPrediction);

  form.querySelectorAll('.field-input').forEach((input) => {
    input.addEventListener('focus', () => {
      input.closest('.field')?.classList.add('is-focused');
    });
    input.addEventListener('blur', () => {
      input.closest('.field')?.classList.remove('is-focused');
    });
  });

  loadHistory(true);
});