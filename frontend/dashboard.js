// Global variables
let currentUser = null;
let studentData = null;
let allStudents = [];

// Notifications data
const notificationsData = [
    {
        id: 1,
        type: 'warning',
        title: 'Upcoming Deadline',
        message: 'Tuition payment due on December 15, 2025',
        date: new Date().toLocaleDateString()
    },
    {
        id: 2,
        type: 'info',
        title: 'Foundation Day Contribution',
        message: 'Foundation Day contribution collection starts next week',
        date: new Date().toLocaleDateString()
    },
    {
        id: 3,
        type: 'info',
        title: 'System Update',
        message: 'Financial records have been updated. Please review your balance.',
        date: new Date().toLocaleDateString()
    }
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard loaded, checking authentication...');
    currentUser = await checkAuthentication();
    
    if (!currentUser) {
        console.warn('No current user, redirecting to index.html');
        // Delay redirect for debugging visibility
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 10000); // 1-second delay
        return;
    }
    
    console.log('User authenticated:', currentUser);
    // Set user info
    document.getElementById('currentUsername').textContent = currentUser.username;
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Admin' : 'Student';
    
    // Load data
    loadStudentData();
    initializeMenuLinks();
    
    // Show admin panel if user is admin
    if (currentUser.role === 'admin') {
        document.getElementById('adminMenuLink').style.display = 'block';
        
        // Add LRN field to admin form
        addLRNFieldToAdminForm();
        
        document.getElementById('adminForm').addEventListener('submit', handleAdminFormSubmit);
    }
    
    renderNotifications();
});

// Add LRN field to admin form
function addLRNFieldToAdminForm() {
    const form = document.getElementById('adminForm');
    const firstFormRow = form.querySelector('.form-row');
    
    const lrnRow = document.createElement('div');
    lrnRow.className = 'form-row';
    lrnRow.innerHTML = `
        <div class="form-group">
            <label>Student LRN</label>
            <input type="text" id="adminStudentLRN" placeholder="Enter student LRN" required>
        </div>
    `;
    
    form.insertBefore(lrnRow, firstFormRow);
}

// Menu navigation
function initializeMenuLinks() {
    const menuLinks = document.querySelectorAll('.menu-link');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            
            if (section) {
                section.classList.add('active');
                
                if (sectionId === 'tuition') {
                    loadTuitionData();
                } else if (sectionId === 'events') {
                    loadEventsData();
                } else if (sectionId === 'uniforms') {
                    loadUniformsData();
                } else if (sectionId === 'payments') {
                    loadPaymentHistory();
                } else if (sectionId === 'notifications') {
                    renderNotificationsDetail();
                } else if (sectionId === 'admin') {
                    loadAdminStudentsTable();
                }
            }
        });
    });
}

// Load student data from API
async function loadStudentData() {
    try {
        if (currentUser.role === 'student') {
            console.log('Loading student data for:', currentUser.lrn);
            const response = await fetch(`${API_URL}/students/my-data`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                studentData = await response.json();
                console.log('Student data loaded:', studentData);
                updateDashboardOverview();
            } else {
                console.error('Failed to load student data:', response.status);
            }
        } else if (currentUser.role === 'admin') {
            await loadAdminStudentsTable();
            updateAdminDashboardOverview();
        }
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

// Update dashboard overview for students
function updateDashboardOverview() {
    if (currentUser.role === 'student' && studentData) {
        const tuitionBalance = studentData.tuition.total - studentData.tuition.paid;
        const eventBalance = studentData.events.total - studentData.events.paid;
        const uniformBalance = studentData.uniforms.total - studentData.uniforms.paid;
        
        document.getElementById('totalTuitionBalance').textContent = '₱' + tuitionBalance.toFixed(2);
        document.getElementById('totalEventBalance').textContent = '₱' + eventBalance.toFixed(2);
        document.getElementById('totalUniformBalance').textContent = '₱' + uniformBalance.toFixed(2);
        
        document.getElementById('tuitionStatus').textContent = tuitionBalance === 0 ? 'Fully Paid' : tuitionBalance > 0 ? 'Pending: ₱' + tuitionBalance.toFixed(2) : 'Overpaid';
        document.getElementById('eventStatus').textContent = eventBalance === 0 ? 'Fully Paid' : eventBalance > 0 ? 'Pending: ₱' + eventBalance.toFixed(2) : 'Overpaid';
        document.getElementById('uniformStatus').textContent = uniformBalance === 0 ? 'Fully Paid' : uniformBalance > 0 ? 'Pending: ₱' + uniformBalance.toFixed(2) : 'Overpaid';
        
        loadRecentTransactions();
    }
}

// Update dashboard overview for admin
function updateAdminDashboardOverview() {
    if (currentUser.role === 'admin' && allStudents.length > 0) {
        let totalTuitionBalance = 0;
        let totalEventBalance = 0;
        let totalUniformBalance = 0;
        
        allStudents.forEach(student => {
            totalTuitionBalance += (student.tuition.total - student.tuition.paid);
            totalEventBalance += (student.events.total - student.events.paid);
            totalUniformBalance += (student.uniforms.total - student.uniforms.paid);
        });
        
        document.getElementById('totalTuitionBalance').textContent = '₱' + totalTuitionBalance.toFixed(2);
        document.getElementById('totalEventBalance').textContent = '₱' + totalEventBalance.toFixed(2);
        document.getElementById('totalUniformBalance').textContent = '₱' + totalUniformBalance.toFixed(2);
        
        document.getElementById('tuitionStatus').textContent = `Total from ${allStudents.length} students`;
        document.getElementById('eventStatus').textContent = `Total from ${allStudents.length} students`;
        document.getElementById('uniformStatus').textContent = `Total from ${allStudents.length} students`;
        
        const tbody = document.getElementById('recentTransactionsBody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Admin view - showing all students summary</td></tr>';
    }
}

// Load recent transactions
function loadRecentTransactions() {
    const tbody = document.getElementById('recentTransactionsBody');
    tbody.innerHTML = '';
    
    if (!studentData || !studentData.paymentHistory || studentData.paymentHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No transactions yet</td></tr>';
        return;
    }
    
    const recentTransactions = studentData.paymentHistory.slice(-5).reverse();
    
    recentTransactions.forEach(trans => {
        const row = document.createElement('tr');
        const date = new Date(trans.date).toLocaleDateString();
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${trans.description}</td>
            <td>${trans.type}</td>
            <td>₱${trans.amount.toFixed(2)}</td>
            <td><span class="status-badge status-paid">PAID</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Load tuition data
function loadTuitionData() {
    const tbody = document.getElementById('tuitionTableBody');
    tbody.innerHTML = '';
    
    if (!studentData) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No data available</td></tr>';
        return;
    }
    
    const tuitionData = studentData.tuition;
    const balance = tuitionData.total - tuitionData.paid;
    const status = balance === 0 ? 'paid' : balance > 0 ? 'pending' : 'overdue';
    const statusClass = status === 'paid' ? 'status-paid' : status === 'pending' ? 'status-pending' : 'status-overdue';
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>Senior High School Tuition</td>
        <td>₱${tuitionData.total.toFixed(2)}</td>
        <td>₱${tuitionData.paid.toFixed(2)}</td>
        <td>₱${balance.toFixed(2)}</td>
        <td>${tuitionData.dueDate || 'N/A'}</td>
        <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
    `;
    tbody.appendChild(row);
}

// Load events data
function loadEventsData() {
    const tbody = document.getElementById('eventsTableBody');
    tbody.innerHTML = '';
    
    if (!studentData) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No data available</td></tr>';
        return;
    }
    
    const eventsList = [
        { name: 'Intramurals', dueDate: '2025-10-30' },
        { name: 'Foundation Day', dueDate: '2025-11-20' },
        { name: 'Field Trip', dueDate: '2025-12-10' }
    ];
    
    eventsList.forEach(event => {
        const eventData = studentData.events;
        const balance = eventData.total - eventData.paid;
        const status = balance === 0 ? 'paid' : balance > 0 ? 'pending' : 'overdue';
        const statusClass = status === 'paid' ? 'status-paid' : status === 'pending' ? 'status-pending' : 'status-overdue';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${event.name}</td>
            <td>₱${eventData.total.toFixed(2)}</td>
            <td>₱${eventData.paid.toFixed(2)}</td>
            <td>₱${balance.toFixed(2)}</td>
            <td>${event.dueDate}</td>
            <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Load uniforms data
function loadUniformsData() {
    const tbody = document.getElementById('uniformsTableBody');
    tbody.innerHTML = '';
    
    if (!studentData) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No data available</td></tr>';
        return;
    }
    
    const uniformData = studentData.uniforms;
    const balance = uniformData.total - uniformData.paid;
    const status = balance === 0 ? 'paid' : balance > 0 ? 'pending' : 'overdue';
    const statusClass = status === 'paid' ? 'status-paid' : status === 'pending' ? 'status-pending' : 'status-overdue';
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>Uniforms & Learning Materials</td>
        <td>₱${uniformData.total.toFixed(2)}</td>
        <td>₱${uniformData.paid.toFixed(2)}</td>
        <td>₱${balance.toFixed(2)}</td>
        <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
    `;
    tbody.appendChild(row);
}

// Load payment history
function loadPaymentHistory() {
    const tbody = document.getElementById('paymentHistoryBody');
    tbody.innerHTML = '';
    
    if (!studentData || !studentData.paymentHistory || studentData.paymentHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No payment history</td></tr>';
        return;
    }
    
    const paymentHistory = [...studentData.paymentHistory].reverse();
    
    paymentHistory.forEach(payment => {
        const row = document.createElement('tr');
        const date = new Date(payment.date).toLocaleDateString();
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${payment.description}</td>
            <td>${payment.type}</td>
            <td>₱${payment.amount.toFixed(2)}</td>
            <td><span class="status-badge status-paid">PAID</span></td>
            <td><button class="btn btn-secondary" onclick="downloadReceipt('${payment.receiptNo}')">Download</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Render notifications in overview
function renderNotifications() {
    const container = document.getElementById('notificationsContainer');
    container.innerHTML = '';
    
    notificationsData.forEach(notif => {
        const div = document.createElement('div');
        div.className = `notification ${notif.type}`;
        div.innerHTML = `
            <div class="notification-content">
                <p><strong>${notif.title}</strong></p>
                <p>${notif.message}</p>
            </div>
            <button class="close-notification" onclick="this.parentElement.style.display='none';">×</button>
        `;
        container.appendChild(div);
    });
}

// Render notifications detail page
function renderNotificationsDetail() {
    const container = document.getElementById('notificationsDetailContainer');
    container.innerHTML = '';
    
    notificationsData.forEach(notif => {
        const div = document.createElement('div');
        div.className = `notification ${notif.type}`;
        div.innerHTML = `
            <div class="notification-content">
                <p><strong>${notif.title}</strong></p>
                <p>${notif.message}</p>
                <p style="font-size: 11px; color: #999; margin-top: 8px;">${notif.date}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// Admin form submission
async function handleAdminFormSubmit(e) {
    e.preventDefault();
    
    const studentLRN = document.getElementById('adminStudentLRN').value.trim();
    
    if (!studentLRN) {
        alert('Please enter a student LRN');
        return;
    }
    
    const studentDataToSave = {
        lrn: studentLRN,
        name: document.getElementById('adminStudentName').value,
        grade: document.getElementById('adminGrade').value,
        tuition: {
            total: parseFloat(document.getElementById('adminTuition').value),
            paid: parseFloat(document.getElementById('adminTuitionPaid').value),
            dueDate: document.getElementById('adminTuitionDue').value
        },
        events: {
            total: parseFloat(document.getElementById('adminEventTotal').value),
            paid: parseFloat(document.getElementById('adminEventPaid').value)
        },
        uniforms: {
            total: parseFloat(document.getElementById('adminUniformTotal').value),
            paid: parseFloat(document.getElementById('adminUniformPaid').value)
        }
    };
    
    try {
        const response = await fetch(`${API_URL}/students/add`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentDataToSave)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Student data saved successfully!');
            document.getElementById('adminForm').reset();
            loadAdminStudentsTable();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving student data:', error);
        alert('Network error. Please try again.');
    }
}

// Load admin students table
async function loadAdminStudentsTable() {
    try {
        console.log('Loading admin students table...');
        const response = await fetch(`${API_URL}/students/all`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            allStudents = await response.json();
            console.log('Admin students loaded:', allStudents);
            renderAdminTable();
            
            if (currentUser.role === 'admin') {
                updateAdminDashboardOverview();
            }
        } else {
            console.error('Failed to load students:', response.status);
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function renderAdminTable() {
    const tbody = document.getElementById('adminStudentsTableBody');
    tbody.innerHTML = '';
    
    if (allStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No student data</td></tr>';
        return;
    }
    
    allStudents.forEach(student => {
        const tuitionBalance = student.tuition.total - student.tuition.paid;
        const eventBalance = student.events.total - student.events.paid;
        const uniformBalance = student.uniforms.total - student.uniforms.paid;
        const totalBalance = tuitionBalance + eventBalance + uniformBalance;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.grade}</td>
            <td>₱${tuitionBalance.toFixed(2)}</td>
            <td>₱${eventBalance.toFixed(2)}</td>
            <td>₱${uniformBalance.toFixed(2)}</td>
            <td><strong>₱${totalBalance.toFixed(2)}</strong></td>
            <td><button class="btn btn-danger" onclick="deleteStudent('${student._id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Delete student
async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student record?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/students/${studentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Student record deleted successfully!');
            loadAdminStudentsTable();
        } else {
            alert('Error deleting student');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Network error. Please try again.');
    }
}

// Download receipt (simulation)
function downloadReceipt(receiptNo) {
    alert(`Receipt ${receiptNo} download initiated.\n\nNote: This is a demo. In production, this would generate a PDF receipt.`);
}