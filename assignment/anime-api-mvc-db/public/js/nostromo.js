// Updated Nostromo Terminal JavaScript with Full Functionality
class NostromoTerminal {
    constructor() {
        this.API_BASE = 'http://localhost:3000';
        this.currentUser = null;
        this.authToken = this.getStoredToken() || null;
        this.currentPage = 1;
        this.currentSection = 'login';
        this.currentAnimeFilters = {
            genre: '',
            studio: '',
            sortBy: 'title',
            sortOrder: 'ASC',
            search: ''
        };
        this.isRegisterMode = false;
        
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

        // Auth forms
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                if (this.isRegisterMode) {
                    this.handleRegister(e);
                } else {
                    this.handleLogin(e);
                }
            });
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

        // Anime search with debounce
        const animeSearch = document.getElementById('anime-search');
        if (animeSearch) {
            animeSearch.addEventListener('input', (e) => {
                this.currentAnimeFilters.search = e.target.value;
                this.debouncedSearchAnime();
            });
        }

        // Filter controls
        const genreFilter = document.getElementById('genre-filter');
        if (genreFilter) {
            genreFilter.addEventListener('change', (e) => {
                this.currentAnimeFilters.genre = e.target.value;
                this.currentPage = 1;
                this.loadAnimeDatabase();
            });
        }

        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                this.currentAnimeFilters.sortBy = sortBy || 'title';
                this.currentAnimeFilters.sortOrder = sortOrder || 'ASC';
                this.currentPage = 1;
                this.loadAnimeDatabase();
            });
        }

        // Watchlist filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target);
                const status = e.target.dataset.status;
                this.loadWatchlist(status === 'all' ? null : status);
            });
        });

        // Forum controls
        const createThreadBtn = document.getElementById('create-thread');
        if (createThreadBtn) {
            createThreadBtn.addEventListener('click', () => this.showCreateThreadModal());
        }

        // Pagination
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.changePage(-1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.changePage(1));
        }

        // Window click to close modal
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('anime-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    debouncedSearchAnime() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadAnimeDatabase();
        }, 500);
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
            // Use a generic endpoint to validate token
            const response = await fetch(`${this.API_BASE}/anime?limit=1`, {
                headers: this.authToken ? {
                    'Authorization': `Bearer ${this.authToken}`
                } : {}
            });
            
            if (this.authToken && response.status === 401) {
                this.handleLogout();
                return;
            }
            
            if (this.authToken) {
                this.showSection('dashboard');
                this.updateUserInterface();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            if (this.authToken) {
                this.handleLogout();
            }
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.terminal-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show login section if not authenticated and trying to access protected sections
        const protectedSections = ['dashboard', 'watchlist', 'forum', 'profile'];
        if (!this.authToken && protectedSections.includes(sectionName)) {
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
                if (this.currentUser) {
                    await this.loadWatchlist();
                }
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

    toggleRegisterMode() {
        this.isRegisterMode = !this.isRegisterMode;
        const loginForm = document.getElementById('login-form');
        const registerToggle = document.getElementById('register-toggle');
        
        if (this.isRegisterMode) {
            // Add email field for registration
            const passwordGroup = loginForm.querySelector('input[type="password"]').parentNode;
            const emailGroup = document.createElement('div');
            emailGroup.className = 'form-group';
            emailGroup.innerHTML = `
                <label>EMAIL.ADDR:</label>
                <input type="email" id="email" class="terminal-input" placeholder="ENTER EMAIL" autocomplete="off">
            `;
            passwordGroup.parentNode.insertBefore(emailGroup, passwordGroup.nextSibling);
            
            loginForm.querySelector('button[type="submit"]').textContent = 'CREATE ACCOUNT';
            registerToggle.textContent = 'RETURN TO LOGIN';
        } else {
            // Remove email field
            const emailGroup = loginForm.querySelector('#email')?.parentNode;
            if (emailGroup) {
                emailGroup.remove();
            }
            
            loginForm.querySelector('button[type="submit"]').textContent = 'AUTHENTICATE';
            registerToggle.textContent = 'CREATE NEW USER PROFILE';
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

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!username || !email || !password) {
            this.showError('REGISTRATION FAILED: INCOMPLETE DATA');
            return;
        }
        
        if (password.length < 6) {
            this.showError('REGISTRATION FAILED: PASSWORD TOO SHORT');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                this.setStoredToken(this.authToken);
                
                this.showSuccess('ACCOUNT CREATED: ACCESS GRANTED');
                setTimeout(() => {
                    this.toggleRegisterMode(); // Reset to login mode
                    this.showSection('dashboard');
                    this.updateUserInterface();
                }, 1000);
            } else {
                this.showError(`REGISTRATION FAILED: ${data.error.toUpperCase()}`);
            }
        } catch (error) {
            this.showError('CONNECTION ERROR: REGISTRATION FAILED');
            console.error('Registration error:', error);
        }
        
        this.showLoading(false);
    }

    handleLogout() {
        this.authToken = null;
        this.currentUser = null;
        this.removeStoredToken();
        
        // Reset filters and state
        this.currentPage = 1;
        this.currentAnimeFilters = {
            genre: '',
            studio: '',
            sortBy: 'title',
            sortOrder: 'ASC',
            search: ''
        };
        
        this.showSection('login');
        this.clearUserInterface();
        
        // Clear and reset form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
            // Reset to login mode if in register mode
            if (this.isRegisterMode) {
                this.toggleRegisterMode();
            }
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

    async loadAnimeDatabase(page = this.currentPage) {
        this.showLoading(true);
        
        try {
            // Build query parameters
            const params = new URLSearchParams({
                page: page,
                limit: 12,
                sortBy: this.currentAnimeFilters.sortBy,
                sortOrder: this.currentAnimeFilters.sortOrder
            });

            if (this.currentAnimeFilters.genre) {
                params.append('genre', this.currentAnimeFilters.genre);
            }
            if (this.currentAnimeFilters.studio) {
                params.append('studio', this.currentAnimeFilters.studio);
            }
            if (this.currentAnimeFilters.search) {
                params.append('search', this.currentAnimeFilters.search);
            }

            const response = await fetch(`${this.API_BASE}/anime?${params}`);
            const data = await response.json();
            
            this.renderAnimeGrid(data.data);
            this.updatePagination(data.pagination);
            this.currentPage = page;
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
        
        if (animeList.length === 0) {
            grid.innerHTML = '<div class="data-item">NO ANIME FOUND</div>';
            return;
        }
        
        animeList.forEach(anime => {
            const item = document.createElement('div');
            item.className = 'data-item';
            item.innerHTML = `
                <h4>${anime.title}</h4>
                <p>GENRE: ${anime.genre || 'UNKNOWN'}</p>
                <p>EPISODES: ${anime.episodes || 'N/A'}</p>
                <p>STUDIO: ${anime.studio || 'UNKNOWN'}</p>
                <p>RATING: ${anime.rating || 'UNRATED'}/10</p>
                ${this.authToken ? '<p class="add-to-watchlist" style="color: var(--terminal-green); cursor: pointer; margin-top: 10px;">+ ADD TO WATCHLIST</p>' : ''}
            `;
            
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-watchlist')) {
                    this.addToWatchlist(anime.anime_id);
                } else {
                    this.showAnimeDetails(anime);
                }
            });
            grid.appendChild(item);
        });
    }

    async addToWatchlist(animeId) {
        if (!this.authToken) {
            this.showError('LOGIN REQUIRED');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/watchlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    anime_id: animeId,
                    status: 'plan-to-watch'
                })
            });

            if (response.ok) {
                this.showSuccess('ADDED TO WATCHLIST');
            } else {
                const data = await response.json();
                this.showError(data.error.toUpperCase());
            }
        } catch (error) {
            this.showError('WATCHLIST UPDATE FAILED');
            console.error('Add to watchlist error:', error);
        }
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
                <div class="watchlist-controls" style="margin-top: 10px;">
                    <button class="terminal-button" style="margin-right: 10px; font-size: 0.8em; padding: 5px 10px;" onclick="window.terminal.updateWatchlistStatus(${entry.anime_id})">UPDATE</button>
                    <button class="terminal-button danger" style="font-size: 0.8em; padding: 5px 10px;" onclick="window.terminal.removeFromWatchlist(${entry.anime_id})">REMOVE</button>
                </div>
            `;
            
            grid.appendChild(item);
        });
    }

    async updateWatchlistStatus(animeId) {
        const status = prompt('Enter new status (watching, completed, plan-to-watch, dropped):');
        if (!status) return;

        try {
            const response = await fetch(`${this.API_BASE}/watchlist/${animeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                this.showSuccess('WATCHLIST UPDATED');
                this.loadWatchlist();
            } else {
                const data = await response.json();
                this.showError(data.error.toUpperCase());
            }
        } catch (error) {
            this.showError('UPDATE FAILED');
            console.error('Update watchlist error:', error);
        }
    }

    async removeFromWatchlist(animeId) {
        if (!confirm('Remove from watchlist?')) return;

        try {
            const response = await fetch(`${this.API_BASE}/watchlist/${animeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.showSuccess('REMOVED FROM WATCHLIST');
                this.loadWatchlist();
            } else {
                this.showError('REMOVAL FAILED');
            }
        } catch (error) {
            this.showError('REMOVAL FAILED');
            console.error('Remove from watchlist error:', error);
        }
    }

    async loadForumThreads() {
        this.showLoading(true);
        
        try {
            // Load threads for the first anime as default (you might want to make this selectable)
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
            
            item.addEventListener('click', () => this.showThreadDetails(thread));
            forumList.appendChild(item);
        });
    }

    showCreateThreadModal() {
        if (!this.authToken) {
            this.showError('LOGIN REQUIRED');
            return;
        }

        const modalContent = `
            <form id="create-thread-form" class="terminal-form">
                <div class="form-group">
                    <label>ANIME ID:</label>
                    <input type="number" id="thread-anime-id" class="terminal-input" placeholder="ENTER ANIME ID" required>
                </div>
                <div class="form-group">
                    <label>THREAD TITLE:</label>
                    <input type="text" id="thread-title" class="terminal-input" placeholder="ENTER TITLE" required>
                </div>
                <div class="form-group">
                    <label>CONTENT:</label>
                    <textarea id="thread-content" class="terminal-input" rows="4" placeholder="ENTER CONTENT" required></textarea>
                </div>
                <button type="submit" class="terminal-button">CREATE THREAD</button>
            </form>
        `;

        this.showModal('CREATE THREAD', modalContent);

        const form = document.getElementById('create-thread-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateThread(e));
        }
    }

    async handleCreateThread(e) {
        e.preventDefault();

        const animeId = document.getElementById('thread-anime-id').value;
        const title = document.getElementById('thread-title').value;
        const content = document.getElementById('thread-content').value;

        try {
            const response = await fetch(`${this.API_BASE}/threads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    anime_id: parseInt(animeId),
                    title,
                    content
                })
            });

            if (response.ok) {
                this.showSuccess('THREAD CREATED');
                this.closeModal();
                this.loadForumThreads();
            } else {
                const data = await response.json();
                this.showError(data.error.toUpperCase());
            }
        } catch (error) {
            this.showError('THREAD CREATION FAILED');
            console.error('Create thread error:', error);
        }
    }

    showThreadDetails(thread) {
        // This would show thread details and comments - simplified for demo
        this.showModal(`THREAD: ${thread.title.toUpperCase()}`, `
            <p><strong>BY:</strong> ${thread.username.toUpperCase()}</p>
            <p><strong>CREATED:</strong> ${new Date(thread.created_at).toLocaleDateString()}</p>
            <p><strong>CONTENT:</strong></p>
            <p>${thread.content || 'No content available'}</p>
        `);
    }

    async loadDashboardData() {
        // Update activity log with real data
        const activityLog = document.getElementById('recent-activity');
        if (!activityLog) return;
        
        const activities = [
            `> USER ${this.currentUser?.username.toUpperCase() || 'UNKNOWN'} ONLINE`,
            '> DATABASE QUERY EXECUTED',
            '> SYSTEM STATUS: NOMINAL',
            '> NETWORK CONNECTION: STABLE',
            '> SECURITY PROTOCOLS: ACTIVE'
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
        const modalContent = `
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
            ${this.authToken ? `<button class="terminal-button" onclick="window.terminal.addToWatchlist(${anime.anime_id})" style="margin-top: 15px;">ADD TO WATCHLIST</button>` : ''}
        `;

        this.showModal(anime.title.toUpperCase(), modalContent);
    }

    showModal(title, content) {
        const modal = document.getElementById('anime-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
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

    changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 1) {
            this.loadAnimeDatabase(newPage);
        }
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
        }
        
        if (nextBtn) {
            nextBtn.disabled = !pagination.hasNext;
        }
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