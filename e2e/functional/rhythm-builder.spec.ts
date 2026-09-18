import { expect, test } from '@playwright/test'

test('конструктор свёрнут на первом экране, разворачивается по кнопке', async ({ page }) => {
  await page.goto('./toe-band/')

  await expect(page.getByTestId('rhythm-builder-panel')).toBeHidden()
  await expect(page.getByTestId('rhythm-custom-card')).toBeHidden()

  const toggle = page.getByTestId('rhythm-builder-toggle')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  await toggle.click()
  await expect(page.getByTestId('rhythm-builder-panel')).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')

  // Дефолт — «через ряд», один сегмент {1, 10}, покрывает все 10 убавочных рядов.
  const step = page.getByTestId('rhythm-builder-step-0')
  await expect(step).toContainText('Шаг 1 из 1')
  await expect(step.getByTestId('rhythm-builder-step-0-interval-value')).toHaveText('1')
  await expect(step.getByTestId('rhythm-builder-step-0-repeats-value')).toHaveText('10')
  await expect(page.getByTestId('rhythm-builder-coverage')).toHaveText('Сегменты покрывают все 10 убавочных рядов')
})

test('правка шага переводит ритм в «свой», сворачивание конструктора не теряет его', async ({ page }) => {
  await page.goto('./toe-band/')

  await expect(page.getByTestId('preset-even')).toHaveAttribute('aria-pressed', 'true')

  await page.getByTestId('rhythm-builder-toggle').click()
  await page.getByTestId('rhythm-builder-step-0-interval-plus').click()

  // Имя ритма определяется происхождением: тронули число — «Свой ритм» навсегда,
  // выбор пресета в интерфейсе гаснет.
  await expect(page.getByTestId('preset-even')).toHaveAttribute('aria-pressed', 'false')

  const customCard = page.getByTestId('rhythm-custom-card')
  await expect(customCard).toBeVisible()
  await expect(customCard).toContainText('Убавочный ряд, потом 2 промежуточных, повторить 10 раз')
  // {2, 10} даёт 30 рядов минус хвост последнего интервала (2) — 28.
  await expect(customCard.getByTestId('rhythm-custom-card-rows')).toHaveText('28 рядов')

  const summary = page.getByTestId('summary-panel')
  await expect(summary.getByTestId('summary-params')).toContainText('убавки свой ритм')
  await expect(summary.getByTestId('summary-total-rows')).toHaveText('28 рядов всего')

  // Покрытие не сломано: повторы не тронуты, сегмент по-прежнему даёт все 10 убавочных.
  await expect(page.getByTestId('rhythm-builder-coverage')).toHaveText('Сегменты покрывают все 10 убавочных рядов')

  // Сворачивание конструктора не теряет набранный ритм — карточка своего ритма
  // остаётся на экране сама по себе, вне свёрнутой панели.
  const toggle = page.getByTestId('rhythm-builder-toggle')
  await toggle.click()
  await expect(page.getByTestId('rhythm-builder-panel')).toBeHidden()
  await expect(customCard).toBeVisible()
  await expect(customCard.getByTestId('rhythm-custom-card-rows')).toHaveText('28 рядов')

  // Разворачиваем снова — правка на месте, а не откатилась к пресетному {1, 10}.
  await toggle.click()
  await expect(page.getByTestId('rhythm-builder-step-0-interval-value')).toHaveText('2')
})

test('свой ритм при смене петель не пересчитывается — он остаётся набранным (§5.5)', async ({ page }) => {
  await page.goto('./toe-band/')

  await page.getByTestId('rhythm-builder-toggle').click()
  await page.getByTestId('rhythm-builder-step-0-interval-plus').click()

  const customCard = page.getByTestId('rhythm-custom-card')
  await expect(customCard).toContainText('повторить 10 раз')

  // 60 → 24: N падает с 10 до 9. Пресет пересчитался бы сам; свой ритм — нет.
  await page.getByTestId('final-plus').click()
  await expect(page.getByTestId('summary-dec-rows')).toHaveText('9 убавочных рядов')
  await expect(customCard).toContainText('повторить 10 раз')

  // Разошёлся с N — сработает счётчик покрытия: сегмент по-прежнему кроет 10, а не 9.
  await expect(page.getByTestId('rhythm-builder-coverage')).toHaveText(
    'Лишний 1 шаг: мысок кончится раньше, до них не дойдёт',
  )
})

test('«+ ещё шаг» и «Убрать» правят состав сегментов и тоже переводят ритм в «свой»', async ({ page }) => {
  await page.goto('./toe-band/')

  await page.getByTestId('rhythm-builder-toggle').click()
  await page.getByTestId('rhythm-builder-add-step').click()

  await expect(page.getByTestId('preset-even')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('rhythm-builder-step-0')).toContainText('Шаг 1 из 2')
  await expect(page.getByTestId('rhythm-builder-step-1')).toContainText('Шаг 2 из 2')

  // Добавленный шаг {0, 1} поверх {1, 10} — перебор: 11 покрыто вместо 10 нужных.
  await expect(page.getByTestId('rhythm-builder-coverage')).toHaveText(
    'Лишний 1 шаг: мысок кончится раньше, до них не дойдёт',
  )

  await page.getByTestId('rhythm-builder-step-1-remove').click()
  await expect(page.getByTestId('rhythm-builder-step-1')).toBeHidden()
  await expect(page.getByTestId('rhythm-builder-coverage')).toHaveText('Сегменты покрывают все 10 убавочных рядов')

  // Последний оставшийся шаг убрать нельзя — пустой список сегментов ломает схему.
  await expect(page.getByTestId('rhythm-builder-step-0-remove')).toBeDisabled()
})

test('степперы шага — мишень 44 px, интервал упирается в потолок 6 и пол 0, повторы — в пол 1', async ({
  page,
}) => {
  await page.goto('./toe-band/')
  await page.getByTestId('rhythm-builder-toggle').click()

  const intervalPlus = page.getByTestId('rhythm-builder-step-0-interval-plus')
  const box = await intervalPlus.boundingBox()
  expect(box?.width).toBeGreaterThanOrEqual(44)
  expect(box?.height).toBeGreaterThanOrEqual(44)

  // Дефолтный интервал — 1; потолок 6 достигается за 5 кликов, дальше кнопка гаснет.
  while (await intervalPlus.isEnabled()) await intervalPlus.click()
  await expect(page.getByTestId('rhythm-builder-step-0-interval-value')).toHaveText('6')
  await expect(intervalPlus).toBeDisabled()

  const intervalMinus = page.getByTestId('rhythm-builder-step-0-interval-minus')
  while (await intervalMinus.isEnabled()) await intervalMinus.click()
  await expect(page.getByTestId('rhythm-builder-step-0-interval-value')).toHaveText('0')
  await expect(intervalMinus).toBeDisabled()

  const repeatsMinus = page.getByTestId('rhythm-builder-step-0-repeats-minus')
  while (await repeatsMinus.isEnabled()) await repeatsMinus.click()
  await expect(page.getByTestId('rhythm-builder-step-0-repeats-value')).toHaveText('1')
  await expect(repeatsMinus).toBeDisabled()
})
