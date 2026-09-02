/* ==========================================================================
   [CORE ENGINE] Firebase 연동 및 상태 관리
   (Firebase 앱 초기화 및 인증 게이트는 auth.js에서 처리)
   ========================================================================== */
const db = firebase.firestore();
const appDocRef = db.collection('ministry_data').doc('master_workspace');

window.state = {
    theme: localStorage.getItem('yc_theme') || 'forest',
    thoughtZoom: parseFloat(localStorage.getItem('yc_thought_zoom')) || 1.0,
    weekly: defaultWeekly,
    todos: defaultTodos,
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

window.syncToCloud = function() {
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
        if (doc.exists) {
            const data = doc.data();
            if (data.weekly) window.state.weekly = data.weekly;
            if (data.todos) window.state.todos = data.todos;
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

const NEWS_CATEGORIES = [
    { key: '정치·정책', query: '정치' },
    { key: '사회·이슈', query: '사회' },
    { key: '노동·경제', query: '경제' },
    { key: 'IT·테크', query: 'IT' },
    { key: '생활·교통', query: '생활' },
    { key: '연예·문화', query: '연예' },
    { key: '스포츠·건강', query: '스포츠' },
    { key: '국제·외교', query: '국제' }
];

async function fetchLiveNaverNews(manual = false) {
    const icon = document.getElementById('news-refresh-icon');
    if (icon && manual) {
        icon.classList.remove('rotate-anim');
        void icon.offsetWidth;
        icon.classList.add('rotate-anim');
    }
    try {
        const results = await Promise.all(NEWS_CATEGORIES.map(async (cat, idx) => {
            try {
                const targetRss = encodeURIComponent(`https://news.google.com/rss/search?q=${encodeURIComponent(cat.query)}&hl=ko&gl=KR&ceid=KR:ko`);
                const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${targetRss}`);
                const data = await res.json();
                const item = data && data.items && data.items[0];
                if (!item) return null;
                const rawTitle = item.title.replace(/<[^>]*>?/gm, '').trim();
                const parts = rawTitle.split(' - ');
                return {
                    id: 'live_n_' + idx,
                    cat: cat.key,
                    title: parts[0],
                    source: parts[1] || '뉴스',
                    url: item.link,
                    summary: [`실시간 헤드라인: ${parts[0]}`, `출처 매체: ${parts[1] || '뉴스 포털'}`]
                };
            } catch (e) {
                return null;
            }
        }));
        const filtered = results.filter(Boolean);
        if (filtered.length > 0) liveNaverNewsList = filtered;
    } catch (e) {}
    renderNewsAccordion();
}

function renderNewsAccordion() {
    const container = document.getElementById('news-accordion-container');
    if (!container) return;
    container.innerHTML = '';
    const list = (liveNaverNewsList.length > 0) ? liveNaverNewsList : [
        { id: 'n1', cat: '사회·정책', title: '1인 가구 청년 고립 방지 맞춤형 안전망 전국 확대', source: '네이버 뉴스', url: 'https://news.naver.com', summary: ['청년 지원 프로그램 가동'] }
    ];

    list.forEach(item => {
        const isOpen = openAccordionId === item.id;
        const div = document.createElement('div');
        div.className = "bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden transition-all shadow-xs";
        let summaryHtml = isOpen ? `
            <div class="px-4 pb-4 pt-2 border-t border-[var(--border-color)] bg-[var(--primary-light)] space-y-2 text-xs">
                <span class="font-bold text-[var(--primary)] block">🔥 실시간 헤드라인 브리프:</span>
                <ul class="list-disc list-inside space-y-1 text-[var(--text-main)] font-medium">${item.summary.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>` : '';

        div.innerHTML = `
            <div class="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--primary-light)] transition-colors" onclick="toggleNewsAccordion('${item.id}')">
                <div class="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                    <span class="text-[10px] font-mono-code font-bold primary-badge px-2 py-0.5 rounded-full shrink-0">${item.cat}</span>
                    <h4 class="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate">${item.title}</h4>
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
        (window.state.weekly[d.key] || []).sort((a,b)=>a.time.localeCompare(b.time)).forEach(item => {
            schedHtml += `
                <div class="bg-[var(--card-bg)] p-1.5 rounded-xl shadow-xs border border-[var(--border-color)] leading-snug group relative">
                    <div class="flex justify-between items-start">
                        <b class="text-[var(--primary)] font-mono-code font-bold text-[10px]">${item.time}</b>
                        <button onclick="deleteWeekly('${d.key}', '${item.id}')" class="text-[9px] text-red-400 hover-reveal-action font-bold">✕</button>
                    </div>
                    <span class="font-bold text-[11px] text-[var(--text-main)] block mt-0.5">${item.text}</span>
                </div>`;
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
    if (pending.length === 0) {
        container.innerHTML = `<p class="text-xs text-[var(--text-sub)] col-span-full py-1">등록된 걸음이 없습니다.</p>`;
        return;
    }
    pending.slice(0, 3).forEach(t => {
        const div = document.createElement('div');
        div.className = "bg-[var(--card-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between group";
        div.innerHTML = `
            <div class="flex items-center gap-2 flex-1 mr-1 overflow-hidden">
                <span class="text-[10px] font-mono-code font-bold text-[var(--primary)] shrink-0">${t.time}</span>
                <span contenteditable="true" onclick="event.stopPropagation()" onblur="updateHomeTodoText('${t.id}', this.innerText)" class="font-bold text-[var(--text-main)] outline-none border-b border-transparent focus:border-[var(--primary)] cursor-text truncate">${t.text}</span>
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
    renderTodos(); window.syncToCloud();
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
    if (!text) return;
    window.state.todos.push({ id: 't_' + Date.now(), time, cat, text, status: '진행' });
    renderTodos(); window.syncToCloud();
    document.getElementById('todo-input-bar').value = '';
}

function updateTodoStatus(id, status) {
    const t = window.state.todos.find(item => item.id === id);
    if (t) { t.status = status; renderTodos(); window.syncToCloud(); }
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
        card.innerHTML = `
            <div class="truncate">
                <span class="bookmark-ribbon primary-badge mb-1.5 inline-block">${l.cat}</span>
                <h4 class="font-bold text-xs text-[var(--text-main)] truncate">${l.title}</h4>
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

    window.state.memos.forEach(m => {
        const matchCat = (currentMemoCat === '전체' || m.cat === currentMemoCat);
        const matchQuery = !query || m.title.toLowerCase().includes(query) || m.content.toLowerCase().includes(query);
        if (!matchCat || !matchQuery) return;

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
   [TGC LIVE BRIEF - 실시간 번역 피드]
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

let liveTgcArticles = [];

async function fetchTgcFeed(manual = false) {
    const icon = document.getElementById('tgc-refresh-icon');
    if (icon && manual) {
        icon.classList.remove('rotate-anim');
        void icon.offsetWidth;
        icon.classList.add('rotate-anim');
    }
    try {
        const targetRss = encodeURIComponent('https://www.thegospelcoalition.org/feed/');
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${targetRss}`);
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
            const items = data.items.slice(0, 8);
            liveTgcArticles = await Promise.all(items.map(async (item, idx) => {
                const titleKo = await translateToKorean(item.title);
                return { id: 'tgc_' + idx, titleKo, titleEn: item.title, url: item.link };
            }));
        }
    } catch (e) {}
    renderTgcFeed();
}

function renderTgcFeed() {
    const container = document.getElementById('tgc-feed-grid');
    if (!container) return;
    container.innerHTML = '';
    if (liveTgcArticles.length === 0) {
        container.innerHTML = `<p class="text-xs text-[var(--text-sub)] col-span-full py-2">불러오는 중...</p>`;
        return;
    }
    liveTgcArticles.forEach(a => {
        const card = document.createElement('a');
        card.href = a.url;
        card.target = '_blank';
        card.rel = 'noopener';
        card.className = "glass-card p-4 flex flex-col gap-2 hover:border-[var(--primary)] transition-all";
        card.innerHTML = `
            <span class="text-[9px] font-mono-code font-bold primary-badge px-2 py-0.5 rounded-full w-fit">TGC</span>
            <h4 class="font-bold text-xs text-[var(--text-main)] leading-snug">${a.titleKo}</h4>
            <span class="text-[10px] text-[var(--text-sub)] truncate">${a.titleEn}</span>
        `;
        container.appendChild(card);
    });
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
        const stage = th.stage || '착상';
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
    document.getElementById('modal-thought-stage-select').value = thought.stage || '착상';
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
    const formattedIdea = `[서재 착상: ${thought.title}]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 단계: ${thought.stage || '착상'}\n🕒 기록: ${thought.createdAt || '2026.08.28 15:58'}\n📜 본문/내용: ${plainText}`;

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
    renderTodos(); window.syncToCloud();
    closeModal('fab-modal');
}

/* ==========================================================================
   [INITIALIZATION]
   ========================================================================== */
initTheologyNarrative();
fetchLiveNaverNews();
fetchTgcFeed();
renderWeeklyGrid();
if (typeof switchTheme === 'function') switchTheme(window.state.theme, false);
if (typeof applyThoughtZoomUI === 'function') applyThoughtZoomUI();
renderTodos();
renderHomeTodos();
renderProjects();
renderLinkBoard();
renderMemos();
renderThoughts();
