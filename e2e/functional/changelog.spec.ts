import { expect, test } from '@playwright/test'

/**
 * «Что нового» в подвале (§6.5): версия, диалог с заметками из `CHANGELOG.md`, закрытие.
 * Разбор самого файла — под Vitest, здесь только то, что живёт в DOM.
 */

for (const path of ['./', './toe-band/']) {
  test(`подвал ${path} показывает версию и открывает заметки`, async ({ page }) => {
    await page.goto(path)

    await expect(page.getByTestId('app-version')).toHaveText(/^Версия \d+\.\d+\.\d+$/)
    await page.getByTestId('changelog-button').click()

    const dialog = page.getByTestId('changelog-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Что нового' })).toBeVisible()
    await expect(dialog.getByTestId('changelog-release').first()).toBeVisible()
    // Ссылки на коммиты и номера разделов мастеру не показываются.
    await expect(dialog).not.toContainText('§')
    await expect(dialog).not.toContainText('](')

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
}

test('диалог закрывается крестиком и кликом по подложке', async ({ page }) => {
  await page.goto('./toe-band/')
  const dialog = page.getByTestId('changelog-dialog')

  await page.getByTestId('changelog-button').click()
  await page.getByTestId('changelog-close').click()
  await expect(dialog).toBeHidden()

  await page.getByTestId('changelog-button').click()
  await page.mouse.click(5, 5)
  await expect(dialog).toBeHidden()
})

test('плашка прогресса не закрывает подвал, долистанный до конца', async ({ page }) => {
  await page.goto('./toe-band/')
  await page.getByTestId('app-footer').scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

  const footer = await page.getByTestId('app-footer').boundingBox()
  const dock = await page.getByTestId('bottom-dock').boundingBox()
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(dock!.y)
})
