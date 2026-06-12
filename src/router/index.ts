import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import OAuthCallbackView from '@/views/OAuthCallbackView.vue'
import HistoryView from '@/views/HistoryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/' , component: HomeView },
    { path: '/history', component: HistoryView },
    { path: '/login', component: LoginView },
    { path: '/oauth/callback', component: OAuthCallbackView },
  ],
})


export default router
