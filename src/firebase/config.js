// Firebase 설정 파일
// 실제 사용 시 본인의 Firebase 프로젝트 설정으로 교체해주세요
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 콘솔(https://console.firebase.google.com)에서 발급받은 본인의 설정으로 교체하세요
const firebaseConfig = {
  apiKey: "AIzaSyAt1or07-DYZdBBXFgZCR_ydPud35yEiRs",
  authDomain: "webapp-57951.firebaseapp.com",
  projectId: "webapp-57951",
  storageBucket: "webapp-57951.firebasestorage.app",
  messagingSenderId: "564672720179",
  appId: "1:564672720179:web:6207fa0bfc2c7801dba246",
  measurementId: "G-SED0WXJZHK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
