// DOM Elements
const numbersContainer = document.getElementById('numbersContainer');
const generateBtn = document.getElementById('generateBtn');
const historyBtn = document.getElementById('historyBtn');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const attemptsCounter = document.getElementById('attemptsCounter').querySelector('span');
const totalGenerations = document.getElementById('totalGenerations');
const bgPatternSelect = document.getElementById('bgPatternSelect');
const bgIntensity = document.getElementById('bgIntensity');
const themeButtons = document.querySelectorAll('.theme-btn');
const settingsBtn = document.getElementById('settingsBtn');

// State
let currentNumbers = [];
let history = [];
let totalAttempts = 0;
let generationCount = 0;
const MAX_HISTORY = 10;

// Theme Management
const themes = {
    purple: {
        primary: '#bb86fc',
        primaryDark: '#9a67ea',
        secondary: '#03dac6',
        accent: '#cf6679',
        rgb: '187, 134, 252'
    },
    blue: {
        primary: '#2196F3',
        primaryDark: '#0D47A1',
        secondary: '#00BCD4',
        accent: '#FF4081',
        rgb: '33, 150, 243'
    },
    green: {
        primary: '#4CAF50',
        primaryDark: '#2E7D32',
        secondary: '#8BC34A',
        accent: '#FF9800',
        rgb: '76, 175, 80'
    },
    orange: {
        primary: '#FF9800',
        primaryDark: '#F57C00',
        secondary: '#FFC107',
        accent: '#E91E63',
        rgb: '255, 152, 0'
    },
    red: {
        primary: '#F44336',
        primaryDark: '#D32F2F',
        secondary: '#FF5252',
        accent: '#FFC107',
        rgb: '244, 67, 54'
    }
};

// Initialize the app
function init() {
    createEmptyCircles();
    loadFromStorage();
    generateNewNumbers();
    
    // Event Listeners
    generateBtn.addEventListener('click', generateNewNumbers);
    historyBtn.addEventListener('click', toggleHistory);
    clearHistoryBtn.addEventListener('click', clearHistory);
    settingsBtn.addEventListener('click', toggleSettings);
    
    // Theme and Background Controls
    setupThemeControls();
    setupBackgroundControls();
    
    // Create initial background
    createBackgroundPattern();
    
    console.log('5/36 Lotto Generator initialized');
}

// Create empty number circles
function createEmptyCircles() {
    numbersContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const circle = document.createElement('div');
        circle.className = 'number-circle empty';
        numbersContainer.appendChild(circle);
    }
}

// Generate random numbers between 1 and 36
function generateRandomNumbers() {
    const allNumbers = Array.from({length: 36}, (_, i) => i + 1);
    
    // Fisher-Yates shuffle algorithm
    for (let i = allNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
    }
    
    // Take first 5 and sort them
    return allNumbers.slice(0, 5).sort((a, b) => a - b);
}

// Validate numbers against all rules
function isValid(nums) {
    totalAttempts++;
    attemptsCounter.textContent = totalAttempts;
    
    // Rule 1: minimum gap >= 3
    for (let i = 0; i < nums.length - 1; i++) {
        if (nums[i + 1] - nums[i] < 3) {
            return false;
        }
    }
    
    // Rule 2: no arithmetic sequence
    const diff1 = nums[1] - nums[0];
    const diff2 = nums[2] - nums[1];
    const diff3 = nums[3] - nums[2];
    const diff4 = nums[4] - nums[3];
    
    if (diff1 === diff2 && diff2 === diff3 && diff3 === diff4) {
        return false;
    }
    
    // Rule 3: no tight clustering (3 numbers within span of 5)
    for (let i = 0; i < nums.length - 2; i++) {
        if (nums[i + 2] - nums[i] <= 5) {
            return false;
        }
    }
    
    return true;
}

// Generate valid numbers
function generateValidNumbers() {
    let candidate;
    let attempts = 0;
    const maxAttempts = 10000;
    
    do {
        candidate = generateRandomNumbers();
        attempts++;
        
        // Safety check to prevent infinite loops
        if (attempts > maxAttempts) {
            console.warn(`Could not find valid combination after ${maxAttempts} attempts`);
            alert('Having difficulty finding valid numbers. Try again.');
            break;
        }
    } while (!isValid(candidate));
    
    console.log(`Found valid combination after ${attempts} attempts:`, candidate);
    return candidate;
}

// Display numbers in the circles
function displayNumbers(nums) {
    const circles = document.querySelectorAll('.number-circle');
    const theme = getCurrentTheme();
    
    circles.forEach((circle, index) => {
        // Clear previous classes
        circle.className = 'number-circle';
        
        if (index < nums.length) {
            circle.textContent = nums[index];
            circle.style.background = `linear-gradient(145deg, ${theme.primary}, ${theme.primaryDark})`;
            circle.style.boxShadow = `0 6px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(${theme.rgb}, 0.4)`;
            
            // Add staggered animation
            circle.style.animationDelay = `${index * 0.1}s`;
            circle.classList.add('generated');
        } else {
            circle.classList.add('empty');
        }
    });
}

// Add current numbers to history
function addToHistory(numbers) {
    const historyItem = {
        numbers: [...numbers],
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullDate: new Date().toLocaleString()
    };
    
    // Add to beginning of history array
    history.unshift(historyItem);
    
    // Keep only last MAX_HISTORY items
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    
    // Update counters
    generationCount++;
    totalGenerations.textContent = `Total generations: ${generationCount}`;
    
    // Update history display
    updateHistoryDisplay();
    
    // Save to localStorage
    saveToStorage();
}

// Update history display
function updateHistoryDisplay() {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">No history yet. Generate some numbers!</p>';
        return;
    }
    
    const theme = getCurrentTheme();
    
    history.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const numbersDiv = document.createElement('div');
        numbersDiv.className = 'history-numbers';
        
        item.numbers.forEach(num => {
            const numSpan = document.createElement('span');
            numSpan.className = 'history-number';
            numSpan.textContent = num;
            numSpan.style.background = `linear-gradient(145deg, ${theme.secondary}, ${theme.primaryDark})`;
            numbersDiv.appendChild(numSpan);
        });
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'history-date';
        dateSpan.textContent = item.fullDate;
        
        historyItem.appendChild(numbersDiv);
        historyItem.appendChild(dateSpan);
        historyList.appendChild(historyItem);
    });
}

// Toggle history section visibility
function toggleHistory() {
    historySection.classList.toggle('hidden');
    
    // Update button text based on state
    if (historySection.classList.contains('hidden')) {
        historyBtn.innerHTML = '<i class="fas fa-history"></i> View History';
    } else {
        historyBtn.innerHTML = '<i class="fas fa-times"></i> Hide History';
        updateHistoryDisplay();
    }
}

// Toggle settings visibility
function toggleSettings() {
    const themeControls = document.querySelector('.theme-controls');
    themeControls.classList.toggle('hidden');
    
    if (themeControls.classList.contains('hidden')) {
        settingsBtn.innerHTML = '<i class="fas fa-cog"></i> Settings';
    } else {
        settingsBtn.innerHTML = '<i class="fas fa-times"></i> Close Settings';
    }
}

// Clear history
function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        history = [];
        updateHistoryDisplay();
        saveToStorage();
        console.log('History cleared');
    }
}

// Get current theme
function getCurrentTheme() {
    const themeName = document.documentElement.getAttribute('data-theme') || 'purple';
    return themes[themeName];
}

// Setup theme controls
function setupThemeControls() {
    const savedTheme = localStorage.getItem('lottoTheme') || 'purple';
    
    // Apply saved theme
    applyTheme(savedTheme);
    
    // Set active button
    themeButtons.forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            applyTheme(theme);
            
            // Update active button
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Save to storage
            localStorage.setItem('lottoTheme', theme);
            
            // Update UI elements
            updateUIForTheme(theme);
            createBackgroundPattern();
        });
    });
}

// Apply theme to document
function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Set CSS variables
    const theme = themes[themeName];
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--primary-dark', theme.primaryDark);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    document.documentElement.style.setProperty('--primary-rgb', theme.rgb);
    
    // Update current numbers display
    if (currentNumbers.length > 0) {
        displayNumbers(currentNumbers);
    }
}

// Update UI elements for theme
function updateUIForTheme(themeName) {
    const theme = themes[themeName];
    
    // Update buttons
    document.querySelectorAll('.generate-btn').forEach(btn => {
        btn.style.background = `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`;
    });
    
    // Update history numbers
    document.querySelectorAll('.history-number').forEach(num => {
        num.style.background = `linear-gradient(145deg, ${theme.secondary}, ${theme.primaryDark})`;
    });
}

// Setup background controls
function setupBackgroundControls() {
    const savedPattern = localStorage.getItem('lottoPattern') || 'stars';
    const savedIntensity = localStorage.getItem('lottoIntensity') || '60';