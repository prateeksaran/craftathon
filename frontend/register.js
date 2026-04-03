// Generate random registration code
function generateRegistrationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Check if role is eligible for registration code
function isEligibleForCode(rank) {
    const eligibleRanks = ['major', 'lieutenant', 'admin'];
    return eligibleRanks.includes(rank);
}

// Update restricted message based on rank selection
function updateCodeVisibility() {
    const rank = document.getElementById('rank').value;
    const restrictedMessage = document.getElementById('restrictedMessage');
    
    if (rank && isEligibleForCode(rank)) {
        restrictedMessage.style.display = 'none';
    } else if (rank) {
        restrictedMessage.style.display = 'block';
    } else {
        restrictedMessage.style.display = 'none';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const rankSelect = document.getElementById('rank');
    
    // Add event listener to rank dropdown
    rankSelect.addEventListener('change', updateCodeVisibility);
});

// Form submission
const registrationForm = document.getElementById('registrationForm');
registrationForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Reset error messages
    document.querySelectorAll('.error-message').forEach(msg => msg.style.display = 'none');
    document.querySelectorAll('.input-group').forEach(group => group.classList.remove('error'));

    let isValid = true;

    // Validate Name
    const name = document.getElementById('name').value.trim();
    if (name.length < 2) {
        document.getElementById('nameError').style.display = 'block';
        isValid = false;
    }

    // Validate Badge Number
    const badgeNumber = document.getElementById('badgeNumber').value.trim();
    if (!badgeNumber || badgeNumber <= 0) {
        document.getElementById('badgeError').style.display = 'block';
        isValid = false;
    }

    // Validate Rank
    const rank = document.getElementById('rank').value;
    if (!rank) {
        document.getElementById('rankError').style.display = 'block';
        isValid = false;
    }

    // Validate Password
    const password = document.getElementById('password').value;
    if (password.length < 8) {
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
    }

    // Validate Confirm Password
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (password !== confirmPassword) {
        document.getElementById('confirmError').style.display = 'block';
        isValid = false;
    }

    if (isValid) {
        const modal = document.getElementById('registrationModal');
        
        let registrationCode = null;
        
        // Only generate code if rank is eligible
        if (isEligibleForCode(rank)) {
            registrationCode = generateRegistrationCode();
        }
        
        // Populate modal with user data
        document.getElementById('modalRank').textContent = rank.charAt(0).toUpperCase() + rank.slice(1).replace('-', ' ');
        document.getElementById('modalCode').textContent = registrationCode || 'N/A';
        document.getElementById('modalUsername').textContent = name;
        document.getElementById('modalPassword').textContent = password;
        
        // Store data (optional - can be sent to a server)
        const formData = {
            registrationCode: registrationCode,
            name: name,
            badgeNumber: badgeNumber,
            rank: rank,
            codeEligible: isEligibleForCode(rank),
            timestamp: new Date().toISOString()
        };

        // Log to console (in real app, send to server)
        console.log('Registration Data:', formData);
        
        // Store in localStorage for demo
        localStorage.setItem('registrationData', JSON.stringify(formData));

        // Send registration data to backend and redirect on success
        fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: name,
                email: '',
                password: document.getElementById('password').value
            })
        }).then(response => {
            if (response.ok) {
                window.location.href = 'index.html';
            } else {
                console.warn('Backend registration failed');
            }
        }).catch(error => {
            console.warn('Backend unavailable, continue local flow:', error);
        });

        // Show modal
        modal.style.display = 'block';
        
        // Reset form
        registrationForm.reset();
        updateCodeVisibility();
    }
});

// Reset button handler
document.querySelector('.btn-reset').addEventListener('click', function() {
    document.querySelectorAll('.error-message').forEach(msg => msg.style.display = 'none');
    document.getElementById('successMessage').style.display = 'none';
    updateCodeVisibility();
});

// Modal functionality
const modal = document.getElementById('registrationModal');
const closeBtn = document.querySelector('.close');
const closeModalBtn = document.getElementById('closeModalBtn');

// Close modal when clicking the X
closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

// Close modal when clicking the Close button
closeModalBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

// Close modal when clicking outside the modal content
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

