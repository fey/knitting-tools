import { expect, test } from '@playwright/test'

// Скриншотный проект: в CI не гоняется, базлайн снимает мастер у себя.
// §12.2, пункт 6: прокрутка при открытии встала на текущий ряд — ни одна из двух
// базовых схем (toe-chart.png, page.png) не отмечена, поэтому шторка (затенение
// связанного, контур текущего ряда) и разовая прокрутка к нему не сфотографированы
// нигде, кроме этого файла.
//
// 140 → 16, через ряд: N = 31, 61 ряд — заведомо длиннее экрана, поэтому разовая
// прокрутка страницы при открытии обязана сработать. `localStorage`
// заполняется совпадающим `paramsKey` заранее: страница восстанавливает ряд молча,
// без клика по плашке, — так же, как выглядела бы страница после возврата.
test('схема мыска с отмеченным прогрессом — шторка и прокрутка к текущему ряду', async ({ page }) => {
  const hash = '#s=140&e=16&k=1&r=even'
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: 'knitting-tools:toe-progress', value: JSON.stringify({ paramsKey: hash.slice(1), row: 20 }) },
  )
  await page.goto(`./${hash}`)

  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 21 из 61')
  await expect(page.getByTestId('toe-chart')).toHaveScreenshot('toe-chart-progress.png')
})
