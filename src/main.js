import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './pages/Home.vue'
import Leaderboard from './pages/Leaderboard.vue'
import EvalViewer from './pages/EvalViewer.vue'
import SubmitPolicy from './pages/SubmitPolicy.vue'
import JoinEvaluator from './pages/JoinEvaluator.vue'
import './styles/base.css'

const routes = [
  { path: '/', component: Home },
  { path: '/leaderboard', component: Leaderboard },
  { path: '/evals', component: EvalViewer },
  { path: '/submit', component: SubmitPolicy },
  { path: '/join', component: JoinEvaluator },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

createApp(App).use(router).mount('#app')
