import { expect, test } from '@playwright/test'

// Скриншотный проект: в CI не гоняется, базлайны снимает мастер у себя.
test('страница на прибитом вьюпорте', async ({ page }) => {
  await page.goto('./')
  await expect(page).toHaveScreenshot('page.png', { fullPage: true })
})
