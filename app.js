// ==========================================
// 1. INITIALIZATION & CONFIG
// ==========================================
const tg = window.Telegram.WebApp;

// Expand to full height
tg.expand();

// Set header color to match the dark theme
tg.setHeaderColor('#0f1115'); 
tg.setBackgroundColor('#0f1115');

// Main State Object
const state = {
    user: {
        age: null,
        country: null,
        city: null,
        lookingFor: null,
        photo: null // Will store base64 preview
    },
    credits: 0,
    currentScreen: 'register'
};

// ==========================================
// 2. MOCK DATA (The "Agency" Database)
// ==========================================
const COUNTRIES = ["USA", "UK", "Canada", "Australia", "Germany", "France", "Nigeria", "India", "Brazil", "UAE"];

const AGENTS = [
    {
        id: 101,
        name: "Sarah, 24",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        status: "Online",
        distance: "2 km away",
        isPremium: true
    },
    {
        id: 102,
        name: "Chloe, 22",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        status: "Online",
        distance: "5 km away",
        isPremium: true
    },
    {
        id: 103,
        name: "Jessica, 26",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        status: "Busy",
        distance: "12 km away",
        isPremium: true
    },
    {
        id: 104,
        name: "Emily, 23",
        image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        status: "Online",
        distance: "Online now",
        isPremium: true
    }
];

// ==========================================
// 3. DOM ELEMENTS
// ==========================================
const screens = {
    register: document.getElementById('screen-register'),
    loading: document.getElementById('screen-loading'),
    agents: document.getElementById('screen-agents')
};

const inputs = {
    age: document.getElementById('reg-age'),
    country: document.getElementById('reg-country'),
    state: document.getElementById('reg-state'),
    lookingFor: document.getElementById('reg-looking-for'),
    photoBtn: document.getElementById('upload-btn'),
    photoPreview: document.getElementById('photo-preview'),
    uploadText: document.getElementById('upload-text'),
    btnComplete: document.getElementById('btn-complete-reg')
};

const nav = document.getElementById('main-nav');
const agentGrid = document.getElementById('agent-grid');
const creditDisplay = document.getElementById('credit-display');

// ==========================================
// 4. LOGIC & FUNCTIONS
// ==========================================

// --- Helper: Switch Screens ---
function showScreen(screenName) {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
    screens[screenName].classList.add('fade-in');
    
    // Show nav only on agent screen
    if (screenName === 'agents') {
        nav.classList.remove('hidden');
        tg.MainButton.hide(); // Hide main button in browse mode
    }
}

// --- Init: Populate Countries ---
function init() {
    COUNTRIES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.innerText = c;
        inputs.country.appendChild(opt);
    });

    // Load saved credits if any (Mock)
    // In real app, you'd fetch this from bot via URL params
    updateCredits(0);
}

// --- Logic: Handle Photo Upload (Visual Only) ---
inputs.photoBtn.addEventListener('click', () => {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                // Show preview
                state.user.photo = readerEvent.target.result;
                inputs.photoPreview.src = state.user.photo;
                inputs.photoPreview.style.display = 'block';
                inputs.uploadText.innerText = "Change Photo";
                
                // Haptic feedback
                tg.HapticFeedback.notificationOccurred('success');
            };
            reader.readAsDataURL(file);
        }
    };
    
    fileInput.click();
});

// --- Logic: Complete Registration ---
inputs.btnComplete.addEventListener('click', () => {
    // 1. Validate
    const age = inputs.age.value;
    const country = inputs.country.value;
    const gender = inputs.lookingFor.value;

    if (!age || !country || !gender) {
        tg.showAlert("Please complete all fields to continue.");
        tg.HapticFeedback.notificationOccurred('error');
        return;
    }

    // 2. Save State
    state.user.age = age;
    state.user.country = country;
    state.user.lookingFor = gender;

    // 3. Transition: Show Radar
    tg.HapticFeedback.impactOccurred('heavy');
    showScreen('loading');

    // 4. Simulate "Finding Agents" (3 seconds)
    setTimeout(() => {
        renderAgents();
        showScreen('agents');
        tg.HapticFeedback.notificationOccurred('success');
    }, 3000);
});

// --- Logic: Render Agent Grid ---
function renderAgents() {
    agentGrid.innerHTML = '';
    
    AGENTS.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.onclick = () => handleAgentClick(agent);

        card.innerHTML = `
            <div class="agent-img-wrapper">
                <img src="${agent.image}" class="agent-img" alt="${agent.name}">
                ${agent.isPremium ? '<div class="premium-lock">🔒 VIP</div>' : ''}
                <div class="agent-info">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-status">
                        <div class="dot"></div> ${agent.distance}
                    </div>
                </div>
            </div>
        `;
        agentGrid.appendChild(card);
    });
}

// --- Interaction: Click Agent ---
function handleAgentClick(agent) {
    tg.HapticFeedback.selectionChanged();
    
    // Check credits
    if (state.credits < 1) {
        tg.showPopup({
            title: `Connect with ${agent.name.split(',')[0]}?`,
            message: "You need 1 Credit to start a private encrypted chat with this agent.",
            buttons: [
                {id: 'buy', type: 'default', text: '💎 Buy Credits'},
                {id: 'cancel', type: 'destructive', text: 'Cancel'}
            ]
        }, (btnId) => {
            if (btnId === 'buy') {
                sendDataToBot('buy_credits');
            }
        });
    } else {
        // Has credits - Start Chat
        tg.showConfirm(`Start private chat with ${agent.name}? This will use 1 Credit.`, (confirmed) => {
            if (confirmed) {
                sendDataToBot('connect_agent', { agentId: agent.id });
            }
        });
    }
}

// --- Navigation Handling ---
document.getElementById('nav-buy').onclick = () => {
    tg.HapticFeedback.impactOccurred('medium');
    sendDataToBot('buy_credits');
};

document.getElementById('nav-support').onclick = () => {
    tg.HapticFeedback.impactOccurred('light');
    tg.openTelegramLink('https://t.me/YourSupportUsername'); // Replace with yours
};

// --- Helper: Send Data to Bot ---
function sendDataToBot(action, payload = {}) {
    const data = {
        action: action,
        user: state.user,
        ...payload
    };
    tg.sendData(JSON.stringify(data));
}

// --- Helper: Update UI ---
function updateCredits(amount) {
    state.credits = amount;
    creditDisplay.innerText = `💎 ${amount}`;
}

// Run Init
init();
