// ============================================
// LearnEasy - Dark Theme App Logic
// ============================================

// -- Data --
let langData = {};
let quizData = {};
let knownLang = '';
let learnLang = '';

// -- DOM refs --
const onboardingScreen = document.getElementById('onboardingScreen');
const dashboard = document.getElementById('dashboard');

// ============================================
// ONBOARDING
// ============================================

function setupOnboarding() {
    const knownSelect = document.getElementById('knownLang');
    const learnSelect = document.getElementById('learnLang');
    const continueBtn = document.getElementById('continueBtn');
    const errorMsg = document.getElementById('errorMsg');

    continueBtn.addEventListener('click', () => {
        const known = knownSelect.value;
        const learn = learnSelect.value;

        // validation
        if (!known || !learn) {
            errorMsg.textContent = 'Please select both languages.';
            return;
        }
        if (known === learn) {
            errorMsg.textContent = 'Both languages cannot be the same!';
            return;
        }

        errorMsg.textContent = '';

        // save to localStorage
        const selection = { knownLanguage: known, learningLanguage: learn };
        localStorage.setItem('learnEasy_languages', JSON.stringify(selection));

        // go to dashboard
        startDashboard(known, learn);
    });
}

function startDashboard(known, learn) {
    knownLang = known;
    learnLang = learn;

    onboardingScreen.style.display = 'none';
    dashboard.style.display = 'block';

    // update banner
    const knownInfo = langData[known];
    const learnInfo = langData[learn];
    document.getElementById('langBanner').innerHTML =
        `Learning: <strong>${learnInfo.flag} ${learnInfo.name}</strong> &nbsp;|&nbsp; Known: <strong>${knownInfo.flag} ${knownInfo.name}</strong>`;

    // render content
    renderAlphabets();
    renderWords();
    renderSentences();
    updateUIFromProgress();
    setupDashboardEvents();
}

// ============================================
// INITIALIZATION
// ============================================

async function initApp() {
    try {
        const [langRes, quizRes] = await Promise.all([
            fetch('/data/languages.json'),
            fetch('/data/quiz.json')
        ]);

        langData = await langRes.json();
        quizData = await quizRes.json();

        setupOnboarding();

        // check if user already selected languages
        const saved = localStorage.getItem('learnEasy_languages');
        if (saved) {
            const { knownLanguage, learningLanguage } = JSON.parse(saved);
            if (langData[knownLanguage] && langData[learningLanguage]) {
                startDashboard(knownLanguage, learningLanguage);
                return;
            }
        }

        // show onboarding
        onboardingScreen.style.display = 'flex';

    } catch (err) {
        console.error('Error loading data:', err);
    }
}

// ============================================
// NAVIGATION
// ============================================

function showSection(sectionId) {
    const progress = getProgress();

    if (sectionId === 'words' && !progress.alphabets) {
        alert('Complete the Alphabets section first to unlock Words!');
        return;
    }
    if (sectionId === 'sentences' && !progress.words) {
        alert('Complete the Words section first to unlock Sentences!');
        return;
    }

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('section-' + sectionId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');

    closeMobileSidebar();
}

function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============================================
// LOCALSTORAGE
// ============================================

function getProgress() {
    const saved = localStorage.getItem('learnEasy_progress');
    return saved ? JSON.parse(saved) : { alphabets: false, words: false, sentences: false };
}

function saveProgress(progress) {
    localStorage.setItem('learnEasy_progress', JSON.stringify(progress));
}

function getScores() {
    const saved = localStorage.getItem('learnEasy_scores');
    return saved ? JSON.parse(saved) : { alphabets: null, words: null, sentences: null };
}

function saveScores(scores) {
    localStorage.setItem('learnEasy_scores', JSON.stringify(scores));
}

// ============================================
// UPDATE UI FROM PROGRESS
// ============================================

function updateUIFromProgress() {
    const progress = getProgress();
    const scores = getScores();

    // nav locks
    const navWords = document.getElementById('nav-words');
    const navSentences = document.getElementById('nav-sentences');
    const lockWords = document.getElementById('lock-words');
    const lockSentences = document.getElementById('lock-sentences');

    if (progress.alphabets) {
        navWords.classList.remove('locked');
        lockWords.style.display = 'none';
    } else {
        navWords.classList.add('locked');
        lockWords.style.display = 'inline';
    }

    if (progress.words) {
        navSentences.classList.remove('locked');
        lockSentences.style.display = 'none';
    } else {
        navSentences.classList.add('locked');
        lockSentences.style.display = 'inline';
    }

    // home step cards
    updateStepCard('alphabets', progress.alphabets, true);
    updateStepCard('words', progress.words, progress.alphabets);
    updateStepCard('sentences', progress.sentences, progress.words);

    // home progress bar
    const completedCount = [progress.alphabets, progress.words, progress.sentences].filter(Boolean).length;
    const percent = Math.round((completedCount / 3) * 100);
    document.getElementById('homeProgressFill').style.width = percent + '%';
    document.getElementById('homeProgressText').textContent = percent + '% completed';

    // complete buttons
    if (progress.alphabets) { disableCompleteBtn('completeAlphabets'); }
    if (progress.words) { disableCompleteBtn('completeWords'); }
    if (progress.sentences) { disableCompleteBtn('completeSentences'); }

    // progress page
    updateProgressPage(progress, scores);
}

function disableCompleteBtn(id) {
    const btn = document.getElementById(id);
    btn.textContent = '✅ Completed';
    btn.disabled = true;
}

function updateStepCard(section, isCompleted, isUnlocked) {
    const el = document.getElementById('status-' + section);
    if (!el) return;
    if (isCompleted) {
        el.textContent = '✅ Completed';
        el.className = 'step-status completed';
    } else if (isUnlocked) {
        el.textContent = 'Available';
        el.className = 'step-status unlocked';
    } else {
        el.textContent = '🔒 Locked';
        el.className = 'step-status';
    }
}

function updateProgressPage(progress, scores) {
    const completedCount = [progress.alphabets, progress.words, progress.sentences].filter(Boolean).length;
    const percent = Math.round((completedCount / 3) * 100);
    const degrees = (percent / 100) * 360;
    document.getElementById('progressCircle').style.background =
        `conic-gradient(var(--accent) ${degrees}deg, var(--surface) ${degrees}deg)`;
    document.getElementById('progressPercent').textContent = percent + '%';

    const sections = ['alphabets', 'words', 'sentences'];
    sections.forEach((sec, i) => {
        const el = document.getElementById('prog-' + sec);
        if (!el) return;
        if (progress[sec]) {
            el.textContent = '✅ Completed';
            el.className = 'progress-status completed';
        } else if (i === 0 || progress[sections[i - 1]]) {
            el.textContent = 'Available';
            el.className = 'progress-status unlocked';
        } else {
            el.textContent = '🔒 Locked';
            el.className = 'progress-status';
        }
    });

    sections.forEach(sec => {
        const scoreEl = document.getElementById('score-' + sec);
        if (scoreEl) {
            scoreEl.textContent = scores[sec] !== null ? scores[sec] + '%' : '--';
        }
    });
}

// ============================================
// RENDER CONTENT (multi-language)
// ============================================

function renderAlphabets() {
    const grid = document.getElementById('alphabetsGrid');
    grid.innerHTML = '';

    const learnData = langData[learnLang];
    document.getElementById('alphaDesc').textContent =
        `Learn the ${learnData.name} script — each letter with its pronunciation.`;

    learnData.alphabets.forEach(item => {
        const card = document.createElement('div');
        card.className = 'alpha-card';
        card.innerHTML = `
      <div class="alpha-letter">${item.letter}</div>
      <div class="alpha-pronunciation">/${item.pronunciation}/</div>
    `;
        grid.appendChild(card);
    });
}

function renderWords(filterCategory = 'All') {
    const grid = document.getElementById('wordsGrid');
    const filterBar = document.getElementById('wordFilter');
    grid.innerHTML = '';

    const knownWords = langData[knownLang].words;
    const learnWords = langData[learnLang].words;

    // build filters once
    if (filterBar.children.length === 0) {
        const categories = ['All', ...new Set(knownWords.map(w => w.category))];
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn' + (cat === 'All' ? ' active' : '');
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderWords(cat);
            });
            filterBar.appendChild(btn);
        });
    }

    const maxLen = Math.min(knownWords.length, learnWords.length);
    for (let i = 0; i < maxLen; i++) {
        if (filterCategory !== 'All' && knownWords[i].category !== filterCategory) continue;

        const card = document.createElement('div');
        card.className = 'word-card';
        card.innerHTML = `
      <div class="word-known">${knownWords[i].word}</div>
      <div class="word-arrow">↓</div>
      <div class="word-learn">${learnWords[i].word}</div>
      <div class="word-category">${knownWords[i].category}</div>
    `;
        grid.appendChild(card);
    }
}

function renderSentences() {
    const grid = document.getElementById('sentencesGrid');
    grid.innerHTML = '';

    const knownSent = langData[knownLang].sentences;
    const learnSent = langData[learnLang].sentences;

    const maxLen = Math.min(knownSent.length, learnSent.length);
    for (let i = 0; i < maxLen; i++) {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.innerHTML = `
      <div class="sentence-known">${knownSent[i].sentence}</div>
      <div class="sentence-learn">${learnSent[i].sentence}</div>
      <span class="sentence-context">${knownSent[i].context}</span>
    `;
        grid.appendChild(card);
    }
}

// ============================================
// QUIZ
// ============================================

let currentQuizSection = null;
let userAnswers = {};

function loadQuiz(section) {
    currentQuizSection = section;
    userAnswers = {};

    const container = document.getElementById('quizContainer');
    const actions = document.getElementById('quizActions');
    const results = document.getElementById('quizResults');
    container.innerHTML = '';
    results.style.display = 'none';
    results.innerHTML = '';
    actions.style.display = 'block';

    document.querySelectorAll('.quiz-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-quiz="${section}"]`).classList.add('active');

    // use quizzes for the learning language
    const questions = quizData[learnLang] && quizData[learnLang][section];
    if (!questions || questions.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No questions available for this section.</p>';
        actions.style.display = 'none';
        return;
    }

    questions.forEach((q, idx) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'quiz-question';

        let optionsHTML = '';
        q.options.forEach(opt => {
            optionsHTML += `
        <div class="quiz-option" data-question="${idx}" data-value="${opt}">
          <span>○</span> ${opt}
        </div>
      `;
        });

        qDiv.innerHTML = `
      <h4><span class="q-number">Q${idx + 1}.</span> ${q.question}</h4>
      <div class="quiz-options">${optionsHTML}</div>
    `;
        container.appendChild(qDiv);
    });

    container.querySelectorAll('.quiz-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const qIdx = opt.dataset.question;
            container.querySelectorAll(`[data-question="${qIdx}"]`).forEach(o => {
                o.classList.remove('selected');
                o.querySelector('span').textContent = '○';
            });
            opt.classList.add('selected');
            opt.querySelector('span').textContent = '●';
            userAnswers[qIdx] = opt.dataset.value;
        });
    });
}

function submitQuiz() {
    if (!currentQuizSection) return;

    const questions = quizData[learnLang][currentQuizSection];
    let correct = 0;

    questions.forEach((q, idx) => {
        const options = document.querySelectorAll(`[data-question="${idx}"]`);
        options.forEach(opt => {
            opt.style.pointerEvents = 'none';
            if (opt.dataset.value === q.answer) {
                opt.classList.add('correct');
                opt.querySelector('span').textContent = '✓';
            }
            if (userAnswers[idx] === opt.dataset.value && opt.dataset.value !== q.answer) {
                opt.classList.add('incorrect');
                opt.querySelector('span').textContent = '✗';
            }
        });
        if (userAnswers[idx] === q.answer) correct++;
    });

    const scorePercent = Math.round((correct / questions.length) * 100);

    const scores = getScores();
    scores[currentQuizSection] = scorePercent;
    saveScores(scores);

    const results = document.getElementById('quizResults');
    const actions = document.getElementById('quizActions');
    actions.style.display = 'none';

    let message = '', barClass = '';
    if (scorePercent >= 80) { message = '🎉 Excellent work!'; barClass = 'good'; }
    else if (scorePercent >= 60) { message = '👍 Good job! Keep practicing!'; barClass = 'average'; }
    else { message = '📚 Keep learning! Try again.'; barClass = 'poor'; }

    results.innerHTML = `
    <div class="result-score">${correct}/${questions.length}</div>
    <p class="result-message">${message}</p>
    <div class="result-bar"><div class="result-bar-fill ${barClass}" style="width:${scorePercent}%"></div></div>
    <p style="color:var(--text-muted);font-size:0.85rem;">Score: ${scorePercent}%</p>
  `;
    results.style.display = 'block';
    updateUIFromProgress();
}

// ============================================
// DICTIONARY
// ============================================

function searchDictionary(query) {
    const resultsDiv = document.getElementById('dictResults');
    resultsDiv.innerHTML = '';

    if (!query.trim()) {
        resultsDiv.innerHTML = '<p class="placeholder-text">Start typing to search for words…</p>';
        return;
    }

    const lowerQuery = query.toLowerCase();
    const knownWords = langData[knownLang].words;
    const learnWords = langData[learnLang].words;

    const matches = [];
    const maxLen = Math.min(knownWords.length, learnWords.length);
    for (let i = 0; i < maxLen; i++) {
        if (knownWords[i].word.toLowerCase().includes(lowerQuery) ||
            learnWords[i].word.toLowerCase().includes(lowerQuery)) {
            matches.push({ known: knownWords[i], learn: learnWords[i] });
        }
    }

    if (matches.length === 0) {
        resultsDiv.innerHTML = `<p class="placeholder-text">No results found for "${query}".</p>`;
        return;
    }

    matches.forEach(m => {
        const div = document.createElement('div');
        div.className = 'dict-entry';
        div.innerHTML = `
      <div class="dict-known">${m.known.word}</div>
      <div class="dict-arrow">↓</div>
      <div class="dict-learn">${m.learn.word}</div>
      <div class="dict-category">${m.known.category}</div>
    `;
        resultsDiv.appendChild(div);
    });
}

// ============================================
// SECTION COMPLETION
// ============================================

function completeSection(section) {
    const progress = getProgress();
    progress[section] = true;
    saveProgress(progress);
    updateUIFromProgress();

    const nextMap = { alphabets: 'Words', words: 'Sentences', sentences: null };
    const next = nextMap[section];
    if (next) {
        alert(`Great job! 🎉 You completed ${section.charAt(0).toUpperCase() + section.slice(1)}!\n\nThe ${next} section is now unlocked!`);
    } else {
        alert('Congratulations! 🎉 You completed all learning sections!');
    }
}

// ============================================
// DASHBOARD EVENTS
// ============================================

function setupDashboardEvents() {
    // nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (link.classList.contains('locked')) {
                alert('This section is locked. Complete previous sections first!');
                return;
            }
            showSection(link.dataset.section);
        });
    });

    // mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    });

    document.getElementById('sidebarOverlay').addEventListener('click', closeMobileSidebar);

    // complete buttons
    document.getElementById('completeAlphabets').addEventListener('click', () => completeSection('alphabets'));
    document.getElementById('completeWords').addEventListener('click', () => completeSection('words'));
    document.getElementById('completeSentences').addEventListener('click', () => completeSection('sentences'));

    // quiz tabs
    document.querySelectorAll('.quiz-tab').forEach(tab => {
        tab.addEventListener('click', () => loadQuiz(tab.dataset.quiz));
    });

    // submit quiz
    document.getElementById('submitQuiz').addEventListener('click', submitQuiz);

    // dictionary search
    document.getElementById('dictSearch').addEventListener('input', (e) => {
        searchDictionary(e.target.value);
    });

    // change language
    document.getElementById('changeLangBtn').addEventListener('click', () => {
        if (confirm('Change languages? Your progress will be kept.')) {
            localStorage.removeItem('learnEasy_languages');
            location.reload();
        }
    });

    // reset progress
    document.getElementById('resetProgress').addEventListener('click', () => {
        if (confirm('Reset all progress? This cannot be undone.')) {
            localStorage.removeItem('learnEasy_progress');
            localStorage.removeItem('learnEasy_scores');
            location.reload();
        }
    });
}

// -- Start --
document.addEventListener('DOMContentLoaded', initApp);
