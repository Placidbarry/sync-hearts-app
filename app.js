// ====================================================================
// APP.JS - Sync Hearts Agency Frontend Logic (Dynamic Edition)
// ====================================================================

const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// CONFIGURATION
// ⚠️ CHANGE THIS TO YOUR LIVE SERVER URL WHEN DEPLOYING
// Localhost for testing: http://localhost:8080
// Production example: https://sync-hearts-bot.onrender.com
const API_BASE_URL = 'http://localhost:8080'; 

// Global State
let user = {
    registered: false,
    credits: 0,
    data: {}
};

// ====================================================================
// LIFECYCLE
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadUserState();
    populateCountryDropdown();
    setupNavigation();
    
    // Fetch agents from the bot's API immediately
    loadAgentsFromAPI();
});

// ====================================================================
// DATA FETCHING (NEW)
// ====================================================================

async function loadAgentsFromAPI() {
    const container = document.getElementById('agentGridContainer');
    
    try {
        // Fetch data from the bot
        const response = await fetch(`${API_BASE_URL}/api/agents`);
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        const agents = await response.json();
        
        // Update UI
        document.getElementById('onlineCount').innerText = `Online: ${agents.length}`;
        renderAgentGrid(agents);
        
    } catch (error) {
        console.error("Failed to load agents:", error);
        container.innerHTML = `
            <div style="grid-column: span 2; text-align: center; padding: 20px; color: #ff3b5c;">
                <p>⚠️ Could not connect to agency server.</p>
                <button onclick="loadAgentsFromAPI()" class="chat-btn-small" style="margin-top:10px;">Retry Connection</button>
            </div>
        `;
    }
}

function renderAgentGrid(agents) {
    const container = document.getElementById('agentGridContainer');
    container.innerHTML = ''; // Clear loading text

    if (agents.length === 0) {
        container.innerHTML = `<div style="grid-column: span 2; text-align: center; color: #888;">No models found.</div>`;
        return;
    }

    agents.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        
        // Use photo from API or fallback
        const photoUrl = agent.photo || 'https://placehold.co/400x500';
        
        card.innerHTML = `
            <div class="agent-image-container">
                <img src="${photoUrl}" alt="${agent.name}" onerror="this.src='https://placehold.co/400x500?text=No+Image'">
                <div class="premium-lock">🔒 VIP</div>
            </div>
            <div class="agent-info">
                <div class="agent-name">${agent.name}, ${agent.age} <span class="verified-icon">✅</span></div>
                <div class="agent-location">📍 ${agent.location}</div>
                <div class="agent-stats">
                    <span class="stat-tag">⭐ ${agent.stats.rating}</span>
                    <span class="stat-tag">💬 ${agent.stats.chats}</span>
                </div>
                
                <div style="display: flex; gap: 8px;">
                    <button class="chat-btn-small" style="background: var(--tg-button); color: white; flex: 1;" 
                        onclick="selectAgent('${agent.id}', '${agent.name}')">
                        💬 Chat
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ====================================================================
// ACTIONS
// ====================================================================

// Select Agent -> Tell Bot -> Bot Opens Chat
window.selectAgent = function(agentId, agentName) {
    tg.HapticFeedback.impactOccurred('medium');

    const payload = {
        action: 'select_agent', // Matched with bot.js logic
        agent_id: agentId,
        agent_name: agentName
    };
    
    // Send data to Telegram Bot and close WebApp
    tg.sendData(JSON.stringify(payload));
};

// ====================================================================
// USER STATE & REGISTRATION
// ====================================================================

function loadUserState() {
    const savedUser = localStorage.getItem('syncHeartsUser');
    if (savedUser) {
        user = JSON.parse(savedUser);
        document.getElementById('loginUsername').innerText = user.data.firstName || 'User';
        showScreen('screenLogin');
        
        // Login Button Logic
        document.getElementById('btnLogin').onclick = () => {
            showScreen('screenAgents');
        };
    } else {
        showScreen('screenRegister');
    }
    updateCreditDisplay();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.bottom-nav').forEach(el => el.classList.add('hidden'));
    
    const target = document.getElementById(screenId);
    if(target) target.classList.remove('hidden');

    if(screenId === 'screenAgents') {
        document.getElementById('mainNav').classList.remove('hidden');
    }
}

function populateCountryDropdown() {
    const countries = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Spain", "Brazil", "India", "Nigeria"];
    const select = document.getElementById('countrySelect');
    countries.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.innerText = c;
        select.appendChild(option);
    });
}

// Registration Button
document.getElementById('btnCompleteReg').addEventListener('click', () => {
    const age = document.getElementById('ageInput').value;
    const country = document.getElementById('countrySelect').value;
    
    if(!age || !country || !window.selectedLookingFor) {
        tg.showAlert("⚠️ Please fill in all fields.");
        return;
    }

    const telegramUser = tg.initDataUnsafe?.user || {};
    user.registered = true;
    user.credits = 50;
    user.data = {
        firstName: telegramUser.first_name,
        age: age,
        country: country
    };

    localStorage.setItem('syncHeartsUser', JSON.stringify(user));

    // Notify Bot about new user
    // Note: We don't use sendData here because we don't want to close the app yet.
    // Instead, we just update local UI and fetch agents.
    
    tg.showAlert("🎉 Account Created!\n💰 50 Credits Added.");
    updateCreditDisplay();
    showScreen('screenAgents');
});

function updateCreditDisplay() {
    document.querySelectorAll('#creditCount').forEach(el => el.innerText = user.credits);
}

// ====================================================================
// NAVIGATION
// ====================================================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const tab = item.dataset.tab;
            if (tab === 'browse') {
                window.scrollTo({top: 0, behavior: 'smooth'});
            } 
            else if (tab === 'wallet') {
                tg.showConfirm("💰 Open Wallet to buy coins?", (ok) => {
                    if(ok) tg.sendData(JSON.stringify({ action: 'open_wallet' }));
                });
            }
            else if (tab === 'chat') {
                // Just close app to go back to chat
                tg.close();
            }
        });
    });
}
