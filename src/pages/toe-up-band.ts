/** Вход калькулятора ленточного мыска от мыска — подстраница `/toe-up-band/` (§11 спеки toe-up). */
import { createApp } from 'vue'
import '../style.css'
import ToeCalculatorPage from '../calculators/toe/components/ToeCalculatorPage.vue'

createApp(ToeCalculatorPage, { direction: 'toe-up' }).mount('#app')
