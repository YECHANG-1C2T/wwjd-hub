/* ==========================================================================
   [CORE ENGINE] Firebase 연동 및 상태 관리
   (Firebase 앱 초기화 및 인증 게이트는 auth.js에서 처리)
   ========================================================================== */
const db = firebase.firestore();
const appDocRef = db.collection('ministry_data').doc('master_workspace');

/* 구글 캘린더 주간 일정을 주간일정표 각 요일 칸에 함께 표시하기 위한 설정.
   API 키를 발급받아 아래에 붙여넣기 전까지는 조용히 건너뛴다(주간일정표는
   기존처럼 수동 입력만 표시). */
const GOOGLE_CALENDAR_API_KEY = "";
const GOOGLE_CALENDAR_ID = "imyooeun0107@gmail.com";
let googleCalendarWeekEvents = {};

async function loadGoogleCalendarWeek() {
    if (!GOOGLE_CALENDAR_API_KEY) return;
    const now = new Date();
    const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const nextMonday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events`
        + `?key=${GOOGLE_CALENDAR_API_KEY}&timeMin=${monday.toISOString()}&timeMax=${nextMonday.toISOString()}`
        + `&singleEvents=true&orderBy=startTime&timeZone=Asia/Seoul`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('구글캘린더 응답 오류: ' + res.status);
        const data = await res.json();
        const grouped = {};
        (data.items || []).forEach(ev => {
            const startRaw = ev.start && (ev.start.dateTime || ev.start.date);
            if (!startRaw) return;
            const startDate = new Date(startRaw);
            const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][startDate.getDay()];
            const time = ev.start.dateTime
                ? startDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' })
                : '종일';
            grouped[dayKey] = grouped[dayKey] || [];
            grouped[dayKey].push({ time, text: ev.summary || '(제목 없음)' });
        });
        googleCalendarWeekEvents = grouped;
        renderWeeklyGrid();
    } catch (e) {
        console.warn('구글캘린더 주간 일정 로드 실패:', e);
    }
}

window.state = {
    theme: localStorage.getItem('yc_theme') || 'dawn',
    thoughtZoom: parseFloat(localStorage.getItem('yc_thought_zoom')) || 1.0,
    weekly: defaultWeekly,
    todos: defaultTodos,
    todoCompletionLog: {},
    projects: defaultProjects,
    links: defaultLinks,
    memos: [{ id: 'm1', cat: '교회 공통', title: '하반기 목회 계획', date: '2026.08.28', content: '소그룹 모임 장소 재배치 논의 완료.' }],
    thoughts: [{ id: 'th1', cat: '설교착상', stage: '숙성', title: '팀켈러 일과 영성', createdAt: '2026.08.28 15:58', updatedAt: '2026.08.28 15:58', content: '<h1>소명으로서의 일터</h1><p>복음은 우리의 일터를 개인의 야망을 위한 수단에서, 이웃을 섬기고 하나님의 창조 세계를 돌보는 <mark>거룩한 소명의 자리</mark>로 변화시킨다.</p>' }]
};

let currentActiveThoughtId = null;
let activeNarrativeIdx = 0;
let liveNaverNewsList = [];
let openAccordionId = null;
let currentMemoCat = '전체';

/* 페이지를 막 열었을 때(로그인 직후) 클라우드에서 진짜 데이터가 도착하기 전까지는
   window.state가 아직 기본 예시값(defaultTodos 등)인 상태다. 이 짧은 순간에 뭔가를
   저장하면 그 예시값으로 실제 데이터를 덮어써버릴 수 있으므로, 최초 스냅샷을 받기
   전까지는 절대 쓰지 않는다 — 배포로 페이지가 새로고침될 때마다 이 위험한 순간이
   반복되므로, 데이터 유실을 막는 핵심 안전장치다. */
let initialSnapshotReceived = false;

window.syncToCloud = function() {
    if (!initialSnapshotReceived) {
        console.warn('클라우드 초기 동기화가 끝나기 전이라 저장을 건너뜁니다.');
        return;
    }
    const dot = document.getElementById('sync-dot');
    if (dot) dot.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";
    localStorage.setItem('yc_theme', window.state.theme);
    localStorage.setItem('yc_thought_zoom', window.state.thoughtZoom);
    appDocRef.set(window.state, { merge: true })
        .then(() => { if (dot) dot.className = "w-2 h-2 rounded-full bg-emerald-400"; })
        .catch(() => { if (dot) dot.className = "w-2 h-2 rounded-full bg-red-500"; });
};

let cloudSyncStarted = false;
function startCloudSync() {
    if (cloudSyncStarted) return;
    cloudSyncStarted = true;
    appDocRef.onSnapshot((doc) => {
        initialSnapshotReceived = true;
        if (doc.exists) {
            const data = doc.data();
            if (data.weekly) window.state.weekly = data.weekly;
            if (data.todos) window.state.todos = data.todos;
            if (data.todoCompletionLog) window.state.todoCompletionLog = data.todoCompletionLog;
            if (data.projects) window.state.projects = data.projects;
            if (data.links && data.links.length > 0) window.state.links = data.links;
            if (data.memos) window.state.memos = data.memos;
            if (data.thoughts) window.state.thoughts = data.thoughts;
            if (data.theme) window.state.theme = data.theme;
            if (data.thoughtZoom) window.state.thoughtZoom = data.thoughtZoom;

            if (typeof switchTheme === 'function') switchTheme(window.state.theme, false);
            if (typeof applyThoughtZoomUI === 'function') applyThoughtZoomUI();

            renderWeeklyGrid();
            renderTodos();
            renderHomeTodos();
            renderProjects();
            renderLinkBoard();
            renderMemos();
            renderThoughts();
        }
    });
}

/* ==========================================================================
   [WEATHER & CLOCK]
   ========================================================================== */
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
        const [resB, resG] = await Promise.all([
            fetch('https://api.open-meteo.com/v1/forecast?latitude=37.3827&longitude=127.1189&current=temperature_2m,weather_code&models=ecmwf_ifs&timezone=Asia%2FSeoul'),
            fetch('https://api.open-meteo.com/v1/forecast?latitude=37.4089&longitude=127.2564&current=temperature_2m,weather_code&models=ecmwf_ifs&timezone=Asia%2FSeoul')
        ]);
        const dataB = await resB.json();
        const dataG = await resG.json();
        const tempB = Math.round(dataB.current.temperature_2m);
        const wB = interpretWMO(dataB.current.weather_code);
        const tempG = Math.round(dataG.current.temperature_2m);
        const wG = interpretWMO(dataG.current.weather_code);

        document.getElementById('weather-bundang').innerText = `${wB.icon} 분당 ${tempB}°C ${wB.text}`;
        document.getElementById('weather-gwangju').innerText = `${wG.icon} 경기광주 ${tempG}°C ${wG.text}`;
        document.getElementById('global-header-weather').innerText = `${wB.icon} 분당 ${tempB}°C · 경기광주 ${tempG}°C`;

        const commentEl = document.getElementById('weather-comment');
        if (wG.text.includes("비") || wB.text.includes("비")) {
            commentEl.innerText = "🌧️ MET Norway: 비/소나기 감지 · 심방 동선 우산 및 안전 운전 요망";
            commentEl.className = "text-[11px] text-amber-200 text-left bg-black/40 px-3 py-1.5 rounded-xl border border-amber-400/30 font-medium";
        } else {
            commentEl.innerText = "✨ 쾌적한 사역 기상 · 야외 1on1 미팅 및 청년 심방 이동 최적";
            commentEl.className = "text-[11px] text-emerald-200 text-left bg-black/40 px-3 py-1.5 rounded-xl border border-emerald-400/30 font-medium";
        }
    } catch (err) {
        document.getElementById('weather-bundang').innerText = "📍 분당 24°C 맑음";
        document.getElementById('weather-gwangju').innerText = "☁️ 경기광주 22°C 흐림";
    }
}
fetchLiveWeatherAPI();

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
    if (homeTodayEl) homeTodayEl.innerText = shortToday;
    if (calTodayEl) calTodayEl.innerText = shortToday;
}
setInterval(updateHeroClock, 1000);
updateHeroClock();

/* ==========================================================================
   [TODAY REFLECTION & LIVE NEWS]
   ========================================================================== */
function initTheologyNarrative() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
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
    const now = new Date();
    const timeStr = `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    window.state.thoughts.unshift({
        id: 'th_' + Date.now(),
        cat: '신학스토리',
        stage: '숙성',
        title: `${item.author} - ${item.era}`,
        createdAt: timeStr,
        updatedAt: timeStr,
        content: content
    });
    renderThoughts();
    window.syncToCloud();
    closeModal('theology-detail-modal');
}

const NEWS_SOURCES = [
    { cat: '정치·정책', url: 'https://rss.donga.com/politics.xml', count: 1 },
    { cat: '노동·경제', url: 'https://rss.donga.com/economy.xml', count: 1 },
    { cat: '사회·이슈', url: 'https://rss.donga.com/national.xml', count: 1 },
    { cat: '문화·연예', url: 'https://rss.donga.com/culture.xml', count: 1 },
    { cat: null, url: 'https://www.yna.co.kr/rss/news.xml', count: 2 },
    { cat: null, url: 'https://www.hani.co.kr/rss/', count: 2 }
];

function stripHtml(html) {
    return (html || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* 추출식 요약 (Extractive Summarization) — 외부 API 없이 순수 JS로 동작.
   문장을 나눈 뒤, 문서 전체에서 자주 나오는 단어를 많이 포함한 문장일수록
   "핵심 문장"으로 보고 점수를 매겨 상위 N개만 골라 원래 순서대로 이어붙인다.
   문장을 새로 쓰는 게 아니라 원문에서 고르는 방식(TextRank/빈도 기반 요약의
   단순화 버전)이라 왜곡 없이 짧아진다는 게 장점. */
function extractiveSummary(text, maxSentences) {
    if (!text) return text;
    const sentences = (text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text])
        .map(s => s.trim()).filter(s => s.length > 1);
    if (sentences.length <= maxSentences) return sentences.join(' ');

    const stop = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'and', 'is', 'are', 'was', 'were', 'this', 'that',
        'for', 'on', 'with', 'as', 'by', 'it', 'be', 'at', 'from', 'or', 'we', 'our', 'their', 'these', 'those',
        '그', '이', '저', '것', '수', '등', '및', '을', '를', '은', '는', '이다', '있다', '하다', '통해', '위해']);
    const tokenize = s => s.toLowerCase().split(/\s+/)
        .map(w => w.replace(/[^\w가-힣]/g, ''))
        .filter(w => w.length >= 2 && !stop.has(w));

    const freq = {};
    sentences.forEach(s => tokenize(s).forEach(w => { freq[w] = (freq[w] || 0) + 1; }));

    const scored = sentences.map((s, idx) => {
        const words = tokenize(s);
        const score = words.length ? words.reduce((sum, w) => sum + freq[w], 0) / words.length : 0;
        return { s, idx, score };
    });

    return scored.sort((a, b) => b.score - a.score)
        .slice(0, maxSentences)
        .sort((a, b) => a.idx - b.idx)
        .map(t => t.s)
        .join(' ');
}

function guessNewsCategory(title) {
    if (/스포츠|축구|야구|올림픽|선수|리그/.test(title)) return '스포츠·건강';
    if (/국제|미국|중국|일본|외교|정상회담|유엔/.test(title)) return '국제·외교';
    if (/증시|주가|금리|환율|무역|기업|은행/.test(title)) return '노동·경제';
    if (/법원|검찰|경찰|사고|화재|구조/.test(title)) return '사회·이슈';
    return '종합';
}

async function fetchLiveNaverNews(manual = false) {
    const icon = document.getElementById('news-refresh-icon');
    if (icon && manual) {
        icon.classList.remove('rotate-anim');
        void icon.offsetWidth;
        icon.classList.add('rotate-anim');
    }
    try {
        const results = await Promise.all(NEWS_SOURCES.map(async (src) => {
            try {
                const targetRss = encodeURIComponent(src.url);
                const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${targetRss}`);
                const data = await res.json();
                const items = (data && data.items) || [];
                const sourceName = (data.feed && data.feed.title) || '뉴스';
                return items.slice(0, src.count).map((item, idx) => {
                    const title = stripHtml(item.title);
                    const summary = extractiveSummary(stripHtml(item.description), 2);
                    return {
                        id: 'live_n_' + src.url.replace(/\W/g, '') + '_' + idx,
                        cat: src.cat || guessNewsCategory(title),
                        title,
                        source: sourceName,
                        url: item.link,
                        summary
                    };
                });
            } catch (e) {
                return [];
            }
        }));
        const flat = results.flat();
        if (flat.length > 0) liveNaverNewsList = flat;
    } catch (e) {}
    renderNewsAccordion();
}

function renderNewsAccordion() {
    const container = document.getElementById('news-accordion-container');
    if (!container) return;
    container.innerHTML = '';
    const list = (liveNaverNewsList.length > 0) ? liveNaverNewsList : [
        { id: 'n1', cat: '사회·정책', title: '1인 가구 청년 고립 방지 맞춤형 안전망 전국 확대', source: '뉴스', url: 'https://news.naver.com', summary: '청년 지원 프로그램이 전국으로 확대됩니다.' }
    ];

    list.forEach(item => {
        const isOpen = openAccordionId === item.id;
        const div = document.createElement('div');
        div.className = "bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden transition-all shadow-xs";
        const summaryId = `news-summary-${item.id}`;
        let summaryHtml = isOpen ? `
            <div id="${summaryId}" class="px-4 pb-4 pt-2 border-t border-[var(--border-color)] bg-[var(--primary-light)] space-y-2 text-xs">
                <span class="font-bold text-[var(--primary)] block">🔥 기사 요약:</span>
                <p class="text-[var(--text-main)] font-medium leading-relaxed">${item.summary || '요약을 불러올 수 없습니다.'}</p>
            </div>` : '';

        div.innerHTML = `
            <div class="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--primary-light)] transition-colors focus:outline focus:outline-2 focus:outline-[var(--primary)] focus:outline-offset-[-2px]" role="button" tabindex="0" aria-expanded="${isOpen}" aria-controls="${summaryId}" onclick="toggleNewsAccordion('${item.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); toggleNewsAccordion('${item.id}');}">
                <div class="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <span class="text-[10px] font-mono-code font-bold primary-badge px-2 py-0.5 rounded-full shrink-0">${item.cat}</span>
                    <h4 class="text-sm font-bold text-[var(--text-main)] line-clamp-2 min-w-0" title="${escapeAttr(item.title)}">${item.title}</h4>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                    <a href="${item.url}" target="_blank" onclick="event.stopPropagation()" class="text-[10px] font-mono-code text-[var(--text-sub)] hover:text-[var(--primary)] font-bold"><span>${item.source} ↗</span></a>
                    <span class="text-xs text-[var(--text-sub)] font-bold transition-transform ${isOpen ? 'rotate-180' : ''}">▼</span>
                </div>
            </div>${summaryHtml}`;
        container.appendChild(div);
    });
}

function toggleNewsAccordion(id) {
    openAccordionId = (openAccordionId === id) ? null : id;
    renderNewsAccordion();
}

function refreshNaverNews(manual = false) {
    fetchLiveNaverNews(manual);
}

/* ==========================================================================
   [SCHEDULE, TODOS, PROJECTS & MEMOS]
   ========================================================================== */
function getCurrentWeekDates() {
    const now = new Date();
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const names = ['월', '화', '수', '목', '금', '토', '일'];
    const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const todayStr = now.toDateString();

    return keys.map((key, i) => {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        return {
            key,
            name: names[i],
            date: `${d.getMonth() + 1}.${d.getDate()}`,
            isToday: d.toDateString() === todayStr
        };
    });
}

function renderWeeklyGrid() {
    const container = document.getElementById('weekly-grid-view');
    if (!container) return;
    container.innerHTML = '';
    const daysInfo = getCurrentWeekDates();

    const rangeHeader = document.getElementById('weekly-range-header');
    if (rangeHeader) rangeHeader.innerText = `${daysInfo[0].date}(월) ~ ${daysInfo[6].date}(일)`;

    const daySelect = document.getElementById('quick-sched-day');
    if (daySelect) {
        const todayInfo = daysInfo.find(d => d.isToday);
        daysInfo.forEach(d => {
            const opt = daySelect.querySelector(`option[value="${d.key}"]`);
            if (opt) opt.innerText = d.name + '요일' + (d.isToday ? ' (오늘)' : '');
        });
        if (todayInfo) daySelect.value = todayInfo.key;
    }

    daysInfo.forEach(d => {
        const dayBox = document.createElement('div');
        dayBox.className = `bg-[var(--primary-light)] p-2.5 rounded-2xl space-y-2 flex flex-col h-full ${d.isToday ? 'border-2 border-[var(--primary)] shadow-sm' : 'border border-[var(--border-color)]'}`;
        let schedHtml = '';
        const manualItems = (window.state.weekly[d.key] || []).map(item => ({ ...item, source: 'manual' }));
        const calendarItems = (googleCalendarWeekEvents[d.key] || []).map(item => ({ ...item, source: 'google' }));
        manualItems.concat(calendarItems).sort((a,b)=>a.time.localeCompare(b.time)).forEach(item => {
            if (item.source === 'google') {
                schedHtml += `
                    <div class="bg-[var(--primary-light)] p-1.5 rounded-xl border border-dashed border-[var(--primary)] leading-snug" title="구글 캘린더 일정">
                        <div class="flex justify-between items-start">
                            <b class="text-[var(--primary)] font-mono-code font-bold text-[10px]">${item.time}</b>
                            <span class="text-[8px] text-[var(--text-sub)] font-black">G</span>
                        </div>
                        <span class="font-bold text-[11px] text-[var(--text-main)] block mt-0.5">${escapeAttr(item.text)}</span>
                    </div>`;
            } else {
                schedHtml += `
                    <div class="bg-[var(--card-bg)] p-1.5 rounded-xl shadow-xs border border-[var(--border-color)] leading-snug group relative">
                        <div class="flex justify-between items-start">
                            <b class="text-[var(--primary)] font-mono-code font-bold text-[10px]">${item.time}</b>
                            <button onclick="deleteWeekly('${d.key}', '${item.id}')" class="text-[9px] text-red-400 hover-reveal-action font-bold">✕</button>
                        </div>
                        <span class="font-bold text-[11px] text-[var(--text-main)] block mt-0.5">${item.text}</span>
                    </div>`;
            }
        });
        dayBox.innerHTML = `<div class="text-center pb-1 border-b border-[var(--border-color)]"><span class="font-black text-[var(--primary)] block text-xs">${d.name} ${d.isToday ? '📍' : ''}</span><span class="text-[10px] font-mono-code text-[var(--text-sub)] font-bold">${d.date}</span></div><div class="flex-1 space-y-1.5">${schedHtml}</div>`;
        container.appendChild(dayBox);
    });
}

function addQuickScheduleFromHome() {
    const day = document.getElementById('quick-sched-day').value;
    const inputVal = document.getElementById('quick-sched-input').value.trim();
    if (!inputVal) return;
    let time = "10:00", text = inputVal;
    const parts = inputVal.split(' ');
    if (parts.length > 1 && parts[0].includes(':')) { time = parts[0]; text = parts.slice(1).join(' '); }

    window.state.weekly[day] = window.state.weekly[day] || [];
    window.state.weekly[day].push({ id: 'w_' + Date.now(), time, text });

    const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
    if (day === todayKey) {
        let inferredCat = '사역';
        if (text.includes('심방')) inferredCat = '심방';
        else if (text.includes('회의')) inferredCat = '회의';
        else if (text.includes('가정')) inferredCat = '가정';
        window.state.todos.push({ id: 't_' + Date.now(), time, cat: inferredCat, text, status: '진행' });
    }
    renderWeeklyGrid(); renderTodos(); renderHomeTodos(); window.syncToCloud();
    document.getElementById('quick-sched-input').value = '';
}

function deleteWeekly(day, id) {
    window.state.weekly[day] = window.state.weekly[day].filter(i => i.id !== id);
    renderWeeklyGrid(); window.syncToCloud();
}

function openGoogleCalendar() {
    window.open("https://calendar.google.com/calendar/embed?src=imyooeun0107%40gmail.com&ctz=Asia%2FSeoul", "_blank");
}

function renderHomeTodos() {
    const container = document.getElementById('home-todo-preview');
    const badge = document.getElementById('home-todo-badge');
    if (!container) return;
    container.innerHTML = '';
    const pending = window.state.todos.filter(t => t.status === '진행');
    if (badge) badge.innerText = pending.length;
    renderTodoSparkline();
    if (pending.length === 0) {
        container.innerHTML = `<p class="text-xs text-[var(--text-sub)] col-span-full py-1">등록된 걸음이 없습니다.</p>`;
        return;
    }
    pending.slice(0, 3).forEach(t => {
        const div = document.createElement('div');
        div.className = "bg-[var(--card-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between group";
        div.innerHTML = `
            <div class="flex items-center gap-2 min-w-0 flex-1 mr-1">
                <span class="text-[10px] font-mono-code font-bold text-[var(--primary)] shrink-0">${t.time}</span>
                <span contenteditable="true" onclick="event.stopPropagation()" onblur="updateHomeTodoText('${t.id}', this.innerText)" class="font-bold text-[var(--text-main)] outline-none border-b border-transparent focus:border-[var(--primary)] cursor-text truncate min-w-0" title="${escapeAttr(t.text)}">${t.text}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button onclick="updateTodoStatus('${t.id}', '완료')" class="text-[10px] px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] font-bold rounded-lg">완료</button>
                <button onclick="deleteTodo('${t.id}')" class="text-[10px] text-red-400 hover-reveal-action font-bold px-1">✕</button>
            </div>`;
        container.appendChild(div);
    });
}

function updateHomeTodoText(id, newText) {
    if (!newText.trim()) return;
    const t = window.state.todos.find(item => item.id === id);
    if (t && t.text !== newText.trim()) { t.text = newText.trim(); renderTodos(); window.syncToCloud(); }
}

function addHomeTodo() {
    const time = document.getElementById('home-todo-time').value || '10:00';
    const cat = document.getElementById('home-todo-cat').value;
    const input = document.getElementById('home-todo-input');
    const text = input.value.trim();
    if (!text) return;
    window.state.todos.push({ id: 't_' + Date.now(), time, cat, text, status: '진행' });

    const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
    window.state.weekly[todayKey] = window.state.weekly[todayKey] || [];
    window.state.weekly[todayKey].push({ id: 'w_' + Date.now(), time, text });

    renderTodos(); renderWeeklyGrid(); window.syncToCloud();
    input.value = '';
}

function renderTodos() {
    const container = document.getElementById('todo-checklist-container');
    if (!container) return;
    container.innerHTML = '';
    window.state.todos.forEach(item => {
        const div = document.createElement('div');
        div.className = "p-4 bg-[var(--primary-light)] rounded-2xl border border-[var(--border-color)] flex items-center justify-between group";
        div.innerHTML = `
            <div class="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <span class="text-xs font-mono-code font-bold text-[var(--primary)] bg-[var(--card-bg)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">${item.time}</span>
                <span class="font-bold ${item.status==='완료' ? 'line-through text-[var(--text-sub)] opacity-50' : 'text-[var(--text-main)]'} truncate min-w-0" title="${escapeAttr(item.text)}">${item.text}</span>
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
    if (!text) return;
    window.state.todos.push({ id: 't_' + Date.now(), time, cat, text, status: '진행' });

    const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
    window.state.weekly[todayKey] = window.state.weekly[todayKey] || [];
    window.state.weekly[todayKey].push({ id: 'w_' + Date.now(), time, text });

    renderTodos(); renderWeeklyGrid(); window.syncToCloud();
    document.getElementById('todo-input-bar').value = '';
}

function updateTodoStatus(id, status) {
    const t = window.state.todos.find(item => item.id === id);
    if (t) {
        if (status === '완료' && t.status !== '완료') logTodoCompletion();
        t.status = status;
        renderTodos(); window.syncToCloud();
    }
}

/* 오늘 날짜에 완료 1건을 기록해둔다 (할일이 나중에 삭제돼도 추이 그래프는 남도록,
   현재 목록에서 세는 대신 별도 로그에 누적한다). */
function logTodoCompletion() {
    const key = new Date().toISOString().slice(0, 10);
    window.state.todoCompletionLog = window.state.todoCompletionLog || {};
    window.state.todoCompletionLog[key] = (window.state.todoCompletionLog[key] || 0) + 1;
}

function renderTodoSparkline() {
    const svg = document.getElementById('todo-sparkline');
    if (!svg) return;
    const log = window.state.todoCompletionLog || {};
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(log[d.toISOString().slice(0, 10)] || 0);
    }
    const max = Math.max(1, ...days);
    const w = 56, h = 20, step = w / (days.length - 1);
    const points = days.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join(' ');
    const primary = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#34d399';
    svg.innerHTML = `
        <polyline points="${points}" fill="none" stroke="${primary}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"></polyline>
        <circle cx="${(6 * step).toFixed(1)}" cy="${(h - 2 - (days[6] / max) * (h - 4)).toFixed(1)}" r="2" fill="${primary}"></circle>
    `;
}

function deleteTodo(id) {
    window.state.todos = window.state.todos.filter(t => t.id !== id);
    renderTodos(); window.syncToCloud();
}

function renderProjects() {
    const activeGrid = document.getElementById('active-projects-grid');
    const completedGrid = document.getElementById('completed-projects-grid');
    if (!activeGrid || !completedGrid) return;
    activeGrid.innerHTML = ''; completedGrid.innerHTML = '';

    const activeProjects = window.state.projects.filter(p => !p.completed);
    const completedProjects = window.state.projects.filter(p => p.completed);
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
            <h4 class="font-bold text-base text-[var(--text-main)]">${p.title}</h4>`;
        completedGrid.appendChild(card);
    });

    const overallRate = activeProjects.length > 0 ? Math.round(totalRates / activeProjects.length) : 100;
    const overallBadge = document.getElementById('proj-overall-progress');
    if (overallBadge) overallBadge.innerText = `진척도 ${overallRate}%`;
}

function addNewProject() {
    const title = prompt("새 사역 프로젝트 명칭:");
    if (!title) return;
    window.state.projects.push({ id: 'p_' + Date.now(), title, start: '2026.08.28', end: '2026.09.10', completed: false, subtasks: [{ id: 'st_' + Date.now(), text: '초기 기획 수립', done: false }] });
    renderProjects(); window.syncToCloud();
}

function handleSubTaskEnter(projectId, inputEl, event) {
    if (event.key === 'Enter' && !event.isComposing) {
        const text = inputEl.value.trim();
        if (!text) return;
        const p = window.state.projects.find(item => item.id === projectId);
        if (p) {
            p.subtasks.push({ id: 'st_' + Date.now(), text, done: false });
            inputEl.value = '';
            renderProjects(); window.syncToCloud();
        }
    }
}

function updateSubTaskText(projectId, subtaskId, newText) {
    const p = window.state.projects.find(item => item.id === projectId);
    if (p) {
        const st = p.subtasks.find(s => s.id === subtaskId);
        if (st && newText.trim()) { st.text = newText.trim(); window.syncToCloud(); }
    }
}

function updateProjectTitle(projectId, newTitle) {
    const p = window.state.projects.find(item => item.id === projectId);
    if (p && newTitle.trim()) { p.title = newTitle.trim(); window.syncToCloud(); }
}

function toggleSubTask(projectId, subtaskId) {
    const p = window.state.projects.find(item => item.id === projectId);
    if (p) {
        const st = p.subtasks.find(s => s.id === subtaskId);
        if (st) { st.done = !st.done; renderProjects(); window.syncToCloud(); }
    }
}

function deleteSubTask(projectId, subtaskId) {
    const p = window.state.projects.find(item => item.id === projectId);
    if (p) {
        p.subtasks = p.subtasks.filter(s => s.id !== subtaskId);
        renderProjects(); window.syncToCloud();
    }
}

function toggleProjectComplete(id) {
    const p = window.state.projects.find(item => item.id === id);
    if (p) { p.completed = !p.completed; renderProjects(); window.syncToCloud(); }
}

function deleteProject(id) {
    if (confirm("이 사역을 삭제하시겠습니까?")) {
        window.state.projects = window.state.projects.filter(p => p.id !== id);
        renderProjects(); window.syncToCloud();
    }
}

let currentLinkCat = '전체';

function renderLinkBoard() {
    const filterContainer = document.getElementById('link-cat-filter');
    const grid = document.getElementById('link-board-grid');
    if (!grid) return;

    const cats = ['전체', ...new Set(window.state.links.map(l => l.cat))];
    if (!cats.includes(currentLinkCat)) currentLinkCat = '전체';

    if (filterContainer) {
        filterContainer.innerHTML = cats.map(c => `
            <button onclick="filterLinkCat('${c}')" class="link-filter-btn px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ${c === currentLinkCat ? 'primary-badge' : 'text-[var(--text-sub)] bg-[var(--primary-light)]'}">${c === '전체' ? '전체보기' : c}</button>
        `).join('');
    }

    grid.innerHTML = '';
    const filtered = window.state.links.filter(l => currentLinkCat === '전체' || l.cat === currentLinkCat);
    if (filtered.length === 0) {
        grid.innerHTML = `<p class="text-xs text-[var(--text-sub)] col-span-full py-2">등록된 링크가 없습니다. 위에서 추가해보세요.</p>`;
        return;
    }
    filtered.forEach(l => {
        const card = document.createElement('a');
        card.href = l.url;
        card.target = '_blank';
        card.rel = 'noopener';
        card.className = "glass-card p-3.5 flex items-center justify-between gap-2 hover:border-[var(--primary)] transition-all group";
        card.title = l.title;
        card.innerHTML = `
            <div class="min-w-0 flex-1">
                <span class="bookmark-ribbon primary-badge mb-1.5 inline-block">${l.cat}</span>
                <h4 class="font-bold text-sm text-[var(--text-main)] line-clamp-2 min-w-0">${l.title}</h4>
            </div>
            <button onclick="event.preventDefault(); event.stopPropagation(); deleteLink('${l.id}')" class="text-[11px] text-red-400 hover-reveal-action font-bold shrink-0">✕</button>`;
        grid.appendChild(card);
    });
}

function filterLinkCat(cat) {
    currentLinkCat = cat;
    renderLinkBoard();
}

function addLink() {
    const catInput = document.getElementById('link-cat-input');
    const titleInput = document.getElementById('link-title-input');
    const urlInput = document.getElementById('link-url-input');
    const title = titleInput.value.trim();
    let url = urlInput.value.trim();
    const cat = catInput.value.trim() || '기타';
    if (!title || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    window.state.links.push({ id: 'lk_' + Date.now(), cat, title, url });
    renderLinkBoard(); window.syncToCloud();
    catInput.value = ''; titleInput.value = ''; urlInput.value = '';
}

function deleteLink(id) {
    window.state.links = window.state.links.filter(l => l.id !== id);
    renderLinkBoard(); window.syncToCloud();
}

function renderMemos() {
    const list = document.getElementById('memo-archive-list');
    if (!list) return;
    list.innerHTML = '';
    const query = (document.getElementById('memo-search-input')?.value || '').toLowerCase();

    const matched = window.state.memos.filter(m =>
        (currentMemoCat === '전체' || m.cat === currentMemoCat) &&
        (!query || m.title.toLowerCase().includes(query) || m.content.toLowerCase().includes(query))
    );
    if (matched.length === 0) {
        list.innerHTML = `<p class="text-xs text-[var(--text-sub)] px-4 py-6 text-center">${query ? '검색 결과가 없습니다.' : '다음 회의나 메모를 여기에 남겨보세요.'}</p>`;
        return;
    }

    matched.forEach(m => {
        const div = document.createElement('div');
        div.className = "px-4 py-3 bg-[var(--card-bg)] space-y-1 group hover:bg-[var(--primary-light)] transition-colors";
        div.innerHTML = `
            <div class="flex justify-between items-center gap-2">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="text-[10px] primary-badge font-black px-2.5 py-0.5 rounded-full shrink-0">${m.cat}</span>
                    <h4 class="font-bold text-xs text-[var(--text-main)] truncate">${m.title}</h4>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="text-[10px] text-[var(--text-sub)] font-mono-code">${m.date}</span>
                    <button onclick="deleteMemo('${m.id}')" class="text-[11px] text-red-400 hover-reveal-action font-bold">✕</button>
                </div>
            </div>
            <p class="text-xs text-[var(--text-sub)] leading-relaxed whitespace-pre-wrap">${m.content}</p>`;
        list.appendChild(div);
    });
}

function saveTodayMemo() {
    const cat = document.getElementById('memo-cat-select').value;
    const title = document.getElementById('memo-title-input').value.trim() || '회의 및 사역 메모';
    const content = document.getElementById('today-memo-input').value.trim();
    if (!content) return;
    window.state.memos.unshift({ id: 'm_' + Date.now(), cat, title, date: '2026.08.28', content });
    renderMemos(); window.syncToCloud();
    document.getElementById('memo-title-input').value = '';
    document.getElementById('today-memo-input').value = '';
}

function filterMemoCat(cat) {
    currentMemoCat = cat;
    document.querySelectorAll('#memo-cat-filter .memo-filter-btn').forEach(btn => {
        if ((cat==='전체' && btn.innerText==='전체보기') || btn.innerText === cat) {
            btn.className = "memo-filter-btn px-4 py-2 rounded-full text-xs font-black primary-badge whitespace-nowrap";
        } else {
            btn.className = "memo-filter-btn px-4 py-2 rounded-full text-xs font-bold text-[var(--text-sub)] bg-[var(--primary-light)] whitespace-nowrap";
        }
    });
    renderMemos();
}

function deleteMemo(id) {
    window.state.memos = window.state.memos.filter(m => m.id !== id);
    renderMemos(); window.syncToCloud();
}

/* ==========================================================================
   [RESEARCH: TED + 논문 검색]
   ========================================================================== */
async function translateToKorean(text) {
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`);
        const data = await res.json();
        return (data && data.responseData && data.responseData.translatedText) || text;
    } catch (e) {
        return text;
    }
}

const RESEARCH_DEFAULT_QUERIES = ['practical theology preaching', 'youth ministry burnout', 'pastoral care identity', 'biblical counseling forgiveness', 'church community belonging'];

function getTodayResearchQuery() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return RESEARCH_DEFAULT_QUERIES[dayOfYear % RESEARCH_DEFAULT_QUERIES.length];
}

async function searchResearch(queryOverride) {
    const input = document.getElementById('research-query-input');
    const statusEl = document.getElementById('research-status-text');
    const query = queryOverride || (input && input.value.trim());
    if (!query) return;
    if (statusEl) statusEl.innerText = `"${query}" 검색 중...`;
    try {
        const res = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=6`);
        const data = await res.json();
        const items = (data && data.results) || [];
        const translated = await Promise.all(items.map(async (w) => {
            const titleEn = w.title || '(제목 없음)';
            const titleKo = await translateToKorean(titleEn);
            const authors = (w.authorships || []).slice(0, 2).map(a => a.author && a.author.display_name).filter(Boolean).join(', ');
            const year = w.publication_year;
            const url = w.doi || (w.primary_location && w.primary_location.landing_page_url) || w.id;

            let summaryKo = '';
            if (w.abstract_inverted_index) {
                const posWord = [];
                for (const [word, positions] of Object.entries(w.abstract_inverted_index)) {
                    positions.forEach(p => posWord.push([p, word]));
                }
                posWord.sort((a, b) => a[0] - b[0]);
                const fullAbstractEn = posWord.map(pw => pw[1]).join(' ');
                const keySentencesEn = extractiveSummary(fullAbstractEn, 2);
                summaryKo = await translateToKorean(keySentencesEn);
            }
            return { titleKo, titleEn, authors, year, url, summaryKo };
        }));
        liveResearchList = translated;
        renderResearchResults();
        if (statusEl) statusEl.innerText = translated.length > 0 ? `"${query}" 관련 논문 ${translated.length}건 · 카드를 누르면 요약이 펼쳐져요` : `"${query}"에 대한 결과가 없습니다.`;
    } catch (e) {
        if (statusEl) statusEl.innerText = '논문 검색에 실패했습니다. 잠시 후 다시 시도해주세요.';
    }
}

let liveResearchList = [];
let openResearchId = null;

function toggleResearchSummary(id) {
    openResearchId = (openResearchId === id) ? null : id;
    renderResearchResults();
}

function renderResearchResults() {
    const grid = document.getElementById('research-results-grid');
    if (!grid) return;
    grid.innerHTML = '';
    liveResearchList.forEach((p, idx) => {
        const id = 'rs_' + idx;
        const isOpen = openResearchId === id;
        const card = document.createElement('div');
        card.className = "glass-card p-4 border-l-4 border-l-sky-500 transition-all";
        const summaryId = `research-summary-${id}`;
        const summaryHtml = (isOpen && p.summaryKo) ? `
            <div id="${summaryId}" class="mt-2.5 pt-2.5 border-t border-[var(--border-color)] space-y-1.5">
                <span class="text-[10px] font-bold text-[var(--primary)] block">📄 논문 요약:</span>
                <p class="text-xs text-[var(--text-main)] font-medium leading-relaxed">${p.summaryKo}</p>
            </div>` : '';
        const toggleAttrs = p.summaryKo ? `role="button" tabindex="0" aria-expanded="${isOpen}" aria-controls="${summaryId}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); toggleResearchSummary('${id}');}"` : '';
        card.innerHTML = `
            <div class="flex flex-col gap-1.5 cursor-pointer focus:outline focus:outline-2 focus:outline-[var(--primary)] focus:outline-offset-2 rounded-lg" ${toggleAttrs} onclick="toggleResearchSummary('${id}')">
                <div class="flex items-center justify-between gap-2">
                    <span class="text-[9px] font-mono-code font-bold primary-badge px-2 py-0.5 rounded-full w-fit">PAPER${p.year ? ' · ' + p.year : ''}</span>
                    <a href="${p.url}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="text-[10px] font-mono-code text-[var(--text-sub)] hover:text-[var(--primary)] font-bold shrink-0">원문 ↗</a>
                </div>
                <h4 class="font-bold text-xs text-[var(--text-main)] leading-snug">${p.titleKo}</h4>
                <span class="text-[10px] text-[var(--text-sub)] truncate">${p.titleEn}${p.authors ? ' · ' + p.authors : ''}</span>
                ${p.summaryKo ? `<span class="text-[9px] text-[var(--primary)] font-bold mt-0.5">${isOpen ? '요약 접기 ▲' : '요약 보기 ▼'}</span>` : ''}
            </div>${summaryHtml}`;
        grid.appendChild(card);
    });
}

function openTedSearch() {
    const input = document.getElementById('research-query-input');
    const query = (input && input.value.trim()) || getTodayResearchQuery();
    window.open(`https://www.ted.com/search?q=${encodeURIComponent(query)}`, '_blank');
}

/* ==========================================================================
   [STUDY ROOM ARCHIVE & MODAL]
   ========================================================================== */
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
    if (!grid) return;
    grid.innerHTML = '';

    window.state.thoughts.forEach(th => {
        const stage = th.stage || '씨앗';
        let stageDot = '🌱';
        if (stage === '숙성') stageDot = '📖';
        if (stage === '결실') stageDot = '✨';

        const createdText = th.createdAt || '2026.08.28 15:58';
        const isModified = th.updatedAt && th.updatedAt !== th.createdAt;
        const modifiedText = isModified ? `<span class="text-[9px] text-[var(--text-sub)] opacity-75 font-mono-code font-bold">· 수정 ${th.updatedAt.split(' ')[1]}</span>` : '';

        const div = document.createElement('div');
        div.className = "glass-card p-6 space-y-4 cursor-pointer hover:border-[var(--primary)] transition-all flex flex-col justify-between group";
        div.onclick = function() { openThoughtModal(th.id); };
        div.innerHTML = `
            <div>
                <div class="flex justify-between items-center mb-1">
                    <div class="flex items-center gap-2 overflow-hidden">
                        <span class="bookmark-ribbon primary-badge">${stageDot} #${th.cat || '서재'}</span>
                        <span class="text-[10px] font-mono-code text-[var(--text-sub)] font-bold shrink-0">${createdText}</span>
                        ${modifiedText}
                    </div>
                    <button onclick="event.stopPropagation(); deleteThought('${th.id}')" class="text-[11px] text-red-400 hover-reveal-action font-bold">✕</button>
                </div>
                <h4 contenteditable="true" onclick="event.stopPropagation()" onblur="updateCardThoughtTitle('${th.id}', this.innerText)" class="font-black text-sm text-[var(--text-main)] outline-none border-b border-transparent focus:border-[var(--primary)] cursor-text">${th.title}</h4>
                <div class="mt-3 line-clamp-3 leading-relaxed thought-body font-medium">${th.content}</div>
            </div>
            <button class="text-xs font-bold text-[var(--text-sub)] text-left hover:text-[var(--primary)] pt-2 border-t border-[var(--border-color)]" onclick="event.stopPropagation(); forwardToSermonIdea('${th.id}')">➔ 설교 아이디어로 전송</button>
        `;
        grid.appendChild(div);
    });
}

function updateCardThoughtTitle(id, newTitle) {
    if (!newTitle.trim()) return;
    const t = window.state.thoughts.find(item => item.id === id);
    if (t) {
        t.title = newTitle.trim();
        const now = new Date();
        t.updatedAt = `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        renderThoughts(); window.syncToCloud();
    }
}

function addThoughtCard() {
    const stage = document.getElementById('thought-stage-select').value;
    const title = document.getElementById('thought-title').value.trim();
    const content = document.getElementById('thought-editor-content').innerHTML.trim();
    if (!title || !content) return;
    const now = new Date();
    const timeStr = `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    window.state.thoughts.unshift({ id: 'th_' + Date.now(), cat: '서재기록', stage, title, createdAt: timeStr, updatedAt: timeStr, content });
    renderThoughts(); window.syncToCloud();
    document.getElementById('thought-title').value = '';
    document.getElementById('thought-editor-content').innerHTML = '';
}

function openThoughtModal(id) {
    currentActiveThoughtId = id;
    const thought = window.state.thoughts.find(t => t.id === id);
    if (!thought) return;
    document.getElementById('modal-tag').innerText = `#${thought.cat || '서재'}`;
    document.getElementById('modal-thought-stage-select').value = thought.stage || '씨앗';
    document.getElementById('modal-thought-title').innerText = thought.title;
    document.getElementById('modal-text').innerHTML = thought.content;
    document.getElementById('thought-modal').classList.add('show');
}

function closeThoughtModal() {
    if (currentActiveThoughtId) {
        const titleEl = document.getElementById('modal-thought-title');
        const contentEl = document.getElementById('modal-text');
        const stageEl = document.getElementById('modal-thought-stage-select');
        if (titleEl && contentEl) {
            const t = window.state.thoughts.find(item => item.id === currentActiveThoughtId);
            if (t) {
                t.title = titleEl.innerText.trim() || t.title;
                t.content = contentEl.innerHTML.trim() || t.content;
                if (stageEl) t.stage = stageEl.value;
                const now = new Date();
                t.updatedAt = `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                renderThoughts(); window.syncToCloud();
            }
        }
    }
    document.getElementById('thought-modal').classList.remove('show');
    currentActiveThoughtId = null;
}

function updateModalThoughtStage(newStage) {
    if (!currentActiveThoughtId) return;
    const t = window.state.thoughts.find(item => item.id === currentActiveThoughtId);
    if (t) {
        t.stage = newStage;
        const now = new Date();
        t.updatedAt = `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        renderThoughts(); window.syncToCloud();
    }
}

function forwardToSermonIdea(id) {
    const thought = window.state.thoughts.find(t => t.id === id);
    if (!thought) return;
    const plainText = thought.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    const formattedIdea = `[서재 착상: ${thought.title}]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 단계: ${thought.stage || '씨앗'}\n🕒 기록: ${thought.createdAt || '2026.08.28 15:58'}\n📜 본문/내용: ${plainText}`;

    window.state.memos.unshift({
        id: 'm_' + Date.now(),
        cat: '설교 아이디어',
        title: `[서재 착상] ${thought.title}`,
        date: '2026.08.28',
        content: formattedIdea
    });
    renderMemos(); window.syncToCloud();
}

function deleteThought(id) {
    window.state.thoughts = window.state.thoughts.filter(t => t.id !== id);
    renderThoughts(); window.syncToCloud();
}

function openFabModal() { document.getElementById('fab-modal').classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function submitFab() {
    const text = document.getElementById('fab-input').value.trim();
    if (!text) return;
    window.state.todos.push({ id: 't_' + Date.now(), time: '12:00', cat: '사역', text, status: '진행' });

    const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
    window.state.weekly[todayKey] = window.state.weekly[todayKey] || [];
    window.state.weekly[todayKey].push({ id: 'w_' + Date.now(), time: '12:00', text });

    renderTodos(); renderWeeklyGrid(); window.syncToCloud();
    closeModal('fab-modal');
}

/* ==========================================================================
   [INITIALIZATION]
   ========================================================================== */
initTheologyNarrative();
fetchLiveNaverNews();
searchResearch(getTodayResearchQuery());
renderWeeklyGrid();
loadGoogleCalendarWeek();
if (typeof switchTheme === 'function') switchTheme(window.state.theme, false);
if (typeof applyThoughtZoomUI === 'function') applyThoughtZoomUI();
renderTodos();
renderHomeTodos();
renderProjects();
renderLinkBoard();
renderMemos();
renderThoughts();
