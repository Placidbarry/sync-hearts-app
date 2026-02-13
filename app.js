// ====================================================================
// APP.JS - Sync Hearts Agency Frontend Logic
// ====================================================================

// 1. INITIALIZATION & CONFIGURATION
const tg = window.Telegram.WebApp;
tg.expand(); // Make the app full screen
tg.enableClosingConfirmation(); // Ask before closing

// Global State
let user = {
    registered: false,
    credits: 0,
    data: {}
};

// Agency Database (Your Agents)
// You can add more agents here easily.
const agents = [
    {
        id: 'agent_01',
        name: 'Sophia',
        age: 23,
        location: 'New York',
        verified: true,
        premium: true, // Shows the lock icon
        bio: 'I love deep conversations and late night fun. 🤫',
        // Using high-quality placeholder images (Replace with your real agent links if needed)
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop', 
        stats: { rating: '4.9', chats: '1.2k' }
    },
    {
        id: 'agent_02',
        name: 'Elena',
        age: 25,
        location: 'London',
        verified: true,
        premium: false,
        bio: 'Flirty and fun. Let’s play a game? 🎲',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
        stats: { rating: '5.0', chats: '850' }
    },
    {
        id: 'agent_03',
        name: 'Jessica',
        age: 21,
        location: 'Miami',
        verified: false,
        premium: true,
        bio: 'College student looking for excitement.',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop',
        stats: { rating: '4.8', chats: '2.1k' }
    },
    {
        id: 'agent_04',
        name: 'Isabella',
        age: 27,
        location: 'Madrid',
        verified: true,
        premium: true,
        bio: 'Passionate and open-minded. 💃',
        photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop',
        stats: { rating: '4.9', chats: '3k+' }
    }
];

// ====================================================================
// 2. LIFECYCLE & NAVIGATION
// ====================================================================

// Runs when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUserState();
    populateCountryDropdown();
    renderAgentGrid();
    setupNavigation();
});

// Check if user is already registered (Persistence)
function loadUserState() {
    // 1. Check local storage first (Fastest)
    const savedUser = localStorage.getItem('syncHeartsUser');
    
    if (savedUser) {
        user = JSON.parse(savedUser);
        console.log("Loaded user from storage:", user);
        showLoginScreen(); // Show "Welcome Back" instead of register
    } else {
        // 2. If no local storage, check Telegram InitData (if bot passed it)
        // For now, we assume new user if not in local storage
        showScreen('screenRegister');
    }
    
    updateCreditDisplay();
}

// Show specific screen, hide others
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.bottom-nav').forEach(el => el.classList.add('hidden'));
    
    const target = document.getElementById(screenId);
    if(target) target.classList.remove('hidden');

    // Show Nav bar only on main screens
    if(screenId === 'screenAgents') {
        document.getElementById('mainNav').classList.remove('hidden');
    }
}

// "Welcome Back" Logic
function showLoginScreen() {
    // Update the UI with their name
    document.getElementById('loginUsername').innerText = user.data.firstName || 'User';
    showScreen('screenLogin');
    
    // Auto-login button
    document.getElementById('btnLogin').onclick = () => {
        showScreen('screenAgents');
    };
}

// ====================================================================
// 3. REGISTRATION LOGIC
// ====================================================================

// Populate Country Dropdown
function populateCountryDropdown() {
    const countries = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Spain", "Italy", "Brazil", "India", "Nigeria", "Other"];
    const select = document.getElementById('countrySelect');
    countries.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.innerText = c;
        select.appendChild(option);
    });
}

// Handle "Complete Registration" Click
document.getElementById('btnCompleteReg').addEventListener('click', () => {
    // 1. Gather Input
    const age = document.getElementById('ageInput').value;
    const country = document.getElementById('countrySelect').value;
    const state = document.getElementById('stateInput').value;
    const lookingFor = window.selectedLookingFor; // set by the HTML onclick
    
    // 2. Validate
    if(!age || !country || !state || !lookingFor) {
        tg.showAlert("⚠️ Please fill in all fields to continue.");
        return;
    }

    if(age < 18) {
        tg.showAlert("⛔ You must be 18+ to use this service.");
        return;
    }

    // 3. Create User Object
    const telegramUser = tg.initDataUnsafe?.user || {};
    user.registered = true;
    user.credits = 50; // *** 50 FREE COINS BONUS ***
    user.data = {
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        age: age,
        country: country,
        state: state,
        lookingFor: lookingFor
    };

    // 4. Save to Local Storage (Persistence)
    localStorage.setItem('syncHeartsUser', JSON.stringify(user));

    // 5. Send Data to Bot (Backend)
    // We send a specific "action" JSON that bot.js will read
    const payload = {
        action: 'register_new_user',
        user_data: user.data,
        bonus_credits: 50
    };
    tg.sendData(JSON.stringify(payload));

    // 6. UI Feedback & Transition
    tg.HapticFeedback.notificationOccurred('success');
    tg.showAlert("🎉 Registration Successful!\n\n💰 You received 50 FREE COINS!");
    
    updateCreditDisplay();
    showScreen('screenAgents');
});

// Update the credit counters in the Header
function updateCreditDisplay() {
    const displays = document.querySelectorAll('#creditCount');
    displays.forEach(el => el.innerText = user.credits);
}

// ====================================================================
// 4. AGENT GRID & INTERACTIONS
// ====================================================================

function renderAgentGrid() {
    const container = document.getElementById('agentGridContainer');
    container.innerHTML = ''; // Clear existing

    agents.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        
        // Conditional HTML for badges
        const lockIcon = agent.premium ? `<div class="premium-lock">🔒 VIP</div>` : '';
        const verifiedIcon = agent.verified ? '<span class="verified-icon">✅</span>' : '';

        card.innerHTML = `
            <div class="agent-image-container">
                <img src="${agent.photo}" alt="${agent.name}">
                ${lockIcon}
            </div>
            <div class="agent-info">
                <div class="agent-name">${agent.name}, ${agent.age} ${verifiedIcon}</div>
                <div class="agent-location">📍 ${agent.location}</div>
                <div class="agent-stats">
                    <span class="stat-tag">⭐ ${agent.stats.rating}</span>
                    <span class="stat-tag">💬 ${agent.stats.chats}</span>
                </div>
                <button class="chat-btn-small" onclick="openActionMenu('${agent.id}', '${agent.name}')">
                    💬 Chat & Gift
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ====================================================================
// 5. ACTION MENU (COST LOGIC)
// ====================================================================

let currentTargetAgent = null;

// Opens the bottom sheet modal
window.openActionMenu = function(agentId, agentName) {
    currentTargetAgent = { id: agentId, name: agentName };
    const modal = document.getElementById('actionModal');
    modal.classList.add('active');
    
    // Add haptic feedback
    tg.HapticFeedback.impactOccurred('light');
};

// Global handler for the specific actions (Text, Gift, Video, etc.)
window.handleAction = function(type) {
    if(!currentTargetAgent) return;

    let cost = 0;
    let actionName = "";

    // *** PRICING LOGIC ***
    switch(type) {
        case 'text':
            cost = 1;
            actionName = "Send Text";
            break;
        case 'flower':
            cost = 5;
            actionName = "Send Flower Gift";
            break;
        case 'naughty':
            cost = 5; // "Dick gift" euphemism
            actionName = "Send Naughty Gift";
            break;
        case 'pic':
            cost = 15;
            actionName = "Request Private Picture";
            break;
        case 'video':
            cost = 50;
            actionName = "Request Private Video";
            break;
    }

    // Check Balance
    if (user.credits < cost) {
        tg.HapticFeedback.notificationOccurred('error');
        tg.showAlert(`❌ Insufficient Coins!\n\nYou need ${cost} coins but only have ${user.credits}.\n\nPlease buy more.`);
        return;
    }

    // Confirm Action
    tg.showConfirm(`Confirm ${actionName} for ${cost} coins?`, (confirmed) => {
        if(confirmed) {
            // Deduct locally for instant UI update
            user.credits -= cost;
            updateCreditDisplay();
            localStorage.setItem('syncHeartsUser', JSON.stringify(user));

            // Close modal
            document.getElementById('actionModal').classList.remove('active');

            // SEND DATA TO BOT
            // The bot.js will handle the actual message routing and database update
            const payload = {
                action: 'interaction',
                sub_type: type, // text, flower, video, etc.
                agent_id: currentTargetAgent.id,
                agent_name: currentTargetAgent.name,
                cost: cost,
                timestamp: Date.now()
            };
            
            tg.sendData(JSON.stringify(payload));
            
            // For now, since sendData closes the app, we are done.
            // If you keep the app open (using newer bot API), we would show a success toast here.
        }
    });
};

// ====================================================================
// 6. BOTTOM NAVIGATION
// ====================================================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Visual Update
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const tab = item.dataset.tab;

            // Logic
            if (tab === 'browse') {
                // Already on main screen, maybe scroll to top
                window.scrollTo({top: 0, behavior: 'smooth'});
            } 
            else if (tab === 'wallet') {
                // Trigger Buy Credits in Bot
                tg.showConfirm("💰 Open Wallet to buy coins?", (ok) => {
                    if(ok) tg.sendData(JSON.stringify({ action: 'open_wallet' }));
                });
            }
            else if (tab === 'chat') {
                 // Open My Chats in Bot
                 tg.sendData(JSON.stringify({ action: 'open_chats' }));
            }
            else if (tab === 'profile') {
                tg.showAlert(`👤 Profile:\n${user.data.firstName}\nCredits: ${user.credits}`);
            }
        });
    });
                } 
