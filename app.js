// ============================================
// SMART HABIT TRACKER - MAIN APPLICATION
// Author: Ivan Akena
// Course: CSE 310 - Applied Programming
// Module: Mobile App, Web Apps, JavaScript
// ============================================

// ======================
// GLOBAL VARIABLES
// ======================
let habits = [];
let progressChart = null;

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Function: getTodayDate
 * Purpose: Returns today's date in YYYY-MM-DD format
 * Returns: string
 */
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Function: formatDate
 * Purpose: Formats date for display (e.g., "May 15, 2026")
 * Returns: string
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Function: saveToLocalStorage
 * Purpose: Saves habits array to browser's localStorage
 * Returns: void
 */
function saveToLocalStorage() {
    localStorage.setItem('smartHabits', JSON.stringify(habits));
}

/**
 * Function: loadFromLocalStorage
 * Purpose: Loads habits from localStorage on page load
 * Returns: void
 */
function loadFromLocalStorage() {
    const stored = localStorage.getItem('smartHabits');
    if (stored) {
        habits = JSON.parse(stored);
    } else {
        // Initialize with sample habits if empty
        habits = [
            { id: 1, name: 'Exercise 30 min', streak: 0, lastCompleted: null, completedToday: false },
            { id: 2, name: 'Read 20 pages', streak: 0, lastCompleted: null, completedToday: false },
            { id: 3, name: 'Drink 8 glasses of water', streak: 0, lastCompleted: null, completedToday: false }
        ];
        saveToLocalStorage();
    }
}

/**
 * Function: updateStreak
 * Purpose: Updates streak counter based on last completion date
 * Parameters: habit (object), completedToday (boolean)
 * Returns: updated habit object
 */
function updateStreak(habit, completedToday) {
    const today = getTodayDate();
    
    if (completedToday) {
        if (habit.lastCompleted === today) {
            // Already completed today, no streak change
            return habit;
        } else if (habit.lastCompleted === getYesterdayDate()) {
            // Completed yesterday, increment streak
            habit.streak += 1;
        } else {
            // New streak or break, reset to 1
            habit.streak = 1;
        }
        habit.lastCompleted = today;
        habit.completedToday = true;
    } else {
        habit.completedToday = false;
    }
    return habit;
}

/**
 * Function: getYesterdayDate
 * Purpose: Returns yesterday's date in YYYY-MM-DD format
 * Returns: string
 */
function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Function: addHabit
 * Purpose: Adds a new habit to the habits array
 * Parameters: habitName (string)
 * Returns: boolean (true if added, false if invalid)
 */
function addHabit(habitName) {
    if (!habitName || habitName.trim() === '') {
        showNotification('Please enter a habit name!', 'error');
        return false;
    }
    
    if (habitName.length > 50) {
        showNotification('Habit name must be 50 characters or less!', 'error');
        return false;
    }
    
    const newHabit = {
        id: Date.now(),
        name: habitName.trim(),
        streak: 0,
        lastCompleted: null,
        completedToday: false
    };
    
    habits.push(newHabit);
    saveToLocalStorage();
    renderHabits();
    updateStatistics();
    updateChart();
    showNotification('Habit added successfully!', 'success');
    return true;
}

/**
 * Function: deleteHabit
 * Purpose: Removes a habit from the array by ID
 * Parameters: id (number)
 * Returns: void
 */
function deleteHabit(id) {
    if (confirm('Are you sure you want to delete this habit?')) {
        habits = habits.filter(habit => habit.id !== id);
        saveToLocalStorage();
        renderHabits();
        updateStatistics();
        updateChart();
        showNotification('Habit deleted!', 'success');
    }
}

/**
 * Function: toggleCompleteHabit
 * Purpose: Marks a habit as completed for today or unmarks it
 * Parameters: id (number)
 * Returns: void
 */
function toggleCompleteHabit(id) {
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) return;
    
    const today = getTodayDate();
    
    if (habits[habitIndex].lastCompleted === today) {
        // Unmark if already completed today
        habits[habitIndex].completedToday = false;
        habits[habitIndex].lastCompleted = null;
        // Decrease streak if it was active
        if (habits[habitIndex].streak > 0) {
            habits[habitIndex].streak -= 1;
        }
        showNotification(`Unmarked "${habits[habitIndex].name}" for today`, 'info');
    } else {
        // Mark as completed
        habits[habitIndex] = updateStreak(habits[habitIndex], true);
        showNotification(`✅ Great job completing "${habits[habitIndex].name}"!`, 'success');
        
        // Check if we should show a reminder
        if (habits[habitIndex].streak % 5 === 0 && habits[habitIndex].streak > 0) {
            showNotification(`🏆 Amazing! ${habits[habitIndex].streak} day streak on "${habits[habitIndex].name}"!`, 'celebration');
        }
    }
    
    saveToLocalStorage();
    renderHabits();
    updateStatistics();
    updateChart();
}

/**
 * Function: showNotification
 * Purpose: Displays a temporary notification to the user
 * Parameters: message (string), type (string)
 * Returns: void
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'celebration' ? '#ffc107' : '#667eea'};
        color: ${type === 'celebration' ? '#333' : 'white'};
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

/**
 * Function: renderHabits
 * Purpose: Displays all habits in the DOM
 * Returns: void
 */
function renderHabits() {
    const habitsList = document.getElementById('habitsList');
    const today = getTodayDate();
    
    if (!habitsList) return;
    
    if (habits.length === 0) {
        habitsList.innerHTML = '<div class="empty-state">✨ No habits yet. Add your first habit above! ✨</div>';
        return;
    }
    
    habitsList.innerHTML = habits.map(habit => {
        const isCompletedToday = habit.lastCompleted === today;
        return `
            <div class="habit-item" data-id="${habit.id}">
                <div class="habit-info">
                    <div class="habit-name">${escapeHtml(habit.name)}</div>
                    <div class="habit-streak">
                        🔥 Streak: <span>${habit.streak}</span> day${habit.streak !== 1 ? 's' : ''}
                    </div>
                </div>
                <div class="habit-actions">
                    <input type="checkbox" class="complete-checkbox" data-id="${habit.id}" ${isCompletedToday ? 'checked' : ''}>
                    <span class="${isCompletedToday ? 'completed-text' : ''}">${isCompletedToday ? '✓ Completed Today' : 'Mark Complete'}</span>
                    <button class="delete-btn" data-id="${habit.id}">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.complete-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            const id = parseInt(checkbox.dataset.id);
            toggleCompleteHabit(id);
        });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteHabit(id);
        });
    });
}

/**
 * Function: escapeHtml
 * Purpose: Prevents XSS attacks by escaping HTML special characters
 * Parameters: text (string)
 * Returns: escaped string
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Function: updateStatistics
 * Purpose: Updates the statistics cards (total habits, completed today, longest streak)
 * Returns: void
 */
function updateStatistics() {
    const today = getTodayDate();
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => h.lastCompleted === today).length;
    const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
    
    document.getElementById('totalHabits').textContent = totalHabits;
    document.getElementById('completedToday').textContent = completedToday;
    document.getElementById('longestStreak').textContent = longestStreak;
}

/**
 * Function: updateChart
 * Purpose: Updates or creates the progress chart using Chart.js
 * Returns: void
 */
function updateChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const habitNames = habits.map(h => h.name.length > 15 ? h.name.substring(0, 12) + '...' : h.name);
    const streakData = habits.map(h => h.streak);
    
    if (progressChart) {
        progressChart.destroy();
    }
    
    if (habits.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#999';
        ctx.fillText('No habits to display', 50, 100);
        return;
    }
    
    progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: habitNames,
            datasets: [{
                label: 'Current Streak (days)',
                data: streakData,
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Streak: ${context.raw} day${context.raw !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Streak (days)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Habits'
                    }
                }
            }
        }
    });
}

/**
 * Function: resetAllData
 * Purpose: Clears all habits and resets the application
 * Returns: void
 */
function resetAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL habits and progress. This cannot be undone. Are you sure?')) {
        habits = [];
        saveToLocalStorage();
        renderHabits();
        updateStatistics();
        updateChart();
        showNotification('All data has been reset!', 'success');
    }
}

/**
 * Function: testReminder
 * Purpose: Demonstrates the reminder/notification feature
 * Returns: void
 */
function testReminder() {
    if (Notification.permission === 'granted') {
        new Notification('Smart Habit Tracker', {
            body: 'Time to check your habits! Have you completed them today?',
            icon: 'https://cdn-icons-png.flaticon.com/512/2838/2838912.png'
        });
        showNotification('🔔 Reminder sent! Check your notifications.', 'success');
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                testReminder();
            } else {
                showNotification('Please enable notifications in your browser settings.', 'error');
            }
        });
    } else {
        showNotification('Notifications are blocked. Please enable them in your browser settings.', 'error');
    }
}

/**
 * Function: displayCurrentDate
 * Purpose: Shows today's date in the header
 * Returns: void
 */
function displayCurrentDate() {
    const dateElement = document.getElementById('dateDisplay');
    if (dateElement) {
        dateElement.textContent = formatDate(getTodayDate());
    }
}

/**
 * Function: init
 * Purpose: Initializes the application on page load
 * Returns: void
 */
function init() {
    displayCurrentDate();
    loadFromLocalStorage();
    renderHabits();
    updateStatistics();
    updateChart();
    
    // Set up event listeners
    document.getElementById('addHabitBtn').addEventListener('click', () => {
        const input = document.getElementById('habitNameInput');
        addHabit(input.value);
        input.value = '';
        input.focus();
    });
    
    document.getElementById('resetAllBtn').addEventListener('click', resetAllData);
    document.getElementById('testReminderBtn').addEventListener('click', testReminder);
    
    // Allow pressing Enter to add habit
    document.getElementById('habitNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('addHabitBtn').click();
        }
    });
    
    console.log('Smart Habit Tracker initialized successfully!');
}

// Start the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);