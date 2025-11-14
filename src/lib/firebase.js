// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider // 👈 Apple 로그인을 위해 추가
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; // 👈 Firestore를 위해 추가

// 🔑 (이 부분은 나중에 꼭 재설정 하시고, 공유하지 마세요!)
const firebaseConfig = {
  apiKey: "AIzaSyDbp-DUiinfGqg2bMc-CCwfILawDAvkHWU",
  authDomain: "cy-mini.vercel.app",
  projectId: "hayul02",
  storageBucket: "hayul02.firebasestorage.app",
  messagingSenderId: "1041189249093",
  appId: "1:1041189249093:web:c9dae8d90504dd5f4cc32c",
  measurementId: "G-54VN7MFMCB"
};

const app = initializeApp(firebaseConfig);

// Auth (인증)
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com'); // 👈 Apple 프로바이더 추가

// Storage (파일 저장소)
export const storage = getStorage(app);

// Firestore (데이터베이스)
export const db = getFirestore(app); // 👈 db export 추가