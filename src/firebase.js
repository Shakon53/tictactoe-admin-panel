import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAHknIbfrr-r0eCEXHe8m2MaVEn9lyCFqI",
  authDomain: "tictactoeonline-9f22d.firebaseapp.com",
  projectId: "tictactoeonline-9f22d",
  storageBucket: "tictactoeonline-9f22d.firebasestorage.app",
  messagingSenderId: "393710011074",
  appId: "1:393710011074:android:placeholder"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
