import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1JdWctwTTA-NE5gxvtKMh47Y31UH3jtw",
  authDomain: "skylish-fluency.firebaseapp.com",
  projectId: "skylish-fluency",
  storageBucket: "skylish-fluency.firebasestorage.app",
  messagingSenderId: "225264323790",
  appId: "1:225264323790:web:f3f20a8165562e835f549f",
  measurementId: "G-8PZKWET5NW"
};

const TEACHER_EMAIL = "biielcooperwinx@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await setPersistence(auth, browserLocalPersistence);

function friendlyError(error) {
  const code = error?.code || "";
  const messages = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/invalid-email": "Digite um e-mail válido.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/missing-password": "Digite sua senha.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente novamente.",
    "auth/network-request-failed": "Falha de conexão. Confira sua internet."
  };
  return messages[code] || "Não foi possível concluir. Tente novamente.";
}

async function getProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function ensureProfile(user, name = "") {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  const email = (user.email || "").toLowerCase();
  const role = email === TEACHER_EMAIL ? "teacher" : "student";
  const profile = {
    name: name || user.displayName || email.split("@")[0],
    email,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, profile);
  return { id: user.uid, ...profile };
}

async function signup(name, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
  const profile = await ensureProfile(credential.user, name.trim());
  return { user: credential.user, profile };
}

async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const profile = await ensureProfile(credential.user);
  return { user: credential.user, profile };
}

async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

async function logout() {
  await signOut(auth);
}

async function loadContent() {
  const [lessonSnap, postSnap, commentSnap] = await Promise.all([
    getDocs(collection(db, "lessons")),
    getDocs(collection(db, "posts")),
    getDocs(collection(db, "comments"))
  ]);

  const lessons = {};
  const deletedLessons = [];
  lessonSnap.forEach(s => {
    const data = { id: s.id, ...s.data() };
    if (data.deleted) deletedLessons.push(s.id);
    else lessons[s.id] = data;
  });

  const posts = [];
  postSnap.forEach(s => posts.push({ id: s.id, ...s.data() }));

  const comments = {};
  commentSnap.forEach(s => {
    const data = s.data();
    comments[s.id] = data.message || "";
  });

  return { lessons, deletedLessons, posts, comments };
}

async function saveLesson(lesson) {
  const id = lesson.id || `custom-${Date.now()}`;
  await setDoc(doc(db, "lessons", id), {
    ...lesson,
    id,
    deleted: false,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return id;
}

async function removeLesson(id, isDefault) {
  if (isDefault) {
    await setDoc(doc(db, "lessons", id), {
      id,
      deleted: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } else {
    await deleteDoc(doc(db, "lessons", id));
  }
  await deleteDoc(doc(db, "comments", id)).catch(() => {});
}

async function savePost(post) {
  const id = post.id || `post-${Date.now()}`;
  await setDoc(doc(db, "posts", id), {
    ...post,
    id,
    published: post.published !== false,
    createdAtMs: post.createdAtMs || Date.now(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  return id;
}

async function removePost(id) {
  await deleteDoc(doc(db, "posts", id));
}

async function saveComment(lessonId, message) {
  const ref = doc(db, "comments", lessonId);
  if (!message.trim()) {
    await deleteDoc(ref);
    return;
  }
  await setDoc(ref, {
    lessonId,
    message: message.trim(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function loadProgress(uid) {
  const snap = await getDocs(collection(db, "users", uid, "progress"));
  const progress = {};
  snap.forEach(s => progress[s.id] = !!s.data().completed);
  return progress;
}

async function setProgress(uid, lessonId, completed) {
  await setDoc(doc(db, "users", uid, "progress", lessonId), {
    completed: !!completed,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function listStudents() {
  const snap = await getDocs(collection(db, "users"));
  const students = [];
  snap.forEach(s => {
    const data = { id: s.id, ...s.data() };
    if (data.role !== "teacher") students.push(data);
  });
  return students;
}

window.firebaseApi = {
  auth,
  db,
  TEACHER_EMAIL,
  friendlyError,
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
  getProfile,
  ensureProfile,
  signup,
  login,
  resetPassword,
  logout,
  loadContent,
  saveLesson,
  removeLesson,
  savePost,
  removePost,
  saveComment,
  loadProgress,
  setProgress,
  listStudents
};

window.dispatchEvent(new Event("firebase-ready"));
