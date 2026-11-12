/**
 * Главный контроллер веб-приложения "ГрафМастер СПО"
 * Управление состоянием, конструктор вариантов, банк заданий, лаборатория графиков,
 * динамическая анимация и модальное окно подробного пошагового решения.
 */

class AppState {
  constructor() {
    this.storageKey = 'grafmaster_spo_data_v2';
    this.themeKey = 'grafmaster_theme';
    
    this.loadState();
    
    this.activeTab = 'builder';
    this.variantCount = 2;
    this.activeVariantView = 1;
    this.currentTheme = 'dark';
  }

  loadState() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.taskBank = parsed.taskBank || INITIAL_TASK_BANK;
        this.selectedTaskIds = parsed.selectedTaskIds || ['prop-1', 'linear-1', 'quad-1', 'rational-1'];
        this.workSettings = parsed.workSettings || this.getDefaultWorkSettings();
        return;
      } catch (e) {
        console.error('Ошибка загрузки сохраненных данных:', e);
      }
    }
    
    this.taskBank = JSON.parse(JSON.stringify(INITIAL_TASK_BANK));
    this.selectedTaskIds = ['prop-1', 'linear-1', 'quad-1', 'rational-1'];
    this.workSettings = this.getDefaultWorkSettings();
  }

  getDefaultWorkSettings() {
    return {
      collegeName: 'ГБПОУ «Политехнический колледж»',
      subject: 'Математика',
      topic: 'Контрольная работа: Исследование и построение графиков функций',
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
      const data = {
        taskBank: this.taskBank,
        selectedTaskIds: this.selectedTaskIds,
        workSettings: this.workSettings
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('Ошибка сохранения данных:', e);
    }
  }

  resetToDefault() {
    this.taskBank = JSON.parse(JSON.stringify(INITIAL_TASK_BANK));
    this.selectedTaskIds = ['prop-1', 'linear-1', 'quad-1', 'rational-1'];
    this.workSettings = this.getDefaultWorkSettings();
    this.saveState();
  }
}

const state = new AppState();

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initPresetButtons();
  initVariantCountControls();
  initGeneratorModal();
  initWorkSettingsForm();
  initBankTab();
  initPlotterTab();
  initTaskModal();
  initSolutionModal();
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

  const quickPrintBtn = document.getElementById('quick-print-btn');
  if (quickPrintBtn) {
    quickPrintBtn.addEventListener('click', () => {
      switchTab('preview');
      setTimeout(() => {
        window.print();
      }, 350);
    });
  }
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
    case 'plotter':
      updatePlotterPreview();
      break;
    case 'preview':
      renderPrintPreview();
      break;
  }
}

/* ==================== КОНСТРУКТОР ВАРИАНТОВ ==================== */
function initPresetButtons() {
  const presets = {
    short: {
      tasks: ['prop-1', 'linear-1', 'quad-1'],
      title: 'Самостоятельная работа: Графики основных функций',
      time: '20 минут'
    },
    control: {
      tasks: ['prop-1', 'linear-1', 'quad-1', 'rational-1', 'transform-1'],
      title: 'Контрольная работа: Исследование и преобразования графиков функций',
      time: '45 минут'
    },
    diagnostic: {
      tasks: ['prop-1', 'prop-2', 'linear-1', 'quad-1', 'exp-log-1', 'solve-graph-1'],
      title: 'Диагностическая контрольная работа по математике (1 курс СПО)',
      time: '60 минут'
    },
    exam: {
      tasks: ['prop-1', 'prop-2', 'linear-1', 'quad-1', 'rational-1', 'exp-log-1', 'trig-1', 'transform-1'],
      title: 'Итоговый зачетный практикум: Графики элементарных функций',
      time: '90 минут'
    }
  };

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pKey = btn.dataset.preset;
      const p = presets[pKey];
      if (p) {
        state.selectedTaskIds = [...p.tasks];
        state.workSettings.topic = p.title;
        state.workSettings.timeLimit = p.time;
        state.saveState();
        renderBuilderTab();
        showToast(`Загружен шаблон: «${p.title}»`, 'success');
      }
    });
  });

  const clearBtn = document.getElementById('clear-tasks-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Удалить все выбранные задания из текущей работы?')) {
        state.selectedTaskIds = [];
        state.saveState();
        renderBuilderTab();
        showToast('Список заданий очищен', 'info');
      }
    });
  }

  const resetBtn = document.getElementById('reset-all-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Сбросить все настройки и восстановить стандартные задания?')) {
        state.resetToDefault();
        initWorkSettingsForm();
        renderBuilderTab();
        showToast('Все данные сброшены к исходным', 'info');
      }
    });
  }

  const exportBtn = document.getElementById('export-json-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportProjectJSON);

  const importInput = document.getElementById('import-json-input');
  if (importInput) importInput.addEventListener('change', importProjectJSON);
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

      // Балансировка тем для СПО 1 курса:
      const preferredSequence = [
        'prop-1',       // Свойства функций
        'linear-1',     // Линейная функция
        'quad-1',       // Парабола
        'rational-1',   // Гипербола
        'abs-1',        // Модуль
        'trig-1',       // Гармоники sin/cos
        'exp-1',        // Экспонента и логарифм
        'piecewise-1'   // Кусочная с разрывом
      ];

      const availableIds = state.taskBank.map(t => t.id);
      let chosenIds = preferredSequence.filter(id => availableIds.includes(id));

      if (chosenIds.length < taskCount) {
        const remaining = availableIds.filter(id => !chosenIds.includes(id));
        chosenIds = chosenIds.concat(remaining);
      }

      state.selectedTaskIds = chosenIds.slice(0, taskCount);

      // Корректировка заголовка
      state.workSettings.topic = taskCount <= 3
        ? 'Самостоятельная работа: Графики элементарных функций'
        : taskCount <= 5
        ? 'Контрольная работа: Исследование и графики функций'
        : 'Диагностическая контрольная работа: Все графики функций (СПО 1 курс)';

      state.workSettings.timeLimit = taskCount <= 3 ? '20 минут' : taskCount <= 5 ? '45 минут' : '90 минут';

      state.saveState();
      initVariantCountControls();
      initWorkSettingsForm();
      closeModal();

      // Переход к предпросмотру и печати вариантов
      switchTab('preview');
      showToast(`⚡ Сгенерировано: ${selectedGenCount} вариантов (${taskCount} заданий) с ключами ответов!`, 'success');
    });
  }
}

function initWorkSettingsForm() {
  const s = state.workSettings;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = val || '';
    }
  };

  setVal('setting-college', s.collegeName);
  setVal('setting-subject', s.subject);
  setVal('setting-topic', s.topic);
  setVal('setting-time', s.timeLimit);
  setVal('setting-scale', s.gradingScale);
  setVal('setting-student-fields', s.showStudentFields);
  setVal('setting-answers-sheet', s.showAnswersSheet);
  setVal('setting-criteria', s.showCriteria);
  setVal('setting-layout-mode', s.layoutMode);

  const inputs = [
    'setting-college', 'setting-subject', 'setting-topic', 'setting-time',
    'setting-scale', 'setting-student-fields', 'setting-answers-sheet',
    'setting-criteria', 'setting-layout-mode'
  ];

  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      s.collegeName = document.getElementById('setting-college').value;
      s.subject = document.getElementById('setting-subject').value;
      s.topic = document.getElementById('setting-topic').value;
      s.timeLimit = document.getElementById('setting-time').value;
      s.gradingScale = document.getElementById('setting-scale').value;
      s.showStudentFields = document.getElementById('setting-student-fields').checked;
      s.showAnswersSheet = document.getElementById('setting-answers-sheet').checked;
      s.showCriteria = document.getElementById('setting-criteria').checked;
      s.layoutMode = document.getElementById('setting-layout-mode').value;
      state.saveState();
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
      <div class="empty-state-box p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <div class="text-4xl mb-3">📝</div>
        <h4 class="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">В работе пока нет ни одного задания</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Выберите готовые задания из банка или воспользуйтесь быстрыми шаблонами вверху.</p>
        <button type="button" onclick="switchTab('bank')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow transition">
          Открыть банк заданий
        </button>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = '';

  selectedTasks.forEach((task, index) => {
    const varData = task.variants[(state.activeVariantView - 1) % task.variants.length];
    
    // Анимированный SVG-график
    const svgCode = GraphRenderer.renderSVG({
      ...varData.graphConfig,
      width: 320,
      height: 240,
      theme: state.currentTheme === 'dark' ? 'dark' : 'notebook',
      animated: true
    });

    const card = document.createElement('div');
    card.className = 'card-neon p-5 transition';
    card.innerHTML = `
      <div class="flex flex-col md:flex-row gap-5 items-start">
        <div class="w-full md:w-5/12 flex-shrink-0 flex flex-col items-center">
          <div class="w-full bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-center overflow-hidden">
            ${svgCode}
          </div>
          <div class="mt-2 flex items-center gap-2 text-xs">
            <button type="button" class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 copy-graph-btn transition">
              Скачать SVG
            </button>
            <span class="text-slate-300 dark:text-slate-600">·</span>
            <button type="button" class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 open-plotter-btn transition">
              В лабораторию
            </button>
          </div>
        </div>

        <div class="w-full md:w-7/12 flex flex-col justify-between h-full">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="font-medium text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  Задание ${index + 1}
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400">
                  ${task.categoryName || 'Общая тема'}
                </span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs px-2 py-0.5 rounded font-medium ${getDifficultyBadgeClass(task.difficulty)}">
                  ${task.difficultyLabel || 'Базовый'}
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  ${task.points || 1} б.
                </span>
              </div>
            </div>

            <h4 class="font-semibold text-sm text-slate-900 dark:text-white mb-2">${task.title}</h4>
            <div class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line mb-3 font-sans leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
              ${escapeHtml(varData.question)}
            </div>

            <!-- Кнопка подробного разбора решения -->
            <div class="mb-3">
              <button type="button" class="btn-open-solution w-full py-2 px-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium text-xs rounded-lg transition border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center gap-1.5">
                <span>Подробный пошаговый разбор решения</span>
                <span class="text-[10px] text-blue-500 dark:text-blue-400">→</span>
              </button>
            </div>
          </div>

          <!-- Кнопки управления порядком -->
          <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
            <div class="flex gap-1 text-xs">
              <button type="button" class="btn-move-up px-2 py-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="Выше" ${index === 0 ? 'disabled' : ''}>
                ▲ Вверх
              </button>
              <button type="button" class="btn-move-down px-2 py-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition ${index === selectedTasks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="Ниже" ${index === selectedTasks.length - 1 ? 'disabled' : ''}>
                ▼ Вниз
              </button>
            </div>

            <div class="flex gap-2 text-xs">
              <button type="button" class="btn-edit-task text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded transition">
                Редактировать
              </button>
              <button type="button" class="btn-remove-task text-slate-400 hover:text-red-600 px-2 py-1 rounded transition">
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.btn-open-solution')?.addEventListener('click', () => {
      openSolutionModal(task, state.activeVariantView);
    });

    card.querySelector('.btn-move-up')?.addEventListener('click', () => moveTask(index, -1));
    card.querySelector('.btn-move-down')?.addEventListener('click', () => moveTask(index, 1));
    card.querySelector('.btn-remove-task')?.addEventListener('click', () => removeTaskFromSelected(task.id));
    card.querySelector('.btn-edit-task')?.addEventListener('click', () => openEditTaskModal(task));
    card.querySelector('.copy-graph-btn')?.addEventListener('click', () => downloadSVG(svgCode, `graph_task_${index+1}.svg`));
    card.querySelector('.open-plotter-btn')?.addEventListener('click', () => loadGraphIntoPlotter(varData.graphConfig));

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
  state.saveState();
  renderBuilderTab();
  showToast('Задание удалено из работы', 'info');
}

/* ==================== БАНК ЗАДАНИЙ ==================== */
let bankFilters = {
  category: 'all',
  difficulty: 'all',
  searchQuery: ''
};

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
      btn.className = `category-filter-btn text-xs px-2.5 py-1 rounded-md border transition ${
        bankFilters.category === cat.id
          ? 'bg-blue-600 text-white border-blue-600 font-medium'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 font-normal'
      }`;
      btn.textContent = cat.name;
      btn.addEventListener('click', () => {
        bankFilters.category = cat.id;
        initBankTab();
        renderBankList();
      });
      categoryContainer.appendChild(btn);
    });
  }

  if (difficultySelect) {
    difficultySelect.addEventListener('change', (e) => {
      bankFilters.difficulty = e.target.value;
      renderBankList();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      bankFilters.searchQuery = e.target.value.toLowerCase().trim();
      renderBankList();
    });
  }

  if (createNewBtn) {
    createNewBtn.addEventListener('click', () => openNewTaskModal());
  }
}

function renderBankList() {
  const container = document.getElementById('bank-tasks-list');
  const countBadge = document.getElementById('bank-total-count');
  if (!container) return;

  const filtered = state.taskBank.filter(task => {
    if (bankFilters.category !== 'all' && task.category !== bankFilters.category) return false;
    if (bankFilters.difficulty !== 'all' && task.difficulty !== bankFilters.difficulty) return false;
    if (bankFilters.searchQuery) {
      const text = `${task.title} ${task.description} ${task.variants.map(v => v.question).join(' ')}`.toLowerCase();
      if (!text.includes(bankFilters.searchQuery)) return false;
    }
    return true;
  });

  if (countBadge) countBadge.textContent = `${filtered.length} из ${state.taskBank.length}`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <p class="text-sm text-slate-500 dark:text-slate-400">Ни одно задание не соответствует выбранным критериям поиска.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  filtered.forEach(task => {
    const isSelected = state.selectedTaskIds.includes(task.id);
    const firstVar = task.variants[0];

    const svgCode = GraphRenderer.renderSVG({
      ...firstVar.graphConfig,
      width: 280,
      height: 200,
      theme: state.currentTheme === 'dark' ? 'dark' : 'notebook',
      animated: true
    });

    const card = document.createElement('div');
    card.className = `card-neon p-4 transition flex flex-col justify-between ${
      isSelected ? 'border-cyan-400 ring-1 ring-cyan-500/40 shadow-neon-cyan' : ''
    }`;

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs px-2 py-0.5 rounded font-medium ${getDifficultyBadgeClass(task.difficulty)}">
            ${task.difficultyLabel || 'Базовый'}
          </span>
          <span class="text-xs text-slate-400 font-medium">
            ${task.points || 1} б. · 4 варианта
          </span>
        </div>

        <h4 class="font-semibold text-sm text-slate-900 dark:text-white mb-1">${task.title}</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">${task.description || ''}</p>

        <div class="w-full bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 mb-3 flex justify-center overflow-hidden">
          ${svgCode}
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
        <button type="button" class="btn-view-solution w-full py-1.5 px-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium text-xs rounded-lg transition border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center gap-1">
          <span>Пошаговое решение</span>
        </button>

        <div class="flex items-center justify-between mt-1 text-xs">
          <button type="button" class="btn-preview-task text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Варианты (1–4)
          </button>
          <button type="button" class="btn-toggle-select px-3 py-1 font-medium rounded-lg transition ${
            isSelected
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }">
            ${isSelected ? '✓ В работе' : '+ В работу'}
          </button>
        </div>
      </div>
    `;

    card.querySelector('.btn-view-solution').addEventListener('click', () => {
      openSolutionModal(task, 1);
    });

    card.querySelector('.btn-toggle-select').addEventListener('click', () => {
      if (isSelected) {
        state.selectedTaskIds = state.selectedTaskIds.filter(id => id !== task.id);
        showToast('Задание удалено из работы', 'info');
      } else {
        state.selectedTaskIds.push(task.id);
        showToast('Задание добавлено в работу', 'success');
      }
      state.saveState();
      renderBankList();
      if (state.activeTab === 'builder') renderBuilderTab();
    });

    card.querySelector('.btn-preview-task').addEventListener('click', () => {
      openEditTaskModal(task, true);
    });

    container.appendChild(card);
  });
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
    theme: state.currentTheme === 'dark' ? 'dark' : 'notebook',
    animated: true,
    highlightStep: currentSolutionHighlight
  });

  box.innerHTML = svg;
}

/* ==================== ЛАБОРАТОРИЯ ГРАФИКОВ И АНИМАЦИЯ ==================== */
let plotterState = {
  fn1: 'x^2 - 2*x - 3',
  fn2: '',
  color1: '#00f0ff',
  color2: '#ff2d75',
  xMin: -5,
  xMax: 5,
  yMin: -5,
  yMax: 5,
  stepX: 1,
  stepY: 1,
  paramA: 1.0,
  isAnimating: false,
  animId: null,
  animPhase: 0,
  points: [
    { x: 1, y: -4, label: 'B(1; -4)', color: '#ff2d75', dashedLines: true },
    { x: -1, y: 0, label: '(-1; 0)', color: '#10e897' },
    { x: 3, y: 0, label: '(3; 0)', color: '#10e897' }
  ],
  asymptotes: []
};

function initPlotterTab() {
  const getEl = (id) => document.getElementById(id);

  const inputFn1 = getEl('plotter-fn1');
  const inputFn2 = getEl('plotter-fn2');
  const inputColor1 = getEl('plotter-color1');
  const inputColor2 = getEl('plotter-color2');
  const inputXMin = getEl('plotter-xmin');
  const inputXMax = getEl('plotter-xmax');
  const inputYMin = getEl('plotter-ymin');
  const inputYMax = getEl('plotter-ymax');
  const addPointBtn = getEl('plotter-add-point-btn');
  const paramSlider = getEl('plotter-param-slider');
  const paramBadge = getEl('param-val-badge');
  const animToggleBtn = getEl('plotter-anim-toggle');
  const reanimateBtn = getEl('plotter-reanimate-btn');

  // Быстрые шаблоны
  document.querySelectorAll('.plotter-quick-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const formula = btn.dataset.formula;
      if (formula && inputFn1) {
        inputFn1.value = formula;
        plotterState.fn1 = formula;
        updatePlotterPreview();
      }
    });
  });

  const syncInputs = () => {
    if (inputFn1) plotterState.fn1 = inputFn1.value;
    if (inputFn2) plotterState.fn2 = inputFn2.value;
    if (inputColor1) plotterState.color1 = inputColor1.value;
    if (inputColor2) plotterState.color2 = inputColor2.value;
    if (inputXMin) plotterState.xMin = parseFloat(inputXMin.value) || -5;
    if (inputXMax) plotterState.xMax = parseFloat(inputXMax.value) || 5;
    if (inputYMin) plotterState.yMin = parseFloat(inputYMin.value) || -5;
    if (inputYMax) plotterState.yMax = parseFloat(inputYMax.value) || 5;
    updatePlotterPreview();
  };

  [inputFn1, inputFn2, inputColor1, inputColor2, inputXMin, inputXMax, inputYMin, inputYMax].forEach(el => {
    if (el) el.addEventListener('input', syncInputs);
  });

  // Ползунок параметра
  if (paramSlider) {
    paramSlider.addEventListener('input', (e) => {
      plotterState.paramA = parseFloat(e.target.value);
      if (paramBadge) paramBadge.textContent = plotterState.paramA.toFixed(1);
      applyParamToFunction();
    });
  }

  // Кнопка пуска/паузы живой анимации
  if (animToggleBtn) {
    animToggleBtn.addEventListener('click', () => {
      plotterState.isAnimating = !plotterState.isAnimating;
      const playIcon = document.getElementById('anim-play-icon');
      const playText = document.getElementById('anim-play-text');

      if (plotterState.isAnimating) {
        if (playIcon) playIcon.textContent = '⏸';
        if (playText) playText.textContent = 'Пауза';
        startPlotterAnimation();
      } else {
        if (playIcon) playIcon.textContent = '▶';
        if (playText) playText.textContent = 'Запустить';
        stopPlotterAnimation();
      }
    });
  }

  if (reanimateBtn) {
    reanimateBtn.addEventListener('click', () => {
      updatePlotterPreview(true);
    });
  }

  if (addPointBtn) {
    addPointBtn.addEventListener('click', () => {
      plotterState.points.push({ x: 0, y: 0, label: '(0; 0)', color: '#dc2626', dashedLines: true });
      renderPlotterPointsList();
      updatePlotterPreview();
    });
  }

  const createTaskFromPlotterBtn = getEl('plotter-create-task-btn');
  if (createTaskFromPlotterBtn) {
    createTaskFromPlotterBtn.addEventListener('click', () => {
      openNewTaskModalWithGraph(getPlotterConfig(380, 300));
    });
  }

  renderPlotterPointsList();
}

function applyParamToFunction() {
  const a = plotterState.paramA;
  let raw = plotterState.fn1;
  // Если формула содержит 'a', подставляем число
  if (raw.includes('a')) {
    const substituted = raw.replace(/\ba\b/g, `(${a})`);
    updatePlotterPreviewWithFormula(substituted);
  } else {
    // Иначе динамически масштабируем или сдвигаем параболу/волну
    updatePlotterPreview();
  }
}

function startPlotterAnimation() {
  if (plotterState.animId) cancelAnimationFrame(plotterState.animId);

  const loop = () => {
    if (!plotterState.isAnimating) return;

    plotterState.animPhase += 0.04;
    // Колебание параметра a от -2.5 до 2.5
    plotterState.paramA = Math.sin(plotterState.animPhase) * 2.5;

    const slider = document.getElementById('plotter-param-slider');
    const badge = document.getElementById('param-val-badge');
    if (slider) slider.value = plotterState.paramA;
    if (badge) badge.textContent = plotterState.paramA.toFixed(1);

    // Динамически перестраиваем график
    updatePlotterPreview(false);

    plotterState.animId = requestAnimationFrame(loop);
  };

  plotterState.animId = requestAnimationFrame(loop);
}

function stopPlotterAnimation() {
  if (plotterState.animId) {
    cancelAnimationFrame(plotterState.animId);
    plotterState.animId = null;
  }
}

function getPlotterConfig(width = 460, height = 360, animated = false) {
  let fnFormula = plotterState.fn1;
  const a = plotterState.paramA;

  if (fnFormula.includes('a')) {
    fnFormula = fnFormula.replace(/\ba\b/g, `(${a.toFixed(2)})`);
  }

  const functions = [];
  if (fnFormula) {
    functions.push({ fn: fnFormula, color: plotterState.color1, width: 2.5, label: `y₁ = ${fnFormula}` });
  }
  if (plotterState.fn2) {
    functions.push({ fn: plotterState.fn2, color: plotterState.color2, width: 2.2, label: `y₂ = ${plotterState.fn2}` });
  }

  return {
    width,
    height,
    xMin: plotterState.xMin,
    xMax: plotterState.xMax,
    yMin: plotterState.yMin,
    yMax: plotterState.yMax,
    stepX: plotterState.stepX,
    stepY: plotterState.stepY,
    functions,
    points: plotterState.points,
    asymptotes: plotterState.asymptotes,
    theme: state.currentTheme === 'dark' ? 'dark' : 'notebook',
    animated: animated
  };
}

function updatePlotterPreview(animated = false) {
  const previewBox = document.getElementById('plotter-preview-container');
  if (!previewBox) return;

  try {
    const config = getPlotterConfig(460, 360, animated);
    const svgCode = GraphRenderer.renderSVG(config);
    previewBox.innerHTML = svgCode;

    const analysisBox = document.getElementById('plotter-analysis-box');
    if (analysisBox && config.functions[0]) {
      const fn = MathEngine.compile(config.functions[0].fn);
      if (fn) {
        const analysis = MathEngine.analyze(fn, plotterState.xMin, plotterState.xMax);
        let info = '';
        if (analysis.zeros.length > 0) {
          info += `<p><strong>Примерные нули функции (y = 0):</strong> ${analysis.zeros.map(z => `x ≈ ${z.x}`).join(', ')}</p>`;
        }
        if (analysis.extrema.length > 0) {
          info += `<p><strong>Точки экстремума:</strong> ${analysis.extrema.map(e => `${e.type.toUpperCase()} в точке x ≈ ${e.x} (y ≈ ${e.y})`).join(', ')}</p>`;
        }
        analysisBox.innerHTML = info || '<p class="text-slate-400">Нулей на видимом интервале не обнаружено</p>';
      }
    }
  } catch (e) {
    previewBox.innerHTML = `<div class="text-red-500 p-4 text-xs">Ошибка построения: ${e.message}</div>`;
  }
}

function renderPlotterPointsList() {
  const container = document.getElementById('plotter-points-list');
  if (!container) return;

  container.innerHTML = '';
  plotterState.points.forEach((pt, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 mb-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs';
    row.innerHTML = `
      <div class="flex items-center gap-1">
        <label class="text-slate-400">X:</label>
        <input type="number" step="0.5" value="${pt.x}" class="pt-x w-14 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
      </div>
      <div class="flex items-center gap-1">
        <label class="text-slate-400">Y:</label>
        <input type="number" step="0.5" value="${pt.y}" class="pt-y w-14 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
      </div>
      <div class="flex items-center gap-1 flex-1">
        <label class="text-slate-400">Текст:</label>
        <input type="text" value="${pt.label || ''}" placeholder="(1; 2)" class="pt-label w-full px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
      </div>
      <button type="button" class="pt-del text-red-500 hover:text-red-700 px-1 font-bold" title="Удалить точку">✕</button>
    `;

    row.querySelector('.pt-x').addEventListener('input', (e) => {
      pt.x = parseFloat(e.target.value) || 0;
      updatePlotterPreview();
    });
    row.querySelector('.pt-y').addEventListener('input', (e) => {
      pt.y = parseFloat(e.target.value) || 0;
      updatePlotterPreview();
    });
    row.querySelector('.pt-label').addEventListener('input', (e) => {
      pt.label = e.target.value;
      updatePlotterPreview();
    });
    row.querySelector('.pt-del').addEventListener('click', () => {
      plotterState.points.splice(idx, 1);
      renderPlotterPointsList();
      updatePlotterPreview();
    });

    container.appendChild(row);
  });
}

function loadGraphIntoPlotter(graphConfig) {
  if (!graphConfig) return;
  plotterState.xMin = graphConfig.xMin || -5;
  plotterState.xMax = graphConfig.xMax || 5;
  plotterState.yMin = graphConfig.yMin || -5;
  plotterState.yMax = graphConfig.yMax || 5;

  if (graphConfig.functions && graphConfig.functions[0]) {
    plotterState.fn1 = graphConfig.functions[0].fn;
    plotterState.color1 = graphConfig.functions[0].color || '#2563eb';
  }
  if (graphConfig.functions && graphConfig.functions[1]) {
    plotterState.fn2 = graphConfig.functions[1].fn;
    plotterState.color2 = graphConfig.functions[1].color || '#dc2626';
  } else {
    plotterState.fn2 = '';
  }

  plotterState.points = JSON.parse(JSON.stringify(graphConfig.points || []));
  plotterState.asymptotes = JSON.parse(JSON.stringify(graphConfig.asymptotes || []));

  switchTab('plotter');
  initPlotterTab();
  updatePlotterPreview(true);
  showToast('График загружен в лабораторию', 'info');
}

/* ==================== ПРЕДПРОСМОТР И ПЕЧАТЬ (А4) ==================== */
function renderPrintPreview() {
  const container = document.getElementById('print-preview-container');
  if (!container) return;

  const selectedTasks = state.selectedTaskIds
    .map(id => state.taskBank.find(t => t.id === id))
    .filter(Boolean);

  if (selectedTasks.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <p class="text-sm text-slate-500">В работе нет заданий для печати. Сначала добавьте задания в конструкторе.</p>
      </div>
    `;
    return;
  }

  const s = state.workSettings;
  let html = '';

  for (let vNum = 1; vNum <= state.variantCount; vNum++) {
    html += `
      <div class="a4-sheet ${s.layoutMode === 'one-per-page' ? 'page-break' : 'mb-8'} bg-white text-slate-900 shadow-xl rounded-xl p-8 border border-slate-200">
        <!-- Шапка учебного заведения -->
        <div class="text-center border-b-2 border-slate-900 pb-3 mb-4">
          <div class="text-xs uppercase tracking-wider font-bold text-slate-600">${escapeHtml(s.collegeName)}</div>
          <h2 class="text-lg font-extrabold text-slate-900 uppercase tracking-tight mt-1">${escapeHtml(s.topic)}</h2>
          <div class="flex justify-between items-center text-xs font-semibold text-slate-700 mt-2">
            <span>Дисциплина: <strong>${escapeHtml(s.subject)}</strong></span>
            <span class="text-sm font-black px-3 py-0.5 border-2 border-slate-900 rounded">ВАРИАНТ № ${vNum}</span>
            <span>Время выполнения: <strong>${escapeHtml(s.timeLimit)}</strong></span>
          </div>
        </div>

        <!-- Поля для студента -->
        ${s.showStudentFields ? `
          <div class="grid grid-cols-12 gap-2 text-xs border border-slate-300 rounded p-2 mb-4 bg-slate-50/50">
            <div class="col-span-6 flex items-center gap-1">
              <span class="font-bold text-slate-600">Студент:</span>
              <span class="border-b border-dotted border-slate-400 flex-1 h-4"></span>
            </div>
            <div class="col-span-3 flex items-center gap-1">
              <span class="font-bold text-slate-600">Группа:</span>
              <span class="border-b border-dotted border-slate-400 flex-1 h-4"></span>
            </div>
            <div class="col-span-3 flex items-center gap-1">
              <span class="font-bold text-slate-600">Дата:</span>
              <span class="border-b border-dotted border-slate-400 flex-1 h-4"></span>
            </div>
          </div>
        ` : ''}

        <!-- Задания варианта -->
        <div class="tasks-print-list space-y-5">
    `;

    selectedTasks.forEach((task, tIdx) => {
      const varData = task.variants[(vNum - 1) % task.variants.length];
      
      const svgCode = GraphRenderer.renderSVG({
        ...varData.graphConfig,
        width: 320,
        height: 230,
        theme: 'clean',
        animated: false
      });

      html += `
        <div class="print-task-block flex flex-row gap-4 items-start border-b border-slate-200 pb-4">
          <div class="w-5/12 flex-shrink-0 flex justify-center bg-slate-50 p-1.5 rounded border border-slate-200">
            ${svgCode}
          </div>
          <div class="w-7/12 flex-1">
            <div class="flex justify-between items-center mb-1">
              <h4 class="font-bold text-xs text-slate-900">
                Задание ${tIdx + 1}. <span class="font-medium text-slate-700">${escapeHtml(task.title)}</span>
              </h4>
              <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                (${task.points || 1} б.)
              </span>
            </div>
            <div class="text-[11px] leading-relaxed text-slate-800 whitespace-pre-line mb-3 font-sans">
              ${escapeHtml(varData.question)}
            </div>
            <div class="border border-dashed border-slate-300 rounded p-2 text-[10px] text-slate-400 h-16 flex items-start">
              Место для краткого ответа / решения:
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>

        <!-- Подвал со шкалой -->
        <div class="mt-4 pt-3 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-600">
          <div>Критерии оценки: <strong>${escapeHtml(s.gradingScale)}</strong></div>
          <div class="border border-slate-900 px-3 py-1 font-bold text-slate-900">
            ОЦЕНКА: _______ / Подпись преподавателя: _______
          </div>
        </div>
      </div>
    `;
  }

  // Лист ответов для преподавателя
  if (s.showAnswersSheet) {
    html += `
      <div class="a4-sheet page-break bg-white text-slate-900 shadow-xl rounded-xl p-8 border border-slate-300 mt-8">
        <div class="text-center border-b-2 border-emerald-700 pb-3 mb-6">
          <span class="text-xs uppercase tracking-wider font-bold text-emerald-700">Только для преподавателя</span>
          <h2 class="text-xl font-black text-slate-900 mt-1">КЛЮЧИ И ПОДРОБНЫЕ РЕШЕНИЯ К ВАРИАНТАМ</h2>
          <div class="text-xs text-slate-600 mt-1">${escapeHtml(s.topic)}</div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    `;

    for (let vNum = 1; vNum <= state.variantCount; vNum++) {
      html += `
        <div class="border border-slate-300 rounded-lg p-4 bg-slate-50/50">
          <h3 class="font-extrabold text-sm text-slate-900 pb-2 mb-3 border-b border-slate-200 flex justify-between">
            <span>ВАРИАНТ № ${vNum}</span>
            <span class="text-xs font-normal text-slate-500">Заданий: ${selectedTasks.length}</span>
          </h3>
          <div class="space-y-4">
      `;

      selectedTasks.forEach((task, tIdx) => {
        const varData = task.variants[(vNum - 1) % task.variants.length];
        html += `
          <div class="text-xs">
            <div class="font-bold text-slate-800 mb-0.5">№ ${tIdx + 1} (${escapeHtml(task.title)}):</div>
            <div class="bg-white p-2 rounded border border-slate-200 text-slate-900 font-mono text-[11px] whitespace-pre-line mb-1">
              ${escapeHtml(varData.answer)}
            </div>
            ${s.showCriteria && varData.solution ? `
              <div class="text-[10px] text-slate-600 leading-tight bg-slate-100/70 p-1.5 rounded">
                <strong>Решение:</strong> ${escapeHtml(varData.solution)}
              </div>
            ` : ''}
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
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

/* ==================== ЭКСПОРТ / ИМПОРТ ==================== */
function exportProjectJSON() {
  const data = {
    appName: 'ГрафМастер СПО',
    version: '2.0',
    exportDate: new Date().toISOString(),
    workSettings: state.workSettings,
    selectedTaskIds: state.selectedTaskIds,
    taskBank: state.taskBank
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grafmaster_variant_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Файл проекта успешно скачан', 'success');
}

function importProjectJSON(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.taskBank && data.selectedTaskIds) {
        state.taskBank = data.taskBank;
        state.selectedTaskIds = data.selectedTaskIds;
        if (data.workSettings) state.workSettings = data.workSettings;
        state.saveState();
        initWorkSettingsForm();
        renderCurrentTab();
        showToast('Проект успешно импортирован!', 'success');
      } else {
        alert('Некорректный формат файла проекта');
      }
    } catch (err) {
      alert('Ошибка при чтении файла JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
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
