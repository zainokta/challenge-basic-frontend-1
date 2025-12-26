class TypingTest {
    constructor() {
        this.data = null;
        this.currentText = "";
        this.difficulty = "hard";
        this.mode = "timed"; // timed or passage
        this.timer = 0;
        this.maxTime = 60;
        this.interval = null;
        this.isActive = false;
        this.startTime = null;
        this.typedCount = 0;
        this.errorsCount = 0;
        this.userInput = "";
        this.personalBest = parseInt(localStorage.getItem('personalBest')) || 0;

        // DOM Elements
        this.typingArea = document.getElementById('typing-area');
        this.typingContainer = document.getElementById('typing-container');
        this.cursor = document.getElementById('cursor');
        this.wpmDisplay = document.getElementById('wpm');
        this.accuracyDisplay = document.getElementById('accuracy');
        this.timeDisplay = document.getElementById('time');
        this.pbDisplay = document.getElementById('personal-best');
        this.startOverlay = document.getElementById('start-overlay');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.difficultyBtns = document.querySelectorAll('.diff-btn');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.currentDifficultyDisplay = document.getElementById('current-difficulty');
        this.currentModeDisplay = document.getElementById('current-mode');
        this.focusError = document.getElementById('focus-error');

        // Results Modal Elements
        this.resultsModal = document.getElementById('results-modal');
        this.resultsContent = document.getElementById('results-content');
        this.resultWpm = document.getElementById('result-wpm');
        this.resultAccuracy = document.getElementById('result-accuracy');
        this.resultTyped = document.getElementById('result-typed');
        this.resultErrors = document.getElementById('result-errors');
        this.resultPbBadge = document.getElementById('result-pb-badge');
        this.modalRestartBtn = document.getElementById('modal-restart-btn');

        this.init();
    }

    init() {
        // Use global data from data.js
        if (window.TYPING_DATA) {
            this.data = window.TYPING_DATA;
            this.pbDisplay.textContent = `${this.personalBest} WPM`;
            this.setupEventListeners();

            // Initial state
            this.typingArea.innerHTML = "Loading your test...";
            this.resetTest();
        } else {
            console.error('Failed to load typing data: window.TYPING_DATA is missing.');
            this.typingArea.innerHTML = "Error loading data. Please ensure data.js is included.";
        }
    }

    setupEventListeners() {
        // Typing input
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Start button
        this.startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startTest();
        });

        // Restart buttons
        this.restartBtn.addEventListener('click', () => this.resetTest());
        this.modalRestartBtn.addEventListener('click', () => this.resetTest());

        // Difficulty selection
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficultyBtns.forEach(b => b.classList.remove('active'));
                // Find and activate all buttons with the same difficulty (both desktop and mobile)
                document.querySelectorAll(`.diff-btn[data-diff="${btn.dataset.diff}"]`).forEach(b => b.classList.add('active'));
                
                this.difficulty = btn.dataset.diff;
                if (this.currentDifficultyDisplay) {
                    this.currentDifficultyDisplay.textContent = btn.textContent;
                }
                
                // Close dropdown by blurring (only applies to mobile dropdown structure)
                const dropdown = btn.closest('.group');
                if (dropdown) dropdown.blur();
                
                this.resetTest();
            });
        });

        // Mode selection
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.modeBtns.forEach(b => b.classList.remove('active'));
                // Find and activate all buttons with the same mode (both desktop and mobile)
                document.querySelectorAll(`.mode-btn[data-mode="${btn.dataset.mode}"]`).forEach(b => b.classList.add('active'));
                
                this.mode = btn.dataset.mode;
                if (this.currentModeDisplay) {
                    this.currentModeDisplay.textContent = btn.textContent;
                }
                
                // Close dropdown by blurring (only applies to mobile dropdown structure)
                const dropdown = btn.closest('.group');
                if (dropdown) dropdown.blur();
                
                this.resetTest();
            });
        });

        // Focus handling
        this.typingContainer.addEventListener('click', () => {
            if (this.resultsModal && !this.resultsModal.classList.contains('hidden')) return;
            this.startOverlay.style.opacity = '0';
            setTimeout(() => this.startOverlay.classList.add('hidden'), 300);
            this.focusError.classList.add('hidden');
        });

        window.addEventListener('blur', () => {
            if (this.isActive) this.focusError.classList.remove('hidden');
        });

        window.addEventListener('focus', () => {
            this.focusError.classList.add('hidden');
        });
    }

    getRandomText() {
        const pool = this.data[this.difficulty];
        const item = pool[Math.floor(Math.random() * pool.length)];
        return item.text;
    }

    renderText() {
        const fragment = document.createDocumentFragment();
        this.currentText.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.className = 'char';
            span.id = `char-${index}`;
            fragment.appendChild(span);
        });
        this.typingArea.innerHTML = "";
        this.typingArea.appendChild(fragment);
        this.updateCursor();
    }

    resetTest(preserveState = false) {
        if (!preserveState) {
            clearInterval(this.interval);
            this.isActive = false;
            this.timer = this.mode === 'timed' ? this.maxTime : 0;
            this.typedCount = 0;
            this.errorsCount = 0;
            this.startTime = null;
            this.wpmDisplay.textContent = "0";
            this.accuracyDisplay.textContent = "0%";
            this.accuracyDisplay.className = 'stat-value-inline text-red-500';
            this.updateTimeDisplay();
            this.resultsModal.classList.add('hidden');
            this.resultsContent.classList.add('scale-90');
            this.startOverlay.classList.remove('hidden');
            this.startOverlay.style.opacity = '1';
            this.typingArea.style.opacity = '1';
        }

        this.userInput = "";
        this.currentText = this.getRandomText();
        this.renderText();
        this.cursor.classList.add('hidden');
        if (this.isActive) {
            this.cursor.classList.remove('hidden');
            this.updateCursor(); 
        }
    }

    updateTimeDisplay() {
        const mins = Math.floor(Math.abs(this.timer) / 60);
        const secs = Math.abs(this.timer) % 60;
        this.timeDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    startTest() {
        if (this.isActive) return;
        this.isActive = true;
        this.startTime = Date.now();
        this.cursor.classList.remove('hidden');
        this.startOverlay.classList.add('hidden');

        this.interval = setInterval(() => {
            if (this.mode === 'timed') {
                this.timer--;
                if (this.timer <= 0) this.finishTest();
            } else {
                this.timer++;
            }
            this.updateTimeDisplay();
            this.calculateStats();
        }, 1000);
    }

    handleKeyDown(e) {
        if (e.key === 'Tab' || e.key === 'Escape') {
            e.preventDefault();
            this.resetTest();
            return;
        }

        // Start test on first keypress
        if (!this.isActive && this.resultsModal.classList.contains('hidden')) {
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                this.startTest();
            } else {
                return;
            }
        }

        if (!this.isActive) return;

        if (e.key === 'Backspace') {
            if (this.userInput.length > 0) {
                const index = this.userInput.length - 1;
                const charSpan = document.getElementById(`char-${index}`);
                if (charSpan) {
                    charSpan.classList.remove('correct', 'incorrect', 'extra');
                }
                this.userInput = this.userInput.slice(0, -1);
            }
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            const index = this.userInput.length;
            if (index < this.currentText.length) {
                const charSpan = document.getElementById(`char-${index}`);
                const expected = this.currentText[index];

                if (e.key === expected) {
                    charSpan.classList.add('correct');
                } else {
                    charSpan.classList.add('incorrect');
                    this.errorsCount++;
                }
                this.userInput += e.key;
                this.typedCount++;
            }

            // Check if finished current sentence
            if (this.userInput.length === this.currentText.length) {
                if (this.mode === 'passage') {
                    this.finishTest();
                } else {
                    // Timed mode - load next sentence without resetting stats
                    this.resetTest(true);
                }
            }
        }

        this.updateCursor();
        this.calculateStats();
    }

    updateCursor() {
        const index = this.userInput.length;
        const charSpan = document.getElementById(`char-${index}`);

        if (charSpan) {
            const rect = charSpan.getBoundingClientRect();
            const containerRect = this.typingContainer.getBoundingClientRect();

            this.cursor.style.left = `${rect.left - containerRect.left}px`;
            this.cursor.style.top = `${rect.top - containerRect.top}px`;
            this.cursor.classList.remove('hidden');
        } else {
            this.cursor.classList.add('hidden');
        }
    }

    calculateStats() {
        if (!this.startTime) return { wpm: 0, accuracy: 100 };

        const timeElapsedSeconds = (Date.now() - this.startTime) / 1000;
        if (timeElapsedSeconds <= 0.1) return { wpm: 0, accuracy: 100 };

        const minutes = timeElapsedSeconds / 60;
        // WPM = (Characters / 5) / minutes
        const wpm = Math.round((this.typedCount / 5) / minutes) || 0;

        const accuracy = this.typedCount > 0
            ? Math.round(((this.typedCount - this.errorsCount) / this.typedCount) * 100)
            : 100;

        this.wpmDisplay.textContent = wpm;
        this.accuracyDisplay.textContent = `${accuracy}%`;

        if (accuracy < 80) this.accuracyDisplay.className = 'stat-value-inline text-red-500';
        else if (accuracy < 95) this.accuracyDisplay.className = 'stat-value-inline text-yellow-500';
        else this.accuracyDisplay.className = 'stat-value-inline text-green-500';

        return { wpm, accuracy };
    }

    finishTest() {
        clearInterval(this.interval);
        this.isActive = false;
        this.cursor.classList.add('hidden');

        const stats = this.calculateStats();
        const wpm = stats.wpm;
        const accuracy = stats.accuracy;

        // PB Logic
        let isNewPb = false;
        if (wpm > this.personalBest) {
            this.personalBest = wpm;
            localStorage.setItem('personalBest', this.personalBest);
            this.pbDisplay.textContent = `${this.personalBest} WPM`;
            isNewPb = true;
        }

        // Show Results Modal
        this.resultWpm.textContent = wpm;
        this.resultAccuracy.textContent = `${accuracy}%`;
        this.resultTyped.textContent = this.typedCount;
        this.resultErrors.textContent = this.errorsCount;

        if (isNewPb) {
            this.resultPbBadge.classList.remove('hidden');
        } else {
            this.resultPbBadge.classList.add('hidden');
        }

        this.resultsModal.classList.remove('hidden');
        setTimeout(() => {
            this.resultsContent.classList.remove('scale-90');
        }, 10);

        this.typingArea.style.opacity = '0.3';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TypingTest();
});
