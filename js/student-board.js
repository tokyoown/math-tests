/**
 * Student Interactive Whiteboard & Graph Drawing Workspace
 * Интерактивная неоновая доска студента для построения графиков и записи решений.
 * Поддерживает мышь, стилус и сенсорные экраны (PointerEvents), сглаживание Безье,
 * инструменты "Перо", "Прямая", "Точка с координатами", "Текст", "Ластик",
 * отмену/повтор действий, сверку с эталоном и сохранение чертежа.
 */

class StudentBoardController {
  constructor() {
    this.modal = null;
    this.canvas = null;
    this.ctx = null;
    this.currentTask = null;
    this.currentVariantNum = 1;
    this.graphConfig = null;

    // Инструменты
    this.currentTool = 'pen'; // 'pen', 'line', 'point', 'text', 'eraser'
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
  }

  init() {
    this.modal = document.getElementById('whiteboard-modal');
    this.canvas = document.getElementById('wb-draw-canvas');
    if (!this.modal || !this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.initEventListeners();
    this.initTools();
  }

  initTools() {
    // Инструменты
    document.querySelectorAll('.wb-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wb-tool-btn').forEach(b => {
          b.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-400');
          b.classList.add('bg-slate-900', 'text-slate-300', 'border-slate-800');
        });
        btn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-400');
        btn.classList.remove('bg-slate-900', 'text-slate-300', 'border-slate-800');
        this.currentTool = btn.dataset.tool;
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
      });
    });

    // Размеры кисти
    document.querySelectorAll('.wb-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wb-size-btn').forEach(b => {
          b.classList.remove('border-cyan-400', 'bg-cyan-950', 'text-cyan-300', 'font-bold');
          b.classList.add('border-slate-700', 'bg-slate-900', 'text-slate-300');
        });
        btn.classList.add('border-cyan-400', 'bg-cyan-950', 'text-cyan-300', 'font-bold');
        btn.classList.remove('border-slate-700', 'bg-slate-900', 'text-slate-300');
        this.currentSize = parseInt(btn.dataset.size, 10) || 4;
      });
    });

    // Undo / Redo
    document.getElementById('wb-undo-btn')?.addEventListener('click', () => this.undo());
    document.getElementById('wb-redo-btn')?.addEventListener('click', () => this.redo());

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

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        clientX: e.clientX,
        clientY: e.clientY
      };
    };

    // Pointer Down
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
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
        this.saveStateToUndo();
        this.placeTextNote(pos.x, pos.y);
        this.isDrawing = false;
      }
    });

    // Pointer Move
    canvas.addEventListener('pointermove', (e) => {
      const pos = getPos(e);
      this.updateCoordsTooltip(pos.x, pos.y);

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
    const endDrawing = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}

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

    canvas.addEventListener('pointerup', endDrawing);
    canvas.addEventListener('pointercancel', endDrawing);
  }

  open(task, variantNum = 1) {
    this.currentTask = task;
    this.currentVariantNum = variantNum;
    const varData = task.variants[(variantNum - 1) % task.variants.length];
    this.graphConfig = varData.graphConfig;

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

    // Настройка размеров Canvas с учетом Retina Display
    setTimeout(() => {
      this.resizeCanvas();
      this.renderBackgroundGrid();
      this.renderReferenceLayer();
      this.loadSavedDrawing();
    }, 50);
  }

  close() {
    if (this.modal) this.modal.classList.add('hidden');
    this.currentTask = null;
  }

  resizeCanvas() {
    const container = document.getElementById('wb-canvas-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    this.ctx.scale(dpr, dpr);
    this.dpr = dpr;
    this.logicalWidth = rect.width;
    this.logicalHeight = rect.height;
  }

  renderBackgroundGrid() {
    const gridLayer = document.getElementById('wb-grid-layer');
    if (!gridLayer || !this.graphConfig) return;

    const svg = GraphRenderer.renderSVG({
      ...this.graphConfig,
      width: Math.round(this.logicalWidth),
      height: Math.round(this.logicalHeight),
      theme: 'neon',
      animated: false,
      blankGrid: true
    });

    gridLayer.innerHTML = svg;
  }

  renderReferenceLayer() {
    const refLayer = document.getElementById('wb-reference-layer');
    if (!refLayer || !this.graphConfig) return;

    const svg = GraphRenderer.renderSVG({
      ...this.graphConfig,
      width: Math.round(this.logicalWidth),
      height: Math.round(this.logicalHeight),
      theme: 'neon',
      animated: false
    });

    refLayer.innerHTML = svg;
    this.isReferenceVisible = false;
    refLayer.style.opacity = '0';
    const label = document.getElementById('wb-ref-label');
    if (label) label.textContent = 'Сверить с эталоном';
  }

  toggleReference() {
    const refLayer = document.getElementById('wb-reference-layer');
    const label = document.getElementById('wb-ref-label');
    if (!refLayer) return;

    this.isReferenceVisible = !this.isReferenceVisible;
    if (this.isReferenceVisible) {
      refLayer.style.opacity = '0.65';
      if (label) label.textContent = 'Скрыть эталон';
      showToast('👁️ Эталонный график наложен полупрозрачно для проверки', 'info');
    } else {
      refLayer.style.opacity = '0';
      if (label) label.textContent = 'Сверить с эталоном';
    }
  }

  // Математические преобразования координат (пиксели <-> math X, Y)
  pixelToMath(px, py) {
    const cfg = this.graphConfig;
    const padding = { top: 24, right: 24, bottom: 24, left: 24 };
    const innerW = this.logicalWidth - padding.left - padding.right;
    const innerH = this.logicalHeight - padding.top - padding.bottom;

    const mathX = cfg.xMin + ((px - padding.left) / innerW) * (cfg.xMax - cfg.xMin);
    const mathY = cfg.yMax - ((py - padding.top) / innerH) * (cfg.yMax - cfg.yMin);

    return { x: mathX, y: mathY };
  }

  mathToPixel(mx, my) {
    const cfg = this.graphConfig;
    const padding = { top: 24, right: 24, bottom: 24, left: 24 };
    const innerW = this.logicalWidth - padding.left - padding.right;
    const innerH = this.logicalHeight - padding.top - padding.bottom;

    const px = padding.left + ((mx - cfg.xMin) / (cfg.xMax - cfg.xMin)) * innerW;
    const py = padding.top + ((cfg.yMax - my) / (cfg.yMax - cfg.yMin)) * innerH;

    return { x: px, y: py };
  }

  updateCoordsTooltip(px, py) {
    const tooltip = document.getElementById('wb-coords-tooltip');
    if (!tooltip || !this.graphConfig) return;

    const math = this.pixelToMath(px, py);
    const cfg = this.graphConfig;

    if (math.x >= cfg.xMin && math.x <= cfg.xMax && math.y >= cfg.yMin && math.y <= cfg.yMax) {
      tooltip.textContent = `x: ${math.x.toFixed(2)}, y: ${math.y.toFixed(2)}`;
      tooltip.style.opacity = '1';
    } else {
      tooltip.style.opacity = '0.4';
    }
  }

  // Отрисовка сглаженного штриха (квадратичные кривые Безье)
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

  // Установка математической точки с координатами и привязкой к сетке
  placeMathPoint(clickX, clickY) {
    const math = this.pixelToMath(clickX, clickY);
    
    // Привязка к ближайшей половине деления или целому числу (snap to grid)
    const snapX = Math.round(math.x * 2) / 2;
    const snapY = Math.round(math.y * 2) / 2;

    const pixel = this.mathToPixel(snapX, snapY);
    const ctx = this.ctx;

    ctx.save();
    // Светящееся кольцо
    ctx.shadowColor = this.currentColor;
    ctx.shadowBlur = 12;

    ctx.fillStyle = this.currentColor;
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, Math.max(5, this.currentSize * 1.2), 0, Math.PI * 2);
    ctx.fill();

    // Белый центр
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, Math.max(2, this.currentSize * 0.4), 0, Math.PI * 2);
    ctx.fill();

    // Подпись координат (например, "(2; -3)")
    const label = `(${snapX}; ${snapY})`;
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(label, pixel.x + 8, pixel.y - 8);

    ctx.restore();
  }

  // Ввод текстовой заметки прямо на доске
  placeTextNote(x, y) {
    const text = prompt('Введите математическое пояснение или формулу (например, вершина параболы (1; -4)):');
    if (!text || !text.trim()) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.font = `${Math.max(13, this.currentSize * 3)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = this.currentColor;
    ctx.shadowColor = this.currentColor;
    ctx.shadowBlur = 8;
    ctx.fillText(text.trim(), x, y);
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
      this.ctx.drawImage(img, 0, 0, this.logicalWidth, this.logicalHeight);
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
