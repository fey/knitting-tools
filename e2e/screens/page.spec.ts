import { expect, test } from '@playwright/test'

// Скриншотный проект: в CI не гоняется, базлайны снимает мастер у себя.
test('страница на прибитом вьюпорте', async ({ page }) => {
  await page.goto('./toe-band/')
  // Номер версии в подвале меняет каждый релиз — без маски базлайн краснел бы на нём.
  await expect(page).toHaveScreenshot('page.png', {
    fullPage: true,
    mask: [page.getByTestId('app-version')],
  })
})
