/**
 * Главный контроллер веб-приложения "NEOMATH"
 * Управление состоянием, конструктор вариантов, банк заданий, лаборатория графиков,
 * динамическая анимация и модальное окно подробного пошагового решения.
 */

class AppState {
  constructor() {
    this.storageKey = 'matmaster_spo_data_v9';
    this.themeKey = 'grafmaster_theme';
    
    this.loadState();
    
    this.activeTab = 'builder';
    this.variantCount = 1;
    this.activeVariantView = 1;
    this.currentTheme = 'dark';
    this.studentMode = true; // Изначально графиков НЕТ (чистая сетка для самостоятельного решения)
    this.cardOverrides = {};
    this.studentDrawings = {};
    this.studentShortAnswers = {};
  }

  loadState() {
    this.taskBank = [...INITIAL_TASK_BANK];
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.customTasks && Array.isArray(parsed.customTasks)) {
          parsed.customTasks.forEach(ct => {
            const idx = this.taskBank.findIndex(t => t.id === ct.id);
            if (idx >= 0) this.taskBank[idx] = ct;
            else this.taskBank.unshift(ct);
          });
        }
        this.selectedTaskIds = parsed.selectedTaskIds || [
          'num-pow-1', 'log-1', 'exp-eq-1', 'trig-eq-1',
          'lin-fn-1', 'quad-fn-1', 'deriv-calc-1', 'stereo-prism-1'
        ];
        this.workSettings = parsed.workSettings || this.getDefaultWorkSettings();
        this.studentDrawings = parsed.studentDrawings || {};
        this.studentShortAnswers = parsed.studentShortAnswers || {};
        this.variantTasks = parsed.variantTasks || this.getDefaultVariantTasks();
        this.studentMode = (parsed.studentMode !== undefined) ? parsed.studentMode : true;
        return;
      } catch (e) {
        console.error('Ошибка загрузки сохраненных данных:', e);
      }
    }
    
    this.taskBank = [...INITIAL_TASK_BANK];
    this.selectedTaskIds = [
      'num-pow-1', 'log-1', 'exp-eq-1', 'trig-eq-1',
      'lin-fn-1', 'quad-fn-1', 'deriv-calc-1', 'stereo-prism-1'
    ];
    this.workSettings = this.getDefaultWorkSettings();
    this.variantTasks = this.getDefaultVariantTasks();
    this.studentMode = true;
  }

  getDefaultVariantTasks() {
    const vt = {};
    for (let v = 1; v <= 25; v++) {
      const idx = ((v - 1) % 200) + 1;
      vt[v] = [
        `num-pow-${idx}`,
        `log-${idx}`,
        `exp-eq-${idx}`,
        `trig-eq-${idx}`,
        `lin-fn-${idx}`,
        `quad-fn-${idx}`,
        `deriv-calc-${idx}`,
        `stereo-prism-${idx}`
      ];
    }
    return vt;
  }

  getSelectedTasksForVariant(variantNum = this.activeVariantView) {
    if (this.variantTasks && this.variantTasks[variantNum] && this.variantTasks[variantNum].length > 0) {
      return this.variantTasks[variantNum]
        .map(id => this.taskBank.find(t => t.id === id))
        .filter(Boolean);
    }
    const def = this.getDefaultVariantTasks();
    if (def[variantNum]) {
      return def[variantNum]
        .map(id => this.taskBank.find(t => t.id === id))
        .filter(Boolean);
    }
    return this.selectedTaskIds
      .map(id => this.taskBank.find(t => t.id === id))
      .filter(Boolean);
  }

  getDefaultWorkSettings() {
    return {
      collegeName: 'ГБПОУ «Политехнический колледж»',
      subject: 'Математика',
      topic: 'Контрольная работа: Все графики функций',
      timeLimit: '45 минут',
      showStudentFields: true,
      showAnswersSheet: true,
      showCriteria: true,
      layoutMode: 'one-per-page',
      gradingScale: '«3» — 5-7 баллов, «4» — 8-10 баллов, «5» — 11-13 баллов'
    };
  }

  saveState() {
    try {
      // Сохраняем только пользовательские изменения и чертежи,
      // чтобы не перегружать квоту localStorage 900 статическими задачами:
      const customTasks = this.taskBank.filter(t => t.isCustom);
      const data = {
        customTasks,
        selectedTaskIds: this.selectedTaskIds,
        workSettings: this.workSettings,
        studentDrawings: this.studentDrawings || {},
        studentShortAnswers: this.studentShortAnswers || {},
        variantTasks: this.variantTasks || {},
        studentMode: this.studentMode
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Предупреждение сохранения в localStorage (лимит квоты):', e);
      try {
        // Резервное сохранение без тяжелых картинок чертежей
        const fallback = {
          selectedTaskIds: this.selectedTaskIds,
          workSettings: this.workSettings
        };
        localStorage.setItem(this.storageKey, JSON.stringify(fallback));
      } catch (_) {}
    }
  }

  resetToDefault() {
    this.taskBank = [...INITIAL_TASK_BANK];
    this.selectedTaskIds = [
      'num-pow-1', 'log-1', 'exp-eq-1', 'trig-eq-1',
      'lin-fn-1', 'quad-fn-1', 'deriv-calc-1', 'stereo-prism-1'
    ];
    this.workSettings = this.getDefaultWorkSettings();
    this.saveState();
  }
}

let state;
try {
  state = new AppState();
} catch (e) {
  window.__app_error = e.stack || e.toString();
  console.error("APP INIT ERROR:", e);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initVariantCountControls();
  initBuilderModeToggle();
  initClearTasksButton();
  initBuilderAnswersToggle();
  initGeneratorModal();
  initBankTab();
  initTaskModal();
  initSolutionModal();
    if (typeof StudentBoard !== 'undefined') StudentBoard.init();
  renderCurrentTab();
});

/* ==================== ТЕМА ОФОРМЛЕНИЯ ==================== */
function initTheme() {
  const root = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');

  function applyTheme() {
    // Неоновая ночная тема зафиксирована
    root.classList.add('dark');
    if (themeIcon) themeIcon.textContent = '⚡';
    state.currentTheme = 'dark';
    try {
      localStorage.setItem(state.themeKey, 'dark');
    } catch (e) {}
  }

  applyTheme();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      applyTheme();
      showToast('⚡ Постоянная неоновая тема активна', 'info');
    });
  }
}

/* ==================== НАВИГАЦИЯ ==================== */
function initNavigation() {
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tabName) {
  state.activeTab = tabName;
  
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active-tab');
    } else {
      btn.classList.remove('active-tab');
    }
  });

  document.querySelectorAll('.tab-section').forEach(sec => {
    if (sec.id === `section-${tabName}`) {
      sec.classList.remove('hidden');
    } else {
      sec.classList.add('hidden');
    }
  });

  renderCurrentTab();
}

function renderCurrentTab() {
  switch (state.activeTab) {
    case 'builder':
      renderBuilderTab();
      break;
    case 'bank':
      renderBankList();
      break;
    default:
      renderBuilderTab();
      break;
  }
}

/* ==================== КОНСТРУКТОР ВАРИАНТОВ ==================== */
function initClearTasksButton() {
  const clearBtn = document.getElementById('clear-tasks-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Очистить все выбранные задания из текущей работы?')) {
        state.selectedTaskIds = [];
        state.cardOverrides = {};
        state.saveState();
        renderBuilderTab();
        renderBuilderAnswersPanel();
        showToast('Список заданий очищен', 'info');
      }
    });
  }
}

function initBuilderModeToggle() {
  const toggleBtn = document.getElementById('builder-mode-toggle-btn');
  const textEl = document.getElementById('builder-mode-text');
  const iconEl = document.getElementById('builder-mode-icon');
  const whiteboardBtn = document.getElementById('builder-open-whiteboard-btn');

  function updateButtonUI() {
    if (!toggleBtn) return;
    if (state.studentMode) {
      // Режим черчения: графики скрыты (чистая сетка)
      if (textEl) textEl.textContent = 'Показать графики';
      if (iconEl) iconEl.textContent = '👁️';
      toggleBtn.className = 'btn-neon-primary px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-neon-cyan transition';
      toggleBtn.title = 'Отобразить эталонные графики и чертежи';
    } else {
      // Режим учителя: графики видны (клик скроет их)
      if (textEl) textEl.textContent = 'Скрыть графики';
      if (iconEl) iconEl.textContent = '✏️';
      toggleBtn.className = 'px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-700 bg-slate-900/90 text-slate-300 hover:border-cyan-400 hover:text-white flex items-center gap-1.5 transition';
      toggleBtn.title = 'Скрыть графики и включить режим черчения (чистая координатная сетка)';
    }
  }

  if (toggleBtn) {
    updateButtonUI();
    toggleBtn.addEventListener('click', () => {
      state.studentMode = !state.studentMode;
      state.saveState();
      updateButtonUI();
      renderBuilderTab();
      showToast(state.studentMode ? '✏️ Графики скрыты (режим самостоятельного черчения)' : '👁️ Графики отображены', 'info');
    });
  }

  if (whiteboardBtn) {
    whiteboardBtn.addEventListener('click', () => {
      if (typeof StudentBoard !== 'undefined') {
        const selectedTasks = state.getSelectedTasksForVariant(state.activeVariantView || 1);
        StudentBoard.open(selectedTasks[0] || null, state.activeVariantView || 1);
        showToast('🎨 Открыта интерактивная доска для черчения', 'info');
      }
    });
  }

  // Кнопки открытия доски из шапки навигации
  document.getElementById('nav-open-whiteboard-btn')?.addEventListener('click', () => {
    if (typeof StudentBoard !== 'undefined') {
      const selectedTasks = state.getSelectedTasksForVariant(state.activeVariantView || 1);
      StudentBoard.open(selectedTasks[0] || null, state.activeVariantView || 1);
    }
  });
  document.getElementById('nav-open-whiteboard-mobile-btn')?.addEventListener('click', () => {
    if (typeof StudentBoard !== 'undefined') {
      const selectedTasks = state.getSelectedTasksForVariant(state.activeVariantView || 1);
      StudentBoard.open(selectedTasks[0] || null, state.activeVariantView || 1);
    }
  });
}

function initVariantCountControls() {
  const container = document.getElementById('variant-buttons-group');
  if (!container) return;

  const counts = [1, 2, 3, 4, 10, 25];
  container.innerHTML = '';

  counts.forEach(cnt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `variant-pill-btn ${state.variantCount === cnt ? 'active' : ''}`;
    btn.innerHTML = `${cnt} ${cnt === 1 ? 'вариант' : cnt <= 4 ? 'варианта' : cnt === 25 ? 'вар. (группа)' : 'вариантов'}`;
    btn.addEventListener('click', () => {
      state.variantCount = cnt;
      if (state.activeVariantView > cnt) state.activeVariantView = 1;
      
      // Автоматически распределяем уникальные задания для каждого варианта:
      if (!state.variantTasks || Object.keys(state.variantTasks).length < cnt) {
        state.variantTasks = state.getDefaultVariantTasks();
      }
      
      initVariantCountControls();
      renderBuilderTab();
      renderBuilderAnswersPanel();
      showToast(`Установлено вариантов: ${cnt}. Для каждого варианта подготовлены свои задания!`, 'success');
    });
    container.appendChild(btn);
  });
}

/* ==================== ГЕНЕРАТОР ВАРИАНТОВ И ОТВЕТОВ ==================== */
function generateCompleteWork(taskCount = 8) {
  // Ограничиваем количество заданий от 1 до 25
  taskCount = Math.max(1, Math.min(25, parseInt(taskCount, 10) || 8));

  // Полный перечень всех 25 различных модулей:
  const allCategories = [
    'numbers_powers', 'logarithms', 'exp_equations', 'log_equations',
    'irrational_equations', 'trig_expressions', 'trig_equations',
    'linear_functions', 'quadratic_functions', 'rational_functions',
    'transcendental_graphs', 'derivatives_calc', 'derivatives_geom_phys',
    'extremum_optimization', 'antiderivative', 'integrals_calc',
    'integral_area', 'stereometry_prism', 'stereometry_pyramid',
    'stereometry_cylinder_cone', 'stereometry_sphere', 'vectors_space',
    'combinatorics', 'probability_stats', 'complex_numbers'
  ];

  // Перемешиваем список модулей случайным образом:
  const shuffledCats = [...allCategories].sort(() => 0.5 - Math.random());

  // Выбираем ровно taskCount уникальных модулей (СТРОГО по одному заданию каждого типа, без повторов категорий):
  const selectedCats = shuffledCats.slice(0, taskCount);

  // Для каждой выбранной категории берем ровно 1 задачу (из 200 задач категории в банке):
  const chosenIds = [];
  selectedCats.forEach(catId => {
    const catTasks = state.taskBank.filter(t => t.category === catId);
    if (catTasks.length > 0) {
      const randTask = catTasks[Math.floor(Math.random() * catTasks.length)];
      chosenIds.push(randTask.id);
    }
  });

  // Также генерируем согласованные параллельные варианты для всей группы (до 25 вариантов) того же состава тем:
  const totalVariants = Math.max(1, state.variantCount || 1);
  const variantTasks = {};
  for (let v = 1; v <= totalVariants; v++) {
    variantTasks[v] = selectedCats.map(catId => {
      const catTasks = state.taskBank.filter(t => t.category === catId);
      if (catTasks.length === 0) return null;
      // Каждому варианту присваивается свое параллельное задание этого же типа:
      const tIdx = ((v - 1) * 7 + Math.floor(Math.random() * 5)) % catTasks.length;
      return catTasks[tIdx].id;
    }).filter(Boolean);
  }
  variantTasks[1] = chosenIds;

  // Синхронизируем селекторы количества заданий в интерфейсе
  const toolbarSelect = document.getElementById('builder-task-count-select');
  if (toolbarSelect && toolbarSelect.value != taskCount) {
    toolbarSelect.value = taskCount;
  }
  const modalSelect = document.getElementById('gen-task-count');
  if (modalSelect && modalSelect.value != taskCount) {
    modalSelect.value = taskCount;
  }

  state.activeVariantView = 1;
  state.variantTasks = variantTasks;
  state.selectedTaskIds = chosenIds;
  state.studentShortAnswers = {};
  state.cardOverrides = {};
  state.saveState();

  switchTab('builder');
  renderBuilderTab();
  renderBuilderAnswersPanel();

  showToast(`⚡ Сгенерирована работа: ${chosenIds.length} заданий (по 1 каждого типа)!`, 'success');
}

function initGeneratorModal() {
  const modal = document.getElementById('generator-modal');
  const toolbarGenBtn = document.getElementById('builder-open-generator-btn');
  const toolbarTaskCountSelect = document.getElementById('builder-task-count-select');

  // Выбор количества заданий прямо в тулбаре (от 1 до 25, по 1 каждого типа):
  if (toolbarTaskCountSelect) {
    toolbarTaskCountSelect.addEventListener('change', (e) => {
      const count = parseInt(e.target.value, 10) || 8;
      generateCompleteWork(count);
    });
  }

  // Кнопка "⚡ Сгенерировать работу" в тулбаре:
  if (toolbarGenBtn) {
    toolbarGenBtn.addEventListener('click', () => {
      const count = toolbarTaskCountSelect ? (parseInt(toolbarTaskCountSelect.value, 10) || 8) : 8;
      generateCompleteWork(count);
    });
  }

  if (!modal) return;

  const headerGenBtn = document.getElementById('open-generator-btn');
  const closeBtn = document.getElementById('gen-modal-close');
  const cancelBtn = document.getElementById('gen-modal-cancel');
  const executeBtn = document.getElementById('gen-modal-execute');
  const countBtns = document.querySelectorAll('.gen-count-btn');
  const taskCountSelect = document.getElementById('gen-task-count');
  const includeAnswersCheckbox = document.getElementById('gen-include-answers');
  const includeSolutionsCheckbox = document.getElementById('gen-include-solutions');

  let selectedGenCount = 4;

  const openModal = () => {
    modal.classList.remove('hidden');
    if (toolbarTaskCountSelect && taskCountSelect) {
      taskCountSelect.value = toolbarTaskCountSelect.value;
    }
  };

  const closeModal = () => {
    modal.classList.add('hidden');
  };

  if (headerGenBtn) {
    headerGenBtn.addEventListener('click', openModal);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Выбор количества вариантов в модалке (2, 4, 10, 25)
  countBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      countBtns.forEach(b => {
        b.classList.remove('border-cyan-400', 'bg-cyan-950/60', 'text-cyan-300');
        b.classList.add('border-cyan-500/30', 'bg-slate-900', 'text-slate-200');
      });
      btn.classList.add('border-cyan-400', 'bg-cyan-950/60', 'text-cyan-300');
      btn.classList.remove('border-cyan-500/30', 'bg-slate-900', 'text-slate-200');
      selectedGenCount = parseInt(btn.dataset.gencount, 10) || 4;
    });
  });

  // Генерация работы по кнопке в модалке
  if (executeBtn) {
    executeBtn.addEventListener('click', () => {
      const taskCount = parseInt(taskCountSelect ? taskCountSelect.value : 8, 10) || 8;
      state.variantCount = selectedGenCount;
      if (includeAnswersCheckbox) state.workSettings.showAnswersSheet = includeAnswersCheckbox.checked;
      if (includeSolutionsCheckbox) state.workSettings.showCriteria = includeSolutionsCheckbox.checked;

      closeModal();
      generateCompleteWork(taskCount);
    });
  }
}

function initBuilderAnswersToggle() {
  const toggleBtn = document.getElementById('toggle-builder-answers-btn');
  const label = document.getElementById('toggle-builder-answers-label');
  const panel = document.getElementById('builder-answers-panel');
  if (!toggleBtn || !panel) return;

  toggleBtn.addEventListener('click', () => {
    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
      panel.classList.remove('hidden');
      if (label) label.textContent = 'Скрыть ответы';
      renderBuilderAnswersPanel();
    } else {
      panel.classList.add('hidden');
      if (label) label.textContent = 'Ответы и решения';
    }
  });
}

function renderBuilderAnswersPanel() {
  const panel = document.getElementById('builder-answers-panel');
  const container = document.getElementById('builder-answers-content');
  if (!panel || !container || panel.classList.contains('hidden')) return;

  const selectedTasks = state.getSelectedTasksForVariant(1);

  if (selectedTasks.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400">Нет выбранных заданий для формирования ключей ответов.</p>';
    return;
  }

  let html = `
    <div class="border border-cyan-500/30 rounded-xl p-3 sm:p-4 bg-slate-950/80 mb-3 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-neon-cyan">ЭТАЛОННЫЕ КЛЮЧИ И РЕШЕНИЯ</span>
          <span class="text-xs text-slate-400 font-medium">(${selectedTasks.length} заданий текущей работы)</span>
        </div>
      </div>

      <div class="space-y-3">
  `;

  selectedTasks.forEach((task, tIdx) => {
    const varData = task.variants[0];
    const sol = varData.detailedSolution || {};

    html += `
      <div class="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 text-xs">
        <div class="flex items-center justify-between mb-1.5 flex-wrap gap-1">
          <span class="font-bold text-white">Задание ${tIdx + 1}: <span class="text-slate-300 font-medium">${escapeHtml(task.title)}</span></span>
          <span class="text-[11px] text-cyan-400 font-semibold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">(${task.points || 1} б.)</span>
        </div>

        <div class="text-[11px] text-slate-300 mb-2 whitespace-pre-line leading-relaxed">
          ${escapeHtml(varData.question)}
        </div>

        <div class="bg-emerald-950/50 border border-emerald-500/40 p-2.5 rounded text-emerald-300 mb-2 font-mono text-[11px] leading-relaxed">
          <strong>✓ Ключ к ответу:</strong>\n${escapeHtml(varData.answer)}
        </div>

        ${sol.theory ? `
          <div class="text-[10px] text-slate-400 mb-2 leading-relaxed">
            <strong>Теория и формулы:</strong> ${escapeHtml(sol.theory.split('\n')[0])}
          </div>
        ` : ''}

        <div class="mt-2.5">
          <details class="group bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 transition">
            <summary class="cursor-pointer text-cyan-300 font-bold hover:text-cyan-200 flex items-center justify-between text-xs select-none">
              <span class="flex items-center gap-1.5">
                <span>📖</span>
                <span>Полный пошаговый разбор решения (все 5 шагов с формулами)</span>
              </span>
              <span class="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div class="mt-3 space-y-2.5 pt-2.5 border-t border-slate-800/80 text-xs">
              ${((sol && sol.steps && sol.steps.length > 0) ? sol.steps : getFullSolutionSteps(task, varData, sol)).map(st => `
                <div class="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/60">
                  <div class="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 rounded text-[10px] border border-cyan-500/30">Шаг ${st.stepNum}</span>
                    <span>${escapeHtml(st.title)}</span>
                  </div>
                  <div class="text-slate-300 whitespace-pre-line leading-relaxed font-sans text-[11.5px]">
                    ${escapeHtml(st.content)}
                  </div>
                </div>
              `).join('')}
            </div>
          </details>
        </div>

        <div class="flex justify-end pt-2">
          <button type="button" class="btn-builder-sol-modal text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold" data-taskid="${task.id}" data-vnum="1">
            <span>🔍</span>
            <span>Интерактивный чертеж с подсветкой шагов</span>
          </button>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.btn-builder-sol-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const tid = btn.dataset.taskid;
      const task = state.taskBank.find(t => t.id === tid);
      if (task) openSolutionModal(task, 1);
    });
  });
}


/* ==================== АВТОПРОВЕРКА КРАТКИХ ОТВЕТОВ СТУДЕНТА ==================== */
function checkStudentAnswer(userInput, expectedShort, fullAnswerText) {
  if (!userInput || !userInput.trim()) {
    return { isCorrect: false, message: 'Пожалуйста, введите ваш ответ в поле.' };
  }

  // Универсальная нормализация математических выражений и уравнений
  const normalize = (str) => {
    return String(str || '')
      .toLowerCase()
      // Замена штрихов производной на одинарный апостроф '
      .replace(/[′'`’‘ʼ]/g, "'")
      // Удаляем единицы измерения ДО подстановки символов
      .replace(/(кв\.ед\.?|кв\.ед|см[²³\^3\^2]?|м\/[сc]|рад|°)/g, '')
      // Замена схожих русских букв на английские (частая случайность при наборе на RU-раскладке)
      .replace(/х/g, 'x')
      .replace(/у/g, 'y')
      .replace(/с/g, 'c')
      // Математические степени
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/⁴/g, '^4')
      .replace(/⁰/g, '^0')
      .replace(/¹/g, '^1')
      // Знаки умножения и деления
      .replace(/[·×*]/g, '*')
      .replace(/[:÷]/g, '/')
      .replace(/,/g, '.')
      .replace(/pi/g, 'π')
      // Удаляем пробелы
      .replace(/\s+/g, '')
      .replace(/\.$/, '');
  };

  // Очистка префиксов вида "f'(2)=", "f'(x)=", "F(x)=", "y=", "x=", "v(t)=", "ответ:"
  const stripPrefix = (str) => {
    return String(str || '')
      .replace(/^(f'\(.*?\)|f'|f\(.*?\)|f|y'|y|x|v\(.*?\)|v|s|v|p\(a\)|p|\|z\|\^2|\|a\|\^2|y_наим|y_наиб|ответ:?)=/i, '')
      .trim();
  };

  const uRaw = userInput.trim();
  const uNorm = normalize(uRaw);
  const uStripped = stripPrefix(uNorm);

  const rawTargets = [expectedShort, fullAnswerText].filter(Boolean);
  const targetsNorm = rawTargets.map(t => normalize(t)).filter(Boolean);
  const targetsStripped = targetsNorm.map(t => stripPrefix(t)).filter(Boolean);

  // 1. Прямое совпадение нормализованных строк
  for (const t of targetsNorm) {
    if (uNorm === t) {
      return { isCorrect: true, message: '✓ Абсолютно верно! Ответ совпадает с эталоном.' };
    }
    // Сравнение без знаков умножения (например "3*x^2+1" и "3x^2+1")
    if (uNorm.replace(/\*/g, '') === t.replace(/\*/g, '')) {
      return { isCorrect: true, message: '✓ Абсолютно верно! Формула записана правильно.' };
    }
  }

  // 2. Сравнение со снятыми префиксами формул
  for (const t of targetsStripped) {
    if (uStripped === t || uNorm === t || (targetsNorm.length > 0 && uStripped === targetsNorm[0])) {
      return { isCorrect: true, message: '✓ Абсолютно верно! Значение найдено правильно.' };
    }
    if (uStripped.replace(/\*/g, '') === t.replace(/\*/g, '')) {
      return { isCorrect: true, message: '✓ Абсолютно верно! Математическое выражение верно.' };
    }
  }

  // 3. Числовое сравнение с математической погрешностью
  const uNum = parseFloat(uStripped) || parseFloat(uNorm);
  if (!isNaN(uNum)) {
    for (const t of [...targetsStripped, ...targetsNorm]) {
      const eNum = parseFloat(t);
      if (!isNaN(eNum) && Math.abs(uNum - eNum) < 0.05) {
        return { isCorrect: true, message: '✓ Верно! Точное числовое значение найдено.' };
      }
    }
  }

  // 4. Координаты точки
  const uCoords = uNorm.split(/[;:]/).filter(Boolean);
  for (const t of targetsNorm) {
    const eCoords = t.split(/[;:]/).filter(Boolean);
    if (uCoords.length === 2 && eCoords.length === 2) {
      const uX = parseFloat(uCoords[0]);
      const uY = parseFloat(uCoords[1]);
      const eX = parseFloat(eCoords[0]);
      const eY = parseFloat(eCoords[1]);
      if (!isNaN(uX) && !isNaN(uY) && !isNaN(eX) && !isNaN(eY)) {
        if (Math.abs(uX - eX) < 0.05 && Math.abs(uY - eY) < 0.05) {
          return { isCorrect: true, message: '✓ Верно! Координаты точки определены точно.' };
        }
      }
    }
  }

  // 5. Математические константы с числом π
  for (const t of targetsNorm) {
    if ((t.includes('3.14') || t.includes('π')) &&
        (uNorm.includes('3.14') || uNorm.includes('π'))) {
      const uVal = parseFloat(uNorm.replace(/[^\d.-]/g, ''));
      const tVal = parseFloat(t.replace(/[^\d.-]/g, ''));
      if (!isNaN(uVal) && !isNaN(tVal) && Math.abs(uVal - tVal) < 0.05) {
        return { isCorrect: true, message: '✓ Верно! Ответ с множителем π вычислен правильно.' };
      }
    }
  }

  return { isCorrect: false, message: '❌ Ответ не совпадает. Проверьте вычисления или воспользуйтесь экранной клавиатурой.' };
}

function renderBuilderTab() {
  const listContainer = document.getElementById('selected-tasks-list');
  const countBadge = document.getElementById('selected-tasks-count');
  const totalPointsEl = document.getElementById('total-points-badge');
  const variantTabsContainer = document.getElementById('builder-variant-switcher');

  if (!listContainer) return;

  if (variantTabsContainer) {
    variantTabsContainer.innerHTML = '';
    for (let i = 1; i <= state.variantCount; i++) {
      const vBtn = document.createElement('button');
      vBtn.type = 'button';
      vBtn.className = `px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
        state.activeVariantView === i
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-neon-cyan'
          : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
      }`;
      vBtn.innerHTML = `Вариант ${i}`;
      vBtn.addEventListener('click', () => {
        state.activeVariantView = i;
        renderBuilderTab();
      });
      variantTabsContainer.appendChild(vBtn);
    }
  }

  const selectedTasks = state.getSelectedTasksForVariant(state.activeVariantView);

  if (countBadge) countBadge.textContent = selectedTasks.length;
  const toolbarTaskCountSelect = document.getElementById('builder-task-count-select');
  if (toolbarTaskCountSelect && selectedTasks.length >= 1 && selectedTasks.length <= 25) {
    toolbarTaskCountSelect.value = selectedTasks.length;
  }

  // Определяем по составу заданий: нужны ли графические элементы на панели управления
  const hasGraphTasks = selectedTasks.some(t => t.taskType === 'graph_construction');
  const modeToggleBtn = document.getElementById('builder-mode-toggle-btn');
  const wbToolbarBtn = document.getElementById('builder-open-whiteboard-btn');
  
  if (modeToggleBtn) {
    // Кнопка 'Показать/Скрыть графики' нужна ТОЛЬКО если в работе есть задания с графиками!
    if (hasGraphTasks) {
      modeToggleBtn.classList.remove('hidden');
      modeToggleBtn.style.display = 'inline-flex';
    } else {
      modeToggleBtn.classList.add('hidden');
      modeToggleBtn.style.display = 'none';
    }
  }

  if (wbToolbarBtn) {
    const wbText = wbToolbarBtn.querySelector('span:last-child');
    if (wbText) {
      wbText.textContent = hasGraphTasks ? 'Доска для черчения' : 'Черновик на доске';
    }
  }

  let totalPoints = 0;
  selectedTasks.forEach(t => { totalPoints += (t.points || 1); });
  if (totalPointsEl) totalPointsEl.textContent = `${totalPoints} баллов`;

  if (selectedTasks.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state-box p-8 text-center bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
        <div class="text-4xl mb-3">📝</div>
        <h4 class="text-base font-semibold text-white mb-1">В работе пока нет ни одного задания</h4>
        <p class="text-xs text-slate-400 mb-4">Нажмите «⚡ Сгенерировать работу» или выберите нужные задачи в банке заданий.</p>
        <button type="button" onclick="switchTab('bank')" class="btn-neon-primary px-4 py-2 text-xs font-semibold rounded-lg shadow transition">
          Открыть банк заданий (5000 задач)
        </button>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = '';

  selectedTasks.forEach((task, index) => {
    const varData = task.variants[(state.activeVariantView - 1) % task.variants.length];
    const hasDrawing = state.studentDrawings && !!state.studentDrawings[task.id];
    const isShortAnswer = (task.taskType === 'short_answer');
    const answerKey = `${task.id}_v${state.activeVariantView}`;
    const savedUserAnswer = state.studentShortAnswers ? (state.studentShortAnswers[answerKey] || '') : '';

    const card = document.createElement('div');
    card.className = 'card-neon p-5 transition';
    card.dataset.taskId = task.id;

    if (isShortAnswer) {
      // КАРТОЧКА ДЛЯ ЗАДАНИЙ С КРАТКИМ ОТВЕТОМ: ГРАФИКА НЕТ ВООБЩЕ!
      card.innerHTML = `
        <div class="flex flex-col justify-between h-full">
          <div>
            <div class="flex items-center justify-between mb-2.5 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                  Задание ${index + 1} из ${selectedTasks.length}
                </span>
                <span class="text-xs text-slate-300 font-semibold bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  ${task.categoryName || 'Общая тема'}
                </span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs px-2.5 py-0.5 rounded font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1">
                  <span>📝</span> Краткий ответ
                </span>
                <span class="text-xs px-2 py-0.5 rounded font-semibold ${getDifficultyBadgeClass(task.difficulty)}">
                  ${task.difficultyLabel || 'Базовый'}
                </span>
                <span class="text-xs text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800 font-medium">
                  ${task.points || 1} б.
                </span>
              </div>
            </div>

            <h4 class="font-bold text-base text-white mb-2">
              ${task.title}
            </h4>
            
            <div class="text-xs sm:text-sm text-slate-200 whitespace-pre-line mb-3.5 font-sans leading-relaxed bg-slate-950/90 p-4 rounded-xl border border-slate-800">
              ${escapeHtml(varData.question)}
            </div>

            <!-- Форма ввода и проверки краткого ответа (с математической клавиатурой) -->
            <div class="mb-3.5 p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-inner">
              <div class="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>📝</span> Поле для ответа студента:
                </span>
                <span class="text-[11px] text-slate-400">Введите число, формулу или уравнение полностью</span>
              </div>
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input type="text" inputmode="text" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="student-short-input flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-base sm:text-xs px-3 py-2.5 rounded-lg placeholder-slate-500 outline-none transition font-mono min-h-[44px]" placeholder="Ваш ответ (например: F(x) = 3x² + 1)..." value="${escapeHtml(savedUserAnswer)}" data-task-id="${task.id}" data-var="${state.activeVariantView}">
                <div class="flex items-center gap-2">
                  <button type="button" class="btn-check-student-ans flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs transition cursor-pointer shadow-neon-amber flex items-center justify-center gap-1.5 min-h-[44px]">
                    <span>✓</span> <span>Проверить ответ</span>
                  </button>
                  <button type="button" class="btn-peek-student-ans text-xs text-slate-400 hover:text-white px-3 py-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Показать эталонный ответ">
                    👁️
                  </button>
                </div>
              </div>

              <!-- Быстрые математические кнопки-символы -->
              <div class="math-quick-bar mt-2.5 flex items-center gap-1 flex-wrap">
                <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Вставка:</span>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="f′(">f′(</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="′">′</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="f′(x) = ">f′(x) =</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="F(x) = ">F(x) =</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="x²">x²</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="x³">x³</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="x">x</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val=" + ">+</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val=" - ">−</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="·">·</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="/">/</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="^">^</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="√(">√(</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="π">π</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val="(">(</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val=")">)</button>
                <button type="button" class="btn-math-insert px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold transition select-none" data-val=" = ">=</button>
                <button type="button" class="btn-math-backspace px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold transition select-none" title="Стереть символ">⌫</button>
                <button type="button" class="btn-toggle-extended-kb px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-amber-400 text-amber-300 text-xs font-medium transition ml-auto flex items-center gap-1 select-none">
                  <span>⌨️</span> <span>Клавиатура</span>
                </button>
              </div>

              <!-- Разворачиваемая математическая клавиатура -->
              <div class="extended-math-keyboard hidden mt-2.5 p-2.5 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl space-y-2 sm:space-y-2.5 animate-fade-in">
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px]">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span class="font-bold text-amber-300 text-xs">⌨️ Клавиатура</span>
                  </div>
                  <span class="text-slate-500 text-[10px] hidden sm:inline">Кликните на символ для вставки в курсор</span>
                </div>

                <!-- Строка 1: Готовые шаблоны формул и производных -->
                <div>
                  <div class="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider mb-1">Формулы и производные:</div>
                  <div class="flex items-center gap-1 flex-wrap">
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 font-mono text-xs font-bold active:scale-95" data-val="f′(">f′(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 font-mono text-xs font-bold active:scale-95" data-val="′">′ (штрих)</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 font-mono text-xs font-bold active:scale-95" data-val="f′(x) = ">f′(x) =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 font-mono text-xs font-bold active:scale-95" data-val="F(x) = ">F(x) =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="f(x) = ">f(x) =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="y = ">y =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="x = ">x =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="v(t) = ">v(t) =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="S = ">S =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="V = ">V =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="P(A) = ">P(A) =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="|z|² = ">|z|² =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="y_наим = ">y_наим =</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs active:scale-95" data-val="y_наиб = ">y_наиб =</button>
                  </div>
                </div>

                <!-- Строка 2: Функции и тригонометрия -->
                <div>
                  <div class="text-[10px] text-fuchsia-400 font-mono font-bold uppercase tracking-wider mb-1">Функции и тригонометрия:</div>
                  <div class="flex items-center gap-1 flex-wrap">
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-fuchsia-950/40 hover:bg-fuchsia-900 border border-fuchsia-500/30 text-fuchsia-200 font-mono text-xs active:scale-95" data-val="sin(">sin(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-fuchsia-950/40 hover:bg-fuchsia-900 border border-fuchsia-500/30 text-fuchsia-200 font-mono text-xs active:scale-95" data-val="cos(">cos(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-fuchsia-950/40 hover:bg-fuchsia-900 border border-fuchsia-500/30 text-fuchsia-200 font-mono text-xs active:scale-95" data-val="tg(">tg(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-fuchsia-950/40 hover:bg-fuchsia-900 border border-fuchsia-500/30 text-fuchsia-200 font-mono text-xs active:scale-95" data-val="ctg(">ctg(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-fuchsia-950/40 hover:bg-fuchsia-900 border border-fuchsia-500/30 text-fuchsia-200 font-mono text-xs active:scale-95" data-val="arcsin(">arcsin(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-fuchsia-950/40 hover:bg-fuchsia-900 border border-fuchsia-500/30 text-fuchsia-200 font-mono text-xs active:scale-95" data-val="arccos(">arccos(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fuchsia-300 font-mono text-xs active:scale-95" data-val="log">log</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fuchsia-300 font-mono text-xs active:scale-95" data-val="ln(">ln(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fuchsia-300 font-mono text-xs active:scale-95" data-val="e">e</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fuchsia-300 font-mono text-xs active:scale-95" data-val="π">π</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fuchsia-300 font-mono text-xs active:scale-95" data-val="i">i</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fuchsia-300 font-mono text-xs active:scale-95" data-val="|x|">|x|</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fuchsia-300 font-mono text-xs active:scale-95" data-val="k ∈ Z">k ∈ Z</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fuchsia-300 font-mono text-xs active:scale-95" data-val="kπ">kπ</button>
                  </div>
                </div>

                <!-- Строка 3: Степени, корни, переменные и знаки -->
                <div>
                  <div class="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider mb-1">Степени, корни и знаки:</div>
                  <div class="flex items-center gap-1 flex-wrap">
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold active:scale-95" data-val="x²">x²</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold active:scale-95" data-val="x³">x³</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold active:scale-95" data-val="xⁿ">xⁿ</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold active:scale-95" data-val="²">²</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold active:scale-95" data-val="³">³</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold active:scale-95" data-val="^">^</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold active:scale-95" data-val="√(">√(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold active:scale-95" data-val="∛(">∛(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold active:scale-95" data-val="±">±</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold active:scale-95" data-val="·">·</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold active:scale-95" data-val="/">/</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold active:scale-95" data-val=" + ">+</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold active:scale-95" data-val=" - ">−</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold active:scale-95" data-val=" = ">=</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold active:scale-95" data-val="(">(</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold active:scale-95" data-val=")">)</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold active:scale-95" data-val=";">;</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold active:scale-95" data-val="x">x</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold active:scale-95" data-val="y">y</button>
                    <button type="button" class="btn-math-insert px-2 py-1.5 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold active:scale-95" data-val="t">t</button>
                  </div>
                </div>

                <!-- Строка 4: Цифровая клавиатура и действия -->
                <div>
                  <div class="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider mb-1">Цифры и управление:</div>
                  <div class="flex items-center gap-1 flex-wrap">
                    ${['0','1','2','3','4','5','6','7','8','9','.','-'].map(c => `
                      <button type="button" class="btn-math-insert w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center justify-center transition hover:border-emerald-400 active:scale-95" data-val="${c}">${c}</button>
                    `).join('')}
                    <button type="button" class="btn-math-backspace px-2.5 h-8 sm:h-7 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-mono text-xs font-bold flex items-center justify-center gap-1 ml-auto transition shadow-sm active:scale-95" title="Стереть символ">
                      <span>⌫</span> <span class="hidden sm:inline">Стереть</span>
                    </button>
                    <button type="button" class="btn-math-clear px-2.5 h-8 sm:h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 font-mono text-xs font-medium flex items-center justify-center transition active:scale-95">
                      ✕ <span class="hidden sm:inline">Очистить всё</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="answer-feedback-box hidden mt-2 text-xs"></div>
              <div class="answer-peek-box hidden mt-2 p-2 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                Эталонный ответ: <strong class="text-emerald-400">${escapeHtml(varData.answer || varData.shortAnswer)}</strong>
              </div>
            </div>

            <!-- Действия: Открыть чистый черновик на доске и Пошаговое решение -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <button type="button" class="btn-open-whiteboard py-2.5 px-3 rounded-lg border border-cyan-500/40 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm" title="Открыть пустую доску для решения уравнения и вычислений">
                <span>🎨</span> <span>Черновик на доске</span>
                ${hasDrawing ? '<span class="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400 font-bold">✓ Есть записи</span>' : ''}
              </button>
              <button type="button" class="btn-open-solution btn-neon-emerald py-2.5 px-3 text-xs rounded-lg flex items-center justify-center gap-1.5 transition font-bold shadow-neon-emerald" title="Посмотреть пошаговое решение и теоретический разбор">
                <span class="text-xs">🔍</span>
                <span>Пошаговое решение</span>
                <span class="text-[10px] text-emerald-300">→</span>
              </button>
            </div>
          </div>

          <!-- Нижняя панель: позиция задания и кнопки управления -->
          <div class="flex items-center justify-between border-t border-slate-800 pt-3 mt-1 text-xs">
            <span class="text-xs text-slate-400 font-medium">Задание №${index + 1} (${task.points || 1} б.)</span>
          </div>
        </div>
      `;
    } else {
      // КАРТОЧКА ДЛЯ ЗАДАНИЙ НА ПОСТРОЕНИЕ ГРАФИКА: График отображается только здесь!
      const svgCode = GraphRenderer.renderSVG({
        ...varData.graphConfig,
        width: 320,
        height: 240,
        theme: 'neon',
        animated: true,
        blankGrid: !!state.studentMode
      });

      card.innerHTML = `
        <div class="flex flex-col md:flex-row gap-5 items-start">
          
          <!-- Левая колонка: График и кнопка черчения -->
          <div class="w-full md:w-5/12 flex-shrink-0 flex flex-col items-center">
            <div class="graph-click-area w-full bg-[#070b16] p-2 rounded-xl border border-cyan-500/20 hover:border-cyan-400 flex justify-center overflow-hidden shadow-inner cursor-pointer group transition" title="Нажмите, чтобы открыть этот график на интерактивной доске">
              ${svgCode}
            </div>
            
            <button type="button" class="btn-open-whiteboard w-full py-2.5 px-3 rounded-xl border border-fuchsia-500/50 bg-gradient-to-r from-fuchsia-950/80 to-purple-950/80 hover:from-fuchsia-900 hover:to-purple-900 text-fuchsia-200 font-bold text-xs flex items-center justify-center gap-2 shadow-neon-magenta transition mt-2.5 cursor-pointer" title="Чертить график на интерактивной координатной доске">
              <span>🎨 Чертить график на доске</span>
              ${hasDrawing ? '<span class="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400 font-bold">✓ Чертеж сохранен</span>' : ''}
            </button>
          </div>

          <!-- Правая колонка: Условие задания и кнопки решений -->
          <div class="w-full md:w-7/12 flex flex-col justify-between h-full">
            <div>
              <div class="flex items-center justify-between mb-2 flex-wrap gap-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-xs text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/40">
                    Задание ${index + 1} из ${selectedTasks.length}
                  </span>
                  <span class="text-xs text-slate-300 font-semibold bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 hidden sm:inline">
                    ${task.categoryName || 'Общая тема'}
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs px-2 py-0.5 rounded font-semibold bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm flex items-center gap-1">
                    <span>✏️</span> Построение графика
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded font-semibold ${getDifficultyBadgeClass(task.difficulty)}">
                    ${task.difficultyLabel || 'Базовый'}
                  </span>
                  <span class="text-xs text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    ${task.points || 1} б.
                  </span>
                </div>
              </div>

              <h4 class="font-bold text-sm text-white mb-2 flex items-center justify-between gap-2 flex-wrap">
                <span>${task.title}</span>
                <span class="text-xs text-cyan-400 font-mono font-semibold">${varData.graphConfig.functions && varData.graphConfig.functions[0] ? 'y = ' + varData.graphConfig.functions[0].fn : ''}</span>
              </h4>
              
              <div class="text-xs text-slate-300 whitespace-pre-line mb-3 font-sans leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                ${escapeHtml(varData.question)}
              </div>

              <!-- Главные действия: Пошаговый разбор решения -->
              <div class="mb-3">
                <button type="button" class="btn-open-solution btn-neon-emerald w-full py-2.5 px-3 text-xs rounded-lg flex items-center justify-center gap-1.5 transition font-bold shadow-neon-emerald" title="Посмотреть пошаговое решение и теоретический разбор">
                  <span class="text-xs">🔍</span>
                  <span>Подробный пошаговый разбор решения</span>
                  <span class="text-[10px] text-emerald-300">→</span>
                </button>
              </div>
            </div>

            <!-- Нижняя панель: позиция задания и кнопки управления -->
            <div class="flex items-center justify-between border-t border-slate-800 pt-3 mt-1 text-xs">
              <span class="text-xs text-slate-400 font-medium">Задание №${index + 1} (${task.points || 1} б.)</span>
            </div>
          </div>
        </div>
      `;
    }
    card.querySelectorAll('.btn-open-whiteboard').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof StudentBoard !== 'undefined') {
          StudentBoard.open(task, state.activeVariantView);
        }
      });
    });

    card.querySelector('.graph-click-area')?.addEventListener('click', () => {
      if (typeof StudentBoard !== 'undefined') {
        StudentBoard.open(task, state.activeVariantView);
      }
    });

    card.querySelector('.btn-open-solution')?.addEventListener('click', () => {
      openSolutionModal(task, state.activeVariantView);
    });

    // Обработка интерактивного краткого ответа
    if (isShortAnswer) {
      const inputEl = card.querySelector('.student-short-input');
      const checkBtn = card.querySelector('.btn-check-student-ans');
      const peekBtn = card.querySelector('.btn-peek-student-ans');
      const feedbackEl = card.querySelector('.answer-feedback-box');
      const peekBox = card.querySelector('.answer-peek-box');

      const performCheck = () => {
        const val = inputEl.value.trim();
        state.studentShortAnswers[answerKey] = val;
        state.saveState();

        const res = checkStudentAnswer(val, varData.shortAnswer || '', varData.answer || '');
        feedbackEl.classList.remove('hidden');
        if (res.isCorrect) {
          feedbackEl.className = 'answer-feedback-box mt-2 p-2.5 rounded-lg text-xs bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-medium shadow-neon-emerald animate-fade-in flex items-center gap-2';
          feedbackEl.innerHTML = `<span>✓</span> <strong>Верно!</strong> Задание решено правильно (+${task.points || 2} б.)`;
          inputEl.classList.remove('border-rose-500', 'border-slate-700');
          inputEl.classList.add('border-emerald-400', 'bg-emerald-950/30');
        } else {
          feedbackEl.className = 'answer-feedback-box mt-2 p-2.5 rounded-lg text-xs bg-rose-950/70 border border-rose-500/50 text-rose-300 font-medium shadow animate-fade-in flex items-center gap-2';
          feedbackEl.innerHTML = `<span>❌</span> ${res.message}`;
          inputEl.classList.remove('border-emerald-400', 'border-slate-700');
          inputEl.classList.add('border-rose-500', 'bg-rose-950/30');
        }
      };

      // Подключение математической экранной клавиатуры
      card.querySelectorAll('.btn-math-insert').forEach(mBtn => {
        mBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const insertVal = mBtn.dataset.val || '';
          const start = (inputEl.selectionStart !== null && inputEl.selectionStart !== undefined) ? inputEl.selectionStart : inputEl.value.length;
          const end = (inputEl.selectionEnd !== null && inputEl.selectionEnd !== undefined) ? inputEl.selectionEnd : inputEl.value.length;
          const oldVal = inputEl.value;
          inputEl.value = oldVal.substring(0, start) + insertVal + oldVal.substring(end);
          inputEl.focus();
          const newPos = start + insertVal.length;
          if (inputEl.setSelectionRange) inputEl.setSelectionRange(newPos, newPos);
          state.studentShortAnswers[answerKey] = inputEl.value;
          state.saveState();
        });
      });

      card.querySelectorAll('.btn-math-backspace').forEach(mBtn => {
        mBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const start = (inputEl.selectionStart !== null && inputEl.selectionStart !== undefined) ? inputEl.selectionStart : inputEl.value.length;
          const end = (inputEl.selectionEnd !== null && inputEl.selectionEnd !== undefined) ? inputEl.selectionEnd : inputEl.value.length;
          const oldVal = inputEl.value;
          if (start === end && start > 0) {
            inputEl.value = oldVal.substring(0, start - 1) + oldVal.substring(end);
            if (inputEl.setSelectionRange) inputEl.setSelectionRange(start - 1, start - 1);
          } else if (start !== end) {
            inputEl.value = oldVal.substring(0, start) + oldVal.substring(end);
            if (inputEl.setSelectionRange) inputEl.setSelectionRange(start, start);
          }
          inputEl.focus();
          state.studentShortAnswers[answerKey] = inputEl.value;
          state.saveState();
        });
      });

      card.querySelectorAll('.btn-math-clear').forEach(mBtn => {
        mBtn.addEventListener('click', (e) => {
          e.preventDefault();
          inputEl.value = '';
          inputEl.focus();
          state.studentShortAnswers[answerKey] = '';
          state.saveState();
        });
      });

      const toggleKbBtn = card.querySelector('.btn-toggle-extended-kb');
      const extKb = card.querySelector('.extended-math-keyboard');
      if (toggleKbBtn && extKb) {
        toggleKbBtn.addEventListener('click', (e) => {
          e.preventDefault();
          extKb.classList.toggle('hidden');
          if (!extKb.classList.contains('hidden')) {
            toggleKbBtn.classList.add('bg-amber-950/80', 'border-amber-400');
          } else {
            toggleKbBtn.classList.remove('bg-amber-950/80', 'border-amber-400');
          }
        });
      }

      checkBtn?.addEventListener('click', performCheck);
      inputEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performCheck();
        }
      });
      inputEl?.addEventListener('input', (e) => {
        state.studentShortAnswers[answerKey] = e.target.value;
      });

      peekBtn?.addEventListener('click', () => {
        peekBox.classList.toggle('hidden');
      });
    }

    card.querySelector('.btn-remove-task')?.addEventListener('click', () => removeTaskFromSelected(task.id));
    card.querySelector('.btn-edit-task')?.addEventListener('click', () => openEditTaskModal(task));

    listContainer.appendChild(card);
  });
}

function moveTask(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= state.selectedTaskIds.length) return;
  const temp = state.selectedTaskIds[index];
  state.selectedTaskIds[index] = state.selectedTaskIds[newIndex];
  state.selectedTaskIds[newIndex] = temp;
  state.saveState();
  renderBuilderTab();
}

function removeTaskFromSelected(taskId) {
  state.selectedTaskIds = state.selectedTaskIds.filter(id => id !== taskId);
  delete state.cardOverrides[taskId];
  state.saveState();
  renderBuilderTab();
  renderBuilderAnswersPanel();
  showToast('Задание удалено из работы', 'info');
}

/* ==================== БАНК ЗАДАНИЙ (ВЫСОКАЯ ПРОИЗВОДИТЕЛЬНОСТЬ) ==================== */
let bankFilters = {
  type: 'all',
  category: 'all',
  difficulty: 'all',
  searchQuery: ''
};
let bankVisibleCount = 18;
let searchDebounceTimer = null;

function initBankTab() {
  const typeSelect = document.getElementById('bank-type-filter');
  const categoryContainer = document.getElementById('bank-category-filters');
  const difficultySelect = document.getElementById('bank-difficulty-filter');
  const searchInput = document.getElementById('bank-search-input');
  const createNewBtn = document.getElementById('create-new-task-btn');

  if (typeSelect) {
    typeSelect.value = bankFilters.type;
    typeSelect.addEventListener('change', (e) => {
      bankFilters.type = e.target.value;
      bankVisibleCount = 18;
      renderBankList();
    });
  }

  // Мобильный селектор разделов (компактный и нативный)
  const mobileCatSelect = document.getElementById('bank-category-select-mobile');
  if (mobileCatSelect) {
    mobileCatSelect.innerHTML = '';
    TASK_CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      if (bankFilters.category === cat.id) opt.selected = true;
      mobileCatSelect.appendChild(opt);
    });
    mobileCatSelect.onchange = (e) => {
      bankFilters.category = e.target.value;
      bankVisibleCount = 18;
      initBankTab();
      renderBankList();
    };
  }

  if (categoryContainer) {
    categoryContainer.innerHTML = '';
    TASK_CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `category-filter-btn text-xs px-2.5 py-1 rounded-md border transition whitespace-nowrap ${
        bankFilters.category === cat.id
          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow-neon-cyan'
          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200 font-normal'
      }`;
      btn.textContent = cat.name;
      btn.addEventListener('click', () => {
        bankFilters.category = cat.id;
        bankVisibleCount = 18;
        initBankTab();
        renderBankList();
      });
      categoryContainer.appendChild(btn);
    });
  }

  if (difficultySelect) {
    difficultySelect.addEventListener('change', (e) => {
      bankFilters.difficulty = e.target.value;
      bankVisibleCount = 18;
      renderBankList();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        bankFilters.searchQuery = e.target.value.toLowerCase().trim();
        bankVisibleCount = 18;
        renderBankList();
      }, 150);
    });
  }

  if (createNewBtn) {
    createNewBtn.addEventListener('click', () => openNewTaskModal());
  }
}

function createBankCardElement(task) {
  const isSelected = state.selectedTaskIds.includes(task.id);
  const firstVar = task.variants[0];
  const isShort = (task.taskType === 'short_answer');

  // Кэшированный легковесный SVG без тяжелых фильтров
  const svgCode = GraphRenderer.renderSVG({
    ...firstVar.graphConfig,
    cacheKey: `bank_prev_${task.id}_v0`,
    width: 280,
    height: 200,
    theme: 'neon',
    animated: false,
    samplesCount: 120
  });

  const card = document.createElement('div');
  card.className = `card-neon p-4 transition flex flex-col justify-between ${
    isSelected ? 'border-cyan-400 ring-1 ring-cyan-500/40 shadow-neon-cyan' : ''
  }`;
  card.dataset.taskId = task.id;

    card.innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-2 flex-wrap gap-1">
        <div class="flex items-center gap-1.5">
          ${isShort
            ? `<span class="text-xs px-2 py-0.5 rounded font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/40">
                 📝 Краткий ответ
               </span>`
            : `<span class="text-xs px-2 py-0.5 rounded font-semibold bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-500/40">
                 ✏️ Построение
               </span>`
          }
          <span class="text-xs px-2 py-0.5 rounded font-semibold ${getDifficultyBadgeClass(task.difficulty)}">
            ${task.difficultyLabel || 'Базовый'}
          </span>
        </div>
        <span class="text-xs text-slate-400 font-medium">
          ${task.points || 1} б. · 4 варианта
        </span>
      </div>

      <h4 class="font-bold text-sm text-white mb-1">${task.title}</h4>
      <p class="text-xs text-slate-400 mb-3 line-clamp-2">${task.description || ''}</p>

      ${isShort
        ? `<div class="w-full bg-[#070b16] p-3 rounded-xl border border-amber-500/20 mb-3 flex flex-col justify-center min-h-[140px]">
             <div class="text-[11px] text-amber-400 font-semibold mb-1 flex items-center gap-1">
               <span>📋</span> Пример задания:
             </div>
             <div class="text-xs text-slate-200 font-sans line-clamp-3 leading-relaxed mb-2">
               ${escapeHtml(firstVar.question)}
             </div>
             <div class="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5 flex items-center gap-1">
               <span class="text-emerald-400 font-semibold">Ответ:</span>
               <span class="text-slate-200 font-mono font-bold">${escapeHtml(firstVar.answer)}</span>
             </div>
           </div>`
        : `<div class="w-full bg-[#070b16] p-1.5 rounded-xl border border-cyan-500/20 mb-3 flex justify-center overflow-hidden shadow-inner">
             ${svgCode}
           </div>`
      }
    </div>

    <div class="pt-3 border-t border-slate-800 flex flex-col gap-2">
      <div class="grid grid-cols-2 gap-2">
        ${isShort
          ? `<button type="button" class="btn-bank-open-task btn-neon-amber w-full py-1.5 px-2 text-xs rounded-lg transition flex items-center justify-center gap-1 font-semibold" title="Открыть карточку с полем для ответа">
               <span>📝 Решить (ответ)</span>
             </button>`
          : `<button type="button" class="btn-bank-whiteboard btn-neon-primary w-full py-1.5 px-2 text-xs rounded-lg transition flex items-center justify-center gap-1 font-semibold" title="Чертить график задания на интерактивной доске">
               <span>🎨 Чертить</span>
             </button>`
        }
        <button type="button" class="btn-view-solution btn-neon-emerald w-full py-1.5 px-2 text-xs rounded-lg transition flex items-center justify-center gap-1 font-semibold" title="Открыть подробный пошаговый разбор">
          <span>🔍 Решение</span>
        </button>
      </div>

      <div class="flex items-center justify-between mt-1 text-xs">
        <button type="button" class="btn-preview-task text-slate-400 hover:text-white transition">
          Варианты (1–4)
        </button>
        <button type="button" class="btn-toggle-select px-3 py-1 font-semibold rounded-lg transition ${
          isSelected
            ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
            : 'btn-neon-cyan'
        }">
          ${isSelected ? '✓ В работе' : '+ В работу'}
        </button>
      </div>
    </div>
  `;

  card.querySelector('.btn-bank-whiteboard')?.addEventListener('click', () => {
    if (typeof StudentBoard !== 'undefined') {
      StudentBoard.open(task, 1);
    }
  });

  card.querySelector('.btn-bank-open-task')?.addEventListener('click', () => {
    if (!state.selectedTaskIds.includes(task.id)) {
      state.selectedTaskIds.push(task.id);
      state.saveState();
    }
    switchTab('builder');
    setTimeout(() => {
      const targetCard = document.querySelector(`[data-task-id="${task.id}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.querySelector('.student-short-input')?.focus();
      }
    }, 100);
  });

  card.querySelector('.btn-view-solution')?.addEventListener('click', () => {
    openSolutionModal(task, 1);
  });

  // Быстрое переключение статуса карточки
  const selectBtn = card.querySelector('.btn-toggle-select');
  selectBtn.addEventListener('click', () => {
    const currentlySelected = state.selectedTaskIds.includes(task.id);
    if (currentlySelected) {
      state.selectedTaskIds = state.selectedTaskIds.filter(id => id !== task.id);
      delete state.cardOverrides[task.id];
      card.classList.remove('border-cyan-400', 'ring-1', 'ring-cyan-500/40', 'shadow-neon-cyan');
      selectBtn.className = 'btn-toggle-select px-3 py-1 font-semibold rounded-lg transition btn-neon-cyan';
      selectBtn.textContent = '+ В работу';
      showToast('Задание удалено из работы', 'info');
    } else {
      state.selectedTaskIds.push(task.id);
      card.classList.add('border-cyan-400', 'ring-1', 'ring-cyan-500/40', 'shadow-neon-cyan');
      selectBtn.className = 'btn-toggle-select px-3 py-1 font-semibold rounded-lg transition bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30';
      selectBtn.textContent = '✓ В работе';
      showToast('Задание добавлено в работу', 'success');
    }
    state.saveState();
    if (state.activeTab === 'builder') renderBuilderTab();
  });

  card.querySelector('.btn-preview-task').addEventListener('click', () => {
    openEditTaskModal(task, true);
  });

  return card;
}

function renderBankList() {
  const container = document.getElementById('bank-tasks-list');
  const countBadge = document.getElementById('bank-total-count');
  if (!container) return;

  const filtered = state.taskBank.filter(task => {
    if (bankFilters.type !== 'all' && task.taskType !== bankFilters.type) return false;
    if (bankFilters.category !== 'all' && task.category !== bankFilters.category) return false;
    if (bankFilters.difficulty !== 'all' && task.difficulty !== bankFilters.difficulty) return false;
    if (bankFilters.searchQuery) {
      const q = bankFilters.searchQuery;
      if (task._searchIndex) {
        if (!task._searchIndex.includes(q)) return false;
      } else {
        const text = `${task.title} ${task.description || ''} ${task.variants.map(v => v.question).join(' ')}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
    }
    return true;
  });

  if (countBadge) countBadge.textContent = `${filtered.length} из ${state.taskBank.length}`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
        <p class="text-sm text-slate-400">Ни одно задание не соответствует выбранным критериям поиска.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  const itemsToRender = filtered.slice(0, bankVisibleCount);
  const fragment = document.createDocumentFragment();

  itemsToRender.forEach(task => {
    fragment.appendChild(createBankCardElement(task));
  });

  container.appendChild(fragment);

  // Пагинация / динамическая подгрузка следующих заданий
  if (filtered.length > bankVisibleCount) {
    const loadMoreBox = document.createElement('div');
    loadMoreBox.id = 'bank-load-more-box';
    loadMoreBox.className = 'col-span-full py-5 flex flex-col sm:flex-row items-center justify-center gap-3 bg-slate-950/70 rounded-xl border border-slate-800 p-4 mt-2';
    loadMoreBox.innerHTML = `
      <span class="text-xs text-slate-400">Показано <strong class="text-cyan-400">${itemsToRender.length}</strong> из <strong>${filtered.length}</strong> заданий</span>
      <button type="button" id="bank-load-more-btn" class="btn-neon-cyan px-5 py-2 text-xs rounded-lg font-semibold flex items-center gap-1.5 shadow-neon-cyan">
        <span>⚡ Показать ещё 18 заданий</span>
      </button>
      <button type="button" id="bank-load-all-btn" class="text-xs text-slate-400 hover:text-cyan-300 px-3 py-1.5 underline transition">
        Показать все (${filtered.length})
      </button>
    `;
    container.appendChild(loadMoreBox);

    loadMoreBox.querySelector('#bank-load-more-btn').addEventListener('click', () => {
      const nextBatch = filtered.slice(bankVisibleCount, bankVisibleCount + 18);
      bankVisibleCount += 18;
      const frag = document.createDocumentFragment();
      nextBatch.forEach(t => frag.appendChild(createBankCardElement(t)));
      container.insertBefore(frag, loadMoreBox);

      const spanCount = loadMoreBox.querySelector('span');
      if (spanCount) {
        spanCount.innerHTML = `Показано <strong class="text-cyan-400">${Math.min(bankVisibleCount, filtered.length)}</strong> из <strong>${filtered.length}</strong> заданий`;
      }
      if (bankVisibleCount >= filtered.length) {
        loadMoreBox.remove();
      }
    });

    loadMoreBox.querySelector('#bank-load-all-btn').addEventListener('click', () => {
      const remaining = filtered.slice(bankVisibleCount);
      bankVisibleCount = filtered.length;
      const frag = document.createDocumentFragment();
      remaining.forEach(t => frag.appendChild(createBankCardElement(t)));
      container.insertBefore(frag, loadMoreBox);
      loadMoreBox.remove();
    });
  }
}

/* ==================== МОДАЛЬНОЕ ОКНО ПОДРОБНОГО РЕШЕНИЯ ==================== */
let currentSolutionTask = null;
let currentSolutionVariantNum = 1;
let currentSolutionHighlight = 'all';

function initSolutionModal() {
  const modal = document.getElementById('solution-modal');
  const closeTopBtn = document.getElementById('sol-modal-close');
  const closeBottomBtn = document.getElementById('sol-modal-close-btn');
  const reanimateBtn = document.getElementById('sol-reanimate-curve-btn');

  const close = () => {
    if (modal) modal.classList.add('hidden');
    currentSolutionTask = null;
  };

  if (closeTopBtn) closeTopBtn.addEventListener('click', close);
  if (closeBottomBtn) closeBottomBtn.addEventListener('click', close);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  // Кнопка плавной рисовки: всегда перезапускает анимацию с нулевого кадра
  if (reanimateBtn) {
    reanimateBtn.addEventListener('click', () => {
      currentSolutionHighlight = 'all';
      document.querySelectorAll('.sol-step-btn').forEach(b => {
        if (b.dataset.highlight === 'all') b.classList.add('step-button-active');
        else b.classList.remove('step-button-active');
      });

      // Полный и чистый перезапуск плавной отрисовки кривой
      renderSolutionGraph();
      showToast('▶ Запущена плавная рисовка графика (2.8 сек)', 'info');
    });
  }

  // Кнопки интерактивной подсветки на чертеже слева
  document.querySelectorAll('.sol-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sol-step-btn').forEach(b => b.classList.remove('step-button-active'));
      btn.classList.add('step-button-active');
      currentSolutionHighlight = btn.dataset.highlight;
      renderSolutionGraph();

      // Подсвечиваем соответствующий шаг в правой колонке
      document.querySelectorAll('.sol-step-card').forEach(c => {
        if (c.dataset.key === currentSolutionHighlight) {
          c.classList.add('border-cyan-400', 'bg-cyan-950/40', 'shadow-neon-cyan');
          c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          c.classList.remove('border-cyan-400', 'bg-cyan-950/40', 'shadow-neon-cyan');
        }
      });
    });
  });
}


function getFullSolutionSteps(task, varData, sol) {
  // 1. Если у задачи уже есть выверенные пошаговые выкладки (sol.steps) из базы — используем строго их!
  // Это исключает любую рассинхронизацию теории и пошагового разбора для всех 25 модулей курса!
  if (sol && sol.steps && Array.isArray(sol.steps) && sol.steps.length > 0) {
    const defaultKeys = ['coefficients', 'zeros', 'extrema', 'intervals', 'all'];
    return sol.steps.map((st, i) => ({
      ...st,
      visualKey: st.visualKey || defaultKeys[i % defaultKeys.length]
    }));
  }
  const cat = task.category || '';
  const pts = (varData.graphConfig && varData.graphConfig.points) ? varData.graphConfig.points : [];
  const fns = (varData.graphConfig && varData.graphConfig.functions) ? varData.graphConfig.functions : [];
  const primaryFn = fns[0] || { fn: 'f(x)', label: 'y = f(x)' };
  const fnFormula = primaryFn.label ? primaryFn.label.replace('y = ', '') : primaryFn.fn;

  const zeros = pts.filter(p => Math.abs(p.y) < 1e-4);
  const extrema = pts.filter(p => p.label && (p.label.includes('min') || p.label.includes('max') || p.label.includes('вершина') || p.label.includes('излом')));
  const yIntercept = pts.find(p => Math.abs(p.x) < 1e-4);

  const steps = [];

  // ==================== 1. ЛИНЕЙНАЯ ФУНКЦИЯ ====================
  if (cat === 'linear') {
    const kMatch = fnFormula.match(/(-?\d*\.?\d*)\s*\*?\s*x/);
    let k = 1;
    if (kMatch) {
      if (kMatch[1] === '-' || kMatch[1] === '') k = (kMatch[1] === '-') ? -1 : 1;
      else k = parseFloat(kMatch[1]);
    }
    const b = yIntercept ? yIntercept.y : 0;
    const x0 = zeros[0] ? zeros[0].x : (k !== 0 ? -b / k : 0);

    steps.push({
      stepNum: 1,
      title: 'Аналитический разбор формулы и коэффициентов',
      content: `1) Задана линейная функция: y = ${fnFormula}.
2) Общий канонический вид: y = kx + b, где:
   • Угловой коэффициент k = ${k}. Так как k ${k > 0 ? '> 0, функция строго возрастает' : '< 0, функция строго убывает'} на всей области определения. Угол наклона прямой к положительному направлению оси Ox: α = arctg(${k}) ${k > 0 ? '(острый)' : '(тупой)'}.
   • Свободный член b = ${b}. Задает ординату точки пересечения прямой с осью Oy.
3) Область определения D(f) = (-∞; +∞) — аргумент x принимает любые действительные значения.
4) Множество значений E(f) = (-∞; +∞).`,
      visualKey: 'coefficients'
    });

    steps.push({
      stepNum: 2,
      title: 'Нахождение точек пересечения с координатными осями Ox и Oy',
      content: `1) С осью ординат Oy:
   Полагаем x = 0: y = ${k}·(0) + (${b}) = ${b}.
   Точка пересечения с Oy: (0; ${b}).
2) С осью абсцисс Ox (нули функции f(x) = 0):
   Полагаем y = 0: ${k}x + (${b}) = 0.
   Переносим свободный член: ${k}x = ${-b}.
   Находим корень: x = ${-b} / ${k} = ${Number(x0.toFixed(2))}.
   Точка пересечения с Ox (нуль функции): (${Number(x0.toFixed(2))}; 0).`,
      visualKey: 'zeros'
    });

    steps.push({
      stepNum: 3,
      title: 'Характер монотонности и экстремумы',
      content: `1) Производная линейной функции: y' = (${fnFormula})' = ${k}.
2) Так как производная y' = ${k} = const ${k > 0 ? '> 0, функция строго возрастает на всей числовой оси x ∈ (-∞; +∞)' : '< 0, функция строго убывает на всей числовой оси x ∈ (-∞; +∞)'}.
3) Производная не обращается в ноль, поэтому функция не имеет локальных экстремумов (точек максимума и минимума).
4) График представляет собой непрерывную бесконечную прямую линию.`,
      visualKey: 'extrema'
    });

    steps.push({
      stepNum: 4,
      title: 'Промежутки знакопостоянства функции f(x)',
      content: `Нуль функции x = ${Number(x0.toFixed(2))} делит ось Ox на два полуинтервала:
• f(x) > 0 (график строго выше оси Ox): при x ∈ ${k > 0 ? `(${Number(x0.toFixed(2))}; +∞)` : `(-∞; ${Number(x0.toFixed(2))})`}.
• f(x) < 0 (график строго ниже оси Ox): при x ∈ ${k > 0 ? `(-∞; ${Number(x0.toFixed(2))})` : `(${Number(x0.toFixed(2))}; +∞)`}.`,
      visualKey: 'intervals'
    });

    const ptsTable = [-2, -1, 0, 1, 2].map(x => ({ x, y: Number((k * x + b).toFixed(2)) }));
    steps.push({
      stepNum: 5,
      title: 'Расчетная таблица контрольных точек и алгоритм чертежа',
      content: `Контрольные точки для построения прямой:
x : ${ptsTable.map(p => String(p.x).padStart(5)).join(' | ')}
y : ${ptsTable.map(p => String(p.y).padStart(5)).join(' | ')}

Алгоритм построения на миллиметровке/доске:
1) Нанесите базовые точки: пересечение с Oy (0; ${b}) и нуль (${Number(x0.toFixed(2))}; 0).
2) Отложите контрольные точки из таблицы для верификации наклона.
3) По линейке проведите прямую линию через все точки.`,
      visualKey: 'all'
    });

    return steps;
  }

  // ==================== 2. КВАДРАТИЧНАЯ ПАРАБОЛА ====================
  if (cat === 'quadratic') {
    const vPt = extrema[0] || { x: 0, y: -4 };
    const vx = Number(vPt.x.toFixed(2));
    const vy = Number(vPt.y.toFixed(2));
    const yInt = yIntercept ? yIntercept.y : vy;
    const a = (vx !== 0) ? (yInt - vy) / (vx * vx) : (vy < 0 ? 1 : -1);
    const z1 = zeros[0] ? Number(zeros[0].x.toFixed(2)) : (vy <= 0 ? Number((vx - Math.sqrt(Math.abs(vy))).toFixed(2)) : null);
    const z2 = zeros[1] ? Number(zeros[1].x.toFixed(2)) : (vy <= 0 ? Number((vx + Math.sqrt(Math.abs(vy))).toFixed(2)) : null);

    steps.push({
      stepNum: 1,
      title: 'Аналитический разбор квадратного трехчлена',
      content: `1) Задана квадратичная функция: y = ${fnFormula}.
2) Общий канонический вид: y = ax² + bx + c.
   • Старший коэффициент a ${a > 0 ? '> 0 — ветви параболы направлены строго ВВЕРХ' : '< 0 — ветви параболы направлены строго ВНИЗ'}.
   • Свободный член c = ${yInt} — ордината точки пересечения с осью Oy.
3) Область определения: D(f) = (-∞; +∞).
4) Множество значений: E(f) = ${a > 0 ? `[${vy}; +∞)` : `(-∞; ${vy}]`}. Экстремальное значение функции в вершине: y_верш = ${vy}.`,
      visualKey: 'coefficients'
    });

    steps.push({
      stepNum: 2,
      title: 'Пересечения с осями координат (нули параболы)',
      content: `1) Пересечение с осью Oy:
   Подставляем x = 0: y = f(0) = ${yInt}. Точка: (0; ${yInt}).
2) Пересечение с осью Ox (решение уравнения ax² + bx + c = 0):
   ${(z1 !== null && z2 !== null) ?
     `Дискриминант D > 0, уравнение имеет 2 действительных корня:
   x₁ = ${z1}, x₂ = ${z2}.
   Координаты нулей параболы: (${z1}; 0) и (${z2}; 0).` :
     `Дискриминант D < 0, действительных корней нет. Парабола не пересекает ось Ox.`}`,
      visualKey: 'zeros'
    });

    steps.push({
      stepNum: 3,
      title: 'Вершина параболы, ось симметрии и монотонность',
      content: `1) Координаты вершины параболы (x₀; y₀):
   x₀ = -b / (2a) = ${vx};
   y₀ = f(x₀) = ${vy}.
   Вершина параболы находится в точке: (${vx}; ${vy}).
2) Ось симметрии параболы: вертикальная прямая x = ${vx}.
3) Интервалы монотонности:
   • ${a > 0 ? `Функция строго убывает на промежутке (-∞; ${vx}] и строго возрастает на промежутке [${vx}; +∞).` :
               `Функция строго возрастает на промежутке (-∞; ${vx}] и строго убывает на промежутке [${vx}; +∞).`}
   • Точка x = ${vx} является точкой ${a > 0 ? 'локального минимума' : 'локального максимума'}.`,
      visualKey: 'extrema'
    });

    steps.push({
      stepNum: 4,
      title: 'Промежутки знакопостоянства (f(x) > 0 и f(x) < 0)',
      content: (z1 !== null && z2 !== null) ?
        `Границы смены знака — нули параболы x = ${Math.min(z1, z2)} и x = ${Math.max(z1, z2)}:
• f(x) > 0 (выше оси Ox): при x ∈ ${a > 0 ? `(-∞; ${Math.min(z1, z2)}) ∪ (${Math.max(z1, z2)}; +∞)` : `(${Math.min(z1, z2)}; ${Math.max(z1, z2)})`}.
• f(x) < 0 (ниже оси Ox): при x ∈ ${a > 0 ? `(${Math.min(z1, z2)}; ${Math.max(z1, z2)})` : `(-∞; ${Math.min(z1, z2)}) ∪ (${Math.max(z1, z2)}; +∞)`}.` :
        `Парабола расположена целиком по одну сторону от оси Ox:
• ${a > 0 ? 'f(x) > 0 на всей числовой оси x ∈ (-∞; +∞)' : 'f(x) < 0 на всей числовой оси x ∈ (-∞; +∞)'}.`,
      visualKey: 'intervals'
    });

    const ptsTable = [-3, -2, -1, 0, 1, 2, 3].map(dx => {
      const x = Number((vx + dx).toFixed(1));
      const y = Number((vy + (a || 1) * dx * dx).toFixed(2));
      return { x, y };
    });
    steps.push({
      stepNum: 5,
      title: 'Расчетная таблица симметричных точек и чертеж',
      content: `Симметричная таблица контрольных точек вокруг вершины (${vx}; ${vy}):
x : ${ptsTable.map(p => String(p.x).padStart(5)).join(' | ')}
y : ${ptsTable.map(p => String(p.y).padStart(5)).join(' | ')}

Правила построения параболы:
1) Нанесите вершину (${vx}; ${vy}) и пунктирную ось симметрии x = ${vx}.
2) Отметьте нули на оси Ox и точку (0; ${yInt}) на оси Oy.
3) Нанесите симметричные пары точек по таблице.
4) Соедините точки плавной дугообразной кривой без изломов.`,
      visualKey: 'all'
    });

    return steps;
  }

  // ==================== 3. ДРОБНО-ЛИНЕЙНАЯ (ГИПЕРБОЛА) ====================
  if (cat === 'rational') {
    steps.push({
      stepNum: 1,
      title: 'Асимптоты и область определения гиперболы',
      content: `1) Задана дробно-линейная функция: y = ${fnFormula}.
2) Знаменатель дроби не может равняться нулю:
   Область определения: D(f) = (-∞; 0) ∪ (0; +∞) (или x ≠ x₀).
3) Асимптоты гиперболы:
   • Вертикальная асимптота: прямая x = 0 (линия разрыва II рода).
   • Горизонтальная асимптота: прямая y = 0 (предел при x → ±∞).
4) Множество значений: E(f) = (-∞; 0) ∪ (0; +∞).`,
      visualKey: 'coefficients'
    });

    steps.push({
      stepNum: 2,
      title: 'Пересечение с координатными осями и нули',
      content: `1) Так как точка x = 0 исключена из области определения, график НЕ пересекает ось Oy (ось Oy является вертикальной асимптотой).
2) Числитель дроби отличен от нуля, поэтому уравнение y = 0 не имеет решений — пересечений с осью Ox нет.
3) График состоит из двух отдельных непересекающихся ветвей, стремящихся к асимптотам.`,
      visualKey: 'zeros'
    });

    steps.push({
      stepNum: 3,
      title: 'Расположение ветвей по четвертям и монотонность',
      content: `1) Знак коэффициента пропорциональности k:
   Ветви расположены в I и III четвертях (при k > 0) либо во II и IV четвертях (при k < 0).
2) Характер монотонности:
   Функция строго монотонна на каждом луче в отдельности: убывает на (-∞; 0) и убывает на (0; +∞).
3) Экстремумов нет. Центр симметрии гиперболы — точка (0; 0).`,
      visualKey: 'extrema'
    });

    steps.push({
      stepNum: 4,
      title: 'Промежутки знакопостоянства ветвей гиперболы',
      content: `Знак функции определяется знаком аргумента x:
• f(x) > 0: при x ∈ (0; +∞) (правая ветвь выше оси Ox).
• f(x) < 0: при x ∈ (-∞; 0) (левая ветвь ниже оси Ox).`,
      visualKey: 'intervals'
    });

    steps.push({
      stepNum: 5,
      title: 'Расчетная таблица точек и правила черчения',
      content: `Контрольные точки для вычерчивания обеих ветвей:
Левая ветвь (x < 0):   x = -4, -2, -1, -0.5
Правая ветвь (x > 0):  x = 0.5, 1, 2, 4

Построение:
1) Проведите штриховыми линиями вертикальную и горизонтальную асимптоты.
2) Отложите расчетные точки для каждой ветви.
3) Соедините точки гладкими гиперболическими кривыми, прижимая концы к асимптотам.`,
      visualKey: 'all'
    });

    return steps;
  }

  // ==================== 4. МОДУЛЬ: УГОЛОК |x - x₀| ====================
  if (cat === 'abs' || cat === 'abs_parabola') {
    const ext = extrema[0] || { x: 0, y: 0 };
    const x0 = Number(ext.x.toFixed(2));
    const y0 = Number(ext.y.toFixed(2));

    steps.push({
      stepNum: 1,
      title: 'Определение модуля и аналитическое раскрытие',
      content: `1) Задана функция с модулем: y = ${fnFormula}.
2) По определению абсолютной величины:
   |x - ${x0}| = (x - ${x0}) при x ≥ ${x0}, и -(x - ${x0}) при x < ${x0}.
3) График представляет собой ломаную линию («уголок»), состоящую из двух полупрямых, сходящихся в точке излома.
4) Область определения D(f) = (-∞; +∞). Множество значений E(f) = [${y0}; +∞).`,
      visualKey: 'coefficients'
    });

    steps.push({
      stepNum: 2,
      title: 'Точки пересечения с координатными осями',
      content: `1) С осью Oy: полагаем x = 0, получаем y = f(0) = ${yIntercept ? yIntercept.y : Math.abs(x0)}. Точка: (0; ${yIntercept ? yIntercept.y : Math.abs(x0)}).
2) С осью Ox (нули функции):
   ${zeros.length > 0 ? `Нули функции: ${zeros.map(z => `x = ${z.x.toFixed(2)}`).join(', ')}. Точки пересечения с Ox: ${zeros.map(z => `(${z.x.toFixed(2)}; 0)`).join(', ')}.` : `График не пересекает ось Ox (расположен строго выше).`}`,
      visualKey: 'zeros'
    });

    steps.push({
      stepNum: 3,
      title: 'Вершина излома и характер монотонности лучей',
      content: `1) Точка излома графика (вершина уголка): (${x0}; ${y0}).
2) Ось симметрии графика: вертикальная прямая x = ${x0}.
3) Монотонность:
   • Функция строго убывает на промежутке (-∞; ${x0}].
   • Функция строго возрастает на промежутке [${x0}; +∞).
4) В точке x = ${x0} достигается абсолютный глобальный минимум функции y_min = ${y0}.`,
      visualKey: 'extrema'
    });

    steps.push({
      stepNum: 4,
      title: 'Промежутки знакопостоянства',
      content: zeros.length > 0
        ? `f(x) > 0 на полуинтервалах вне нулей; f(x) < 0 между нулями (если есть отрицательная часть).`
        : `Так как y_min = ${y0} ≥ 0, функция f(x) ≥ 0 при всех x ∈ (-∞; +∞).`,
      visualKey: 'intervals'
    });

    steps.push({
      stepNum: 5,
      title: 'Расчетная таблица точек и чертеж уголка',
      content: `Точки левого луча (x ≤ ${x0}): x = ${x0 - 3}, ${x0 - 2}, ${x0 - 1}
Вершина излома: (${x0}; ${y0})
Точки правого луча (x ≥ ${x0}): x = ${x0 + 1}, ${x0 + 2}, ${x0 + 3}

Чертеж:
1) Нанесите вершину излома (${x0}; ${y0}).
2) Проведите симметричные лучи через расчетные точки под углом наклона.`,
      visualKey: 'all'
    });

    return steps;
  }

  // ==================== 5. КОРЕНЬ КВАДРАТНЫЙ √x ====================
  if (cat === 'sqrt') {
    const startPt = extrema[0] || pts[0] || { x: 0, y: 0 };
    const sx = Number(startPt.x.toFixed(2));
    const sy = Number(startPt.y.toFixed(2));

    steps.push({
      stepNum: 1,
      title: 'Область допустимых значений (ОДЗ) корня',
      content: `1) Задана функция квадратного корня: y = ${fnFormula}.
2) Подкоренное выражение обязано быть неотрицательным:
   x - ${sx} ≥ 0  =>  x ≥ ${sx}.
   Область определения: D(f) = [${sx}; +∞).
3) Арифметический корень неотрицателен, поэтому:
   Множество значений: E(f) = [${sy}; +∞).
4) График функции представляет собой верхнюю ветвь горизонтальной полупараболы.`,
      visualKey: 'coefficients'
    });

    steps.push({
      stepNum: 2,
      title: 'Начальная точка и нули функции',
      content: `1) Начальная граничная точка графика: (${sx}; ${sy}).
2) С осью Ox: при y = 0 корень равен нулю в точке x = ${sx}.
3) С осью Oy: пересечение возможно только если 0 входит в D(f) (при sx ≤ 0).`,
      visualKey: 'zeros'
    });

    steps.push({
      stepNum: 3,
      title: 'Монотонность и выпуклость полупараболы',
      content: `1) Производная: y' = 1 / (2√(x - ${sx})) > 0 при всех x > ${sx}.
2) Функция строго возрастает на всем полуинтервале [${sx}; +∞).
3) Скорость роста функции плавно замедляется с ростом x (график направлен выпуклостью вверх). Точек перегиба и локальных экстремумов нет.`,
      visualKey: 'extrema'
    });

    steps.push({
      stepNum: 4,
      title: 'Промежутки знакопостоянства',
      content: `Функция принимает неотрицательные значения на всей области определения:
• f(x) > 0 при x ∈ (${sx}; +∞).
• f(x) = 0 в начальной точке x = ${sx}.`,
      visualKey: 'intervals'
    });

    steps.push({
      stepNum: 5,
      title: 'Таблица точных квадратов и чертеж',
      content: `Подбираем значения x так, чтобы корень извлекался нацело:
x = ${sx}     => y = ${sy}
x = ${sx + 1} => y = ${sy + 1}
x = ${sx + 4} => y = ${sy + 2}
x = ${sx + 9} => y = ${sy + 3}

Чертеж:
1) Отметьте начальную точку (${sx}; ${sy}).
2) Нанесите точки с целыми значениями корней.
3) Соедините плавной выпуклой полупараболой, плавно уходящей вправо.`,
      visualKey: 'all'
    });

    return steps;
  }

  // ==================== 6. ПОКАЗАТЕЛЬНАЯ ФУНКЦИЯ (РОСТ / ЗАТУХАНИЕ) ====================
  if (cat === 'exp_growth' || cat === 'exp_decay') {
    const isGrowth = cat === 'exp_growth';
    steps.push({
      stepNum: 1,
      title: 'Свойства показательной функции и основание степени',
      content: `1) Задана показательная функция: y = ${fnFormula}.
2) Основание степени a:
   ${isGrowth ? 'Основание a > 1 — функция выражает экспоненциальный РОСТ.' : 'Основание 0 < a < 1 — функция выражает экспоненциальное ЗАТУХАНИЕ (убывание).'}
3) Область определения: D(f) = (-∞; +∞).
4) Множество значений: E(f) = (0; +∞) (показательная функция строго положительна).
5) Горизонтальная асимптота: прямая y = 0 (ось Ox).`,
      visualKey: 'coefficients'
    });

    steps.push({
      stepNum: 2,
      title: 'Точки пересечения с осями координат',
      content: `1) С осью Oy:
   Полагаем x = 0: y = a⁰ = 1. Точка пересечения: (0; 1).
2) С осью Ox:
   Уравнение aˣ = 0 не имеет действительных корней.
   График НЕ пересекает ось Ox, а асимптотически приближается к ней.`,
      visualKey: 'zeros'
    });

    steps.push({
      stepNum: 3,
      title: 'Монотонность и асимптотическое поведение',
      content: `1) Характер монотонности:
   ${isGrowth ? 'Функция строго возрастает на всей числовой оси x ∈ (-∞; +∞).' : 'Функция строго убывает на всей числовой оси x ∈ (-∞; +∞).'}
2) Пределы:
   ${isGrowth ? 'При x → -∞: y → 0 (прижимается к оси Ox слева); при x → +∞: y → +∞ (лавинообразный рост).' :
                'При x → +∞: y → 0 (прижимается к оси Ox справа); при x → -∞: y → +∞.'}
3) Точек экстремума нет. График всюду гладкий и вогнутый вниз/вверх.`,
      visualKey: 'extrema'
    });

    steps.push({
      stepNum: 4,
      title: 'Знакопостоянство',
      content: `Так как aˣ > 0 при любых действительных x:
Функция f(x) > 0 на всем промежутке x ∈ (-∞; +∞). График целиком лежит в верхней полуплоскости.`,
      visualKey: 'intervals'
    });

    steps.push({
      stepNum: 5,
      title: 'Таблица степеней и построение экспоненты',
      content: `Контрольные точки:
x = -2 => y = ${isGrowth ? '0.25' : '4'}
x = -1 => y = ${isGrowth ? '0.5' : '2'}
x = 0  => y = 1 (базовая точка)
x = 1  => y = ${isGrowth ? '2' : '0.5'}
x = 2  => y = ${isGrowth ? '4' : '0.25'}

Построение:
1) Проведите штриховую горизонтальную асимптоту y = 0.
2) Отложите базовую точку (0; 1) и расчетные точки.
3) Постройте плавную экспоненциальную кривую.`,
      visualKey: 'all'
    });

    return steps;
  }

  // ==================== 7. ЛОГАРИФМИЧЕСКАЯ ФУНКЦИЯ ====================
  if (cat === 'log') {
    steps.push({
      stepNum: 1,
      title: 'ОДЗ логарифма и вертикальная асимптота',
      content: `1) Задана логарифмическая функция: y = ${fnFormula}.
2) Аргумент логарифма строго положителен:
   Область определения: D(f) = (0; +∞).
3) Множество значений: E(f) = (-∞; +∞).
4) Вертикальная асимптота: прямая x = 0 (ось Oy). График неограниченно приближается к оси Oy снизу.`,
      visualKey: 'coefficients'
    });

    steps.push({
      stepNum: 2,
      title: 'Нуль функции и пересечение с осями',
      content: `1) С осью Ox (нуль функции):
   Полагаем y = 0: log_a(x) = 0  =>  x = a⁰ = 1.
   Точка пересечения с осью Ox: (1; 0).
2) С осью Oy:
   График НЕ пересекает ось Oy, так как x = 0 не входит в область определения.`,
      visualKey: 'zeros'
    });

    steps.push({
      stepNum: 3,
      title: 'Характер монотонности',
      content: `1) Основание логарифма a > 1:
   Функция строго возрастает на всем интервале x ∈ (0; +∞).
2) Точек локального экстремума нет. Скорость роста плавно замедляется с ростом x.`,
      visualKey: 'extrema'
    });

    steps.push({
      stepNum: 4,
      title: 'Промежутки знакопостоянства',
      content: `Нуль функции x = 1 делит область определения на два промежутка:
• f(x) > 0: при x ∈ (1; +∞).
• f(x) < 0: при x ∈ (0; 1) (график расположен ниже оси Ox).`,
      visualKey: 'intervals'
    });

    steps.push({
      stepNum: 5,
      title: 'Таблица степеней логарифма и чертеж',
      content: `Контрольные точки:
x = 0.25 => y = -2
x = 0.5  => y = -1
x = 1    => y = 0 (нуль)
x = 2    => y = 1
x = 4    => y = 2

Построение:
1) Проведите вертикальную асимптоту x = 0.
2) Отметьте нуль (1; 0) и нанесите контрольные точки.
3) Проведите непрерывную гладкую кривую логарифма.`,
      visualKey: 'all'
    });

    return steps;
  }

  // ==================== 8. ТРИГОНОМЕТРИЯ (СИНУС, КОСИНУС, ТАНГЕНС) ====================
  if (cat.includes('trig')) {
    const isSin = cat === 'trig_sin';
    const isCos = cat === 'trig_cos';
    const isTan = cat === 'trig_tan';

    steps.push({
      stepNum: 1,
      title: 'Периодичность, амплитуда и область определения',
      content: `1) Задана тригонометрическая функция: y = ${fnFormula}.
2) Период функции:
   ${isTan ? 'Основной период тангенса T = π rad (≈ 3.14).' : 'Основной период синуса/косинуса T = 2π rad (≈ 6.28).'}
3) Область определения:
   ${isTan ? 'D(f) = все x ≠ π/2 + πk (линии разрыва / асимптоты).' : 'D(f) = (-∞; +∞).'}
4) Множество значений:
   ${isTan ? 'E(f) = (-∞; +∞).' : 'E(f) = [-1; 1] (или с учетом амплитуды [-A; A]).'}`,
      visualKey: 'coefficients'
    });

    steps.push({
      stepNum: 2,
      title: 'Пересечения с осями координат (нули тригонометрической функции)',
      content: `1) С осью Oy:
   Полагаем x = 0: y = ${isSin ? 'sin(0) = 0' : isCos ? 'cos(0) = 1' : 'tg(0) = 0'}.
2) С осью Ox (нули функции):
   ${isSin ? 'sin(x) = 0 => x = πk (..., -π, 0, π, 2π, ...).' :
     isCos ? 'cos(x) = 0 => x = π/2 + πk (..., -π/2, π/2, 3π/2, ...).' :
     'tg(x) = 0 => x = πk (..., -π, 0, π, ...).'}`,
      visualKey: 'zeros'
    });

    steps.push({
      stepNum: 3,
      title: 'Экстремумы и волновая монотонность',
      content: `1) Точки максимума:
   ${isSin ? 'y_max = 1 в точках x = π/2 + 2πk.' : isCos ? 'y_max = 1 в точках x = 2πk.' : 'Тангенс не имеет максимумов.'}
2) Точки минимума:
   ${isSin ? 'y_min = -1 в точках x = -π/2 + 2πk.' : isCos ? 'y_min = -1 в точках x = π + 2πk.' : 'Тангенс не имеет минимумов.'}
3) Монотонность:
   Функция периодически чередует интервалы возрастания и убывания.`,
      visualKey: 'extrema'
    });

    steps.push({
      stepNum: 4,
      title: 'Промежутки знакопостоянства',
      content: `Знаки функции чередуются на каждом полупериоде длины π:
• f(x) > 0 в верхней полуволне;
• f(x) < 0 в нижней полуволне.`,
      visualKey: 'intervals'
    });

    steps.push({
      stepNum: 5,
      title: 'Таблица опорных углов и чертеж волны',
      content: `Опорные значения аргумента (в радианах и долях π):
x = 0     => y = ${isSin ? 0 : isCos ? 1 : 0}
x = π/6   => y = ${isSin ? 0.5 : isCos ? 0.87 : 0.58}
x = π/2   => y = ${isSin ? 1 : isCos ? 0 : 'асимптота'}
x = π     => y = ${isSin ? 0 : isCos ? -1 : 0}

Построение:
1) Разметьте ось Ox с шагом π/2 (≈ 1.57 ед.).
2) Отметьте амплитудные вершины и нули.
3) Плавной синусоидальной волной соедините точки.`,
      visualKey: 'all'
    });

    return steps;
  }

  // ==================== 9. УНИВЕРСАЛЬНЫЙ ГЕНЕРАТОР ДЛЯ ОСТАЛЬНЫХ ТЕМ ====================
  if (task.taskType !== 'graph_construction') {
    steps.push({
      stepNum: 1,
      title: 'Анализ условия и исходных данных',
      content: `1) Условие задания: ${varData.question || task.title}\n2) Раздел: ${task.categoryName || 'Математика'}.\n3) Требуется найти: ${varData.shortAnswer || 'точное числовое значение'}.`,
      visualKey: 'all'
    });
    steps.push({
      stepNum: 2,
      title: 'Теоретическая основа и формулы',
      content: sol.theory ? `Применяемое правило:\n${sol.theory}` : 'Применение формул и математических свойств.',
      visualKey: 'all'
    });
    steps.push({
      stepNum: 3,
      title: 'Математические выкладки',
      content: `Выполняем преобразования и вычисления согласно теоретическим правилам раздела "${task.categoryName}".`,
      visualKey: 'all'
    });
    steps.push({
      stepNum: 4,
      title: 'Промежуточный результат',
      content: `Проверка ограничений и промежуточных вычислений: результат соответствует ОДЗ и условию задачи.`,
      visualKey: 'all'
    });
    steps.push({
      stepNum: 5,
      title: 'Итоговый эталонный ответ',
      content: `Ответ: ${varData.answer || varData.shortAnswer || 'Вычисление завершено'}.`,
      visualKey: 'all'
    });
    return steps;
  }
  // (Кубическая, четная 4-я степень, арктангенс, кусочные, графические уравнения)
  const zStr = zeros.length > 0
    ? zeros.map(z => `x = ${z.x.toFixed(2)}`).join(', ')
    : 'пересечений с осью Ox нет (действительных нулей нет)';
  const yStr = yIntercept
    ? `точка (0; ${yIntercept.y.toFixed(2)})`
    : 'вычисляется подстановкой x = 0 в формулу';

  steps.push({
    stepNum: 1,
    title: 'Аналитический разбор формулы и свойств функции',
    content: `1) Задана функция: y = ${fnFormula}.
2) Тематический раздел: ${task.categoryName || 'Функции и графики'}.
3) Аналитическое исследование:
   • Формула исследована на наличие математических ограничений (знаменатели, корни, логарифмические аргументы).
   • Область определения D(f) и область значений E(f) соответствуют естественным границам элементарных функций.`,
    visualKey: 'coefficients'
  });

  steps.push({
    stepNum: 2,
    title: 'Координаты точек пересечения с осями Ox и Oy',
    content: `1) С осью ординат Oy:
   Полагаем x = 0. Значение функции f(0) определяет ординату пересечения: ${yStr}.
2) С осью абсцисс Ox (нули функции):
   Полагаем y = 0. Решаем уравнение f(x) = 0.
   Найденные нули: ${zStr}.
   В этих точках график функции пересекает ось абсцисс Ox.`,
    visualKey: 'zeros'
  });

  if (extrema.length > 0) {
    const ext = extrema[0];
    steps.push({
      stepNum: 3,
      title: 'Опорная точка (вершина / экстремум) и монотонность',
      content: `1) Ключевая точка графика: (${ext.x.toFixed(2)}; ${ext.y.toFixed(2)}).
2) Характер точки: ${ext.label || 'вершина / точка перегиба'}.
3) При переходе через эту точку характер поведения кривой меняется (направление монотонности или выпуклость).`,
      visualKey: 'extrema'
    });
  } else {
    steps.push({
      stepNum: 3,
      title: 'Характер монотонности кривой',
      content: `1) Функция строго монотонна на всей своей области определения.
2) Локальных точек экстремума (максимумов или минимумов) график не имеет.`,
      visualKey: 'extrema'
    });
  }

  steps.push({
    stepNum: 4,
    title: 'Промежутки знакопостоянства функции f(x)',
    content: `1) Метод интервалов: нули функции разбивают область определения на промежутки знакопостоянства.
2) Интервалы f(x) > 0 соответствуют участкам графика выше оси Ox.
3) Интервалы f(x) < 0 соответствуют участкам графика ниже оси Ox.`,
    visualKey: 'intervals'
  });

  steps.push({
    stepNum: 5,
    title: 'Расчетная таблица контрольных точек и алгоритм чертежа',
    content: `1) Вычислите значения функции не менее чем в 5-7 контрольных точках.
2) Нанесите на координатную сетку оси с единичным отрезком, нули и ключевые точки.
3) Проведите непрерывную линию графика, строго соблюдая кривизну функции.`,
    visualKey: 'all'
  });

  return steps;
}


function openSolutionModal(task, variantNum = 1) {
  currentSolutionTask = task;
  currentSolutionVariantNum = variantNum;
  currentSolutionHighlight = 'all';

  const modal = document.getElementById('solution-modal');
  if (!modal) return;

  const varData = task.variants[(variantNum - 1) % task.variants.length];
  const sol = varData.detailedSolution || {
    theory: 'Применение общих теорем и свойств элементарных функций.',
    steps: [],
    commonMistakes: ['Невнимательность при вычислении знаков коэффициентов.'],
    rubric: [{ item: 'Полное правильное решение', points: `${task.points || 1} б.` }]
  };

  document.getElementById('sol-modal-title').textContent = task.title;
  document.getElementById('sol-modal-subtitle').textContent = `Тема: ${task.categoryName || 'Математика'} • Сложность: ${task.difficultyLabel || 'Базовый'} • Баллы: ${task.points || 1}`;
  document.getElementById('sol-modal-variant-badge').textContent = `Вариант № ${variantNum}`;

  document.getElementById('sol-task-question').textContent = varData.question;
  document.getElementById('sol-theory-box').textContent = sol.theory || 'Исследование свойств элементарной функции.';
  document.getElementById('sol-final-answer').textContent = varData.answer;

  // Ошибки
  const mistakesList = document.getElementById('sol-mistakes-list');
  mistakesList.innerHTML = '';
  (sol.commonMistakes || []).forEach(m => {
    const li = document.createElement('li');
    li.textContent = m;
    mistakesList.appendChild(li);
  });

  // Критерии
  const rubricContainer = document.getElementById('sol-rubric-container');
  rubricContainer.innerHTML = '';
  (sol.rubric || []).forEach(r => {
    const row = document.createElement('div');
    row.className = 'flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs';
    row.innerHTML = `
      <span class="text-slate-300 font-medium">${escapeHtml(r.item)}</span>
      <span class="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] border border-emerald-500/30">${escapeHtml(r.points)}</span>
    `;
    rubricContainer.appendChild(row);
  });

  const isGraphTask = (task.taskType === 'graph_construction');
  const leftCol = document.getElementById('sol-left-col');
  const rightCol = document.getElementById('sol-right-col');

  // АДАПТИВНАЯ НАСТРОЙКА МОДАЛКИ:
  // Если задание НЕ на график (уравнения, степени, логарифмы, производные, стереометрия) ->
  // ЛЕВАЯ КОЛОНКА С ГРАФИКОМ, ПОДСВЕТКАМИ И АНИМАЦИЕЙ ПОЛНОСТЬЮ СКРЫВАЕТСЯ (style.display = 'none')!
  if (leftCol && rightCol) {
    if (isGraphTask) {
      leftCol.classList.remove('hidden');
      leftCol.style.display = 'flex';
      leftCol.className = 'col-span-1 lg:col-span-5 flex flex-col items-center space-y-3';
      rightCol.className = 'col-span-1 lg:col-span-7 space-y-4';
      renderSolutionGraph();
    } else {
      leftCol.classList.add('hidden');
      leftCol.style.display = 'none';
      rightCol.className = 'col-span-1 lg:col-span-12 space-y-4';
    }
  }

  // Получаем шаги решения:
  // ВСЕГДА берем реальные пошаговые выкладки из базы задачи (sol.steps), идеально согласованные с теорией!
  const stepsContainer = document.getElementById('sol-steps-container');
  stepsContainer.innerHTML = '';
  
  let steps = [];
  if (sol && sol.steps && Array.isArray(sol.steps) && sol.steps.length > 0) {
    const defaultKeys = ['coefficients', 'zeros', 'extrema', 'intervals', 'all'];
    steps = sol.steps.map((st, i) => ({
      ...st,
      visualKey: st.visualKey || defaultKeys[i % defaultKeys.length]
    }));
  } else {
    steps = getFullSolutionSteps(task, varData, sol);
  }

  steps.forEach((st, idx) => {
    const stepEl = document.createElement('div');
    stepEl.className = 'sol-step-card p-3.5 card-neon transition text-xs rounded-xl border border-slate-800/80 mb-2.5' + (isGraphTask ? ' hover:border-cyan-400 cursor-pointer' : '');
    stepEl.dataset.key = st.visualKey || 'all';
    stepEl.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="font-bold text-cyan-300 flex items-center gap-1.5">
          <span>Шаг ${st.stepNum || (idx + 1)}:</span>
          <span>${escapeHtml(st.title)}</span>
        </span>
        ${isGraphTask ? '<span class="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">нажмите для подсветки</span>' : ''}
      </div>
      <div class="text-slate-200 leading-relaxed whitespace-pre-line font-sans text-xs sm:text-sm">
        ${escapeHtml(st.content)}
      </div>
    `;

    if (isGraphTask) {
      stepEl.addEventListener('click', () => {
        currentSolutionHighlight = st.visualKey || 'all';
        renderSolutionGraph();

        // Подсветка карточки шага
        document.querySelectorAll('.sol-step-card').forEach(c => c.classList.remove('border-cyan-400', 'bg-cyan-950/40', 'shadow-neon-cyan'));
        stepEl.classList.add('border-cyan-400', 'bg-cyan-950/40', 'shadow-neon-cyan');

        // Подсветка кнопки в левой панели
        document.querySelectorAll('.sol-step-btn').forEach(b => {
          if (b.dataset.highlight === currentSolutionHighlight) b.classList.add('step-button-active');
          else b.classList.remove('step-button-active');
        });
      });
    }

    stepsContainer.appendChild(stepEl);
  });

  // Активная кнопка по умолчанию (только для графиков)
  if (isGraphTask) {
    document.querySelectorAll('.sol-step-btn').forEach(b => {
      if (b.dataset.highlight === 'all') b.classList.add('step-button-active');
      else b.classList.remove('step-button-active');
    });
  }

  modal.classList.remove('hidden');
}

function renderSolutionGraph() {
  const box = document.getElementById('sol-graph-box');
  if (!box || !currentSolutionTask) return;

  const varData = currentSolutionTask.variants[(currentSolutionVariantNum - 1) % currentSolutionTask.variants.length];
  
  const svg = GraphRenderer.renderSVG({
    ...varData.graphConfig,
    width: 330,
    height: 250,
    theme: 'neon',
    animated: true,
    highlightStep: currentSolutionHighlight
  });

  box.innerHTML = svg;
}

/* ==================== СОЗДАНИЕ / РЕДАКТИРОВАНИЕ ЗАДАНИЯ ==================== */
let currentEditingTask = null;

function initTaskModal() {
  const modal = document.getElementById('task-modal');
  const closeBtn = document.getElementById('task-modal-close');
  const cancelBtn = document.getElementById('task-modal-cancel');
  const saveBtn = document.getElementById('task-modal-save');

  const close = () => {
    if (modal) modal.classList.add('hidden');
    currentEditingTask = null;
  };

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (saveBtn) saveBtn.addEventListener('click', saveTaskFromModal);
}

function openNewTaskModal() {
  currentEditingTask = {
    id: 'custom-' + Date.now(),
    category: 'properties',
    categoryName: 'Свойства функций по графикам',
    difficulty: 'basic',
    difficultyLabel: 'Базовый',
    points: 3,
    title: 'Исследование функции по графику',
    description: 'Пользовательское задание',
    variants: [
      {
        variantNum: 1,
        question: 'По графику функции y = f(x) найдите:\n1) D(f) и E(f);\n2) Нули функции;\n3) Промежутки знакопостоянства.',
        graphConfig: {
          xMin: -5, xMax: 5, yMin: -4, yMax: 5, stepX: 1, stepY: 1,
          functions: [{ fn: 'x^2 - 4', color: '#2563eb', width: 2.5, label: 'y = f(x)' }],
          points: [{ x: 0, y: -4, label: '(0; -4)', color: '#dc2626', dashedLines: true }]
        },
        answer: '1) D(f) = R, E(f) = [-4; +∞);\n2) x = -2, x = 2;\n3) f(x) > 0 при x ∈ (-∞; -2) ∪ (2; +∞).',
        solution: 'Вершина в (0; -4). Нули: x = ±2.',
        detailedSolution: {
          theory: 'Анализ параболы и ее нулей.',
          steps: [
            { stepNum: 1, title: 'Область определения', content: 'D(f) = R, E(f) = [-4; +∞).', visualKey: 'domain' },
            { stepNum: 2, title: 'Нули функции', content: 'Пересечения с Ox в точках x = -2 и x = 2.', visualKey: 'zeros' }
          ],
          commonMistakes: ['Путаница круглых скобок в промежутках.'],
          rubric: [{ item: 'D и E', points: '1 балл' }, { item: 'Нули функции', points: '1 балл' }, { item: 'Знакопостоянство', points: '1 балл' }]
        }
      }
    ]
  };
  populateTaskModal(currentEditingTask);
}

function openNewTaskModalWithGraph(graphConfig) {
  currentEditingTask = {
    id: 'custom-' + Date.now(),
    category: 'properties',
    categoryName: 'График из лаборатории',
    difficulty: 'medium',
    difficultyLabel: 'Средний',
    points: 3,
    title: 'Исследование графика функции',
    description: 'Задание создано на основе графика из лаборатории',
    variants: [
      {
        variantNum: 1,
        question: 'По приведенному графику ответьте на вопросы:\n1) Укажите область определения и область значений;\n2) Найдите нули функции;\n3) Запишите промежутки знакопостоянства.',
        graphConfig: JSON.parse(JSON.stringify(graphConfig)),
        answer: 'Ответ на основе построенного чертежа...',
        solution: 'Подробное решение...'
      }
    ]
  };
  populateTaskModal(currentEditingTask);
}

function openEditTaskModal(task, readOnlyMode = false) {
  currentEditingTask = JSON.parse(JSON.stringify(task));
  populateTaskModal(currentEditingTask);
}

function populateTaskModal(task) {
  const modal = document.getElementById('task-modal');
  if (!modal) return;

  document.getElementById('modal-task-title').value = task.title || '';
  document.getElementById('modal-task-category').value = task.category || 'properties';
  document.getElementById('modal-task-difficulty').value = task.difficulty || 'medium';
  document.getElementById('modal-task-points').value = task.points || 3;

  const v1 = task.variants[0] || {};
  document.getElementById('modal-v1-question').value = v1.question || '';
  document.getElementById('modal-v1-answer').value = v1.answer || '';
  document.getElementById('modal-v1-solution').value = v1.solution || '';

  const fnStr = (v1.graphConfig && v1.graphConfig.functions && v1.graphConfig.functions[0]) 
    ? v1.graphConfig.functions[0].fn 
    : 'x^2 - 4';
  document.getElementById('modal-v1-fn').value = fnStr;

  updateModalGraphPreview();
  document.getElementById('modal-v1-fn').oninput = updateModalGraphPreview;

  modal.classList.remove('hidden');
}

function updateModalGraphPreview() {
  const preview = document.getElementById('modal-graph-preview');
  const fnStr = document.getElementById('modal-v1-fn').value;
  if (!preview) return;

  try {
    const svg = GraphRenderer.renderSVG({
      width: 260,
      height: 190,
      xMin: -5, xMax: 5, yMin: -4, yMax: 5,
      functions: [{ fn: fnStr || 'x', color: '#2563eb', width: 2.5 }],
      theme: state.currentTheme === 'dark' ? 'dark' : 'notebook',
      animated: true
    });
    preview.innerHTML = svg;
  } catch (e) {
    preview.innerHTML = '<span class="text-xs text-red-500">Ошибка формулы</span>';
  }
}

function saveTaskFromModal() {
  if (!currentEditingTask) return;

  const title = document.getElementById('modal-task-title').value.trim();
  if (!title) {
    alert('Пожалуйста, введите название задания');
    return;
  }

  currentEditingTask.title = title;
  currentEditingTask.category = document.getElementById('modal-task-category').value;
  const catObj = TASK_CATEGORIES.find(c => c.id === currentEditingTask.category);
  currentEditingTask.categoryName = catObj ? catObj.name : 'Математика';
  currentEditingTask.difficulty = document.getElementById('modal-task-difficulty').value;
  currentEditingTask.difficultyLabel = currentEditingTask.difficulty === 'basic' ? 'Базовый' : currentEditingTask.difficulty === 'hard' ? 'Повышенный' : 'Средний';
  currentEditingTask.points = parseInt(document.getElementById('modal-task-points').value) || 3;

  const fnStr = document.getElementById('modal-v1-fn').value.trim();
  const question = document.getElementById('modal-v1-question').value.trim();
  const answer = document.getElementById('modal-v1-answer').value.trim();
  const solution = document.getElementById('modal-v1-solution').value.trim();

  if (!currentEditingTask.variants || currentEditingTask.variants.length === 0) {
    currentEditingTask.variants = [{ variantNum: 1 }];
  }

  currentEditingTask.variants[0].question = question;
  currentEditingTask.variants[0].answer = answer;
  currentEditingTask.variants[0].solution = solution;
  currentEditingTask.variants[0].graphConfig = {
    xMin: -5, xMax: 5, yMin: -4, yMax: 5, stepX: 1, stepY: 1,
    functions: [{ fn: fnStr, color: '#2563eb', width: 2.5, label: 'y = f(x)' }]
  };

  if (currentEditingTask.variants.length < 2) {
    currentEditingTask.variants.push(JSON.parse(JSON.stringify(currentEditingTask.variants[0])));
    currentEditingTask.variants[1].variantNum = 2;
  }

  const existingIndex = state.taskBank.findIndex(t => t.id === currentEditingTask.id);
  if (existingIndex >= 0) {
    state.taskBank[existingIndex] = currentEditingTask;
  } else {
    state.taskBank.unshift(currentEditingTask);
    state.selectedTaskIds.push(currentEditingTask.id);
  }

  state.saveState();
  document.getElementById('task-modal').classList.add('hidden');
  renderCurrentTab();
  showToast('Задание успешно сохранено!', 'success');
}

function downloadSVG(svgString, fileName = 'graph.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Файл ${fileName} сохранен`, 'success');
}

function getDifficultyBadgeClass(diff) {
  switch (diff) {
    case 'basic':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40';
    case 'hard':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40';
    case 'medium':
    default:
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-slate-900 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white';
  toast.className = `fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-md z-50 text-xs font-medium px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 transform transition-all duration-200 translate-y-2 opacity-0 ${bg} border border-slate-700/50`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 250);
  }, 2400);
}
