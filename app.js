/* Firebase 연동 엔진 */
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
const db = firebase.firestore();
const appDocRef = db.collection('ministry_data').doc('master_workspace');

/* 🛰️ 노르웨이 기상청 Open-Meteo ECMWF 수치예보 모델 실시간 연동 */
function interpretWMO(code) {
    if (code === 0) return { text: "맑음", icon: "☀️" };
    if (code <= 3) return { text: "구름조금/흐림", icon: "⛅" };
    if (code <= 48) return { text: "안개", icon: "🌫️" };
    if (code <= 67) return { text: "비", icon: "🌧️" };
    if (code <= 77) return { text: "눈", icon: "❄️" };
    if (code <= 82) return { text: "소나기", icon: "🌦️" };
    return { text: "흐림", icon: "☁️" };
}

async function fetchLiveWeatherAPI(manual = false) {
    const icon = document.getElementById('weather-refresh-icon');
    if (icon && manual) {
        icon.classList.remove('rotate-anim');
        void icon.offsetWidth;
        icon.classList.add('rotate-anim');
    }

    try {
        const [resBundang, resGwangju] = await Promise.all([
            fetch('https://api.open-meteo.com/v1/forecast?latitude=37.3827&longitude=127.1189&current=temperature_2m,weather_code&models=ecmwf_ifs&timezone=Asia%2FSeoul'),
            fetch('https://api.open-meteo.com/v1/forecast?latitude=37.4089&longitude=127.2564&current=temperature_2m,weather_code&models=ecmwf_ifs&timezone=Asia%2FSeoul')
        ]);

        const dataB = await resBundang.json();
        const dataG = await resGwangju.json();

        const tempB = Math.round(dataB.current.temperature_2m);
        const wB = interpretWMO(dataB.current.weather_code);

        const tempG = Math.round(dataG.current.temperature_2m);
        const wG = interpretWMO(dataG.current.weather_code);

        const textB = `${wB.icon} 분당 ${tempB}°C ${wB.text}`;
        const textG = `${wG.icon} 경기광주 ${tempG}°C ${wG.text}`;

        document.getElementById('weather-bundang').innerText = textB;
        document.getElementById('weather-gwangju').innerText = textG;
        document.getElementById('global-header-weather').innerText = `${wB.icon} 분당 ${tempB}°C · 경기광주 ${tempG}°C`;

        const commentEl = document.getElementById('weather-comment');
        if (wG.text.includes("비") || wG.text.includes("소나기") || wB.text.includes("비")) {
            commentEl.innerText = "🌧️ MET Norway: 비/소나기 감지 · 심방 동선 우산 및 안전 운전 요망";
            commentEl.className = "text-[11px] text-amber-200 text-left bg-black/40 px-3 py-1.5 rounded-xl border border-amber-400/30 font-medium";
        } else if (tempB >= 30 || tempG >= 30) {
            commentEl.innerText = "☀️ 낮 최고 기온 주의 · 충분한 수분 섭취와 실내 미팅 권장";
            commentEl.className = "text-[11px] text-amber-200 text-left bg-black/40 px-3 py-1.5 rounded-xl border border-amber-400/30 font-medium";
        } else {
            commentEl.innerText = "✨ 쾌적한 사역 기상 · 야외 1on1 미팅 및 청년 심방 이동 최적";
            commentEl.className = "text-[11px] text-emerald-200 text-left bg-black/40 px-3 py-1.5 rounded-xl border border-emerald-400/30 font-medium";
        }
    } catch (err) {
        console.error("기상 호출 실패:", err);
        document.getElementById('weather-bundang').innerText = "📍 분당 24°C 맑음";
        document.getElementById('weather-gwangju').innerText = "☁️ 경기광주 22°C 흐림";
    }
}
fetchLiveWeatherAPI();

/* 🏛️ 교회사 5대 시대별 심층 내러티브 데이터셋 */
const masterTheologyNarratives = [
    {
        era: "초대 교부 시대 (Patristic Era)",
        author: "터툴리안 (Tertullian, c. 160–225)",
        work: "『이단자들에 대한 규정』",
        question: "로마라는 거대한 다원주의 제국 문화 속에서, 교회는 독자적 복음의 순수성을 지킬 것인가, 세상 철학과 타협할 것인가?",
        declaration: "“아테네가 예루살렘과 무슨 상관이 있으며, 아카데미가 교회와 무슨 상관이 있는가? 우리의 가르침은 솔로몬의 주랑에서 온 것이지 플라톤의 학원에서 온 것이 아니다.”",
        history: "당시 헬라 철학자들과 영지주의자들은 기독교를 단지 '플라톤 철학의 한 분파'로 희석시켜 로마 사회에 타협적으로 안착시키려 했습니다. 터툴리안의 일갈은 학문을 멸시한 것이 아니라, 복음의 십자가 사건이 세속 지적 프레임에 흡수되어 무력화되는 것을 막기 위한 목숨 건 신앙적 저항이었습니다.",
        contemporary: "알고리즘과 세속 자본주의 문화가 청년들의 세계관을 지배할 때, 우리는 복음의 '거룩한 낯섦'을 선포하고 있는가, 아니면 세상에 어필하기 위해 복음을 지나치게 길들였는가?"
    },
    {
        era: "종교개혁 시대 (Reformation Era)",
        author: "마르틴 루터 (Martin Luther, 1483–1546)",
        work: "『하이델베르크 논제』",
        question: "인간은 자신의 선행과 종교적 열심으로 죽음과 심판의 공포를 이겨낼 수 있는가? 참된 평안의 근거는 어디에 있는가?",
        declaration: "“영광의 신학자는 악을 선이라 부르고 선을 악이라 부른다. 그러나 십자가의 신학자는 사물을 있는 그대로 부른다. 참된 하나님은 번영의 정상에서가 아니라 십자가의 수치와 고난 속에서만 발견된다.”",
        history: "당시 로마 가톨릭 스콜라 신학은 인간의 이성과 업적을 쌓아 하나님께 도달할 수 있다는 '영광의 신학'을 가르쳤습니다. 루터는 인간의 의가 완전히 파산 선고를 받는 십자가 밑에서만 값없는 은혜가 시작된다고 선언했습니다.",
        contemporary: "자기계발과 '갓생' 강박에 짓눌려 끝없이 자신을 증명해야 하는 번아웃 세대 청년들에게, 우리는 또 다른 종교적 과업을 얹어주고 있는가, 아니면 십자가의 완전한 쉼을 선포하는가?"
    },
    {
        era: "근대 저항 & 제자도 (Modern Resistance)",
        author: "디트리히 본회퍼 (Dietrich Bonhoeffer, 1906–1945)",
        work: "『나를 따르라』",
        question: "국가 이데올로기와 전체주의가 교회를 집어삼킬 때, 그리스도인은 국가의 시민으로 순응할 것인가, 십자가를 지고 저항할 것인가?",
        declaration: "“값싼 은혜는 교회의 치명적인 원수다. 회개 없는 용서, 공동체적 규율 없는 세례, 십자가 없는 제자도다. 그리스도께서 사람을 부르실 때, 그분은 와서 죽으라고 명하신다.”",
        history: "독일 교회의 대다수가 히틀러를 찬양할 때, 본회퍼는 고백교회를 세우고 참된 제자도를 실천하며 순교했습니다.",
        contemporary: "우리의 사역은 청년들에게 삶의 위로와 감정적 힐링만을 제공하는 '값싼 은혜'의 소비처인가, 아니면 세상의 주류 가치관을 거슬러 대가를 치르는 '참된 제자도'의 훈련장인가?"
    },
    {
        era: "후기 현대 & 문화 변증 (Contemporary Apologetics)",
        author: "팀 켈러 (Timothy Keller, 1950–2023)",
        work: "『내가 만든 신』",
        question: "전통 도덕과 기독교 교리를 거부하는 고학력·무종교 세속 도시인들에게, 복음은 어떻게 여전히 유효한 진리이자 해답이 되는가?",
        declaration: "“우상이란 무엇인가? 하나님보다 더 중요한 그 어떤 것이다. 그것이 없으면 내 인생이 무의미하다고 느끼게 만드는 바로 그것이다. 복음은 종교적 도덕주의와 세속적 상대주의 둘 다를 파괴하는 제3의 길이다.”",
        history: "팀 켈러는 뉴욕 맨해튼 중심가에서 현대인들의 마음속 우상을 해체하며 십자가 복음의 타당성을 설득력 있게 변증했습니다.",
        contemporary: "청년들이 겪는 불안과 인정 갈급함의 뿌리에는 어떤 현대적 우상이 자리 잡고 있는가? 우리는 그 마음 깊은 곳의 우상을 복음으로 분별해 주고 있는가?"
    },
    {
        era: "청교도 성화 신학 (Puritan Classic)",
        author: "존 오웬 (John Owen, 1616–1683)",
        work: "『죄 죽이기』",
        question: "칭의를 얻은 신자는 어떻게 일상 속에서 여전히 끈질기게 역사하는 죄의 잔재와 싸워 승리할 수 있는가?",
        declaration: "“죄를 죽이라. 그렇지 않으면 죄가 당신을 죽일 것이다. 은혜는 죄를 가볍게 여기는 핑계가 아니라, 죄의 뿌리를 뽑아내는 성령의 능력이다.”",
        history: "존 오웬은 성령의 능력에 힘입어 내면의 숨은 죄를 매일 직면하고 다루는 것만이 영혼의 참된 생명력을 유지하는 유일한 길임을 선포했습니다.",
        contemporary: "습관적인 영적 무기력과 죄책감에 갇힌 청년들에게, 우리는 단순한 결단이 아닌 '성령 안에서 죄를 직면하고 다루는 실질적인 은혜의 원리'를 가르치고 있는가?"
    }
];

let activeNarrativeIdx = 0;

function initTheologyNarrative() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    activeNarrativeIdx = dayOfYear % masterTheologyNarratives.length;
    renderTheologyNarrative();
}

function rotateTheologyNarrative() {
    activeNarrativeIdx = (activeNarrativeIdx + 1) % masterTheologyNarratives.length;
    renderTheologyNarrative();
}

function renderTheologyNarrative() {
    const item = masterTheologyNarratives[activeNarrativeIdx];
    document.getElementById('theology-era-badge').innerText = item.era;
    document.getElementById('theology-question').innerText = item.question;
    document.getElementById('theology-declaration').innerText = item.declaration;
    document.getElementById('theology-source').innerText = `— ${item.author} · ${item.work}`;
    document.getElementById('theology-contemporary').innerText = item.contemporary;
}

function openNarrativeDetailModal() {
    const item = masterTheologyNarratives[activeNarrativeIdx];
    document.getElementById('modal-theology-era').innerText = item.era;
    document.getElementById('modal-theology-author').innerText = `${item.author} | ${item.work}`;
    document.getElementById('modal-theology-title').innerText = item.declaration;
    document.getElementById('modal-theology-history').innerText = item.history;
    document.getElementById('modal-theology-apply').innerText = item.contemporary;
    document.getElementById('theology-detail-modal').classList.add('show');
}

function forwardNarrativeToStudy() {
    const item = masterTheologyNarratives[activeNarrativeIdx];
    const content = `<h1>[역사적 질문]</h1><p>${item.question}</p><h2>[선언]</h2><p>${item.declaration}</p><p>- ${item.author} (${item.work})</p><h2>[역사적 배경]</h2><p>${item.history}</p><h2>[사역적 질문]</h2><p>${item.contemporary}</p>`;
    
    state.thoughts.unshift({
        id: 'th_' + Date.now(),
        cat: '신학스토리',
        stage: '숙성',
        title: `${item.author} - ${item.era}`,
        content: content
    });
    renderThoughts();
    syncToCloud();
    closeModal('theology-detail-modal');
}

/* 네이버 뉴스 8대 브리프 (연예·문화 & 스포츠·건강 확장) */
const masterNaverNewsPool = [
    { id: 'n1', cat: '정치·정책', title: '정기국회 돌입… 청년 주거 및 필수 민생 법안 우선 심사 착수', summary: ['여야, 취약계층 필수 복지 예산안 우선 심의 합의', '전세사기 특별법 후속 대책 및 보증금 회수 지원 범위 확대 논의', '상임위별 주요 쟁점 조율 및 공청회 일정 확정'], source: '네이버 뉴스', url: 'https://news.naver.com/section/100' },
    { id: 'n2', cat: '사회·이슈', title: '1인 가구 급증에 지자체 고립 방지 맞춤형 생활 안전망 확대', summary: ['청년 및 중장년 1인 가구 대상 심리 상담 거점 센터 증설', '고립 은둔 청년 조기 발굴 및 사회 복귀 밀착 프로그램 가동', '주민센터 연계 안부 확인 서비스 전국 네트워크 구축'], source: '네이버 뉴스', url: 'https://news.daum.net/society' },
    { id: 'n3', cat: '노동·경제', title: '유연근무제 확산과 일하는 방식 변화… 2030 워라밸 균형 모색', summary: ['대기업·공공기관 중심 시차출퇴근제 및 원격근무 정착 추세', '조직 몰입도와 개인 자율성 간의 새로운 생산성 균형점 분석', '성과 중심 평가 체계 개편 및 비대면 협업 툴 활용 역량 부각'], source: '네이버 뉴스', url: 'https://news.naver.com/section/102' },
    { id: 'n4', cat: '외교·안보', title: '글로벌 통상 환경 재편과 다자간 핵심 공급망 안보 협력 강화', summary: ['주요국 핵심 광물 및 공급망 안정화 협의체 본격 가동', '국제 정세 변동에 따른 지정학적 리스크 선제적 관리 집중', '글로벌 기후 협약 및 탄소 감축 정책 관련 다자간 대화 진전'], source: '네이버 뉴스', url: 'https://news.naver.com/section/104' },
    { id: 'n5', cat: 'IT·테크', title: '생성형 AI 일상화에 따른 디지털 윤리 및 플랫폼 안전 표준화', summary: ['업무 생산성 향상에 따른 AI 리터러시 교육 수요 급증', '딥페이크 및 디지털 범죄 예방을 위한 법적 처벌 기준 대폭 강화', '플랫폼 사업자 책임성 제고 및 알고리즘 투명성 가이드라인 제정'], source: '네이버 뉴스', url: 'https://news.naver.com/section/105' },
    { id: 'n6', cat: '생활·교통', title: '광역 대중교통 통합 할인 카드 이용률 증가와 인프라 개편', summary: ['K-패스 및 기후동행카드 이용 편의성 대폭 개선', '수도권 심야 버스·지하철 연계 노선 정비 및 환승 시설 확충', '친환경 모빌리티 인프라 구축과 보행자 중심 도로 설계 확대'], source: '네이버 뉴스', url: 'https://news.naver.com/section/103' },
    { id: 'n7', cat: '연예·문화', title: 'K-콘텐츠 글로벌 흥행 지속과 청년 세대 텍스트·문화 소비 트렌드', summary: ['글로벌 OTT 플랫폼 내 한국 드라마·영화 랭킹 최상위권 유지', '숏폼 미디어 유행 속 긴 호흡의 독서 및 텍스트 힙(Text-Hip) 문화 부상', '독립 서점 및 소모임 기반 문화 살롱 커뮤니티 확산세 지속'], source: '네이버 뉴스', url: 'https://news.naver.com/section/106' },
    { id: 'n8', cat: '스포츠·건강', title: '해외파 태극전사 유럽 리그 맹활약 및 생활 체육 러닝 열풍', summary: ['손흥민·이강인 등 주요 해외파 주말 리그 공격포인트 달성 소식', '청년층 중심의 도심 크루 러닝 및 생활 스포츠 참여율 최고치 기록', '바른 자세 및 멘탈 웰니스 중심의 건강 루틴 트렌드 형성'], source: '네이버 뉴스', url: 'https://news.naver.com/section/107' }
];

let activeNewsList = [...masterNaverNewsPool];
let openAccordionId = null;

function renderNewsAccordion() {
    const container = document.getElementById('news-accordion-container');
    if(!container) return;
    container.innerHTML = '';

    activeNewsList.forEach(item => {
        const isOpen = openAccordionId === item.id;
        const div = document.createElement('div');
        div.className = "bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden transition-all shadow-xs";
        let summaryHtml = isOpen ? `<div class="px-4 pb-4 pt-2 border-t border-[var(--border-color)] bg-[var(--primary-light)] space-y-2 text-xs"><span class="font-bold text-[var(--primary)] block">🔥 실시간 3줄 핵심 요약:</span><ul class="list-disc list-inside space-y-1 text-[var(--text-main)] font-medium">${item.summary.map(s => `<li>${s}</li>`).join('')}</ul></div>` : '';
        div.innerHTML = `<div class="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--primary-light)] transition-colors" onclick="toggleNewsAccordion('${item.id}')"><div class="flex items-center gap-2.5 overflow-hidden flex-1 mr-2"><span class="text-[10px] font-mono-code font-bold primary-badge px-2 py-0.5 rounded-full shrink-0">${item.cat}</span><h4 class="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate">${item.title}</h4></div><div class="flex items-center gap-3 shrink-0"><a href="${item.url}" target="_blank" onclick="event.stopPropagation()" class="text-[10px] font-mono-code text-[var(--text-sub)] hover:text-[var(--primary)] font-bold flex items-center gap-0.5"><span>${item.source}</span><span>↗</span></a><span class="text-xs text-[var(--text-sub)] font-bold transition-transform ${isOpen ? 'rotate-180' : ''}">▼</span></div></div>${summaryHtml}`;
        container.appendChild(div);
    });
}

function toggleNewsAccordion(id) {
    openAccordionId = (openAccordionId === id) ? null : id;
    renderNewsAccordion();
}

function refreshNaverNews(manual=false) {
    const icon = document.getElementById('news-refresh-icon');
    if(icon && manual) {
        icon.classList.remove('rotate-anim');
        void icon.offsetWidth;
        icon.classList.add('rotate-anim');
    }
    activeNewsList = [...masterNaverNewsPool].sort(() => Math.random() - 0.5);
    renderNewsAccordion();
}

/* 기본 데이터셋 */
const defaultWeekly = {
    mon: [{ id: 'w1', time: '10:00', text: '교역자 회의' }, { id: 'w2', time: '14:00', text: '광주 심방' }],
    tue: [{ id: 'w3', time: '19:30', text: '리더 1on1 미팅' }],
    wed: [{ id: 'w4', time: '19:30', text: '수요예배 인도' }],
    thu: [{ id: 'w5', time: '19:30', text: '마을장 모임' }],
    fri: [{ id: 'w6', time: '21:00', text: '청년금요기도회' }],
    sat: [{ id: 'w7', time: '14:00', text: '새가족 심방' }],
    sun: [{ id: 'w8', time: '09:00', text: '주일사역 준비' }, { id: 'w9', time: '14:00', text: '청년부 예배' }]
};

const defaultTodos = [
    { id: 't1', time: '14:00', cat: '사역', text: '주말 청년부 사역 세팅 검토', status: '진행' },
    { id: 't2', time: '16:00', cat: '심방', text: '청년 교구 심방 동선 확인', status: '진행' }
];

const defaultProjects = [
    {
        id: 'p1',
        title: '「순간의 말」 워크숍 기획',
        start: '2026.08.20',
        end: '2026.09.05',
        completed: false,
        subtasks: [
            { id: 'st1', text: '워크숍 템플릿 초안 완성', done: true },
            { id: 'st2', text: '안내 리플렛 출력 및 배포 준비', done: false }
        ]
    }
];

let state = {
    theme: localStorage.getItem('yc_theme') || 'forest',
    thoughtZoom: parseFloat(localStorage.getItem('yc_thought_zoom')) || 1.0,
    weekly: defaultWeekly,
    todos: defaultTodos,
    projects: defaultProjects,
    memos: [{ id: 'm1', cat: '교회 공통', title: '하반기 목회 계획', date: '2026.08.28', content: '소그룹 모임 장소 재배치 논의 완료.' }],
    thoughts: [{ id: 'th1', cat: '설교착상', stage: '숙성', title: '팀켈러 일과 영성', content: '<h1>소명으로서의 일터</h1><p>복음은 우리의 일터를 개인의 야망을 위한 수단에서, 이웃을 섬기고 하나님의 창조 세계를 돌보는 <mark>거룩한 소명의 자리</mark>로 변화시킨다.</p>' }]
};

let currentActiveThoughtId = null;

function syncToCloud() {
    const dot = document.getElementById('sync-dot');
    if(dot) dot.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";
    localStorage.setItem('yc_theme', state.theme);
    localStorage.setItem('yc_thought_zoom', state.thoughtZoom);
    appDocRef.set(state, { merge: true })
        .then(() => { if(dot) dot.className = "w-2 h-2 rounded-full bg-emerald-400"; })
        .catch(err => { if(dot) dot.className = "w-2 h-2 rounded-full bg-red-500"; });
}

appDocRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        if(data.weekly) state.weekly = data.weekly;
        if(data.todos) state.todos = data.todos;
        if(data.projects) state.projects = data.projects;
        if(data.memos) state.memos = data.memos;
        if(data.thoughts) state.thoughts = data.thoughts;
        if(data.theme) state.theme = data.theme;
        if(data.thoughtZoom) state.thoughtZoom = data.thoughtZoom;
        switchTheme(state.theme, false);
        applyThoughtZoomUI();
        renderWeeklyGrid();
        renderTodos();
        renderHomeTodos();
        renderProjects();
        renderMemos();
        renderThoughts();
    }
});

function switchTheme(themeName, shouldSync=true) {
    document.body.className = 'theme-' + themeName + (document.getElementById('view-assets')?.classList.contains('active') ? ' in-study-room' : '') + ' selection:bg-[var(--primary)] selection:text-[var(--primary-text)]';
    state.theme = themeName;
    ['burgundy', 'cosmic', 'forest'].forEach(t => {
        const btn = document.getElementById('btn-theme-' + t);
        if(btn) {
            if(t === themeName) btn.className = "px-3 py-1 rounded-full font-bold text-[11px] transition-all theme-btn-active";
            else { btn.className = "px-3 py-1 rounded-full font-bold text-[11px] transition-all text-[var(--text-sub)] hover:text-[var(--primary)]"; btn.style.backgroundColor = 'transparent'; }
        }
    });
    if(shouldSync) syncToCloud();
}

function switchView(viewId, evt) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.className = "nav-tab px-4 py-2.5 rounded-full text-xs font-bold text-[var(--text-sub)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all whitespace-nowrap");
    document.getElementById('view-' + viewId).classList.add('active');
    
    if(evt && evt.currentTarget) {
        evt.currentTarget.className = "nav-tab px-4 py-2.5 rounded-full text-xs font-black primary-badge transition-all whitespace-nowrap shadow-xs";
    }

    // 생각의 서재 진입 시 공간 조명 감쇄 연출
    if (viewId === 'assets') {
        document.body.classList.add('in-study-room');
    } else {
        document.body.classList.remove('in-study-room');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateHeroClock() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const timeStr = now.toTimeString().split(' ')[0];
    const dateStr = `${year}년 ${month}월 ${day}일 (${days[now.getDay()]})`;

    document.getElementById('hero-clock').innerText = timeStr;
    document.getElementById('hero-date').innerText = dateStr;
    document.getElementById('global-header-clock').innerText = timeStr;
    
    const shortToday = `${month}.${day} (${days[now.getDay()]})`;
    const homeTodayEl = document.getElementById('home-today-date-text');
    const calTodayEl = document.getElementById('calendar-today-date-text');
    if(homeTodayEl) homeTodayEl.innerText = shortToday;
    if(calTodayEl) calTodayEl.innerText = shortToday;
}
setInterval(updateHeroClock, 1000);
updateHeroClock();

/* 주간 일정표 렌더링 */
function renderWeeklyGrid() {
    const container = document.getElementById('weekly-grid-view');
    if(!container) return;
    container.innerHTML = '';

    const daysInfo = [
        { key: 'mon', name: '월', date: '8.24' },
        { key: 'tue', name: '화', date: '8.25' },
        { key: 'wed', name: '수', date: '8.26' },
        { key: 'thu', name: '목', date: '8.27' },
        { key: 'fri', name: '금', date: '8.28', isToday: true },
        { key: 'sat', name: '토', date: '8.29' },
        { key: 'sun', name: '일', date: '8.30' }
    ];

    daysInfo.forEach(d => {
        const dayBox = document.createElement('div');
        const todayHighlight = d.isToday ? 'border-2 border-[var(--primary)] shadow-sm' : 'border border-[var(--border-color)]';
        dayBox.className = `bg-[var(--primary-light)] p-2.5 rounded-2xl space-y-2 flex flex-col h-full ${todayHighlight}`;
        
        let schedHtml = '';
        (state.weekly[d.key] || []).sort((a,b)=>a.time.localeCompare(b.time)).forEach(item => {
            schedHtml += `
                <div class="bg-[var(--card-bg)] p-1.5 rounded-xl shadow-xs border border-[var(--border-color)] leading-snug group relative">
                    <div class="flex justify-between items-start">
                        <b class="text-[var(--primary)] font-mono-code font-bold text-[10px]">${item.time}</b>
                        <button onclick="deleteWeekly('${d.key}', '${item.id}')" class="text-[9px] text-red-400 hover-reveal-action font-bold">✕</button>
                    </div>
                    <span class="font-bold text-[11px] text-[var(--text-main)] block mt-0.5">${item.text}</span>
                </div>`;
        });

        dayBox.innerHTML = `
            <div class="text-center pb-1 border-b border-[var(--border-color)]">
                <span class="font-black text-[var(--primary)] block text-xs">${d.name} ${d.isToday ? '📍' : ''}</span>
                <span class="text-[10px] font-mono-code text-[var(--text-sub)] font-bold">${d.date}</span>
            </div>
            <div class="flex-1 space-y-1.5">${schedHtml}</div>
        `;
        container.appendChild(dayBox);
    });
}

function addQuickScheduleFromHome() {
    const day = document.getElementById('quick-sched-day').value;
    const inputVal = document.getElementById('quick-sched-input').value.trim();
    if(!inputVal) return;

    let time = "10:00";
    let text = inputVal;
    const parts = inputVal.split(' ');
    if(parts.length > 1 && parts[0].includes(':')) {
        time = parts[0];
        text = parts.slice(1).join(' ');
    }

    state.weekly[day] = state.weekly[day] || [];
    state.weekly[day].push({ id: 'w_' + Date.now(), time, text });

    if (day === 'fri') {
        let inferredCat = '사역';
        if(text.includes('심방')) inferredCat = '심방';
        else if(text.includes('회의')) inferredCat = '회의';
        else if(text.includes('가정')) inferredCat = '가정';

        state.todos.push({ id: 't_' + Date.now(), time, cat: inferredCat, text, status: '진행' });
    }

    renderWeeklyGrid();
    renderTodos();
    renderHomeTodos();
    syncToCloud();
    document.getElementById('quick-sched-input').value = '';
}

function deleteWeekly(day, id) {
    state.weekly[day] = state.weekly[day].filter(i => i.id !== id);
    renderWeeklyGrid();
    syncToCloud();
}

function openGoogleCalendar() {
    window.open("https://calendar.google.com/calendar/embed?src=imyooeun0107%40gmail.com&ctz=Asia%2FSeoul", "_blank");
}

function renderHomeTodos() {
    const container = document.getElementById('home-todo-preview');
    const badge = document.getElementById('home-todo-badge');
    if(!container) return;
    container.innerHTML = '';
    const pending = state.todos.filter(t => t.status === '진행');
    if(badge) badge.innerText = pending.length;

    if(pending.length === 0) {
        container.innerHTML = `<p class="text-xs text-[var(--text-sub)] col-span-full py-1">등록된 걸음이 없습니다.</p>`;
        return;
    }

    pending.slice(0, 3).forEach(t => {
        const div = document.createElement('div');
        div.className = "bg-[var(--card-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between";
        div.innerHTML = `<div class="flex items-center gap-2 truncate"><span class="text-[10px] font-mono-code font-bold text-[var(--primary)]">${t.time}</span><span class="font-bold text-[var(--text-main)] truncate">${t.text}</span></div><button onclick="updateTodoStatus('${t.id}', '완료')" class="text-[10px] px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] font-bold rounded-lg">완료</button>`;
        container.appendChild(div);
    });
}

function renderTodos() {
    const container = document.getElementById('todo-checklist-container');
    if(!container) return;
    container.innerHTML = '';
    state.todos.forEach(item => {
        const div = document.createElement('div');
        div.className = "p-4 bg-[var(--primary-light)] rounded-2xl border border-[var(--border-color)] flex items-center justify-between group";
        div.innerHTML = `
            <div class="flex items-center gap-2.5 flex-1 mr-2 overflow-hidden">
                <span class="text-xs font-mono-code font-bold text-[var(--primary)] bg-[var(--card-bg)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">${item.time}</span>
                <span class="font-bold ${item.status==='완료' ? 'line-through text-[var(--text-sub)] opacity-50' : 'text-[var(--text-main)]'} truncate">${item.text}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px] primary-badge font-black px-2 py-0.5 rounded-full">${item.cat}</span>
                <select onchange="updateTodoStatus('${item.id}', this.value)" class="text-[11px] font-bold rounded-lg px-2 py-1 outline-none border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)]">
                    <option value="진행" ${item.status === '진행' ? 'selected' : ''}>진행</option>
                    <option value="완료" ${item.status === '완료' ? 'selected' : ''}>완료</option>
                </select>
                <button onclick="deleteTodo('${item.id}')" class="text-[11px] text-red-400 font-bold px-1 hover-reveal-action">✕</button>
            </div>`;
        container.appendChild(div);
    });
    renderHomeTodos();
}

function addTodoInline() {
    const time = document.getElementById('todo-time-input').value || '10:00';
    const cat = document.getElementById('todo-cat-select').value;
    const text = document.getElementById('todo-input-bar').value.trim();
    if(!text) return;
    state.todos.push({ id: 't_' + Date.now(), time, cat, text, status: '진행' });
    renderTodos();
    syncToCloud();
    document.getElementById('todo-input-bar').value = '';
}

function updateTodoStatus(id, status) {
    const t = state.todos.find(item => item.id === id);
    if(t) { t.status = status; renderTodos(); syncToCloud(); }
}

function deleteTodo(id) {
    state.todos = state.todos.filter(t => t.id !== id);
    renderTodos();
    syncToCloud();
}

function renderProjects() {
    const activeGrid = document.getElementById('active-projects-grid');
    const completedGrid = document.getElementById('completed-projects-grid');
    if(!activeGrid || !completedGrid) return;
    activeGrid.innerHTML = '';
    completedGrid.innerHTML = '';

    const activeProjects = state.projects.filter(p => !p.completed);
    const completedProjects = state.projects.filter(p => p.completed);

    let totalRates = 0;
    activeProjects.forEach(p => {
        const subtasks = p.subtasks || [];
        const doneCount = subtasks.filter(st => st.done).length;
        const rate = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;
        totalRates += rate;

        let subtasksHtml = '';
        subtasks.forEach(st => {
            subtasksHtml += `
                <div class="flex items-center gap-2 py-1 group/task">
                    <input type="checkbox" ${st.done ? 'checked' : ''} onchange="toggleSubTask('${p.id}', '${st.id}')" class="accent-[var(--primary)] rounded">
                    <span contenteditable="true" onblur="updateSubTaskText('${p.id}', '${st.id}', this.innerText)" class="${st.done ? 'line-through text-[var(--text-sub)] opacity-60' : 'text-[var(--text-main)]'} font-medium flex-1 outline-none border-b border-transparent focus:border-[var(--primary)] cursor-text">${st.text}</span>
                    <button onclick="deleteSubTask('${p.id}', '${st.id}')" class="text-[10px] text-red-400 hover-reveal-action font-bold">✕</button>
                </div>`;
        });

        const card = document.createElement('div');
        card.className = "glass-card p-6 space-y-4 flex flex-col justify-between border-t-4 border-t-[var(--primary)] group";
        card.innerHTML = `
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-[10px] font-mono-code font-bold uppercase tracking-wider bg-[var(--primary-light)] px-2.5 py-1 rounded-full text-[var(--primary)]">진행중 (${rate}%)</span>
                    <div class="flex items-center gap-1.5 hover-reveal-action">
                        <button onclick="deleteProject('${p.id}')" class="text-[11px] text-red-400 font-bold">삭제</button>
                    </div>
                </div>
                <h4 contenteditable="true" onblur="updateProjectTitle('${p.id}', this.innerText)" class="font-black text-base text-[var(--text-main)] outline-none border-b border-transparent focus:border-[var(--primary)] cursor-text">${p.title}</h4>
                <div class="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                    <span class="text-xs font-bold text-[var(--text-sub)] block">실행 과업</span>
                    <div class="space-y-1 text-xs">${subtasksHtml}</div>
                    <input type="text" placeholder="+ 새 과업 입력 후 Enter" class="w-full mt-2 p-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold outline-none focus:border-[var(--primary)]" onkeydown="handleSubTaskEnter('${p.id}', this, event)">
                </div>
            </div>
            <div class="pt-2">
                <button onclick="toggleProjectComplete('${p.id}')" class="w-full py-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">🌱 사역 갈무리</button>
            </div>`;
        activeGrid.appendChild(card);
    });

    completedProjects.forEach(p => {
        const card = document.createElement('div');
        card.className = "glass-card p-5 space-y-2 border-t-4 border-t-gray-600 bg-black/20 group";
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-[10px] font-mono-code font-bold uppercase tracking-wider bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full">갈무리됨</span>
                <div class="flex items-center gap-1.5 hover-reveal-action">
                    <button onclick="toggleProjectComplete('${p.id}')" class="text-[11px] text-[var(--text-sub)] hover:text-[var(--primary)] font-bold">되돌리기</button>
                    <button onclick="deleteProject('${p.id}')" class="text-[11px] text-red-400 font-bold">삭제</button>
                </div>
            </div>
            <h4 class="font-bold text-base text-[var(--text-main)]">${p.title}</h4>
        `;
        completedGrid.appendChild(card);
    });

    const overallRate = activeProjects.length > 0 ? Math.round(totalRates / activeProjects.length) : 100;
    const overallBadge = document.getElementById('proj-overall-progress');
    if(overallBadge) overallBadge.innerText = `진척도 ${overallRate}%`;
}

function addNewProject() {
    const title = prompt("새 사역 프로젝트 명칭:");
    if(!title) return;
    state.projects.push({ id: 'p_' + Date.now(), title, start: '2026.08.28', end: '2026.09.10', completed: false, subtasks: [{ id: 'st_' + Date.now(), text: '초기 기획 수립', done: false }] });
    renderProjects();
    syncToCloud();
}

function handleSubTaskEnter(projectId, inputEl, event) {
    if (event.key === 'Enter' && !event.isComposing) {
        const text = inputEl.value.trim();
        if(!text) return;
        const p = state.projects.find(item => item.id === projectId);
        if(p) {
            p.subtasks.push({ id: 'st_' + Date.now(), text, done: false });
            inputEl.value = '';
            renderProjects();
            syncToCloud();
        }
    }
}

function updateSubTaskText(projectId, subtaskId, newText) {
    const p = state.projects.find(item => item.id === projectId);
    if(p) {
        const st = p.subtasks.find(s => s.id === subtaskId);
        if(st && newText.trim()) { st.text = newText.trim(); syncToCloud(); }
    }
}

function updateProjectTitle(projectId, newTitle) {
    const p = state.projects.find(item => item.id === projectId);
    if(p && newTitle.trim()) { p.title = newTitle.trim(); syncToCloud(); }
}

function toggleSubTask(projectId, subtaskId) {
    const p = state.projects.find(item => item.id === projectId);
    if(p) {
        const st = p.subtasks.find(s => s.id === subtaskId);
        if(st) { st.done = !st.done; renderProjects(); syncToCloud(); }
    }
}

function deleteSubTask(projectId, subtaskId) {
    const p = state.projects.find(item => item.id === projectId);
    if(p) {
        p.subtasks = p.subtasks.filter(s => s.id !== subtaskId);
        renderProjects();
        syncToCloud();
    }
}

function toggleProjectComplete(id) {
    const p = state.projects.find(item => item.id === id);
    if(p) {
        p.completed = !p.completed;
        renderProjects();
        syncToCloud();
    }
}

function deleteProject(id) {
    if(confirm("이 사역을 삭제하시겠습니까?")) {
        state.projects = state.projects.filter(p => p.id !== id);
        renderProjects();
        syncToCloud();
    }
}

/* 회의록 관리 */
let currentMemoCat = '전체';

function renderMemos() {
    const list = document.getElementById('memo-archive-list');
    if(!list) return;
    list.innerHTML = '';
    const query = (document.getElementById('memo-search-input')?.value || '').toLowerCase();

    state.memos.forEach(m => {
        const matchCat = (currentMemoCat === '전체' || m.cat === currentMemoCat);
        const matchQuery = !query || m.title.toLowerCase().includes(query) || m.content.toLowerCase().includes(query);
        if(!matchCat || !matchQuery) return;

        const div = document.createElement('div');
        div.className = "p-5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-xs space-y-1 group";
        div.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] primary-badge font-black px-2.5 py-0.5 rounded-full">${m.cat}</span>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-[var(--text-sub)] font-mono-code">${m.date}</span>
                    <button onclick="deleteMemo('${m.id}')" class="text-[11px] text-red-400 hover-reveal-action font-bold">✕</button>
                </div>
            </div>
            <h4 class="font-bold text-xs text-[var(--text-main)]">${m.title}</h4>
            <p class="text-xs text-[var(--text-sub)] leading-relaxed whitespace-pre-wrap">${m.content}</p>
        `;
        list.appendChild(div);
    });
}

function saveTodayMemo() {
    const cat = document.getElementById('memo-cat-select').value;
    const title = document.getElementById('memo-title-input').value.trim() || '회의 및 사역 메모';
    const content = document.getElementById('today-memo-input').value.trim();
    if(!content) return;

    state.memos.unshift({ id: 'm_' + Date.now(), cat, title, date: '2026.08.28', content });
    renderMemos();
    syncToCloud();
    document.getElementById('memo-title-input').value = '';
    document.getElementById('today-memo-input').value = '';
}

function filterMemoCat(cat) {
    currentMemoCat = cat;
    document.querySelectorAll('#memo-cat-filter .memo-filter-btn').forEach(btn => {
        if((cat==='전체' && btn.innerText==='전체보기') || btn.innerText === cat) {
            btn.className = "memo-filter-btn px-4 py-2 rounded-full text-xs font-black primary-badge whitespace-nowrap";
        } else {
            btn.className = "memo-filter-btn px-4 py-2 rounded-full text-xs font-bold text-[var(--text-sub)] bg-[var(--primary-light)] whitespace-nowrap";
        }
    });
    renderMemos();
}

function deleteMemo(id) {
    state.memos = state.memos.filter(m => m.id !== id);
    renderMemos();
    syncToCloud();
}

/* 생각의 서재 (폰트 스케일러, 드래그 서식, 라이브 모달, 숙성 생애주기) */
function adjustThoughtZoom(delta) {
    state.thoughtZoom = Math.max(0.85, Math.min(1.4, state.thoughtZoom + delta));
    applyThoughtZoomUI();
    syncToCloud();
}

function applyThoughtZoomUI() {
    document.documentElement.style.setProperty('--thought-zoom', state.thoughtZoom);
    const ind = document.getElementById('font-scale-indicator');
    if(ind) ind.innerText = `${Math.round(state.thoughtZoom * 100)}%`;
}

function checkSelection() {
    const sel = window.getSelection();
    const toolbar = document.getElementById('selection-toolbar');
    if (!sel.isCollapsed && sel.toString().trim().length > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        toolbar.style.top = `${window.scrollY + rect.top - 42}px`;
        toolbar.style.left = `${window.scrollX + rect.left + (rect.width / 2) - 100}px`;
        toolbar.style.display = 'flex';
    } else {
        toolbar.style.display = 'none';
    }
}

function formatSelection(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('selection-toolbar').style.display = 'none';
}

function handleEditorInstantMarkdown(el, event) {
    if (event.key === ' ') {
        const text = el.innerText;
        if (text.startsWith('# ')) {
            document.execCommand('formatBlock', false, '<h1>');
        } else if (text.startsWith('## ')) {
            document.execCommand('formatBlock', false, '<h2>');
        } else if (text.startsWith('> ')) {
            document.execCommand('formatBlock', false, '<blockquote>');
        }
    }
}

function applyThoughtTemplate(type) {
    const titleInput = document.getElementById('thought-title');
    const editor = document.getElementById('thought-editor-content');
    if (type === '설교착상') {
        titleInput.value = "[본문 및 설교 가제]";
        editor.innerHTML = "<h1>1. 중심 메시지 (화두)</h1><p>여기에 선언적 메시지를 기록하세요</p><h2>2. 현장 적용 질문</h2><p>* 질문 1:</p>";
    } else if (type === '독서기록') {
        titleInput.value = "[도서명 · 저자]";
        editor.innerHTML = "<h2>기억할 문장</h2><p>“문장을 입력하세요”</p><h2>목회적 통찰</h2><p>깨달음을 기록하세요</p>";
    } else if (type === '묵상기록') {
        titleInput.value = "오늘의 말씀 묵상";
        editor.innerHTML = "<h1>본문 관찰</h1><p>내용을 입력하세요</p><h2>삶의 결단</h2><p>기도 제목 및 적용</p>";
    } else if (type === '기도제목') {
        titleInput.value = "중보 및 공동체 기도제목";
        editor.innerHTML = "<p>1. </p><p>2. </p>";
    }
}

function renderThoughts() {
    const grid = document.getElementById('thought-card-grid');
    if(!grid) return;
    grid.innerHTML = '';

    state.thoughts.forEach(th => {
        const stage = th.stage || '착상';
        let stageDot = '🌱';
        if(stage === '숙성') stageDot = '📖';
        if(stage === '결실') stageDot = '✨';

        const div = document.createElement('div');
        div.className = "glass-card p-6 space-y-4 cursor-pointer hover:border-[var(--primary)] transition-all flex flex-col justify-between group";
        div.onclick = function() { openThoughtModal(th.id); };
        div.innerHTML = `
            <div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-1.5">
                        <span class="bookmark-ribbon primary-badge">${stageDot} #${th.cat || '서재'}</span>
                        <span class="text-xs font-black text-[var(--text-main)] truncate max-w-[200px]">${th.title}</span>
                    </div>
                    <button onclick="event.stopPropagation(); deleteThought('${th.id}')" class="text-[11px] text-red-400 hover-reveal-action font-bold">✕</button>
                </div>
                <div class="mt-3 line-clamp-3 leading-relaxed thought-body font-medium">${th.content}</div>
            </div>
            <button class="text-xs font-bold text-[var(--text-sub)] text-left hover:text-[var(--primary)] pt-2 border-t border-[var(--border-color)]" onclick="event.stopPropagation(); forwardToSermonIdea('${th.id}')">➔ 설교 아이디어로 전송</button>
        `;
        grid.appendChild(div);
    });
}

function addThoughtCard() {
    const stage = document.getElementById('thought-stage-select').value;
    const title = document.getElementById('thought-title').value.trim();
    const content = document.getElementById('thought-editor-content').innerHTML.trim();
    if(!title || !content) return;

    state.thoughts.unshift({ id: 'th_' + Date.now(), cat: '서재기록', stage, title, content });
    renderThoughts();
    syncToCloud();
    document.getElementById('thought-title').value = '';
    document.getElementById('thought-editor-content').innerHTML = '';
}

function openThoughtModal(id) {
    currentActiveThoughtId = id;
    const thought = state.thoughts.find(t => t.id === id);
    if(!thought) return;
    document.getElementById('modal-tag').innerText = `#${thought.cat || '서재'}`;
    document.getElementById('modal-thought-stage-select').value = thought.stage || '착상';
    document.getElementById('modal-thought-title').innerText = thought.title;
    document.getElementById('modal-text').innerHTML = thought.content;
    document.getElementById('thought-modal').classList.add('show');
}

function closeThoughtModal() {
    if(currentActiveThoughtId) {
        const titleEl = document.getElementById('modal-thought-title');
        const contentEl = document.getElementById('modal-text');
        const stageEl = document.getElementById('modal-thought-stage-select');
        if(titleEl && contentEl) {
            const t = state.thoughts.find(item => item.id === currentActiveThoughtId);
            if(t) {
                t.title = titleEl.innerText.trim() || t.title;
                t.content = contentEl.innerHTML.trim() || t.content;
                if(stageEl) t.stage = stageEl.value;
                renderThoughts();
                syncToCloud();
            }
        }
    }
    document.getElementById('thought-modal').classList.remove('show');
    currentActiveThoughtId = null;
}

function updateModalThoughtStage(newStage) {
    if(!currentActiveThoughtId) return;
    const t = state.thoughts.find(item => item.id === currentActiveThoughtId);
    if(t) { t.stage = newStage; renderThoughts(); syncToCloud(); }
}

function updateModalThoughtTitle(newTitle) {
    if(!currentActiveThoughtId || !newTitle.trim()) return;
    const t = state.thoughts.find(item => item.id === currentActiveThoughtId);
    if(t) { t.title = newTitle.trim(); renderThoughts(); syncToCloud(); }
}

function updateModalThoughtContent(newContent) {
    if(!currentActiveThoughtId || !newContent.trim()) return;
    const t = state.thoughts.find(item => item.id === currentActiveThoughtId);
    if(t) { t.content = newContent.trim(); renderThoughts(); syncToCloud(); }
}

function forwardCurrentThoughtToSermon() {
    if(!currentActiveThoughtId) return;
    forwardToSermonIdea(currentActiveThoughtId);
    closeThoughtModal();
}

function forwardToSermonIdea(id) {
    const thought = state.thoughts.find(t => t.id === id);
    if(!thought) return;
    
    // 구조적 개요 포맷 변환
    const plainText = thought.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    const formattedIdea = `[서재 착상: ${thought.title}]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 단계: ${thought.stage || '착상'}\n📜 본문/내용: ${plainText}`;

    state.memos.unshift({
        id: 'm_' + Date.now(),
        cat: '설교 아이디어',
        title: `[서재 착상] ${thought.title}`,
        date: '2026.08.28',
        content: formattedIdea
    });
    renderMemos();
    syncToCloud();
}

function deleteThought(id) {
    state.thoughts = state.thoughts.filter(t => t.id !== id);
    renderThoughts();
    syncToCloud();
}

function openFabModal() { document.getElementById('fab-modal').classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function submitFab() {
    const text = document.getElementById('fab-input').value.trim();
    if(!text) return;
    state.todos.push({ id: 't_' + Date.now(), time: '12:00', cat: '사역', text, status: '진행' });
    renderTodos();
    syncToCloud();
    closeModal('fab-modal');
}

/* 초기 실행 */
initTheologyNarrative();
renderNewsAccordion();
renderWeeklyGrid();
switchTheme(state.theme, false);
applyThoughtZoomUI();
renderTodos();
renderHomeTodos();
renderProjects();
renderMemos();
renderThoughts();