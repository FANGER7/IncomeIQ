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

  // --- AI Prediction Report elements (new) ---
  const aiLoadingStatus = document.getElementById('ai-loading-status');
  const aiReportSection = document.getElementById('ai-report-section');
  const journeyWrap = document.getElementById('journey-wrap');
  const reportPrediction = document.getElementById('report-prediction');
  const reportCategory = document.getElementById('report-category');
  const reportConfidence = document.getElementById('report-confidence');
  const reportRisk = document.getElementById('report-risk');
  const reportSummaryText = document.getElementById('report-summary-text');
  const tierPill = document.getElementById('tier-pill');
  const metricProbability = document.getElementById('metric-probability');
  const metricProbabilityNum = document.getElementById('metric-probability-num');
  const metricCertainty = document.getElementById('metric-certainty');
  const metricCertaintyNum = document.getElementById('metric-certainty-num');
  const metricStability = document.getElementById('metric-stability');
  const metricStabilityNum = document.getElementById('metric-stability-num');
  const profileGrid = document.getElementById('profile-grid');
  const insightsGrid = document.getElementById('insights-grid');
  const factorsPositive = document.getElementById('factors-positive');
  const factorsNegative = document.getElementById('factors-negative');
  const recommendationsList = document.getElementById('recommendations-list');
  const comparisonSection = document.getElementById('comparison-section');
  const comparisonGrid = document.getElementById('comparison-grid');
  const downloadReportBtn = document.getElementById('download-report-btn');
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener("click", generatePDFReport);
  }
  const shareBtn = document.getElementById('share-btn');
  const shareMenu = document.getElementById('share-menu');
  const statTotal = document.getElementById('stat-total');
  const statAbove = document.getElementById('stat-above');
  const statBelow = document.getElementById('stat-below');
  const statAvgConfidence = document.getElementById('stat-avg-confidence');

  let lastProfile = null;
  let lastReportData = null;
  let previousPredictionSnapshot = null;

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

  function getProfileValues() {
    const formData = new FormData(form);
    const profile = {};
    Object.keys(FIELD_KEY_MAP).forEach((fieldId) => {
      const raw = formData.get(fieldId);
      profile[fieldId] = NUMERIC_FIELDS.has(fieldId) ? Number(raw) : raw;
    });
    return profile;
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

  const AI_LOADING_MESSAGES = [
    'Analyzing demographic profile...',
    'Encoding categorical features...',
    'Running inference...',
    'Calculating confidence...',
    'Preparing AI report...'
  ];

  let loadingMessageTimer = null;

  function startLoadingMessages() {
    if (!aiLoadingStatus) return;
    let i = 0;
    aiLoadingStatus.classList.add('is-visible');
    aiLoadingStatus.innerHTML = `<span>${AI_LOADING_MESSAGES[0]}</span>`;
    loadingMessageTimer = setInterval(() => {
      i = (i + 1) % AI_LOADING_MESSAGES.length;
      aiLoadingStatus.innerHTML = `<span>${AI_LOADING_MESSAGES[i]}</span>`;
    }, 400);
  }

  function stopLoadingMessages() {
    if (loadingMessageTimer) {
      clearInterval(loadingMessageTimer);
      loadingMessageTimer = null;
    }
    if (aiLoadingStatus) {
      aiLoadingStatus.classList.remove('is-visible');
      aiLoadingStatus.innerHTML = '';
    }
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

  function animateCounter(el, target, suffix) {
    if (!el) return;
    const resolvedSuffix = suffix === undefined ? '%' : suffix;
    const start = 0;
    const duration = 900;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = (start + (target - start) * eased).toFixed(resolvedSuffix === '' ? 0 : 1);
      el.textContent = `${current}${resolvedSuffix}`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${target}${resolvedSuffix}`;
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

  // =========================================================
  // AI Prediction Report engine (Features 1–7, 9–13)
  // =========================================================

  const PROFILE_DISPLAY_FIELDS = [
    { id: 'age', icon: 'bi-person' },
    { id: 'education', icon: 'bi-mortarboard' },
    { id: 'occupation', icon: 'bi-tools' },
    { id: 'relationship', icon: 'bi-people' },
    { id: 'race', icon: 'bi-globe2' },
    { id: 'sex', icon: 'bi-gender-ambiguous' },
    { id: 'hours_per_week', icon: 'bi-clock' },
    { id: 'capital_gain', icon: 'bi-graph-up-arrow' },
    { id: 'capital_loss', icon: 'bi-graph-down-arrow' },
    { id: 'native_country', icon: 'bi-globe-americas' }
  ];

  const HIGH_EDUCATION = ['Bachelors', 'Masters', 'Doctorate', 'Prof-school'];
  const MANAGERIAL_OCCUPATIONS = ['Exec-managerial', 'Prof-specialty', 'Tech-support'];

  function classifyTier(pct) {
    if (pct >= 85) return { key: 'excellent', label: 'Excellent', risk: 'Low' };
    if (pct >= 70) return { key: 'high', label: 'High', risk: 'Low–Medium' };
    if (pct >= 55) return { key: 'medium', label: 'Medium', risk: 'Medium' };
    return { key: 'low', label: 'Low', risk: 'Elevated' };
  }

  function profileFromRaw(raw) {
    const profile = {};
    Object.entries(FIELD_KEY_MAP).forEach(([fieldId, backendKey]) => {
      let val = raw ? raw[backendKey] : undefined;
      if (val === undefined && raw) val = raw[fieldId];
      profile[fieldId] = NUMERIC_FIELDS.has(fieldId) ? Number(val) : val;
    });
    return profile;
  }

  function buildSummarySentences(profile, aboveThreshold) {
    const sentences = [];
    const edu = profile.education || 'this education level';
    const occ = profile.occupation || 'this occupation';
    const hours = profile.hours_per_week;
    const gain = profile.capital_gain;
    const loss = profile.capital_loss;

    if (HIGH_EDUCATION.includes(profile.education)) {
      sentences.push(`${edu} education combined with a ${occ} occupation ${aboveThreshold ? 'generally increases the probability of earning above $50K.' : 'still left this profile below the $50K threshold once other factors were weighed.'}`);
    } else {
      sentences.push(`A ${edu} education level paired with a ${occ} role ${aboveThreshold ? 'was offset by other strong factors in this profile.' : 'is more commonly associated with income at or below $50K in this dataset.'}`);
    }

    if (hours >= 45) {
      sentences.push(`Working ${hours} hours per week signals strong labor-market engagement, which supports a higher estimated income.`);
    } else if (hours < 30) {
      sentences.push(`Working only ${hours} hours per week reduced the estimated annual income.`);
    } else {
      sentences.push(`A standard ${hours}-hour work week places this profile in line with typical full-time income patterns.`);
    }

    if (gain > 0) {
      sentences.push(`A capital gain of $${gain.toLocaleString()} indicates additional investment income beyond wages.`);
    } else if (loss > 0) {
      sentences.push(`A recorded capital loss of $${loss.toLocaleString()} suggests some investment activity, though it did not add positive income.`);
    } else {
      sentences.push('Zero capital gain indicates limited investment income outside of wages.');
    }

    return sentences;
  }

  function buildInsights(profile, aboveThreshold) {
    const hours = profile.hours_per_week;
    const age = profile.age;

    return [
      {
        icon: 'bi-clock-history',
        title: 'Work Pattern',
        text: hours >= 45
          ? `At ${hours} hours per week in a ${profile.workclass || 'reported'} workclass, this profile shows above-average time investment, a pattern often linked to higher earnings.`
          : hours < 30
            ? `At just ${hours} hours per week, this profile reflects part-time-style engagement, which typically caps total earnings potential.`
            : `A ${hours}-hour work week is a typical full-time pattern, putting this profile near the dataset's median labor input.`
      },
      {
        icon: 'bi-mortarboard',
        title: 'Education Impact',
        text: HIGH_EDUCATION.includes(profile.education)
          ? `${profile.education} is one of the stronger education tiers in the dataset (education number ${profile.education_num}), and it consistently correlates with higher income bands.`
          : `${profile.education} (education number ${profile.education_num}) sits in a mid-to-lower education tier, which tends to correlate with more modest income bands.`
      },
      {
        icon: 'bi-graph-up',
        title: 'Income Signals',
        text: MANAGERIAL_OCCUPATIONS.includes(profile.occupation)
          ? `A ${profile.occupation} occupation combined with ${profile.marital_status} marital status and a ${profile.relationship} relationship role reflects a profile the model associates with elevated income.`
          : `A ${profile.occupation} occupation combined with ${profile.marital_status} marital status is a common pattern the model associates with income closer to the $50K threshold.`
      },
      {
        icon: 'bi-cash-coin',
        title: 'Capital Analysis',
        text: profile.capital_gain > 0
          ? `A capital gain of $${profile.capital_gain.toLocaleString()} adds a measurable investment-income signal on top of wages.`
          : profile.capital_loss > 0
            ? `A capital loss of $${profile.capital_loss.toLocaleString()} was recorded, which can slightly weigh down the overall income estimate.`
            : `No capital gain or loss was reported, so this estimate rests entirely on wage-related signals like occupation and hours.`
      }
    ];
  }

  function buildFactors(profile) {
    const positive = [];
    const negative = [];

    if (HIGH_EDUCATION.includes(profile.education)) {
      positive.push(`Higher education (${profile.education})`);
    } else {
      negative.push(`Lower formal education tier (${profile.education})`);
    }

    if (MANAGERIAL_OCCUPATIONS.includes(profile.occupation)) {
      positive.push(`Managerial or professional occupation (${profile.occupation})`);
    }

    if (profile.hours_per_week >= 45) {
      positive.push(`High weekly work hours (${profile.hours_per_week}h)`);
    } else if (profile.hours_per_week < 30) {
      negative.push(`Reduced weekly work hours (${profile.hours_per_week}h)`);
    }

    if (profile.capital_gain > 0) {
      positive.push(`Positive capital gain ($${profile.capital_gain.toLocaleString()})`);
    } else {
      negative.push('Zero capital gain');
    }

    if (profile.capital_loss > 0) {
      negative.push(`Capital loss recorded ($${profile.capital_loss.toLocaleString()})`);
    }

    if (profile.age < 25) {
      negative.push(`Early-career age (${profile.age})`);
    } else if (profile.age >= 45 && profile.age <= 60) {
      positive.push(`Peak-earning age range (${profile.age})`);
    }

    if (profile.marital_status === 'Married-civ-spouse') {
      positive.push('Married-civ-spouse status');
    }

    if (positive.length === 0) positive.push('No strong positive signals identified');
    if (negative.length === 0) negative.push('No strong negative signals identified');

    return { positive, negative };
  }

  function buildRecommendations(profile) {
    const recs = [];

    if (!HIGH_EDUCATION.includes(profile.education)) {
      recs.push({ icon: 'bi-mortarboard', text: 'Pursuing further education may strengthen future income potential.' });
    }
    if (profile.hours_per_week < 40) {
      recs.push({ icon: 'bi-clock', text: 'Gradually increasing work experience or hours could be one factor to consider.' });
    }
    if (!MANAGERIAL_OCCUPATIONS.includes(profile.occupation)) {
      recs.push({ icon: 'bi-briefcase', text: 'Exploring management or specialist career tracks is a path some professionals consider.' });
    }
    recs.push({ icon: 'bi-patch-check', text: 'Relevant professional certifications can be a useful long-term investment.' });
    recs.push({ icon: 'bi-piggy-bank', text: 'Building an investment or savings plan may diversify income sources over time.' });

    return recs.slice(0, 5);
  }

  function renderProfileGrid(profile) {
    if (!profileGrid) return;
    profileGrid.innerHTML = PROFILE_DISPLAY_FIELDS.map((f) => `
      <div class="profile-card">
        <span class="profile-card-icon"><i class="bi ${f.icon}"></i></span>
        <div class="profile-card-body">
          <span class="profile-card-label">${readableKey(f.id)}</span>
          <span class="profile-card-value">${profile[f.id]}</span>
        </div>
      </div>
    `).join('');
    attachTilt(profileGrid.querySelectorAll('.profile-card'));
  }

  function renderInsights(insights) {
    if (!insightsGrid) return;
    insightsGrid.innerHTML = insights.map((i) => `
      <div class="insight-card">
        <span class="insight-card-icon"><i class="bi ${i.icon}"></i></span>
        <h4 class="insight-card-title">${i.title}</h4>
        <p class="insight-card-text">${i.text}</p>
      </div>
    `).join('');
    attachTilt(insightsGrid.querySelectorAll('.insight-card'));
  }

  function renderFactors(factors) {
    if (!factorsPositive || !factorsNegative) return;
    factorsPositive.innerHTML = factors.positive.map((f, i) => `
      <li style="animation-delay:${Math.min(i, 8) * 0.08}s"><i class="bi bi-check-circle"></i><span>${f}</span></li>
    `).join('');
    factorsNegative.innerHTML = factors.negative.map((f, i) => `
      <li style="animation-delay:${Math.min(i, 8) * 0.08}s"><i class="bi bi-x-circle"></i><span>${f}</span></li>
    `).join('');
  }

  function renderRecommendations(recs) {
    if (!recommendationsList) return;
    recommendationsList.innerHTML = recs.map((r) => `
      <li><i class="bi ${r.icon}"></i><span>${r.text}</span></li>
    `).join('');
  }

  function renderConfidenceAnalysis(pct, tier, profile) {
    if (!tierPill) return;
    tierPill.className = `tier-pill tier-${tier.key}`;
    tierPill.innerHTML = `<i class="bi bi-award"></i> ${tier.label} confidence`;

    const certainty = Math.min(100, Math.max(0, Math.abs(pct - 50) * 2));
    const stability = Math.min(100, Math.max(30, certainty * 0.75 + ((profile.hours_per_week || 0) / 99) * 15 + 10));

    animateMetric(metricProbability, metricProbabilityNum, pct);
    animateMetric(metricCertainty, metricCertaintyNum, Math.round(certainty * 10) / 10);
    animateMetric(metricStability, metricStabilityNum, Math.round(stability * 10) / 10);
  }

  function animateMetric(fillEl, numEl, pct) {
    if (!fillEl || !numEl) return;
    fillEl.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fillEl.style.width = `${pct}%`;
      });
    });
    animateCounter(numEl, pct);
  }

  function runJourneyAnimation() {
    if (!journeyWrap) return;
    const steps = journeyWrap.querySelectorAll('.journey-step');
    const arrows = journeyWrap.querySelectorAll('.journey-arrow');
    steps.forEach((s) => s.classList.remove('is-active'));
    arrows.forEach((a) => a.classList.remove('is-active'));

    const sequence = [];
    steps.forEach((s, i) => {
      sequence.push(s);
      if (arrows[i]) sequence.push(arrows[i]);
    });

    sequence.forEach((el, i) => {
      setTimeout(() => el.classList.add('is-active'), i * 180);
    });
  }

  function renderComparison(prev, current) {
    if (!comparisonSection || !comparisonGrid) return;
    comparisonSection.style.display = '';

    const confDiff = Math.round((current.pct - prev.pct) * 10) / 10;
    const sameLabel = prev.label === current.label;
    const diffClass = confDiff > 0 ? 'value-up' : confDiff < 0 ? 'value-down' : '';
    const diffSign = confDiff > 0 ? '+' : '';

    comparisonGrid.innerHTML = `
      <div class="comparison-card">
        <span class="comparison-card-label">Previous</span>
        <span class="comparison-card-value">${prev.label} · ${prev.pct}%</span>
      </div>
      <div class="comparison-card">
        <span class="comparison-card-label">Current</span>
        <span class="comparison-card-value">${current.label} · ${current.pct}%</span>
      </div>
      <div class="comparison-card">
        <span class="comparison-card-label">Confidence Difference</span>
        <span class="comparison-card-value ${diffClass}">${diffSign}${confDiff}%</span>
      </div>
      <div class="comparison-card">
        <span class="comparison-card-label">Prediction Difference</span>
        <span class="comparison-card-value">${sameLabel ? 'Unchanged' : 'Changed'}</span>
      </div>
    `;
  }

  function attachTilt(elements) {
    elements.forEach((el) => {
      if (el.dataset.tiltBound) return;
      el.dataset.tiltBound = 'true';
      el.classList.add('tilt-card');
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(600px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-2px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  function showProfileSkeletons() {
    if (profileGrid) {
      profileGrid.innerHTML = Array.from({ length: 6 }).map(() => '<div class="profile-card skeleton-card"><span class="skeleton-shimmer"></span></div>').join('');
    }
    if (insightsGrid) {
      insightsGrid.innerHTML = Array.from({ length: 4 }).map(() => '<div class="insight-card skeleton-card"><span class="skeleton-shimmer"></span></div>').join('');
    }
  }

  function buildAIReport(profile, data) {
    const label = data.label ?? (data.prediction === 1 ? '>50K' : '<=50K');
    const probability = typeof data.probability === 'number' ? data.probability : 0;
    const pct = Math.min(Math.max(Math.round(probability * 1000) / 10, 0), 100);
    const aboveThreshold = classifyLabel(label, probability) === 'high';
    const tier = classifyTier(pct);

    if (aiReportSection) aiReportSection.classList.add('is-active');

    if (reportPrediction) reportPrediction.textContent = label;
    if (reportCategory) reportCategory.textContent = aboveThreshold ? 'Above $50K' : 'At or below $50K';
    if (reportConfidence) reportConfidence.textContent = `${pct}%`;
    if (reportRisk) {
      reportRisk.textContent = tier.risk;
      reportRisk.classList.remove('value-high', 'value-medium', 'value-low');
      reportRisk.classList.add(tier.key === 'low' ? 'value-low' : tier.key === 'medium' ? 'value-medium' : 'value-high');
    }

    const summarySentences = buildSummarySentences(profile, aboveThreshold);
    if (reportSummaryText) reportSummaryText.textContent = summarySentences.join(' ');

    renderConfidenceAnalysis(pct, tier, profile);
    renderProfileGrid(profile);

    const insights = buildInsights(profile, aboveThreshold);
    const factors = buildFactors(profile);
    const recommendations = buildRecommendations(profile);

    renderInsights(insights);
    renderFactors(factors);
    renderRecommendations(recommendations);
    runJourneyAnimation();

    if (previousPredictionSnapshot) {
      renderComparison(previousPredictionSnapshot, { profile, label, pct });
    }

    previousPredictionSnapshot = { profile, label, pct };
    lastProfile = profile;
    lastReportData = { profile, label, pct, tier, category: aboveThreshold ? 'Above $50K' : 'At or below $50K', summary: summarySentences, insights, factors, recommendations };
  }

  function updateStats() {

    if (!statTotal) return;

    const total = historyData.length;

    const above = historyData.filter(
        item => item.label === ">50K"
    ).length;

    const below = historyData.filter(
        item => item.label === "<=50K"
    ).length;

    const avgConfidence = total
        ? historyData.reduce(
            (sum, item) => sum + item.probability,
            0
          ) / total
        : 0;

    const highestConfidence = total
        ? Math.max(
            ...historyData.map(item => item.probability)
          )
        : 0;

    const today = new Date().toDateString();

    const todayPredictions = historyData.filter(item => {

        if (!item.raw.created_at) return false;

        return new Date(item.raw.created_at)
            .toDateString() === today;

    }).length;

    animateCounter(statTotal, total, "");

    animateCounter(statAbove, above, "");

    animateCounter(statBelow, below, "");

    animateCounter(
        statAvgConfidence,
        (avgConfidence * 100).toFixed(1),
        "%"
    );

    animateCounter(
        document.getElementById("stat-highest-confidence"),
        (highestConfidence * 100).toFixed(1),
        "%"
    );

    animateCounter(
        document.getElementById("stat-today"),
        todayPredictions,
        ""
    );

}
  function buildPredictionShareText() {
    if (!lastReportData) return 'No prediction has been run yet.';
    return `IncomeIQ Prediction: ${lastReportData.label} (${lastReportData.category}) — Confidence ${lastReportData.pct}%`;
  }

  function buildReportShareText() {
    if (!lastReportData) return 'No AI report has been generated yet.';
    const r = lastReportData;
    const lines = [
      'IncomeIQ — AI Prediction Report',
      `Prediction: ${r.label} (${r.category})`,
      `Confidence: ${r.pct}%  ·  Risk Level: ${r.tier.risk}`,
      '',
      'Decision Summary:',
      r.summary.join(' '),
      '',
      'AI Insights:',
      ...r.insights.map((i) => `- ${i.title}: ${i.text}`),
      '',
      'Positive Factors: ' + r.factors.positive.join(', '),
      'Negative Factors: ' + r.factors.negative.join(', '),
      '',
      'Recommendations:',
      ...r.recommendations.map((rec) => `- ${rec.text}`)
    ];
    return lines.join('\n');
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `${label} copied to clipboard`);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showToast('error', 'Could not copy to clipboard');
    }
  }

  function generatePdfReport() {
    if (!lastReportData) {
      showToast('error', 'Run a prediction before exporting a report');
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('error', 'PDF library failed to load');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const r = lastReportData;
    const margin = 48;
    let y = margin;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineHeight = 16;

    function ensureSpace(lines = 1) {
      if (y + lines * lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    }

    function writeParagraph(text, size, weight) {
      doc.setFontSize(size);
      doc.setFont('helvetica', weight || 'normal');
      const wrapped = doc.splitTextToSize(text, 500);
      wrapped.forEach((line) => {
        ensureSpace();
        doc.text(line, margin, y);
        y += lineHeight;
      });
    }

    writeParagraph('IncomeIQ', 20, 'bold');
    writeParagraph('AI Prediction Report', 13, 'normal');
    writeParagraph(new Date().toLocaleString(), 10, 'normal');
    y += 8;

    writeParagraph(`Prediction: ${r.label}  (${r.category})`, 12, 'bold');
    writeParagraph(`Confidence: ${r.pct}%   Risk Level: ${r.tier.risk}`, 11, 'normal');
    y += 6;

    writeParagraph('Decision Summary', 13, 'bold');
    writeParagraph(r.summary.join(' '), 10.5, 'normal');
    y += 6;

    writeParagraph('Profile Summary', 13, 'bold');
    PROFILE_DISPLAY_FIELDS.forEach((f) => {
      writeParagraph(`${readableKey(f.id)}: ${r.profile[f.id]}`, 10.5, 'normal');
    });
    y += 6;

    writeParagraph('AI Insights', 13, 'bold');
    r.insights.forEach((i) => writeParagraph(`${i.title} — ${i.text}`, 10.5, 'normal'));
    y += 6;

    writeParagraph('Positive Factors', 12, 'bold');
    r.factors.positive.forEach((f) => writeParagraph(`+ ${f}`, 10.5, 'normal'));
    writeParagraph('Negative Factors', 12, 'bold');
    r.factors.negative.forEach((f) => writeParagraph(`- ${f}`, 10.5, 'normal'));
    y += 6;

    writeParagraph('Recommendations', 13, 'bold');
    r.recommendations.forEach((rec) => writeParagraph(`• ${rec.text}`, 10.5, 'normal'));

    doc.save(`IncomeIQ-Report-${Date.now()}.pdf`);
    showToast('success', 'Report downloaded');
  }

  if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', generatePdfReport);
  }

  if (shareBtn && shareMenu) {
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      shareMenu.classList.toggle('is-open');
    });
    shareMenu.querySelectorAll('button[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.getAttribute('data-copy');
        if (kind === 'prediction') {
          copyText(buildPredictionShareText(), 'Prediction');
        } else {
          copyText(buildReportShareText(), 'AI Report');
        }
        shareMenu.classList.remove('is-open');
      });
    });
    document.addEventListener('click', (e) => {
      if (!shareMenu.contains(e.target) && e.target !== shareBtn) {
        shareMenu.classList.remove('is-open');
      }
    });
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
    startLoadingMessages();
    showProfileSkeletons();

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

      const profile = getProfileValues();
      buildAIReport(profile, data);

      showToast('success', 'Prediction complete');
      await loadHistory();

      resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      showFormError('Something went wrong while contacting the prediction service. Please try again.');
      showToast('error', 'Server unavailable');
      console.error('Prediction request failed:', err);
    } finally {
      setButtonLoading(false);
      stopLoadingMessages();
    }
  }

  function normalizeHistoryItem(item, index) {

    const inputs = item.inputs || {};

    const label = item.label ?? (item.prediction === 1 ? ">50K" : "<=50K");

    const probability =
        typeof item.probability === "number"
            ? item.probability
            : 0;

    return {

        index: index + 1,

        age: inputs.age ?? "—",

        occupation: inputs.occupation ?? "—",

        hoursPerWeek:
            inputs["hours.per.week"] ??
            inputs.hours_per_week ??
            "—",

        education:
            inputs.education ?? "—",

        maritalStatus:
            inputs["marital.status"] ??
            "—",

        capitalGain:
            inputs["capital.gain"] ?? 0,

        capitalLoss:
            inputs["capital.loss"] ?? 0,

        relationship:
            inputs.relationship ?? "—",

        race:
            inputs.race ?? "—",

        sex:
            inputs.sex ?? "—",

        nativeCountry:
            inputs["native.country"] ?? "—",

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
      tr.className = 'history-row';
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
        <td class="th-expand"><span class="row-expand-icon"><i class="bi bi-chevron-down"></i></span></td>
      `;

      const detailTr = document.createElement('tr');
      detailTr.className = 'history-detail-row';
      detailTr.innerHTML = `
        <td colspan="7">
          <div class="history-detail-wrap">
            <div class="history-detail-inner">
              ${buildHistoryDetailMarkup(entry)}
            </div>
          </div>
        </td>
      `;

      tr.addEventListener('click', () => {
        const isOpen = tr.classList.toggle('is-open');
        detailTr.classList.toggle('is-open', isOpen);
      });

      historyTbody.appendChild(tr);
      historyTbody.appendChild(detailTr);
    });

    renderHistoryCards(entries);
  }

  function buildHistoryDetailMarkup(entry) {
    const profile = profileFromRaw(entry.raw);
    const probabilityPct = Math.round(entry.probability * 1000) / 10;
    const aboveThreshold = entry.tier === 'high';
    const timestamp = entry.raw.created_at || entry.raw.timestamp || entry.raw.date || '—';
    const summary = buildSummarySentences(profile, aboveThreshold)[0];

    const detailFields = ['age', 'education', 'occupation', 'marital_status', 'hours_per_week', 'capital_gain', 'capital_loss'];

    return `
      <div class="history-detail-block">
        <div class="history-detail-block-title">Submitted Profile</div>
        <div class="history-detail-grid">
          ${detailFields.map((f) => `<div class="history-detail-item"><b>${readableKey(f)}:</b> ${profile[f]}</div>`).join('')}
        </div>
      </div>
      <div class="history-detail-block">
        <div class="history-detail-block-title">Result</div>
        <div class="history-detail-grid">
          <div class="history-detail-item"><b>Prediction:</b> ${entry.label}</div>
          <div class="history-detail-item"><b>Confidence:</b> ${probabilityPct}%</div>
          <div class="history-detail-item"><b>Timestamp:</b> ${timestamp}</div>
        </div>
        <p class="history-detail-explanation">${summary}</p>
      </div>
    `;
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
        <div class="history-mobile-detail">${buildSummarySentences(profileFromRaw(entry.raw), entry.tier === 'high')[0]}</div>
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
      updateStats();
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

function generatePDFReport() {

    if (!window.jspdf) {
        if (typeof showToast === "function") {
            showToast("PDF library failed to load.", "error");
        }
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // -------------------------
    // Collect Current Data
    // -------------------------

    const prediction =
        document.getElementById("result-label")?.innerText || "--";

    const confidence =
        document.getElementById("confidence-num")?.innerText || "--";

    const aiReport =
        document.getElementById("report-summary-text")?.innerText ||
        "No AI report generated.";

    const date = new Date().toLocaleString();

    // -------------------------
    // Header
    // -------------------------

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255,255,255);
    doc.setFontSize(24);
    doc.setFont("helvetica","bold");
    doc.text("IncomeIQ",20,18);

    doc.setFontSize(11);
    doc.text("AI Powered Income Prediction Report",20,24);

    doc.setTextColor(0,0,0);

    // -------------------------
    // Prediction Summary
    // -------------------------

    let y = 42;

    doc.setFontSize(18);
    doc.setFont("helvetica","bold");
    doc.text("Prediction Summary",20,y);

    y += 12;

    doc.setFontSize(12);
    doc.setFont("helvetica","normal");

    doc.text(`Prediction : ${prediction}`,20,y);

    y += 8;

    doc.text(`Confidence : ${confidence}`,20,y);

    y += 8;

    doc.text(`Generated : ${date}`,20,y);

    // -------------------------
    // Divider
    // -------------------------

    y += 12;

    doc.line(20,y,190,y);

    // -------------------------
    // AI Report
    // -------------------------

    y += 12;

    doc.setFontSize(18);
    doc.setFont("helvetica","bold");
    doc.text("AI Prediction Report",20,y);

    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica","normal");

    const reportLines = doc.splitTextToSize(aiReport,170);

    doc.text(reportLines,20,y);

    y += reportLines.length*6+10;

    // -------------------------
    // Footer
    // -------------------------

    doc.line(20,280,190,280);

    doc.setFontSize(10);

    doc.text(
        "Generated by IncomeIQ | Machine Learning Pipeline | Scikit-Learn",
        20,
        287
    );

    doc.save("IncomeIQ_Report.pdf");

    if(typeof showToast==="function"){
        showToast("Report downloaded successfully!","success");
    }
}