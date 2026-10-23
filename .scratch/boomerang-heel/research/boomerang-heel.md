# Пятка бумеранг: деление петель, число рядов и высота по подошве

Исследование к тикету [#76](https://github.com/fey/knitting-tools/issues/76).
Дата: 2026-10-24.

Вопрос: когда начинать пятку на носке от мыска. Как делят петли пятки бумеранг; сколько
укороченных рядов в каждой половине и сколько круговых рядов между ними; какую часть длины стопы
пятка занимает **по подошве** и что поэтому вычитается из длины следа; чем это отличается от
глубины пятки вверх по ноге; как рядами перейти к сантиметрам; как описания называют момент начала
пятки; входит ли в расчёт длина мыска; меняет ли высоту приём укороченных рядов; как источники
решают краевые случаи.

Длина стопы, длина следа и посадка здесь **данность** из #37: `длина следа = длина стопы + посадка`,
длина следа по ГОСТ 8541-94 меряется «от края мыска до середины пятки». Их исследование не
повторяет. Схема бумеранга по рядам исследуется ровно настолько, насколько нужна для числа рядов.

## Область и метод

Рассматривается только **пятка бумеранг** (она же пятка укороченными рядами, *boomerang heel*,
*Bumerangferse*): две трапеции из укороченных рядов на половине петель носка. Пятка со стенкой и
клином, французская пятка (`.scratch/french-heel/research/heel-turn.md`) и пятка «после-мысль»
(*afterthought*) в область не входят. Клин подъёма стопы тоже вне области: у бумеранга его нет
(раздел 1).

**Тиры источников.** Старший тир: **справочники и журнальные статьи авторов** (Kate Atherley в
Modern Daily Knitting; Charlene Schurch, *Sensational Knitted Socks*, Martingale, 2005), **описания
производителей пряжи** (Regia / Schachenmayr: MEZ GmbH, Coats; addi — производитель спиц, но таблицы
размеров у него фирменные) и **стандарт** (ГОСТ 8541-94). Средний: **авторские обучающие сайты и
блоги с расчётом** (Irena Handmade, Knitgrammer, Yumi Yarns, socks.dampal.ru), **журнал-сервис**
(Modern Daily Knitting, колонка Patty Lyons). Тир 3, **решающим не считается**: форумы, агрегаторы,
блоги без автора (komok, KnittingHelp, Knitting Paradise, knitka, handmadefrom, sockshype,
vaizaniespicami, djaya, rozochka), безымянные PDF. Тир каждой позиции указан в таблицах.

**Надёжность.** Страницы и PDF скачаны и разобраны локально (`curl`, `pdftotext -layout`), цитаты
дословные; в русских цитатах сохранена орфография источника. Книга Schurch прочитана по OCR-слою
archive.org (`_djvu.txt`): очевидные ошибки распознавания исправлены («КІЗ» → «K13»), **номера
страниц в OCR-тексте не размечены**, поэтому у Schurch указаны разделы, а страницы помечены ⚠.
Таблицы addi в PDF — текстовый слой, читается без потерь. Скрипт калькулятора Knitgrammer прочитан
как исходный код (`knitgrammer.com`, минифицированный JS): формула оттуда приведена дословно.
⚠ стоит у четырёх позиций: Marly Bird цитирует исследование Atherley («Custom Socks») по пересказу;
ГОСТ-определение «середины пятки» известно только по тексту стандарта, без чертежа; у Schurch
номера страниц не размечены; статичный текст Knitgrammer расходится с её же скриптом. Книги без
доступа перечислены в конце; чисел оттуда нет.

**Своё отделено от чужого.** Всё, что подписано словом **«расчёт»**, — арифметика этого
исследования: единая формула, симметрия полосы, сверка таблиц. Формулы проверены Python-скриптом на
таблицах Regia и addi (51 строка addi по трём толщинам пряжи, 9 строк Regia) и перебором P от 3 до
120. Остальное — из источников.

### Сводная таблица источников

| Источник | Тир | Что даёт | Язык |
|---|---|---|---|
| [Regia / Schachenmayr, Sock Guide R0333 V.2, 2020](https://www.rainbowsilks.co.uk/documents/Regia%20Sock%20Pattern.pdf), раздел 3.1 «Boomerang heel» (с. 2–3), таблица с. 6 | производитель пряжи | деление на трети таблицей 22–38 петель; 2 круговых ряда между половинами; foot length | EN (перевод немецкого) |
| [Regia Sockenlehrgang, 2014, 6-ply](https://farbverlaufsgarn.ch/WebRoot/Store2/Shops/179189/MediaGallery/Sock-Guide-DE-6fdg-final.pdf), и [текст того же урока на handmadekultur.de](https://www.handmadekultur.de/projekte/technik-des-sockenstrickens_56941) | производитель пряжи | название «Bumerang-Ferse» / *Round heel*; описание рядов по-немецки | DE / EN |
| addi, [Boomerang Heel (top-down)](https://addi.de/en/story/bumerangferse/), [Knit Toe-Up Boomerang Heel](https://addi.de/en/story/knit-toe-up-boomerang-heel/), таблицы PDF: [toe-up](https://addi.de/wp-content/uploads/2023/05/addi-sock-chart_4-ply_6-ply_8-ply_Toe-Up.pdf), [top-down](https://addi.de/wp-content/uploads/2023/05/addi-sock-chart_4_6_8-ply_Top-Down.pdf) | производитель спиц | деление на трети по 17 размерам × 3 толщины; «Length from tip to start heel»; 2 круговых ряда | EN |
| Kate Atherley, [«A Flap-and-Gusset Heel Recipe for Toe-Up Socks»](https://www.moderndailyknitting.com/community/flap-gusset-heel-recipe-toe-up-socks/), MDK, 21.10.2019 | автор «Custom Socks» | формула «петли пятки → ряды поворота → сантиметры»; вычитание из длины стопы | EN |
| Kate Atherley, [«Sock Skills: Tweaking the Fit of a Short-Row Heel»](https://www.moderndailyknitting.com/community/sock-skills-tweaking-the-fit-of-a-short-row-heel/), MDK, 21.08.2019 | то же | пятка на половине петель, до 60 %; «heel diagonal» | EN |
| Charlene Schurch, *Sensational Knitted Socks*, Martingale, 2005 ([archive.org](https://archive.org/details/senstational-knitted-socks-by-charlene-schurch)): раздел «Sock Basics» (описание *Top-Down Sock with Short-Row Heel*), «Short-Row Toe» и «Short Row Heel» в разделе носков от мыска (с. 40–41 ⚠), «Short Row Heel» в разделе Fair Isle | книга-справочник | пятка укороченными рядами без круговых рядов между половинами; центр ≈ 40 % | EN |
| Knitgrammer, [German Short Row Heel (boomerang)](https://www.knitgrammer.com/blog/german-short-row-heel/), включая [скрипт калькулятора](https://www.knitgrammer.com/wp-content/cache/min/1/083eee3e534a6c14af1da922f3510e0a.js) | средний | формула высоты в коде; правило остатка; границы ввода | EN |
| Marly Bird, [рабочий лист «Customize Sock Heel Diagonal of German Short Row Heel»](https://marlybird.com/wp-content/uploads/2020/07/Customize-Sock-Heel-Diagonal-of-German-Short-Row-Heel.pdf), 2020 | дизайнер, средний | «число рядов половины × плотность вычитается из длины стопы» | EN |
| Irena Handmade, [«Носки от мыска с тканым узором»](https://www.irena-handmade.ru/noski-ot-myska-s-tkanym-uzorom/), 28.04.2020 | авторский блог (источник и в heel-turn.md), средний | **единственное русское описание бумеранга от мыска с расчётом**: 25 петель → 8/9/8, 16 рядов + 2 круговых, 5 см, «23 − 5 ≈ 18 см» | RU |
| Yumi Yarns, [Toe-Up Socks Class: Foot!](https://www.yumiyarns.com/single-post/toe-up-socks-class-foot), 21.01.2021, и [Heel! (part 1)](https://www.yumiyarns.com/single-post/toe-up-socks-class-heel-part-1) | авторский курс, средний | «длина мыска ≈ длина пятки»; «foot length minus heel length» | EN |
| [dummies.com (Wiley), The Basic Toe-Up Sock Pattern](https://www.dummies.com/article/home-auto-hobbies/crafts/knitting-crocheting/the-basic-toe-up-sock-pattern-171641/) — статья из книги серии *For Dummies*, автор на странице не указан | средний | «2 inches less than desired total foot length»; 26–36 петель, 12–14 в центре | EN |
| [Безымянный PDF «Basic Formula for Toe Up Socks using German Short Rows»](https://caper-bear-fbsn.squarespace.com/s/BasicFormulaForToeUpSocksUsingGSR.pdf) | тир 3 | «1½ inches short of back of heel»; правило остатка | EN |
| Patty Lyons, [Ask Patty: Wrap and Turn or German Short Rows?](https://www.moderndailyknitting.com/community/ask-patty-wrap-and-turn-or-german-short-rows/), MDK; Tess Knits, [Short Rows, Thoroughly Explained](https://tessknits.com/5897/short-rows-thoroughly-explained/) | журнал-сервис, средний | чем приёмы укороченных рядов отличаются | EN |
| [socks.dampal.ru, «Когда начинать вязать мысок»](https://socks.dampal.ru/kogda-nachinat-vyazat-mysok/), 21.05.2017 | авторский обучающий сайт, средний | зеркальный расчёт для мыска носка от манжеты | RU |
| [peopleknit.ru, «Просто для начинающих: носки»](https://www.peopleknit.ru/news/noski/), [yarukodelnica.ru, «Учимся вязать носки»](https://yarukodelnica.ru/index.php/vyazalshchitse-na-zametku/uchimsya-vyazat-noski) | тир 3; оба — переводы немецких инструкций без указания источника (у peopleknit пряжа Lana Grossa Meilenweit) | деление на трети, двойные петли, 2 круговых ряда, «длина стопы от центра пятки» | RU |
| [verasha.ru](https://verasha.ru/vyazanie-izdelij/pyatka-bumerang-spitsami), [knitka.ru](https://knitka.ru/40280/pyatka-bumerang.html), [tru-knitting](http://tru-knitting.blogspot.com/2015/03/blog-post_9.html) | тир 3 | названия; остаток от деления; «пятка короче других» | RU |
| [ГОСТ 8541-94](https://meganorm.ru/Data2/1/4294821/4294821535.pdf), таблица 2 (измерения 2 и 3), п. 3.9 | стандарт | «длина следа» и «высота пятки» как измерения изделия | RU |

Русских **печатных** описаний бумеранга от мыска не нашлось; единственное русское описание с
расчётом — Irena Handmade (раздел 11).

---

## 1. Что такое пятка бумеранг и как её называют

> **Пятка вяжется на половине петель носка (петли подошвы) туда и обратно двумя трапециями из
> укороченных рядов. Первая трапеция сужается от всех петель до центральной части, потом идут 2
> круговых ряда, вторая расширяется обратно. Петли не прибавляются и не убавляются, клина нет,
> конструкция симметрична и вяжется одинаково сверху вниз и снизу вверх.**

- **addi:** «The boomerang heel (also known as the yoyo heel) is particularly simple and suitable
  for beginners. It is created by german short rows. The heel is formed by knitting two
  trapezoids.» И про направление: «The boomerang heel is always knitted the same way, whether
  toe-up or top-down.»
- **Atherley (MDK, 2019):** short-row heel «is symmetrical, so it works equally well in top-down
  and toe-up socks». **Schurch:** «Because the short-row heel is symmetrical, the structure of the
  sock is the same whether you knit from the top down or from the toe up.» **Knitgrammer:** «It is
  symmetrical and you make it exactly the same way regardless if you knit your sock from the toe up
  or cuff down. This heel is called also the boomerang, the double stitch or the yo yo heel.»
- **Названия:**
  - английские: *boomerang heel*, *yo-yo heel*, *short-row heel*, *German short-row heel*; в
    переводе Regia 2014 года — *Round heel* (немецкое *Bumerang-Ferse*; русское «бумеранг»
    происходит оттуда);
  - русские: «пятка бумеранг», «пятка укороченными рядами», «немецкая пятка» (knitka.ru: «Эта
    методика … перенята нашими умелицами от германских вязальщиц и называется немецкой»);
  - на [fb.ru](https://fb.ru/article/462664/vyazanie-noskov-s-myiska-instruktsiya-i-rekomendatsii/amp/)
    «бумерангом» названа пятка с набором петель по краю стенки: ярлык стоит на другой
    конструкции, источник отфильтрован.
- **Отличие от обычной пятки укороченными рядами.** Schurch в том же разделе даёт и пятку
  укороченными рядами **без круговых рядов между половинами**: вторая половина идёт сразу за
  первой. Бумеранг Regia, addi, Knitgrammer и переводов вставляет **2 круговых ряда** между
  половинами (раздел 3.3). Это единственное, что отличает бумеранг от общей «short-row heel» в
  терминах рядов, и поэтому в формуле круговые ряды вынесены в отдельную константу.
- **Клина подъёма нет.** verasha.ru: «при вязании данной модели переход в стопу происходит без
  формирования клина подъема»; Regia (handmadekultur): «Hinweis: Bei dieser Ferse wird kein Zwickel
  gearbeitet.» addi: «slightly shorter overall than the classic heel, which is why the foot can be
  knitted a little longer than with the classic heel»; tru-knitting: «эта пятка меньше, короче
  других, что следует учитывать при вязании носка в целом».

---

## 2. Что вычитать из длины следа: три разные величины

> **Для точки старта нужна одна величина — длина пятки по подошве: сколько длины стопы пятка
> занимает под ногой, считая от начала пятки до её середины (задней точки). Глубина пятки вверх по
> ноге — другая величина. Для бумеранга они численно совпадают из-за симметрии, но вычитается
> только первая.**

Три величины, которые источники называют одним словом:

| Величина | Что это | Откуда берётся | Нужна ли для старта |
|---|---|---|---|
| **Длина пятки по подошве** (в тикете «высота по подошве») | расстояние вдоль стопы от начала пятки до середины пятки | половина длины центральной полосы пятки, раздел 4 | **да** |
| **Длина центральной полосы** (в рядах) | все ряды, которые проходят через центральную часть: первая половина + круговые + вторая половина | `2Z + q + 1` (раздел 3), **расчёт** | нет, промежуточная величина |
| **Глубина пятки вверх по ноге** | насколько пятка поднимается по задней стороне стопы к щиколотке | вторая половина полосы; в ГОСТ — «высота пятки» | нет |

**Слово «высота пятки» двусмысленно.** В ГОСТ 8541-94 (таблица 2, измерение 3) «Высота пятки» —
«От верхнего края пятки до её середины»: это **вертикальная** величина, то есть глубина вверх по
ноге. Норматив п. 3.9: «Высота пятки … должна быть, см, не менее: 4 — для мужских, женских и
детских изделий 20—24-го размеров; 3,5 — … из пряжи натуральных, смешанных и химических волокон в
сочетании с текстурированными синтетическими нитями; 3 — …; 2,5 — …; 2 — для … изделий,
выработанной на круговом ходу». В тикете же «высота пятки» — длина **по подошве**. Поэтому в
словаре будущей спеки слово «высота пятки» без уточнения лучше не вводить (раздел 10).

**Что говорят англоязычные источники о глубине.** Atherley описывает глубину пятки через *heel diagonal*:
«Sock heels, no matter what the construction, are usually worked on half of the sock stitches. To
loosen up the heel and improve the fit, an easy solution is to work the short row heel on more of
the stitches. You can easily go up to about 60% of the sock stitches. Doing this adds depth in the
heel diagonal» (MDK, август 2019). Marly Bird по пересказу ⚠ даёт норму из «Custom Socks»: «The
heel diagonal circumference is traditionally anywhere from 30-40% larger than the finished sock
circumference (according to a study by Kate Atherley and published in Custom Socks)». То есть
глубина пятки у Atherley — **обхватная** величина, она задаётся числом петель пятки, а на точку
старта влияет только через то, что **больше петель пятки — больше укороченных рядов — длиннее
пятка** (раздел 3).

### Симметрия полосы (расчёт)

Центральные петли работают в каждом ряду пятки, поэтому центральная полоса — это вся пятка по
длине: от начала первой половины, через круговые ряды, до конца второй. Её длина `2Z + q + 1`
рядов (раздел 3.5). Полоса идёт под стопой и по задней стороне вверх. Это нигде не измерено, но
следует из конструкции:

- Schurch: «you should have the same number of rows down to the heel as back to the foot» — обе
  трапеции содержат **одинаковое** число рядов;
- середина полосы лежит на самой задней точке пятки: до неё `Z + (q+1)/2` рядов, и столько же после;
- ГОСТ мерит длину следа до **середины пятки** (таблица 2, измерение 2), а «высоту пятки» — **от
  середины** до верхнего края: две половины полосы названы двумя разными измерениями.

Отсюда: **длина пятки по подошве = глубина вверх по ноге = половина полосы**. Проверка на порядок:
при P = 28, плотности 4,2 ряда/см половина полосы 19,5 ряда ≈ **4,6 см**; ГОСТ требует от
машинных носков 20–24-го размера не менее 4 см высоты пятки (по смыслу это вторая половина
полосы: от середины до верхнего края). Совпадение по порядку величины есть, но ГОСТ мерит готовое машинное изделие, поэтому это проверка
здравого смысла, а не подтверждение формулы.

---

## 3. Деление петель и число рядов

> **Петли пятки P делят на три части: две равные боковые по d = ⌊P/3⌋ петель и центральная
> c = P − 2d. В каждой половине 2d укороченных рядов (по одному на каждую боковую петлю),
> между половинами 2 круговых ряда. Формула Atherley «2/3 петель, вниз до чётного» — то же самое
> число.**

### 3.1. Что даёт каждый источник

Обозначения: P — петли пятки, d — боковая часть, c — центральная, Z — укороченных рядов в одной
половине (**расчёт**: Z = P − c, по числу двойных петель/обёрток), q — круговых рядов между
половинами.

| Источник | P | Деление | Z | q | Цитата |
|---|---|---|---|---|---|
| Regia 2020 (4-ply) | 22–38 по размерам | 7/8/7 · 8/8/8 · 8/10/8 · 9/10/9 · 10/10/10 · 10/12/10 · 11/12/11 · 12/12/12 · 13/12/13 | 14–26 | **2** | «Arrange the heel stitches in 3 sections»; «work 1 st less at the end of every RS and WS row, and after turning work a wrap stitch until just the stitches of the centre panel remain. After working 2 rounds over all stitches, work short rows with wrap stitches over the 2nd half of the heel in the opposite direction» |
| addi (4-, 6-, 8-ply) | 12–38 | 4/4/4 … 12/14/12 (51 строка) | 8–24 | **2** | «Divide your number of heel stitches by 3»; «Repeat rows 3 and 4 … until 1/3 of the stitches on the right and 1/3 on the left have been worked into double stitches, leaving a smooth right middle section»; «Knit another 2 rounds over all stitches» |
| Knitgrammer | 28 (пример) | 9/10/9 | 18 | **2** (+ полукруг) | «You should now have 9 double sts at each end of the needle 2 and 10 regular sts in the middle»; «Round 2 (These middle rounds prevent a hole from forming between the needle 1 and needle 2)» |
| Atherley, MDK 2019 | 28 | 9/10/9 | 18 | — (в статье вторая половина — клин, не бумеранг) | «multiply the number of heel stitches by 2/3, and round the result down to the nearest even number. (Put another way, you’re calculating the number of rows you work back and forth until the central third of the stitches are unwrapped.)» |
| Marly Bird | любое | центр = P/3, «Round to nearest even number» | P − c | **2** («does not include 2 'pick up' rows») | «NEW NUMBER OF ROWS ON EACH HALF OF SHORT ROW HEEL … New Total Heel Stitches − New Final Heel Stitches = Z» |
| Irena Handmade | 25 | 8/9/8 | **16** | **1–2** | ««Бумеранг» вяжется на половине петель, у нас 25. Это количество делим на 3 равные части, остаток добавим к центральной: 25 петель / 3 = 8 / 9 / 8 петель; 8 × 2 = 16 рядов»; «выполняем лицевыми полный круговой ряд (1 или 2)» |
| peopleknit.ru | 30 | 10/10/10 | 20 | **2** | «пока на каждой стороне не будут находиться 10 двойных петель и в центре 10 простых петель»; «первые 2 круговых ряда следует вязать на всех петлях» |
| yarukodelnica.ru | 36/37: 10 внизу пятки | «между двойными петлями должно остаться 8 п.» | **Z + 2** | **2** | «пока в середине между двойными петлями останутся только петли для нижней части пятки минус 2 п. … для размера 36/37 с нижней частью пятки на 10 п. между двойными петлями должно остаться 8 п.»; «на всех петлях выполнить 2 круговых ряда» |
| verasha.ru | 22–28 (в примере 20) | 7/8/7 · 8/8/8 · 9/8/9 · 9/10/9 | 14–18 | **2** | «Далее провязывается два ряда по кругу»; «20 петель = 7 петель (левая часть), 6 петель (центральная часть), 7 петель (правая часть)» |
| Schurch, пятка укороченными рядами | 16–60 | центр **6 · 8 · 10 · 12 · 14 · 14 · 16 · 18 · 20 · 20 · 24 · 24** петель из 16 · 20 · … · 60 | P − c | **0** | «Rep rows 3 and 4 until 6 (8, 10, 12, 14, 14, 16, 18, 20, 20, 24, 24) sts rem unwrapped» |
| Dummies | 26 · 28 · 30 · 32 · 34 · 36 | центр **12 · 12 · 14 · 14 · 14 · 14** | 14–22 | **0** | «Rep rows 3 and 4 until 12 (12, 14, 14, 14, 14) sts remain unwrapped in the middle of the heel»; «Work 1 round even, picking up single wraps at sides of heel» |

**Две группы по центру.** Бумеранг в узком смысле — Regia, addi, Knitgrammer, Atherley, Marly Bird,
Irena, переводы: центр **около трети** петель пятки (32–43 %: у Regia 8/22 = 36 %, 10/30 = 33 %,
12/38 = 32 %; у addi от 33 % до 43 % только на самых маленьких). Пятка укороченными рядами у Schurch и
Dummies — центр **в среднем 42 %** (у Schurch 38–44 %, у Dummies 39–47 %); диапазоны соседних групп
пересекаются, но средние разные. Расхождение объясняется самой Schurch: в разделе «Sock
Basics» она пишет «until about 20% of the stitches remain unworked» — **20 % петель носка**, то есть
40 % от пятки на половине, а не треть. Разница по рядам между группами 4–6 % от P (при P = 28:
18 рядов против 16), 0,4–0,5 см по подошве. Калькулятор берёт первую группу — она и называется
бумерангом; вторая отличается ещё и отсутствием круговых рядов.

### 3.2. Остаток от деления на три

P на 3 не делится в двух случаях из трёх. Источники делят остаток по-разному, и **таблицы
расходятся между собой**:

| Остаток | Правило | Кто |
|---|---|---|
| 1 | лишняя петля — в центр: P = 3k + 1 → k / k+1 / k | все: addi, Regia, Knitgrammer, безымянный PDF («If you have one stitch left over, place this in the middle third»), Irena («остаток добавим к центральной»), Atherley (по формуле) |
| 2 | обе лишние петли — в центр: k / k+2 / k | Atherley (по формуле), Regia при P = 26 и 32 (8/10/8, 10/12/10), addi 6-ply и 8-ply при P = 14, 20, 26 (4/6/4, 6/8/6, 8/10/8), addi 4-ply при P = 38 (12/14/12) |
| 2 | по одной лишней петле в каждую боковую: k+1 / k / k+1 | addi 4-ply при P = 20, 26, 32 (7/6/7, 9/8/9, 11/10/11), Regia при P = 38 (13/12/13), Knitgrammer (скрипт), безымянный PDF («2 stitches left over, one each will go in the outside thirds»), verasha (20 = 7/6/7) |

Сверка по строкам таблиц (**расчёт**): правило «боковые ⌊P/3⌋, остаток в центр» (k / k+2 / k при
остатке 2) совпадает с addi в 46 строках из 51 и с Regia в 8 строках из 9; пять несовпадений
(три разных P: 20, 26, 32) — addi 4-ply, одно — Regia при P = 38. Правило Marly Bird «центр = P/3, округлить
до ближайшего чётного» совпадает с addi/Regia в 38 и 7 случаях. Общее у **всех** таблиц: **центр той
же чётности, что P**, чтобы боковые части вышли равными: у каждого источника боковые части равны.
Неравных боковых (как 12 и 13 у knittingideas во французской пятке, heel-turn.md) в бумеранге нет ни у кого.

Выбор правила двигает число рядов на 2 (Z = 2d, d отличается на 1) — 0,45 см по подошве при
4,2 рядах/см. Центр должен остаться редактируемым полем с одним записанным дефолтом, как в
heel-turn.md.

### 3.3. Круговые ряды между половинами

| q | Кто |
|---|---|
| **2** | Regia 2020 и 2014, addi (оба описания), Knitgrammer (круг 2, плюс полукруг), peopleknit, yarukod, verasha, Marly Bird («2 'pick up' rows»), безымянный PDF (в варианте «a little more room in the heel») |
| **1 или 2** | Irena: «выполняем лицевыми полный круговой ряд (1 или 2)»; её же пример считает 2 |
| **0** | Schurch (пятка укороченными рядами), Dummies, безымянный PDF по умолчанию |

Нулём пользуются там, где пятка не называется бумерангом. **Константа 2** — единственное значение
в источниках, которые называют конструкцию бумерангом.

### 3.4. Два прочтения границы (±2 ряда)

В большинстве описаний двойные петли доходят до **боковых** частей, центр остаётся гладким: addi,
Regia (английский текст: «until just the stitches of the centre panel remain»), Atherley, peopleknit,
Irena. В немецком тексте Regia (handmadekultur) и в yarukodelnica двойные петли ставят **ещё и на
крайние петли центра**: «…über die Maschen der Außenteile und über die jeweils äußere Masche des
mittleren Drittels» и «между двойными петлями должно остаться 8 п.» при центре 10.

Возможное объяснение — различие приёмов (раздел 6): у Patty Lyons «The doubled stitch (made after
the turn) is the last worked stitch from the previous row, as opposed to the wrapped st (made before
the turn) being the first unworked stitch from the previous row». Двойная петля стоит на **вязаной**
петле, обёртка — на **первой невязаной**; значит, «двойная петля на крайней петле центра» в немецком
тексте может быть той же точкой поворота, что «обёртка на петле за центром» в английском. Источники
этого прямо не говорят. Если это разные пятки, расхождение — 2 ряда на половину (0,5 см по подошве).
**Правило ядра формулируется через число поворотов, а не через «сколько петель остаётся гладкими»**:
Z — число рядов, оканчивающихся поворотом в одной половине.

### 3.5. Единая формула

```
d = ⌊P / 3⌋                 боковая часть, петель
c = P − 2·d                 центральная часть (редактируется; чётность та же, что у P)
Z = P − c = 2·d             укороченных рядов в одной половине
q = 2                       круговых рядов между половинами
полоса = 2·Z + q + 1        рядов по центральной полосе
```

`+ 1` — ряд, которым вторая половина переходит в круг («In the last outward row you no longer
turn», addi; «Work one more row, using up the last double stitch», безымянный PDF).

**Формула Atherley и ядро — одно число.** «2/3 петель пятки, вниз до чётного»: P = 3k → 2k;
P = 3k + 1 → 2k; P = 3k + 2 → 2k + 1 → вниз до чётного 2k. Это Z = 2⌊P/3⌋ при всех остатках
(**расчёт**, сверено перебором P от 3 до 120).

**Проверка по числам источников:**

| Источник | P | d, c, Z по формуле | В источнике |
|---|---|---|---|
| Irena | 25 | d = 8, c = 9, Z = 16 | «8 / 9 / 8 … 8 × 2 = 16 рядов» ✓ |
| Knitgrammer | 28 | d = 9, c = 10, Z = 18 | «9 double sts … 10 regular sts» ✓ |
| Atherley | 28 | Z = 18 | «18 rows» (56 ÷ 3 = 18,667 → 18) ✓ |
| Regia 36/37 | 30 | d = 10, c = 10, Z = 20 | 10/10/10 ✓ |
| Regia 50/51 | 38 | d = 12, c = 14, Z = 24 | 13/12/13, Z = 26 ✗ (правило остатка, раздел 3.2) |
| addi 4-ply 34/35 | 28 | d = 9, c = 10, Z = 18 | 9/10/9 ✓ |

---

## 4. Высота по подошве

> **Длина пятки по подошве = половина центральной полосы: S = Z + (q+1)/2 = Z + 1,5 ряда, в
> сантиметрах — S ÷ плотность по рядам. На взрослом размере (P = 28–30, 4,2 ряда/см) это 4,6–5,1 см;
> формулы четырёх источников расходятся не больше чем на 2 ряда (0,6 см), и около 5 см — то же, что
> дают Dummies, Irena и таблица addi.**

### 4.1. Формулы источников

| Источник | Формула | Пример в самом источнике | По формуле источника при P = 28 (Z = 18), 4,2 ряда/см |
|---|---|---|---|
| **Atherley (MDK, 2019)** | `Z` рядов ÷ плотность по кругам | «18 rows at 12 rounds per inch, that’s going to take up 18 ÷ 12 = 1.5 inches» (P = 28) | 18 ÷ 4,2 = 4,29 см |
| **Marly Bird** | «Multiply the number of rows on half of the short row heel by the row gauge; then subtract that number from your total length of foot.» — `Z`, круговые не входят | — | 4,29 см |
| **Knitgrammer (скрипт)** | `var height=2*doubleSts+1.5; … lessThanDesiredLengthCm=((height/rowGauge)*10)`, то есть `Z + 1,5` | 56 петель, 40 рядов/10 см: (18 + 1,5) ÷ 40 × 10 = 4,9 см | 19,5 ÷ 4,2 = 4,64 см |
| **Irena Handmade** | `Z + 2 круговых` | «в первой части пятки «бумеранг» будет связано 16 рядов плюс 2 круговых, итого 18: 18 / 3,5 ≈ 5,1428 см ≈ 5 см» (P = 25, 3,5 ряда/см) | 20 ÷ 4,2 = 4,76 см |
| **Единый расчёт** | `Z + (q+1)/2 = Z + 1,5` | — | 4,64 см |

Расхождение между формулами — 0, 1,5 и 2 ряда. На плотности 3,5–4,2 ряда/см это 0,35–0,6 см. Формула
**Z + (q+1)/2** лежит между Atherley (Z) и Irena (Z + q) и совпадает с Knitgrammer (при q = 2). Она выводится
из симметрии полосы (раздел 2): достаточно взять половину `2Z + q + 1`.

Предупреждение о Knitgrammer: в статичном тексте страницы («until your foot measures **1.10”
(2.75 cm)** less than desired length») стоят цифры, не совпадающие с формулой скрипта: при тех же
56 петлях и 40 рядах/10 см скрипт даёт 4,9 см. Решающей считается формула скрипта; статичный текст
похож на заготовку до пересчёта (⚠ не проверено).

**Фиксированные значения.** Dummies: «work even … until piece measures 5.5 (6.5, 7.5, 8, 8.5, 9)
inches from the tip of the toe, or **2 inches less than desired total foot length**» — один и тот же
вычет (5,08 см) на всех шести размерах. По формуле у Dummies Z = 14–22 рядов при 10 рядах на дюйм
(на странице у плотности опечатка «= 4 inches»; по числам — на дюйм) — это 1,4–2,2 дюйма: вычет
«2 дюйма» хорош для средних размеров и грубо завышен для маленького. Irena: «…примерно за 5 см до
нужной длины» как простой путь без расчёта. Yumi: «The length of your sock’s
toe will be very close to the length of the heel you will need so you can just assume the toe
measurement is equal to the heel measurement».

### 4.2. Таблица addi — не независимая проверка

Таблица addi даёт для toe-up «Boomerang Length from tip to start heel» (8 · 9 · 10 · 11 · 12 · 13,5
· 14,5 · 16 · 17 · 18 · 19 · 20,5 · 21 · 22,5 · 24 · 25 · 26 см по 17 размерам) и «Foot length total»
(10 · 11,5 · 13 · … · 31 см). Разность — 2–5,5 см. Но:

- эта колонка **цифра в цифру совпадает с колонкой top-down «Foot length to start of toe»** той же
  таблицы (8, 9, 10, … 26) и **одинакова для 4-, 6- и 8-ply**;
- Regia 2020 в эту проверку не годится: у неё только числа для носка от манжеты. «Foot, length to
  toe» меряется от конца пятки и у бумеранга, и у пятки со стенкой в таблице **одни и те же**;
  разность с «Total length of foot» (3 см для 22/23 … 5 см для 36/37 … 7 см для 50/51) — длина
  мыска и о пятке ничего не говорит.

То есть **addi переиспользует длину мыска как длину пятки** (одна колонка на оба случая): это тот
же шорткат, что у Yumi («мысок ≈ пятка»). Сверка своих формул с этой колонкой подтверждает порядок величины, а не форму
(**расчёт**: `Z/ρ` совпадает с таблицей addi в среднем на ±0,35 см, максимум 1,7 см на 51 строке;
для взрослых размеров от EU 36 доля пятки по таблице — 16–21 % длины стопы, для детских до 25 %).
Эти цифры — **коридор правдоподобия**, а не проверка.

**Для коридора пригодна доля.** Пятка по таблицам addi — 16–25 % «Foot length total»; у Dummies
2 дюйма — 18–27 % длины стопы по размерам; у Irena 5 из 23 — 22 %. Мысок в спеке §9.6 тоже «≈ 20 %
длины стопы». Три коридора одного порядка.

### 4.3. Перевод рядов в сантиметры

- **Плотность по рядам**, как у мыска: `см = ряды × база / плотность` (`cmPerRow(gauge)` и
  `toeLengthCm(rows, gauge)` в `src/calculators/toe/core/gauge.ts`; в спеке §4.1 плотность по рядам
  — «сколько рядов укладывается по вертикали на базе образца», числа на экране — два знака после
  запятой). Тот же `rows × cmPerRow` работает и для пятки.
- **Поправки на укороченные ряды ни один источник не вводит.** Единственные надбавки — внутри формул:
  0 (Atherley, Marly Bird), +1,5 (Knitgrammer), +2 (Irena). Atherley замечает другое: плотность
  надо мерить **по кругам на связанном носке**, после стирки: «count the number of rounds in 2
  inches, and divide that by 2». Knitgrammer: «You can easily measure the row gauge after you have
  finished the toe or leg so there is no need to make a swatch». Разница между плотностью в круге и
  в рядах («рядная» на образце) не измерена ни одним источником ⚠, поэтому калькулятору остаётся то
  же допущение, что у мыска: одна плотность по рядам.

### 4.4. До какой точки мерится длина следа

Все источники по бумерангу от мыска мерят **длину стопы до самой задней точки пятки**: Yumi — «from
the back-most part of your heel that’s touching the floor to the front-most point of your longest
toe»; безымянный PDF — «1½ inches short of back of heel». ГОСТ: «по прямой линии от края мыска до середины пятки». «Середина пятки» читается
как задняя вершина контура пятки, а середина полосы лежит ровно на ней (раздел 2). Если бы «середину»
понимали как центр подошвенной части пятки, вычет был бы короче на ≈ S/2, то есть на ≈ 2,3 см. Это
решается чертежом ГОСТ (рисунки 1–4, которых в текстовом слое нет) и сходится с #37 ⚠.

---

## 5. Как описания называют момент начала пятки

| Формулировка | Источники |
|---|---|
| **«N см от кончика мыска» / «до N, затем пятка»** — длина стопы от кончика мыска по линейке, абсолютное число | Dummies: «until piece measures 5.5 (6.5, …) inches from the tip of the toe»; addi: «Length toe to beginning of heel (cm)»; djaya.ru (тир 3): «22 см в длину по стопе от мыска до пятки»; Irena: «до начала пятки надо связать: 23 − 5 ≈ 18 см»; Knitgrammer: «work until your foot measures … less than desired length» |
| **«длина стопы минус длина пятки»** — вычитание, формулой | Yumi: «The foot of your sock is done when it is equal to your Foot Length minus your Heel Length»; Atherley: «work the foot in the round until it measures the desired foot length minus that much»; Marly Bird: «subtract that number from your total length of foot»; KnittingHelp (тир 3): «figuring out how many rows it’ll take to do the heel, and then convert that to inches based on my row gauge. I start the heel when I’m that much away from the total foot length» |
| **«N см / дюймов не доходя до длины»** — фиксированный вычет, одна цифра на все размеры | Dummies: «2 inches less than desired total foot length»; Irena: «…примерно за 5 см до нужной длины»; безымянный PDF: «approx. 1½ inches short of back of heel» |
| **«до такой-то части стопы»** — ориентир по ноге, без числа | Schurch (toe-up, «Short Row Heel»): «Cont on 30 … sts until sock reaches anklebone»; Kim Salazar ([Jelly Bean Toe-Up Socks](https://string-or-nothing.com/wp-content/uploads/2012/07/jellysox.pdf), string-or-nothing.com, 2012): «the foot when tried on should be long enough to generously reach to the point where the ankle meets the foot. The sock foot should not be tightly stretched when measuring»; KnittingHelp (тир 3): «where the foot meets the ankle» |
| **доля длины стопы** | vaizaniespicami.ru (тир 3, пятка-«чашечка» с клином, **не бумеранг**): «Когда длина носка достигнет примерно 65% от общей длины стопы, можно приступать к вязанию пятки» → 26 см × 0,65 = 17 см |
| **таблица по размерам** | addi toe-up: «Boomerang Length from tip to start heel»; Regia (только для носка от манжеты) |
| **«мысок = пятка»** | Yumi: «you can also just measure the length of your toe before you begin knitting the foot» |

Русское описание бумеранга от мыска **с готовой точкой старта** одно — Irena (расчётом и «за 5 см»);
у [djaya.ru](https://djaya.ru/blog/noski-ot-myska) длина «по стопе от мыска до пятки» названа, но
пятка там не бумеранг. Зеркальный вопрос для мыска носка от манжеты socks.dampal.ru разбирает
расчётом: «Для 37-го размера длина стопы составляет 23 см: 23 – 7 = 16 см»; «окончательная длина
стопы носка должна быть на 1-1.5 см меньше, чем действительная длина стопы ноги, поскольку вязаный
носок немного растянется: 16 – 1 = 15 см»; «Когда длина стопы достигнет 15 см, можно начинать вязать
«ленточный» мысок».

**Единого правила нет.** Barbara из sockshype.de (тир 3) отвечает на вопрос о бумеранге от мыска:
«Ich kann dir allerdings nicht genau sagen, wann du mit der Bumerangferse beginnen musst, da ich eine
solche Toe Up Socke selber noch nicht gestrickt habe».

### Рекомендация формулировки для калькулятора

> **«Начинай пятку, когда от кончика мыска провязано N см — пятка займёт S см»**, где
> `N = длина следа − длина пятки по подошве`, `S` — длина пятки по подошве.

Строка повторяет форму из #37: «Начинай мысок, когда от пятки провязано 15,25 см — мысок займёт
4,75 см». Якорь «от кончика мыска» обязателен по той же причине, что «от пятки» в #37: без якоря
число читается от манжеты, а меряют по самой работе.

Основания:

1. Самый частый способ в источниках — абсолютное число сантиметров от кончика (Dummies, addi, Irena,
   djaya, Knitgrammer): его мерят линейкой по самой работе, пока вяжут (Yumi: «measure from the tip
   of the toe to where your needles currently are in the project»).
2. Это зеркальная строка к #37: там «точка старта = длина следа − длина мыска», где длина мыска —
   `totalRows ÷ плотность по рядам` (`toeLengthCm`); здесь `длина следа − длина пятки по подошве`.
   Для мыска носка от манжеты то же в абсолютной форме разбирает socks.dampal.ru: «Когда длина
   стопы достигнет 15 см, можно начинать вязать мысок».
3. Формулировки «доля» и «ориентир по ноге» калькулятору недоступны: доля 65 % даёт вычет 8,4 см на
   стопе 24 см, почти вдвое больше бумеранга (она взята у пятки с клином), а «анклбоун» не посчитать.
4. «Длина стопы минус длина пятки» остаётся как внутренняя запись формулы, а не текст на экране.

В рядах (если экран это покажет): `рядов стопы до пятки = N × плотность / база − ряды мыска` — мысок
уже внутри N (раздел 6); `плотность / база` — обратная к `cmPerRow` величина (рядов на сантиметр).
Строка появляется только при заданной длине следа и плотности по рядам: без плотности длину пятки
в сантиметры не перевести (раздел 8, п. 7).

---

## 6. Длина мыска в расчёте

> **Когда отсчёт идёт от кончика мыска, длина мыска отдельно не вычитается: она уже внутри N. Ни
> один из прочитанных источников, меряющих «от кончика мыска», не вычитает мысок второй раз.**

- Dummies, addi, Knitgrammer, Yumi, djaya: длина стопы меряется «from the tip of the toe» до
  рабочих петель (Yumi: «measure from the tip of the toe to where your needles currently
  are in the project»), а не от конца мыска.
- Единственное место, где мысок входит в расчёт, — шорткат Yumi: **длина мыска как оценка длины
  пятки**, то есть мысок заменяет формулу, а не вычитается из следа. Он же стоит в таблице addi
  (раздел 4.2).
- Для носка от мыска ряды мыска остаются в `N × плотность`: то, что мысок уже связан, влияет только
  на число рядов **стопы**, но не на точку старта в сантиметрах.
- **Посадка не вычитается второй раз.** Длина следа из #37 уже содержит посадку (безымянный PDF:
  «Remember to fit comfortably, your sock should be a little short»; dampal: «на 1-1.5 см меньше»).
  Вычет безымянного PDF «approx. 1½ inches short of back of heel» (3,8 см) — это **вычет пятки и
  посадки вместе**, поэтому его нельзя складывать с длиной следа из #37.

---

## 7. Приём укороченных рядов и высота

> **Приём (двойные петли, обёртки, японские, twin stitch) высоту не меняет, если точки поворота
> стоят на тех же местах. Меняется только счёт петель в каждом ряду (±1) и плотность вязания на
> повороте. Калькулятору достаточно одного правила.**

- **addi прямо оставляет выбор мастеру:** «The technique of the short rows is up to you». Regia EN
  называет двойную петлю «wrap stitch», немецкий оригинал — «doppelte Masche»: производитель тот же
  и счёт рядов тот же.
- **Конструкция одинакова.** Tess Knits: у «Wrap & turn, YO, or Japanese» «The end result is EXACTLY
  THE SAME STRUCTURE», у shadow wrap (она же *twin stitch*: «Shadow Wrap / Twin Stitch method»)
  «fairly similar»; метод двойной петли «quite different from the other four». О высоте Tess
  пишет, что форму задаёт число поворотов: «The difference in whether your finished fabric lies
  flat, or if it pooches out into a pocket, is in how many short row turns there are, how close
  they are together …». Patty Lyons (MDK): «Both short row techniques involve
  turning in the same place»; «Match the Short Row Turn, Not the Physical Turn».
- **Пересчёт между приёмами — это смещение на одну петлю, а не на ряд.** Patty Lyons: двойная петля
  стоит на вязаной петле, обёртка — на первой невязаной (цитата в разделе 3.4), поэтому при замене
  приёма «work one more / one fewer stitch» работает по-разному в зависимости от направления; в
  числе рядов разницы нет.
- **Разные приёмы — одно число рядов в источниках.** Двойные петли: addi, Regia, Knitgrammer, Marly
  Bird (Z = P − c). Обёртки: Dummies, Schurch (число обёрнутых петель = P − c, раздел 3.1). Японские:
  Irena — «Все расчеты такие же, как и в пятке с двойными петлями. Каждый ряд укорачивается на
  одну непровязанную петлю. Следовательно, на петлях задней панели мы свяжем 16 рядов».
- **Что приём меняет.** Плотность поворота (Tess: у YO «loosest», у wrap & turn «in the middle»,
  у pick-up-later «tightest» — её «educated guess», без замеров) и расход нити; на высоту по подошве
  это даёт доли ряда ⚠ (измерений нет).

Вывод: одна формула высоты для всех приёмов; в интерфейсе приём не выбирается. Если экран когда-нибудь
напишет «двойные петли», слово надо брать из раздела 10; замена приёма на длину не влияет.

---

## 8. Краевые случаи

> **Нет ни одного источника, который запрещал бы какое-то P. Формула работает при любом P ≥ 3, а
> практические границы у источников такие: 28 петель в носке (14 пятки) у Knitgrammer, 12 петель
> пятки в самой маленькой таблице (addi 8-ply, EU 17/18).**

1. **P не делится на 3** — раздел 3.2: боковые равны, центр забирает остаток (или по петле достаётся
   боковым). Формула `c = P − 2d` всегда даёт целое.
2. **P нечётное.** Knitgrammer отклоняет нечётное число петель носка: «Please provide an even number
   of stitches» (по сути P нечётным быть не может, P = петли ÷ 2). Все таблицы Regia, addi, Marly
   Bird, безымянного PDF — чётные. Нечётное P допускают Schurch (пятка на 15 · 25 · 35 … петлях, центр
   7 · 11 · 15) и Irena (25 из 50). Центр при нечётном P нечётный: у Schurch 15 = 4 + 7 + 4, боковые равны. Формула раздела 3.5 это
   держит (c = P − 2d), хотя для P = 15 даст 5/5/5, а не 4/7/4: центр редактируется.
3. **Мало петель.** Knitgrammer: «You need to have at least a total of 28 stitches and the row gauge
   needs to be at least 16 rows / 4'' or 10cm)». Самая маленькая пятка в источниках — addi 8-ply, EU
   17/18, P = 12, 4/4/4, Z = 8; Regia начинает с P = 22. Нижней границы d источники не дают; формула
   живёт при d ≥ 1.
4. **Слишком много петель на пятку.** Atherley: до 60 % петель носка («You can easily go up to about
   60% of the sock stitches»); в примере 72 → 42–44, 60 → 34. Калькулятор: P — вводимое число, не
   «половина».
5. **Высота не помещается в длину следа.** Источники такого случая не обсуждают. Atherley называет
   последствия: «the risk is that the heel turn won’t hit in the right place, and your sock foot could
   come out too short or too long». Коридор по долям из раздела 4.2 — 16–27 % длины стопы; в таблицах
   ни разу не выше 27 %. Предложение для спеки: **мягкое предупреждение, не запрет** (как §9.6 для
   мыска), когда `S / длина следа > 0,3` или `N` меньше длины мыска: такое P либо неправдоподобно,
   либо сломано.
6. **Круговые ряды = 0.** У Schurch и Dummies их нет; формула S даёт Z + 0,5, то есть половину полосы
   без перемычки. Это другая конструкция (раздел 1), в калькулятор не входит.
7. **Нет плотности по рядам.** Тогда точки старта нет: длина следа в сантиметрах, а число рядов
   пятки без плотности в сантиметры не переходит; «пятка займёт 19,5 ряда» не отвечает на вопрос
   «когда начинать». Строки просто нет — как в #37 («без одного из двух строки нет»). **Расхождение
   со спекой §4.1** (там сантиметры только при обеих плотностях, и по рядам, и по петлям): пятке нужна
   одна плотность по рядам. Открытое решение для спеки пятки.
8. **Обхват пятки.** Heel diagonal Atherley (30–40 % больше обхвата носка ⚠) вне области тикета:
   для старта он не нужен.
9. **Центр, введённый мастером, с чётностью не как у P.** `Z = P − c = 2d` верна только если
   `P − c` чётно, то есть боковые части равны. Источники этот случай не обсуждают: во всех их
   таблицах чётность соблюдена. Прототип `heel-turn-chart` для французской пятки подгоняет центр на
   +1 («Центр подогнан до …: края должны выйти поровну», heel-turn.md, раздел 6) — то же решение
   предлагается и здесь, как **решение спеки**, не цитата. Границы центра: `1 ≤ c ≤ P − 2`
   (боковая часть не меньше одной петли); при `c > P/3` пятка шире центра и укороченных рядов
   меньше, при `c < P/3` больше: `Z = P − c` остаётся верной.

---

## 9. Что это значит для калькулятора

1. **Вход «петли пятки» P.** Дефолт — половина петель носка; поле редактируемое, до 60 % носка
   допустимо (MDK, Atherley). Чётность P не навязывается (раздел 8, п. 2).
2. **Деление: d = ⌊P/3⌋, c = P − 2d.** Центр редактируется; **дефолт — остаток в центр**. Это правило
   Atherley, Regia (8 из 9 строк) и addi (46 из 51), единое для всего калькулятора, как правило остатка
   в §5.4 спеки мыска. Центр той же чётности, что P — инвариант (боковые части равны), как у всех
   источников; введённый центр другой чётности сдвигается на +1 (решение спеки, как у прототипа
   французской пятки), границы `1 ≤ c ≤ P − 2` (раздел 8, п. 9).
3. **Ряды: Z = 2d в каждой половине, q = 2 круговых ряда между половинами константой (без ручки),
   всего по центральной полосе `2Z + q + 1`.** q = 2 стоит у всех источников, которые называют
   конструкцию бумерангом. Правило ядра формулируется через число поворотов в половине, не через
   «сколько петель гладкие» (раздел 3.4); расхождение прочтений — ±2 ряда на половину.
4. **Высота по подошве `S = Z + (q+1)/2 = Z + 1,5` рядов; в сантиметрах `S × база / плотность`**, без
   поправки (раздел 4). Допуск: ±0,5 см между источниками, до 1,7 см против фиксированных таблиц.
   Без плотности по рядам точки старта нет (раздел 8, п. 7).
5. **Точка старта: `N = длина следа − S_см`, строка «Начинай пятку, когда от кончика мыска
   провязано N см — пятка займёт S см»** (форма из #37, раздел 5).
6. **Длина мыска из N не вычитается**: отсчёт от кончика (раздел 6). Посадка уже внутри длины следа
   (#37) и вторично не вычитается.
7. **Приём укороченных рядов в расчёте не участвует** (раздел 7). Одна формула; текст на экране от
   приёма не зависит.
8. **Глубину пятки (heel diagonal, ГОСТ «высота пятки») калькулятор не считает**: для точки старта
   она не нужна, а численно по построению равна S (раздел 2).
9. **Граница и предупреждение вместо запрета.** Формула работает при d ≥ 1; нижней границы источники
   не дают (самый маленький пример: P = 12 у addi). Мягкое предупреждение — когда пятка занимает
   больше 30 % длины следа или старт приходится раньше конца мыска. Предложение, не цитата.
10. **Круговые ряды между половинами называть «круговыми рядами между половинами»,
    а не «промежуточными»**: слово «промежуточный ряд» закреплено спекой мыска (§2) за рядом без
    убавок между убавочными.

---

## 10. Слова для словаря будущей спеки

Предложения к §2 спеки пятки; слова §2 спеки мыска («убавочный ряд», «промежуточный ряд», «кромка»,
«плотность по рядам», «база образца») учтены: где новое слово с ними сталкивается, это сказано.

| Слово | Значение | Основание |
|---|---|---|
| **Пятка бумеранг** | пятка на половине петель двумя трапециями из укороченных рядов, 2 круговых ряда между ними, без убавок и без клина | addi, Regia, Knitgrammer, Irena, peopleknit; англ. *boomerang heel*, она же *yo-yo*, *German short-row heel*; нем. *Bumerangferse* |
| **Петли пятки** | половина петель носка (по умолчанию), на которых вяжется пятка | Regia, addi («Sts for heel»), Atherley |
| **Боковая часть** (боковая треть) | петли с края; каждая петля боковой части даёт один укороченный ряд в половине | verasha, knitka, dampal («боковые части»); совпадает с heel-turn.md |
| **Центральная часть** | гладкие петли в середине; ручка | peopleknit («в центре»), verasha, heel-turn.md |
| **Укороченный ряд** | ряд, не доходящий до конца петель пятки | peopleknit, yarukod, knitka, verasha; англ. *short row* |
| **Двойная петля** (ДП) | метка поворота: петля, вытянутая нитью так, что на спице лежит как две | peopleknit, yarukod, verasha, Irena («ДП»); англ. *double stitch*; у tru-knitting и handmadefrom — «накид» (другая метка того же поворота) |
| **Половина пятки** (первая, вторая) | трапеция из укороченных рядов; первая — от всех петель к центру, вторая — от центра ко всем | verasha («Первая половина пятки», «Вторая половина пятки»), addi («1st half», «2nd half»). Irena называет их «верхний клин» и «нижний клин»: «клин» уже занят «клином подъёма», слово не берётся |
| **Круговые ряды между половинами** | 2 круговых ряда по всем петлям между половинами | peopleknit, yarukod, verasha («два ряда по кругу»); **не «промежуточные»**: слово занято спекой мыска |
| **Длина пятки по подошве** | расстояние вдоль стопы от начала пятки до её середины; вычитается из длины следа. Параллель «длине мыска» | раздел 2; в тикете «высота по подошве» |
| **Глубина пятки** | насколько пятка поднимается вверх по ноге; для старта не нужна | раздел 2; ГОСТ называет её «высота пятки» |
| **Длина следа**, **посадка** | из #37 | ГОСТ 8541-94, #37 |
| **Точка старта пятки** | на скольких сантиметрах от кончика мыска начинать пятку: `длина следа − длина пятки по подошве` | раздел 5; зеркало «точки старта» из #37 (`длина следа − длина мыска`) |

**«Высота пятки» без уточнения не вводить.** В ГОСТ 8541-94 это глубина вверх по ноге, в тикете —
длина по подошве (раздел 2). **«Клин»** — только «клин подъёма» (его у бумеранга нет). **«Накид»** —
название другой метки поворота у tru-knitting и handmadefrom, в калькулятор не идёт. **«Двойная
петля»** вместо «обёртка» (*wrap*): в прочитанных русских описаниях бумеранга обёртки не встретились, в английском
переводе Regia «wrap stitch» — это двойная петля.

---

## 11. Что проверить не удалось

- **Русских печатных описаний бумеранга от мыска не нашлось.** Irena Handmade — единственное с
  расчётом; peopleknit и yarukodelnica — переводы немецких инструкций для носка **от манжеты**
  (на peopleknit: «Через 20 см стопы от центра пятки начать выполнение мыска», то есть длина стопы
  мерится от центра пятки); Максимова и «Наука и жизнь» (heel-turn.md) на бумеранг не проверялись:
  их пятки со стенкой. Другие русские «носки от мыска» (djaya.ru, vaizaniespicami.ru) вяжут пятку с клином,
  а не бумеранг, поэтому там взяты только формулировки (раздел 5).
- **DROPS и Craft Yarn Council.** Поиск по описаниям DROPS (Garnstudio) и CYC с укороченными рядами
  в носках от мыска с точкой старта в сантиметрах ничего не дал. Поиск по Lion Brand и Yarnspirations бумеранга от
  мыска тоже не дал.
- **Двойные петли на крайней петле центра и «центр минус 2»** (раздел 3.4): тот же ли это бумеранг,
  что у addi, определить по текстам нельзя. Влияние — 2 ряда на половину, 0,5 см.
- **Плотность в рядах и в кругах** (раздел 4.3): Atherley велит мерить круги на связанном носке;
  числа разницы между кругами и рядами на образце нет ни в одном источнике. Укороченные ряды вяжутся
  туда и обратно, стопа — по кругу: на этом носке мера плотности может чуть расходиться.
- **Точка, до которой меряется ГОСТ «середина пятки»** (раздел 4.4): текст стандарта без рисунков.
  Принято: задняя вершина контура пятки, как у Yumi и addi.
- **Измерения самой пятки.** Ни один источник не мерил, сколько по подошве занимает связанная
  трапеция: таблица addi использует длину мыска. Формула `Z + 1,5` выведена из конструкции и
  согласуется с формулами Atherley, Knitgrammer и Irena, но не с замером.
- **Статичный текст Knitgrammer** («1.10” (2.75 cm)») расходится с формулой скрипта, причина не
  выяснена.
- **Нижняя граница P и d** — ни в одном источнике, кроме валидации ввода Knitgrammer (28 петель в
  носке).

**Книги без доступа к тексту.** Kate Atherley, *Custom Socks* (Interweave, 2015): на archive.org
`customsocksknitt0000athe`, `access-restricted-item`, текст закрыт; Wendy D. Johnson, *Socks from
the Toe Up* (Potter Craft, 2009): `socksfromtoeupes0000john`, тоже закрыта; Atherley называет
Johnson вдохновителем своей toe-up-пятки; рецензии (knittingscholar.com) чисел не дают; Stephanie van
der Linden, «Гениальные носки» (на неё ссылается Irena, японские укороченные ряды); Ulrike
Brüggemann, *Twist-Socken stricken* (Topp, 2012; бумеранг и укороченные ряды по аннотации); Lynne
Rowe, *Socken stricken* (бумеранг cuff-down и toe-up по аннотации издателя); Ann Budd, *The
Knitter’s Handy Book of Patterns* и Nancy Bush, *Folk Socks* (так же закрыты на archive.org).
Ann Budd, *Getting Started Knitting Socks* (прочитана по OCR) — только носки от манжеты с пяткой со
стенкой, укороченные ряды у неё только в повороте.
