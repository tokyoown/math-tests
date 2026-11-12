/**
 * Главный контроллер веб-приложения "ГрафМастер СПО"
 * Управление состоянием, конструктор вариантов, банк заданий, лаборатория графиков,
 * динамическая анимация и модальное окно подробного пошагового решения.
 */

class AppState {
  constructor() {
    this.storageKey = 'grafmaster_spo_data_v5';
    this.themeKey = 'grafmaster_theme';
    
    this.loadState();
    
    this.activeTab = 'builder';
    this.variantCount = 2;
    this.activeVariantView = 1;
    this.currentTheme = 'dark';
    this.studentMode = false; // Режим студента: отображение чистых координатных сеток для самостоятельного черчения
    this.cardOverrides = {};
    this.studentDrawings = {};  // Локальные переопределения для конкретных карточек
  }

  loadState() {
    this.taskBank = JSON.parse(JSON.stringify(INITIAL_TASK_BANK));
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
          'linear-1', 'quad-1', 'rational-1', 'cubic-1',
          'sqrt-1', 'abs-1', 'exp-growth-1', 'trig-sin-1'
        ];
        this.workSettings = parsed.workSettings || this.getDefaultWorkSettings();
        this.studentDrawings = parsed.studentDrawings || {};
        return;
      } catch (e) {
        console.error('Ошибка загрузки сохраненных данных:', e);
      }
    }
    
    this.taskBank = JSON.parse(JSON.stringify(INITIAL_TASK_BANK));
    this.selectedTaskIds = [
      'linear-1', 'quad-1', 'rational-1', 'cubic-1',
      'sqrt-1', 'abs-1', 'exp-growth-1', 'trig-sin-1'
    ];
    this.workSettings = this.getDefaultWorkSettings();
  }

  getDefaultWorkSettings() {
    return {
      collegeName: 'ГБПОУ «Политехнический колледж»',
      subject: 'Математика',
      topic: 'Контрольная работа: Все графики функций (СПО 1 курс)',
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
        studentDrawings: this.studentDrawings || {}
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
    this.taskBank = JSON.parse(JSON.stringify(INITIAL_TASK_BANK));
    this.selectedTaskIds = [
      'linear-1', 'quad-1', 'rational-1', 'cubic-1',
      'sqrt-1', 'abs-1', 'exp-growth-1', 'trig-sin-1'
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
  const btn = document.getElementById('builder-mode-toggle-btn');
  const icon = document.getElementById('builder-mode-icon');
  const text = document.getElementById('builder-mode-text');
  if (!btn) return;

  btn.addEventListener('click', () => {
    state.studentMode = !state.studentMode;
    state.cardOverrides = {};
    if (state.studentMode) {
      if (icon) icon.textContent = '👁️';
      if (text) text.textContent = 'Режим учителя (с графиками)';
      btn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 transition flex items-center gap-1.5 shadow-neon-emerald';
      showToast('✏️ Включен режим студента: координатные сетки готовы к самостоятельному черчению', 'info');
    } else {
      if (icon) icon.textContent = '✏️';
      if (text) text.textContent = 'Режим черчения (сетка)';
      btn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 transition flex items-center gap-1.5 shadow-neon-cyan';
      showToast('👁️ Включен режим учителя: отображаются готовые эталонные графики', 'success');
    }
    renderBuilderTab();
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
      initVariantCountControls();
      renderBuilderTab();
      showToast(`Установлено вариантов: ${cnt}`, 'info');
    });
    container.appendChild(btn);
  });
}

/* ==================== ГЕНЕРАТОР ВАРИАНТОВ И ОТВЕТОВ ==================== */
function initGeneratorModal() {
  const modal = document.getElementById('generator-modal');
  if (!modal) return;

  const openBtns = [
    document.getElementById('open-generator-btn'),
    document.getElementById('builder-open-generator-btn')
  ].filter(Boolean);

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
  };

  const closeModal = () => {
    modal.classList.add('hidden');
  };

  openBtns.forEach(btn => {
    btn.addEventListener('click', openModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Выбор количества вариантов (2, 4, 10, 25)
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

  // Генерация работы и ключей ответов
  if (executeBtn) {
    executeBtn.addEventListener('click', () => {
      const taskCount = parseInt(taskCountSelect ? taskCountSelect.value : 4, 10) || 4;
      const includeAnswers = includeAnswersCheckbox ? includeAnswersCheckbox.checked : true;
      const includeSolutions = includeSolutionsCheckbox ? includeSolutionsCheckbox.checked : true;

      // Устанавливаем число вариантов
      state.variantCount = selectedGenCount;
      state.activeVariantView = 1;

      // Настройка листа ответов для преподавателя
      state.workSettings.showAnswersSheet = includeAnswers;
      state.workSettings.showCriteria = includeSolutions;

      // Балансировка тем по ВСЕМ 18 графикам функций для 1 курса СПО:
      const categoryKeys = [
        'linear', 'quadratic', 'rational', 'cubic', 'quartic', 'sqrt',
        'cbrt', 'abs', 'abs_parabola', 'exp_growth', 'exp_decay', 'log',
        'trig_sin', 'trig_cos', 'trig_tan', 'arctrig', 'piecewise', 'solve_graph'
      ];

      const chosenIds = [];
      // Отбираем по одному разноплановому заданию из каждой категории:
      for (let i = 0; i < taskCount && i < categoryKeys.length; i++) {
        const cat = categoryKeys[i];
        const catTasks = state.taskBank.filter(t => t.category === cat);
        if (catTasks.length > 0) {
          const randTask = catTasks[Math.floor(Math.random() * catTasks.length)];
          if (!chosenIds.includes(randTask.id)) {
            chosenIds.push(randTask.id);
          }
        }
      }

      // Если требуется больше заданий, дополняем случайными из оставшихся в банке:
      const remainingTasks = state.taskBank.filter(t => !chosenIds.includes(t.id));
      while (chosenIds.length < taskCount && remainingTasks.length > 0) {
        const randIdx = Math.floor(Math.random() * remainingTasks.length);
        chosenIds.push(remainingTasks.splice(randIdx, 1)[0].id);
      }

      state.selectedTaskIds = chosenIds;

      // Корректировка заголовка
      state.workSettings.topic = taskCount <= 3
        ? 'Самостоятельная работа: Базовые графики функций'
        : taskCount <= 6
        ? 'Контрольная работа: Исследование и построение графиков функций'
        : 'Итоговая зачетная работа: Все графики функций (СПО 1 курс)';

      state.workSettings.timeLimit = taskCount <= 3 ? '20 минут' : taskCount <= 6 ? '45 минут' : '90 минут';

      state.saveState();
      initVariantCountControls();
      closeModal();

      // ОСТАЕМСЯ В ИНТЕРАКТИВНОМ НЕОНОВОМ КОНСТРУКТОРЕ НА САЙТЕ!
      switchTab('builder');
      renderBuilderTab();
      renderBuilderAnswersPanel();
      showToast(`⚡ Сгенерировано: ${selectedGenCount} вариантов (${taskCount} заданий)! Переключайте варианты кнопками вверху.`, 'success');
    });
  }
}

/* ==================== ИНТЕРАКТИВНЫЕ ОТВЕТЫ И РЕШЕНИЯ В КОНСТРУКТОРЕ ==================== */
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

  const selectedTasks = state.selectedTaskIds
    .map(id => state.taskBank.find(t => t.id === id))
    .filter(Boolean);

  if (selectedTasks.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400">Нет выбранных заданий для формирования ключей ответов.</p>';
    return;
  }

  let html = '';
  for (let vNum = 1; vNum <= state.variantCount; vNum++) {
    html += `
      <div class="border border-cyan-500/30 rounded-xl p-3 sm:p-4 bg-slate-950/80 mb-3 shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-neon-cyan">ВАРИАНТ № ${vNum}</span>
            <span class="text-xs text-slate-400 font-medium">(${selectedTasks.length} заданий)</span>
          </div>
          <button type="button" class="text-xs text-cyan-400 hover:underline font-semibold" onclick="state.activeVariantView = ${vNum}; renderBuilderTab();">
            Смотреть карточки варианта →
          </button>
        </div>

        <div class="space-y-3">
    `;

    selectedTasks.forEach((task, tIdx) => {
      const varData = task.variants[(vNum - 1) % task.variants.length];
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

          <div class="flex justify-end pt-1">
            <button type="button" class="btn-builder-sol-modal text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold" data-taskid="${task.id}" data-vnum="${vNum}">
              <span>🔍</span>
              <span>Полное пошаговое решение</span>
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  container.querySelectorAll('.btn-builder-sol-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const tid = btn.dataset.taskid;
      const v = parseInt(btn.dataset.vnum, 10);
      const task = state.taskBank.find(t => t.id === tid);
      if (task) openSolutionModal(task, v);
    });
  });
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

  const selectedTasks = state.selectedTaskIds
    .map(id => state.taskBank.find(t => t.id === id))
    .filter(Boolean);

  if (countBadge) countBadge.textContent = selectedTasks.length;

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
          Открыть банк заданий (900 задач)
        </button>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = '';

  selectedTasks.forEach((task, index) => {
    const varData = task.variants[(state.activeVariantView - 1) % task.variants.length];
    
    // Проверка режима отображения (чистая координатная сетка для студента или готовый график)
    const isOverride = state.cardOverrides[task.id];
    const isBlank = (typeof isOverride === 'boolean') ? isOverride : state.studentMode;
    const hasDrawing = state.studentDrawings && !!state.studentDrawings[task.id];

    const svgCode = GraphRenderer.renderSVG({
      ...varData.graphConfig,
      width: 320,
      height: 240,
      theme: 'neon',
      animated: true,
      blankGrid: isBlank
    });

    const card = document.createElement('div');
    card.className = 'card-neon p-5 transition';
    card.innerHTML = `
      <div class="flex flex-col md:flex-row gap-5 items-start">
        <div class="w-full md:w-5/12 flex-shrink-0 flex flex-col items-center">
          <div class="w-full bg-[#070b16] p-2 rounded-xl border border-cyan-500/20 flex justify-center overflow-hidden shadow-inner">
            ${svgCode}
          </div>
          <div class="mt-2.5 flex items-center justify-between w-full px-1 text-xs">
            <button type="button" class="btn-toggle-graph-view text-xs font-semibold ${
              isBlank ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            } transition flex items-center gap-1">
              <span>${isBlank ? '👁️ Показать эталонный график' : '✏️ Сетка для черчения'}</span>
            </button>
            <button type="button" class="text-slate-500 hover:text-cyan-400 copy-graph-btn transition text-[11px]">
              Скачать SVG
            </button>
          </div>
        </div>

        <div class="w-full md:w-7/12 flex flex-col justify-between h-full">
          <div>
            <div class="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/40">
                  Задание ${index + 1}
                </span>
                <span class="text-xs text-slate-400 font-medium">
                  ${task.categoryName || 'Общая тема'}
                </span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs px-2 py-0.5 rounded font-semibold bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-500/30">
                  ✏️ Построение графика
                </span>
                <span class="text-xs px-2 py-0.5 rounded font-semibold ${getDifficultyBadgeClass(task.difficulty)}">
                  ${task.difficultyLabel || 'Базовый'}
                </span>
                <span class="text-xs text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  ${task.points || 1} б.
                </span>
              </div>
            </div>

            <h4 class="font-bold text-sm text-white mb-2">${task.title}</h4>
            <div class="text-xs text-slate-300 whitespace-pre-line mb-3 font-sans leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              ${escapeHtml(varData.question)}
            </div>

            <!-- Кнопка подробного разбора решения -->
            <!-- Кнопки интерактивной доски и подробного разбора решения -->
            <div class="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" class="btn-open-whiteboard btn-neon-primary w-full py-2 px-3 text-xs rounded-lg flex items-center justify-center gap-1.5 transition font-semibold shadow-neon-cyan" title="Открыть интерактивную неоновую доску для самостоятельного черчения и записи решения">
                <span>🎨 Чертить на доске</span>
                ${hasDrawing ? '<span class="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400 font-bold">✓ Есть чертеж</span>' : ''}
              </button>
              <button type="button" class="btn-open-solution btn-neon-emerald w-full py-2 px-3 text-xs rounded-lg flex items-center justify-center gap-1.5 transition font-semibold shadow-neon-emerald" title="Посмотреть пошаговое решение и теоретический справочник">
                <span>🔍 Пошаговое решение</span>
                <span class="text-[10px] text-emerald-300">→</span>
              </button>
            </div>
          </div>

          <!-- Кнопки управления порядком -->
          <div class="flex items-center justify-between border-t border-slate-800 pt-3 mt-1">
            <div class="flex gap-1 text-xs">
              <button type="button" class="btn-move-up px-2 py-1 rounded text-slate-500 hover:text-slate-200 transition ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="Выше" ${index === 0 ? 'disabled' : ''}>
                ▲ Вверх
              </button>
              <button type="button" class="btn-move-down px-2 py-1 rounded text-slate-500 hover:text-slate-200 transition ${index === selectedTasks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="Ниже" ${index === selectedTasks.length - 1 ? 'disabled' : ''}>
                ▼ Вниз
              </button>
            </div>

            <div class="flex gap-2 text-xs">
              <button type="button" class="btn-edit-task text-slate-400 hover:text-white px-2 py-1 rounded transition">
                Редактировать
              </button>
              <button type="button" class="btn-remove-task text-slate-400 hover:text-rose-400 px-2 py-1 rounded transition">
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.btn-toggle-graph-view')?.addEventListener('click', () => {
      state.cardOverrides[task.id] = !isBlank;
      renderBuilderTab();
    });

    card.querySelector('.btn-open-whiteboard')?.addEventListener('click', () => {
      if (typeof StudentBoard !== 'undefined') {
        StudentBoard.open(task, state.activeVariantView);
      }
    });

    card.querySelector('.btn-open-solution')?.addEventListener('click', () => {
      openSolutionModal(task, state.activeVariantView);
    });

    card.querySelector('.btn-move-up')?.addEventListener('click', () => moveTask(index, -1));
    card.querySelector('.btn-move-down')?.addEventListener('click', () => moveTask(index, 1));
    card.querySelector('.btn-remove-task')?.addEventListener('click', () => removeTaskFromSelected(task.id));
    card.querySelector('.btn-edit-task')?.addEventListener('click', () => openEditTaskModal(task));
    card.querySelector('.copy-graph-btn')?.addEventListener('click', () => downloadSVG(svgCode, `graph_task_${index+1}.svg`));

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
  category: 'all',
  difficulty: 'all',
  searchQuery: ''
};
let bankVisibleCount = 18;
let searchDebounceTimer = null;

function initBankTab() {
  const categoryContainer = document.getElementById('bank-category-filters');
  const difficultySelect = document.getElementById('bank-difficulty-filter');
  const searchInput = document.getElementById('bank-search-input');
  const createNewBtn = document.getElementById('create-new-task-btn');

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

  // Кэшированный легковесный SVG без тяжелых фильтров и без параллельных 30 анимаций
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
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs px-2 py-0.5 rounded font-semibold ${getDifficultyBadgeClass(task.difficulty)}">
          ${task.difficultyLabel || 'Базовый'}
        </span>
        <span class="text-xs text-slate-400 font-medium">
          ${task.points || 1} б. · 4 варианта
        </span>
      </div>

      <h4 class="font-bold text-sm text-white mb-1">${task.title}</h4>
      <p class="text-xs text-slate-400 mb-3 line-clamp-2">${task.description || ''}</p>

      <div class="w-full bg-[#070b16] p-1.5 rounded-lg border border-cyan-500/20 mb-3 flex justify-center overflow-hidden shadow-inner">
        ${svgCode}
      </div>
    </div>

    <div class="pt-3 border-t border-slate-800 flex flex-col gap-2">
      <div class="grid grid-cols-2 gap-2">
        <button type="button" class="btn-bank-whiteboard btn-neon-primary w-full py-1.5 px-2 text-xs rounded-lg transition flex items-center justify-center gap-1 font-semibold" title="Чертить график задания на интерактивной доске">
          <span>🎨 Чертить</span>
        </button>
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

  card.querySelector('.btn-view-solution')?.addEventListener('click', () => {
    openSolutionModal(task, 1);
  });

  // Быстрое переключение статуса карточки БЕЗ перерисовки всего банка
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

  if (reanimateBtn) {
    reanimateBtn.addEventListener('click', () => {
      renderSolutionGraph();
    });
  }

  // Кнопки интерактивной подсветки на чертеже
  document.querySelectorAll('.sol-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sol-step-btn').forEach(b => b.classList.remove('step-button-active'));
      btn.classList.add('step-button-active');
      currentSolutionHighlight = btn.dataset.highlight;
      renderSolutionGraph();
    });
  });
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
    steps: [
      { stepNum: 1, title: 'Анализ чертежа', content: varData.solution || 'Подробные аналитические вычисления...', visualKey: 'zeros' }
    ],
    commonMistakes: ['Невнимательность при считывании координат точек с осей.'],
    rubric: [{ item: 'Полное правильное решение', points: `${task.points || 1} б.` }]
  };

  document.getElementById('sol-modal-title').textContent = task.title;
  document.getElementById('sol-modal-subtitle').textContent = `Тема: ${task.categoryName || 'Математика СПО'} • Сложность: ${task.difficultyLabel || 'Базовый'} • Баллы: ${task.points || 1}`;
  document.getElementById('sol-modal-variant-badge').textContent = `Вариант № ${variantNum}`;

  document.getElementById('sol-task-question').textContent = varData.question;
  document.getElementById('sol-theory-box').textContent = sol.theory;
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
    row.className = 'flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs';
    row.innerHTML = `
      <span class="text-slate-700 dark:text-slate-300">${escapeHtml(r.item)}</span>
      <span class="font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[11px]">${escapeHtml(r.points)}</span>
    `;
    rubricContainer.appendChild(row);
  });

  // Шаги решения
  const stepsContainer = document.getElementById('sol-steps-container');
  stepsContainer.innerHTML = '';
  (sol.steps || []).forEach((st, idx) => {
    const stepEl = document.createElement('div');
    stepEl.className = 'p-3.5 card-neon hover:border-cyan-400 transition cursor-pointer text-xs';
    stepEl.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="font-semibold text-blue-600 dark:text-blue-400">
          Шаг ${st.stepNum || (idx + 1)}: ${escapeHtml(st.title)}
        </span>
        <span class="text-[10px] text-slate-400">нажмите для подсветки</span>
      </div>
      <div class="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
        ${escapeHtml(st.content)}
      </div>
    `;

    stepEl.addEventListener('click', () => {
      currentSolutionHighlight = st.visualKey || 'zeros';
      renderSolutionGraph();
      document.querySelectorAll('.sol-step-btn').forEach(b => {
        if (b.dataset.highlight === currentSolutionHighlight) b.classList.add('step-button-active');
        else b.classList.remove('step-button-active');
      });
    });

    stepsContainer.appendChild(stepEl);
  });

  // Сброс кнопок подсветки
  document.querySelectorAll('.sol-step-btn').forEach(b => {
    if (b.dataset.highlight === 'all') b.classList.add('step-button-active');
    else b.classList.remove('step-button-active');
  });

  renderSolutionGraph();

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
  toast.className = `fixed bottom-5 right-5 z-50 text-xs font-medium px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 transform transition-all duration-200 translate-y-2 opacity-0 ${bg} border border-slate-700/50`;
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
