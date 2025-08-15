// ANICONNECT TERMINAL SYSTEM - NOSTROMO v2.183
// Main JavaScript Controller

class AniConnect {
    constructor() {
        this.currentUser = null;
        this.authToken = localStorage.getItem('authToken');
        this.currentSection = 'dashboard';
        this.currentAnimeId = null;
        this.currentThreadId = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {};
        
        this.init();
    }

    init() {
        this.initializeElements();
        this.bindEvents();
        this.updateSystemTime();
        this.checkAuthentication();
        
        // Start system time updates
        setInterval(() => this.updateSystemTime(), 1000);
        
        // Add activity log entry
        this.addActivityLog('> SYSTEM INITIALIZED');
    }

    initializeElements() {
        // Get all important DOM elements
        this.elements = {
            // Sections
            loginSection: document.getElementById('login-section'),
            dashboardSection: document.getElementById('dashboard'),
            animeSection: document.getElementById('anime'),
            watchlistSection: document.getElementById('watchlist'),
            forumSection: document.getElementById('forum'),
            profileSection: document.getElementById('profile'),
            adminSection: document.getElementById('admin'),
            
            // Navigation
            navButtons: document.querySelectorAll('.nav-btn'),
            
            // Forms
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            animeForm: document.getElementById('anime-form'),
            threadForm: document.getElementById('thread-form'),
            commentForm: document.getElementById('comment-form'),
            profileForm: document.getElementById('profile-form'),
            watchlistForm: document.getElementById('watchlist-form'),
            
            // Modals
            animeModal: document.getElementById('anime-modal'),
            animeFormModal: document.getElementById('anime-form-modal'),
            threadModal: document.getElementById('thread-modal'),
            threadDetailsModal: document.getElementById('thread-details-modal'),
            commentModal: document.getElementById('comment-modal'),
            profileModal: document.getElementById('profile-modal'),
            watchlistModal: document.getElementById('watchlist-modal'),
            
            // Loading
            loading: document.getElementById('loading')
        };
    }

    bindEvents() {
        // Navigation events
        this.elements.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Form events
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (this.elements.registerForm) {
            this.elements.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Modal events
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Register toggle
        const registerToggle = document.getElementById('register-toggle');
        const backToLogin = document.getElementById('back-to-login');
        if (registerToggle) {
            registerToggle.addEventListener('click', () => this.toggleRegister(true));
        }
        if (backToLogin) {
            backToLogin.addEventListener('click', () => this.toggleRegister(false));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Search and filter events
        this.bindSearchAndFilters();
        
        // Admin events
        this.bindAdminEvents();
        
        // Anime events
        this.bindAnimeEvents();
        
        // Forum events
        this.bindForumEvents();
        
        // Profile events
        this.bindProfileEvents();
        
        // Watchlist events
        this.bindWatchlistEvents();

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    bindSearchAndFilters() {
        // Anime search
        const animeSearch = document.getElementById('anime-search');
        if (animeSearch) {
            let searchTimeout;
            animeSearch.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = animeSearch.value;
                    this.loadAnime(1);
                }, 500);
            });
        }

        // Anime filters
        const genreFilter = document.getElementById('genre-filter');
        const studioFilter = document.getElementById('studio-filter');
        const sortFilter = document.getElementById('sort-filter');
        const sortOrder = document.getElementById('sort-order');

        if (genreFilter) {
            genreFilter.addEventListener('change', () => {
                this.filters.genre = genreFilter.value;
                this.loadAnime(1);
            });
        }
        if (studioFilter) {
            studioFilter.addEventListener('change', () => {
                this.filters.studio = studioFilter.value;
                this.loadAnime(1);
            });
        }
        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.filters.sortBy = sortFilter.value;
                this.loadAnime(1);
            });
        }
        if (sortOrder) {
            sortOrder.addEventListener('change', () => {
                this.filters.sortOrder = sortOrder.value;
                this.loadAnime(1);
            });
        }

        // Watchlist filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadWatchlist(1, e.target.dataset.status);
            });
        });

        // Pagination
        this.bindPaginationEvents();
    }

    bindPaginationEvents() {
        // Anime pagination
        const prevPage = document.getElementById('prev-page');
        const nextPage = document.getElementById('next-page');
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.loadAnime(this.currentPage - 1);
                }
            });
        }
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                this.loadAnime(this.currentPage + 1);
            });
        }

        // Watchlist pagination
        const watchlistPrev = document.getElementById('watchlist-prev');
        const watchlistNext = document.getElementById('watchlist-next');
        if (watchlistPrev) {
            watchlistPrev.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    const activeFilter = document.querySelector('.filter-btn.active');
                    const status = activeFilter ? activeFilter.dataset.status : 'all';
                    this.loadWatchlist(this.currentPage - 1, status);
                }
            });
        }
        if (watchlistNext) {
            watchlistNext.addEventListener('click', () => {
                const activeFilter = document.querySelector('.filter-btn.active');
                const status = activeFilter ? activeFilter.dataset.status : 'all';
                this.loadWatchlist(this.currentPage + 1, status);
            });
        }

        // Forum pagination
        const forumPrev = document.getElementById('forum-prev');
        const forumNext = document.getElementById('forum-next');
        if (forumPrev) {
            forumPrev.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.loadForumThreads(this.currentAnimeId, this.currentPage - 1);
                }
            });
        }
        if (forumNext) {
            forumNext.addEventListener('click', () => {
                this.loadForumThreads(this.currentAnimeId, this.currentPage + 1);
            });
        }
    }

    bindAdminEvents() {
        const createAnimeBtn = document.getElementById('create-anime-btn');
        if (createAnimeBtn) {
            createAnimeBtn.addEventListener('click', () => this.showAnimeForm());
        }

        if (this.elements.animeForm) {
            this.elements.animeForm.addEventListener('submit', (e) => this.handleAnimeForm(e));
        }
    }

    bindAnimeEvents() {
        const addToWatchlistBtn = document.getElementById('add-to-watchlist-btn');
        const editAnimeBtn = document.getElementById('edit-anime-btn');
        const deleteAnimeBtn = document.getElementById('delete-anime-btn');

        if (addToWatchlistBtn) {
            addToWatchlistBtn.addEventListener('click', () => this.showWatchlistForm(this.currentAnimeId));
        }
        if (editAnimeBtn) {
            editAnimeBtn.addEventListener('click', () => this.editAnime(this.currentAnimeId));
        }
        if (deleteAnimeBtn) {
            deleteAnimeBtn.addEventListener('click', () => this.deleteAnime(this.currentAnimeId));
        }

        if (this.elements.watchlistForm) {
            this.elements.watchlistForm.addEventListener('submit', (e) => this.handleWatchlistForm(e));
        }
    }

    bindForumEvents() {
        const forumAnimeSelect = document.getElementById('forum-anime-select');
        const createThreadBtn = document.getElementById('create-thread');
        const refreshThreadsBtn = document.getElementById('refresh-threads');
        const addCommentBtn = document.getElementById('add-comment-btn');
        const editThreadBtn = document.getElementById('edit-thread-btn');
        const deleteThreadBtn = document.getElementById('delete-thread-btn');

        if (forumAnimeSelect) {
            forumAnimeSelect.addEventListener('change', (e) => {
                this.currentAnimeId = parseInt(e.target.value);
                if (this.currentAnimeId) {
                    this.loadForumThreads(this.currentAnimeId);
                }
            });
        }

        if (createThreadBtn) {
            createThreadBtn.addEventListener('click', () => {
                if (this.currentAnimeId) {
                    this.showThreadForm();
                } else {
                    this.showMessage('Please select an anime first', 'warning');
                }
            });
        }

        if (refreshThreadsBtn) {
            refreshThreadsBtn.addEventListener('click', () => {
                if (this.currentAnimeId) {
                    this.loadForumThreads(this.currentAnimeId);
                }
            });
        }

        if (addCommentBtn) {
            addCommentBtn.addEventListener('click', () => this.showCommentForm());
        }
        if (editThreadBtn) {
            editThreadBtn.addEventListener('click', () => this.editThread(this.currentThreadId));
        }
        if (deleteThreadBtn) {
            deleteThreadBtn.addEventListener('click', () => this.deleteThread(this.currentThreadId));
        }

        if (this.elements.threadForm) {
            this.elements.threadForm.addEventListener('submit', (e) => this.handleThreadForm(e));
        }
        if (this.elements.commentForm) {
            this.elements.commentForm.addEventListener('submit', (e) => this.handleCommentForm(e));
        }
    }

    bindProfileEvents() {
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.showProfileForm());
        }

        if (this.elements.profileForm) {
            this.elements.profileForm.addEventListener('submit', (e) => this.handleProfileForm(e));
        }
    }

    bindWatchlistEvents() {
        // Events are bound when watchlist items are created
    }

    updateSystemTime() {
        const timeElement = document.getElementById('system-time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        }
    }

    // Authentication Methods
    async checkAuthentication() {
        if (this.authToken) {
            try {
                // Verify token is still valid by making a test request
                const response = await this.makeRequest('/anime', 'GET');
                if (response.ok) {
                    // Token is valid, get user info from local storage or decode token
                    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    this.showMainInterface();
                    this.loadDashboard();
                } else {
                    this.logout();
                }
            } catch (error) {
                this.logout();
            }
        } else {
            this.showLoginInterface();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showMessage('Please enter both username and password', 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            const response = await this.makeRequest('/login', 'POST', {
                username,
                password
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                this.showMessage(`Welcome back, ${this.currentUser.username}!`, 'success');
                this.showMainInterface();
                this.loadDashboard();
                this.addActivityLog(`> USER ${this.currentUser.username.toUpperCase()} AUTHENTICATED`);
            } else {
                this.showMessage(data.error || 'Authentication failed', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (!username || !email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.makeRequest('/register', 'POST', {
                username,
                email,
                password
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                this.showMessage(`Account created successfully! Welcome, ${this.currentUser.username}!`, 'success');
                this.showMainInterface();
                this.loadDashboard();
                this.addActivityLog(`> NEW USER ${this.currentUser.username.toUpperCase()} REGISTERED`);
            } else {
                this.showMessage(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    logout() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.showLoginInterface();
        this.showMessage('Session terminated', 'success');
        this.addActivityLog('> USER SESSION TERMINATED');
    }

    toggleRegister(show) {
        const loginContainer = document.querySelector('.login-container');
        const registerContainer = document.getElementById('register-container');
        
        if (show) {
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
        } else {
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';
            // Clear registration form
            this.elements.registerForm.reset();
        }
    }

    showLoginInterface() {
        this.elements.loginSection.style.display = 'block';
        this.elements.loginSection.classList.add('active');
        
        // Hide all other sections
        document.querySelectorAll('.terminal-section:not(#login-section)').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Hide navigation
        document.querySelector('.terminal-nav').style.display = 'none';
    }

    showMainInterface() {
        this.elements.loginSection.style.display = 'none';
        this.elements.loginSection.classList.remove('active');
        
        // Show navigation
        document.querySelector('.terminal-nav').style.display = 'flex';
        
        // Show admin nav button if user is admin
        const adminBtn = document.querySelector('[data-section="admin"]');
        if (adminBtn) {
            adminBtn.style.display = this.currentUser.role === 'admin' ? 'block' : 'none';
        }
        
        // Switch to dashboard
        this.switchSection('dashboard');
    }

    // Navigation Methods
    switchSection(sectionName) {
        // Update navigation
        this.elements.navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Hide all sections
        document.querySelectorAll('.terminal-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Load section data
            this.loadSectionData(sectionName);
            
            this.addActivityLog(`> ACCESSING ${sectionName.toUpperCase()} MODULE`);
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'anime':
                await this.loadAnime();
                break;
            case 'watchlist':
                await this.loadWatchlist();
                break;
            case 'forum':
                await this.loadForumAnimeList();
                break;
            case 'profile':
                await this.loadProfile();
                break;
            case 'admin':
                if (this.currentUser.role === 'admin') {
                    await this.loadAdmin();
                }
                break;
        }
    }

    // Dashboard Methods
    async loadDashboard() {
        if (!this.currentUser) return;
        
        try {
            // Load watchlist stats
            const watchlistResponse = await this.makeRequest(`/watchlist/${this.currentUser.id}`, 'GET');
            if (watchlistResponse.ok) {
                const watchlistData = await watchlistResponse.json();
                this.updateWatchlistStats(watchlistData.data);
            }
            
            this.addActivityLog('> DASHBOARD DATA LOADED');
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    }

    updateWatchlistStats(watchlistData) {
        const stats = {
            watching: 0,
            completed: 0,
            planned: 0,
            total: watchlistData.length
        };

        watchlistData.forEach(item => {
            switch (item.status) {
                case 'watching':
                    stats.watching++;
                    break;
                case 'completed':
                    stats.completed++;
                    break;
                case 'plan-to-watch':
                    stats.planned++;
                    break;
            }
        });

        document.getElementById('watching-count').textContent = stats.watching;
        document.getElementById('completed-count').textContent = stats.completed;
        document.getElementById('planned-count').textContent = stats.planned;
        document.getElementById('total-count').textContent = stats.total;
    }

    // Anime Methods
    async loadAnime(page = 1) {
        this.showLoading(true);
        
        try {
            const params = new URLSearchParams({
                page,
                limit: this.itemsPerPage,
                ...this.filters
            });

            const response = await this.makeRequest(`/anime?${params}`, 'GET');
            const data = await response.json();

            if (response.ok) {
                this.displayAnime(data.data);
                this.updateAnimePagination(data.pagination);
                this.currentPage = page;
            } else {
                this.showMessage('Failed to load anime data', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayAnime(animeList) {
        const animeGrid = document.getElementById('anime-grid');
        if (!animeGrid) return;

        animeGrid.innerHTML = '';

        animeList.forEach(anime => {
            const animeItem = document.createElement('div');
            animeItem.className = 'data-item';
            animeItem.innerHTML = `
                <h4>${anime.title}</h4>
                <p><strong>GENRE:</strong> ${anime.genre}</p>
                <p><strong>EPISODES:</strong> ${anime.episodes}</p>
                <p><strong>STUDIO:</strong> ${anime.studio}</p>
                <p><strong>RATING:</strong> ${anime.rating || 'N/A'}</p>
                ${this.currentUser.role === 'admin' ? `
                    <div class="item-actions">
                        <button class="item-action-btn edit-anime-btn" data-id="${anime.anime_id}">EDIT</button>
                        <button class="item-action-btn danger delete-anime-btn" data-id="${anime.anime_id}">DEL</button>
                    </div>
                ` : ''}
            `;
            
            animeItem.addEventListener('click', () => this.showAnimeDetails(anime.anime_id));
            animeGrid.appendChild(animeItem);
        });

        // Bind admin action events
        if (this.currentUser.role === 'admin') {
            document.querySelectorAll('.edit-anime-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editAnime(parseInt(e.target.dataset.id));
                });
            });

            document.querySelectorAll('.delete-anime-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteAnime(parseInt(e.target.dataset.id));
                });
            });
        }
    }

    updateAnimePagination(pagination) {
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (pageInfo) {
            pageInfo.textContent = `PAGE ${pagination.page} OF ${pagination.totalPages}`;
        }
        if (prevBtn) {
            prevBtn.disabled = !pagination.hasPrev;
        }
        if (nextBtn) {
            nextBtn.disabled = !pagination.hasNext;
        }
    }

    async showAnimeDetails(animeId) {
        this.showLoading(true);
        
        try {
            const response = await this.makeRequest(`/anime/${animeId}`, 'GET');
            const anime = await response.json();

            if (response.ok) {
                this.currentAnimeId = animeId;
                this.displayAnimeModal(anime);
            } else {
                this.showMessage('Failed to load anime details', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayAnimeModal(anime) {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const editBtn = document.getElementById('edit-anime-btn');
        const deleteBtn = document.getElementById('delete-anime-btn');

        modalTitle.textContent = anime.title;
        modalBody.innerHTML = `
            <div class="profile-field">
                <label>DESCRIPTION:</label>
                <span>${anime.description || 'No description available'}</span>
            </div>
            <div class="profile-field">
                <label>GENRE:</label>
                <span>${anime.genre}</span>
            </div>
            <div class="profile-field">
                <label>EPISODES:</label>
                <span>${anime.episodes}</span>
            </div>
            <div class="profile-field">
                <label>STUDIO:</label>
                <span>${anime.studio}</span>
            </div>
            <div class="profile-field">
                <label>RATING:</label>
                <span>${anime.rating || 'Not rated'}</span>
            </div>
            <div class="profile-field">
                <label>RELEASE DATE:</label>
                <span>${anime.release_date || 'Unknown'}</span>
            </div>
        `;

        // Show admin buttons if user is admin
        if (this.currentUser.role === 'admin') {
            editBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
        } else {
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        }

        this.openModal(this.elements.animeModal);
    }

    showAnimeForm(animeData = null) {
        const formTitle = document.getElementById('anime-form-title');
        const form = this.elements.animeForm;

        if (animeData) {
            formTitle.textContent = 'EDIT ANIME';
            document.getElementById('anime-title').value = animeData.title;
            document.getElementById('anime-description').value = animeData.description || '';
            document.getElementById('anime-genre').value = animeData.genre;
            document.getElementById('anime-episodes').value = animeData.episodes;
            document.getElementById('anime-studio').value = animeData.studio;
        } else {
            formTitle.textContent = 'CREATE ANIME';
            form.reset();
        }

        this.openModal(this.elements.animeFormModal);
    }

    async handleAnimeForm(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('anime-title').value,
            description: document.getElementById('anime-description').value,
            genre: document.getElementById('anime-genre').value,
            episodes: parseInt(document.getElementById('anime-episodes').value),
            studio: document.getElementById('anime-studio').value
        };

        const isEdit = this.currentAnimeId && document.getElementById('anime-form-title').textContent === 'EDIT ANIME';
        const url = isEdit ? `/anime/${this.currentAnimeId}` : '/anime';
        const method = isEdit ? 'PUT' : 'POST';

        this.showLoading(true);

        try {
            const response = await this.makeRequest(url, method, formData);
            const data = await response.json();

            if (response.ok) {
                this.showMessage(`Anime ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
                this.closeModal(this.elements.animeFormModal);
                if (this.currentSection === 'anime') {
                    this.loadAnime(this.currentPage);
                }
                this.addActivityLog(`> ANIME ${isEdit ? 'UPDATED' : 'CREATED'}: ${formData.title.toUpperCase()}`);
            } else {
                this.showMessage(data.error || `Failed to ${isEdit ? 'update' : 'create'} anime`, 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async editAnime(animeId) {
        try {
            const response = await this.makeRequest(`/anime/${animeId}`, 'GET');
            const anime = await response.json();

            if (response.ok) {
                this.currentAnimeId = animeId;
                this.showAnimeForm(anime);
            } else {
                this.showMessage('Failed to load anime data', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        }
    }

    async deleteAnime(animeId) {
        if (!confirm('Are you sure you want to delete this anime? This action cannot be undone.')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.makeRequest(`/anime/${animeId}`, 'DELETE');

            if (response.ok) {
                this.showMessage('Anime deleted successfully!', 'success');
                this.closeModal(this.elements.animeModal);
                if (this.currentSection === 'anime') {
                    this.loadAnime(this.currentPage);
                }
                this.addActivityLog('> ANIME DELETED FROM DATABASE');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to delete anime', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Watchlist Methods
    async loadWatchlist(page = 1, status = 'all') {
        if (!this.currentUser) return;
        
        this.showLoading(true);

        try {
            const params = new URLSearchParams({
                page,
                limit: this.itemsPerPage
            });

            if (status && status !== 'all') {
                params.append('status', status);
            }

            const response = await this.makeRequest(`/watchlist/${this.currentUser.id}?${params}`, 'GET');
            const data = await response.json();

            if (response.ok) {
                this.displayWatchlist(data.data);
                this.updateWatchlistPagination(data.pagination);
                this.currentPage = page;
            } else {
                this.showMessage('Failed to load watchlist', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayWatchlist(watchlistItems) {
        const watchlistGrid = document.getElementById('watchlist-grid');
        if (!watchlistGrid) return;

        watchlistGrid.innerHTML = '';

        if (watchlistItems.length === 0) {
            watchlistGrid.innerHTML = '<div class="data-item">No anime in your watchlist</div>';
            return;
        }

        watchlistItems.forEach(item => {
            const watchlistItem = document.createElement('div');
            watchlistItem.className = 'data-item';
            watchlistItem.innerHTML = `
                <h4>${item.title}</h4>
                <p><strong>STATUS:</strong> ${item.status.toUpperCase().replace('-', ' ')}</p>
                <p><strong>GENRE:</strong> ${item.genre}</p>
                <p><strong>EPISODES:</strong> ${item.episodes}</p>
                <p><strong>PROGRESS:</strong> ${item.progress || 0}/${item.episodes}</p>
                <p><strong>MY RATING:</strong> ${item.rating || 'Not rated'}</p>
                <div class="item-actions">
                    <button class="item-action-btn edit-watchlist-btn" data-id="${item.anime_id}">EDIT</button>
                    <button class="item-action-btn danger remove-watchlist-btn" data-id="${item.anime_id}">REMOVE</button>
                </div>
            `;
            
            watchlistItem.addEventListener('click', () => this.showAnimeDetails(item.anime_id));
            watchlistGrid.appendChild(watchlistItem);
        });

        // Bind watchlist action events
        document.querySelectorAll('.edit-watchlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editWatchlistEntry(parseInt(e.target.dataset.id));
            });
        });

        document.querySelectorAll('.remove-watchlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromWatchlist(parseInt(e.target.dataset.id));
            });
        });
    }

    updateWatchlistPagination(pagination) {
        const pageInfo = document.getElementById('watchlist-page-info');
        const prevBtn = document.getElementById('watchlist-prev');
        const nextBtn = document.getElementById('watchlist-next');

        if (pageInfo) {
            pageInfo.textContent = `PAGE ${pagination.page} OF ${pagination.totalPages}`;
        }
        if (prevBtn) {
            prevBtn.disabled = pagination.page <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = pagination.page >= pagination.totalPages;
        }
    }

    showWatchlistForm(animeId, currentEntry = null) {
        this.currentAnimeId = animeId;
        const form = this.elements.watchlistForm;
        const modalTitle = document.getElementById('watchlist-modal-title');

        if (currentEntry) {
            modalTitle.textContent = 'EDIT WATCHLIST ENTRY';
            document.getElementById('watchlist-status').value = currentEntry.status;
            document.getElementById('watchlist-rating').value = currentEntry.rating || '';
            document.getElementById('watchlist-progress').value = currentEntry.progress || 0;
            document.getElementById('watchlist-notes').value = currentEntry.notes || '';
        } else {
            modalTitle.textContent = 'ADD TO WATCHLIST';
            form.reset();
        }

        this.openModal(this.elements.watchlistModal);
    }

    async handleWatchlistForm(e) {
        e.preventDefault();
        
        const formData = {
            anime_id: this.currentAnimeId,
            status: document.getElementById('watchlist-status').value,
            rating: document.getElementById('watchlist-rating').value ? parseInt(document.getElementById('watchlist-rating').value) : null,
            progress: document.getElementById('watchlist-progress').value ? parseInt(document.getElementById('watchlist-progress').value) : null,
            notes: document.getElementById('watchlist-notes').value
        };

        const isEdit = document.getElementById('watchlist-modal-title').textContent === 'EDIT WATCHLIST ENTRY';
        const url = isEdit ? `/watchlist/${this.currentAnimeId}` : '/watchlist';
        const method = isEdit ? 'PUT' : 'POST';

        this.showLoading(true);

        try {
            const response = await this.makeRequest(url, method, formData);
            const data = await response.json();

            if (response.ok) {
                this.showMessage(`Watchlist ${isEdit ? 'updated' : 'entry added'} successfully!`, 'success');
                this.closeModal(this.elements.watchlistModal);
                if (this.currentSection === 'watchlist') {
                    const activeFilter = document.querySelector('.filter-btn.active');
                    const status = activeFilter ? activeFilter.dataset.status : 'all';
                    this.loadWatchlist(this.currentPage, status);
                }
                this.addActivityLog(`> WATCHLIST ${isEdit ? 'UPDATED' : 'ENTRY ADDED'}`);
            } else {
                this.showMessage(data.error || `Failed to ${isEdit ? 'update' : 'add'} watchlist entry`, 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async editWatchlistEntry(animeId) {
        try {
            const response = await this.makeRequest(`/watchlist/${this.currentUser.id}`, 'GET');
            const data = await response.json();

            if (response.ok) {
                const entry = data.data.find(item => item.anime_id === animeId);
                if (entry) {
                    this.showWatchlistForm(animeId, entry);
                } else {
                    this.showMessage('Watchlist entry not found', 'error');
                }
            } else {
                this.showMessage('Failed to load watchlist entry', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        }
    }

    async removeFromWatchlist(animeId) {
        if (!confirm('Remove this anime from your watchlist?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.makeRequest(`/watchlist/${animeId}`, 'DELETE');

            if (response.ok) {
                this.showMessage('Anime removed from watchlist!', 'success');
                const activeFilter = document.querySelector('.filter-btn.active');
                const status = activeFilter ? activeFilter.dataset.status : 'all';
                this.loadWatchlist(this.currentPage, status);
                this.addActivityLog('> ANIME REMOVED FROM WATCHLIST');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to remove from watchlist', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Forum Methods
    async loadForumAnimeList() {
        try {
            const response = await this.makeRequest('/anime', 'GET');
            const data = await response.json();

            if (response.ok) {
                const select = document.getElementById('forum-anime-select');
                if (select) {
                    select.innerHTML = '<option value="">SELECT ANIME FOR THREADS</option>';
                    data.data.forEach(anime => {
                        const option = document.createElement('option');
                        option.value = anime.anime_id;
                        option.textContent = anime.title;
                        select.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load anime list for forum:', error);
        }
    }

    async loadForumThreads(animeId, page = 1) {
        if (!animeId) return;
        
        this.showLoading(true);

        try {
            const params = new URLSearchParams({
                page,
                limit: this.itemsPerPage
            });

            const response = await this.makeRequest(`/threads/${animeId}?${params}`, 'GET');
            const data = await response.json();

            if (response.ok) {
                this.displayForumThreads(data.data);
                this.updateForumPagination(data.pagination);
                this.currentPage = page;
                
                // Show pagination
                document.getElementById('forum-pagination').style.display = 'flex';
            } else {
                this.showMessage('Failed to load forum threads', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayForumThreads(threads) {
        const forumThreads = document.getElementById('forum-threads');
        if (!forumThreads) return;

        forumThreads.innerHTML = '';

        if (threads.length === 0) {
            forumThreads.innerHTML = '<div class="forum-thread">No threads found for this anime</div>';
            return;
        }

        threads.forEach(thread => {
            const threadElement = document.createElement('div');
            threadElement.className = 'forum-thread';
            threadElement.innerHTML = `
                <h4>${thread.title}</h4>
                <div class="forum-meta">
                    <span>By: ${thread.username}</span>
                    <span>${new Date(thread.created_at).toLocaleDateString()}</span>
                    ${(this.currentUser.username === thread.username || this.currentUser.role === 'admin') ? `
                        <div class="thread-actions">
                            <button class="item-action-btn edit-thread-btn" data-id="${thread.thread_id}">EDIT</button>
                            <button class="item-action-btn danger delete-thread-btn" data-id="${thread.thread_id}">DEL</button>
                        </div>
                    ` : ''}
                </div>
            `;
            
            threadElement.addEventListener('click', () => this.showThreadDetails(thread.thread_id));
            forumThreads.appendChild(threadElement);
        });

        // Bind thread action events
        document.querySelectorAll('.edit-thread-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editThread(parseInt(e.target.dataset.id));
            });
        });

        document.querySelectorAll('.delete-thread-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteThread(parseInt(e.target.dataset.id));
            });
        });
    }

    updateForumPagination(pagination) {
        const pageInfo = document.getElementById('forum-page-info');
        const prevBtn = document.getElementById('forum-prev');
        const nextBtn = document.getElementById('forum-next');

        if (pageInfo) {
            pageInfo.textContent = `PAGE ${pagination.page} OF ${pagination.totalPages}`;
        }
        if (prevBtn) {
            prevBtn.disabled = pagination.page <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = pagination.page >= pagination.totalPages;
        }
    }

    showThreadForm(threadData = null) {
        const form = this.elements.threadForm;
        const modalTitle = document.getElementById('thread-modal-title');

        if (threadData) {
            modalTitle.textContent = 'EDIT THREAD';
            document.getElementById('thread-title').value = threadData.title;
            document.getElementById('thread-content').value = threadData.content;
        } else {
            modalTitle.textContent = 'CREATE THREAD';
            form.reset();
        }

        this.openModal(this.elements.threadModal);
    }

    async handleThreadForm(e) {
        e.preventDefault();
        
        const formData = {
            anime_id: this.currentAnimeId,
            title: document.getElementById('thread-title').value,
            content: document.getElementById('thread-content').value
        };

        const isEdit = this.currentThreadId && document.getElementById('thread-modal-title').textContent === 'EDIT THREAD';
        const url = isEdit ? `/threads/${this.currentThreadId}` : '/threads';
        const method = isEdit ? 'PUT' : 'POST';

        this.showLoading(true);

        try {
            const response = await this.makeRequest(url, method, formData);
            const data = await response.json();

            if (response.ok) {
                this.showMessage(`Thread ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
                this.closeModal(this.elements.threadModal);
                this.loadForumThreads(this.currentAnimeId, this.currentPage);
                this.addActivityLog(`> FORUM THREAD ${isEdit ? 'UPDATED' : 'CREATED'}`);
            } else {
                this.showMessage(data.error || `Failed to ${isEdit ? 'update' : 'create'} thread`, 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async showThreadDetails(threadId) {
        this.currentThreadId = threadId;
        this.showLoading(true);

        try {
            // Get thread details and comments
            const [threadResponse, commentsResponse] = await Promise.all([
                this.makeRequest(`/threads/${this.currentAnimeId}`, 'GET'),
                this.makeRequest(`/comments/${threadId}`, 'GET')
            ]);

            const threadsData = await threadResponse.json();
            const commentsData = await commentsResponse.json();

            if (threadResponse.ok && commentsResponse.ok) {
                const thread = threadsData.data.find(t => t.thread_id === threadId);
                if (thread) {
                    this.displayThreadDetailsModal(thread, commentsData);
                } else {
                    this.showMessage('Thread not found', 'error');
                }
            } else {
                this.showMessage('Failed to load thread details', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayThreadDetailsModal(thread, comments) {
        const modalTitle = document.getElementById('thread-details-title');
        const modalBody = document.getElementById('thread-details-body');
        const editBtn = document.getElementById('edit-thread-btn');
        const deleteBtn = document.getElementById('delete-thread-btn');

        modalTitle.textContent = thread.title;
        
        let modalContent = `
            <div class="profile-field">
                <label>AUTHOR:</label>
                <span>${thread.username}</span>
            </div>
            <div class="profile-field">
                <label>CREATED:</label>
                <span>${new Date(thread.created_at).toLocaleString()}</span>
            </div>
            <div class="profile-field">
                <label>CONTENT:</label>
                <span>${thread.content}</span>
            </div>
            <div class="comments-section">
                <h4>COMMENTS (${comments.length})</h4>
        `;

        if (comments.length > 0) {
            comments.forEach(comment => {
                modalContent += `
                    <div class="comment-item">
                        <div class="comment-header">
                            <span>${comment.username}</span>
                            <span>${new Date(comment.created_at).toLocaleString()}</span>
                            ${(this.currentUser.username === comment.username || this.currentUser.role === 'admin') ? `
                                <div class="comment-actions">
                                    <button class="item-action-btn danger delete-comment-btn" data-id="${comment.comment_id}">DELETE</button>
                                </div>
                            ` : ''}
                        </div>
                        <div class="comment-content">${comment.content}</div>
                    </div>
                `;
            });
        } else {
            modalContent += '<div class="comment-item">No comments yet</div>';
        }

        modalContent += '</div>';
        modalBody.innerHTML = modalContent;

        // Show edit/delete buttons if user owns thread or is admin
        if (this.currentUser.username === thread.username || this.currentUser.role === 'admin') {
            editBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
        } else {
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        }

        // Bind delete comment events
        document.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteComment(parseInt(e.target.dataset.id));
            });
        });

        this.openModal(this.elements.threadDetailsModal);
    }

    async editThread(threadId) {
        try {
            const response = await this.makeRequest(`/threads/${this.currentAnimeId}`, 'GET');
            const data = await response.json();

            if (response.ok) {
                const thread = data.data.find(t => t.thread_id === threadId);
                if (thread) {
                    this.currentThreadId = threadId;
                    this.showThreadForm(thread);
                } else {
                    this.showMessage('Thread not found', 'error');
                }
            } else {
                this.showMessage('Failed to load thread data', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        }
    }

    async deleteThread(threadId) {
        if (!confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.makeRequest(`/threads/${threadId}`, 'DELETE');

            if (response.ok) {
                this.showMessage('Thread deleted successfully!', 'success');
                this.closeModal(this.elements.threadDetailsModal);
                this.loadForumThreads(this.currentAnimeId, this.currentPage);
                this.addActivityLog('> FORUM THREAD DELETED');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to delete thread', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showCommentForm() {
        const form = this.elements.commentForm;
        form.reset();
        this.openModal(this.elements.commentModal);
    }

    async handleCommentForm(e) {
        e.preventDefault();
        
        const formData = {
            thread_id: this.currentThreadId,
            content: document.getElementById('comment-content').value
        };

        this.showLoading(true);

        try {
            const response = await this.makeRequest('/comments', 'POST', formData);
            const data = await response.json();

            if (response.ok) {
                this.showMessage('Comment added successfully!', 'success');
                this.closeModal(this.elements.commentModal);
                // Refresh thread details to show new comment
                this.showThreadDetails(this.currentThreadId);
                this.addActivityLog('> COMMENT POSTED');
            } else {
                this.showMessage(data.error || 'Failed to add comment', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Delete this comment?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.makeRequest(`/comments/${commentId}`, 'DELETE');

            if (response.ok) {
                this.showMessage('Comment deleted successfully!', 'success');
                // Refresh thread details
                this.showThreadDetails(this.currentThreadId);
                this.addActivityLog('> COMMENT DELETED');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to delete comment', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Profile Methods
    async loadProfile() {
        if (!this.currentUser) return;

        try {
            const response = await this.makeRequest(`/users/${this.currentUser.id}`, 'GET');
            const data = await response.json();

            if (response.ok) {
                this.displayProfile(data);
            } else {
                this.showMessage('Failed to load profile', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        }
    }

    displayProfile(userData) {
        document.getElementById('profile-username').textContent = userData.username;
        document.getElementById('profile-email').textContent = userData.email;
        document.getElementById('profile-role').textContent = userData.role.toUpperCase();
        document.getElementById('profile-bio').textContent = userData.bio || 'No bio provided';
    }

    showProfileForm() {
        const form = this.elements.profileForm;
        
        // Pre-fill form with current data
        document.getElementById('edit-username').value = this.currentUser.username;
        document.getElementById('edit-email').value = document.getElementById('profile-email').textContent;
        document.getElementById('edit-bio').value = document.getElementById('profile-bio').textContent === 'No bio provided' ? '' : document.getElementById('profile-bio').textContent;
        document.getElementById('edit-password').value = '';

        this.openModal(this.elements.profileModal);
    }

    async handleProfileForm(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('edit-username').value,
            email: document.getElementById('edit-email').value,
            bio: document.getElementById('edit-bio').value
        };

        const password = document.getElementById('edit-password').value;
        if (password) {
            formData.password = password;
        }

        this.showLoading(true);

        try {
            const response = await this.makeRequest(`/users/${this.currentUser.id}`, 'PUT', formData);
            const data = await response.json();

            if (response.ok) {
                this.showMessage('Profile updated successfully!', 'success');
                this.closeModal(this.elements.profileModal);
                // Update current user data
                this.currentUser.username = formData.username;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.loadProfile();
                this.addActivityLog('> USER PROFILE UPDATED');
            } else {
                this.showMessage(data.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            this.showMessage('Connection error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Admin Methods
    async loadAdmin() {
        if (this.currentUser.role !== 'admin') return;

        try {
            // For now, we'll just show the admin panel
            // In a real app, you might load user management data here
            this.addActivityLog('> ADMIN CONTROL PANEL ACCESSED');
        } catch (error) {
            console.error('Failed to load admin data:', error);
        }
    }

    // Utility Methods
    async makeRequest(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (this.authToken) {
            options.headers.Authorization = `Bearer ${this.authToken}`;
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        return fetch(url, options);
    }

    showLoading(show) {
        if (this.elements.loading) {
            this.elements.loading.style.display = show ? 'flex' : 'none';
        }
    }

    showMessage(message, type = 'success') {
        // Remove existing messages
        document.querySelectorAll('.status-message').forEach(msg => msg.remove());

        const messageElement = document.createElement('div');
        messageElement.className = `status-message ${type}`;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }

    openModal(modal) {
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            // Reset current IDs when closing modals
            if (modal === this.elements.animeModal || modal === this.elements.animeFormModal) {
                this.currentAnimeId = null;
            }
            if (modal === this.elements.threadDetailsModal || modal === this.elements.threadModal) {
                this.currentThreadId = null;
            }
        }
    }

    addActivityLog(message) {
        const activityLog = document.getElementById('recent-activity');
        if (activityLog) {
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.textContent = `[${timestamp}] ${message}`;
            
            // Add to top of log
            activityLog.insertBefore(activityItem, activityLog.firstChild);
            
            // Keep only last 10 items
            while (activityLog.children.length > 10) {
                activityLog.removeChild(activityLog.lastChild);
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aniConnect = new AniConnect();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AniConnect;
}