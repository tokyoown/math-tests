/**
 * Student Interactive Whiteboard & Graph Drawing Workspace
 * Интерактивная неоновая доска студента для построения графиков и записи решений.
 * Поддерживает мышь, стилус и сенсорные экраны (PointerEvents), сглаживание Безье,
 * инструменты "Перо", "Прямая", "Точка с координатами", "Текст", "Ластик", "Двигать" (панорамирование),
 * плавное перемещение 2 пальцами (pinch/pan), возврат в центр, отмену/повтор,
 * переключение "Пустая доска" / "Сетка Oxy", сверку с эталоном и сохранение чертежа.
 */

class StudentBoardController {
  constructor() {
    this.modal = null;
    this.canvas = null;
    this.ctx = null;
    this.surfaceEl = null;
    this.currentTask = null;
    this.currentVariantNum = 1;
    this.graphConfig = null;
    this.boardMode = 'blank'; // 'blank' или 'oxy'

    // Размеры виртуальной рабочей поверхности (Surface)
    this.surfaceWidth = 2400;
    this.surfaceHeight = 2000;

    // Смещение доски (панорамирование)
    this.panX = 0;
    this.panY = 0;
    this.isPanToolDragging = false;
    this.lastPanX = 0;
    this.lastPanY = 0;

    // Отслеживание активных указателей (для двухпальцевого перемещения на сенсорных экранах)
    this.activePointers = new Map();
    this.isTwoFingerPanning = false;
    this.lastPanMidX = 0;
    this.lastPanMidY = 0;

    // Инструменты
    this.currentTool = 'pen'; // 'pen', 'line', 'point', 'text', 'eraser', 'pan'
    this.currentColor = '#00f0ff';
    this.currentSize = 4;

    // Состояние рисования
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.startX = 0;
    this.startY = 0;
    this.strokePoints = [];

    // Стек истории для Undo/Redo
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 25;

    // Сверка с эталоном
    this.isReferenceVisible = false;

    // Временный снимок для превью прямой линии
    this.previewSnapshot = null;
    this.pendingTextX = null;
    this.pendingTextY = null;
  }

  init() {
    this.modal = document.getElementById('whiteboard-modal');
    this.canvas = document.getElementById('wb-draw-canvas');
    this.surfaceEl = document.getElementById('wb-board-surface');
    if (!this.modal || !this.canvas) return;

    this.initSurface();
    this.initEventListeners();
    this.initTools();
  }

  initSurface() {
    if (!this.surfaceEl) this.surfaceEl = document.getElementById('wb-board-surface');
    if (!this.surfaceEl || !this.canvas) return;

    this.surfaceEl.style.width = `${this.surfaceWidth}px`;
    this.surfaceEl.style.height = `${this.surfaceHeight}px`;

    this.canvas.width = this.surfaceWidth;
    this.canvas.height = this.surfaceHeight;
    this.canvas.style.width = `${this.surfaceWidth}px`;
    this.canvas.style.height = `${this.surfaceHeight}px`;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  centerBoard() {
    const container = document.getElementById('wb-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.panX = Math.round((rect.width - this.surfaceWidth) / 2);
    this.panY = Math.round((rect.height - this.surfaceHeight) / 2);
    this.updateSurfaceTransform();
  }

  updateSurfaceTransform() {
    if (!this.surfaceEl) this.surfaceEl = document.getElementById('wb-board-surface');
    if (!this.surfaceEl) return;
    this.surfaceEl.style.transform = `translate3d(${Math.round(this.panX)}px, ${Math.round(this.panY)}px, 0px)`;
  }

  initTools() {
    // Инструменты черчения и перемещения
    document.querySelectorAll('.wb-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wb-tool-btn').forEach(b => {
          b.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-400');
          b.classList.add('bg-slate-900', 'text-slate-300', 'border-slate-800');
        });
        btn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-400');
        btn.classList.remove('bg-slate-900', 'text-slate-300', 'border-slate-800');
        this.currentTool = btn.dataset.tool;

        if (this.canvas) {
          this.canvas.style.cursor = (this.currentTool === 'pan') ? 'grab' : 'crosshair';
        }
      });
    });

    // Палитра цветов
    document.querySelectorAll('.wb-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wb-color-btn').forEach(b => {
          b.classList.remove('border-white', 'scale-110', 'shadow-neon-cyan');
          b.classList.add('border-transparent');
        });
        btn.classList.add('border-white', 'scale-110', 'shadow-neon-cyan');
        btn.classList.remove('border-transparent');
        this.currentColor = btn.dataset.color;
        const dot = document.getElementById('wb-size-dot-preview');
        if (dot) {
          dot.style.backgroundColor = this.currentColor;
          dot.style.boxShadow = `0 0 ${this.currentSize + 3}px ${this.currentColor}`;
        }
      });
    });

    // Гибкая регулировка размера полоски (слайдер + пресеты)
    const sizeSlider = document.getElementById('wb-size-slider');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', (e) => {
        this.setSize(parseInt(e.target.value, 10));
      });
    }

    document.querySelectorAll('.wb-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sz = parseInt(btn.dataset.size, 10) || 4;
        this.setSize(sz);
      });
    });

    // Переключение режима доски ("Пустая доска" / "Сетка Oxy")
    document.getElementById('wb-toggle-mode-btn')?.addEventListener('click', () => {
      this.boardMode = (this.boardMode === 'oxy') ? 'blank' : 'oxy';
      this.updateModeButton();
      this.renderBackgroundGrid();
      this.renderReferenceLayer();
      showToast(this.boardMode === 'blank' ? '📝 Режим: Пустая доска' : '📐 Режим: Сетка Oxy', 'info');
    });

    // Обработчики окна ввода текста
    this.initTextEditorBox();

    // Undo / Redo
    document.getElementById('wb-undo-btn')?.addEventListener('click', () => this.undo());
    document.getElementById('wb-redo-btn')?.addEventListener('click', () => this.redo());

    // Возврат доски в центр
    document.getElementById('wb-center-btn')?.addEventListener('click', () => {
      this.centerBoard();
      showToast('🎯 Доска отцентрирована', 'info');
    });
    document.getElementById('wb-recenter-pill')?.addEventListener('click', () => {
      this.centerBoard();
      showToast('🎯 Доска отцентрирована', 'info');
    });

    // Очистить
    document.getElementById('wb-clear-btn')?.addEventListener('click', () => {
      if (confirm('Очистить все нарисованное на доске?')) {
        this.saveStateToUndo();
        this.clearCanvas();
      }
    });

    // Скачать PNG
    document.getElementById('wb-download-btn')?.addEventListener('click', () => this.downloadImage());

    // Сохранить в работу
    document.getElementById('wb-save-btn')?.addEventListener('click', () => this.saveToState());

    // Сверить с эталоном
    document.getElementById('wb-toggle-reference-btn')?.addEventListener('click', () => this.toggleReference());

    // Закрыть
    document.getElementById('wb-close-btn')?.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Раскрытие полного условия
    const expandBtn = document.getElementById('wb-expand-question-btn');
    const fullQuestion = document.getElementById('wb-question-full');
    if (expandBtn && fullQuestion) {
      expandBtn.addEventListener('click', () => {
        const isHidden = fullQuestion.classList.contains('hidden');
        if (isHidden) {
          fullQuestion.classList.remove('hidden');
          expandBtn.textContent = 'Свернуть';
        } else {
          fullQuestion.classList.add('hidden');
          expandBtn.textContent = 'Развернуть';
        }
      });
    }

    // Горячие клавиши Ctrl+Z, Ctrl+Y
    window.addEventListener('keydown', (e) => {
      if (this.modal && !this.modal.classList.contains('hidden')) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          this.undo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
          e.preventDefault();
          this.redo();
        } else if (e.key === 'Escape') {
          this.close();
        }
      }
    });
  }

  initEventListeners() {
    const canvas = this.canvas;
    const container = document.getElementById('wb-canvas-container');

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        clientX: e.clientX,
        clientY: e.clientY
      };
    };

    // Pointer Down
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Если 2 пальца: мгновенно переключаемся в режим двухпальцевого панорамирования!
      if (this.activePointers.size >= 2) {
        if (this.isDrawing) {
          this.isDrawing = false;
          this.strokePoints = [];
        }
        this.isTwoFingerPanning = true;
        const pts = Array.from(this.activePointers.values());
        this.lastPanMidX = (pts[0].x + pts[1].x) / 2;
        this.lastPanMidY = (pts[0].y + pts[1].y) / 2;
        return;
      }

      // Если выбран инструмент "Двигать" (pan) или средняя кнопка мыши:
      if (this.currentTool === 'pan' || e.button === 1) {
        this.isPanToolDragging = true;
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
        canvas.style.cursor = 'grabbing';
        return;
      }

      // Иначе: обычное рисование выбранным инструментом
      const pos = getPos(e);
      this.isDrawing = true;
      this.startX = pos.x;
      this.startY = pos.y;
      this.lastX = pos.x;
      this.lastY = pos.y;

      if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
        this.saveStateToUndo();
        this.strokePoints = [{ x: pos.x, y: pos.y }];
        this.drawPoint(pos.x, pos.y);
      } else if (this.currentTool === 'line') {
        this.saveStateToUndo();
        this.previewSnapshot = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else if (this.currentTool === 'point') {
        this.saveStateToUndo();
        this.placeMathPoint(pos.x, pos.y);
        this.isDrawing = false;
      } else if (this.currentTool === 'text') {
        this.openTextEditor(pos.x, pos.y, e.clientX, e.clientY);
        this.isDrawing = false;
      }
    });

    // Pointer Move
    canvas.addEventListener('pointermove', (e) => {
      if (this.activePointers.has(e.pointerId)) {
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      const pos = getPos(e);
      this.updateCoordsTooltip(pos.x, pos.y);

      // 1. Двухпальцевое перемещение (Pinch / Pan с двух пальцев)
      if (this.activePointers.size >= 2) {
        const pts = Array.from(this.activePointers.values());
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const dx = midX - this.lastPanMidX;
        const dy = midY - this.lastPanMidY;
        this.panX += dx;
        this.panY += dy;
        this.lastPanMidX = midX;
        this.lastPanMidY = midY;
        this.updateSurfaceTransform();
        return;
      }

      // 2. Однопальцевое перемещение инструментом "Двигать" (pan)
      if (this.isPanToolDragging) {
        const dx = e.clientX - this.lastPanX;
        const dy = e.clientY - this.lastPanY;
        this.panX += dx;
        this.panY += dy;
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
        this.updateSurfaceTransform();
        return;
      }

      // 3. Рисование активным инструментом
      if (!this.isDrawing) return;

      if (this.currentTool === 'pen') {
        this.strokePoints.push({ x: pos.x, y: pos.y });
        this.drawSmoothStroke();
      } else if (this.currentTool === 'eraser') {
        this.eraseAt(pos.x, pos.y);
      } else if (this.currentTool === 'line' && this.previewSnapshot) {
        this.ctx.putImageData(this.previewSnapshot, 0, 0);
        this.drawLine(this.startX, this.startY, pos.x, pos.y, true);
      }
    });

    // Pointer Up & Cancel
    const endInteraction = (e) => {
      this.activePointers.delete(e.pointerId);
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}

      if (this.activePointers.size < 2) {
        this.isTwoFingerPanning = false;
      }

      if (this.isPanToolDragging) {
        this.isPanToolDragging = false;
        canvas.style.cursor = (this.currentTool === 'pan') ? 'grab' : 'crosshair';
      }

      if (!this.isDrawing) return;
      this.isDrawing = false;

      if (this.currentTool === 'line') {
        const pos = getPos(e);
        if (this.previewSnapshot) {
          this.ctx.putImageData(this.previewSnapshot, 0, 0);
          this.previewSnapshot = null;
        }
        this.drawLine(this.startX, this.startY, pos.x, pos.y, false);
      }
      this.strokePoints = [];
    };

    canvas.addEventListener('pointerup', endInteraction);
    canvas.addEventListener('pointercancel', endInteraction);

    // Колесо мыши / трекпад: плавное перемещение доски
    if (container) {
      container.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.panX -= e.deltaX;
        this.panY -= e.deltaY;
        this.updateSurfaceTransform();
      }, { passive: false });
    }
  }

  open(task = null, variantNum = 1) {
    if (!task) {
      const selectedTasks = (typeof state !== 'undefined' && state.selectedTaskIds)
        ? state.selectedTaskIds.map(id => state.taskBank.find(t => t.id === id)).filter(Boolean)
        : [];
      if (selectedTasks.length > 0) {
        task = selectedTasks[0];
        variantNum = (typeof state !== 'undefined' && state.activeVariantView) ? state.activeVariantView : 1;
      } else {
        task = {
          id: 'free-scratchpad',
          title: 'Интерактивная доска для черчения графиков',
          categoryName: 'Координатная плоскость Oxy',
          variants: [{
            question: 'Свободное построение графиков функций, нанесение ключевых точек и асимптот.',
            graphConfig: {
              fn: 'x^2 - 4',
              xMin: -6,
              xMax: 6,
              yMin: -6,
              yMax: 6
            }
          }]
        };
      }
    }
    this.currentTask = task;
    this.currentVariantNum = variantNum;
    const varData = task.variants[(variantNum - 1) % task.variants.length];
    this.graphConfig = varData.graphConfig;

    // Автоматический выбор режима: для кратких ответов и уравнений — СТРОГО ПУСТАЯ ДОСКА!
    const isShortAnswer = task ? (task.taskType === 'short_answer') : false;
    this.boardMode = isShortAnswer ? 'blank' : 'oxy';
    this.updateModeButton();

    // Заполнение условий задания в шапке
    const titleEl = document.getElementById('wb-task-title');
    const badgeEl = document.getElementById('wb-variant-badge');
    const descEl = document.getElementById('wb-task-desc');
    const questionTextEl = document.getElementById('wb-question-text');
    const questionFullEl = document.getElementById('wb-question-full');

    if (titleEl) titleEl.textContent = task.title;
    if (badgeEl) badgeEl.textContent = `Вариант ${variantNum}`;
    if (descEl) descEl.textContent = task.categoryName || '';
    if (questionTextEl) questionTextEl.textContent = varData.question.replace(/\n/g, '  |  ');
    if (questionFullEl) {
      questionFullEl.textContent = varData.question;
      questionFullEl.classList.add('hidden');
    }
    const expandBtn = document.getElementById('wb-expand-question-btn');
    if (expandBtn) expandBtn.textContent = 'Развернуть';

    this.modal.classList.remove('hidden');

    // Настройка поверхности и центрирование доски
    setTimeout(() => {
      this.initSurface();
      this.centerBoard();
      this.renderBackgroundGrid();
      this.renderReferenceLayer();
      this.loadSavedDrawing();
    }, 50);
  }

  close() {
    if (this.modal) this.modal.classList.add('hidden');
    this.currentTask = null;
  }

  updateModeButton() {
    const btn = document.getElementById('wb-toggle-mode-btn');
    const icon = document.getElementById('wb-mode-icon');
    const text = document.getElementById('wb-mode-text');
    if (!btn) return;

    if (this.boardMode === 'blank') {
      if (icon) icon.textContent = '📝';
      if (text) text.textContent = 'Пустая доска';
      btn.className = 'px-2.5 sm:px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition';
    } else {
      if (icon) icon.textContent = '📐';
      if (text) text.textContent = 'Сетка Oxy';
      btn.className = 'px-2.5 sm:px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition';
    }
  }

  renderBackgroundGrid() {
    const gridLayer = document.getElementById('wb-grid-layer');
    if (!gridLayer) return;

    if (this.boardMode === 'blank' || (this.currentTask && this.currentTask.taskType === 'short_answer' && this.boardMode !== 'oxy')) {
      // 100% ПУСТАЯ ДОСКА ДЛЯ УРАВНЕНИЙ И ВЫЧИСЛЕНИЙ:
      // Бесшовная тетрадная клетка 28px по всей поверхности 2400x2000
      gridLayer.innerHTML = `
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wb-blank-notebook-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wb-blank-notebook-grid)" />
        </svg>
      `;
      return;
    }

    if (!this.graphConfig) return;

    // Для заданий на построение графиков: сетка Oxy 1600x1200 по центру поверхности
    const svg = GraphRenderer.renderSVG({
      ...this.graphConfig,
      width: 1600,
      height: 1200,
      theme: 'neon',
      animated: false,
      blankGrid: true
    });

    gridLayer.innerHTML = `
      <div style="position: absolute; left: 400px; top: 400px; width: 1600px; height: 1200px;">
        ${svg}
      </div>
    `;
  }

  renderReferenceLayer() {
    const refLayer = document.getElementById('wb-reference-layer');
    const toggleBtn = document.getElementById('wb-toggle-reference-btn');
    if (!refLayer) return;

    if (this.boardMode === 'blank' || (this.currentTask && this.currentTask.taskType === 'short_answer' && this.boardMode !== 'oxy')) {
      refLayer.innerHTML = '';
      refLayer.style.opacity = '0';
      if (toggleBtn) toggleBtn.classList.add('hidden');
      return;
    }

    if (toggleBtn) toggleBtn.classList.remove('hidden');
    if (!this.graphConfig) return;

    const svg = GraphRenderer.renderSVG({
      ...this.graphConfig,
      width: 1600,
      height: 1200,
      theme: 'neon',
      animated: false
    });

    refLayer.innerHTML = `
      <div style="position: absolute; left: 400px; top: 400px; width: 1600px; height: 1200px;">
        ${svg}
      </div>
    `;
    this.isReferenceVisible = false;
    refLayer.style.opacity = '0';
    const label = document.getElementById('wb-ref-label');
    if (label) label.textContent = 'Эталон';
  }

  toggleReference() {
    const refLayer = document.getElementById('wb-reference-layer');
    const label = document.getElementById('wb-ref-label');
    if (!refLayer) return;

    this.isReferenceVisible = !this.isReferenceVisible;
    if (this.isReferenceVisible) {
      refLayer.style.opacity = '0.65';
      if (label) label.textContent = 'Скрыть';
      showToast('👁️ Эталонный график наложен полупрозрачно для проверки', 'info');
    } else {
      refLayer.style.opacity = '0';
      if (label) label.textContent = 'Эталон';
    }
  }

  // Математические преобразования координат (пиксели поверхности <-> math X, Y)
  pixelToMath(px, py) {
    const cfg = this.graphConfig || { xMin: -6, xMax: 6, yMin: -6, yMax: 6 };
    // График Oxy находится в координатах: left: 400, top: 400, width: 1600, height: 1200
    const padding = { top: 24, right: 24, bottom: 24, left: 24 };
    const innerW = 1600 - padding.left - padding.right;
    const innerH = 1200 - padding.top - padding.bottom;

    const relX = px - 400 - padding.left;
    const relY = py - 400 - padding.top;

    const mathX = cfg.xMin + (relX / innerW) * (cfg.xMax - cfg.xMin);
    const mathY = cfg.yMax - (relY / innerH) * (cfg.yMax - cfg.yMin);

    return { x: mathX, y: mathY };
  }

  mathToPixel(mx, my) {
    const cfg = this.graphConfig || { xMin: -6, xMax: 6, yMin: -6, yMax: 6 };
    const padding = { top: 24, right: 24, bottom: 24, left: 24 };
    const innerW = 1600 - padding.left - padding.right;
    const innerH = 1200 - padding.top - padding.bottom;

    const px = 400 + padding.left + ((mx - cfg.xMin) / (cfg.xMax - cfg.xMin)) * innerW;
    const py = 400 + padding.top + ((cfg.yMax - my) / (cfg.yMax - cfg.yMin)) * innerH;

    return { x: px, y: py };
  }

  updateCoordsTooltip(px, py) {
    const tooltip = document.getElementById('wb-coords-tooltip');
    if (!tooltip) return;

    if (!this.graphConfig || this.boardMode === 'blank') {
      tooltip.textContent = `x: ${Math.round(px)}, y: ${Math.round(py)}`;
      tooltip.style.opacity = '0.7';
      return;
    }

    const math = this.pixelToMath(px, py);
    const cfg = this.graphConfig;

    if (math.x >= cfg.xMin && math.x <= cfg.xMax && math.y >= cfg.yMin && math.y <= cfg.yMax) {
      tooltip.textContent = `x: ${math.x.toFixed(2)}, y: ${math.y.toFixed(2)}`;
      tooltip.style.opacity = '1';
    } else {
      tooltip.textContent = `x: ${math.x.toFixed(1)}, y: ${math.y.toFixed(1)}`;
      tooltip.style.opacity = '0.4';
    }
  }

  // Отрисовка сглаженного штриха пером (кривые Безье)
  drawSmoothStroke() {
    const pts = this.strokePoints;
    if (pts.length < 2) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = this.currentColor;
    ctx.lineWidth = this.currentSize;

    // Неоновое свечение штриха
    ctx.shadowColor = this.currentColor;
    ctx.shadowBlur = this.currentSize * 2.2;

    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    const midX = (pts[pts.length - 2].x + pts[pts.length - 1].x) / 2;
    const midY = (pts[pts.length - 2].y + pts[pts.length - 1].y) / 2;
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, midX, midY);
    ctx.stroke();

    ctx.restore();
  }

  drawPoint(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = this.currentColor;
    ctx.shadowColor = this.currentColor;
    ctx.shadowBlur = this.currentSize * 2;
    ctx.beginPath();
    ctx.arc(x, y, this.currentSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLine(x1, y1, x2, y2, isPreview = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.currentColor;
    ctx.lineWidth = this.currentSize;
    ctx.shadowColor = this.currentColor;
    ctx.shadowBlur = this.currentSize * 2;
    if (isPreview) {
      ctx.setLineDash([6, 6]);
      ctx.globalAlpha = 0.8;
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  // Установка точки с привязкой и координатами
  placeMathPoint(clickX, clickY) {
    const math = this.pixelToMath(clickX, clickY);
    const snapX = Math.round(math.x * 2) / 2;
    const snapY = Math.round(math.y * 2) / 2;
    const snappedPixel = this.mathToPixel(snapX, snapY);
    const dist = Math.hypot(snappedPixel.x - clickX, snappedPixel.y - clickY);

    let targetX = clickX;
    let targetY = clickY;
    let labelMathX = Number(math.x.toFixed(1));
    let labelMathY = Number(math.y.toFixed(1));

    if (dist < 18) {
      targetX = snappedPixel.x;
      targetY = snappedPixel.y;
      labelMathX = snapX;
      labelMathY = snapY;
    }

    const pixel = { x: targetX, y: targetY };
    const ctx = this.ctx;

    ctx.save();
    ctx.shadowColor = this.currentColor;
    ctx.shadowBlur = 12;

    ctx.fillStyle = this.currentColor;
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, Math.max(5, this.currentSize * 1.2), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, Math.max(2, this.currentSize * 0.4), 0, Math.PI * 2);
    ctx.fill();

    // Подпись координат
    const label = `(${labelMathX}; ${labelMathY})`;
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(label, pixel.x + 8, pixel.y - 8);

    ctx.restore();
  }

  eraseAt(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, this.currentSize * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // История Undo / Redo
  saveStateToUndo() {
    if (this.undoStack.length >= this.maxHistory) {
      this.undoStack.shift();
    }
    const data = this.canvas.toDataURL();
    this.undoStack.push(data);
    this.redoStack = [];
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const currentState = this.canvas.toDataURL();
    this.redoStack.push(currentState);

    const prevState = this.undoStack.pop();
    this.restoreImage(prevState);
    this.updateUndoRedoButtons();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const currentState = this.canvas.toDataURL();
    this.undoStack.push(currentState);

    const nextState = this.redoStack.pop();
    this.restoreImage(nextState);
    this.updateUndoRedoButtons();
  }

  restoreImage(dataUrl) {
    const img = new Image();
    img.onload = () => {
      this.clearCanvas();
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('wb-undo-btn');
    const redoBtn = document.getElementById('wb-redo-btn');
    if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
  }

  // Сохранение и загрузка чертежа студента
  saveToState() {
    if (!this.currentTask) return;
    const dataUrl = this.canvas.toDataURL('image/png');

    if (!state.studentDrawings) state.studentDrawings = {};
    state.studentDrawings[this.currentTask.id] = dataUrl;
    state.saveState();

    if (state.activeTab === 'builder') {
      renderBuilderTab();
    }

    showToast('💾 Чертеж сохранен на карточку задания!', 'success');
  }

  loadSavedDrawing() {
    this.clearCanvas();
    this.undoStack = [];
    this.redoStack = [];
    this.updateUndoRedoButtons();

    if (!this.currentTask || !state.studentDrawings) return;
    const saved = state.studentDrawings[this.currentTask.id];
    if (saved) {
      this.restoreImage(saved);
      showToast('Загружен ваш сохраненный чертеж', 'info');
    }
  }

  setSize(size) {
    this.currentSize = Math.max(1, Math.min(32, size));
    const slider = document.getElementById('wb-size-slider');
    if (slider) slider.value = this.currentSize;
    const valEl = document.getElementById('wb-size-val');
    if (valEl) valEl.textContent = `${this.currentSize}px`;

    const dot = document.getElementById('wb-size-dot-preview');
    if (dot) {
      dot.style.width = `${Math.min(this.currentSize, 18)}px`;
      dot.style.height = `${Math.min(this.currentSize, 18)}px`;
      dot.style.backgroundColor = this.currentColor;
      dot.style.boxShadow = `0 0 ${this.currentSize + 3}px ${this.currentColor}`;
    }

    document.querySelectorAll('.wb-size-btn').forEach(b => {
      const bSize = parseInt(b.dataset.size, 10);
      if (bSize === this.currentSize) {
        b.classList.add('border-cyan-400', 'bg-cyan-950', 'text-cyan-300', 'font-bold');
        b.classList.remove('border-slate-800', 'bg-slate-900', 'text-slate-300');
      } else {
        b.classList.remove('border-cyan-400', 'bg-cyan-950', 'text-cyan-300', 'font-bold');
        b.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-300');
      }
    });
  }

  // Окно ввода текста на доске
  initTextEditorBox() {
    const confirmBtn = document.getElementById('wb-text-confirm-btn');
    const cancelBtn = document.getElementById('wb-text-cancel-btn');
    const cancelBtn2 = document.getElementById('wb-text-cancel-btn-2');
    const input = document.getElementById('wb-text-input');

    if (confirmBtn) confirmBtn.addEventListener('click', () => this.applyTextNote());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeTextEditor());
    if (cancelBtn2) cancelBtn2.addEventListener('click', () => this.closeTextEditor());

    document.querySelectorAll('.wb-math-sym').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!input) return;
        const sym = btn.dataset.sym || btn.textContent;
        const start = input.selectionStart || input.value.length;
        const end = input.selectionEnd || input.value.length;
        const val = input.value;
        input.value = val.substring(0, start) + sym + val.substring(end);
        input.focus();
        input.selectionStart = input.selectionEnd = start + sym.length;
      });
    });

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.applyTextNote();
        } else if (e.key === 'Escape') {
          this.closeTextEditor();
        }
      });
    }
  }

  openTextEditor(canvasX, canvasY, screenX, screenY) {
    const box = document.getElementById('wb-text-editor-box');
    const container = document.getElementById('wb-canvas-container');
    const input = document.getElementById('wb-text-input');
    if (!box || !container || !input) return;

    this.pendingTextX = canvasX;
    this.pendingTextY = canvasY;

    const containerRect = container.getBoundingClientRect();
    const boxWidth = 320;
    const boxHeight = 150;

    // Позиционируем окно ввода относительно видимого контейнера
    let left = screenX ? (screenX - containerRect.left) : (canvasX + this.panX);
    let top = screenY ? (screenY - containerRect.top) : (canvasY + this.panY);

    left = Math.max(10, Math.min(left, containerRect.width - boxWidth - 10));
    top = Math.max(10, Math.min(top, containerRect.height - boxHeight - 10));

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.classList.remove('hidden');

    input.value = '';
    setTimeout(() => input.focus(), 60);
  }

  closeTextEditor() {
    const box = document.getElementById('wb-text-editor-box');
    if (box) box.classList.add('hidden');
    this.pendingTextX = null;
    this.pendingTextY = null;
  }

  applyTextNote() {
    const input = document.getElementById('wb-text-input');
    const sizeSelect = document.getElementById('wb-text-size-select');
    if (!input || this.pendingTextX === null) return;

    const text = input.value.trim();
    if (text) {
      this.saveStateToUndo();
      const fontSize = parseInt(sizeSelect ? sizeSelect.value : 16, 10) || 16;
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = this.currentColor;
      ctx.shadowColor = this.currentColor;
      ctx.shadowBlur = 8;

      const lines = text.split('\n');
      const lineHeight = fontSize * 1.35;
      lines.forEach((line, idx) => {
        ctx.fillText(line, this.pendingTextX, this.pendingTextY + (idx * lineHeight));
      });

      ctx.restore();
    }

    this.closeTextEditor();
  }

  downloadImage() {
    const link = document.createElement('a');
    link.download = `solution_${this.currentTask ? this.currentTask.id : 'graph'}_var${this.currentVariantNum}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    showToast('Рисунок решения сохранен как PNG', 'success');
  }
}

const StudentBoard = new StudentBoardController();

if (typeof window !== 'undefined') {
  window.StudentBoard = StudentBoard;
}
