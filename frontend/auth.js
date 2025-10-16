const API_URL = process.env.REACT_APP_API_URL || '/api';

// Check if user is already logged in (only on login page)
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch(`${API_URL}/auth/check-session`, {
                method: 'GET',
                credentials: 'include', // CRITICAL: Include cookies
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('User already logged in, redirecting...');
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.log('No active session');
        }
    });

    // Login form handler (only run if form exists)
    window.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('loginError');
                const submitBtn = e.target.querySelector('button[type="submit"]');
                
                // Clear previous error
                errorDiv.textContent = '';
                errorDiv.classList.remove('show');
                
                // Validation
                if (!username || !password) {
                    errorDiv.textContent = 'Please enter both LRN and password';
                    errorDiv.classList.add('show');
                    return;
                }
                
                // Disable submit button
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
                
                try {
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include', // CRITICAL: Include cookies
                        body: JSON.stringify({ username, password })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        console.log('Login successful:', data.user);
                        
                        // Redirect to dashboard immediately
                        window.location.href = 'dashboard.html';
                    } else {
                        errorDiv.textContent = data.message || 'Login failed';
                        errorDiv.classList.add('show');
                        
                        // Re-enable submit button
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Login';
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    errorDiv.textContent = 'Network error. Please make sure the server is running.';
                    errorDiv.classList.add('show');
                    
                    // Re-enable submit button
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            });
        }
    });
}

// Check authentication function - FIXED
async function checkAuthentication() {
    try {
        console.log('=== CHECKING AUTHENTICATION ===');
        console.log('API URL:', API_URL);
        
        const response = await fetch(`${API_URL}/auth/check-session`, {
            method: 'GET',
            credentials: 'include', // CRITICAL: Include cookies
            headers: {
                'Accept': 'application/json',
            },
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.status === 401) {
            const errorData = await response.json();
            console.warn('Authentication check failed:', errorData.message);
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Authentication successful, user:', data.user.username);
        return data.user;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return null;
    }
}

// Logout function - FIXED
async function logout() {
    try {
        console.log('=== LOGGING OUT ===');
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include' // CRITICAL: Include cookies
        });
        
        if (response.ok) {
            console.log('Logout successful');
            window.location.href = 'index.html';
        } else {
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Network error during logout.');
    }
}