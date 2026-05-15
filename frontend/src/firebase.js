import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBB7k-Kgh_NtLnaKukojIh8H0e66RHoozw",
  authDomain: "leads-tracker-d3d96.firebaseapp.com",
  projectId: "leads-tracker-d3d96",
  storageBucket: "leads-tracker-d3d96.firebasestorage.app",
  messagingSenderId: "1088493984829",
  appId: "1:1088493984829:web:d4586041232e6be0021e54",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
