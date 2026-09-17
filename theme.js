/* ==========================================================================
   [THEME & UI CONTROLLER] 화면 연출, 테마 전환, 앰비언트 조명, 에디터 스타일
   ========================================================================== */

/* 1. 3대 테마 스위처 & 히어로 카드 분위기 연출 */
function switchTheme(themeName, shouldSync = true) {
    if (themeName === 'waters') themeName = 'noir'; // 물가 테마 폐지 — 예전에 저장된 값 이관
    if (window.state) window.state.theme = themeName;
    const isStudy = document.getElementById('view-assets')?.classList.contains('active');
    document.body.className = 'theme-' + themeName + (isStudy ? ' in-study-room' : '') + ' selection:bg-[var(--primary)] selection:text-[var(--primary-text)]';

    ['burgundy', 'cosmic', 'forest', 'dawn', 'noir'].forEach(t => {
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
        if (heroDesc) heroDesc.innerText = "“그가 나를 푸른 풀밭에 누이시며, 영혼을 소생시키시는 고요한 안식의 숲”";
    } else if (themeName === 'dawn') {
        if (heroBadge) heroBadge.innerText = "🌅 Dawn Prayer Hour";
        if (heroDesc) heroDesc.innerText = "“날이 새기 전에 일어나 부르짖으며, 주의 말씀을 바라는 새벽의 여명”";
    } else if (themeName === 'noir') {
        if (heroBadge) heroBadge.innerText = "⚫ Quiet Discipline";
        if (heroDesc) heroDesc.innerText = "“내가 내 몸을 쳐 복종하게 함은, 고요히 절제하며 나아가는 자의 걸음”";
    } else {
        if (heroBadge) heroBadge.innerText = "Spiritual Furnace Control Tower";
        if (heroDesc) heroDesc.innerText = "“하나님 나라의 꿈이 실제가 되는 영적인 용광로, 끊임없이 두드리라”";
    }

    stopHeroParticles();
    if (themeName === 'noir') startHeroParticles();

    if (shouldSync && typeof window.syncToCloud === 'function') {
        window.syncToCloud();
    }
}

/* 블랙 테마 전용 히어로 배경 — 용광로 GIF 대신, 사역흐름 그래프와 같은
   "점+선 네트워크" 시각 언어를 재사용한 은은한 파티클 배경. 다른 테마에서는
   그리지 않고(캔버스도 숨김), prefers-reduced-motion이면 한 프레임만 그리고
   멈춘다. */
let heroParticleRaf = null;
let heroParticlePoints = [];
let heroParticleResizeBound = false;

function sizeHeroParticleCanvas() {
    const canvas = document.getElementById('hero-particle-canvas');
    const container = canvas ? canvas.closest('.furnace-hero') : null;
    if (!canvas || !container) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 280;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas, ctx, w, h };
}

function seedHeroParticles(w, h) {
    const count = Math.max(24, Math.min(55, Math.round((w * h) / 16000)));
    heroParticlePoints = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22
    }));
}

function drawHeroParticles(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const primary = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#e4e4e7';
    const threshold = 130;
    for (let i = 0; i < heroParticlePoints.length; i++) {
        for (let j = i + 1; j < heroParticlePoints.length; j++) {
            const a = heroParticlePoints[i], b = heroParticlePoints[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < threshold) {
                ctx.strokeStyle = primary;
                ctx.globalAlpha = (1 - dist / threshold) * 0.35;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }
    }
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = primary;
    heroParticlePoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function stepHeroParticles(ctx, w, h) {
    heroParticlePoints.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
    });
    drawHeroParticles(ctx, w, h);
    heroParticleRaf = requestAnimationFrame(() => stepHeroParticles(ctx, w, h));
}

function startHeroParticles() {
    requestAnimationFrame(() => {
        const sized = sizeHeroParticleCanvas();
        if (!sized) return;
        const { canvas, ctx, w, h } = sized;
        seedHeroParticles(w, h);
        canvas.classList.add('ready');

        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            drawHeroParticles(ctx, w, h);
        } else {
            stepHeroParticles(ctx, w, h);
        }

        if (!heroParticleResizeBound) {
            heroParticleResizeBound = true;
            let resizeTimer = null;
            window.addEventListener('resize', () => {
                if (!document.body.classList.contains('theme-noir')) return;
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => { stopHeroParticles(); startHeroParticles(); }, 200);
            });
        }
    });
}

function stopHeroParticles() {
    if (heroParticleRaf) cancelAnimationFrame(heroParticleRaf);
    heroParticleRaf = null;
    const canvas = document.getElementById('hero-particle-canvas');
    if (canvas) {
        canvas.classList.remove('ready');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    /* 히어로 파티클은 홈 화면(furnace-hero)에만 존재하는데, 다른 탭으로
       이동해도 requestAnimationFrame 루프가 멈추지 않고 보이지도 않는
       캔버스를 계속 다시 그리고 있었다 — 탭을 딴 데 두고 있어도 배터리를
       계속 갉아먹는 낭비였다. 홈을 벗어나면 멈추고, 돌아오면 다시 켠다. */
    if (viewId === 'home' && document.body.classList.contains('theme-noir')) {
        if (typeof startHeroParticles === 'function') startHeroParticles();
    } else if (typeof stopHeroParticles === 'function') {
        stopHeroParticles();
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