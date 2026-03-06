import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Electron에서 로컬 파일(index.html)을 정상적으로 로드하기 위한 절대 경로 설정
  base: './', 
  
  optimizeDeps: {
    // 🚨 핵심 수복 1: Vite가 Electron 등 데스크톱 전용 모듈을 웹용으로 변환 시도하는 것을 강제 차단
    exclude: ['electron']
  },
  
  build: {
    target: 'esnext',
    // 쓸데없는 용량 경고(Warning) 무시
    chunkSizeWarningLimit: 2000, 
    rollupOptions: {
      // 🚨 핵심 수복 2: Node.js 코어 모듈들을 번들링에서 완전히 제외 (앱 런타임에서 직접 해석하도록 넘김)
      external: [
        'electron',
        'fs',
        'path',
        'crypto',
        'os',
        'util',
        'stream',
        'buffer',
        'url',
        'events',
        'child_process',
        'http',
        'https',
        /^node:.*/
      ]
    }
  }
})