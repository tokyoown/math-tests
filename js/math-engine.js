/**
 * Math Engine & Neon Animated SVG Graph Renderer
 * Высокоточный математический движок с неоновой киберпанк-стилизацией,
 * медленной плавной лазерной анимацией и автоматическим анализом функций.
 */

class MathEngine {
  static compile(exprStr) {
    if (!exprStr || typeof exprStr !== 'string') return null;

    const trimmed = exprStr.trim();
    if (!trimmed) return null;

    if (!MathEngine._fnCache) MathEngine._fnCache = new Map();
    if (MathEngine._fnCache.has(trimmed)) return MathEngine._fnCache.get(trimmed);

    let s = trimmed;

    s = s.replace(/(\d+),(\d+)/g, '$1.$2');
    s = s.replace(/\|([^|]+)\|/g, 'abs($1)');
    s = s.replace(/(\d+)([a-zA-Z(])/g, '$1*$2');
    s = s.replace(/([)])(\d+|[a-zA-Z(])/g, '$1*$2');
    s = s.replace(/([xX])([a-zA-Z(])/g, '$1*$2');
    s = s.replace(/\^/g, '**');
    // Исправление синтаксиса JS ES2016: '-x**2' недопустимо без скобок, заменяем на '-(x**2)'
    s = s.replace(/(^|[^a-zA-Z0-9_)])\s*-\s*([a-zA-Z0-9_]+)\s*\*\*\s*(\d+)/g, '$1-($2**$3)');
    // Очистка ошибочных висячих знаков умножения (например '*x + 3' -> 'x + 3')
    s = s.replace(/^\s*\*+/g, '');
    s = s.replace(/([+\-(=\/])\s*\*+/g, '$1');

    s = s.replace(/\bpi\b/gi, 'Math.PI');
    s = s.replace(/\be\b/g, 'Math.E');

    const funcs = [
      ['sin', 'Math.sin'],
      ['cos', 'Math.cos'],
      ['tan', 'Math.tan'],
      ['tg', 'Math.tan'],
      ['ctg', '(1/Math.tan'],
      ['asin', 'Math.asin'],
      ['acos', 'Math.acos'],
      ['atan', 'Math.atan'],
      ['arctg', 'Math.atan'],
      ['sqrt', 'Math.sqrt'],
      ['cbrt', 'Math.cbrt'],
      ['abs', 'Math.abs'],
      ['exp', 'Math.exp'],
      ['ln', 'Math.log'],
      ['lg', 'Math.log10'],
      ['log10', 'Math.log10'],
      ['log2', 'Math.log2'],
      ['log', 'Math.log']
    ];

    for (const [fName, fMath] of funcs) {
      const reg = new RegExp('\\b' + fName + '\\b', 'g');
      s = s.replace(reg, fMath);
    }

    try {
      const fn = new Function('x', `"use strict"; return (${s});`);
      fn(1);
      MathEngine._fnCache.set(trimmed, fn);
      return fn;
    } catch (err) {
      console.warn('Ошибка компиляции формулы:', exprStr, s, err);
      return null;
    }
  }

  static evalAt(fn, x) {
    try {
      const y = fn(x);
      if (typeof y !== 'number' || isNaN(y) || !isFinite(y)) return null;
      return y;
    } catch {
      return null;
    }
  }

  static analyze(fn, xMin = -5, xMax = 5, step = 0.05) {
    const points = [];
    let prevY = null;
    let prevX = null;
    const zeros = [];
    const extrema = [];

    for (let x = xMin; x <= xMax; x += step) {
      const y = this.evalAt(fn, x);
      if (y !== null) {
        if (prevY !== null) {
          if ((prevY < 0 && y > 0) || (prevY > 0 && y < 0)) {
            const zeroX = prevX - prevY * (x - prevX) / (y - prevY);
            zeros.push({ x: Number(zeroX.toFixed(2)), y: 0 });
          } else if (Math.abs(y) < 1e-4) {
            zeros.push({ x: Number(x.toFixed(2)), y: 0 });
          }
        }
        points.push({ x, y });
      }
      prevX = x;
      prevY = y;
    }

    for (let i = 1; i < points.length - 1; i++) {
      const pPrev = points[i - 1];
      const pCurr = points[i];
      const pNext = points[i + 1];

      if (pCurr.y > pPrev.y && pCurr.y > pNext.y) {
        extrema.push({ type: 'max', x: Number(pCurr.x.toFixed(2)), y: Number(pCurr.y.toFixed(2)) });
      } else if (pCurr.y < pPrev.y && pCurr.y < pNext.y) {
        extrema.push({ type: 'min', x: Number(pCurr.x.toFixed(2)), y: Number(pCurr.y.toFixed(2)) });
      }
    }

    return { zeros, extrema };
  }
}

class GraphRenderer {
  /**
   * Неоновый рендеринг SVG с медленной плавной анимацией (2.8 сек)
   */
  static renderSVG(options = {}) {
    const {
      cacheKey = null,
      width = 400,
      height = 320,
      xMin = -6,
      xMax = 6,
      yMin = -5,
      yMax = 5,
      stepX = 1,
      stepY = 1,
      functions = [],
      points = [],
      asymptotes = [],
      segments = [],
      shading = null,
      title = '',
      showGrid = true,
      showLabels = true,
      theme = 'neon', // 'neon' по умолчанию
      showOrigin = true,
      animated = true,
      highlightStep = null,
      blankGrid = false, // Режим чистой сетки для самостоятельного построения студентом
      samplesCount = null,
      animationDuration = 2.8 // Медленная, плавная, шелковистая анимация (2.8s)
    } = options;

    if (cacheKey && GraphRenderer._svgCache && GraphRenderer._svgCache[cacheKey]) {
      return GraphRenderer._svgCache[cacheKey];
    }

    const padding = { top: 24, right: 24, bottom: 24, left: 24 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const scaleX = (x) => padding.left + ((x - xMin) / (xMax - xMin)) * innerW;
    const scaleY = (y) => padding.top + ((yMax - y) / (yMax - yMin)) * innerH;

    const isClean = theme === 'clean'; // Для чистовой печати

    // Неоновая палитра
    const bgColor = isClean ? '#ffffff' : '#070b16';
    const gridMajorColor = isClean ? '#e2e8f0' : 'rgba(0, 240, 255, 0.08)';
    const axisColor = isClean ? '#334155' : '#00f0ff';
    const textColor = isClean ? '#64748b' : '#94a3b8';
    const textBoldColor = isClean ? '#0f172a' : '#00f0ff';
    const defaultCurveColor = isClean ? '#2563eb' : '#00f0ff';
    const secondaryCurveColor = isClean ? '#dc2626' : '#ff2d75';

    const originPixelX = scaleX(0);
    const originPixelY = scaleY(0);

    const graphId = 'g_' + Math.random().toString(36).substring(2, 9);

    let svg = `<svg id="${graphId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="math-graph-svg" style="background:${bgColor}; border-radius: 10px; font-family: 'JetBrains Mono', 'Inter', monospace; user-select: none; max-width: 100%; height: auto; display: block;">`;

    // Определения неонового свечения и фильтров
    svg += `<defs>
      <filter id="neon-glow-${graphId}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur1" />
        <feGaussianBlur stdDeviation="5" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <marker id="arr-x-${graphId}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 2 L 7 5 L 0 8 z" fill="${axisColor}" />
      </marker>
      <marker id="arr-y-${graphId}" viewBox="0 0 10 10" refX="5" refY="4" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M 2 7 L 5 0 L 8 7 z" fill="${axisColor}" />
      </marker>
    </defs>`;

    if (animated && !isClean) {
      svg += `<style>
        #${graphId} .neon-path {
          stroke-dasharray: 3500;
          stroke-dashoffset: 3500;
          animation: drawNeonSlow_${graphId} ${animationDuration}s cubic-bezier(0.25, 1, 0.4, 1) forwards;
        }
        @keyframes drawNeonSlow_${graphId} {
          to { stroke-dashoffset: 0; }
        }
        #${graphId} .neon-fade {
          animation: fadeNeonSlow 1s ease-out forwards;
        }
        @keyframes fadeNeonSlow {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        #${graphId} .neon-pulse-ring {
          animation: pulseHalo 2.5s infinite ease-in-out;
        }
        @keyframes pulseHalo {
          0%, 100% { r: 5px; opacity: 0.8; stroke-width: 1.5px; }
          50% { r: 11px; opacity: 0.1; stroke-width: 3px; }
        }
      </style>`;
    }

    // Сетка
    if (showGrid) {
      svg += `<g class="grid" stroke-width="1">`;
      for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
        if (Math.abs(x) < 1e-6) continue;
        const px = scaleX(x);
        svg += `<line x1="${px}" y1="${padding.top}" x2="${px}" y2="${height - padding.bottom}" stroke="${gridMajorColor}" />`;
      }
      for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
        if (Math.abs(y) < 1e-6) continue;
        const py = scaleY(y);
        svg += `<line x1="${padding.left}" y1="${py}" x2="${width - padding.right}" y2="${py}" stroke="${gridMajorColor}" />`;
      }
      svg += `</g>`;
    }

    // Заливка области
    if (shading && shading.xStart !== undefined && shading.xEnd !== undefined) {
      const sX1 = scaleX(shading.xStart);
      const sX2 = scaleX(shading.xEnd);
      const sY1 = padding.top;
      const sY2 = height - padding.bottom;
      svg += `<rect x="${Math.min(sX1, sX2)}" y="${sY1}" width="${Math.abs(sX2 - sX1)}" height="${sY2 - sY1}" fill="${shading.color || 'rgba(0, 240, 255, 0.12)'}" class="neon-fade" />`;
    }

    if (highlightStep === 'intervals') {
      const zeroY = Math.max(padding.top, Math.min(height - padding.bottom, originPixelY));
      svg += `<rect x="${padding.left}" y="${padding.top}" width="${innerW}" height="${zeroY - padding.top}" fill="rgba(16, 232, 151, 0.08)" />`;
      svg += `<rect x="${padding.left}" y="${zeroY}" width="${innerW}" height="${height - padding.bottom - zeroY}" fill="rgba(244, 63, 94, 0.08)" />`;
      svg += `<g class="neon-fade">
        <rect x="${padding.left + 6}" y="${padding.top + 28}" width="54" height="16" rx="4" fill="rgba(16, 232, 151, 0.25)" stroke="#10e897" stroke-width="1" />
        <text x="${padding.left + 33}" y="${padding.top + 40}" fill="#10e897" font-size="9.5" font-weight="700" text-anchor="middle">f(x) > 0</text>
      </g>`;
      svg += `<g class="neon-fade">
        <rect x="${padding.left + 6}" y="${height - padding.bottom - 22}" width="54" height="16" rx="4" fill="rgba(244, 63, 94, 0.25)" stroke="#f43f5e" stroke-width="1" />
        <text x="${padding.left + 33}" y="${height - padding.bottom - 10}" fill="#f43f5e" font-size="9.5" font-weight="700" text-anchor="middle">f(x) < 0</text>
      </g>`;
    }

    // Оси координат с неоновым свечением
    svg += `<g class="axes" stroke="${axisColor}" stroke-width="1.6" ${!isClean ? `filter="url(#neon-glow-${graphId})"` : ''} opacity="${isClean ? '1' : '0.85'}">`;
    const axisYPos = Math.max(padding.top + 8, Math.min(height - padding.bottom - 8, originPixelY));
    svg += `<line x1="${padding.left - 4}" y1="${axisYPos}" x2="${width - padding.right + 10}" y2="${axisYPos}" marker-end="url(#arr-x-${graphId})" />`;
    const axisXPos = Math.max(padding.left + 8, Math.min(width - padding.right - 8, originPixelX));
    svg += `<line x1="${axisXPos}" y1="${height - padding.bottom + 4}" x2="${axisXPos}" y2="${padding.top - 10}" marker-end="url(#arr-y-${graphId})" />`;
    svg += `</g>`;

    // Подписи осей x, y
    svg += `<text x="${width - padding.right + 12}" y="${axisYPos + 3.5}" fill="${textBoldColor}" font-weight="bold" font-size="12" font-style="italic">x</text>`;
    svg += `<text x="${axisXPos - 5}" y="${padding.top - 12}" fill="${textBoldColor}" font-weight="bold" font-size="12" font-style="italic">y</text>`;

    // Числовые засечки на осях
    if (showLabels) {
      svg += `<g class="ticks" font-size="9" fill="${textColor}" text-anchor="middle">`;
      for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
        if (Math.abs(x) < 1e-6) continue;
        const px = scaleX(x);
        svg += `<line x1="${px}" y1="${axisYPos - 2.5}" x2="${px}" y2="${axisYPos + 2.5}" stroke="${axisColor}" stroke-width="1.2" opacity="0.6" />`;
        svg += `<text x="${px}" y="${axisYPos + 13}">${x}</text>`;
      }
      for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
        if (Math.abs(y) < 1e-6) continue;
        const py = scaleY(y);
        svg += `<line x1="${axisXPos - 2.5}" y1="${py}" x2="${axisXPos + 2.5}" stroke="${axisColor}" stroke-width="1.2" opacity="0.6" />`;
        svg += `<text x="${axisXPos - 7}" y="${py + 3.5}" text-anchor="end">${y}</text>`;
      }
      if (showOrigin) {
        svg += `<text x="${axisXPos - 7}" y="${axisYPos + 12}" font-size="9" fill="${textColor}" text-anchor="end">0</text>`;
      }
      svg += `</g>`;
    }

    // Если активен режим чистой сетки для самостоятельного черчения студентом:
    if (blankGrid) {
      svg += `
        <g class="blank-grid-hint" opacity="0.8">
          <rect x="${padding.left + 6}" y="${padding.top + 6}" width="168" height="22" rx="6" fill="rgba(0, 240, 255, 0.12)" stroke="rgba(0, 240, 255, 0.35)" stroke-width="1" />
          <text x="${padding.left + 14}" y="${padding.top + 21}" fill="#00f0ff" font-size="9.5" font-weight="bold">✏️ Сетка для черчения</text>
        </g>
      </svg>`;
      return svg;
    }

    // Асимптоты
    if (asymptotes && asymptotes.length > 0) {
      svg += `<g class="asymptotes" stroke="#f43f5e" stroke-width="1.4" stroke-dasharray="4,4">`;
      for (const a of asymptotes) {
        if (a.type === 'x') {
          const ax = scaleX(a.val);
          svg += `<line x1="${ax}" y1="${padding.top}" x2="${ax}" y2="${height - padding.bottom}" />`;
          if (a.label) {
            svg += `<text x="${ax + 4}" y="${padding.top + 12}" fill="#f43f5e" font-size="9.5" font-weight="600">${a.label}</text>`;
          }
        } else if (a.type === 'y') {
          const ay = scaleY(a.val);
          svg += `<line x1="${padding.left}" y1="${ay}" x2="${width - padding.right}" y2="${ay}" />`;
          if (a.label) {
            svg += `<text x="${width - padding.right - 25}" y="${ay - 4}" fill="#f43f5e" font-size="9.5" font-weight="600">${a.label}</text>`;
          }
        }
      }
      svg += `</g>`;
    }

    // Отрезки
    if (segments && segments.length > 0) {
      svg += `<g class="segments">`;
      for (const seg of segments) {
        const sx1 = scaleX(seg.x1);
        const sy1 = scaleY(seg.y1);
        const sx2 = scaleX(seg.x2);
        const sy2 = scaleY(seg.y2);
        const sColor = seg.color || defaultCurveColor;
        const sWidth = seg.width || 2.4;
        const sDash = seg.dashed ? 'stroke-dasharray="4,4"' : '';
        svg += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${sColor}" stroke-width="${sWidth}" ${sDash} stroke-linecap="round" />`;
      }
      svg += `</g>`;
    }

    // Построение кривых функций с медленной плавной анимацией
    const numSamples = samplesCount || Math.min(320, Math.round(innerW * 1.2));
    const sampleStep = (xMax - xMin) / numSamples;

    svg += `<g class="curves">`;
    for (let fIdx = 0; fIdx < functions.length; fIdx++) {
      const fObj = functions[fIdx];
      let fn = fObj.fn;
      if (typeof fn === 'string') {
        fn = MathEngine.compile(fn);
      }
      if (!fn) continue;

      const curveColor = fObj.color || (fIdx === 0 ? defaultCurveColor : secondaryCurveColor);
      const strokeW = fObj.width || 2.5;
      const isDashed = fObj.dashed ? 'stroke-dasharray="5,5"' : '';

      let paths = [];
      let currentPath = [];
      let lastY = null;

      for (let i = 0; i <= numSamples; i++) {
        const x = xMin + i * sampleStep;

        if (fObj.xMin !== undefined && x < fObj.xMin - 1e-6) {
          if (currentPath.length > 0) {
            paths.push(currentPath);
            currentPath = [];
          }
          lastY = null;
          continue;
        }
        if (fObj.xMax !== undefined && x > fObj.xMax + 1e-6) {
          if (currentPath.length > 0) {
            paths.push(currentPath);
            currentPath = [];
          }
          lastY = null;
          continue;
        }

        const y = MathEngine.evalAt(fn, x);

        if (y === null || isNaN(y) || !isFinite(y)) {
          if (currentPath.length > 0) {
            paths.push(currentPath);
            currentPath = [];
          }
          lastY = null;
          continue;
        }

        if (lastY !== null && Math.abs(y - lastY) > (yMax - yMin) * 0.75 && ((y > 0 && lastY < 0) || (y < 0 && lastY > 0))) {
          if (currentPath.length > 0) {
            paths.push(currentPath);
            currentPath = [];
          }
        }

        const px = scaleX(x);
        const py = scaleY(y);
        const clampedPy = Math.max(padding.top - 50, Math.min(height - padding.bottom + 50, py));

        currentPath.push({ x: px, y: clampedPy });
        lastY = y;
      }

      if (currentPath.length > 0) {
        paths.push(currentPath);
      }

      for (const pList of paths) {
        if (pList.length < 2) continue;
        let d = `M ${pList[0].x.toFixed(1)} ${pList[0].y.toFixed(1)}`;
        for (let j = 1; j < pList.length; j++) {
          d += ` L ${pList[j].x.toFixed(1)} ${pList[j].y.toFixed(1)}`;
        }

        // Если неоновая тема: добавляем подложку со свечением
        if (!isClean) {
          svg += `<path d="${d}" fill="none" stroke="${curveColor}" stroke-width="${strokeW + 2}" opacity="0.3" filter="url(#neon-glow-${graphId})" stroke-linecap="round" stroke-linejoin="round" class="${animated ? 'neon-path' : ''}" />`;
        }

        svg += `<path d="${d}" fill="none" stroke="${curveColor}" stroke-width="${strokeW}" ${isDashed} stroke-linecap="round" stroke-linejoin="round" class="${animated && !isClean ? 'neon-path' : ''}" />`;
      }

      if (fObj.label) {
        const labelX = width - padding.right - 10;
        const labelY = padding.top + 14 + fIdx * 18;
        svg += `<text x="${labelX}" y="${labelY}" fill="${curveColor}" font-weight="700" font-size="11" text-anchor="end">${fObj.label}</text>`;
      }
    }
    svg += `</g>`;

    // Ключевые точки с интерактивной неоновой подсветкой шагов
    if (points && points.length > 0) {
      svg += `<g class="points">`;
      for (const pt of points) {
        const px = scaleX(pt.x);
        const py = scaleY(pt.y);
        let ptColor = pt.color || '#00f0ff';
        const isHollow = pt.hollow || false;

        const isZeroPt = Math.abs(pt.y) < 1e-4 || (pt.label && pt.label.includes('; 0'));
        const isExtremumPt = pt.label && (pt.label.includes('max') || pt.label.includes('min') || pt.label.includes('вершина'));
        const isYIntercept = Math.abs(pt.x) < 1e-4 || (pt.label && pt.label.includes('(0;'));

        let isTarget = false;
        let ringR = 6;
        let dotR = 4.2;

        if (highlightStep === 'zeros' && isZeroPt) {
          isTarget = true;
          ptColor = '#10e897';
          ringR = 10;
          dotR = 5.5;
        } else if (highlightStep === 'extrema' && isExtremumPt) {
          isTarget = true;
          ptColor = '#ff2d75';
          ringR = 10;
          dotR = 5.5;
          // Вертикальная пунктирная линия симметрии вершины
          svg += `<line x1="${px}" y1="${padding.top}" x2="${px}" y2="${height - padding.bottom}" stroke="#ff2d75" stroke-width="1.4" stroke-dasharray="4,4" opacity="0.75" />`;
        } else if (highlightStep === 'coefficients' && isYIntercept) {
          isTarget = true;
          ptColor = '#c084fc';
          ringR = 10;
          dotR = 5.5;
        }

        const opacity = (highlightStep && highlightStep !== 'all' && !isTarget) ? '0.4' : '1';

        if (!isClean) {
          svg += `<circle cx="${px}" cy="${py}" r="${ringR}" fill="none" stroke="${ptColor}" stroke-width="${isTarget ? '2.4' : '1.8'}" class="${isTarget ? 'neon-pulse-ring' : ''}" opacity="${opacity}" />`;
        }

        if (pt.dashedLines || isTarget) {
          svg += `<line x1="${px}" y1="${py}" x2="${px}" y2="${axisYPos}" stroke="${ptColor}" stroke-width="${isTarget ? '1.5' : '1'}" stroke-dasharray="3,3" opacity="${isTarget ? '0.85' : '0.5'}" />`;
          svg += `<line x1="${px}" y1="${py}" x2="${axisXPos}" y2="${py}" stroke="${ptColor}" stroke-width="${isTarget ? '1.5' : '1'}" stroke-dasharray="3,3" opacity="${isTarget ? '0.85' : '0.5'}" />`;
        }

        if (isHollow) {
          svg += `<circle cx="${px}" cy="${py}" r="4" fill="${bgColor}" stroke="${ptColor}" stroke-width="2" opacity="${opacity}" />`;
        } else {
          svg += `<circle cx="${px}" cy="${py}" r="${dotR}" fill="${ptColor}" stroke="${bgColor}" stroke-width="1.6" ${!isClean ? `filter="url(#neon-glow-${graphId})"` : ''} class="neon-fade" opacity="${opacity}" />`;
        }

        if (pt.label) {
          const offX = pt.labelOffsetX !== undefined ? pt.labelOffsetX : 6;
          const offY = pt.labelOffsetY !== undefined ? pt.labelOffsetY : -6;
          const labelColor = isTarget ? ptColor : (isClean ? '#0f172a' : '#f1f5f9');
          svg += `<text x="${px + offX}" y="${py + offY}" fill="${labelColor}" font-size="${isTarget ? '11.5' : '10.5'}" font-weight="${isTarget ? '800' : '700'}" class="neon-fade" opacity="${opacity}">${pt.label}</text>`;
        }
      }
      svg += `</g>`;
    }

    // Интерактивный HUD баннер текущего шага исследования
    if (highlightStep && highlightStep !== 'all') {
      let bannerText = '';
      let bannerColor = '#00f0ff';
      let bannerBg = 'rgba(0, 240, 255, 0.15)';

      if (highlightStep === 'zeros') {
        bannerText = '● Нули функции: пересечения с Ox (y = 0)';
        bannerColor = '#10e897';
        bannerBg = 'rgba(16, 232, 151, 0.2)';
      } else if (highlightStep === 'extrema') {
        const hasExtrema = points && points.some(p => p.label && (p.label.includes('min') || p.label.includes('max') || p.label.includes('вершина')));
        if (hasExtrema) {
          bannerText = '▲ Вершина / Экстремум функции (x₀; y₀)';
          bannerColor = '#ff2d75';
          bannerBg = 'rgba(255, 45, 117, 0.2)';
        } else {
          bannerText = '➔ Экстремумов нет (функция строго монотонна)';
          bannerColor = '#00f0ff';
          bannerBg = 'rgba(0, 240, 255, 0.15)';
        }
      } else if (highlightStep === 'coefficients') {
        bannerText = '■ Анализ коэффициентов и точка на Oy (0; b)';
        bannerColor = '#c084fc';
        bannerBg = 'rgba(192, 132, 252, 0.2)';
      } else if (highlightStep === 'intervals') {
        bannerText = '▧ Промежутки знакопостоянства: f(x) > 0 и f(x) < 0';
        bannerColor = '#38bdf8';
        bannerBg = 'rgba(56, 189, 248, 0.2)';
      }

      if (bannerText) {
        const bannerW = Math.min(270, innerW);
        svg += `<g class="neon-hud-banner neon-fade">
          <rect x="${padding.left + 4}" y="${padding.top + 4}" width="${bannerW}" height="20" rx="5" fill="${bannerBg}" stroke="${bannerColor}" stroke-width="1.2" />
          <text x="${padding.left + 10}" y="${padding.top + 18}" fill="${bannerColor}" font-size="9.5" font-weight="700" font-family="'JetBrains Mono', monospace">${bannerText}</text>
        </g>`;
      }
    }

    if (title) {
      svg += `<text x="${width / 2}" y="${padding.top - 6}" fill="${textColor}" font-weight="600" font-size="11" text-anchor="middle">${title}</text>`;
    }

    svg += `</svg>`;
    if (cacheKey) {
      if (!GraphRenderer._svgCache) GraphRenderer._svgCache = {};
      GraphRenderer._svgCache[cacheKey] = svg;
    }
    return svg;
  }

  static svgToDataUrl(svgString) {
    const encoded = encodeURIComponent(svgString);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }
}

if (typeof window !== 'undefined') {
  window.MathEngine = MathEngine;
  window.GraphRenderer = GraphRenderer;
}
