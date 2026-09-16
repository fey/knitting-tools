import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ShareButton from './calculators/toe/components/ShareButton.vue'

createApp(App).mount('#app')

/**
 * «Поделиться» (тикет #8) — собственный корень страницы, не блок `App.vue`.
 * Соседняя ветка сейчас правит оболочку и блоки экрана (`SummaryPanel.vue` и
 * другие), а спека места для кнопки не называет: чтобы не задевать `App.vue`,
 * кнопка монтируется вторым, независимым деревом Vue прямо в `<body>`.
 *
 * `position: fixed` в самой кнопке (не место в потоке) — не только чтобы не
 * зависеть от разметки `App.vue`, а по существу: подпись починки поля (§9.2)
 * вставляется **над** кнопкой, если та стоит в потоке страницы, и сдвигает её
 * между `mousedown` (блюр поля синхронно вставляет подпись) и `mouseup` того же
 * клика — клик промахивается мимо. `fixed` не сдвигается никогда.
 */
const shareHost = document.createElement('div')
document.body.appendChild(shareHost)
createApp(ShareButton).mount(shareHost)
