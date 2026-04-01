import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 🔥 Заодно добавляем это, чтобы больше не писать --host в консоли
    allowedHosts: [
      'bathless-unbalkingly-horacio.ngrok-free.dev' // 🔥 Разрешаем твой туннель
    ],
    proxy: {
      // Вот это правило перенаправит ВЕСЬ /api на бэкенд!
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    }
  }
});