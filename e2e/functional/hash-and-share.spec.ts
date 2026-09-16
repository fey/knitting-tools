import { expect, test } from '@playwright/test'

/**
 * Расчёт в адресе и «Поделиться» (тикет #8, §10).
 *
 * Здесь всё, на что ядро ответить не может (§12.2): битый входящий hash чинится
 * молча и переписывается (нужна реальная адресная строка); «Поделиться» уносит
 * почтикнутое, а не недонабранное (нужен перехват `navigator.share`/буфера);
 * приоритет hash → `localStorage` → дефолты на пустом hash (нужен реальный
 * `localStorage`).
 */

const CANONICAL = '#s=60&e=20&k=1&r=even'
const canonicalUrl = new RegExp(`${CANONICAL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)

test('битый входящий hash (несходящаяся пара) чинится молча и переписывается', async ({ page }) => {
  // 60 − 18 = 42, не кратно 4 — по отдельности оба числа законны, не сходится сочетание.
  await page.goto('./#s=60&e=18')

  await expect(page).toHaveURL(canonicalUrl)
  await expect(page.getByTestId('final-stitches')).toHaveValue('20')
  await expect(page.getByTestId('initial-stitches')).toHaveValue('60')
  // Молча — подписи починки полей это не входящая ссылка, а ввод в поле.
  await expect(page.getByTestId('initial-fix')).toHaveCount(0)
  await expect(page.getByTestId('final-fix')).toHaveCount(0)
  await expect(page.getByTestId('summary-params')).toContainText('60 → 20 петель')
})

test('неизвестный код ритма и вне-диапазонная кромка чинятся дефолтом молча', async ({ page }) => {
  await page.goto('./#s=60&e=20&k=5&r=zigzag')

  await expect(page).toHaveURL(canonicalUrl)
  await expect(page.getByTestId('edge-1')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('summary-params')).toContainText('убавки через ряд')
})

test('правка петель переписывает hash живьём, без перезагрузки', async ({ page }) => {
  await page.goto('./')
  await expect(page).toHaveURL(canonicalUrl)

  await page.getByTestId('final-minus').click()
  await expect(page).toHaveURL(/#s=60&e=16&k=1&r=even$/)
})

test('пустой hash: параметры подхватываются из localStorage, а не из дефолтов', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ paramsKey: 's=60&e=16&k=1&r=even', row: 3 }))
  }, 'knitting-tools:toe-progress')

  await page.goto('./')

  await expect(page).toHaveURL(/#s=60&e=16&k=1&r=even$/)
  await expect(page.getByTestId('final-stitches')).toHaveValue('16')
})

test('без hash и без localStorage — открывается дефолтом', async ({ page }) => {
  await page.goto('./')

  await expect(page).toHaveURL(canonicalUrl)
  await expect(page.getByTestId('final-stitches')).toHaveValue('20')
})

test('«Поделиться» зовёт системный шит с почтикнутыми данными, а не с недонабранными', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as { __shared: unknown }).__shared = null
    // Подменяем API детерминированно: реального системного шита в headless нет.
    ;(navigator as unknown as { share: (data: unknown) => Promise<void> }).share = async (data) => {
      ;(window as unknown as { __shared: unknown }).__shared = data
    }
  })

  // Битая ссылка: конечные 18 не сходятся с начальными 60.
  await page.goto('./#s=60&e=18')
  await expect(page).toHaveURL(canonicalUrl)

  await page.getByTestId('share-button').click()

  const shared = await page.evaluate(() => (window as unknown as { __shared: { url: string; text: string } }).__shared)
  expect(shared.url).toContain('#s=60&e=20&k=1&r=even')
  expect(shared.url).not.toContain('e=18')
  expect(shared.text).toBe('Мысок: 60 → 20 петель, убавки через ряд, 19 рядов')
})

test('«Поделиться» на живом поле: касание уводит фокус, починка успевает раньше клика', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as { __shared: unknown }).__shared = null
    ;(navigator as unknown as { share: (data: unknown) => Promise<void> }).share = async (data) => {
      ;(window as unknown as { __shared: unknown }).__shared = data
    }
  })

  await page.goto('./')

  // Поле ещё в фокусе, набранное несходящееся — схема его не тронула (§9.3),
  // params остаются на дефолтных 20, hash ещё не двинулся.
  const final = page.getByTestId('final-stitches')
  await final.click()
  await final.fill('6')
  await expect(page).toHaveURL(canonicalUrl)

  // Касание кнопки уводит фокус с поля раньше, чем срабатывает click (§10.4):
  // блюр чинит «6» (ниже минимума при кромке 1) до 8 — это и уносит «Поделиться».
  await page.getByTestId('share-button').click()

  await expect(final).toHaveValue('8')
  await expect(page).toHaveURL(/#s=60&e=8&k=1&r=even$/)

  const shared = await page.evaluate(() => (window as unknown as { __shared: { url: string; text: string } }).__shared)
  expect(shared.url).toContain('e=8')
  expect(shared.url).not.toContain('e=6')
  expect(shared.text).toContain('60 → 8 петель')
})

test('без navigator.share — фолбэк на копирование в буфер уносит почтикнутое', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    // Убираем API, чтобы гарантированно попасть в фолбэк на буфер.
    Object.defineProperty(window.navigator, 'share', { value: undefined, configurable: true })
  })

  await page.goto('./#s=60&e=18')
  await expect(page).toHaveURL(canonicalUrl)

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toHaveText('Ссылка скопирована')

  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('Мысок: 60 → 20 петель, убавки через ряд, 19 рядов')
  expect(clipboard).toContain('#s=60&e=20&k=1&r=even')
  expect(clipboard).not.toContain('e=18')
})
