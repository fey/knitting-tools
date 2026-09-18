import { expect, test, type Page } from '@playwright/test'

/**
 * Обратная связь (тикет #24, §6.4, §10.2, §11).
 *
 * Здесь всё, что живёт только в DOM (§12.2): диалог и его закрытие, счётчик и потолок,
 * черновик в `localStorage`, непрозрачный ответ Google и сетевой отказ.
 *
 * **К настоящей форме спеки не ходят никогда.** Ссылка на форму в `webServer` заведомо
 * ненастоящая, а сам запрос перехватывается `page.route`: иначе таблица ответов
 * заполнялась бы мусором на каждый прогон CI.
 */

const FORM_URL = '**/formResponse'

/** Перехват отправки. Возвращает тела ушедших запросов — их и проверяем. */
async function interceptSend(page: Page, outcome: 'ok' | 'offline' = 'ok'): Promise<string[]> {
  const bodies: string[] = []
  await page.route(FORM_URL, async (route) => {
    bodies.push(route.request().postData() ?? '')
    if (outcome === 'offline') await route.abort('internetdisconnected')
    else await route.fulfill({ status: 200, body: '' })
  })
  return bodies
}

async function openDialog(page: Page): Promise<void> {
  await page.getByTestId('feedback-button').click()
  await expect(page.getByTestId('feedback-dialog')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('кнопка стоит в шапке и открывает диалог', async ({ page }) => {
  const button = page.getByTestId('feedback-button')
  await expect(button).toBeVisible()

  // Шапка — над заголовком, кнопки к расчёту не относятся (§6.4).
  const header = await page.getByTestId('app-header').boundingBox()
  const title = await page.getByRole('heading', { name: 'Калькулятор мыска носка' }).boundingBox()
  expect(header!.y + header!.height).toBeLessThanOrEqual(title!.y)

  await openDialog(page)
  await expect(page.getByTestId('feedback-counter')).toHaveText('осталось 500')
})

test('две кнопки в шапке не выталкивают страницу за экран телефона', async ({ page }) => {
  // Замеры §6.4: 358 px под содержимое, «Поделиться» 115 и «Оставить отзыв» 143.
  // Распухшая «Ссылка скопирована» доводит худший случай до 332 — влезает, а на более
  // узком экране ряд переносится вместо горизонтальной прокрутки.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

test('пустое сообщение и перебор гасят «Отправить», ввод при этом не режется', async ({ page }) => {
  await openDialog(page)
  const send = page.getByTestId('feedback-send')
  await expect(send).toBeDisabled()

  await page.getByTestId('feedback-message').fill('схема врёт на 84 петлях')
  await expect(send).toBeEnabled()
  await expect(page.getByTestId('feedback-counter')).toHaveText('осталось 477')

  // 634 символа: ввод остаётся целым, гаснет кнопка. Жёсткий maxlength молча
  // обрезал бы вставленный текст, и мастер об этом не узнал бы.
  const long = 'я'.repeat(634)
  await page.getByTestId('feedback-message').fill(long)
  await expect(page.getByTestId('feedback-message')).toHaveValue(long)
  await expect(page.getByTestId('feedback-counter')).toHaveText('на 134 больше, чем влезает')
  await expect(send).toBeDisabled()
})

test('закрывают Esc, крестик и клик по подложке — сразу, без подтверждения', async ({ page }) => {
  const dialog = page.getByTestId('feedback-dialog')

  await openDialog(page)
  await page.getByTestId('feedback-message').fill('написанное терять не страшно')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await openDialog(page)
  await page.getByTestId('feedback-close').click()
  await expect(dialog).toBeHidden()

  await openDialog(page)
  // Клик по подложке: мимо диалога, в самый верх экрана.
  await page.mouse.click(195, 10)
  await expect(dialog).toBeHidden()
})

test('черновик переживает закрытие и перезагрузку (§10.2)', async ({ page }) => {
  await openDialog(page)
  await page.getByTestId('feedback-message').fill('схема врёт на 84 петлях')
  await page.getByTestId('feedback-contact').fill('почта для ответа')
  await page.getByTestId('feedback-close').click()

  await openDialog(page)
  await expect(page.getByTestId('feedback-message')).toHaveValue('схема врёт на 84 петлях')

  await page.reload()
  await openDialog(page)
  await expect(page.getByTestId('feedback-message')).toHaveValue('схема врёт на 84 петлях')
  await expect(page.getByTestId('feedback-contact')).toHaveValue('почта для ответа')
})

test('черновик не привязан к расчёту: кручение петель его не сбрасывает', async ({ page }) => {
  await openDialog(page)
  await page.getByTestId('feedback-message').fill('черновик переживает смену расчёта')
  await page.getByTestId('feedback-close').click()

  await page.getByTestId('final-stitches').fill('16')
  await page.getByTestId('final-stitches').blur()

  await openDialog(page)
  await expect(page.getByTestId('feedback-message')).toHaveValue('черновик переживает смену расчёта')
})

test('отправка уносит сообщение, контакт и полную ссылку на расчёт', async ({ page }) => {
  const bodies = await interceptSend(page)

  await openDialog(page)
  await page.getByTestId('feedback-message').fill('схема врёт на 84 петлях')
  await page.getByTestId('feedback-contact').fill('почта для ответа')
  await page.getByTestId('feedback-send').click()

  await expect(page.getByTestId('feedback-thanks')).toHaveText('Спасибо!')
  expect(bodies).toHaveLength(1)
  expect(bodies[0]).toContain('схема врёт на 84 петлях')
  expect(bodies[0]).toContain('почта для ответа')
  // Полным адресом, а не голым hash: по ссылке кликают прямо из таблицы ответов.
  expect(bodies[0]).toContain('/knitting-tools/#s=60&e=20&k=1&r=even')

  // Черновик стёрт: отправленное больше не всплывает.
  await page.getByTestId('feedback-done').click()
  await page.reload()
  await openDialog(page)
  await expect(page.getByTestId('feedback-message')).toHaveValue('')
  await expect(page.getByTestId('feedback-contact')).toHaveValue('')
})

test('сетевой отказ говорит прямо, а написанное остаётся целым', async ({ page }) => {
  await interceptSend(page, 'offline')

  await openDialog(page)
  await page.getByTestId('feedback-message').fill('этот текст терять нельзя')
  await page.getByTestId('feedback-send').click()

  await expect(page.getByTestId('feedback-error')).toHaveText('Не отправилось, проверь связь')
  await expect(page.getByTestId('feedback-message')).toHaveValue('этот текст терять нельзя')
  // Правка снимает отметку отказа: человек дописывает и пробует снова.
  await page.getByTestId('feedback-message').fill('этот текст терять нельзя, правда')
  await expect(page.getByTestId('feedback-error')).toHaveCount(0)
})
