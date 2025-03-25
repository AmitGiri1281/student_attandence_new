// Initialize variables
let attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || [];
let currentStudent = null;
const toastEl = document.getElementById('liveToast');
const toast = new bootstrap.Toast(toastEl);

// Initialize time display
function updateClock() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
    document.getElementById('current-date').textContent = now.toLocaleDateString();
}
setInterval(updateClock, 1000);
updateClock();

// Show toast notification
function showToast(title, message, type = 'info') {
    const toastHeader = toastEl.querySelector('.toast-header');
    const toastBody = toastEl.querySelector('.toast-body');
    
    // Remove previous color classes
    toastHeader.className = 'toast-header';
    toastBody.className = 'toast-body';
    
    // Add appropriate color based on type
    switch(type) {
        case 'success':
            toastHeader.classList.add('bg-success', 'text-white');
            break;
        case 'danger':
            toastHeader.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastHeader.classList.add('bg-warning', 'text-dark');
            break;
        default:
            toastHeader.classList.add('bg-info', 'text-white');
    }
    
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-message').textContent = message;
    toast.show();
}

// Login function
function login() {
    const studentId = document.getElementById("student-id").value.trim();
    
    if (!studentId) {
        showToast('Error', 'Please enter your Student ID!', 'danger');
        return;
    }

    currentStudent = studentId;
    
    // Animate login transition
    document.getElementById("login-section").classList.add("hidden");
    setTimeout(() => {
        document.getElementById("dashboard").classList.remove("hidden");
        document.getElementById("dashboard").classList.add("fade-in");
        document.getElementById("student-name").textContent = studentId;
        getLocation();
    }, 300);
    
    showToast('Welcome', `Logged in as ${studentId}`, 'success');
}

// Geolocation functions
function getLocation() {
    if (navigator.geolocation) {
        document.getElementById("location-status").textContent = "Detecting your location...";
        navigator.geolocation.getCurrentPosition(
            showPosition, 
            showError, 
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        document.getElementById("location-status").textContent = "Geolocation not supported.";
        showToast('Error', 'Geolocation not supported by your browser', 'warning');
    }
}

function showPosition(position) {
    const { latitude, longitude } = position.coords;
    const locationText = `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
    document.getElementById("location-status").textContent = locationText;
    document.getElementById("mark-attendance").disabled = false;
    
    // Add pulse animation to attendance button
    document.getElementById("mark-attendance").classList.add('pulse');
}

function showError(error) {
    const errorMessages = {
        1: "Permission denied. Please enable location access.",
        2: "Location unavailable. Please check your connection.",
        3: "Location request timed out. Please try again.",
        4: "Unknown error occurred while getting location."
    };
    const message = errorMessages[error.code] || "Error getting location.";
    document.getElementById("location-status").textContent = message;
    showToast('Location Error', message, 'danger');
}

// Attendance marking function
function markAttendance() {
    if (!currentStudent) return;

    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    const location = document.getElementById("location-status").textContent;

    // Check if already marked today
    const alreadyMarked = attendanceData.some(record => 
        record.studentId === currentStudent && record.date === date
    );
    
    if (alreadyMarked) {
        showToast('Notice', 'Attendance already marked for today', 'info');
        return;
    }

    // Create new record
    const record = { 
        studentId: currentStudent, 
        studentName: currentStudent, 
        date, 
        time, 
        location,
        timestamp: now.getTime()
    };
    
    attendanceData.push(record);
    localStorage.setItem("attendanceData", JSON.stringify(attendanceData));
    
    // Remove pulse animation after marking
    document.getElementById("mark-attendance").classList.remove('pulse');
    
    showToast('Success', 'Attendance marked successfully!', 'success');
    updateAttendanceTable();
}

// Attendance report functions
function toggleAttendanceReport() {
    const adminPanel = document.getElementById("admin-panel");
    const reportButton = document.getElementById("show-report");

    if (adminPanel.classList.contains("hidden")) {
        adminPanel.classList.remove("hidden");
        adminPanel.classList.add("slide-in");
        reportButton.innerHTML = '<i class="bi bi-eye-slash me-2"></i>Hide Report';
        updateAttendanceTable();
    } else {
        adminPanel.classList.add("hidden");
        reportButton.innerHTML = '<i class="bi bi-list-check me-2"></i>View Report';
    }
}

function updateAttendanceTable() {
    const tableBody = document.getElementById("attendance-records");
    tableBody.innerHTML = "";

    // Sort by most recent first
    const sortedData = [...attendanceData].sort((a, b) => b.timestamp - a.timestamp);

    sortedData.forEach((record, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${record.studentId}</td>
            <td>${record.studentName}</td>
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td>${record.location}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteRecord(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById("record-count").textContent = attendanceData.length;
}

function deleteRecord(index) {
    if (confirm("Are you sure you want to delete this record?")) {
        attendanceData.splice(index, 1);
        localStorage.setItem("attendanceData", JSON.stringify(attendanceData));
        updateAttendanceTable();
        showToast('Deleted', 'Record removed successfully', 'info');
    }
}

function clearRecords() {
    if (confirm("Are you sure you want to clear ALL attendance records? This cannot be undone.")) {
        attendanceData = [];
        localStorage.removeItem("attendanceData");
        updateAttendanceTable();
        showToast('Cleared', 'All records have been removed', 'warning');
    }
}

function exportToCSV() {
    if (attendanceData.length === 0) {
        showToast('Error', 'No records to export', 'warning');
        return;
    }

    // CSV header
    let csv = "Student ID,Student Name,Date,Time,Location\n";
    
    // Add data rows
    attendanceData.forEach(record => {
        csv += `"${record.studentId}","${record.studentName}","${record.date}","${record.time}","${record.location}"\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `attendance_records_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showToast('Exported', 'Attendance records downloaded as CSV', 'success');
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    document.getElementById("main-container").classList.toggle("bg-dark");
    document.getElementById("main-container").classList.toggle("text-white");

    let mode = document.body.classList.contains("dark-mode") ? "dark" : "light";
    localStorage.setItem("theme", mode);
    
    showToast('Theme Changed', `Switched to ${mode} mode`, 'info');
}

// Load Dark Mode Preference
function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        document.getElementById("main-container").classList.add("bg-dark", "text-white");
    }
}

// Initialize on page load
window.onload = function() {
    loadTheme();
    updateAttendanceTable();
    document.getElementById("admin-panel").classList.add("hidden");
};