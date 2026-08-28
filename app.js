/* ==========================================================================
   [CORE ENGINE] Firebase 연동 및 애플리케이션 상태 관리
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
const db = firebase.firestore();
const appDocRef = db.collection('ministry_data').doc('master_workspace');

let state = {
    theme: localStorage.getItem('yc_theme') || 'forest',
    thoughtZoom: parseFloat(localStorage.getItem('yc_thought_zoom')) || 1.0,
    weekly: defaultWeekly,
    todos: defaultTodos,
    projects: defaultProjects,
    memos: [{ id: 'm1', cat: '교회 공통', title: '하반기 목회 계획', date: '2026.08.28', content: '소그룹 모임 장소 재배치 논의 완료.' }],
    thoughts: [{ id: 'th1', cat: '설교착상', stage: '숙성', title: '팀켈러 일과 영성', createdAt: '2026.08.28 15:58', updatedAt: '2026.08.28 15:58', content: '<h1>소명으로서의 일터</h1><p>복음은 우리의 일터를 개인의 야망을 위한 수단에서, 이웃을 섬기고 하나님의 창조 세계를 돌보는 <mark>거룩한 소명의 자리</mark>로 변화시킨다.</p>' }]
};

let currentActiveThoughtId = null;
let activeNewsList = [...masterNaverNewsPool];
let openAccordionId = null;
let activeNarrativeIdx = 0;
let currentMemoCat = '전체';

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

/* ==========================================================================
   [WEATHER & CLOCK] 노르웨이 기상청 수치예보 및 글로벌 시계
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
    if(homeTodayEl) homeTodayEl.innerText = shortToday;
    if(calTodayEl) calTodayEl.innerText = shortToday;
}
setInterval(updateHeroClock, 1000);
updateHeroClock();

/* ==========================================================================
   [THEME & VIEW SWITCHER] 3대 테마 및 통나무집 서재 공간 전환
   ========================================================================== */
function switchTheme(themeName, shouldSync=true) {
    state.theme = themeName;
    const isStudy = document.getElementById('view-assets')?.classList.contains('active');
    document.body.className = 'theme-' + themeName + (isStudy ? ' in-study-room' : '') + ' selection:bg-[var(--primary)] selection:text-[var(--primary-text)]';

    ['burgundy', 'cosmic', 'forest'].forEach(t => {
        const btn = document.getElementById('btn-theme-' + t);
        if(btn) {
            if(t === themeName) btn.className = "px-3 py-1 rounded-full font-bold text-[11px] transition-all theme-btn-active";
            else { btn.className = "px-3 py-1 rounded-full font-bold text-[11px] transition-all text-[var(--text-sub)] hover:text-[var(--primary)]"; btn.style.backgroundColor = 'transparent'; }
        }
    });

    const heroBadge = document.querySelector('.furnace-hero span.tracking-widest');
    const heroDesc = document.querySelector('.furnace-hero p.text-xs');
    const heroContainer = document.querySelector('.furnace-hero');

    if(heroContainer) {
        let aurora = heroContainer.querySelector('.forest-aurora-glow');
        if (!aurora) {
            aurora = document.createElement('div');
            aurora.className = 'forest-aurora-glow';
            heroContainer.prepend(aurora);
        }
    }

    if (themeName === 'forest') {
        if(heroBadge) heroBadge.innerText = "🍃 Sabbath & Sanctuary Forest";
        if(heroDesc) heroDesc.innerText = "“푸른 풀밭과 쉴 만한 물가, 영혼을 소생시키시는 고요한 안식의 숲”";
    } else {
        if(heroBadge) heroBadge.innerText = "Spiritual Furnace Control Tower";
        if(heroDesc) heroDesc.innerText = "“하나님 나라의 꿈이 실제가 되는 영적인 용광로, 끊임없이 두드리라”";
    }

    if(shouldSync) syncToCloud();
}

function switchView(viewId, evt) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.className = "nav-tab px-4 py-2.5 rounded-full text-xs font-bold text-[var(--text-sub)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all whitespace-nowrap");
    document.getElementById('view-' + viewId).classList.add('active');
    
    if(evt && evt.currentTarget) {
        evt.currentTarget.className = "nav-tab px-4 py-2.5 rounded-full text-xs font-black primary-badge transition-all whitespace-nowrap shadow-xs";
    }

    const headerBadge = document.querySelector('header span.primary-badge');
    const headerSub = document.querySelector('header span.text-xs.font-bold');

    let cabinGlow = document.getElementById('cabin-lamp-glow');
    if (!cabinGlow) {
        cabinGlow = document.createElement('div');
        cabinGlow.id = 'cabin-lamp-glow';
        document.body.prepend(cabinGlow);
    }

    let windShimmer = document.getElementById('forest-wind-shimmer');
    if (!windShimmer) {
        windShimmer = document.createElement('div');
        windShimmer.id = 'forest-wind-shimmer';
        document.body.prepend(windShimmer);
    }

    if (viewId === 'assets') {
        document.body.classList.add('in-study-room');
        if(headerBadge) headerBadge.innerText = "🕯️ THE CABIN SANCTUARY";
        if(headerSub) headerSub.innerText = "사역의 소음을 멈추고 말씀과 사색에 머무는 깊은 숲속 서재";
    } else {
        document.body.classList.remove('in-study-room');
        if(headerBadge) headerBadge.innerText = "Control Center";
        if(headerSub) headerSub.innerText = "예수를 닮아가는 남편, 아빠, 목사 '임예창'";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   [THEOLOGY & NEWS] 교회사 내러티브 & 네이버 뉴스 브리프
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

    state.thoughts.unshift({
        id: 'th_' + Date.now(),
        cat: '신학스토리',
        stage: '숙성',
        title: `${item.author} - ${item.era}`,
        createdAt: timeStr,
        updatedAt: timeStr,
        content: content
    });
    renderThoughts();
    syncToCloud();
    closeModal('theology-detail-modal');
}

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

/* ==========================================================================
   [SCHEDULE & TODOS] 주간 일정표 및 오늘의 걸음
   ========================================================================== */
function renderWeeklyGrid() {
    const container = document.getElementById('weekly-grid-view');
    if(!container) return;
    container.innerHTML = '';
    const daysInfo = [
        { key: 'mon', name: '월', date: '8.24' }, { key: 'tue', name: '화', date: '8.25' },
        { key: 'wed', name: '수', date: '8.26' }, { key: 'thu', name: '목', date: '8.27' },
        { key: 'fri', name: '금', date: '8.28', isToday: true }, { key: 'sat', name: '토', date: '8.29' },
        { key: 'sun', name: '일', date: '8.30' }
    ];

    daysInfo.forEach(d => {
        const dayBox = document.createElement('div');
        dayBox.className = `bg-[var(--primary-light)] p-2.5 rounded-2xl space-y-2 flex flex-col h-full ${d.isToday ? 'border-2 border-[var(--primary)] shadow-sm' : 'border border-[var(--border-color)]'}`;
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
        dayBox.innerHTML = `<div class="text-center pb-1 border-b border-[var(--border-color)]"><span class="font-black text-[var(--primary)] block text-xs">${d.name} ${d.isToday ? '📍' : ''}</span><span class="text-[10px] font-mono-code text-[var(--text-sub)] font-bold">${d.date}</span></div><div class="flex-1 space-y-1.5">${schedHtml}</div>`;
        container.appendChild(dayBox);
    });
}

function addQuickScheduleFromHome() {
    const day = document.getElementById('quick-sched-day').value;
    const inputVal = document.getElementById('quick-sched-input').value.trim();
    if(!inputVal) return;
    let time = "10:00", text = inputVal;
    const parts = inputVal.split(' ');
    if(parts.length > 1 && parts[0].includes(':')) { time = parts[0]; text = parts.slice(1).join(' '); }

    state.weekly[day] = state.weekly[day] || [];
    state.weekly[day].push({ id: 'w_' + Date.now(), time, text });

    if (day === 'fri') {
        let inferredCat = '사역';
        if(text.includes('심방')) inferredCat = '심방';
        else if(text.includes('회의')) inferredCat = '회의';
        else if(text.includes('가정')) inferredCat = '가정';
        state.todos.push({ id: 't_' + Date.now(), time, cat: inferredCat, text, status: '진행' });
    }
    renderWeeklyGrid(); renderTodos(); renderHomeTodos(); syncToCloud();
    document.getElementById('quick-sched-input').value = '';
}

function deleteWeekly(day, id) {
    state.weekly[day] = state.weekly[day].filter(i => i.id !== id);
    renderWeeklyGrid(); syncToCloud();
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
    renderTodos(); syncToCloud();
    document.getElementById('todo-input-bar').value = '';
}

function updateTodoStatus(id, status) {
    const t = state.todos.find(item => item.id === id);
    if(t) { t.status = status; renderTodos(); syncToCloud(); }
}

function deleteTodo(id) {
    state.todos = state.todos.filter(t => t.id !== id);
    renderTodos(); syncToCloud();
}

/* ==========================================================================
   [PROJECTS & MEMOS] 사역현황 및 회의록
   ========================================================================== */
function renderProjects() {
    const activeGrid = document.getElementById('active-projects-grid');
    const completedGrid = document.getElementById('completed-projects-grid');
    if(!activeGrid || !completedGrid) return;
    activeGrid.innerHTML = ''; completedGrid.innerHTML = '';

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
            <h4 class="font-bold text-base text-[var(--text-main)]">${p.title}</h4>`;
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
    renderProjects(); syncToCloud();
}

function handleSubTaskEnter(projectId, inputEl, event) {
    if (event.key === 'Enter' && !event.isComposing) {
        const text = inputEl.value.trim();
        if(!text) return;
        const p = state.projects.find(item => item.id === projectId);
        if(p) {
            p.subtasks.push({ id: 'st_' + Date.now(), text, done: false });
            inputEl.value = '';
            renderProjects(); syncToCloud();
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
        renderProjects(); syncToCloud();
    }
}

function toggleProjectComplete(id) {
    const p = state.projects.find(item => item.id === id);
    if(p) { p.completed = !p.completed; renderProjects(); syncToCloud(); }
}

function deleteProject(id) {
    if(confirm("이 사역을 삭제하시겠습니까?")) {
        state.projects = state.projects.filter(p => p.id !== id);
        renderProjects(); syncToCloud();
    }
}

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
            <p class="text-xs text-[var(--text-sub)] leading-relaxed whitespace-pre-wrap">${m.content}</p>`;
        list.appendChild(div);
    });
}

function saveTodayMemo() {
    const cat = document.getElementById('memo-cat-select').value;
    const title = document.getElementById('memo-title-input').value.trim() || '회의 및 사역 메모';
    const content = document.getElementById('today-memo-input').value.trim();
    if(!content) return;
    state.memos.unshift({ id: 'm_' + Date.now(), cat, title, date: '2026.08.28', content });
    renderMemos(); syncToCloud();
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
    renderMemos(); syncToCloud();
}

/* ==========================================================================
   [STUDY ROOM] 생각의 서재 (타임스탬프, 인라인 퇴고, 모달 무음 동기화)
   ========================================================================== */
function adjustThoughtZoom(delta) {
    state.thoughtZoom = Math.max(0.85, Math.min(1.4, state.thoughtZoom + delta));
    applyThoughtZoomUI(); syncToCloud();
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
        if (text.startsWith('# ')) document.execCommand('formatBlock', false, '<h1>');
        else if (text.startsWith('## ')) document.execCommand('formatBlock', false, '<h2>');
        else if (text.startsWith('> ')) document.execCommand('formatBlock', false, '<blockquote>');
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
