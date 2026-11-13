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
  static renderSpecialDiagram(options = {}) {
    const {
      width = 320,
      height = 240,
      diagramType = 'stereo_cylinder',
      title = '',
      params = {},
      theme = 'neon'
    } = options;

    const bg = '#070b16';
    const cyan = '#00f0ff';
    const pink = '#ff2d75';
    const emerald = '#10e897';
    const yellow = '#facc15';
    const purple = '#c084fc';

    let svgInner = '';

    if (diagramType === 'stereo_cylinder') {
      const cx = width / 2;
      const cyTop = 75;
      const cyBot = height - 55;
      const rx = 80;
      const ry = 26;
      svgInner = `
        <!-- Нижнее основание (задняя часть пунктир, передняя сплошная) -->
        <path d="M ${cx - rx} ${cyBot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cyBot}" fill="none" stroke="${cyan}" stroke-width="2.5" />
        <path d="M ${cx + rx} ${cyBot} A ${rx} ${ry} 0 0 0 ${cx - rx} ${cyBot}" fill="none" stroke="${cyan}" stroke-width="1.8" stroke-dasharray="5,4" opacity="0.6" />
        <!-- Образующие боковой поверхности -->
        <line x1="${cx - rx}" y1="${cyTop}" x2="${cx - rx}" y2="${cyBot}" stroke="${cyan}" stroke-width="2.5" />
        <line x1="${cx + rx}" y1="${cyTop}" x2="${cx + rx}" y2="${cyBot}" stroke="${cyan}" stroke-width="2.5" />
        <!-- Верхнее основание (полный эллипс) -->
        <ellipse cx="${cx}" cy="${cyTop}" rx="${rx}" ry="${ry}" fill="#0d1b33" fill-opacity="0.6" stroke="${cyan}" stroke-width="2.5" />
        <!-- Ось цилиндра и высота H -->
        <line x1="${cx}" y1="${cyTop}" x2="${cx}" y2="${cyBot}" stroke="${yellow}" stroke-width="1.8" stroke-dasharray="4,4" />
        <line x1="${cx + rx + 16}" y1="${cyTop}" x2="${cx + rx + 16}" y2="${cyBot}" stroke="${pink}" stroke-width="2" />
        <!-- Стрелочки высоты -->
        <polygon points="${cx + rx + 16},${cyTop} ${cx + rx + 12},${cyTop + 8} ${cx + rx + 20},${cyTop + 8}" fill="${pink}" />
        <polygon points="${cx + rx + 16},${cyBot} ${cx + rx + 12},${cyBot - 8} ${cx + rx + 20},${cyBot - 8}" fill="${pink}" />
        <text x="${cx + rx + 24}" y="${(cyTop + cyBot) / 2 + 4}" fill="${pink}" font-size="12" font-weight="bold" font-family="'JetBrains Mono', monospace">H = ${params.H || 'h'}</text>
        <!-- Радиус R в верхнем основании -->
        <line x1="${cx}" y1="${cyTop}" x2="${cx + rx}" y2="${cyTop}" stroke="${emerald}" stroke-width="2.2" />
        <circle cx="${cx}" cy="${cyTop}" r="3" fill="#ffffff" />
        <circle cx="${cx + rx}" cy="${cyTop}" r="3" fill="${emerald}" />
        <text x="${cx + rx / 2 - 6}" y="${cyTop - 8}" fill="${emerald}" font-size="12" font-weight="bold" font-family="'JetBrains Mono', monospace">R = ${params.R || 'r'}</text>
        <!-- Формула объема и площади внизу -->
        <rect x="12" y="12" width="165" height="42" rx="8" fill="#030712" stroke="#1e293b" opacity="0.9" />
        <text x="20" y="30" fill="${cyan}" font-size="11" font-weight="bold">V = π R² H</text>
        <text x="20" y="46" fill="#94a3b8" font-size="10">S_бок = 2π R H</text>
      `;
    } else if (diagramType === 'stereo_cone') {
      const cx = width / 2;
      const apexY = 40;
      const cyBot = height - 50;
      const rx = 85;
      const ry = 26;
      svgInner = `
        <!-- Нижнее основание -->
        <path d="M ${cx - rx} ${cyBot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cyBot}" fill="none" stroke="${cyan}" stroke-width="2.5" />
        <path d="M ${cx + rx} ${cyBot} A ${rx} ${ry} 0 0 0 ${cx - rx} ${cyBot}" fill="none" stroke="${cyan}" stroke-width="1.8" stroke-dasharray="5,4" opacity="0.6" />
        <!-- Образующие l -->
        <line x1="${cx}" y1="${apexY}" x2="${cx - rx}" y2="${cyBot}" stroke="${cyan}" stroke-width="2.5" />
        <line x1="${cx}" y1="${apexY}" x2="${cx + rx}" y2="${cyBot}" stroke="${cyan}" stroke-width="2.5" />
        <!-- Вершина S -->
        <circle cx="${cx}" cy="${apexY}" r="3.5" fill="${yellow}" />
        <text x="${cx - 16}" y="${apexY - 6}" fill="${yellow}" font-size="12" font-weight="bold">S</text>
        <!-- Высота H -->
        <line x1="${cx}" y1="${apexY}" x2="${cx}" y2="${cyBot}" stroke="${pink}" stroke-width="2" stroke-dasharray="4,4" />
        <circle cx="${cx}" cy="${cyBot}" r="3" fill="#ffffff" />
        <text x="${cx + 6}" y="${(apexY + cyBot) / 2}" fill="${pink}" font-size="12" font-weight="bold">H = ${params.H || 'h'}</text>
        <!-- Радиус R -->
        <line x1="${cx}" y1="${cyBot}" x2="${cx + rx}" y2="${cyBot}" stroke="${emerald}" stroke-width="2.2" />
        <text x="${cx + rx / 2 - 6}" y="${cyBot + 18}" fill="${emerald}" font-size="12" font-weight="bold">R = ${params.R || 'r'}</text>
        <!-- Образующая l подпись -->
        <text x="${cx + rx / 2 + 18}" y="${(apexY + cyBot) / 2 - 8}" fill="${purple}" font-size="12" font-weight="bold">l = ${params.l || 'l'}</text>
        <!-- Формулы -->
        <rect x="12" y="12" width="165" height="42" rx="8" fill="#030712" stroke="#1e293b" opacity="0.9" />
        <text x="20" y="30" fill="${cyan}" font-size="11" font-weight="bold">V = ⅓ π R² H</text>
        <text x="20" y="46" fill="#94a3b8" font-size="10">S_бок = π R l</text>
      `;
    } else if (diagramType === 'stereo_sphere') {
      const cx = width / 2;
      const cy = height / 2 + 5;
      const r = 75;
      svgInner = `
        <!-- Внешняя окружность сферы с градиентным объемом -->
        <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.7"/>
          <stop offset="70%" stop-color="#091428" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sphereGrad)" stroke="${cyan}" stroke-width="2.5" />
        <!-- Экватор (передняя видимая дуга и задняя пунктир) -->
        <path d="M ${cx - r} ${cy} A ${r} ${r * 0.32} 0 0 0 ${cx + r} ${cy}" fill="none" stroke="${cyan}" stroke-width="2" />
        <path d="M ${cx + r} ${cy} A ${r} ${r * 0.32} 0 0 0 ${cx - r} ${cy}" fill="none" stroke="${cyan}" stroke-width="1.6" stroke-dasharray="4,4" opacity="0.6" />
        <!-- Центр сферы O -->
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="#ffffff" />
        <text x="${cx - 14}" y="${cy - 6}" fill="#ffffff" font-size="12" font-weight="bold">O</text>
        <!-- Радиус R -->
        <line x1="${cx}" y1="${cy}" x2="${cx + r * 0.86}" y2="${cy - r * 0.5}" stroke="${emerald}" stroke-width="2.2" />
        <circle cx="${cx + r * 0.86}" cy="${cy - r * 0.5}" r="3" fill="${emerald}" />
        <text x="${cx + 25}" y="${cy - 28}" fill="${emerald}" font-size="12" font-weight="bold">R = ${params.R || 'R'}</text>
        <!-- Формулы сферы -->
        <rect x="12" y="12" width="165" height="42" rx="8" fill="#030712" stroke="#1e293b" opacity="0.9" />
        <text x="20" y="30" fill="${cyan}" font-size="11" font-weight="bold">V = ⁴⁄₃ π R³</text>
        <text x="20" y="46" fill="#94a3b8" font-size="10">S_сферы = 4π R²</text>
      `;
    } else if (diagramType === 'stereo_prism' || diagramType === 'stereo_cube') {
      const ox = 60, oy = 160;
      const a = 110, b = 50, h = 90;
      const dx = b * 0.7, dy = -b * 0.5;
      svgInner = `
        <!-- Невидимые задние ребра (пунктир) -->
        <line x1="${ox}" y1="${oy}" x2="${ox + dx}" y2="${oy + dy}" stroke="${cyan}" stroke-width="1.8" stroke-dasharray="4,4" opacity="0.6" />
        <line x1="${ox + dx}" y1="${oy + dy}" x2="${ox + dx + a}" y2="${oy + dy}" stroke="${cyan}" stroke-width="1.8" stroke-dasharray="4,4" opacity="0.6" />
        <line x1="${ox + dx}" y1="${oy + dy}" x2="${ox + dx}" y2="${oy + dy - h}" stroke="${cyan}" stroke-width="1.8" stroke-dasharray="4,4" opacity="0.6" />
        <!-- Пространственная диагональ d -->
        <line x1="${ox}" y1="${oy}" x2="${ox + dx + a}" y2="${oy + dy - h}" stroke="${pink}" stroke-width="2" stroke-dasharray="4,3" />
        <text x="${ox + a / 2 + 10}" y="${oy - h / 2}" fill="${pink}" font-size="11" font-weight="bold">d = √(a²+b²+c²)</text>
        <!-- Видимые ребра передней грани -->
        <rect x="${ox}" y="${oy - h}" width="${a}" height="${h}" fill="#0d1b33" fill-opacity="0.5" stroke="${cyan}" stroke-width="2.2" />
        <!-- Верхняя грань -->
        <polygon points="${ox},${oy - h} ${ox + dx},${oy + dy - h} ${ox + dx + a},${oy + dy - h} ${ox + a},${oy - h}" fill="#0f2347" fill-opacity="0.6" stroke="${cyan}" stroke-width="2.2" />
        <!-- Правая грань -->
        <polygon points="${ox + a},${oy - h} ${ox + dx + a},${oy + dy - h} ${ox + dx + a},${oy + dy} ${ox + a},${oy}" fill="#091428" fill-opacity="0.6" stroke="${cyan}" stroke-width="2.2" />
        <!-- Подписи измерений a, b, c -->
        <text x="${ox + a / 2 - 10}" y="${oy + 18}" fill="${emerald}" font-size="11" font-weight="bold">a = ${params.a || 'a'}</text>
        <text x="${ox + a + dx / 2 + 5}" y="${oy + dy / 2 + 12}" fill="${yellow}" font-size="11" font-weight="bold">b = ${params.b || 'b'}</text>
        <text x="${ox - 24}" y="${oy - h / 2}" fill="${cyan}" font-size="11" font-weight="bold">c = ${params.c || params.h || 'c'}</text>
        <!-- Формулы -->
        <rect x="12" y="12" width="160" height="38" rx="8" fill="#030712" stroke="#1e293b" opacity="0.9" />
        <text x="20" y="28" fill="${cyan}" font-size="11" font-weight="bold">V = a · b · c</text>
        <text x="20" y="42" fill="#94a3b8" font-size="10">S = 2(ab + bc + ac)</text>
      `;
    } else if (diagramType === 'stereo_pyramid') {
      const cx = width / 2;
      const apexY = 35;
      const yBase = height - 45;
      const x1 = 55, y1 = yBase;
      const x2 = width - 65, y2 = yBase;
      const x3 = width - 110, y3 = yBase - 40;
      const x4 = 100, y4 = yBase - 40;
      const xCenter = (x1 + x2 + x3 + x4) / 4;
      const yCenter = (y1 + y2 + y3 + y4) / 4;
      svgInner = `
        <!-- Невидимые задние ребра основания и пирамиды -->
        <line x1="${x1}" y1="${y1}" x2="${x4}" y2="${y4}" stroke="${cyan}" stroke-width="1.8" stroke-dasharray="4,4" opacity="0.6" />
        <line x1="${x4}" y1="${y4}" x2="${x3}" y2="${y3}" stroke="${cyan}" stroke-width="1.8" stroke-dasharray="4,4" opacity="0.6" />
        <line x1="${cx}" y1="${apexY}" x2="${x4}" y2="${y4}" stroke="${cyan}" stroke-width="1.8" stroke-dasharray="4,4" opacity="0.6" />
        <!-- Высота пирамиды SO -->
        <line x1="${cx}" y1="${apexY}" x2="${xCenter}" y2="${yCenter}" stroke="${pink}" stroke-width="2" stroke-dasharray="4,4" />
        <circle cx="${xCenter}" cy="${yCenter}" r="3" fill="#ffffff" />
        <text x="${cx + 6}" y="${(apexY + yCenter) / 2}" fill="${pink}" font-size="11" font-weight="bold">H = ${params.H || 'h'}</text>
        <!-- Апофема грани SK -->
        <line x1="${cx}" y1="${apexY}" x2="${(x1 + x2) / 2}" y2="${y1}" stroke="${yellow}" stroke-width="2" />
        <text x="${(cx + (x1 + x2) / 2) / 2 + 10}" y="${(apexY + y1) / 2}" fill="${yellow}" font-size="11" font-weight="bold">l_ап = ${params.l || 'l'}</text>
        <!-- Видимые грани основания -->
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cyan}" stroke-width="2.4" />
        <line x1="${x2}" y1="${y2}" x2="${x3}" y2="${y3}" stroke="${cyan}" stroke-width="2.4" />
        <!-- Боковые ребра -->
        <line x1="${cx}" y1="${apexY}" x2="${x1}" y2="${y1}" stroke="${cyan}" stroke-width="2.4" />
        <line x1="${cx}" y1="${apexY}" x2="${x2}" y2="${y2}" stroke="${cyan}" stroke-width="2.4" />
        <line x1="${cx}" y1="${apexY}" x2="${x3}" y2="${y3}" stroke="${cyan}" stroke-width="2.4" />
        <circle cx="${cx}" cy="${apexY}" r="3.5" fill="${yellow}" />
        <text x="${cx - 14}" y="${apexY - 6}" fill="${yellow}" font-size="12" font-weight="bold">S</text>
        <!-- Формулы -->
        <rect x="12" y="12" width="165" height="42" rx="8" fill="#030712" stroke="#1e293b" opacity="0.9" />
        <text x="20" y="30" fill="${cyan}" font-size="11" font-weight="bold">V = ⅓ S_осн · H</text>
        <text x="20" y="46" fill="#94a3b8" font-size="10">S_бок = ½ P_осн · l_ап</text>
      `;
    } else if (diagramType === 'complex_plane') {
      const cx = width / 2 - 20;
      const cy = height / 2 + 10;
      const a = params.a || 3;
      const b = params.b || 2;
      const px = cx + a * 22;
      const py = cy - b * 22;
      svgInner = `
        <!-- Оси комплексной плоскости Re и Im -->
        <line x1="20" y1="${cy}" x2="${width - 20}" y2="${cy}" stroke="#334155" stroke-width="1.8" />
        <polygon points="${width - 20},${cy} ${width - 28},${cy - 4} ${width - 28},${cy + 4}" fill="#334155" />
        <text x="${width - 32}" y="${cy + 18}" fill="${cyan}" font-size="11" font-weight="bold">Re (действит.)</text>
        <line x1="${cx}" y1="${height - 20}" x2="${cx}" y2="20" stroke="#334155" stroke-width="1.8" />
        <polygon points="${cx},20 ${cx - 4},28 ${cx + 4},28}" fill="#334155" />
        <text x="${cx + 8}" y="28" fill="${pink}" font-size="11" font-weight="bold">Im (мнимая)</text>
        <!-- Пунктирные координаты точки -->
        <line x1="${px}" y1="${cy}" x2="${px}" y2="${py}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" />
        <line x1="${cx}" y1="${py}" x2="${px}" y2="${py}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" />
        <!-- Вектор z = a + bi -->
        <line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="${yellow}" stroke-width="2.5" />
        <circle cx="${px}" cy="${py}" r="4" fill="${pink}" />
        <text x="${px + 6}" y="${py - 6}" fill="#ffffff" font-size="12" font-weight="bold">z = ${a} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}i</text>
        <text x="${px - 4}" y="${cy + 14}" fill="${cyan}" font-size="10">a = ${a}</text>
        <text x="${cx - 30}" y="${py + 4}" fill="${pink}" font-size="10">b = ${b}</text>
        <!-- Формула модуля |z| -->
        <rect x="12" y="12" width="165" height="42" rx="8" fill="#030712" stroke="#1e293b" opacity="0.9" />
        <text x="20" y="30" fill="${yellow}" font-size="11" font-weight="bold">|z| = √(a² + b²)</text>
        <text x="20" y="46" fill="#94a3b8" font-size="10">z̄ = a - bi (сопряженное)</text>
      `;
    } else if (diagramType === 'tangent_calc') {
      const cx = width / 2;
      const cy = height / 2;
      svgInner = `
        <!-- Оси координат -->
        <line x1="20" y1="${cy + 40}" x2="${width - 20}" y2="${cy + 40}" stroke="#334155" stroke-width="1.6" />
        <line x1="${cx - 40}" y1="${height - 20}" x2="${cx - 40}" y2="20" stroke="#334155" stroke-width="1.6" />
        <!-- Кривая функции f(x) -->
        <path d="M 40 ${cy + 60} Q ${cx - 20} ${cy - 80} ${width - 40} ${cy - 40}" fill="none" stroke="${cyan}" stroke-width="3" />
        <text x="${width - 60}" y="${cy - 50}" fill="${cyan}" font-size="12" font-weight="bold">y = f(x)</text>
        <!-- Точка касания M(x₀; y₀) -->
        <circle cx="${cx}" cy="${cy - 30}" r="4.5" fill="${pink}" />
        <text x="${cx + 8}" y="${cy - 34}" fill="#ffffff" font-size="11" font-weight="bold">M(x₀; f(x₀))</text>
        <!-- Касательная прямая -->
        <line x1="${cx - 100}" y1="${cy + 25}" x2="${cx + 100}" y2="${cy - 85}" stroke="${yellow}" stroke-width="2.2" stroke-dasharray="6,3" />
        <text x="${cx + 70}" y="${cy - 92}" fill="${yellow}" font-size="11" font-weight="bold">Касательная</text>
        <!-- Формула геометрического смысла -->
        <rect x="12" y="12" width="180" height="42" rx="8" fill="#030712" stroke="#1e293b" opacity="0.9" />
        <text x="20" y="30" fill="${yellow}" font-size="11" font-weight="bold">k = f'(x₀) = tg α</text>
        <text x="20" y="46" fill="#94a3b8" font-size="10">y = f(x₀) + f'(x₀)(x - x₀)</text>
      `;
    } else if (diagramType === 'integral_area') {
      const cx = width / 2;
      const cy = height - 55;
      const xA = cx - 60;
      const xB = cx + 60;
      svgInner = `
        <!-- Оси координат -->
        <line x1="20" y1="${cy}" x2="${width - 20}" y2="${cy}" stroke="#334155" stroke-width="1.8" />
        <line x1="${cx - 80}" y1="${height - 20}" x2="${cx - 80}" y2="20" stroke="#334155" stroke-width="1.8" />
        <!-- Заштрихованная криволинейная трапеция -->
        <path d="M ${xA} ${cy} L ${xA} ${cy - 80} Q ${cx} ${cy - 120} ${xB} ${cy - 70} L ${xB} ${cy} Z" fill="${emerald}" fill-opacity="0.25" stroke="${emerald}" stroke-width="1.5" />
        <!-- Вертикальные границы x = a и x = b -->
        <line x1="${xA}" y1="${cy}" x2="${xA}" y2="${cy - 80}" stroke="${yellow}" stroke-width="2" stroke-dasharray="3,3" />
        <line x1="${xB}" y1="${cy}" x2="${xB}" y2="${cy - 70}" stroke="${yellow}" stroke-width="2" stroke-dasharray="3,3" />
        <text x="${xA - 4}" y="${cy + 16}" fill="${yellow}" font-size="11" font-weight="bold">a = ${params.a || 'a'}</text>
        <text x="${xB - 4}" y="${cy + 16}" fill="${yellow}" font-size="11" font-weight="bold">b = ${params.b || 'b'}</text>
        <!-- Кривая f(x) -->
        <path d="M ${xA - 30} ${cy - 40} Q ${cx} ${cy - 120} ${xB + 30} ${cy - 50}" fill="none" stroke="${cyan}" stroke-width="2.8" />
        <text x="${cx - 10}" y="${cy - 50}" fill="#ffffff" font-size="13" font-weight="bold">S</text>
        <!-- Формула Ньютона-Лейбница -->
        <rect x="12" y="12" width="180" height="42" rx="8" fill="#030712" stroke="#1e293b" opacity="0.9" />
        <text x="20" y="30" fill="${emerald}" font-size="11" font-weight="bold">S = ∫ₐᵇ f(x) dx</text>
        <text x="20" y="46" fill="#94a3b8" font-size="10">= F(b) - F(a) (Ньютон-Лейбниц)</text>
      `;
    } else {
      // Общая карточка раздела
      svgInner = `
        <rect x="20" y="30" width="${width - 40}" height="${height - 60}" rx="12" fill="#091428" stroke="${cyan}" stroke-width="1.8" />
        <text x="${width / 2}" y="${height / 2 - 10}" text-anchor="middle" fill="${cyan}" font-size="15" font-weight="bold">${title || 'Математика'}</text>
        <text x="${width / 2}" y="${height / 2 + 15}" text-anchor="middle" fill="#94a3b8" font-size="11">${params.subtitle || 'Теория, вычисления и формулы'}</text>
      `;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="math-graph-svg" style="background:${bg}; border-radius: 10px; font-family: 'JetBrains Mono', monospace; user-select: none; max-width: 100%; height: auto;">
        ${svgInner}
      </svg>
    `;
  }

  static renderSVG(options = {}) {
    if (!options.blankGrid && options && options.diagramType && options.diagramType !== 'graph') {
      return this.renderSpecialDiagram(options);
    }

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
          stroke-dasharray: 100 100;
          stroke-dashoffset: 100;
          animation: drawNeonSlow_${graphId} ${animationDuration}s cubic-bezier(0.35, 0, 0.25, 1) forwards;
        }
        @keyframes drawNeonSlow_${graphId} {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
        #${graphId} .neon-fade {
          opacity: 0;
          animation: fadeNeonSlow_${graphId} 0.8s ease-out 1.2s forwards;
        }
        @keyframes fadeNeonSlow_${graphId} {
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
      // Мягкая ненавязчивая тонировка зон знакопостоянства
      svg += `<rect x="${padding.left}" y="${padding.top}" width="${innerW}" height="${zeroY - padding.top}" fill="rgba(16, 232, 151, 0.06)" />`;
      svg += `<rect x="${padding.left}" y="${zeroY}" width="${innerW}" height="${height - padding.bottom - zeroY}" fill="rgba(244, 63, 94, 0.06)" />`;
      // Плашки f(x) > 0 и f(x) < 0 с непроницаемой темной подложкой #070b16 (чтобы кривые не просвечивали сквозь текст)
      svg += `<g class="neon-fade">
        <rect x="${padding.left + 6}" y="${padding.top + 32}" width="62" height="19" rx="5" fill="#070b16" fill-opacity="0.96" stroke="#10e897" stroke-width="1.4" />
        <text x="${padding.left + 37}" y="${padding.top + 45.5}" fill="#10e897" font-size="10.5" font-weight="800" text-anchor="middle" style="paint-order: stroke fill; stroke: #070b16; stroke-width: 2.5px;">f(x) > 0</text>
      </g>`;
      svg += `<g class="neon-fade">
        <rect x="${padding.left + 6}" y="${height - padding.bottom - 26}" width="62" height="19" rx="5" fill="#070b16" fill-opacity="0.96" stroke="#f43f5e" stroke-width="1.4" />
        <text x="${padding.left + 37}" y="${height - padding.bottom - 12.5}" fill="#f43f5e" font-size="10.5" font-weight="800" text-anchor="middle" style="paint-order: stroke fill; stroke: #070b16; stroke-width: 2.5px;">f(x) < 0</text>
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
        svg += `<text x="${px}" y="${axisYPos + 13}" style="paint-order: stroke fill; stroke: #070b16; stroke-width: 2.5px;">${x}</text>`;
      }
      for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
        if (Math.abs(y) < 1e-6) continue;
        const py = scaleY(y);
        svg += `<line x1="${axisXPos - 2.5}" y1="${py}" x2="${axisXPos + 2.5}" stroke="${axisColor}" stroke-width="1.2" opacity="0.6" />`;
        svg += `<text x="${axisXPos - 7}" y="${py + 3.5}" text-anchor="end" style="paint-order: stroke fill; stroke: #070b16; stroke-width: 2.5px;">${y}</text>`;
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
          svg += `<path pathLength="100" d="${d}" fill="none" stroke="${curveColor}" stroke-width="${strokeW + 2}" opacity="0.3" filter="url(#neon-glow-${graphId})" stroke-linecap="round" stroke-linejoin="round" class="${animated ? 'neon-path' : ''}" />`;
        }

        svg += `<path pathLength="100" d="${d}" fill="none" stroke="${curveColor}" stroke-width="${strokeW}" ${isDashed} stroke-linecap="round" stroke-linejoin="round" class="${animated && !isClean ? 'neon-path' : ''}" />`;
      }

    }
    svg += `</g>`;

    // Компактная аккуратная плашка легенды графиков (в правом верхнем углу) с непроницаемым темным фоном
    const labeledFns = (functions || []).filter(f => f.label);
    if (labeledFns.length > 0) {
      const legW = 118;
      const legH = labeledFns.length * 20 + 8;
      const legX = width - padding.right - legW;
      const legY = padding.top + 4;
      
      svg += `<g class="neon-legend neon-fade">
        <rect x="${legX}" y="${legY}" width="${legW}" height="${legH}" rx="6" fill="#070b16" fill-opacity="0.96" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" />`;
      
      labeledFns.forEach((f, idx) => {
        const fColor = f.color || (idx === 0 ? defaultCurveColor : secondaryCurveColor);
        const itemY = legY + 15 + idx * 20;
        svg += `
          <line x1="${legX + 8}" y1="${itemY - 3.5}" x2="${legX + 22}" y2="${itemY - 3.5}" stroke="${fColor}" stroke-width="2.8" stroke-linecap="round" />
          <text x="${legX + 26}" y="${itemY}" fill="${fColor}" font-size="10.5" font-weight="800" style="paint-order: stroke fill; stroke: #070b16; stroke-width: 2.5px;">${f.label}</text>
        `;
      });
      svg += `</g>`;
    }

    // Ключевые точки с интерактивной неоновой подсветкой шагов
    if (points && points.length > 0) {
      svg += `<g class="points ${animated && !isClean ? 'neon-fade' : ''}">`;
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

        const opacity = (highlightStep && highlightStep !== 'all' && !isTarget && highlightStep !== 'intervals') ? '0.75' : '1';

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
          const offY = pt.labelOffsetY !== undefined ? pt.labelOffsetY : (py < padding.top + 50 ? 14 : -6);
          const labelColor = isTarget ? ptColor : (isClean ? '#0f172a' : '#f1f5f9');
          svg += `<text x="${px + offX}" y="${py + offY}" fill="${labelColor}" font-size="${isTarget ? '11.5' : '10.5'}" font-weight="${isTarget ? '800' : '700'}" class="neon-fade" opacity="${opacity}" style="paint-order: stroke fill; stroke: #070b16; stroke-width: 3.5px; stroke-linejoin: round;">${pt.label}</text>`;
        }
      }
      svg += `</g>`;
    }

    // Интерактивный компактный HUD-индикатор шага исследования (в левом верхнем углу, не пересекающийся с легендой)
    if (highlightStep && highlightStep !== 'all') {
      let bannerText = '';
      let bannerColor = '#00f0ff';

      if (highlightStep === 'zeros') {
        bannerText = '● Нули (y = 0)';
        bannerColor = '#10e897';
      } else if (highlightStep === 'extrema') {
        const hasExtrema = points && points.some(p => p.label && (p.label.includes('min') || p.label.includes('max') || p.label.includes('вершина')));
        bannerText = hasExtrema ? '▲ Экстремум' : '➔ Монотонна';
        bannerColor = '#ff2d75';
      } else if (highlightStep === 'coefficients') {
        bannerText = '■ Анализ Oy: (0; b)';
        bannerColor = '#c084fc';
      } else if (highlightStep === 'intervals') {
        bannerText = '▧ Знакопостоянство';
        bannerColor = '#38bdf8';
      }

      if (bannerText) {
        const pillW = 125;
        const pillH = 22;
        const pillX = padding.left + 4;
        const pillY = padding.top + 4;

        svg += `<g class="neon-hud-banner neon-fade">
          <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="6" fill="#070b16" fill-opacity="0.96" stroke="${bannerColor}" stroke-width="1.4" />
          <text x="${pillX + pillW / 2}" y="${pillY + 15}" fill="${bannerColor}" font-size="10.5" font-weight="800" text-anchor="middle" font-family="'JetBrains Mono', monospace" style="paint-order: stroke fill; stroke: #070b16; stroke-width: 2.5px;">${bannerText}</text>
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
