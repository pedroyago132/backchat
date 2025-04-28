import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyBfjrD4DDMz2ucwLvdxf3-6K98514ZaSdw",
    authDomain: "app-project-farmatical.firebaseapp.com",
    databaseURL: "https://app-project-farmatical-default-rtdb.firebaseio.com",
    projectId: "app-project-farmatical",
    storageBucket: "app-project-farmatical.appspot.com",
    messagingSenderId: "264403208467",
    appId: "1:264403208467:web:a7fb74ed3c6c7998eff2e6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, get };