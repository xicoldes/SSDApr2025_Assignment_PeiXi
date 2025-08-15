// Nostromo Terminal JavaScript
class NostromoTerminal {
    constructor() {
        this.API_BASE = 'http://localhost:3000';
        this.currentUser = null;
        this.authToken = this.getStoredToken() || null;
        this.currentPage = 1;
        this.currentSection = 'login';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSystemTime();
        this.checkAuthStatus();
        
        // Update time every second
        setInterval(() => this.updateSystemTime(), 1000);
        
        // Terminal boot effect
        this.showBootSequence();
    }

    getStoredToken() {
        // Use memory storage since localStorage is not available
        return this.memoryToken || null;
    }

    setStoredToken(token) {
        this.memoryToken = token;
    }

    removeStoredToken() {
        this.memoryToken = null;
    }

    showBootSequence() {
        const bootMessages = [
            'INITIALIZING NOSTROMO SYSTEMS...',
            'LOADING ANIME DATABASE...',
            'ESTABLISHING NETWORK CONNECTION...',
            'SYSTEM READY'
        ];
        
        let messageIndex = 0;
        const bootInterval = setInterval(() => {
            if (messageIndex < bootMessages.length) {
                console.log(`> ${bootMessages[messageIndex]}`);
                messageIndex++;
            } else {
                clearInterval(bootInterval);
            }
        }, 800);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register toggle
        const registerToggle = document.getElementById('register-toggle');
        if (registerToggle) {
            registerToggle.addEventListener('click', () => this.toggleRegisterMode());
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Modal close
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }

        // Anime search
        const animeSearch = document.getElementById('anime-search');
        if (animeSearch) {
            animeSearch.addEventListener('input', (e) => {
                this.searchAnime(e.target.value);
            });
        }

        // Filter controls
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target);
                const status = e.target.dataset.status;
                this.loadWatchlist(status === 'all' ? null : status);
            });
        });

        // Window click to close modal
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('anime-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    updateSystemTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('en-US');
        
        const systemTime = document.getElementById('system-time');
        if (systemTime) {
            systemTime.textContent = `${dateString} ${timeString}`;
        }
    }

    checkAuthStatus() {
        if (this.authToken) {
            this.validateToken();
        } else {
            this.showSection('login');
        }
    }

    async validateToken() {
        try {
            const response = await fetch(`${this.API_BASE}/users/1`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData;
                this.showSection('dashboard');
                this.updateUserInterface();
            } else {
                this.handleLogout();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.handleLogout();
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.terminal-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show login section if not authenticated
        if (!this.authToken && sectionName !== 'login') {
            sectionName = 'login';
        }
        
        // Show target section
        const targetSection = document.getElementById(sectionName === 'login' ? 'login-section' : sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionName) {
                btn.classList.add('active');
            }
        });
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'anime':
                await this.loadAnimeDatabase();
                break;
            case 'watchlist':
                await this.loadWatchlist();
                break;
            case 'forum':
                await this.loadForumThreads();
                break;
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'profile':
                this.loadProfileData();
                break;
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showError('ACCESS DENIED: INCOMPLETE CREDENTIALS');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                this.setStoredToken(this.authToken);
                
                this.showSuccess('ACCESS GRANTED');
                setTimeout(() => {
                    this.showSection('dashboard');
                    this.updateUserInterface();
                }, 1000);
            } else {
                this.showError(`ACCESS DENIED: ${data.error.toUpperCase()}`);
            }
        } catch (error) {
            this.showError('CONNECTION ERROR: UNABLE TO AUTHENTICATE');
            console.error('Login error:', error);
        }
        
        this.showLoading(false);
    }

    handleLogout() {
        this.authToken = null;
        this.currentUser = null;
        this.removeStoredToken();
        
        this.showSection('login');
        this.clearUserInterface();
        
        // Clear form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
        this.showSuccess('SESSION TERMINATED');
    }

    updateUserInterface() {
        if (this.currentUser) {
            const profileUsername = document.getElementById('profile-username');
            const profileRole = document.getElementById('profile-role');
            
            if (profileUsername) profileUsername.textContent = this.currentUser.username.toUpperCase();
            if (profileRole) profileRole.textContent = this.currentUser.role.toUpperCase();
        }
    }

    clearUserInterface() {
        const profileUsername = document.getElementById('profile-username');
        const profileRole = document.getElementById('profile-role');
        
        if (profileUsername) profileUsername.textContent = '-';
        if (profileRole) profileRole.textContent = '-';
    }

    async loadAnimeDatabase(page = 1) {
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.API_BASE}/anime?page=${page}&limit=12`);
            const data = await response.json();
            
            this.renderAnimeGrid(data.data);
            this.updatePagination(data.pagination);
        } catch (error) {
            this.showError('DATABASE ACCESS ERROR');
            console.error('Load anime error:', error);
        }
        
        this.showLoading(false);
    }

    renderAnimeGrid(animeList) {
        const grid = document.getElementById('anime-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        animeList.forEach(anime => {
            const item = document.createElement('div');
            item.className = 'data-item';
            item.innerHTML = `
                <h4>${anime.title}</h4>
                <p>GENRE: ${anime.genre || 'UNKNOWN'}</p>
                <p>EPISODES: ${anime.episodes || 'N/A'}</p>
                <p>STUDIO: ${anime.studio || 'UNKNOWN'}</p>
                <p>RATING: ${anime.rating || 'UNRATED'}/10</p>
            `;
            
            item.addEventListener('click', () => this.showAnimeDetails(anime));
            grid.appendChild(item);
        });
    }

    async loadWatchlist(status = null) {
        if (!this.currentUser) return;
        
        this.showLoading(true);
        
        try {
            let url = `${this.API_BASE}/watchlist/${this.currentUser.id}`;
            if (status) {
                url += `?status=${status}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            this.renderWatchlistGrid(data.data);
        } catch (error) {
            this.showError('WATCHLIST ACCESS ERROR');
            console.error('Load watchlist error:', error);
        }
        
        this.showLoading(false);
    }

    renderWatchlistGrid(watchlist) {
        const grid = document.getElementById('watchlist-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (watchlist.length === 0) {
            grid.innerHTML = '<div class="data-item">NO ENTRIES FOUND</div>';
            return;
        }
        
        watchlist.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'data-item';
            item.innerHTML = `
                <h4>${entry.title}</h4>
                <p>STATUS: ${entry.status.toUpperCase().replace('-', ' ')}</p>
                <p>PROGRESS: ${entry.progress || 0}/${entry.episodes || '?'}</p>
                <p>MY RATING: ${entry.rating || 'UNRATED'}/5</p>
                <p>UPDATED: ${new Date(entry.watchlist_updated).toLocaleDateString()}</p>
            `;
            
            grid.appendChild(item);
        });
    }

    async loadForumThreads() {
        this.showLoading(true);
        
        try {
            // For demo purposes, showing threads for anime ID 1
            const response = await fetch(`${this.API_BASE}/threads/1`);
            const data = await response.json();
            
            this.renderForumThreads(data.data);
        } catch (error) {
            this.showError('FORUM ACCESS ERROR');
            console.error('Load forum error:', error);
        }
        
        this.showLoading(false);
    }

    renderForumThreads(threads) {
        const forumList = document.getElementById('forum-threads');
        if (!forumList) return;
        
        forumList.innerHTML = '';
        
        if (threads.length === 0) {
            forumList.innerHTML = '<div class="forum-thread">NO ACTIVE THREADS</div>';
            return;
        }
        
        threads.forEach(thread => {
            const item = document.createElement('div');
            item.className = 'forum-thread';
            item.innerHTML = `
                <h4>${thread.title}</h4>
                <div class="forum-meta">
                    BY ${thread.username.toUpperCase()} | 
                    ${new Date(thread.created_at).toLocaleDateString()} | 
                    VIEWS: ${thread.view_count || 0}
                </div>
            `;
            
            forumList.appendChild(item);
        });
    }

    async loadDashboardData() {
        const activityLog = document.getElementById('recent-activity');
        if (!activityLog) return;
        
        // Simulate loading recent activity
        const activities = [
            '> USER LOGIN DETECTED',
            '> DATABASE QUERY EXECUTED',
            '> SYSTEM STATUS: NOMINAL',
            '> WATCHLIST UPDATED',
            '> FORUM ACTIVITY LOGGED'
        ];
        
        activityLog.innerHTML = '';
        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.textContent = activity;
            activityLog.appendChild(item);
        });
    }

    loadProfileData() {
        if (!this.currentUser) return;
        
        const profileJoined = document.getElementById('profile-joined');
        if (profileJoined) {
            profileJoined.textContent = new Date().toLocaleDateString();
        }
    }

    showAnimeDetails(anime) {
        const modal = document.getElementById('anime-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = anime.title.toUpperCase();
            modalBody.innerHTML = `
                <div class="profile-field">
                    <label>TITLE:</label>
                    <span>${anime.title}</span>
                </div>
                <div class="profile-field">
                    <label>DESCRIPTION:</label>
                    <span>${anime.description || 'NO DESCRIPTION AVAILABLE'}</span>
                </div>
                <div class="profile-field">
                    <label>GENRE:</label>
                    <span>${anime.genre || 'UNKNOWN'}</span>
                </div>
                <div class="profile-field">
                    <label>EPISODES:</label>
                    <span>${anime.episodes || 'N/A'}</span>
                </div>
                <div class="profile-field">
                    <label>STUDIO:</label>
                    <span>${anime.studio || 'UNKNOWN'}</span>
                </div>
                <div class="profile-field">
                    <label>RATING:</label>
                    <span>${anime.rating || 'UNRATED'}/10</span>
                </div>
                <div class="profile-field">
                    <label>RELEASE DATE:</label>
                    <span>${anime.release_date || 'UNKNOWN'}</span>
                </div>
            `;
            
            modal.style.display = 'block';
        }
    }

    closeModal() {
        const modal = document.getElementById('anime-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    setActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    searchAnime(query) {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            if (query.length > 2) {
                this.showLoading(true);
                try {
                    const response = await fetch(`${this.API_BASE}/anime?search=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    this.renderAnimeGrid(data.data);
                } catch (error) {
                    this.showError('SEARCH ERROR');
                    console.error('Search error:', error);
                }
                this.showLoading(false);
            } else if (query.length === 0) {
                this.loadAnimeDatabase();
            }
        }, 500);
    }

    updatePagination(pagination) {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `PAGE ${pagination.page} OF ${pagination.totalPages}`;
        }
        
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.disabled = !pagination.hasPrev;
            prevBtn.onclick = () => pagination.hasPrev && this.loadAnimeDatabase(pagination.page - 1);
        }
        
        if (nextBtn) {
            nextBtn.disabled = !pagination.hasNext;
            nextBtn.onclick = () => pagination.hasNext && this.loadAnimeDatabase(pagination.page + 1);
        }
    }

    toggleRegisterMode() {
        // For demo purposes - would implement registration form
        this.showError('REGISTRATION MODULE NOT IMPLEMENTED');
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    showSuccess(message) {
        this.showStatusMessage(message, 'success');
    }

    showError(message) {
        this.showStatusMessage(message, 'error');
    }

    showStatusMessage(message, type) {
        // Create status message element
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'error' ? 'var(--danger-color)' : 'var(--success-color)'};
            color: var(--terminal-bg);
            border: 2px solid ${type === 'error' ? 'var(--danger-color)' : 'var(--success-color)'};
            z-index: 9999;
            font-family: inherit;
            font-weight: bold;
            box-shadow: 0 0 20px ${type === 'error' ? 'rgba(255, 51, 51, 0.5)' : 'rgba(0, 255, 65, 0.5)'};
        `;
        
        document.body.appendChild(statusDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 3000);
        
        // Add terminal beep effect
        this.playTerminalSound();
    }

    playTerminalSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            // Audio not supported, fail silently
            console.log('Audio not supported');
        }
    }
}

// Initialize the terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.terminal = new NostromoTerminal();
});

// Terminal typing effect for inputs
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.terminal-input');
    inputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            // Add typing sound effect
            if (e.key.length === 1 && window.terminal) {
                window.terminal.playTerminalSound();
            }
        });
    });
});