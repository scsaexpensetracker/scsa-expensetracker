const API_URL = process.env.REACT_APP_API_URL || '/api';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const lrn = document.getElementById('lrn').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const middleName = document.getElementById('middleName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const contactNumber = document.getElementById('contactNumber').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Clear previous messages
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    successDiv.textContent = '';
    successDiv.classList.remove('show');
    
    // Validation
    if (!lrn || !firstName || !lastName || !contactNumber || !password) {
        errorDiv.textContent = 'Please fill in all required fields';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.classList.add('show');
        return;
    }
    
    if (contactNumber.length !== 11 || !contactNumber.startsWith('09')) {
        errorDiv.textContent = 'Contact number must be 11 digits starting with 09';
        errorDiv.classList.add('show');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Important for sessions
            body: JSON.stringify({
                lrn,
                firstName,
                middleName,
                lastName,
                contactNumber,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            successDiv.textContent = `Registration successful! Your LRN (${data.lrn}) is your username. Redirecting to login...`;
            successDiv.classList.add('show');
            
            // Clear form
            document.getElementById('registerForm').reset();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            errorDiv.textContent = data.message || 'Registration failed';
            errorDiv.classList.add('show');
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Network error. Please make sure the server is running.';
        errorDiv.classList.add('show');
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
});