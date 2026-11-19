/** Вход калькулятора ленточного мыска от манжеты — подстраница `/toe-band/` (§11). */
import { createApp } from 'vue'
import '../style.css'
import ToeCalculatorPage from '../calculators/toe/components/ToeCalculatorPage.vue'

createApp(ToeCalculatorPage, { direction: 'cuff-down' }).mount('#app')
