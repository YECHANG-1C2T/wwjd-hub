/* ==========================================================================
   [THEME & UI CONTROLLER] 화면 연출, 테마 전환, 앰비언트 조명, 에디터 스타일
   ========================================================================== */

/* 1. 3대 테마 스위처 & 히어로 카드 분위기 연출 */
function switchTheme(themeName, shouldSync = true) {
    if (window.state) window.state.theme = themeName;
    const isStudy = document.getElementById('view-assets')?.classList.contains('active');
    document.body.className = 'theme-' + themeName + (isStudy ? ' in-study-room' : '') + ' selection:bg-[var(--primary)] selection:text-[var(--primary-text)]';

    ['burgundy', 'cosmic', 'forest'].forEach(t => {
        const btn = document.getElementById('btn-theme-' + t);
        if (btn) {
            if (t === themeName) {
                btn.className = "px-3 py-1 rounded-full font-bold text-[11px] transition-all theme-btn-active";
            } else {
                btn.className = "px-3 py-1 rounded-full font-bold text-[11px] transition-all text-[var(--text-sub)] hover:text-[var(--primary)]";
                btn.style.backgroundColor = 'transparent';
            }
        }
    });

    const heroBadge = document.querySelector('.furnace-hero span.tracking-widest');
    const heroDesc = document.querySelector('.furnace-hero p.text-xs');
    const heroContainer = document.querySelector('.furnace-hero');

    if (heroContainer) {
        let aurora = heroContainer.querySelector('.forest-aurora-glow');
        if (!aurora) {
            aurora = document.createElement('div');
            aurora.className = 'forest-aurora-glow';
            heroContainer.prepend(aurora);
        }
    }

    if (themeName === 'forest') {
        if (heroBadge) heroBadge.innerText = "🍃 Sabbath & Sanctuary Forest";
        if (heroDesc) heroDesc.innerText = "“푸른 풀밭과 쉴 만한 물가, 영혼을 소생시키시는 고요한 안식의 숲”";
    } else {
        if (heroBadge) heroBadge.innerText = "Spiritual Furnace Control Tower";
        if (heroDesc) heroDesc.innerText = "“하나님 나라의 꿈이 실제가 되는 영적인 용광로, 끊임없이 두드리라”";
    }

    if (shouldSync && typeof window.syncToCloud === 'function') {
        window.syncToCloud();
    }
}

/* 2. 공간 전환 (View Router) & 통나무집/수목원 앰비언트 제어 */
function switchView(viewId, evt) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => {
        t.className = "nav-tab px-4 py-2.5 rounded-full text-xs font-bold text-[var(--text-sub)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all whitespace-nowrap";
    });

    const targetView = document.getElementById('view-' + viewId);
    if (targetView) targetView.classList.add('active');

    if (evt && evt.currentTarget) {
        evt.currentTarget.className = "nav-tab px-4 py-2.5 rounded-full text-xs font-black primary-badge transition-all whitespace-nowrap shadow-xs";
    }

    const headerBadge = document.querySelector('header span.primary-badge');
    const headerSub = document.querySelector('header span.text-xs.font-bold');

    // 통나무집 오일 램프 호흡 조명 엘리먼트 주입
    let cabinGlow = document.getElementById('cabin-lamp-glow');
    if (!cabinGlow) {
        cabinGlow = document.createElement('div');
        cabinGlow.id = 'cabin-lamp-glow';
        document.body.prepend(cabinGlow);
    }

    // 포레스트 실바람 셰이드 엘리먼트 주입
    let windShimmer = document.getElementById('forest-wind-shimmer');
    if (!windShimmer) {
        windShimmer = document.createElement('div');
        windShimmer.id = 'forest-wind-shimmer';
        document.body.prepend(windShimmer);
    }

    if (viewId === 'assets') {
        document.body.classList.add('in-study-room');
        if (headerBadge) headerBadge.innerText = "🕯️ THE CABIN SANCTUARY";
        if (headerSub) headerSub.innerText = "사역의 소음을 멈추고 말씀과 사색에 머무는 깊은 숲속 서재";
    } else {
        document.body.classList.remove('in-study-room');
        if (headerBadge) headerBadge.innerText = "Control Center";
        if (headerSub) headerSub.innerText = "예수를 닮아가는 남편, 아빠, 목사 '임예창'";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* 3. 생각의 서재 폰트 크기 및 타이포그래피 제어 */
function adjustThoughtZoom(delta) {
    if (!window.state) return;
    window.state.thoughtZoom = Math.max(0.85, Math.min(1.4, window.state.thoughtZoom + delta));
    applyThoughtZoomUI();
    if (typeof window.syncToCloud === 'function') window.syncToCloud();
}

function applyThoughtZoomUI() {
    if (!window.state) return;
    document.documentElement.style.setProperty('--thought-zoom', window.state.thoughtZoom);
    const ind = document.getElementById('font-scale-indicator');
    if (ind) ind.innerText = `${Math.round(window.state.thoughtZoom * 100)}%`;
}

/* 4. 에디터 인라인 마크다운 및 텍스트 선택 툴바 */
function checkSelection() {
    const sel = window.getSelection();
    const toolbar = document.getElementById('selection-toolbar');
    if (!toolbar) return;
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
    const toolbar = document.getElementById('selection-toolbar');
    if (toolbar) toolbar.style.display = 'none';
}

function handleEditorInstantMarkdown(el, event) {
    if (event.key === ' ') {
        const text = el.innerText;
        if (text.startsWith('# ')) document.execCommand('formatBlock', false, '<h1>');
        else if (text.startsWith('## ')) document.execCommand('formatBlock', false, '<h2>');
        else if (text.startsWith('> ')) document.execCommand('formatBlock', false, '<blockquote>');
    }
}