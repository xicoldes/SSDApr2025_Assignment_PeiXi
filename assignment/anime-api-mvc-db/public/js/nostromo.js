// NOSTROMO TERMINAL SYSTEM - ANICONNECT v2.183
// Weyland-Yutani Corporation - All Rights Reserved

class NostromoTerminal {
    constructor() {
        this.API_BASE = '';
        this.currentUser = null;
        this.token = localStorage.getItem('token');
        this.currentPage = {
            anime: 1,
            watchlist: 1,
            forum: 1,
            users: 1
        };
        this.currentFilters = {
            anime: {},
            watchlist: { status: 'all' },
            forum: {},
            users: {}
        };
        this.init();
    }

    init() {
        this.updateSystemTime();
        setInterval(() => this.updateSystemTime(), 1000);
        this.setupEventListeners();
        this.checkAuthentication();
    }

    // ================== UTILITY METHODS ==================

    updateSystemTime() {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/[/,:]/g, '.').replace(' ', '.');
        document.getElementById('system-time').textContent = timeString;
    }

    showMessage(message, type = 'success') {
        // Remove existing messages
        document.querySelectorAll('.status-message').forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message ${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        setTimeout(() => messageDiv.remove(), 4000);
    }

    showLoading(show = true) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }

    async apiRequest(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        if (config.body && typeof config.body !== 'string') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                // Try to parse error response, fallback to status text
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                } catch (parseError) {
                    errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            // Handle responses with no content (204, etc.)
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return null; // Return null for successful no-content responses
            }

            // Try to parse JSON, but handle empty responses gracefully
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const text = await response.text();
                return text ? JSON.parse(text) : null;
            }

            // For non-JSON responses, return the response object
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ================== EVENT LISTENERS ==================

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Authentication forms
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Toggle between login and register
        document.getElementById('register-toggle').addEventListener('click', () => {
            document.querySelector('#login-section .login-container').style.display = 'none';
            document.getElementById('register-container').style.display = 'block';
        });

        document.getElementById('login-toggle').addEventListener('click', () => {
            document.querySelector('#login-section .login-container').style.display = 'block';
            document.getElementById('register-container').style.display = 'none';
        });

        // Modal close
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('universal-modal').addEventListener('click', (e) => {
            if (e.target.id === 'universal-modal') {
                this.closeModal();
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Profile edit
        document.getElementById('edit-profile').addEventListener('click', () => {
            this.showEditProfileModal();
        });

        // Anime search and filters
        document.getElementById('anime-search').addEventListener('input', 
            this.debounce(() => this.loadAnime(), 500));

        document.getElementById('genre-filter').addEventListener('change', () => {
            this.currentPage.anime = 1;
            this.loadAnime();
        });

        document.getElementById('sort-filter').addEventListener('change', () => {
            this.currentPage.anime = 1;
            this.loadAnime();
        });

        document.getElementById('clear-filters').addEventListener('click', () => {
            document.getElementById('anime-search').value = '';
            document.getElementById('genre-filter').value = '';
            document.getElementById('sort-filter').value = 'title-ASC';
            this.currentPage.anime = 1;
            this.loadAnime();
        });

        // Anime pagination
        document.getElementById('anime-prev-page').addEventListener('click', () => {
            if (this.currentPage.anime > 1) {
                this.currentPage.anime--;
                this.loadAnime();
            }
        });

        document.getElementById('anime-next-page').addEventListener('click', () => {
            this.currentPage.anime++;
            this.loadAnime();
        });

        // Watchlist filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilters.watchlist.status = e.target.dataset.status;
                this.currentPage.watchlist = 1;
                this.loadWatchlist();
            });
        });

        // Watchlist pagination
        document.getElementById('watchlist-prev-page').addEventListener('click', () => {
            if (this.currentPage.watchlist > 1) {
                this.currentPage.watchlist--;
                this.loadWatchlist();
            }
        });

        document.getElementById('watchlist-next-page').addEventListener('click', () => {
            this.currentPage.watchlist++;
            this.loadWatchlist();
        });

        // Forum controls
        document.getElementById('create-thread').addEventListener('click', () => {
            this.showCreateThreadModal();
        });

        document.getElementById('load-threads').addEventListener('click', () => {
            const animeId = document.getElementById('forum-anime-filter').value;
            if (animeId) {
                this.currentPage.forum = 1;
                this.loadForumThreads(animeId);
            } else {
                this.showMessage('Please select an anime first', 'warning');
            }
        });

        // Forum pagination
        document.getElementById('forum-prev-page').addEventListener('click', () => {
            if (this.currentPage.forum > 1) {
                this.currentPage.forum--;
                const animeId = document.getElementById('forum-anime-filter').value;
                if (animeId) this.loadForumThreads(animeId);
            }
        });

        document.getElementById('forum-next-page').addEventListener('click', () => {
            this.currentPage.forum++;
            const animeId = document.getElementById('forum-anime-filter').value;
            if (animeId) this.loadForumThreads(animeId);
        });

        // Admin tabs
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(`admin-${e.target.dataset.tab}`).classList.add('active');
                
                if (e.target.dataset.tab === 'users') {
                    this.loadUsers();
                } else if (e.target.dataset.tab === 'anime-admin') {
                    this.loadAdminAnime();
                }
            });
        });

        // Admin user search
        document.getElementById('user-search').addEventListener('input', 
            this.debounce(() => this.loadUsers(), 500));

        document.getElementById('role-filter').addEventListener('change', () => {
            this.currentPage.users = 1;
            this.loadUsers();
        });

        // Admin user pagination
        document.getElementById('users-prev-page').addEventListener('click', () => {
            if (this.currentPage.users > 1) {
                this.currentPage.users--;
                this.loadUsers();
            }
        });

        document.getElementById('users-next-page').addEventListener('click', () => {
            this.currentPage.users++;
            this.loadUsers();
        });

        // Add anime button
        document.getElementById('add-anime').addEventListener('click', () => {
            this.showAddAnimeModal();
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ================== AUTHENTICATION ==================

    async checkAuthentication() {
        if (!this.token) {
            this.showSection('login');
            return;
        }

        try {
            // Decode the JWT token to get user info
            const tokenPayload = this.decodeJWT(this.token);
            if (!tokenPayload || !tokenPayload.id) {
                throw new Error('Invalid token payload');
            }

            // Verify token by making a request to get user profile
            const userData = await this.apiRequest(`/users/${tokenPayload.id}`);
            
            this.currentUser = {
                ...userData,
                id: tokenPayload.id // Ensure we have the ID from the token
            };
            
            this.updateUIForLoggedInUser();
            this.showSection('dashboard');
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.handleLogout();
        }
    }

    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const data = await this.apiRequest('/login', {
                method: 'POST',
                body: { username, password }
            });

            this.token = data.token;
            this.currentUser = {
                ...data.user,
                id: data.user.id || data.user.user_id // Handle both possible field names
            };
            
            localStorage.setItem('token', this.token);

            this.updateUIForLoggedInUser();
            this.showSection('dashboard');
            this.showMessage(`Welcome back, ${data.user.username}!`, 'success');

            // Clear form
            document.getElementById('login-form').reset();

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const data = await this.apiRequest('/register', {
                method: 'POST',
                body: { username, email, password }
            });

            this.token = data.token;
            this.currentUser = {
                ...data.user,
                id: data.user.id || data.user.user_id // Handle both possible field names
            };
            
            localStorage.setItem('token', this.token);

            this.updateUIForLoggedInUser();
            this.showSection('dashboard');
            this.showMessage(`Registration successful! Welcome, ${data.user.username}!`, 'success');

            // Clear form and switch back to login view
            document.getElementById('register-form').reset();
            document.querySelector('#login-section .login-container').style.display = 'block';
            document.getElementById('register-container').style.display = 'none';

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleLogout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        
        this.showSection('login');
        this.showMessage('Session terminated', 'success');
        
        // Reset UI
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
        document.getElementById('login-form').reset();
    }

    updateUIForLoggedInUser() {
        if (!this.currentUser) return;

        console.log('Current user:', this.currentUser); // Debug log

        // Ensure user ID is properly set
        if (!this.currentUser.id && this.currentUser.user_id) {
            this.currentUser.id = this.currentUser.user_id;
        }

        // Update profile info
        document.getElementById('profile-username').textContent = this.currentUser.username || '-';
        document.getElementById('profile-role').textContent = (this.currentUser.role || 'user').toUpperCase();
        document.getElementById('profile-email').textContent = this.currentUser.email || '-';
        document.getElementById('profile-bio').textContent = this.currentUser.bio || 'No bio provided';

        // Update dashboard
        document.getElementById('dash-username').textContent = (this.currentUser.username || 'UNKNOWN').toUpperCase();
        document.getElementById('dash-user-role').textContent = (this.currentUser.role || 'user').toUpperCase();

        // Show admin section if user is admin
        if (this.currentUser.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        }

        // Load initial data
        this.loadAnime();
        this.populateAnimeSelects();
        this.loadWatchlist();
    }

    // ================== NAVIGATION ==================

    showSection(sectionName) {
        // Handle login section visibility
        if (sectionName === 'login') {
            document.getElementById('login-section').classList.add('active');
            document.querySelectorAll('.terminal-section:not(#login-section)').forEach(section => {
                section.classList.remove('active');
            });
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            return;
        }

        // Hide login section
        document.getElementById('login-section').classList.remove('active');

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.terminal-section:not(#login-section)').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Load section-specific data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'anime':
                this.loadAnime();
                break;
            case 'watchlist':
                this.loadWatchlist();
                break;
            case 'forum':
                this.populateAnimeSelects();
                break;
            case 'admin':
                this.loadUsers();
                break;
        }
    }

    // ================== MODAL MANAGEMENT ==================

    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('universal-modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('universal-modal').style.display = 'none';
    }

    // ================== DASHBOARD ==================

    async loadDashboard() {
        try {
            // Add recent activity
            this.addRecentActivity('Dashboard accessed');
            
            // You can add more dashboard-specific loading here
            // For now, we'll just show a simple activity log
        } catch (error) {
            console.error('Dashboard load error:', error);
        }
    }

    addRecentActivity(activity) {
        const activityLog = document.getElementById('recent-activity');
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.textContent = `> ${activity}`;
        
        activityLog.insertBefore(activityItem, activityLog.firstChild);
        
        // Keep only last 5 activities
        while (activityLog.children.length > 5) {
            activityLog.removeChild(activityLog.lastChild);
        }
    }

    // ================== ANIME MANAGEMENT ==================

    async loadAnime() {
        this.showLoading(true);
        try {
            const search = document.getElementById('anime-search').value;
            const genre = document.getElementById('genre-filter').value;
            const [sortBy, sortOrder] = document.getElementById('sort-filter').value.split('-');
            
            const params = new URLSearchParams({
                page: this.currentPage.anime,
                limit: 12,
                ...(search && { search }),
                ...(genre && { genre }),
                sortBy,
                sortOrder
            });

            const data = await this.apiRequest(`/anime?${params}`);
            this.renderAnimeGrid(data.data);
            this.updateAnimePagination(data.pagination);

        } catch (error) {
            this.showMessage(`Failed to load anime: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderAnimeGrid(animeList) {
        const grid = document.getElementById('anime-grid');
        grid.innerHTML = '';

        animeList.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = 'data-item';
            animeCard.innerHTML = `
                <div class="item-actions">
                    <button class="action-btn" onclick="terminal.addToWatchlist(${anime.anime_id})">+</button>
                    <button class="action-btn" onclick="terminal.showAnimeDetails(${anime.anime_id})">VIEW</button>
                </div>
                <h4>${anime.title}</h4>
                <p><strong>Genre:</strong> ${anime.genre || 'N/A'}</p>
                <p><strong>Episodes:</strong> ${anime.episodes || 'N/A'}</p>
                <p><strong>Studio:</strong> ${anime.studio || 'N/A'}</p>
                <p><strong>Rating:</strong> ${anime.rating || 'N/A'}/10</p>
                <p><strong>Released:</strong> ${anime.release_date || 'N/A'}</p>
            `;
            grid.appendChild(animeCard);
        });

        if (animeList.length === 0) {
            grid.innerHTML = '<div class="data-item"><p>No anime found matching your criteria.</p></div>';
        }
    }

    updateAnimePagination(pagination) {
        document.getElementById('anime-page-info').textContent = 
            `PAGE ${pagination.page} OF ${pagination.totalPages}`;
        
        document.getElementById('anime-prev-page').disabled = !pagination.hasPrev;
        document.getElementById('anime-next-page').disabled = !pagination.hasNext;
    }

    async showAnimeDetails(animeId) {
        try {
            const anime = await this.apiRequest(`/anime/${animeId}`);
            const content = `
                <div class="anime-details">
                    <h4>${anime.title}</h4>
                    <p><strong>Description:</strong> ${anime.description || 'No description available'}</p>
                    <p><strong>Genre:</strong> ${anime.genre || 'N/A'}</p>
                    <p><strong>Episodes:</strong> ${anime.episodes || 'N/A'}</p>
                    <p><strong>Studio:</strong> ${anime.studio || 'N/A'}</p>
                    <p><strong>Rating:</strong> ${anime.rating || 'N/A'}/10</p>
                    <p><strong>Release Date:</strong> ${anime.release_date || 'N/A'}</p>
                    <div style="margin-top: 20px;">
                        <button class="terminal-button" onclick="terminal.addToWatchlist(${anime.anime_id})">
                            ADD TO WATCHLIST
                        </button>
                        <button class="terminal-button" onclick="terminal.closeModal()">
                            CLOSE
                        </button>
                    </div>
                </div>
            `;
            this.showModal('ANIME DETAILS', content);
        } catch (error) {
            this.showMessage(`Failed to load anime details: ${error.message}`, 'error');
        }
    }

    async addToWatchlist(animeId, status = 'plan-to-watch') {
        try {
            await this.apiRequest('/watchlist', {
                method: 'POST',
                body: { anime_id: animeId, status }
            });
            this.showMessage('Added to watchlist!', 'success');
            this.addRecentActivity('Anime added to watchlist');
        } catch (error) {
            this.showMessage(`Failed to add to watchlist: ${error.message}`, 'error');
        }
    }

    async populateAnimeSelects() {
        try {
            const data = await this.apiRequest('/anime?limit=100');
            
            // Populate forum anime filter
            const forumSelect = document.getElementById('forum-anime-filter');
            forumSelect.innerHTML = '<option value="">SELECT ANIME</option>';
            
            // Populate genre filter (extract unique genres)
            const genreFilter = document.getElementById('genre-filter');
            const genres = new Set();
            
            data.data.forEach(anime => {
                // Add to forum select
                const option = document.createElement('option');
                option.value = anime.anime_id;
                option.textContent = anime.title;
                forumSelect.appendChild(option);
                
                // Collect genres
                if (anime.genre) {
                    anime.genre.split(',').forEach(genre => {
                        genres.add(genre.trim());
                    });
                }
            });
            
            // Populate genre filter
            genreFilter.innerHTML = '<option value="">ALL GENRES</option>';
            Array.from(genres).sort().forEach(genre => {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre.toUpperCase();
                genreFilter.appendChild(option);
            });
            
        } catch (error) {
            console.error('Failed to populate anime selects:', error);
        }
    }

    // ================== WATCHLIST MANAGEMENT ==================

    async loadWatchlist() {
        if (!this.currentUser || !this.currentUser.id) {
            console.error('No current user or user ID available');
            return;
        }
        
        this.showLoading(true);
        try {
            const status = this.currentFilters.watchlist.status === 'all' ? '' : this.currentFilters.watchlist.status;
            const params = new URLSearchParams({
                page: this.currentPage.watchlist,
                limit: 12,
                ...(status && { status })
            });

            console.log('Loading watchlist for user ID:', this.currentUser.id); // Debug log
            const data = await this.apiRequest(`/watchlist/${this.currentUser.id}?${params}`);
            this.renderWatchlistGrid(data.data);
            this.updateWatchlistPagination(data.pagination);

        } catch (error) {
            console.error('Watchlist load error:', error); // Enhanced error logging
            this.showMessage(`Failed to load watchlist: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderWatchlistGrid(watchlist) {
        const grid = document.getElementById('watchlist-grid');
        grid.innerHTML = '';

        watchlist.forEach(item => {
            const watchlistCard = document.createElement('div');
            watchlistCard.className = 'data-item';
            watchlistCard.innerHTML = `
                <div class="item-actions">
                    <button class="action-btn" onclick="terminal.showEditWatchlistModal(${item.anime_id})">EDIT</button>
                    <button class="action-btn danger" onclick="terminal.removeFromWatchlist(${item.anime_id})">REMOVE</button>
                </div>
                <h4>${item.title}</h4>
                <p><strong>Status:</strong> ${item.status.toUpperCase()}</p>
                <p><strong>Progress:</strong> ${item.progress || 0}/${item.episodes || '?'}</p>
                <p><strong>Rating:</strong> ${item.rating ? `${item.rating}/5` : 'Not rated'}</p>
                <p><strong>Genre:</strong> ${item.genre || 'N/A'}</p>
                ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
            `;
            grid.appendChild(watchlistCard);
        });

        if (watchlist.length === 0) {
            grid.innerHTML = '<div class="data-item"><p>No anime in your watchlist yet.</p></div>';
        }
    }

    updateWatchlistPagination(pagination) {
        document.getElementById('watchlist-page-info').textContent = 
            `PAGE ${pagination.page} OF ${pagination.totalPages}`;
        
        document.getElementById('watchlist-prev-page').disabled = pagination.page <= 1;
        document.getElementById('watchlist-next-page').disabled = pagination.page >= pagination.totalPages;
    }

    async removeFromWatchlist(animeId) {
        if (!confirm('Remove this anime from your watchlist?')) return;
        
        try {
            const response = await this.apiRequest(`/watchlist/${animeId}`, { method: 'DELETE' });
            // Response will be null for 204 status, which is expected
            this.showMessage('Removed from watchlist', 'success');
            this.loadWatchlist();
            this.addRecentActivity('Anime removed from watchlist');
        } catch (error) {
            this.showMessage(`Failed to remove from watchlist: ${error.message}`, 'error');
        }
    }

    showEditWatchlistModal(animeId) {
        const content = `
            <form id="edit-watchlist-form">
                <div class="form-group">
                    <label>Status:</label>
                    <select id="watchlist-status" class="terminal-select" required>
                        <option value="watching">WATCHING</option>
                        <option value="completed">COMPLETED</option>
                        <option value="plan-to-watch">PLAN TO WATCH</option>
                        <option value="on-hold">ON HOLD</option>
                        <option value="dropped">DROPPED</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Progress (Episodes):</label>
                    <input type="number" id="watchlist-progress" class="terminal-input" min="0">
                </div>
                <div class="form-group">
                    <label>Rating (1-5):</label>
                    <select id="watchlist-rating" class="terminal-select">
                        <option value="">No Rating</option>
                        <option value="1">1 - Poor</option>
                        <option value="2">2 - Fair</option>
                        <option value="3">3 - Good</option>
                        <option value="4">4 - Very Good</option>
                        <option value="5">5 - Excellent</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notes:</label>
                    <textarea id="watchlist-notes" class="terminal-textarea" rows="3" placeholder="Your thoughts..."></textarea>
                </div>
                <button type="submit" class="terminal-button">UPDATE</button>
                <button type="button" class="terminal-button" onclick="terminal.closeModal()">CANCEL</button>
            </form>
        `;
        
        this.showModal('EDIT WATCHLIST ENTRY', content);
        
        document.getElementById('edit-watchlist-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateWatchlistEntry(animeId);
        });
    }

    async updateWatchlistEntry(animeId) {
        try {
            const status = document.getElementById('watchlist-status').value;
            const progress = document.getElementById('watchlist-progress').value;
            const rating = document.getElementById('watchlist-rating').value;
            const notes = document.getElementById('watchlist-notes').value;
            
            const updateData = { status };
            if (progress) updateData.progress = parseInt(progress);
            if (rating) updateData.rating = parseInt(rating);
            if (notes) updateData.notes = notes;
            
            await this.apiRequest(`/watchlist/${animeId}`, {
                method: 'PUT',
                body: updateData
            });
            
            this.showMessage('Watchlist entry updated!', 'success');
            this.closeModal();
            this.loadWatchlist();
        } catch (error) {
            this.showMessage(`Failed to update watchlist entry: ${error.message}`, 'error');
        }
    }

    // ================== FORUM MANAGEMENT ==================

    async loadForumThreads(animeId) {
        this.showLoading(true);
        try {
            const params = new URLSearchParams({
                page: this.currentPage.forum,
                limit: 10
            });

            const data = await this.apiRequest(`/threads/${animeId}?${params}`);
            this.renderForumThreads(data.data);
            this.updateForumPagination(data.pagination);

        } catch (error) {
            this.showMessage(`Failed to load forum threads: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderForumThreads(threads) {
        const container = document.getElementById('forum-threads');
        container.innerHTML = '';

        threads.forEach(thread => {
            const threadDiv = document.createElement('div');
            threadDiv.className = 'forum-thread';
            threadDiv.innerHTML = `
                <div class="item-actions">
                    <button class="action-btn" onclick="terminal.showThreadDetails(${thread.thread_id})">VIEW</button>
                    ${this.currentUser && (this.currentUser.id === thread.user_id || this.currentUser.role === 'admin') ?
                        `<button class="action-btn danger" onclick="terminal.deleteThread(${thread.thread_id})">DELETE</button>` : ''}
                </div>
                <h4>${thread.title}</h4>
                <div class="forum-meta">
                    By ${thread.username} | ${new Date(thread.created_at).toLocaleDateString()} | 
                    Views: ${thread.view_count || 0}
                </div>
            `;
            container.appendChild(threadDiv);
        });

        if (threads.length === 0) {
            container.innerHTML = '<div class="forum-thread"><p>No threads found for this anime.</p></div>';
        }
    }

    updateForumPagination(pagination) {
        document.getElementById('forum-page-info').textContent = 
            `PAGE ${pagination.page} OF ${pagination.totalPages}`;
        
        document.getElementById('forum-prev-page').disabled = pagination.page <= 1;
        document.getElementById('forum-next-page').disabled = pagination.page >= pagination.totalPages;
    }

    showCreateThreadModal() {
        const animeId = document.getElementById('forum-anime-filter').value;
        if (!animeId) {
            this.showMessage('Please select an anime first', 'warning');
            return;
        }

        const content = `
            <form id="create-thread-form">
                <div class="form-group">
                    <label>Thread Title:</label>
                    <input type="text" id="thread-title" class="terminal-input" required maxlength="255" placeholder="Enter thread title...">
                </div>
                <div class="form-group">
                    <label>Content:</label>
                    <textarea id="thread-content" class="terminal-textarea" required rows="6" placeholder="What would you like to discuss?"></textarea>
                </div>
                <button type="submit" class="terminal-button">CREATE THREAD</button>
                <button type="button" class="terminal-button" onclick="terminal.closeModal()">CANCEL</button>
            </form>
        `;
        
        this.showModal('CREATE DISCUSSION THREAD', content);
        
        document.getElementById('create-thread-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createThread(animeId);
        });
    }

    async createThread(animeId) {
        try {
            const title = document.getElementById('thread-title').value;
            const content = document.getElementById('thread-content').value;
            
            await this.apiRequest('/threads', {
                method: 'POST',
                body: {
                    anime_id: parseInt(animeId),
                    title,
                    content
                }
            });
            
            this.showMessage('Thread created successfully!', 'success');
            this.closeModal();
            this.loadForumThreads(animeId);
            this.addRecentActivity('Forum thread created');
        } catch (error) {
            this.showMessage(`Failed to create thread: ${error.message}`, 'error');
        }
    }

    async showThreadDetails(threadId) {
        try {
            // Load comments for this thread
            const comments = await this.apiRequest(`/comments/${threadId}`);
            
            let commentsHtml = '<div class="comments-container"><h4>COMMENTS:</h4>';
            
            if (comments.length === 0) {
                commentsHtml += '<p>No comments yet.</p>';
            } else {
                comments.forEach(comment => {
                    commentsHtml += `
                        <div class="comment-item">
                            <div class="comment-header">
                                <span class="comment-author">${comment.username}</span>
                                <span class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <div class="comment-content">${comment.content}</div>
                            <div class="comment-actions">
                                <button class="vote-btn" onclick="terminal.upvoteComment(${comment.comment_id})">
                                    ▲ <span class="vote-count">${comment.upvotes || 0}</span>
                                </button>
                                ${this.currentUser && (this.currentUser.id === comment.user_id || this.currentUser.role === 'admin') ?
                                    `<button class="action-btn danger" onclick="terminal.deleteComment(${comment.comment_id})">DELETE</button>` : ''}
                            </div>
                        </div>
                    `;
                });
            }
            
            commentsHtml += `
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--terminal-border);">
                    <form id="add-comment-form">
                        <div class="form-group">
                            <label>Add Comment:</label>
                            <textarea id="comment-content" class="terminal-textarea" rows="3" placeholder="Your comment..." required></textarea>
                        </div>
                        <button type="submit" class="terminal-button">POST COMMENT</button>
                        <button type="button" class="terminal-button" onclick="terminal.closeModal()">CLOSE</button>
                    </form>
                </div>
            `;
            
            this.showModal('THREAD DISCUSSION', commentsHtml);
            
            document.getElementById('add-comment-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.addComment(threadId);
            });
            
        } catch (error) {
            this.showMessage(`Failed to load thread details: ${error.message}`, 'error');
        }
    }

    async addComment(threadId) {
        try {
            const content = document.getElementById('comment-content').value;
            
            await this.apiRequest('/comments', {
                method: 'POST',
                body: {
                    thread_id: parseInt(threadId),
                    content
                }
            });
            
            this.showMessage('Comment posted!', 'success');
            this.showThreadDetails(threadId); // Reload thread details
        } catch (error) {
            this.showMessage(`Failed to post comment: ${error.message}`, 'error');
        }
    }

    async upvoteComment(commentId) {
        try {
            await this.apiRequest(`/comments/${commentId}/upvote`, {
                method: 'PUT'
            });
            this.showMessage('Comment upvoted!', 'success');
        } catch (error) {
            this.showMessage(`Failed to upvote comment: ${error.message}`, 'error');
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Delete this comment?')) return;
        
        try {
            await this.apiRequest(`/comments/${commentId}`, {
                method: 'DELETE'
            });
            this.showMessage('Comment deleted', 'success');
            this.closeModal();
        } catch (error) {
            this.showMessage(`Failed to delete comment: ${error.message}`, 'error');
        }
    }

    async deleteThread(threadId) {
        if (!confirm('Delete this thread and all its comments?')) return;
        
        try {
            await this.apiRequest(`/threads/${threadId}`, {
                method: 'DELETE'
            });
            this.showMessage('Thread deleted', 'success');
            
            // Reload threads if an anime is selected
            const animeId = document.getElementById('forum-anime-filter').value;
            if (animeId) {
                this.loadForumThreads(animeId);
            }
        } catch (error) {
            this.showMessage(`Failed to delete thread: ${error.message}`, 'error');
        }
    }

    // ================== PROFILE MANAGEMENT ==================

    showEditProfileModal() {
        if (!this.currentUser) return;

        const content = `
            <form id="edit-profile-form">
                <div class="form-group">
                    <label>Username:</label>
                    <input type="text" id="edit-username" class="terminal-input" value="${this.currentUser.username}" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="edit-email" class="terminal-input" value="${this.currentUser.email}" required>
                </div>
                <div class="form-group">
                    <label>New Password (leave blank to keep current):</label>
                    <input type="password" id="edit-password" class="terminal-input" placeholder="Enter new password or leave blank">
                </div>
                <div class="form-group">
                    <label>Bio:</label>
                    <textarea id="edit-bio" class="terminal-textarea" rows="3" placeholder="Tell us about yourself...">${this.currentUser.bio || ''}</textarea>
                </div>
                <button type="submit" class="terminal-button">UPDATE PROFILE</button>
                <button type="button" class="terminal-button" onclick="terminal.closeModal()">CANCEL</button>
            </form>
        `;
        
        this.showModal('EDIT USER PROFILE', content);
        
        document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateProfile();
        });
    }

    async updateProfile() {
        if (!this.currentUser || !this.currentUser.id) {
            this.showMessage('User session invalid', 'error');
            return;
        }

        try {
            const username = document.getElementById('edit-username').value;
            const email = document.getElementById('edit-email').value;
            const password = document.getElementById('edit-password').value;
            const bio = document.getElementById('edit-bio').value;
            
            const updateData = { username, email, bio };
            if (password) updateData.password = password;
            
            await this.apiRequest(`/users/${this.currentUser.id}`, {
                method: 'PUT',
                body: updateData
            });
            
            // Update current user data
            this.currentUser.username = username;
            this.currentUser.email = email;
            this.currentUser.bio = bio;
            
            this.updateUIForLoggedInUser();
            this.showMessage('Profile updated successfully!', 'success');
            this.closeModal();
            this.addRecentActivity('Profile updated');
        } catch (error) {
            this.showMessage(`Failed to update profile: ${error.message}`, 'error');
        }
    }

    // ================== ADMIN FUNCTIONS ==================

    async loadUsers() {
        if (this.currentUser?.role !== 'admin') return;
        
        this.showLoading(true);
        try {
            const search = document.getElementById('user-search').value;
            const role = document.getElementById('role-filter').value;
            
            const params = new URLSearchParams({
                page: this.currentPage.users,
                limit: 12,
                ...(search && { search }),
                ...(role && { role })
            });

            const data = await this.apiRequest(`/users?${params}`);
            this.renderUsersGrid(data.data);
            this.updateUsersPagination(data.pagination);

        } catch (error) {
            this.showMessage(`Failed to load users: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderUsersGrid(users) {
        const grid = document.getElementById('users-grid');
        grid.innerHTML = '';

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'data-item';
            userCard.innerHTML = `
                <div class="item-actions">
                    <button class="action-btn" onclick="terminal.showUserDetails(${user.user_id})">VIEW</button>
                    ${user.user_id !== this.currentUser.id ? 
                        `<button class="action-btn danger" onclick="terminal.deleteUser(${user.user_id})">DELETE</button>` : ''}
                </div>
                <h4>${user.username}</h4>
                <p><strong>Role:</strong> ${user.role.toUpperCase()}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Joined:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                ${user.bio ? `<p><strong>Bio:</strong> ${user.bio}</p>` : ''}
            `;
            grid.appendChild(userCard);
        });

        if (users.length === 0) {
            grid.innerHTML = '<div class="data-item"><p>No users found.</p></div>';
        }
    }

    updateUsersPagination(pagination) {
        document.getElementById('users-page-info').textContent = 
            `PAGE ${pagination.page} OF ${pagination.totalPages}`;
        
        document.getElementById('users-prev-page').disabled = pagination.page <= 1;
        document.getElementById('users-next-page').disabled = pagination.page >= pagination.totalPages;
    }

    async showUserDetails(userId) {
        try {
            const user = await this.apiRequest(`/users/${userId}`);
            const content = `
                <div class="user-details">
                    <h4>${user.username}</h4>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role.toUpperCase()}</p>
                    <p><strong>Bio:</strong> ${user.bio || 'No bio provided'}</p>
                    <div style="margin-top: 20px;">
                        <button class="terminal-button" onclick="terminal.closeModal()">CLOSE</button>
                    </div>
                </div>
            `;
            this.showModal('USER DETAILS', content);
        } catch (error) {
            this.showMessage(`Failed to load user details: ${error.message}`, 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Delete this user and all their data?')) return;
        
        try {
            await this.apiRequest(`/users/${userId}`, {
                method: 'DELETE'
            });
            this.showMessage('User deleted', 'success');
            this.loadUsers();
        } catch (error) {
            this.showMessage(`Failed to delete user: ${error.message}`, 'error');
        }
    }

    async loadAdminAnime() {
        if (this.currentUser?.role !== 'admin') return;
        
        this.showLoading(true);
        try {
            const data = await this.apiRequest('/anime?limit=50');
            this.renderAdminAnimeGrid(data.data);
        } catch (error) {
            this.showMessage(`Failed to load admin anime: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderAdminAnimeGrid(animeList) {
        const grid = document.getElementById('admin-anime-grid');
        grid.innerHTML = '';

        animeList.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = 'data-item';
            animeCard.innerHTML = `
                <div class="item-actions">
                    <button class="action-btn" onclick="terminal.showEditAnimeModal(${anime.anime_id})">EDIT</button>
                    <button class="action-btn danger" onclick="terminal.deleteAnime(${anime.anime_id})">DELETE</button>
                </div>
                <h4>${anime.title}</h4>
                <p><strong>Genre:</strong> ${anime.genre || 'N/A'}</p>
                <p><strong>Episodes:</strong> ${anime.episodes || 'N/A'}</p>
                <p><strong>Studio:</strong> ${anime.studio || 'N/A'}</p>
                <p><strong>Rating:</strong> ${anime.rating || 'N/A'}/10</p>
            `;
            grid.appendChild(animeCard);
        });

        if (animeList.length === 0) {
            grid.innerHTML = '<div class="data-item"><p>No anime found.</p></div>';
        }
    }

    showAddAnimeModal() {
        const content = `
            <form id="add-anime-form">
                <div class="form-group">
                    <label>Title:</label>
                    <input type="text" id="anime-title" class="terminal-input" required maxlength="100">
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="anime-description" class="terminal-textarea" rows="4"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Genre:</label>
                        <input type="text" id="anime-genre" class="terminal-input" maxlength="100">
                    </div>
                    <div class="form-group">
                        <label>Episodes:</label>
                        <input type="number" id="anime-episodes" class="terminal-input" min="1">
                    </div>
                </div>
                <div class="form-group">
                    <label>Studio:</label>
                    <input type="text" id="anime-studio" class="terminal-input" maxlength="50">
                </div>
                <button type="submit" class="terminal-button">ADD ANIME</button>
                <button type="button" class="terminal-button" onclick="terminal.closeModal()">CANCEL</button>
            </form>
        `;
        
        this.showModal('ADD NEW ANIME', content);
        
        document.getElementById('add-anime-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createAnime();
        });
    }

    async createAnime() {
        try {
            const title = document.getElementById('anime-title').value;
            const description = document.getElementById('anime-description').value;
            const genre = document.getElementById('anime-genre').value;
            const episodes = document.getElementById('anime-episodes').value;
            const studio = document.getElementById('anime-studio').value;
            
            await this.apiRequest('/anime', {
                method: 'POST',
                body: {
                    title,
                    description,
                    genre,
                    episodes: episodes ? parseInt(episodes) : null,
                    studio
                }
            });
            
            this.showMessage('Anime added successfully!', 'success');
            this.closeModal();
            this.loadAdminAnime();
            this.populateAnimeSelects(); // Refresh selects
        } catch (error) {
            this.showMessage(`Failed to add anime: ${error.message}`, 'error');
        }
    }

    showEditAnimeModal(animeId) {
        // Get current anime data first
        this.apiRequest(`/anime/${animeId}`).then(anime => {
            const content = `
                <form id="edit-anime-form">
                    <div class="form-group">
                        <label>Title:</label>
                        <input type="text" id="edit-anime-title" class="terminal-input" value="${anime.title}" required maxlength="100">
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea id="edit-anime-description" class="terminal-textarea" rows="4">${anime.description || ''}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Genre:</label>
                            <input type="text" id="edit-anime-genre" class="terminal-input" value="${anime.genre || ''}" maxlength="100">
                        </div>
                        <div class="form-group">
                            <label>Episodes:</label>
                            <input type="number" id="edit-anime-episodes" class="terminal-input" value="${anime.episodes || ''}" min="1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Studio:</label>
                        <input type="text" id="edit-anime-studio" class="terminal-input" value="${anime.studio || ''}" maxlength="50">
                    </div>
                    <button type="submit" class="terminal-button">UPDATE ANIME</button>
                    <button type="button" class="terminal-button" onclick="terminal.closeModal()">CANCEL</button>
                </form>
            `;
            
            this.showModal('EDIT ANIME', content);
            
            document.getElementById('edit-anime-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateAnime(animeId);
            });
        });
    }

    async updateAnime(animeId) {
        try {
            const title = document.getElementById('edit-anime-title').value;
            const description = document.getElementById('edit-anime-description').value;
            const genre = document.getElementById('edit-anime-genre').value;
            const episodes = document.getElementById('edit-anime-episodes').value;
            const studio = document.getElementById('edit-anime-studio').value;
            
            await this.apiRequest(`/anime/${animeId}`, {
                method: 'PUT',
                body: {
                    title,
                    description,
                    genre,
                    episodes: episodes ? parseInt(episodes) : null,
                    studio
                }
            });
            
            this.showMessage('Anime updated successfully!', 'success');
            this.closeModal();
            this.loadAdminAnime();
            this.populateAnimeSelects(); // Refresh selects
        } catch (error) {
            this.showMessage(`Failed to update anime: ${error.message}`, 'error');
        }
    }

    async deleteAnime(animeId) {
        if (!confirm('Delete this anime and all related data (watchlist entries, forum threads)?')) return;
        
        try {
            await this.apiRequest(`/anime/${animeId}`, {
                method: 'DELETE'
            });
            this.showMessage('Anime deleted', 'success');
            this.loadAdminAnime();
            this.populateAnimeSelects(); // Refresh selects
        } catch (error) {
            this.showMessage(`Failed to delete anime: ${error.message}`, 'error');
        }
    }
}

// Initialize the terminal system
const terminal = new NostromoTerminal();

// Make terminal globally available for inline onclick handlers
window.terminal = terminal;