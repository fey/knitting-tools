import { expect, test } from '@playwright/test'

/**
 * Поворот пятки в адресе и «Поделиться» (спека пятки §9, тикет #57). Здесь то, на что
 * ядро ответить не может: адресная строка, перехват `navigator.share` и буфера,
 * починка поля по уходу фокуса раньше клика по кнопке.
 */

const CANONICAL = /#s=60&c=6&side=rs$/

async function stubShare(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    ;(window as unknown as { __shared: unknown }).__shared = null
    // Реального системного шита в headless нет — подменяем API детерминированно.
    ;(navigator as unknown as { share: (data: unknown) => Promise<void> }).share = async (data) => {
      ;(window as unknown as { __shared: unknown }).__shared = data
    }
  })
}

async function readShared(page: import('@playwright/test').Page) {
  return page.evaluate(() => (window as unknown as { __shared: { url: string; text: string } }).__shared)
}

test('без hash — дефолт, и адрес сразу канонический', async ({ page }) => {
  await page.goto('./french-heel/')

  await expect(page).toHaveURL(CANONICAL)
  await expect(page.getByTestId('initial-stitches')).toHaveValue('60')
  await expect(page.getByTestId('center-stitches')).toHaveValue('6')
})

test('ссылка открывает тот же поворот', async ({ page }) => {
  await page.goto('./french-heel/#s=40&c=8&side=ws')

  await expect(page).toHaveURL(/#s=40&c=8&side=ws$/)
  await expect(page.getByTestId('initial-stitches')).toHaveValue('40')
  await expect(page.getByTestId('center-stitches')).toHaveValue('8')
  await expect(page.getByTestId('first-side-ws')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('summary-division')).toHaveText('6 · 8 · 6')
  await expect(page.getByTestId('turn-row').first()).toHaveText(/^\s*1\s*Изнаночный ряд →/)
})

test('битая ссылка чинится дефолтом по параметру, молча', async ({ page }) => {
  // Начальные 61 нечётные → 60; центр 8 при пятке 30 сходится и остаётся; сторона неизвестна → лицевой.
  await page.goto('./french-heel/#s=61&c=8&side=zz')

  await expect(page).toHaveURL(/#s=60&c=8&side=rs$/)
  await expect(page.getByTestId('initial-stitches')).toHaveValue('60')
  await expect(page.getByTestId('center-stitches')).toHaveValue('8')
  await expect(page.getByTestId('first-side-rs')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('initial-fix')).toHaveCount(0)
  await expect(page.getByTestId('center-fix')).toHaveCount(0)
})

test('неполная ссылка достраивается дефолтом', async ({ page }) => {
  await page.goto('./french-heel/#s=62')

  await expect(page).toHaveURL(/#s=62&c=5&side=rs$/)
  await expect(page.getByTestId('center-stitches')).toHaveValue('5')
})

test('правка полей и стороны переписывает hash живьём', async ({ page }) => {
  await page.goto('./french-heel/')
  await expect(page).toHaveURL(CANONICAL)

  await page.getByTestId('initial-stitches').fill('64')
  await expect(page).toHaveURL(/#s=64&c=6&side=rs$/)

  await page.getByTestId('center-stitches').fill('10')
  await expect(page).toHaveURL(/#s=64&c=10&side=rs$/)

  await page.getByTestId('first-side-ws').click()
  await expect(page).toHaveURL(/#s=64&c=10&side=ws$/)
})

test('перезагрузка сохраняет расчёт', async ({ page }) => {
  await page.goto('./french-heel/')
  await page.getByTestId('initial-stitches').fill('48')
  await page.getByTestId('first-side-ws').click()
  await expect(page).toHaveURL(/#s=48&c=6&side=ws$/)

  await page.reload()

  await expect(page.getByTestId('initial-stitches')).toHaveValue('48')
  await expect(page.getByTestId('first-side-ws')).toHaveAttribute('aria-pressed', 'true')
})

test('«Поделиться» отдаёт ссылку и текст про поворот пятки', async ({ page }) => {
  await stubShare(page)
  await page.goto('./french-heel/#s=40&c=8&side=ws')

  await page.getByTestId('share-button').click()

  const shared = await readShared(page)
  expect(shared.url).toMatch(/\/french-heel\/#s=40&c=8&side=ws$/)
  expect(shared.text).toBe('Поворот французской пятки: 20 петель пятки, центр 8, 6 рядов поворота')
})

test('«Поделиться» на живом поле: починка по уходу фокуса успевает раньше клика', async ({ page }) => {
  await stubShare(page)
  await page.goto('./french-heel/')

  // Центр 7 при пятке 30 не сходится — пока поле в фокусе, расчёт его не трогает.
  const center = page.getByTestId('center-stitches')
  await center.click()
  await center.fill('7')
  await expect(page).toHaveURL(CANONICAL)

  await page.getByTestId('share-button').click()

  await expect(center).toHaveValue('8')
  const shared = await readShared(page)
  expect(shared.url).toContain('#s=60&c=8&side=rs')
  expect(shared.text).toContain('центр 8')
})

test('без navigator.share — ссылка и текст уходят в буфер', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, 'share', { value: undefined, configurable: true })
  })
  await page.goto('./french-heel/')

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toHaveText('Ссылка скопирована')

  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('Поворот французской пятки: 30 петель пятки, центр 6, 12 рядов поворота')
  expect(clipboard).toMatch(/\/french-heel\/#s=60&c=6&side=rs$/)
})
