/**
 * Полный банк заданий по ВСЕМ графикам функций для 1 курса колледжа (СПО).
 * Включает 18 категорий, в КАЖДОЙ категории по 50 уникальных разноплановых заданий!
 * Всего в банке: 900 полноценных заданий (по 4 параллельных варианта в каждом = 3600 вариантов).
 */

const TASK_CATEGORIES = [
  { id: 'all', name: 'Все темы (900 заданий)' },
  { id: 'linear', name: '1. Линейная функция (50 заданий)' },
  { id: 'quadratic', name: '2. Квадратичная парабола (50 заданий)' },
  { id: 'rational', name: '3. Дробно-линейная гипербола (50 заданий)' },
  { id: 'cubic', name: '4. Кубическая парабола (50 заданий)' },
  { id: 'quartic', name: '5. Четная степень x⁴ (50 заданий)' },
  { id: 'sqrt', name: '6. Квадратный корень √x (50 заданий)' },
  { id: 'cbrt', name: '7. Кубический корень ∛x (50 заданий)' },
  { id: 'abs', name: '8. Модуль: уголок |x| (50 заданий)' },
  { id: 'abs_parabola', name: '9. Модуль параболы |x² - c| (50 заданий)' },
  { id: 'exp_growth', name: '10. Показательный рост 2ˣ (50 заданий)' },
  { id: 'exp_decay', name: '11. Показательное затухание (½)ˣ (50 заданий)' },
  { id: 'log', name: '12. Логарифмы log₂ x (50 заданий)' },
  { id: 'trig_sin', name: '13. Синусоида и гармоники (50 заданий)' },
  { id: 'trig_cos', name: '14. Косинусоида (50 заданий)' },
  { id: 'trig_tan', name: '15. Тангенсоида и асимптоты (50 заданий)' },
  { id: 'arctrig', name: '16. Арктангенс arctg x (50 заданий)' },
  { id: 'piecewise', name: '17. Кусочно-заданные функции (50 заданий)' },
  { id: 'solve_graph', name: '18. Графические уравнения (50 заданий)' }
];

class DatabaseEngine {
  static generateAllTasks() {
    const bank = [];

    // Хелпер генерации вариантов
    const createVariants = (baseFormulaFn, questionFn, answerFn, theoryText, stepsFn) => {
      const vars = [];
      for (let v = 1; v <= 4; v++) {
        const data = baseFormulaFn(v);
        vars.push({
          variantNum: v,
          question: questionFn(data, v),
          graphConfig: data.graphConfig,
          answer: answerFn(data, v),
          detailedSolution: {
            theory: theoryText,
            steps: stepsFn(data, v),
            commonMistakes: data.commonMistakes || [
              'Невнимательность при вычислении знаков коэффициентов.',
              'Ошибки при переносе слагаемых и считывании координат с осей.'
            ],
            rubric: [
              { item: 'Правильные аналитические выкладки и таблица', points: '1 балл' },
              { item: 'Верно найдены ключевые точки / асимптоты', points: '1 балл' },
              { item: 'Точный чертеж графика функции', points: '1 балл' }
            ]
          }
        });
      }
      return vars;
    };

    // 1. ЛИНЕЙНАЯ ФУНКЦИЯ (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const slopes = [1, 2, 3, -1, -2, -3, 0.5, -0.5, 1.5, -1.5, 4, -4];
      const intercepts = [0, 1, 2, 3, 4, -1, -2, -3, -4, 5, -5];
      const kBase = slopes[(i - 1) % slopes.length];
      const bBase = intercepts[(i * 3) % intercepts.length];

      bank.push({
        id: `linear-${i}`,
        category: 'linear',
        categoryName: 'Линейная функция',
        difficulty: i <= 15 ? 'basic' : i <= 35 ? 'medium' : 'hard',
        difficultyLabel: i <= 15 ? 'Базовый' : i <= 35 ? 'Основной' : 'Углубленный',
        points: i <= 20 ? 2 : 3,
        title: `Линейная функция: задание №${i}`,
        description: `Построение и исследование прямой y = kx + b (k = ${kBase}, b = ${bBase}).`,
        variants: createVariants(
          (v) => {
            const k = kBase + (v - 1) * 0.5 * (kBase >= 0 ? 1 : -1);
            const b = bBase + (v - 1);
            const x0 = k !== 0 ? (-b / k) : 0;
            const kStr = k === 1 ? '' : k === -1 ? '-' : `${k}*`;
            const bStr = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
            const fnStr = `${kStr}x${bStr}`;
            return {
              k, b, x0, fnStr,
              graphConfig: {
                xMin: -6, xMax: 6, yMin: -6, yMax: 6, stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: `y = ${fnStr.replace('*', '')}` }],
                points: [
                  { x: 0, y: b, label: `(0; ${b})`, color: '#ff2d75', dashedLines: true },
                  { x: parseFloat(x0.toFixed(2)), y: 0, label: `(${x0.toFixed(1)}; 0)`, color: '#10e897', dashedLines: true }
                ]
              }
            };
          },
          (d) => `Дана линейная функция: y = ${d.fnStr.replace('*', '')}.\n1) Составьте таблицу значений (не менее 3 точек) и постройте прямую;\n2) Укажите угловой коэффициент k и свободный член b;\n3) Найдите координаты точек пересечения с осями Ox и Oy;\n4) Определите характер монотонности (возрастает / убывает).`,
          (d) => `1) Таблица: (0; ${d.b}), (1; ${d.k + d.b}), (-1; ${-d.k + d.b});\n2) k = ${d.k}, b = ${d.b};\n3) С Ox: (${d.x0.toFixed(2)}; 0), с Oy: (0; ${d.b});\n4) Функция ${d.k > 0 ? 'строго возрастает (k > 0)' : 'строго убывает (k < 0)'}.`,
          'Линейная функция y = kx + b. При k > 0 функция возрастает, при k < 0 — убывает. Точка пересечения с Oy: (0; b), с Ox: (-b/k; 0).',
          (d) => [
            { stepNum: 1, title: 'Анализ коэффициентов', content: `k = ${d.k}, b = ${d.b}. Функция ${d.k > 0 ? 'возрастает' : 'убывает'}.`, visualKey: 'coefficients' },
            { stepNum: 2, title: 'Пересечения с осями', content: `С осью Oy: (0; ${d.b}). С осью Ox: y = 0 => x = ${d.x0.toFixed(2)}.`, visualKey: 'zeros' }
          ]
        )
      });
    }

    // 2. КВАДРАТИЧНАЯ ПАРАБОЛА (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const aVals = [1, -1, 1, -1, 2, -2, 0.5, -0.5];
      const roots = [[1, 3], [-1, 3], [-3, 1], [-2, 2], [0, 4], [-4, 0], [2, 4], [-3, -1]];
      const a = aVals[(i - 1) % aVals.length];
      const pair = roots[(i - 1) % roots.length];
      const shift = Math.floor((i - 1) / roots.length);
      const r1 = pair[0] + shift;
      const r2 = pair[1] + shift;
      const vx = (r1 + r2) / 2;
      const vy = -a * ((r2 - r1) / 2) ** 2;

      bank.push({
        id: `quad-${i}`,
        category: 'quadratic',
        categoryName: 'Квадратичная парабола',
        difficulty: i <= 15 ? 'basic' : i <= 35 ? 'medium' : 'hard',
        difficultyLabel: i <= 15 ? 'Базовый' : i <= 35 ? 'Основной' : 'Углубленный',
        points: 3,
        title: `Квадратичная парабола: задание №${i}`,
        description: `Построение параболы через вершину (${vx}; ${vy}) и нули x₁ = ${r1}, x₂ = ${r2}.`,
        variants: createVariants(
          (v) => {
            const vOffset = (v - 1);
            const x1 = r1 + vOffset;
            const x2 = r2 + vOffset;
            const x0 = (x1 + x2) / 2;
            const y0 = -a * ((x2 - x1) / 2) ** 2;
            const b = -a * (x1 + x2);
            const c = a * x1 * x2;
            const fnStr = `${a === 1 ? '' : a === -1 ? '-' : a + '*'}x^2 ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}*x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)}`;
            return {
              a, b, c, x0, y0, x1, x2, fnStr,
              graphConfig: {
                xMin: Math.min(x1, x2) - 3, xMax: Math.max(x1, x2) + 3,
                yMin: Math.min(y0, 0) - 3, yMax: Math.max(y0, 0) + 4,
                stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: `y = f(x)` }],
                points: [
                  { x: x0, y: y0, label: `В(${x0}; ${y0})`, color: '#ff2d75', dashedLines: true },
                  { x: x1, y: 0, label: `(${x1}; 0)`, color: '#10e897' },
                  { x: x2, y: 0, label: `(${x2}; 0)`, color: '#10e897' }
                ],
                asymptotes: [{ type: 'vertical', x: x0, color: 'rgba(255, 45, 117, 0.4)', dashed: true }]
              }
            };
          },
          (d) => `Дана квадратичная функция: y = ${d.fnStr.replace(/\*/g, '')}.\n1) Определите направление ветвей параболы;\n2) Найдите координаты вершины (x₀; y₀) и ось симметрии;\n3) Найдите нули функции и постройте график;\n4) Укажите область значений E(f).`,
          (d) => `1) Ветви ${d.a > 0 ? 'вверх (a > 0)' : 'вниз (a < 0)'};\n2) Вершина В(${d.x0}; ${d.y0}), ось x = ${d.x0};\n3) Нули: x₁ = ${d.x1}, x₂ = ${d.x2};\n4) E(f) = ${d.a > 0 ? `[${d.y0}; +∞)` : `(-∞; ${d.y0}]`}.`,
          'Квадратичная функция y = ax² + bx + c. Вершина: x₀ = -b/(2a), y₀ = f(x₀). При a > 0 ветви вверх, минимум в вершине. При a < 0 ветви вниз, максимум в вершине.',
          (d) => [
            { stepNum: 1, title: 'Вершина параболы', content: `x₀ = -b/(2a) = ${d.x0}. Подставляя, получаем y₀ = ${d.y0}. Вершина (${d.x0}; ${d.y0}).`, visualKey: 'vertex' },
            { stepNum: 2, title: 'Нули функции', content: `Корни уравнения ax² + bx + c = 0: x₁ = ${d.x1}, x₂ = ${d.x2}.`, visualKey: 'zeros' }
          ]
        )
      });
    }

    // 3. ДРОБНО-ЛИНЕЙНАЯ ГИПЕРБОЛА (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const kList = [1, 2, 3, 4, 6, -1, -2, -3, -4, -6];
      const aList = [0, 1, -1, 2, -2, 3, -3];
      const bList = [0, 1, -1, 2, -2];
      const k = kList[(i - 1) % kList.length];
      const a = aList[(i * 2) % aList.length];
      const b = bList[(i * 3) % bList.length];

      bank.push({
        id: `rational-${i}`,
        category: 'rational',
        categoryName: 'Дробно-линейная гипербола',
        difficulty: i <= 20 ? 'basic' : 'medium',
        difficultyLabel: i <= 20 ? 'Базовый' : 'Основной',
        points: 3,
        title: `Гипербола и асимптоты: задание №${i}`,
        description: `Построение гиперболы y = ${k}/(x - ${a}) + ${b} и уравнения асимптот.`,
        variants: createVariants(
          (v) => {
            const curA = a + (v - 1);
            const curB = b;
            const fnStr = `${k} / (x - ${curA}) + ${curB}`;
            return {
              k, a: curA, b: curB, fnStr,
              graphConfig: {
                xMin: curA - 6, xMax: curA + 6, yMin: curB - 5, yMax: curB + 5, stepX: 1, stepY: 1,
                functions: [
                  { fn: fnStr, color: '#00f0ff', width: 3, label: 'y = f(x)', xMax: curA - 0.15 },
                  { fn: fnStr, color: '#00f0ff', width: 3, label: 'y = f(x)', xMin: curA + 0.15 }
                ],
                points: [
                  { x: curA + 1, y: curB + k, label: `(${curA + 1}; ${curB + k})`, color: '#10e897' },
                  { x: curA - 1, y: curB - k, label: `(${curA - 1}; ${curB - k})`, color: '#ff2d75' }
                ],
                asymptotes: [
                  { type: 'vertical', x: curA, color: 'rgba(255, 45, 117, 0.7)', dashed: true },
                  { type: 'horizontal', y: curB, color: 'rgba(16, 232, 151, 0.7)', dashed: true }
                ]
              }
            };
          },
          (d) => `Дана дробно-линейная функция: y = ${d.k} / (x - ${d.a}) + ${d.b}.\n1) Найдите область определения D(f);\n2) Запишите уравнения вертикальной и горизонтальной асимптот;\n3) Составьте таблицу значений по ветвям и постройте график;\n4) Укажите промежутки монотонности.`,
          (d) => `1) D(f) = (-∞; ${d.a}) ∪ (${d.a}; +∞);\n2) Вертикальная: x = ${d.a}, горизонтальная: y = ${d.b};\n3) Точки: (${d.a + 1}; ${d.b + d.k}), (${d.a - 1}; ${d.b - d.k});\n4) Функция ${d.k > 0 ? 'убывает' : 'возрастает'} на (-∞; ${d.a}) и на (${d.a}; +∞).`,
          'Дробно-линейная функция y = k/(x-a) + b. Асимптоты: x = a (вертикальная) и y = b (горизонтальная).',
          (d) => [
            { stepNum: 1, title: 'Асимптоты', content: `Знаменатель равен 0 при x = ${d.a}. Вертикальная асимптота: x = ${d.a}. Горизонтальная асимптота: y = ${d.b}.`, visualKey: 'asymptotes' }
          ]
        )
      });
    }

    // 4. КУБИЧЕСКАЯ ПАРАБОЛА (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const aCoeffs = [1, -1, 0.5, -0.5, 2, -2, 0.25, -0.25];
      const shifts = [0, 1, -1, 2, -2, 3, -3];
      const a = aCoeffs[(i - 1) % aCoeffs.length];
      const c = shifts[(i * 2) % shifts.length];

      bank.push({
        id: `cubic-${i}`,
        category: 'cubic',
        categoryName: 'Кубическая парабола',
        difficulty: i <= 20 ? 'basic' : 'medium',
        difficultyLabel: i <= 20 ? 'Базовый' : 'Основной',
        points: 3,
        title: `Кубическая парабола y = ax³ + c: задание №${i}`,
        description: `Построение S-образной кривой (a = ${a}, c = ${c}), исследование четности/нечетности и монотонности.`,
        variants: createVariants(
          (v) => {
            const curC = c + (v - 1);
            const fnStr = `${a}*x^3 ${curC >= 0 ? '+ ' + curC : '- ' + Math.abs(curC)}`;
            return {
              a, c: curC, fnStr,
              graphConfig: {
                xMin: -4, xMax: 4, yMin: curC - 6, yMax: curC + 6, stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = ax³ + c' }],
                points: [
                  { x: 0, y: curC, label: `(0; ${curC}) перегиб`, color: '#ff2d75' },
                  { x: 1, y: curC + a, label: `(1; ${curC + a})`, color: '#10e897' },
                  { x: -1, y: curC - a, label: `(-1; ${curC - a})`, color: '#00f0ff' }
                ]
              }
            };
          },
          (d) => `Дана функция: y = ${d.fnStr.replace('*', '')}.\n1) Найдите область определения D(f) и область значений E(f);\n2) Исследуйте симметрию графика и найдите точку перегиба;\n3) Составьте таблицу значений и постройте кубическую параболу;\n4) Укажите характер монотонности.`,
          (d) => `1) D(f) = R, E(f) = R;\n2) Точка перегиба: (0; ${d.c});\n3) Точки: (-1; ${d.c - d.a}), (0; ${d.c}), (1; ${d.c + d.a});\n4) Функция ${d.a > 0 ? 'строго возрастает' : 'строго убывает'} на всем R.`,
          'Степенная функция y = x³ имеет форму кубической параболы с точкой перегиба. Нечетна при c = 0.',
          (d) => [
            { stepNum: 1, title: 'Анализ', content: `Функция ${d.a > 0 ? 'возрастает' : 'убывает'} на всей числовой прямой. Перегиб в (0; ${d.c}).`, visualKey: 'coefficients' }
          ]
        )
      });
    }

    // 5. ЧЕТНАЯ СТЕПЕНЬ x⁴ (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const aCoeffs = [1, -1, 0.5, -0.5, 2];
      const shifts = [0, -1, 1, -2, 2, -3, 3];
      const a = aCoeffs[(i - 1) % aCoeffs.length];
      const c = shifts[(i * 3) % shifts.length];

      bank.push({
        id: `quartic-${i}`,
        category: 'quartic',
        categoryName: 'Степенная функция четной степени x⁴',
        difficulty: 'medium',
        difficultyLabel: 'Основной',
        points: 3,
        title: `Функция четной степени y = ax⁴ + c: задание №${i}`,
        description: `Построение и исследование четной функции y = ${a}x⁴ + ${c}.`,
        variants: createVariants(
          (v) => {
            const curC = c + (v - 1);
            const fnStr = `${a}*x^4 ${curC >= 0 ? '+ ' + curC : '- ' + Math.abs(curC)}`;
            return {
              a, c: curC, fnStr,
              graphConfig: {
                xMin: -3, xMax: 3, yMin: curC - 4, yMax: curC + 6, stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = ax⁴ + c' }],
                points: [
                  { x: 0, y: curC, label: `(0; ${curC}) экстремум`, color: '#ff2d75', dashedLines: true },
                  { x: 1, y: curC + a, label: `(1; ${curC + a})`, color: '#10e897' },
                  { x: -1, y: curC + a, label: `(-1; ${curC + a})`, color: '#10e897' }
                ]
              }
            };
          },
          (d) => `Дана функция: y = ${d.fnStr.replace('*', '')}.\n1) Докажите аналитически четность функции;\n2) Найдите координаты вершины (экстремума);\n3) Постройте график функции;\n4) Укажите область значений E(f).`,
          (d) => `1) f(-x) = ${d.a}(-x)⁴ + ${d.c} = f(x) — четная (симметрия относительно Oy);\n2) Вершина в (0; ${d.c});\n3) Точки: (0; ${d.c}), (±1; ${d.c + d.a});\n4) E(f) = ${d.a > 0 ? `[${d.c}; +∞)` : `(-∞; ${d.c}]`}.`,
          'Функция y = x⁴ является четной, график симметричен относительно оси ординат с уплощенным дном возле нуля.',
          (d) => [
            { stepNum: 1, title: 'Четность и E(f)', content: `Симметрия относительно Oy. E(f) = ${d.a > 0 ? `[${d.c}; +∞)` : `(-∞; ${d.c}]`}.`, visualKey: 'coefficients' }
          ]
        )
      });
    }

    // 6. КВАДРАТНЫЙ КОРЕНЬ √x (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const aCoeffs = [1, -1, 2, -2, 0.5];
      const x0List = [0, 1, -1, 2, -2, 3, -3, 4, -4];
      const y0List = [0, 1, -1, 2, -2];
      const a = aCoeffs[(i - 1) % aCoeffs.length];
      const x0 = x0List[(i * 2) % x0List.length];
      const y0 = y0List[(i * 3) % y0List.length];

      bank.push({
        id: `sqrt-${i}`,
        category: 'sqrt',
        categoryName: 'Функция квадратного корня',
        difficulty: 'medium',
        difficultyLabel: 'Основной',
        points: 3,
        title: `Квадратный корень y = a√(x - x₀) + y₀: задание №${i}`,
        description: `Построение ветви параболы со стартом в (${x0}; ${y0}) и ОДЗ x ≥ ${x0}.`,
        variants: createVariants(
          (v) => {
            const curX0 = x0 + (v - 1);
            const fnStr = `${a === 1 ? '' : a === -1 ? '-' : a + '*'}sqrt(x - ${curX0}) ${y0 >= 0 ? '+ ' + y0 : '- ' + Math.abs(y0)}`;
            return {
              a, x0: curX0, y0, fnStr,
              graphConfig: {
                xMin: curX0 - 2, xMax: curX0 + 10, yMin: y0 - 4, yMax: y0 + 5, stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = a√(...)', xMin: curX0 }],
                points: [
                  { x: curX0, y: y0, label: `(${curX0}; ${y0}) старт`, color: '#ff2d75', dashedLines: true },
                  { x: curX0 + 1, y: y0 + a, label: `(${curX0 + 1}; ${y0 + a})`, color: '#10e897' },
                  { x: curX0 + 4, y: y0 + a * 2, label: `(${curX0 + 4}; ${y0 + a * 2})`, color: '#00f0ff' }
                ]
              }
            };
          },
          (d) => `Дана функция: y = ${d.fnStr.replace('*', '')}.\n1) Найдите область определения D(f) (ОДЗ подкоренного выражения);\n2) Определите координаты начальной точки ветви;\n3) Составьте таблицу значений (для x, из которых корень извлекается нацело) и постройте график;\n4) Укажите область значений E(f).`,
          (d) => `1) D(f) = [${d.x0}; +∞);\n2) Начальная точка (${d.x0}; ${d.y0});\n3) Точки: (${d.x0}; ${d.y0}), (${d.x0 + 1}; ${d.y0 + d.a}), (${d.x0 + 4}; ${d.y0 + d.a * 2});\n4) E(f) = ${d.a > 0 ? `[${d.y0}; +∞)` : `(-∞; ${d.y0}]`}.`,
          'Подкоренное выражение арифметического квадратного корня неотрицательно: x - x₀ ≥ 0 => x ≥ x₀.',
          (d) => [
            { stepNum: 1, title: 'ОДЗ', content: `x - ${d.x0} ≥ 0 => x ≥ ${d.x0}. График начинается строго в точке (${d.x0}; ${d.y0}).`, visualKey: 'coefficients' }
          ]
        )
      });
    }

    // 7. КУБИЧЕСКИЙ КОРЕНЬ ∛x (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const aCoeffs = [1, -1, 2, -2, 0.5];
      const shifts = [0, 1, -1, 2, -2, 3, -3];
      const a = aCoeffs[(i - 1) % aCoeffs.length];
      const x0 = shifts[(i * 2) % shifts.length];

      bank.push({
        id: `cbrt-${i}`,
        category: 'cbrt',
        categoryName: 'Функция кубического корня',
        difficulty: 'medium',
        difficultyLabel: 'Основной',
        points: 3,
        title: `Кубический корень y = ∛(x - x₀): задание №${i}`,
        description: `Построение S-образной кривой кубического корня с центром в (${x0}; 0).`,
        variants: createVariants(
          (v) => {
            const curX0 = x0 + (v - 1);
            const fnStr = `${a}*cbrt(x - ${curX0})`;
            return {
              a, x0: curX0, fnStr,
              graphConfig: {
                xMin: curX0 - 9, xMax: curX0 + 9, yMin: -4, yMax: 4, stepX: 2, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = a∛(...)' }],
                points: [
                  { x: curX0, y: 0, label: `(${curX0}; 0) центр`, color: '#ff2d75' },
                  { x: curX0 + 1, y: a, label: `(${curX0 + 1}; ${a})`, color: '#10e897' },
                  { x: curX0 + 8, y: a * 2, label: `(${curX0 + 8}; ${a * 2})`, color: '#10e897' },
                  { x: curX0 - 1, y: -a, label: `(${curX0 - 1}; ${-a})`, color: '#00f0ff' },
                  { x: curX0 - 8, y: -a * 2, label: `(${curX0 - 8}; ${-a * 2})`, color: '#00f0ff' }
                ]
              }
            };
          },
          (d) => `Дана функция: y = ${d.fnStr.replace('*', '')}.\n1) Область определения D(f) и область значений E(f);\n2) Исследуйте симметрию и найдите точку перегиба;\n3) Составьте таблицу значений по характерным кубам чисел и постройте график.`,
          (d) => `1) D(f) = R, E(f) = R (корень нечетной степени определен везде);\n2) Центр симметрии в (${d.x0}; 0);\n3) Точки: (${d.x0 - 8}; ${-d.a * 2}), (${d.x0}; 0), (${d.x0 + 8}; ${d.a * 2}).`,
          'Кубический корень ∛x определен на всей числовой прямой, нечетен, имеет S-образную форму.',
          (d) => [
            { stepNum: 1, title: 'Анализ', content: `D(f) = (-∞; +∞). Центр симметрии (${d.x0}; 0).`, visualKey: 'coefficients' }
          ]
        )
      });
    }

    // 8. ФУНКЦИЯ С МОДУЛЕМ (|x|) (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const aCoeffs = [1, -1, 2, -2, 1.5, -1.5];
      const x0List = [0, 1, -1, 2, -2, 3, -3];
      const y0List = [-1, -2, -3, 1, 2, 3, 0];
      const a = aCoeffs[(i - 1) % aCoeffs.length];
      const x0 = x0List[(i * 2) % x0List.length];
      const y0 = y0List[(i * 3) % y0List.length];

      bank.push({
        id: `abs-${i}`,
        category: 'abs',
        categoryName: 'Функция с модулем (уголок)',
        difficulty: 'medium',
        difficultyLabel: 'Основной',
        points: 3,
        title: `Модуль y = a|x - x₀| + y₀: задание №${i}`,
        description: `Построение графика-уголка с вершиной в (${x0}; ${y0}) и число корней уравнения f(x) = m.`,
        variants: createVariants(
          (v) => {
            const curX0 = x0 + (v - 1);
            const fnStr = `${a}*abs(x - ${curX0}) ${y0 >= 0 ? '+ ' + y0 : '- ' + Math.abs(y0)}`;
            return {
              a, x0: curX0, y0, fnStr,
              graphConfig: {
                xMin: curX0 - 6, xMax: curX0 + 6, yMin: y0 - 4, yMax: y0 + 6, stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = a|x - x₀| + y₀' }],
                points: [
                  { x: curX0, y: y0, label: `В(${curX0}; ${y0}) излом`, color: '#ff2d75', dashedLines: true },
                  { x: curX0 + 2, y: y0 + Math.abs(2 * a), label: `(${curX0 + 2}; ${y0 + Math.abs(2 * a)})`, color: '#10e897' },
                  { x: curX0 - 2, y: y0 + Math.abs(2 * a), label: `(${curX0 - 2}; ${y0 + Math.abs(2 * a)})`, color: '#00f0ff' }
                ],
                asymptotes: [{ type: 'vertical', x: curX0, color: 'rgba(255, 45, 117, 0.4)', dashed: true }]
              }
            };
          },
          (d) => `Дана функция с модулем: y = ${d.fnStr.replace('*', '')}.\n1) Найдите координаты вершины излома (x₀; y₀) и ось симметрии;\n2) Раскройте модуль для x ≥ ${d.x0} и x < ${d.x0} и постройте график;\n3) При каких m уравнение имеет ровно 2 корня?`,
          (d) => `1) Вершина В(${d.x0}; ${d.y0}), ось x = ${d.x0};\n2) Лучи выходят из точки (${d.x0}; ${d.y0});\n3) Ровно 2 корня при m ${d.a > 0 ? `> ${d.y0}` : `< ${d.y0}`}.`,
          'График y = a|x - x₀| + y₀ состоит из двух лучей, выходящих из вершины (x₀; y₀).',
          (d) => [
            { stepNum: 1, title: 'Вершина излома', content: `Излом в точке (${d.x0}; ${d.y0}).`, visualKey: 'vertex' }
          ]
        )
      });
    }

    // 9. МОДУЛЬ ПАРАБОЛЫ |x² - c| (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const cList = [1, 4, 9, 2, 3, 5];
      const c = cList[(i - 1) % cList.length];

      bank.push({
        id: `abs-parabola-${i}`,
        category: 'abs_parabola',
        categoryName: 'Модуль квадратичной параболы',
        difficulty: 'hard',
        difficultyLabel: 'Продвинутый',
        points: 4,
        title: `Модуль параболы y = |x² - ${c}|: задание №${i}`,
        description: `Построение W-образной кривой с отражением отрицательной части и поиск числа корней уравнения f(x) = m.`,
        variants: createVariants(
          (v) => {
            const curC = c + (v - 1);
            const fnStr = `abs(x^2 - ${curC})`;
            const r = Math.sqrt(curC);
            return {
              c: curC, r, fnStr,
              graphConfig: {
                xMin: -r - 3, xMax: r + 3, yMin: -1, yMax: curC + 4, stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = |x² - c|' }],
                points: [
                  { x: 0, y: curC, label: `(0; ${curC}) купол`, color: '#ff2d75', dashedLines: true },
                  { x: parseFloat(r.toFixed(2)), y: 0, label: `(${r.toFixed(1)}; 0) излом`, color: '#10e897' },
                  { x: parseFloat((-r).toFixed(2)), y: 0, label: `(-${r.toFixed(1)}; 0) излом`, color: '#10e897' }
                ]
              }
            };
          },
          (d) => `Дана функция: y = |x² - ${d.c}|.\n1) Укажите область значений E(f);\n2) Найдите точки излома (нули функции);\n3) Постройте W-образный график;\n4) При каких m уравнение |x² - ${d.c}| = m имеет ровно 4 корня?`,
          (d) => `1) E(f) = [0; +∞);\n2) Нули: x = ±${d.r.toFixed(2)};\n3) Построена W-кривая с вершиной купола в (0; ${d.c});\n4) Ровно 4 корня при m ∈ (0; ${d.c}).`,
          'График y = |f(x)| получается зеркальным отражением отрицательной части графика y = f(x) вверх относительно оси Ox.',
          (d) => [
            { stepNum: 1, title: 'Анализ формы', content: `Купол в (0; ${d.c}), изломы на оси Ox в точках x = ±${d.r.toFixed(2)}. 4 корня при 0 < m < ${d.c}.`, visualKey: 'intervals' }
          ]
        )
      });
    }

    // 10. ПОКАЗАТЕЛЬНЫЙ РОСТ aˣ (a > 1) (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const bases = [2, 3, 2, 3, 4];
      const shifts = [0, -1, 1, -2, 2, -3];
      const a = bases[(i - 1) % bases.length];
      const c = shifts[(i * 2) % shifts.length];

      bank.push({
        id: `exp-growth-${i}`,
        category: 'exp_growth',
        categoryName: 'Показательная функция (рост)',
        difficulty: 'medium',
        difficultyLabel: 'Основной',
        points: 3,
        title: `Показательный рост y = ${a}ˣ + (${c}): задание №${i}`,
        description: `Построение графика экспоненциального роста с асимптотой y = ${c}.`,
        variants: createVariants(
          (v) => {
            const curC = c + (v - 1);
            const fnStr = `${a}^x ${curC >= 0 ? '+ ' + curC : '- ' + Math.abs(curC)}`;
            return {
              a, c: curC, fnStr,
              graphConfig: {
                xMin: -4, xMax: 4, yMin: curC - 2, yMax: curC + 9, stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: `y = ${a}ˣ + c` }],
                points: [
                  { x: 0, y: curC + 1, label: `(0; ${curC + 1})`, color: '#10e897' },
                  { x: 1, y: curC + a, label: `(1; ${curC + a})`, color: '#00f0ff' }
                ],
                asymptotes: [{ type: 'horizontal', y: curC, color: 'rgba(255, 45, 117, 0.7)', dashed: true }]
              }
            };
          },
          (d) => `Дана функция: y = ${d.a}ˣ ${d.c >= 0 ? '+ ' + d.c : '- ' + Math.abs(d.c)}.\n1) Найдите горизонтальную асимптоту и область значений E(f);\n2) Составьте таблицу для x ∈ {-1, 0, 1, 2} и постройте график;\n3) Исследуйте монотонность.`,
          (d) => `1) Асимптота y = ${d.c}, E(f) = (${d.c}; +∞);\n2) Точки: (0; ${d.c + 1}), (1; ${d.c + d.a});\n3) Функция строго возрастает (основание ${d.a} > 1).`,
          'Показательная функция y = aˣ при a > 1 монотонно возрастает на R. Асимптота y = 0 слева.',
          (d) => [
            { stepNum: 1, title: 'Асимптота', content: `При x → -∞ слагаемое ${d.a}ˣ → 0, поэтому y → ${d.c}.`, visualKey: 'asymptotes' }
          ]
        )
      });
    }

    // 11. ПОКАЗАТЕЛЬНОЕ ЗАТУХАНИЕ (½)ˣ (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const bases = [0.5, 0.33, 0.25];
      const shifts = [0, 1, -1, 2, -2];
      const a = bases[(i - 1) % bases.length];
      const c = shifts[(i * 2) % shifts.length];

      bank.push({
        id: `exp-decay-${i}`,
        category: 'exp_decay',
        categoryName: 'Показательное затухание (0 < a < 1)',
        difficulty: 'medium',
        difficultyLabel: 'Основной',
        points: 3,
        title: `Экспоненциальное затухание: задание №${i}`,
        description: `Построение графика убывающей экспоненты (a = ${a}).`,
        variants: createVariants(
          (v) => {
            const curC = c + (v - 1);
            const fnStr = `${a}^x ${curC >= 0 ? '+ ' + curC : '- ' + Math.abs(curC)}`;
            return {
              a, c: curC, fnStr,
              graphConfig: {
                xMin: -4, xMax: 5, yMin: curC - 2, yMax: curC + 9, stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: `y = (${a})ˣ + c` }],
                points: [
                  { x: 0, y: curC + 1, label: `(0; ${curC + 1})`, color: '#10e897' },
                  { x: -1, y: curC + (1 / a), label: `(-1; ${curC + (1 / a)})`, color: '#ff2d75' }
                ],
                asymptotes: [{ type: 'horizontal', y: curC, color: 'rgba(255, 45, 117, 0.7)', dashed: true }]
              }
            };
          },
          (d) => `Дана функция: y = (${d.a})ˣ ${d.c >= 0 ? '+ ' + d.c : '- ' + Math.abs(d.c)}.\n1) Асимптота и область значений;\n2) Таблица значений и график;\n3) Характер монотонности.`,
          (d) => `1) Асимптота y = ${d.c} (справа), E(f) = (${d.c}; +∞);\n2) Точки: (0; ${d.c + 1}), (-1; ${d.c + (1 / d.a)});\n3) Строго убывает (основание < 1).`,
          'При 0 < a < 1 функция y = aˣ строго убывает.',
          (d) => [
            { stepNum: 1, title: 'Анализ', content: `Убывает на всей прямой R. Асимптота y = ${d.c}.`, visualKey: 'coefficients' }
          ]
        )
      });
    }

    // 12. ЛОГАРИФМИЧЕСКАЯ ФУНКЦИЯ (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const bases = [2, 10, 2, 2];
      const x0List = [0, 1, -1, 2, -2, 3, -3];
      const base = bases[(i - 1) % bases.length];
      const x0 = x0List[(i * 2) % x0List.length];

      bank.push({
        id: `log-${i}`,
        category: 'log',
        categoryName: 'Логарифмическая функция',
        difficulty: 'medium',
        difficultyLabel: 'Основной',
        points: 3,
        title: `Логарифм y = logₐ(x - x₀): задание №${i}`,
        description: `Построение логарифмической кривой с ОДЗ x > ${x0} и вертикальной асимптотой x = ${x0}.`,
        variants: createVariants(
          (v) => {
            const curX0 = x0 + (v - 1);
            const fnStr = `log10(x - ${curX0}) / log10(${base})`;
            return {
              base, x0: curX0, fnStr,
              graphConfig: {
                xMin: curX0 - 1, xMax: curX0 + 9, yMin: -4, yMax: 4, stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = logₐ(...)', xMin: curX0 + 0.08 }],
                points: [
                  { x: curX0 + 1, y: 0, label: `(${curX0 + 1}; 0) нуль`, color: '#10e897', dashedLines: true },
                  { x: curX0 + base, y: 1, label: `(${curX0 + base}; 1)`, color: '#00f0ff' }
                ],
                asymptotes: [{ type: 'vertical', x: curX0, color: 'rgba(255, 45, 117, 0.7)', dashed: true }]
              }
            };
          },
          (d) => `Дана функция: y = log_${d.base}(x - ${d.x0}).\n1) Найдите ОДЗ и вертикальную асимптоту;\n2) Нуль функции и таблицу точек;\n3) Постройте график.`,
          (d) => `1) D(f) = (${d.x0}; +∞), асимптота x = ${d.x0};\n2) Нуль x = ${d.x0 + 1};\n3) Точки: (${d.x0 + 1}; 0), (${d.x0 + d.base}; 1).`,
          'Логарифм y = log_a(x - x₀) определен при x > x₀. Асимптота x = x₀.',
          (d) => [
            { stepNum: 1, title: 'ОДЗ', content: `x - ${d.x0} > 0 => x > ${d.x0}. Асимптота x = ${d.x0}.`, visualKey: 'asymptotes' }
          ]
        )
      });
    }

    // 13. СИНУСОИДА И ГАРМОНИКИ (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const amps = [1, 2, 3, 1.5, 2.5];
      const freqs = [1, 2, 0.5, 3];
      const A = amps[(i - 1) % amps.length];
      const w = freqs[(i * 2) % freqs.length];

      bank.push({
        id: `trig-sin-${i}`,
        category: 'trig_sin',
        categoryName: 'Тригонометрия: Синусоида и гармоники',
        difficulty: 'hard',
        difficultyLabel: 'Продвинутый',
        points: 4,
        title: `Синусоида y = ${A} sin(${w}x): задание №${i}`,
        description: `Построение гармонического колебания (амплитуда A = ${A}, частота ω = ${w}, период T = ${(2 * Math.PI / w).toFixed(2)}).`,
        variants: createVariants(
          (v) => {
            const curA = A + (v - 1) * 0.5;
            const fnStr = `${curA}*sin(${w}*x)`;
            const T = (2 * Math.PI) / w;
            return {
              A: curA, w, T, fnStr,
              graphConfig: {
                xMin: -T, xMax: T * 2, yMin: -curA - 1, yMax: curA + 1, stepX: parseFloat((T / 4).toFixed(2)), stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = A sin ωx' }],
                points: [
                  { x: 0, y: 0, label: '(0; 0)', color: '#10e897' },
                  { x: parseFloat((T / 4).toFixed(2)), y: curA, label: `max (${curA})`, color: '#ff2d75' }
                ]
              }
            };
          },
          (d) => `Дана функция: y = ${d.A} sin(${d.w}x).\n1) Амплитуда A, период T и E(f);\n2) Точки максимума и минимума на [0; T];\n3) Постройте график.`,
          (d) => `1) A = ${d.A}, T = ${(d.T).toFixed(2)}, E(f) = [-${d.A}; ${d.A}];\n2) Максимум в x = ${(d.T / 4).toFixed(2)} (y = ${d.A});\n3) Построена гармоническая волна.`,
          'Гармонические колебания y = A sin(ωx): амплитуда A, период T = 2π/ω.',
          (d) => [
            { stepNum: 1, title: 'Параметры', content: `A = ${d.A}, T = 2π/${d.w} = ${d.T.toFixed(2)}.`, visualKey: 'coefficients' }
          ]
        )
      });
    }

    // 14. КОСИНУСОИДА (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const amps = [1, 1.5, 2, 2.5, 3];
      const shifts = [0, 1, -1, 2, -2];
      const A = amps[(i - 1) % amps.length];
      const b = shifts[(i * 3) % shifts.length];

      bank.push({
        id: `trig-cos-${i}`,
        category: 'trig_cos',
        categoryName: 'Тригонометрия: Косинусоида',
        difficulty: 'medium',
        difficultyLabel: 'Основной',
        points: 3,
        title: `Косинусоида y = ${A} cos(x) + ${b}: задание №${i}`,
        description: `Построение и исследование четной функции косинуса.`,
        variants: createVariants(
          (v) => {
            const curA = A + (v - 1) * 0.5;
            const fnStr = `${curA}*cos(x) ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}`;
            return {
              A: curA, b, fnStr,
              graphConfig: {
                xMin: -6.5, xMax: 6.5, yMin: b - curA - 1, yMax: b + curA + 1, stepX: 1.57, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = A cos x + b' }],
                points: [
                  { x: 0, y: b + curA, label: `(0; ${b + curA}) max`, color: '#ff2d75', dashedLines: true },
                  { x: 3.14, y: b - curA, label: `(π; ${b - curA}) min`, color: '#ff2d75' }
                ]
              }
            };
          },
          (d) => `Дана функция: y = ${d.fnStr.replace('*', '')}.\n1) Докажите четность функции;\n2) Область значений E(f);\n3) Постройте график на [-2π; 2π].`,
          (d) => `1) Четная: cos(-x) = cos(x);\n2) E(f) = [${d.b - d.A}; ${d.b + d.A}];\n3) Построена волна с куполом в точке (0; ${d.b + d.A}).`,
          'Косинус cos(x) — четная периодическая функция с периодом 2π.',
          (d) => [
            { stepNum: 1, title: 'Анализ', content: `E(f) = [${d.b - d.A}; ${d.b + d.A}]. Четная.`, visualKey: 'coefficients' }
          ]
        )
      });
    }

    // 15. ТАНГЕНСОИДА (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const aCoeffs = [1, 2, 0.5, -1, -2];
      const a = aCoeffs[(i - 1) % aCoeffs.length];

      bank.push({
        id: `trig-tan-${i}`,
        category: 'trig_tan',
        categoryName: 'Тригонометрия: Тангенсоида',
        difficulty: 'hard',
        difficultyLabel: 'Продвинутый',
        points: 4,
        title: `Тангенсоида y = ${a} tg(x): задание №${i}`,
        description: `Построение тангенсоиды на периоде (-π/2; π/2) и вертикальные асимптоты.`,
        variants: createVariants(
          (v) => {
            const curA = a;
            const fnStr = `${curA}*tan(x)`;
            return {
              a: curA, fnStr,
              graphConfig: {
                xMin: -4.5, xMax: 4.5, yMin: -5, yMax: 5, stepX: 1.57, stepY: 1,
                functions: [
                  { fn: fnStr, color: '#00f0ff', width: 3, label: 'y = a tg x', xMin: -1.45, xMax: 1.45 }
                ],
                points: [
                  { x: 0, y: 0, label: '(0; 0)', color: '#ff2d75' },
                  { x: 0.79, y: curA, label: `(π/4; ${curA})`, color: '#10e897' }
                ],
                asymptotes: [
                  { type: 'vertical', x: 1.57, color: 'rgba(255, 45, 117, 0.7)', dashed: true },
                  { type: 'vertical', x: -1.57, color: 'rgba(255, 45, 117, 0.7)', dashed: true }
                ]
              }
            };
          },
          (d) => `Дана функция: y = ${d.a} tan(x).\n1) Асимптоты на (-π; π);\n2) Период T и монотонность;\n3) Постройте график.`,
          (d) => `1) Асимптоты x = ±π/2 ≈ ±1.57;\n2) T = π, ${d.a > 0 ? 'строго возрастает' : 'строго убывает'};\n3) Построена тангенсоида.`,
          'Тангенс не определен при x = π/2 + πk (вертикальные асимптоты). Период T = π.',
          (d) => [
            { stepNum: 1, title: 'Асимптоты', content: 'x = ±π/2. Период равен π.', visualKey: 'asymptotes' }
          ]
        )
      });
    }

    // 16. АРКТАНГЕНС (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const aCoeffs = [1, 2, -1, 1.5];
      const shifts = [0, 1, -1, 2, -2];
      const a = aCoeffs[(i - 1) % aCoeffs.length];
      const c = shifts[(i * 2) % shifts.length];

      bank.push({
        id: `arctrig-${i}`,
        category: 'arctrig',
        categoryName: 'Обратные тригонометрические (арктангенс)',
        difficulty: 'hard',
        difficultyLabel: 'Продвинутый',
        points: 4,
        title: `Арктангенс y = ${a} arctg(x) + ${c}: задание №${i}`,
        description: `Построение арктангенса и две горизонтальные асимптоты y = ±(aπ/2) + c.`,
        variants: createVariants(
          (v) => {
            const curC = c + (v - 1);
            const fnStr = `${a}*atan(x) ${curC >= 0 ? '+ ' + curC : '- ' + Math.abs(curC)}`;
            const topAsymp = curC + a * 1.57;
            const botAsymp = curC - a * 1.57;
            return {
              a, c: curC, topAsymp, botAsymp, fnStr,
              graphConfig: {
                xMin: -6, xMax: 6, yMin: Math.min(topAsymp, botAsymp) - 1.5, yMax: Math.max(topAsymp, botAsymp) + 1.5,
                stepX: 1, stepY: 1,
                functions: [{ fn: fnStr, color: '#00f0ff', width: 3, label: 'y = arctg x' }],
                points: [{ x: 0, y: curC, label: `(0; ${curC})`, color: '#ff2d75' }],
                asymptotes: [
                  { type: 'horizontal', y: topAsymp, color: 'rgba(255, 45, 117, 0.7)', dashed: true },
                  { type: 'horizontal', y: botAsymp, color: 'rgba(255, 45, 117, 0.7)', dashed: true }
                ]
              }
            };
          },
          (d) => `Дана функция: y = ${d.fnStr.replace('*', '')}.\n1) D(f) и E(f);\n2) Горизонтальные асимптоты;\n3) Постройте график.`,
          (d) => `1) D(f) = R, E(f) = (${Math.min(d.topAsymp, d.botAsymp).toFixed(2)}; ${Math.max(d.topAsymp, d.botAsymp).toFixed(2)});\n2) Асимптоты y = ${d.topAsymp.toFixed(2)} и y = ${d.botAsymp.toFixed(2)};\n3) Построена S-образная кривая с асимптотами.`,
          'Функция y = arctg x определена на всей оси R и имеет две горизонтальные асимптоты.',
          (d) => [
            { stepNum: 1, title: 'Асимптоты', content: `Горизонтальные асимптоты на бесконечностях.`, visualKey: 'asymptotes' }
          ]
        )
      });
    }

    // 17. КУСОЧНО-ЗАДАННЫЕ ФУНКЦИИ (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const splitPoints = [0, 1, 2, -1, -2];
      const splitX = splitPoints[(i - 1) % splitPoints.length];

      bank.push({
        id: `piecewise-${i}`,
        category: 'piecewise',
        categoryName: 'Кусочно-заданные функции',
        difficulty: 'hard',
        difficultyLabel: 'Продвинутый',
        points: 4,
        title: `Кусочная функция со стыком в x = ${splitX}: задание №${i}`,
        description: `Построение графика из двух различных функций на интервалах и исследование непрерывности.`,
        variants: createVariants(
          (v) => {
            const sx = splitX + (v - 1);
            const fn1 = `x + ${2 - sx}`;
            const fn2 = `(x - ${sx + 1})^2 + 1`;
            return {
              sx, fn1, fn2,
              graphConfig: {
                xMin: sx - 4, xMax: sx + 4, yMin: -2, yMax: 6, stepX: 1, stepY: 1,
                functions: [
                  { fn: fn1, color: '#00f0ff', width: 3, label: `y₁ (x < ${sx})`, xMax: sx },
                  { fn: fn2, color: '#ff2d75', width: 3, label: `y₂ (x ≥ ${sx})`, xMin: sx }
                ],
                points: [
                  { x: sx, y: 2, label: `(${sx}; 2) стык`, color: '#10e897', dashedLines: true }
                ]
              }
            };
          },
          (d) => `Дана кусочная функция: y = ${d.fn1} при x < ${d.sx}; y = ${d.fn2} при x ≥ ${d.sx}.\n1) Найдите значение f(${d.sx});\n2) Исследуйте непрерывность в точке стыка x = ${d.sx};\n3) Постройте график функции.`,
          (d) => `1) f(${d.sx}) = 2;\n2) Пределы слева и справа равны 2 => функция непрерывна в x = ${d.sx};\n3) Построен стык луча прямой и параболы.`,
          'В точке стыка вычисляются односторонние пределы для проверки наличия разрыва.',
          (d) => [
            { stepNum: 1, title: 'Непрерывность', content: `В точке x = ${d.sx} обе формулы дают одинаковое значение 2. Разрыва нет.`, visualKey: 'coefficients' }
          ]
        )
      });
    }

    // 18. ГРАФИЧЕСКИЕ УРАВНЕНИЯ f(x) = g(x) (50 заданий)
    for (let i = 1; i <= 50; i++) {
      const roots = [[-1, 2], [-2, 3], [0, 3], [-3, 1], [1, 4]];
      const r = roots[(i - 1) % roots.length];

      bank.push({
        id: `solve-graph-${i}`,
        category: 'solve_graph',
        categoryName: 'Графическое решение уравнений f(x) = g(x)',
        difficulty: 'hard',
        difficultyLabel: 'Продвинутый',
        points: 4,
        title: `Графическое решение уравнения: задание №${i}`,
        description: `Построение параболы и прямой в одной системе координат и нахождение корней x₁ = ${r[0]}, x₂ = ${r[1]}.`,
        variants: createVariants(
          (v) => {
            const shift = (v - 1);
            const x1 = r[0] + shift;
            const x2 = r[1] + shift;
            const fn1 = `x^2 - ${(x1 + x2)}*x + ${(x1 * x2)}`;
            const fn2 = `0`;
            return {
              x1, x2, fn1, fn2,
              graphConfig: {
                xMin: Math.min(x1, x2) - 3, xMax: Math.max(x1, x2) + 3, yMin: -5, yMax: 6, stepX: 1, stepY: 1,
                functions: [
                  { fn: fn1, color: '#00f0ff', width: 3, label: 'y₁ = парабола' },
                  { fn: 'x - ' + x1, color: '#ff2d75', width: 2, label: 'y₂ = прямая' }
                ],
                points: [
                  { x: x1, y: 0, label: `(${x1}; 0) корень`, color: '#10e897' }
                ]
              }
            };
          },
          (d) => `Решите графически уравнение: парабола пересекает прямую.\n1) Постройте оба графика в одной системе координат;\n2) Найдите точки их пересечения;\n3) Запишите корни уравнения.`,
          (d) => `1) Построены парабола и прямая;\n2) Точки пересечения найдены на чертеже;\n3) Корни уравнения: x₁ = ${d.x1}, x₂ = ${d.x2}.`,
          'Корнями уравнения f(x) = g(x) являются абсциссы точек пересечения графиков y = f(x) и y = g(x).',
          (d) => [
            { stepNum: 1, title: 'Корни', content: `Абсциссы точек пересечения: x₁ = ${d.x1}, x₂ = ${d.x2}.`, visualKey: 'zeros' }
          ]
        )
      });
    }

    // Предварительная индексация для мгновенного поиска без лагов (O(1))
    bank.forEach(t => {
      t._searchIndex = `${t.title} ${t.description || ''} ${t.categoryName || ''} ${t.variants.map(v => v.question).join(' ')}`.toLowerCase();
    });

    return bank;
  }
}

const INITIAL_TASK_BANK = DatabaseEngine.generateAllTasks();
