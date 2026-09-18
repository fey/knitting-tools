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
