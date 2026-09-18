import { expect, test } from '@playwright/test'

/**
 * Витрина разделов на корне (§11, §12.2). Проверяется то, чего ядро не видит:
 * что корень отдаёт витрину, а не калькулятор, что ссылка доводит до подстраницы
 * и что возврат с неё приводит обратно.
 *
 * Переход здесь — обычная навигация браузера между двумя входами сборки, а не
 * роутер: роутера в проекте нет, и hash целиком остаётся расчёту (§10.1).
 */

test('корень отдаёт витрину, а не калькулятор', async ({ page }) => {
  await page.goto('./')

  await expect(page).toHaveTitle('Калькуляторы для вязания')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Калькуляторы для вязания')

  // Ручек расчёта на витрине нет вовсе — она разводит по калькуляторам.
  await expect(page.getByTestId('stitch-fields')).toHaveCount(0)
  await expect(page.getByTestId('toe-chart')).toHaveCount(0)
})

test('ссылка витрины открывает калькулятор на своей подстранице', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('calculator-link-toe-band').click()

  // Калькулятор открывается дефолтным расчётом и тут же пишет его в hash (§10.1):
  // с витрины приходят без параметров, и адрес после перехода несёт дефолт.
  await expect(page).toHaveURL(/\/knitting-tools\/toe-band\/#s=60&e=20&k=1&r=even$/)
  await expect(page.getByTestId('toe-chart')).toBeVisible()
})

test('возврат из калькулятора приводит на витрину', async ({ page }) => {
  await page.goto('./toe-band/')
  await page.getByTestId('back-to-home').click()

  await expect(page).toHaveURL(/\/knitting-tools\/$/)
  await expect(page.getByTestId('calculator-list')).toBeVisible()
})

test('«Поделиться» на витрине нет — делятся расчётом, а расчёта здесь нет', async ({ page }) => {
  await page.goto('./')

  await expect(page.getByTestId('share-button')).toHaveCount(0)
  // Отзыв — про сайт целиком, и на витрине он остаётся.
  await expect(page.getByTestId('feedback-button')).toBeVisible()
})
