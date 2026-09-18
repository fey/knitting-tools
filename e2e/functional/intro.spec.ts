import { expect, test } from '@playwright/test'

// §6.1: вводка — текст в начале страницы, отвечающий на «что это за инструмент» и «куда
// нажимать». Ради неё порядок экрана переставлен: схема, стоявшая первой, уехала под ручки.

test('вводка стоит первой и видна без прокрутки', async ({ page }) => {
  await page.goto('./')

  const intro = page.getByTestId('intro')
  await expect(intro).toBeVisible()
  await expect(intro).toBeInViewport()

  const introBox = await intro.boundingBox()
  const fieldsBox = await page.getByTestId('stitch-fields').boundingBox()
  expect(introBox!.y).toBeLessThan(fieldsBox!.y)
})

test('вводка называет конструкцию и её границу — настройку, которой нет, не ищут', async ({
  page,
}) => {
  await page.goto('./')

  const intro = page.getByTestId('intro')
  await expect(intro).toContainText('ленточный мысок')
  // Закрытие названо выбором, а не частью зафиксированной конструкции (тикет #15, §1).
  await expect(intro).toContainText('трикотажным швом или стягиванием')
  await expect(intro).toContainText('выбор мастера')
  await expect(intro).toContainText('toe-up')
})

test('вводка не несёт живых чисел — они живут у ручек, которые их меняют', async ({ page }) => {
  await page.goto('./')

  // Дефолт 60 → 20 даёт 19 рядов; ни одно из этих чисел во вводке стоять не должно,
  // иначе на экране появится второй источник правды рядом с «Итогом» и подписью ритма.
  const text = (await page.getByTestId('intro').textContent()) ?? ''
  expect(text).not.toMatch(/\b(60|20|19)\b/)
})

test('кромка объясняется подписью у своей ручки, а не во вводке', async ({ page }) => {
  await page.goto('./')

  const explainer = page.getByTestId('edge-explainer')
  await expect(explainer).toContainText('с краю половины до места убавки')
  await expect(explainer).toContainText('широкий мысок')
  await expect(page.getByTestId('intro')).not.toContainText('Кромка')

  // Подпись стоит между заголовком ручки и самими кнопками — её читают до выбора.
  const explainerBox = await explainer.boundingBox()
  const edgeTwoBox = await page.getByTestId('edge-2').boundingBox()
  expect(explainerBox!.y).toBeLessThan(edgeTwoBox!.y)
})

test('вводка называет половины круга и связь с четырьмя петлями убавочного ряда', async ({
  page,
}) => {
  await page.goto('./')

  // Тикет #13: «круг делится пополам» без имён половин не объясняет ни того, почему
  // на схеме одна половина, ни почему убавочный ряд снимает 4 петли, а не 2. Модель
  // это знает (§3) — до экрана знание доходит только здесь.
  const intro = page.getByTestId('intro')
  await expect(intro).toContainText('верх стопы и подошву')
  await expect(intro).toContainText('убавки идут по краям каждой половины')
  await expect(intro).toContainText('снимает четыре петли')
  await expect(intro).toContainText('по две с верха стопы и по две с подошвы')
})

// Тикет #16, §6.1: вводка нужна на первом заходе и мешает на десятом. Решение «видна
// всегда и не сворачивается» отменено (§14); выбор переживает заход второй записью
// в `localStorage` (§10.2), отдельной от прогресса.

test('вводка открывается развёрнутой, кнопка внизу её сворачивает', async ({ page }) => {
  await page.goto('./')

  const body = page.getByTestId('intro-body')
  const collapse = page.getByTestId('intro-collapse')
  await expect(body).toBeVisible()
  await expect(collapse).toBeVisible()
  await expect(collapse).toHaveText('Свернуть инструкцию')

  // Кнопка стоит внизу вводки — под текстом, а не над ним.
  const bodyBox = (await body.boundingBox())!
  const collapseBox = (await collapse.boundingBox())!
  expect(collapseBox.y).toBeGreaterThan(bodyBox.y)

  await collapse.click()

  await expect(body).toBeHidden()
  // Выход из свёрнутого состояния всегда на виду — прятать его нельзя.
  const expand = page.getByTestId('intro-expand')
  await expect(expand).toBeVisible()
  await expect(expand).toHaveText('Показать инструкцию')
  await expect(expand).toBeInViewport()

  // Порядок экрана свёрнутая вводка не ломает (§12.2 п.7): строка-кнопка встаёт
  // ровно на её место — выше полей петель, а не куда-нибудь под схему.
  const expandBox = (await expand.boundingBox())!
  const fieldsBox = (await page.getByTestId('stitch-fields').boundingBox())!
  expect(expandBox.y).toBeLessThan(fieldsBox.y)
})

test('строка-кнопка разворачивает вводку обратно', async ({ page }) => {
  await page.goto('./')

  await page.getByTestId('intro-collapse').click()
  await expect(page.getByTestId('intro-body')).toBeHidden()

  await page.getByTestId('intro-expand').click()

  await expect(page.getByTestId('intro-body')).toBeVisible()
  await expect(page.getByTestId('intro-collapse')).toBeVisible()
  await expect(page.getByTestId('intro-expand')).toHaveCount(0)
})

test('свёрнутость переживает перезагрузку', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('intro-collapse').click()

  await page.reload()

  await expect(page.getByTestId('intro-expand')).toBeVisible()
  await expect(page.getByTestId('intro-body')).toBeHidden()

  // И обратно: развёрнутое состояние переживает заход так же.
  await page.getByTestId('intro-expand').click()
  await page.reload()
  await expect(page.getByTestId('intro-body')).toBeVisible()
})

test('свёрнутость не попадает в hash и не сбрасывается сменой расчёта', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('intro-collapse').click()

  // Прогресс привязан к расчёту, свёрнутость — к человеку: смена петель её не трогает.
  await page.getByTestId('initial-plus').click()
  await expect(page.getByTestId('intro-expand')).toBeVisible()

  // Делятся расчётом, а не тем, читал ли отправитель вводку (§10.5).
  const hash = await page.evaluate(() => location.hash)
  expect(hash).toBe('#s=64&e=20&k=1&r=even')
})

test('недоступное localStorage не роняет страницу — вводка просто развёрнута', async ({ page }) => {
  // Приватная вкладка и заблокированные данные сайта: у Chrome сам доступ к свойству
  // кидает SecurityError, поэтому падать не вправе ни чтение, ни `typeof`-проверка.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('storage denied')
      },
    })
  })

  await page.goto('./')

  await expect(page.getByTestId('intro-body')).toBeVisible()
  await expect(page.getByTestId('intro-collapse')).toBeVisible()
  // Страница жива целиком, а не только вводка: расчёт на экране посчитан.
  await expect(page.getByTestId('summary-total-rows')).toHaveText('19 рядов всего')

  // Свернуть по-прежнему можно — выбор просто не переживёт заход.
  await page.getByTestId('intro-collapse').click()
  await expect(page.getByTestId('intro-expand')).toBeVisible()
})
