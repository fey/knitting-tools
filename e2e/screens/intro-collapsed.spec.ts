import { expect, test } from '@playwright/test'

// Скриншотный проект: в CI не гоняется, базлайн снимает мастер у себя.
// §12.2, пункт 6: свёрнутая вводка — состояние экрана, которого нет ни на одном
// другом базлайне. `page.png` снят на развёрнутой вводке, обе схемные картинки
// кадрируют саму схему, — а первый экран со свёрнутой вводкой выглядит иначе
// целиком: строка-кнопка на месте трёх абзацев поднимает ручки расчёта наверх.
//
// Свёрнутость ставится записью в `localStorage` заранее, а не кликом: так снимок
// показывает страницу ровно такой, какой её видит вернувшийся мастер (§6.1), без
// промежуточного кадра с развёрнутой вводкой.
test('первый экран со свёрнутой вводкой', async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: 'knitting-tools:intro-collapsed', value: 'collapsed' },
  )
  await page.goto('./toe-band/')

  await expect(page.getByTestId('intro-expand')).toHaveText('Показать инструкцию')
  await expect(page).toHaveScreenshot('intro-collapsed.png', { fullPage: true })
})
