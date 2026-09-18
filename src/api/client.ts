import axios from 'axios'

// contracts/contract.md 7절: 프론트는 백엔드와 같은 origin으로 호출해야 한다.
// baseURL을 비워 상대경로로 요청하고, 개발 중에는 vite.config.ts의 서버 프록시가
// VITE_API_URL로 전달한다. 배포 시에는 같은 origin에서 서빙하거나 리버스 프록시로 맞춘다.
export const apiClient = axios.create({
  baseURL: '',
})
