// ====================================================================
// APP.JS - Sync Hearts Agency Frontend Logic (Dynamic API Edition)
// ====================================================================

// 1. INITIALIZATION & CONFIGURATION
const tg = window.Telegram.WebApp;
tg.expand(); // Full screen
tg.enableClosingConfirmation();

// IMPORTANT: Replace this with your actual Render/Server URL when deployed
const API_BASE_URL = 'https://telegram-b75x.onrender.com'; // Update if needed

// Global State
let user = {
    registered: false,
    credits: 0,
    data: {}
};

// ====================================================================
// 2. LIFECYCLE & NAVIGATION (with backend verification)
// ====================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserState(); // Now async
    loadAgents(); // Fetch from API
    setupNavigation();
});

// Check Persistence with Backend Verification
async function loadUserState() {
    const savedUser = localStorage.getItem('syncHeartsUser');

    // If no local user, show registration
    if (!savedUser) {
        showScreen('screenRegister');
        return;
    }

    user = JSON.parse(savedUser);
    const telegramUser = tg.initDataUnsafe?.user || {};

    // Verify that this user still exists in the database
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/${telegramUser.id}`);
        const data = await response.json();

        if (!data.exists) {
            // User missing in DB → wipe local storage and force re‑registration
            localStorage.removeItem('syncHeartsUser');
            showScreen('screenRegister');
            return;
        }

        // User exists, proceed with login screen
        const nameDisplay = document.getElementById('loginUsername');
        if (nameDisplay) nameDisplay.innerText = user.data.firstName || 'User';

        updateCreditDisplay();
        showScreen('screenLogin');
    } catch (error) {
        console.error("Error checking user existence:", error);
        // On error, fall back to login (or registration if you prefer)
        showScreen('screenLogin');
    }
}

// Screen Switcher
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.bottom-nav').forEach(el => el.classList.add('hidden'));

    // Show target
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');

    // Show Nav bar only on main screens (Agents list)
    if (screenId === 'screenAgents') {
        document.getElementById('mainNav').classList.remove('hidden');
    }
}

// Update Header Credits
function updateCreditDisplay() {
    const display = document.getElementById('creditDisplay');
    if (display) display.innerText = user.credits;
}

// "Welcome Back" Button Logic
const btnAutoLogin = document.getElementById('btnAutoLogin');
if (btnAutoLogin) {
    btnAutoLogin.addEventListener('click', () => {
        showScreen('screenAgents');
    });
}

// ====================================================================
// 3. REGISTRATION LOGIC (with localStorage cleanup)
// ====================================================================

// Photo preview helper (called from inline onchange)
window.previewPhoto = function() {
    const fileInput = document.getElementById('photoInput');
    const previewText = document.getElementById('photoPreviewText');
    if (fileInput.files.length > 0) {
        previewText.style.display = 'block';
        previewText.innerText = '✅ ' + fileInput.files[0].name;
    } else {
        previewText.style.display = 'none';
    }
};

// Gender selection helper (already defined inline, but we keep a global reference)
window.selectedLookingFor = null;

const btnCompleteReg = document.getElementById('btnCompleteReg');
if (btnCompleteReg) {
    btnCompleteReg.addEventListener('click', async () => {
        // 1. Validate inputs
        const name = document.getElementById('nameInput').value;
        const age = document.getElementById('ageInput').value;
        const country = document.getElementById('countrySelect').value;
        const photoFile = document.getElementById('photoInput').files[0];
        const lookingFor = window.selectedLookingFor;

        if (!age || !name || !country || !lookingFor) {
            tg.showAlert("⚠️ Please fill in all fields.");
            return;
        }

        if (parseInt(age) < 18) {
            tg.showAlert("⛔ You must be 18+.");
            return;
        }

        // 2. Upload Photo if selected
        let photoUrl = '';
        if (photoFile) {
            const formData = new FormData();
            formData.append('photo', photoFile);

            try {
                // Change button text to show loading
                btnCompleteReg.innerText = "Uploading...";
                const res = await fetch(`${API_BASE_URL}/api/upload_client`, {
                    method: 'POST',
                    body: formData
                });
                const json = await res.json();
                photoUrl = json.url;  // e.g. "https://.../uploads/client-123456.jpg"
            } catch (e) {
                console.error("Upload failed", e);
                tg.showAlert("Photo upload failed, but you can continue without it.");
                // Continue without photo
            } finally {
                btnCompleteReg.innerText = "✅ Create & Claim Coins";
            }
        }

        // 3. Create User State (clear old data first)
        localStorage.removeItem('syncHeartsUser'); // Ensure no stale data

        const telegramUser = tg.initDataUnsafe?.user || {};
        user.registered = true;
        user.credits = 50; // Visual only, backend verifies this
        user.data = {
            telegramId: telegramUser.id,
            firstName: telegramUser.first_name || 'User',
            age: age,
            country: country,
            photo_url: photoUrl,       // important: matches backend expectation
            lookingFor: lookingFor
        };

        // 4. Save to localStorage
        localStorage.setItem('syncHeartsUser', JSON.stringify(user));

        // 5. Send data to bot (this will close the WebApp in Telegram)
        tg.sendData(JSON.stringify({
            action: 'register_new_user',
            user_data: {
                age: age,
                country: country,
                photo_url: photoUrl
            }
        }));

        // 6. For browser testing, manually show the agents screen
        if (window.location.protocol !== 'https:' || window.location.hostname === 'localhost') {
            updateCreditDisplay();
            showScreen('screenAgents');
        }
    });
}

// ====================================================================
// 4. DYNAMIC AGENT LOADING (API)
// ====================================================================

async function loadAgents() {
    const container = document.getElementById('agentGridContainer');

    try {
        const response = await fetch(`${API_BASE_URL}/api/agents`);
        if (!response.ok) throw new Error("API Error");

        const agents = await response.json();
        renderAgentGrid(agents);
    } catch (e) {
        console.error("Load failed:", e);
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--tg-hint);">
                <p>⚠️ Could not load models.</p>
                <button onclick="loadAgents()" class="btn-chat" style="margin-top:10px; width:auto;">Retry</button>
            </div>
        `;
    }
}

function renderAgentGrid(agents) {
    const container = document.getElementById('agentGridContainer');
    container.innerHTML = ''; // Clear loader

    if (agents.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px;">No models available yet.</div>`;
        return;
    }

    agents.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card fade-in';

        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${agent.photo}" alt="${agent.name}" onerror="this.src='https://placehold.co/400x500?text=No+Image'">
            </div>
            <div class="card-content">
                <div class="agent-name">
                    ${agent.name}, ${agent.age} 
                    <span class="verified-badge">✅</span>
                </div>
                <div class="agent-meta">
                    <span>📍 ${agent.location}</span>
                    <span>⭐ 5.0</span>
                </div>
                <div class="card-actions">
                    <button class="btn-chat" onclick="selectAgent('${agent.id}', '${agent.name}')">
                        💬 Chat Now
                    </button>
                    <button class="btn-gift">🎁</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ====================================================================
// 5. ACTIONS & NAVIGATION
// ====================================================================

// Triggered when user clicks "Chat Now"
window.selectAgent = function(id, name) {
    // Haptic Feedback
    tg.HapticFeedback.impactOccurred('medium');

    // Send selection to bot
    const payload = {
        action: 'select_agent',
        agent_id: id,
        agent_name: name
    };

    // This sends data to bot.js and closes the WebApp
    tg.sendData(JSON.stringify(payload));
};

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Visual Active State
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const tab = item.dataset.tab;

            if (tab === 'browse') {
                showScreen('screenAgents');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (tab === 'wallet') {
                tg.showConfirm("💰 Go to Wallet in chat?", (ok) => {
                    if (ok) tg.sendData(JSON.stringify({ action: 'open_wallet' }));
                });
            } else if (tab === 'chats') {
                // Usually just closes app to show chat history
                tg.close();
            } else if (tab === 'profile') {
                tg.showAlert(`👤 User Profile:\n\nName: ${user.data.firstName || 'User'}\nCredits: ${user.credits}`);
            }
        });
    });
}

// ====================================================================
// 6. EXPOSE FUNCTIONS FOR INLINE EVENT HANDLERS (if any)
// ====================================================================
// (selectAgent and previewPhoto are already attached to window)
```
