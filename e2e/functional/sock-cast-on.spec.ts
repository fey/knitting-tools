import { expect, test } from '@playwright/test'

/**
 * Справочник набора петель (`/sock-cast-on/`). Числа сверяет юнит-тест ядра
 * (`castOn.test.ts`); здесь — то, что живёт только в DOM: переключатель толщины,
 * склейка колонок Opal и Regia, оговорка про пряжу без плотности, ширина телефона.
 */

test('страница открывается на 400 м/100 г, все восемь пар', async ({ page }) => {
  await page.goto('./sock-cast-on/')

  await expect(page).toHaveTitle('Набор петель на носок по размеру')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Набор петель на носок')
  await expect(page.getByTestId('yarn-400')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('cast-on-row')).toHaveCount(8)

  // 38/39 на 400 м: Opal 60, Regia 60, формула 64.
  await expect(page.getByTestId('cast-on-row').nth(3)).toContainText('38/39')
  await expect(page.getByTestId('formula-cell').nth(3)).toHaveText('64')
  await expect(page.getByTestId('col-maker')).toHaveText(['Opal', 'Regia'])
})

test('на 200 м/100 г колонки производителей склеиваются — их числа совпали', async ({ page }) => {
  await page.goto('./sock-cast-on/')
  await page.getByTestId('yarn-200').click()

  await expect(page.getByTestId('yarn-200')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('col-maker')).toHaveText(['Opal = Regia'])
  await expect(page.getByTestId('formula-cell').nth(3)).toHaveText('44')
})

test('оговорка про Alize есть там, где Alize есть', async ({ page }) => {
  await page.goto('./sock-cast-on/')
  await expect(page.getByTestId('yarn-caveat')).toContainText('Alize Superwash')

  await page.getByTestId('yarn-250').click()
  await expect(page.getByTestId('yarn-caveat')).toHaveCount(0)
})

test('на телефоне страница не прокручивается вбок ни на одной толщине', async ({ page }) => {
  await page.goto('./sock-cast-on/')
  for (const key of ['400', '200', '250']) {
    await page.getByTestId(`yarn-${key}`).click()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBe(0)
  }
})
