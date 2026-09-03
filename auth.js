/* ==========================================================================
   [AUTH GATE] 구글 로그인 + 본인 이메일 제한
   - 클라이언트 게이트는 UX 차원의 1차 방어선일 뿐이며,
     실제 데이터 보호는 Firebase 콘솔의 Firestore 보안 규칙이 담당한다.
   ========================================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyAI5ZHYd_Mi7JogsgZAYsBERsbPMD5m544",
    authDomain: "wwjd-hub.firebaseapp.com",
    projectId: "wwjd-hub",
    storageBucket: "wwjd-hub.firebasestorage.app",
    messagingSenderId: "518785715153",
    appId: "1:518785715153:web:2fd76cfe4a1aabd6bd2ef0",
    measurementId: "G-FCN8CSHR7Y"
};
firebase.initializeApp(firebaseConfig);

const ALLOWED_EMAIL = 'imyooeun0107@gmail.com';
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

function showAuthGate(message) {
    const gate = document.getElementById('auth-gate');
    if (gate) gate.classList.add('show');
    const msgEl = document.getElementById('auth-gate-message');
    if (msgEl) msgEl.innerText = message || '';
}

function hideAuthGate() {
    const gate = document.getElementById('auth-gate');
    if (gate) gate.classList.remove('show');
    playEntranceAnimation();
}

let entrancePlayed = false;
function playEntranceAnimation() {
    if (entrancePlayed) return;
    entrancePlayed = true;
    document.body.classList.add('app-entrance');
    setTimeout(() => document.body.classList.remove('app-entrance'), 1200);
}

function loginWithGoogle() {
    showAuthGate('로그인 중...');
    auth.signInWithPopup(googleProvider).catch((err) => {
        showAuthGate('로그인 실패: ' + err.message);
    });
}

function logout() {
    auth.signOut();
}

auth.onAuthStateChanged((user) => {
    if (user && user.email === ALLOWED_EMAIL) {
        hideAuthGate();
        if (typeof startCloudSync === 'function') startCloudSync();
    } else if (user) {
        showAuthGate('권한이 없는 계정입니다 (' + user.email + ')');
        auth.signOut();
    } else {
        showAuthGate();
    }
});
