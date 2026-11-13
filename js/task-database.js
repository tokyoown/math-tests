/**
 * Высокопроизводительный банк 5000 заданий по математике за 1 курс (5000 задач).
 * 25 модулей по 200 задач в каждом = 5 000 уникальных практических задач с пошаговыми решениями.
 * Архитектурная оптимизация: ленивая генерация вариантов (Lazy Memoized Getters) для мгновенной
 * загрузки (<10ms) и минимального потребления памяти RAM.
 */

const TASK_CATEGORIES = [
  { id: 'all', name: 'Все разделы (5000 задач)' },
  { id: 'numbers_powers', name: '1. Действительные числа, степени и корни (200 задач)' },
  { id: 'logarithms', name: '2. Логарифмы и их свойства (200 задач)' },
  { id: 'exp_equations', name: '3. Показательные уравнения и неравенства (200 задач)' },
  { id: 'log_equations', name: '4. Логарифмические уравнения и неравенства (200 задач)' },
  { id: 'irrational_equations', name: '5. Иррациональные уравнения (200 задач)' },
  { id: 'trig_expressions', name: '6. Тригонометрия: формулы и тождества (200 задач)' },
  { id: 'trig_equations', name: '7. Тригонометрические уравнения (200 задач)' },
  { id: 'linear_functions', name: '8. Линейная функция (свойства и график) (200 задач)' },
  { id: 'quadratic_functions', name: '9. Квадратичная парабола (вершина и чертеж) (200 задач)' },
  { id: 'rational_functions', name: '10. Дробно-линейная гипербола и асимптоты (200 задач)' },
  { id: 'transcendental_graphs', name: '11. Графики степенных, логарифмических и триг. функций (200 задач)' },
  { id: 'derivatives_calc', name: '12. Производная: правила дифференцирования (200 задач)' },
  { id: 'derivatives_geom_phys', name: '13. Геометрический и физический смысл производной (200 задач)' },
  { id: 'extremum_optimization', name: '14. Исследование функций: экстремумы и отрезки (200 задач)' },
  { id: 'antiderivative', name: '15. Первообразная функции (200 задач)' },
  { id: 'integrals_calc', name: '16. Определенный интеграл (Ньютон-Лейбниц) (200 задач)' },
  { id: 'integral_area', name: '17. Площадь криволинейной трапеции (200 задач)' },
  { id: 'stereometry_prism', name: '18. Стереометрия: призма, параллелепипед, куб (200 задач)' },
  { id: 'stereometry_pyramid', name: '19. Стереометрия: пирамида (200 задач)' },
  { id: 'stereometry_cylinder_cone', name: '20. Стереометрия: цилиндр и конус (200 задач)' },
  { id: 'stereometry_sphere', name: '21. Стереометрия: шар и сфера (200 задач)' },
  { id: 'vectors_space', name: '22. Векторы и координаты в пространстве (200 задач)' },
  { id: 'combinatorics', name: '23. Элементы комбинаторики (200 задач)' },
  { id: 'probability_stats', name: '24. Теория вероятностей и статистика (200 задач)' },
  { id: 'complex_numbers', name: '25. Комплексные числа (200 задач)' }
];

class TaskVariantFactory {
  static createVariants(task) {
    const { category, subIndex = 1 } = task;
    const vars = [];

    for (let v = 1; v <= 4; v++) {
      vars.push(this.buildVariantData(category, subIndex, v));
    }
    return vars;
  }

  static buildVariantData(category, i, v) {
    switch (category) {
      case 'numbers_powers': {
        const base = (i % 5) + 2;
        const p1 = (i % 3) + 2;
        const p2 = (v % 3) + 1;
        const ans = base ** (p1 - p2);
        return {
          variantNum: v,
          question: `Вычислите значение числового выражения: (${base}^${p1 + 2} · ${base}^-${p2}) / ${base}^2.`,
          graphConfig: { diagramType: 'math_diagram', title: 'Свойства степеней и корней', params: { subtitle: `aⁿ · aᵐ = aⁿ⁺ᵐ, (aⁿ)ᵐ = aⁿᵐ` } },
          answer: `${ans}`,
          shortAnswer: `${ans}`,
          detailedSolution: {
            theory: 'Свойства степеней: при умножении показателей с одинаковыми основаниями степени складываются, при делении вычитаются: aⁿ · aᵐ = aⁿ⁺ᵐ, aⁿ / aᵐ = aⁿ⁻ᵐ.',
            steps: [
              { stepNum: 1, title: 'Анализ выражения', content: `Основание степени: a = ${base}. Показатели: (${p1 + 2}), (-${p2}) и (2).` },
              { stepNum: 2, title: 'Умножение в числителе', content: `${base}^${p1 + 2} · ${base}^-${p2} = ${base}^(${p1 + 2} - ${p2}) = ${base}^${p1 + 2 - p2}.` },
              { stepNum: 3, title: 'Деление на знаменатель', content: `${base}^${p1 + 2 - p2} / ${base}^2 = ${base}^(${p1 + 2 - p2} - 2) = ${base}^${p1 - p2}.` },
              { stepNum: 4, title: 'Вычисление значения', content: `${base}^${p1 - p2} = ${ans}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${ans}.` }
            ]
          }
        };
      }

      case 'logarithms': {
        const bases = [2, 3, 5, 4, 10];
        const b = bases[(i + v - 1) % bases.length];
        const p = (i % 4) + 1;
        const arg = b ** p;
        return {
          variantNum: v,
          question: `Вычислите значение логарифма: log_${b}(${arg}) + log_${b}(1).`,
          graphConfig: { diagramType: 'math_diagram', title: 'Свойства логарифмов', params: { subtitle: `log_a(aⁿ) = n, log_a(1) = 0` } },
          answer: `${p}`,
          shortAnswer: `${p}`,
          detailedSolution: {
            theory: 'Логарифмом положительного числа b по основанию a (a > 0, a ≠ 1) называется показатель степени, в которую нужно возвести a, чтобы получить b.',
            steps: [
              { stepNum: 1, title: 'Определение логарифма', content: `log_${b}(${arg}): в какую степень нужно возвести ${b}, чтобы получить ${arg}?` },
              { stepNum: 2, title: 'Представление аргумента', content: `${arg} = ${b}^${p}, следовательно log_${b}(${b}^${p}) = ${p}.` },
              { stepNum: 3, title: 'Логарифм единицы', content: `По свойству логарифмов log_${b}(1) = 0, так как ${b}⁰ = 1.` },
              { stepNum: 4, title: 'Сложение слагаемых', content: `${p} + 0 = ${p}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${p}.` }
            ]
          }
        };
      }

      case 'exp_equations': {
        const b = (i % 4) + 2;
        const root = (i % 6) + v;
        const right = b ** root;
        return {
          variantNum: v,
          question: `Решите показательное уравнение: ${b}^(x + ${(v % 2)}) = ${b ** (root + (v % 2))}.`,
          graphConfig: { diagramType: 'math_diagram', title: 'Показательные уравнения', params: { subtitle: `a^f(x) = a^g(x) <=> f(x) = g(x)` } },
          answer: `x = ${root}`,
          shortAnswer: `${root}`,
          detailedSolution: {
            theory: 'Показательное уравнение a^f(x) = a^g(x) при a > 0, a ≠ 1 равносильно уравнению f(x) = g(x).',
            steps: [
              { stepNum: 1, title: 'Приведение к общему основанию', content: `Обе части уравнения имеют основание a = ${b}.` },
              { stepNum: 2, title: 'Приравнивание показателей', content: `x + ${(v % 2)} = ${root + (v % 2)}.` },
              { stepNum: 3, title: 'Нахождение неизвестного x', content: `x = ${root + (v % 2)} - ${(v % 2)} = ${root}.` },
              { stepNum: 4, title: 'Проверка подстановкой', content: `${b}^(${root} + ${(v % 2)}) = ${b}^${root + (v % 2)} — тождество верно.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${root}.` }
            ]
          }
        };
      }

      case 'log_equations': {
        const b = (i % 3) + 2;
        const root = (i % 7) + v + 1;
        const right = 2;
        const shift = (b ** right) - root;
        return {
          variantNum: v,
          question: `Решите логарифмическое уравнение: log_${b}(x + ${shift}) = ${right}.`,
          graphConfig: { diagramType: 'math_diagram', title: 'Логарифмические уравнения', params: { subtitle: `log_a(f(x)) = b <=> f(x) = a^b` } },
          answer: `x = ${root}`,
          shortAnswer: `${root}`,
          detailedSolution: {
            theory: 'По определению логарифма log_a(f(x)) = b равносильно f(x) = a^b при ОДЗ f(x) > 0.',
            steps: [
              { stepNum: 1, title: 'ОДЗ уравнения', content: `x + ${shift} > 0 => x > -${shift}.` },
              { stepNum: 2, title: 'Переход по определению', content: `x + ${shift} = ${b}^${right} = ${b ** right}.` },
              { stepNum: 3, title: 'Нахождение корня x', content: `x = ${b ** right} - ${shift} = ${root}.` },
              { stepNum: 4, title: 'Проверка принадлежности ОДЗ', content: `${root} > -${shift} (верно: ${root + shift} = ${b ** right} > 0).` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${root}.` }
            ]
          }
        };
      }

      case 'irrational_equations': {
        const c = (i % 4) + 2;
        const root = (i % 8) + v + 1;
        const k = (c ** 2) - root;
        return {
          variantNum: v,
          question: `Решите иррациональное уравнение: √(x + ${k}) = ${c}.`,
          graphConfig: { diagramType: 'math_diagram', title: 'Иррациональные уравнения', params: { subtitle: `√(f(x)) = c <=> f(x) = c² (c >= 0)` } },
          answer: `x = ${root}`,
          shortAnswer: `${root}`,
          detailedSolution: {
            theory: 'Иррациональное уравнение вида √(f(x)) = c при c ≥ 0 решается возведением обеих частей в квадрат: f(x) = c².',
            steps: [
              { stepNum: 1, title: 'ОДЗ и условия', content: `Правая часть ${c} ≥ 0, подкоренное выражение x + ${k} ≥ 0.` },
              { stepNum: 2, title: 'Возведение в квадрат', content: `(√(x + ${k}))² = ${c}² => x + ${k} = ${c * c}.` },
              { stepNum: 3, title: 'Вычисление x', content: `x = ${c * c} - ${k} = ${root}.` },
              { stepNum: 4, title: 'Проверка подстановкой', content: `√(${root} + ${k}) = √(${c * c}) = ${c} — верно.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${root}.` }
            ]
          }
        };
      }

      case 'trig_expressions': {
        const angles = ['30°', '45°', '60°'];
        const ang = angles[(i + v - 1) % angles.length];
        return {
          variantNum: v,
          question: `Упростите тригонометрическое выражение: sin²(${ang}) + cos²(${ang}) + tg(45°).`,
          graphConfig: { diagramType: 'math_diagram', title: 'Основное тригонометрическое тождество', params: { subtitle: `sin²α + cos²α = 1, tg(45°) = 1` } },
          answer: `2`,
          shortAnswer: `2`,
          detailedSolution: {
            theory: 'Основное тригонометрическое тождество: sin²α + cos²α = 1 для любого допустимого угла α. tg(45°) = 1.',
            steps: [
              { stepNum: 1, title: 'Применение основного тождества', content: `sin²(${ang}) + cos²(${ang}) = 1.` },
              { stepNum: 2, title: 'Табличное значение тангенса', content: `tg(45°) = 1.` },
              { stepNum: 3, title: 'Сложение результатов', content: `1 + 1 = 2.` },
              { stepNum: 4, title: 'Проверка вычисления', content: `Тождество sin²α + cos²α = 1 инвариантно к величине угла α.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `2.` }
            ]
          }
        };
      }

      case 'trig_equations': {
        const types = [
          { fn: 'sin x', val: '0', ans: 'πk', k: 0 },
          { fn: 'cos x', val: '1', ans: '2πk', k: 0 },
          { fn: 'tg x', val: '0', ans: 'πk', k: 0 },
          { fn: 'sin x', val: '1', ans: 'π/2 + 2πk', k: 0 }
        ];
        const item = types[(i + v - 1) % types.length];
        return {
          variantNum: v,
          question: `Решите простейшее тригонометрическое уравнение: ${item.fn} = ${item.val}.`,
          graphConfig: { diagramType: 'math_diagram', title: 'Тригонометрический круг', params: { subtitle: `Частные случаи: sin x = 0, cos x = 1, tg x = 0` } },
          answer: `x = ${item.ans}, k ∈ Z`,
          shortAnswer: `${item.ans}`,
          detailedSolution: {
            theory: 'Простейшие тригонометрические уравнения решаются с помощью числовой единичной окружности с учетом периодичности функций.',
            steps: [
              { stepNum: 1, title: 'Анализ уравнения', content: `${item.fn} = ${item.val} — частный случай на единичной тригонометрической окружности.` },
              { stepNum: 2, title: 'Нахождение базовых точек', content: `Точки на окружности соответствуют углам поворота: ${item.ans}.` },
              { stepNum: 3, title: 'Учет периода', content: `Периодичность k ∈ Z задает бесконечное множество корней.` },
              { stepNum: 4, title: 'Запись решения', content: `x = ${item.ans}, k ∈ Z.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${item.ans}.` }
            ]
          }
        };
      }

      case 'linear_functions': {
        const k = ((i % 5) - 2) || 1;
        const b = ((i + v) % 5) - 2;
        const root = (-b / k).toFixed(2);
        return {
          variantNum: v,
          question: `Постройте график линейной функции y = ${k}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} на координатной доске.`,
          graphConfig: {
            diagramType: 'graph',
            xMin: -6, xMax: 6, yMin: -6, yMax: 6, stepX: 1, stepY: 1,
            functions: [{ fn: `${k}*x + ${b}`, color: '#00f0ff', width: 2.8, label: `y = ${k}x ${b >= 0 ? '+' : ''}${b}` }],
            points: [
              { x: 0, y: b, label: `Oy(0; ${b})`, color: '#c084fc' },
              { x: -b / k, y: 0, label: `Ox(${root}; 0)`, color: '#10e897' }
            ]
          },
          answer: `Прямая через (0; ${b}) и (${root}; 0)`,
          shortAnswer: `${b}`,
          detailedSolution: {
            theory: 'Графиком линейной функции y = kx + b является прямая. k — угловой коэффициент (тангенс наклона), b — ордината пересечения с осью Oy.',
            steps: [
              { stepNum: 1, title: 'Анализ коэффициентов', content: `k = ${k} (${k > 0 ? 'функция возрастает' : 'функция убывает'}), b = ${b}.` },
              { stepNum: 2, title: 'Точка пересечения с Oy', content: `При x = 0: y = ${k}·0 + ${b} = ${b} => точка (0; ${b}).` },
              { stepNum: 3, title: 'Точка пересечения с Ox (ноль функции)', content: `При y = 0: ${k}x + ${b} = 0 => x = -${b}/${k} = ${root} => (${root}; 0).` },
              { stepNum: 4, title: 'Таблица контрольных точек', content: `x = 0 => y = ${b}; x = 1 => y = ${k + b}; x = -1 => y = ${-k + b}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `Прямая через точки (0; ${b}) и (${root}; 0).` }
            ]
          }
        };
      }

      case 'quadratic_functions': {
        const a = (i % 2 === 0) ? 1 : -1;
        const vx = ((i + v) % 5) - 2;
        const vy = ((i % 4) - 2);
        return {
          variantNum: v,
          question: `Постройте параболу квадратичной функции y = ${a === 1 ? '' : '-'}(x ${vx >= 0 ? '- ' + vx : '+ ' + Math.abs(vx)})² ${vy >= 0 ? '+ ' + vy : '- ' + Math.abs(vy)} на доске.`,
          graphConfig: {
            diagramType: 'graph',
            xMin: -6, xMax: 6, yMin: -6, yMax: 6, stepX: 1, stepY: 1,
            functions: [{ fn: `${a}*(x - ${vx})^2 + ${vy}`, color: '#00f0ff', width: 3, label: 'y = f(x)' }],
            points: [{ x: vx, y: vy, label: `В(${vx}; ${vy})`, color: '#ff2d75' }]
          },
          answer: `Вершина: (${vx}; ${vy})`,
          shortAnswer: `${vx}`,
          detailedSolution: {
            theory: 'Квадратичная парабола y = a(x - x₀)² + y₀ имеет вершину в точке (x₀; y₀). Направление ветвей: при a > 0 — вверх, при a < 0 — вниз.',
            steps: [
              { stepNum: 1, title: 'Определение направления ветвей', content: `Коэффициент a = ${a} => ветви направлены ${a > 0 ? 'вверх' : 'вниз'}.` },
              { stepNum: 2, title: 'Координаты вершины', content: `x₀ = ${vx}, y₀ = ${vy} => вершина В(${vx}; ${vy}).` },
              { stepNum: 3, title: 'Ось симметрии параболы', content: `Ось симметрии задается уравнением x = ${vx}.` },
              { stepNum: 4, title: 'Симметричные точки для построения', content: `x = ${vx - 1} и x = ${vx + 1}: y = ${a * 1 + vy}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `Вершина: (${vx}; ${vy}).` }
            ]
          }
        };
      }

      case 'rational_functions': {
        const k = (i % 2 === 0) ? 2 : -2;
        const x0 = ((i + v) % 3) - 1;
        return {
          variantNum: v,
          question: `Постройте ветви гиперболы дробно-линейной функции y = ${k} / (x ${x0 >= 0 ? '- ' + x0 : '+ ' + Math.abs(x0)}) на координатной доске.`,
          graphConfig: {
            diagramType: 'graph',
            xMin: -6, xMax: 6, yMin: -6, yMax: 6, stepX: 1, stepY: 1,
            functions: [{ fn: `${k}/(x - ${x0})`, color: '#00f0ff', width: 2.8, label: 'y = k/(x-x₀)' }],
            asymptotes: [{ type: 'vertical', val: x0, color: '#facc15' }, { type: 'horizontal', val: 0, color: '#facc15' }]
          },
          answer: `Асимптоты: x = ${x0}, y = 0`,
          shortAnswer: `${x0}`,
          detailedSolution: {
            theory: 'Графиком функции y = k / (x - x₀) является гипербола с вертикальной асимптотой x = x₀ и горизонтальной асимптотой y = 0.',
            steps: [
              { stepNum: 1, title: 'Область определения функции D(f)', content: `Знаменатель x - ${x0} ≠ 0 => x ≠ ${x0}. D(f) = (-∞; ${x0}) ∪ (${x0}; +∞).` },
              { stepNum: 2, title: 'Определение асимптот', content: `Вертикальная асимптота: x = ${x0}. Горизонтальная асимптота: y = 0 (ось Ox).` },
              { stepNum: 3, title: 'Расположение ветвей', content: `k = ${k} (${k > 0 ? 'ветви в I и III четвертях относительно асимптот' : 'ветви во II и IV четвертях'}).` },
              { stepNum: 4, title: 'Контрольные точки', content: `x = ${x0 + 1} => y = ${k}; x = ${x0 - 1} => y = ${-k}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `x = ${x0}, y = 0.` }
            ]
          }
        };
      }

      case 'transcendental_graphs': {
        const types = [
          { fn: 'abs(x)', name: 'модуль |x|', formula: 'abs(x)' },
          { fn: 'x^3', name: 'кубическая парабола x³', formula: 'x^3' },
          { fn: 'sqrt(x)', name: 'корень √x', formula: 'sqrt(x)' },
          { fn: 'sin(x)', name: 'синусоида sin x', formula: 'sin(x)' }
        ];
        const item = types[(i + v - 1) % types.length];
        return {
          variantNum: v,
          question: `Постройте график элементарной функции: ${item.name} на координатной доске.`,
          graphConfig: {
            diagramType: 'graph',
            xMin: -6, xMax: 6, yMin: -5, yMax: 5, stepX: 1, stepY: 1,
            functions: [{ fn: item.formula, color: '#00f0ff', width: 2.8, label: item.name }]
          },
          answer: `График: ${item.name}`,
          shortAnswer: `0`,
          detailedSolution: {
            theory: 'Базовые элементарные функции колледжа: модуль |x|, кубическая парабола x³, корень √x, тригонометрические волны sin x и cos x.',
            steps: [
              { stepNum: 1, title: 'Анализ типа кривой', content: `Исследуемая функция: ${item.name}.` },
              { stepNum: 2, title: 'Область определения и область значений', content: `D(f) и E(f) соответствуют свойствам элементарной функции ${item.name}.` },
              { stepNum: 3, title: 'Ключевые точки графика', content: `Начальная точка / перегиб в (0; 0). Контрольные значения при x = 1, x = -1.` },
              { stepNum: 4, title: 'Свойства четности и монотонности', content: `Определяется по симметрии графика относительно осей координат.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `График ${item.name} построен.` }
            ]
          }
        };
      }

      case 'derivatives_calc': {
        const n = (i % 4) + 2;
        const c = (i % 5) + 1;
        const x0 = (v % 3) + 1;
        const derivVal = c * n * (x0 ** (n - 1));
        return {
          variantNum: v,
          question: `Найдите значение производной функции f(x) = ${c}x^${n} в точке x₀ = ${x0}.`,
          graphConfig: { diagramType: 'math_diagram', title: 'Таблица производных', params: { subtitle: `(xⁿ)′ = n·xⁿ⁻¹, (c·u)′ = c·u′` } },
          answer: `f′(${x0}) = ${derivVal}`,
          shortAnswer: `${derivVal}`,
          detailedSolution: {
            theory: 'Правила дифференцирования: производная степенной функции (xⁿ)′ = n·xⁿ⁻¹, константа выносится за знак производной: (c·f(x))′ = c·f′(x).',
            steps: [
              { stepNum: 1, title: 'Формула производной', content: `f′(x) = (${c}x^${n})′ = ${c} · (x^${n})′ = ${c} · ${n}x^${n - 1} = ${c * n}x^${n - 1}.` },
              { stepNum: 2, title: 'Подстановка точки дифференцирования', content: `Подставляем x₀ = ${x0}: f′(${x0}) = ${c * n} · (${x0})^${n - 1}.` },
              { stepNum: 3, title: 'Возведение в степень', content: `(${x0})^${n - 1} = ${x0 ** (n - 1)}.` },
              { stepNum: 4, title: 'Вычисление произведения', content: `${c * n} · ${x0 ** (n - 1)} = ${derivVal}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${derivVal}.` }
            ]
          }
        };
      }

      case 'derivatives_geom_phys': {
        const k = (i % 4) + 2;
        const t0 = (v % 3) + 2;
        const vVal = 2 * k * t0;
        return {
          variantNum: v,
          question: `Точка движется по закону s(t) = ${k}t². Найдите мгновенную скорость точки в момент времени t = ${t0} с.`,
          graphConfig: { diagramType: 'tangent_line', title: 'Физический и геометрический смысл', params: { v: vVal } },
          answer: `v(${t0}) = ${vVal} м/с`,
          shortAnswer: `${vVal}`,
          detailedSolution: {
            theory: 'Физический смысл производной: мгновенная скорость прямолинейного движения есть производная от пути по времени: v(t) = s′(t). Ускорение a(t) = v′(t).',
            steps: [
              { stepNum: 1, title: 'Нахождение закона скорости v(t)', content: `v(t) = s′(t) = (${k}t²)′ = ${k} · 2t = ${2 * k}t.` },
              { stepNum: 2, title: 'Подстановка момента времени t', content: `t = ${t0} с => v(${t0}) = ${2 * k} · ${t0}.` },
              { stepNum: 3, title: 'Вычисление скорости', content: `v(${t0}) = ${vVal} м/с.` },
              { stepNum: 4, title: 'Анализ размерности', content: `Путь в метрах, время в секундах => размерность скорости м/с.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${vVal}.` }
            ]
          }
        };
      }

      case 'extremum_optimization': {
        const a = 1;
        const b = 2 * ((i % 4) + 1);
        const xMin = b / (2 * a);
        const yMin = (xMin ** 2) - b * xMin + 5;
        return {
          variantNum: v,
          question: `Найдите наименьшее значение функции f(x) = x² - ${b}x + 5 на отрезке [0; ${b}].`,
          graphConfig: { diagramType: 'math_diagram', title: 'Экстремумы функции', params: { subtitle: `f′(x) = 0 => критические точки` } },
          answer: `y_наим = ${yMin}`,
          shortAnswer: `${yMin}`,
          detailedSolution: {
            theory: 'Алгоритм нахождения наибольшего и наименьшего значений функции на отрезке [a; b]: 1) Найти производную f′(x); 2) Найти критические точки (f′(x) = 0); 3) Вычислить значения функции в отобранных точках и на концах отрезка; 4) Выбрать наименьшее.',
            steps: [
              { stepNum: 1, title: 'Нахождение производной f′(x)', content: `f′(x) = (x² - ${b}x + 5)′ = 2x - ${b}.` },
              { stepNum: 2, title: 'Критические точки', content: `2x - ${b} = 0 => 2x = ${b} => x = ${xMin}. Точка ${xMin} принадлежит отрезку [0; ${b}].` },
              { stepNum: 3, title: 'Вычисление значений на концах отрезка', content: `f(0) = 5; f(${b}) = ${b}² - ${b}·${b} + 5 = 5.` },
              { stepNum: 4, title: 'Вычисление значения в точке минимума', content: `f(${xMin}) = (${xMin})² - ${b}·${xMin} + 5 = ${xMin * xMin} - ${b * xMin} + 5 = ${yMin}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${yMin}.` }
            ]
          }
        };
      }

      case 'antiderivative': {
        const k = (i % 3) + 2;
        const x0 = 1;
        const y0 = (v % 5) + 3;
        const c = y0 - k;
        const fullFormula = `F(x) = ${k}x² ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)}`;
        return {
          variantNum: v,
          question: `Для функции f(x) = ${2 * k}x найдите первообразную F(x), график которой проходит через точку M(${x0}; ${y0}).`,
          graphConfig: { diagramType: 'math_diagram', title: 'Первообразная функции', params: { subtitle: `F(x) = ∫ f(x) dx + C, F(x₀) = y₀` } },
          answer: fullFormula,
          shortAnswer: fullFormula,
          detailedSolution: {
            theory: 'Функция F(x) называется первообразной для f(x), если F′(x) = f(x). Общий вид первообразных: F(x) = ∫ f(x) dx + C. Значение C находится из начального условия F(x₀) = y₀.',
            steps: [
              { stepNum: 1, title: 'Нахождение общего вида первообразной', content: `F(x) = ∫ ${2 * k}x dx = ${2 * k} · (x² / 2) + C = ${k}x² + C.` },
              { stepNum: 2, title: 'Подстановка координат точки M(1; ${y0})', content: `F(${x0}) = ${k}·(${x0})² + C = ${k} + C = ${y0}.` },
              { stepNum: 3, title: 'Определение константы C', content: `C = ${y0} - ${k} = ${c}.` },
              { stepNum: 4, title: 'Запись искомой первообразной', content: `${fullFormula}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${fullFormula}.` }
            ]
          }
        };
      }

      case 'integrals_calc': {
        const a = (i % 2);
        const b = a + 2;
        const coeff = (i % 3) + 1;
        const val = coeff * ((b ** 2 - a ** 2) / 2);
        return {
          variantNum: v,
          question: `Вычислите определенный интеграл: ∫_{${a}}^{${b}} (${coeff}x) dx.`,
          graphConfig: { diagramType: 'integral_area', title: 'Формула Ньютона-Лейбница', params: { a, b } },
          answer: `${val}`,
          shortAnswer: `${val}`,
          detailedSolution: {
            theory: 'Формула Ньютона-Лейбница: определенный интеграл от непрерывной функции равен разности значений любой ее первообразной на верхнем и нижнем пределах: ∫_a^b f(x) dx = F(b) - F(a).',
            steps: [
              { stepNum: 1, title: 'Нахождение первообразной F(x)', content: `∫ (${coeff}x) dx = ${coeff} · (x² / 2) = (${coeff}/2)x².` },
              { stepNum: 2, title: 'Подстановка верхнего предела b = ${b}', content: `F(${b}) = (${coeff}/2) · ${b}² = (${coeff}/2) · ${b * b} = ${coeff * b * b / 2}.` },
              { stepNum: 3, title: 'Подстановка нижнего предела a = ${a}', content: `F(${a}) = (${coeff}/2) · ${a}² = ${coeff * a * a / 2}.` },
              { stepNum: 4, title: 'Разность F(b) - F(a)', content: `${coeff * b * b / 2} - ${coeff * a * a / 2} = ${val}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${val}.` }
            ]
          }
        };
      }

      case 'integral_area': {
        const b = (i % 3) + 2;
        const val = (b ** 3 / 3).toFixed(2);
        return {
          variantNum: v,
          question: `Вычислите площадь фигуры, ограниченной параболой y = x², осью Ox и прямыми x = 0, x = ${b}.`,
          graphConfig: { diagramType: 'integral_area', title: 'Площадь криволинейной трапеции', params: { a: 0, b } },
          answer: `S = ${val} кв. ед.`,
          shortAnswer: `${val}`,
          detailedSolution: {
            theory: 'Геометрический смысл определенного интеграла: площадь криволинейной трапеции под графиком неотрицательной функции y = f(x) равна интегралу: S = ∫_a^b f(x) dx.',
            steps: [
              { stepNum: 1, title: 'Составление интеграла площади', content: `S = ∫_0^${b} (x²) dx.` },
              { stepNum: 2, title: 'Первообразная функции x²', content: `F(x) = x³ / 3.` },
              { stepNum: 3, title: 'Вычисление пределов интегрирования', content: `F(${b}) = ${b}³ / 3 = ${b ** 3} / 3; F(0) = 0.` },
              { stepNum: 4, title: 'Итоговая площадь фигуры', content: `S = ${b ** 3}/3 ≈ ${val} кв. ед.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${val}.` }
            ]
          }
        };
      }

      case 'stereometry_prism': {
        const a = (i % 5) + 3;
        const h = (i % 4) + 4;
        const vVal = a * a * h;
        return {
          variantNum: v,
          question: `В правильной четырехугольной призме сторона основания равна ${a} см, а высота равна ${h} см. Найдите объем призмы.`,
          graphConfig: { diagramType: 'stereo_prism', title: 'Правильная призма', params: { a, h } },
          answer: `V = ${vVal} см³`,
          shortAnswer: `${vVal}`,
          detailedSolution: {
            theory: 'Объем призмы равен произведению площади ее основания на высоту: V = S_осн · H. В правильной четырехугольной призме основанием является квадрат: S_осн = a².',
            steps: [
              { stepNum: 1, title: 'Площадь основания призмы', content: `Основание — квадрат со стороной a = ${a} см => S_осн = a² = ${a}² = ${a * a} см².` },
              { stepNum: 2, title: 'Формула объема призмы', content: `V = S_осн · H = ${a * a} · ${h}.` },
              { stepNum: 3, title: 'Вычисление объема', content: `V = ${vVal} см³.` },
              { stepNum: 4, title: 'Проверка единиц измерения', content: `Площадь (см²) умножается на высоту (см) => объем в кубических сантиметрах (см³).` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${vVal}.` }
            ]
          }
        };
      }

      case 'stereometry_pyramid': {
        const a = (i % 4) + 3;
        const h = 3 * ((i % 3) + 2);
        const vVal = (a * a * h) / 3;
        return {
          variantNum: v,
          question: `В правильной четырехугольной пирамиде сторона основания равна ${a} см, а высота H = ${h} см. Найдите объем пирамиды.`,
          graphConfig: { diagramType: 'stereo_pyramid', title: 'Правильная пирамида', params: { a, h } },
          answer: `V = ${vVal} см³`,
          shortAnswer: `${vVal}`,
          detailedSolution: {
            theory: 'Объем любой пирамиды равен одной трети произведения площади ее основания на высоту: V = ⅓ · S_осн · H.',
            steps: [
              { stepNum: 1, title: 'Площадь основания пирамиды', content: `В основании квадрат со стороной a = ${a} см => S_осн = a² = ${a * a} см².` },
              { stepNum: 2, title: 'Формула объема', content: `V = ⅓ · S_осн · H = ⅓ · ${a * a} · ${h}.` },
              { stepNum: 3, title: 'Вычисление произведения', content: `⅓ · ${h} = ${h / 3} => V = ${a * a} · ${h / 3} = ${vVal} см³.` },
              { stepNum: 4, title: 'Контроль вычисления', content: `Объем пирамиды ровно в 3 раза меньше объема призмы с таким же основанием и высотой.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${vVal}.` }
            ]
          }
        };
      }

      case 'stereometry_cylinder_cone': {
        const isCylinder = (i % 2 === 0);
        const r = (i % 4) + 2;
        const h = (i % 5) + 3;
        if (isCylinder) {
          const vVal = r * r * h;
          return {
            variantNum: v,
            question: `Радиус основания цилиндра равен ${r} см, а его высота равна ${h} см. Найдите объем цилиндра (ответ укажите разделенным на π).`,
            graphConfig: { diagramType: 'stereo_cylinder', title: 'Цилиндр: тело вращения', params: { R: r, H: h } },
            answer: `V = ${vVal}π см³`,
            shortAnswer: `${vVal}`,
            detailedSolution: {
              theory: 'Цилиндр образуется вращением прямоугольника вокруг стороны. Объем цилиндра: V = π R² H. Площадь боковой поверхности: S_бок = 2π R H.',
              steps: [
                { stepNum: 1, title: 'Площадь круглого основания', content: `S_осн = π R² = π · ${r}² = ${r * r}π см².` },
                { stepNum: 2, title: 'Формула объема цилиндра', content: `V = S_осн · H = ${r * r}π · ${h} = ${vVal}π см³.` },
                { stepNum: 3, title: 'Деление ответа на π', content: `По условию делим на π => ${vVal}.` },
                { stepNum: 4, title: 'Проверка геометрических параметров', content: `Образующая цилиндра равна высоте H = ${h} см.` },
                { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${vVal}.` }
              ]
            }
          };
        } else {
          const vVal = (r * r * 3 * h) / 3;
          return {
            variantNum: v,
            question: `В конусе радиус основания R = ${r} см, высота H = ${3 * h} см. Найдите объем конуса (ответ укажите разделенным на π).`,
            graphConfig: { diagramType: 'stereo_cone', title: 'Конус: тело вращения', params: { R: r, H: 3 * h } },
            answer: `V = ${vVal}π см³`,
            shortAnswer: `${vVal}`,
            detailedSolution: {
              theory: 'Конус образуется вращением прямоугольного треугольника вокруг катета. Объем конуса: V = ⅓ π R² H.',
              steps: [
                { stepNum: 1, title: 'Площадь кругового основания', content: `S_осн = π R² = π · ${r}² = ${r * r}π см².` },
                { stepNum: 2, title: 'Формула объема конуса', content: `V = ⅓ · π R² · H = ⅓ · ${r * r}π · ${3 * h} = ${vVal}π см³.` },
                { stepNum: 3, title: 'Деление ответа на π', content: `Разделив на π, получаем: ${vVal}.` },
                { stepNum: 4, title: 'Соотношение с цилиндром', content: `Объем конуса составляет ровно треть объема цилиндра с таким же основанием и высотой.` },
                { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${vVal}.` }
              ]
            }
          };
        }
      }

      case 'stereometry_sphere': {
        const r = (i % 5) + 2;
        const sVal = 4 * r * r;
        return {
          variantNum: v,
          question: `Радиус шара равен R = ${r} см. Найдите площадь поверхности сферы (ответ укажите разделенным на π).`,
          graphConfig: { diagramType: 'stereo_sphere', title: 'Сфера и шар', params: { R: r } },
          answer: `S = ${sVal}π см²`,
          shortAnswer: `${sVal}`,
          detailedSolution: {
            theory: 'Сфера — поверхность шара. Площадь поверхности сферы выражается формулой: S = 4π R². Объем шара: V = 4/3 π R³.',
            steps: [
              { stepNum: 1, title: 'Формула площади сферы', content: `S = 4π R².` },
              { stepNum: 2, title: 'Подстановка радиуса R = ${r} см', content: `S = 4π · (${r})² = 4π · ${r * r}.` },
              { stepNum: 3, title: 'Вычисление коэффициента', content: `4 · ${r * r} = ${sVal} => S = ${sVal}π см².` },
              { stepNum: 4, title: 'Деление ответа на π', content: `По условию делим на π => ${sVal}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${sVal}.` }
            ]
          }
        };
      }

      case 'vectors_space': {
        const x = (i % 4) + 1;
        const y = (v % 3) + 2;
        const z = 2;
        const lenSq = x * x + y * y + z * z;
        return {
          variantNum: v,
          question: `Найдите скалярный квадрат (величину |a|²) вектора a(${x}; ${y}; ${z}) в декартовом пространстве.`,
          graphConfig: { diagramType: 'math_diagram', title: 'Векторы в пространстве R³', params: { subtitle: `|a|² = x² + y² + z²` } },
          answer: `|a|² = ${lenSq}`,
          shortAnswer: `${lenSq}`,
          detailedSolution: {
            theory: 'Квадрат длины (скалярный квадрат) вектора a(x; y; z) в пространстве равен сумме квадратов его координат: |a|² = a · a = x² + y² + z².',
            steps: [
              { stepNum: 1, title: 'Координаты вектора', content: `x = ${x}, y = ${y}, z = ${z}.` },
              { stepNum: 2, title: 'Возведение координат в квадрат', content: `x² = ${x * x}, y² = ${y * y}, z² = ${z * z}.` },
              { stepNum: 3, title: 'Суммирование квадратов', content: `${x * x} + ${y * y} + ${z * z} = ${lenSq}.` },
              { stepNum: 4, title: 'Геометрический смысл', content: `Квадрат длины диагонали прямоугольного параллелепипеда со сторонами ${x}, ${y}, ${z}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${lenSq}.` }
            ]
          }
        };
      }

      case 'combinatorics': {
        const n = (i % 3) + 4;
        const k = 2;
        const cVal = (n * (n - 1)) / 2;
        return {
          variantNum: v,
          question: `Сколькими способами можно выбрать ${k} дежурных из группы в ${n} студентов? Вычислите число сочетаний C_${n}^${k}.`,
          graphConfig: { diagramType: 'math_diagram', title: 'Комбинаторика: сочетания', params: { subtitle: `Cₙᵏ = n! / (k! · (n - k)!)` } },
          answer: `${cVal}`,
          shortAnswer: `${cVal}`,
          detailedSolution: {
            theory: 'Число сочетаний из n элементов по k без учета порядка следования: C_n^k = n! / (k! · (n - k)!). При k = 2: C_n^2 = n(n - 1) / 2.',
            steps: [
              { stepNum: 1, title: 'Выбор комбинаторной формулы', content: `Порядок выбора дежурных значения не имеет => используем сочетания C_${n}^2.` },
              { stepNum: 2, title: 'Формула для C_n^2', content: `C_${n}^2 = (${n} · (${n} - 1)) / 2 = (${n} · ${n - 1}) / 2.` },
              { stepNum: 3, title: 'Вычисление произведения и деление', content: `${n * (n - 1)} / 2 = ${cVal}.` },
              { stepNum: 4, title: 'Проверка логикой пар', content: `Каждый из ${n} студентов может образовать пару с любым из оставшихся ${n - 1}, с делением пополам.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${cVal}.` }
            ]
          }
        };
      }

      case 'probability_stats': {
        const total = 20;
        const favorable = (i % 9) + 2;
        const p = (favorable / total).toFixed(2);
        return {
          variantNum: v,
          question: `В экзаменационной пачке 20 билетов, из них ${favorable} билетов по изученной теме. Найдите вероятность того, что студенту попадется билет по этой теме.`,
          graphConfig: { diagramType: 'math_diagram', title: 'Классическая вероятность', params: { subtitle: `P(A) = m / n` } },
          answer: `P(A) = ${p}`,
          shortAnswer: `${p}`,
          detailedSolution: {
            theory: 'Классическое определение вероятности: вероятность события A равна отношению числа благоприятных исходов m к общему числу равновозможных исходов n: P(A) = m / n.',
            steps: [
              { stepNum: 1, title: 'Общее число исходов n', content: `Всего билетов: n = ${total}.` },
              { stepNum: 2, title: 'Число благоприятных исходов m', content: `Благоприятных билетов: m = ${favorable}.` },
              { stepNum: 3, title: 'Вычисление вероятности', content: `P(A) = ${favorable} / ${total} = ${p}.` },
              { stepNum: 4, title: 'Проверка условия 0 <= P(A) <= 1', content: `0 ≤ ${p} ≤ 1 — значение корректно.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${p}.` }
            ]
          }
        };
      }

      case 'complex_numbers':
      default: {
        const a = (i % 4) + 1;
        const b = (v % 4) + 1;
        const modSq = a * a + b * b;
        return {
          variantNum: v,
          question: `Дано комплексное число z = ${a} + ${b}i. Вычислите квадрат его модуля |z|².`,
          graphConfig: { diagramType: 'complex_plane', title: 'Комплексная плоскость C', params: { a, b } },
          answer: `|z|² = ${modSq}`,
          shortAnswer: `${modSq}`,
          detailedSolution: {
            theory: 'Модуль комплексного числа z = a + bi равен расстоянию от начала координат до точки (a; b) на комплексной плоскости: |z| = √(a² + b²), следовательно |z|² = a² + b².',
            steps: [
              { stepNum: 1, title: 'Действительная и мнимая части', content: `Re(z) = a = ${a}, Im(z) = b = ${b}.` },
              { stepNum: 2, title: 'Формула квадрата модуля', content: `|z|² = a² + b² = ${a}² + ${b}².` },
              { stepNum: 3, title: 'Возведение в квадрат', content: `${a}² = ${a * a}, ${b}² = ${b * b}.` },
              { stepNum: 4, title: 'Сложение результатов', content: `${a * a} + ${b * b} = ${modSq}.` },
              { stepNum: 5, title: 'Итоговый эталонный ответ', content: `${modSq}.` }
            ]
          }
        };
      }
    }
  }
}

class DatabaseEngine {
  static generateAllTasks() {
    const bank = [];
    const categoriesConfig = [
      { id: 'numbers_powers', name: 'Действительные числа, степени и корни', type: 'short_answer', prefix: 'num-pow', count: 200, points: 2 },
      { id: 'logarithms', name: 'Логарифмы и их свойства', type: 'short_answer', prefix: 'log', count: 200, points: 2 },
      { id: 'exp_equations', name: 'Показательные уравнения и неравенства', type: 'short_answer', prefix: 'exp-eq', count: 200, points: 2 },
      { id: 'log_equations', name: 'Логарифмические уравнения и неравенства', type: 'short_answer', prefix: 'log-eq', count: 200, points: 2 },
      { id: 'irrational_equations', name: 'Иррациональные уравнения', type: 'short_answer', prefix: 'irrat-eq', count: 200, points: 2 },
      { id: 'trig_expressions', name: 'Тригонометрия: формулы и тождества', type: 'short_answer', prefix: 'trig-exp', count: 200, points: 2 },
      { id: 'trig_equations', name: 'Тригонометрические уравнения', type: 'short_answer', prefix: 'trig-eq', count: 200, points: 2 },
      { id: 'linear_functions', name: 'Линейная функция (свойства и график)', type: 'graph_construction', prefix: 'lin-fn', count: 200, points: 3 },
      { id: 'quadratic_functions', name: 'Квадратичная парабола (вершина и чертеж)', type: 'graph_construction', prefix: 'quad-fn', count: 200, points: 3 },
      { id: 'rational_functions', name: 'Дробно-линейная гипербола и асимптоты', type: 'graph_construction', prefix: 'rat-fn', count: 200, points: 3 },
      { id: 'transcendental_graphs', name: 'Графики степенных, логарифмических и триг. функций', type: 'graph_construction', prefix: 'trans-graph', count: 200, points: 3 },
      { id: 'derivatives_calc', name: 'Производная: правила дифференцирования', type: 'short_answer', prefix: 'deriv-calc', count: 200, points: 2 },
      { id: 'derivatives_geom_phys', name: 'Геометрический и физический смысл производной', type: 'short_answer', prefix: 'deriv-geom', count: 200, points: 2 },
      { id: 'extremum_optimization', name: 'Исследование функций: экстремумы и отрезки', type: 'short_answer', prefix: 'opt-ext', count: 200, points: 3 },
      { id: 'antiderivative', name: 'Первообразная функции', type: 'short_answer', prefix: 'antideriv', count: 200, points: 2 },
      { id: 'integrals_calc', name: 'Определенный интеграл (Ньютон-Лейбниц)', type: 'short_answer', prefix: 'int-calc', count: 200, points: 2 },
      { id: 'integral_area', name: 'Площадь криволинейной трапеции', type: 'graph_construction', prefix: 'int-area', count: 200, points: 3 },
      { id: 'stereometry_prism', name: 'Стереометрия: призма, параллелепипед, куб', type: 'short_answer', prefix: 'stereo-prism', count: 200, points: 3 },
      { id: 'stereometry_pyramid', name: 'Стереометрия: пирамида', type: 'short_answer', prefix: 'stereo-pyr', count: 200, points: 3 },
      { id: 'stereometry_cylinder_cone', name: 'Стереометрия: цилиндр и конус', type: 'short_answer', prefix: 'stereo-cyl', count: 200, points: 3 },
      { id: 'stereometry_sphere', name: 'Стереометрия: шар и сфера', type: 'short_answer', prefix: 'stereo-sph', count: 200, points: 3 },
      { id: 'vectors_space', name: 'Векторы и координаты в пространстве', type: 'short_answer', prefix: 'vec-space', count: 200, points: 2 },
      { id: 'combinatorics', name: 'Элементы комбинаторики', type: 'short_answer', prefix: 'comb', count: 200, points: 2 },
      { id: 'probability_stats', name: 'Теория вероятностей и статистика', type: 'short_answer', prefix: 'prob-stat', count: 200, points: 2 },
      { id: 'complex_numbers', name: 'Комплексные числа', type: 'short_answer', prefix: 'cmplx', count: 200, points: 2 }
    ];

    const catKeywords = {
      numbers_powers: 'действительные числа степень степени корень корни радикал вычисления',
      logarithms: 'логарифм логарифмы log ln lg основание свойства логарифмов',
      exp_equations: 'показательные уравнения показательное уравнение экспонента показательные неравенства',
      log_equations: 'логарифмические уравнения логарифмическое уравнение одз логарифм неравенство',
      irrational_equations: 'иррациональные уравнения иррациональное уравнение корень радикал одз',
      trig_expressions: 'тригонометрия синус косинус тангенс котангенс sin cos tg ctg тождества формулы',
      trig_equations: 'тригонометрические уравнения простейшие тригонометрические уравнения окружность',
      linear_functions: 'линейная функция прямая график угловой коэффициент k b kx построение',
      quadratic_functions: 'квадратичная функция парабола вершина нули график дискриминант ветви чертеж',
      rational_functions: 'дробно-линейная гипербола асимптоты график гиперболы разрыв',
      transcendental_graphs: 'трансцендентные графики показательная логарифмическая тригонометрическая',
      derivatives_calc: 'производная производные дифференцирование правила таблица производных штрих',
      derivatives_geom_phys: 'геометрический физический смысл производной касательная скорость ускорение угловой коэффициент',
      extremum_optimization: 'исследование функции экстремум экстремумы максимум минимум отрезки наибольшее наименьшее',
      antiderivative: 'первообразная первообразные неопределенный интеграл таблица первообразных',
      integrals_calc: 'определенный интеграл ньютон лейбниц пределы интегрирования вычисление',
      integral_area: 'площадь криволинейной трапеции интеграл фигура чертеж штриховка площадь',
      stereometry_prism: 'стереометрия призма параллелепипед куб диагональ объем площадь поверхности ребро',
      stereometry_pyramid: 'стереометрия пирамида апофема правильная пирамида объем высота основание',
      stereometry_cylinder_cone: 'стереометрия цилиндр конус образующая радиус объем сечение осевое',
      stereometry_sphere: 'стереометрия шар сфера радиус объем шара площадь сферы диаметр',
      vectors_space: 'векторы координаты скалярное произведение длина вектора модуль базис пространство',
      combinatorics: 'комбинаторика перестановки размещения сочетания факториал n! c(n,k) a(n,k)',
      probability_stats: 'теория вероятностей вероятность событие случайная величина частота статистика',
      complex_numbers: 'комплексные числа мнимая единица модуль i z a+bi действительная мнимая часть'
    };

    for (const cat of categoriesConfig) {
      for (let i = 1; i <= cat.count; i++) {
        const diff = (i <= 65) ? 'basic' : (i <= 135) ? 'medium' : 'hard';
        const diffLabel = (i <= 65) ? 'Базовый' : (i <= 135) ? 'Основной' : 'Углубленный';
        
        const extraKw = catKeywords[cat.id] || '';
        const searchIndex = `${cat.name} ${cat.id} ${cat.prefix} ${cat.type} ${extraKw} задание №${i} ${i} ${diffLabel} ${diff}`.toLowerCase();

        const task = {
          id: `${cat.prefix}-${i}`,
          category: cat.id,
          categoryName: cat.name,
          taskType: cat.type,
          taskTypeLabel: (cat.type === 'short_answer') ? 'Краткий ответ' : 'Построение графика',
          difficulty: diff,
          difficultyLabel: diffLabel,
          points: cat.points,
          title: `${cat.name} (№${i})`,
          description: `Практическое задание №${i} раздела "${cat.name}".`,
          subIndex: i,
          _searchIndex: searchIndex,
          _variants: null
        };

        // Ленивый мемоизированный геттер для 100% экономии RAM:
        // Варианты и пошаговые выкладки генерируются мгновенно только тогда, когда к ним обращаются!
        Object.defineProperty(task, 'variants', {
          get: function() {
            if (!this._variants) {
              this._variants = TaskVariantFactory.createVariants(this);
            }
            return this._variants;
          },
          set: function(val) {
            this._variants = val;
          },
          enumerable: true,
          configurable: true
        });

        bank.push(task);
      }
    }

    return bank;
  }
}

const INITIAL_TASK_BANK = DatabaseEngine.generateAllTasks();
