// ---------- Telegram Web App initialization ----------
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();
tg.enableClosingConfirmation();

// ---------- Global state ----------
let userCredits = 0;
let registrationData = {
    age: '',
    country: '',
    state: '',
    lookingFor: '',
    photoFileId: ''
};

// ---------- Populate country dropdown ----------
const countryList = [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
    "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
    "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
    "Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia",
    "Comoros","Congo","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic",
    "Denmark","Djibouti","Dominica","Dominican Republic",
    "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
    "Fiji","Finland","France",
    "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
    "Guyana","Haiti","Honduras","Hungary",
    "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
    "Jamaica","Japan","Jordan",
    "Kazakhstan","Kenya","Kiribati","Korea, North","Korea, South","Kosovo","Kuwait","Kyrgyzstan",
    "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
    "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius",
    "Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
    "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Macedonia",
    "Norway","Oman",
    "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland",
    "Portugal","Qatar",
    "Romania","Russia","Rwanda",
    "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
    "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
    "Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Suriname",
    "Sweden","Switzerland","Syria",
    "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago",
    "Tunisia","Turkey","Turkmenistan","Tuvalu",
    "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
    "Vanuatu","Vatican City","Venezuela","Vietnam",
    "Yemen",
    "Zambia","Zimbabwe"
];

function populateCountries() {
    const select = document.getElementById('countrySelect');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Select your country</option>';
    countryList.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        select.appendChild(option);
    });
}
populateCountries();

// ---------- Looking for selection ----------
const genderOptions = document.querySelectorAll('.gender-option');
genderOptions.forEach(opt => {
    opt.addEventListener('click', function () {
        genderOptions.forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        registrationData.lookingFor = this.dataset.value;
    });
});

// ---------- Photo upload (Telegram native) ----------
const uploadBtn = document.getElementById('uploadPhotoBtn');
if (uploadBtn) {
    uploadBtn.addEventListener('click', async function () {
        tg.HapticFeedback.impactOccurred('light');
        tg.openPhotoPicker({
            max: 1,
            success: (files) => {
                if (files && files.length > 0) {
                    const file = files[0];
                    registrationData.photoFileId = file.fileId;
                    document.getElementById('photoFileId').value = file.fileId;
                    const previewDiv = document.getElementById('photoPreview');
                    if (file.url) {
                        previewDiv.innerHTML = `<img src="${file.url}" style="width:100%;height:100%;object-fit:cover;">`;
                    } else {
                        previewDiv.innerHTML = '<span>✅</span>';
                    }
                }
            },
            fail: (error) => {
                tg.showAlert('Photo selection cancelled or failed.');
            }
        });
    });
}

// ---------- Complete registration ----------
const registerBtn = document.getElementById('completeRegistrationBtn');
if (registerBtn) {
    registerBtn.addEventListener('click', function () {
        const age = document.getElementById('ageInput')?.value;
        if (!age || age < 18) {
            tg.showAlert('Please enter a valid age (18+).');
            return;
        }
        const country = document.getElementById('countrySelect')?.value;
        if (!country) {
            tg.showAlert('Please select your country.');
            return;
        }
        const state = document.getElementById('stateInput')?.value.trim();
        if (!state) {
            tg.showAlert('Please enter your state/region.');
            return;
        }
        if (!registrationData.lookingFor) {
            tg.showAlert('Please select who you are looking for.');
            return;
        }

        registrationData.age = age;
        registrationData.country = country;
        registrationData.state = state;

        tg.HapticFeedback.impactOccurred('medium');
        tg.sendData(JSON.stringify({
            action: 'register_client',
            age: registrationData.age,
            country: registrationData.country,
            state: registrationData.state,
            looking_for: registrationData.lookingFor,
            photo_file_id: registrationData.photoFileId || '',
            user_id: tg.initDataUnsafe?.user?.id,
            username: tg.initDataUnsafe?.user?.username,
            first_name: tg.initDataUnsafe?.user?.first_name
        }));

        tg.showAlert('✅ Registration sent! Loading companions...');
        switchToAgentScreen();
    });
}

// ---------- Switch to agent browser ----------
function switchToAgentScreen() {
    document.getElementById('screenRegister')?.classList.add('hidden');
    document.getElementById('screenAgents')?.classList.remove('hidden');
    // request agent list from bot
    tg.sendData(JSON.stringify({ action: 'get_agents' }));
}

// ---------- Render agent grid (called from bot via window.updateAgents) ----------
window.updateAgents = function (agentsArray) {
    const container = document.getElementById('agentGridContainer');
    if (!container) return;
    container.innerHTML = '';
    agentsArray.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.dataset.agentId = agent.id;

        let photosHtml = `<div class="agent-photos">`;
        agent.profilePics.slice(0, 2).forEach((pic, idx) => {
            photosHtml += `<img src="${pic}" class="agent-thumb ${agent.profilePics.length > 1 ? 'small' : ''}" alt="profile">`;
        });
        photosHtml += `</div>`;

        const lockHtml = agent.premiumPics > 0 ? `<div class="premium-lock">🔒${agent.premiumPics}</div>` : '';
        const verifiedBadge = agent.verified ? '✓' : '';

        card.innerHTML = `
            ${lockHtml}
            ${photosHtml}
            <div class="agent-name">${agent.name}, ${agent.age} ${verifiedBadge}</div>
            <div class="agent-meta">📍 ${agent.location}</div>
            <div class="agent-bio">${agent.bio}</div>
            <button class="chat-btn" data-agent-id="${agent.id}" data-agent-name="${agent.name}">
                💬 Chat now
            </button>
        `;
        container.appendChild(card);
    });

    // Attach chat events
    document.querySelectorAll('.chat-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            requestChat(this.dataset.agentId, this.dataset.agentName);
        });
    });
};

// ---------- Request chat (pay 1 credit) ----------
function requestChat(agentId, agentName) {
    tg.HapticFeedback.impactOccurred('heavy');
    tg.showConfirm(`💎 Start private chat with ${agentName}? (1 credit)`, (confirmed) => {
        if (confirmed) {
            tg.sendData(JSON.stringify({
                action: 'request_chat',
                agent_id: agentId,
                agent_name: agentName,
                client_id: tg.initDataUnsafe?.user?.id,
                timestamp: Date.now()
            }));
            tg.showAlert('⏳ Searching for available agent... you will be notified.');
            setTimeout(() => tg.close(), 1500);
        }
    });
}

// ---------- Update credit display (called from bot) ----------
window.updateCredits = function (credits) {
    userCredits = credits;
    const creditEl = document.getElementById('creditDisplay');
    if (creditEl) creditEl.innerHTML = `💎 ${credits} credits`;
    const badge = document.querySelector('.credit-badge');
    if (badge) badge.innerHTML = `💎 ${credits} credits`;
};

// ---------- Navigation ----------
document.getElementById('navCredits')?.addEventListener('click', function () {
    tg.HapticFeedback.impactOccurred('light');
    tg.sendData(JSON.stringify({ action: 'buy_credits' }));
    tg.close();
});
document.getElementById('navProfile')?.addEventListener('click', function () {
    tg.HapticFeedback.impactOccurred('light');
    tg.sendData(JSON.stringify({ action: 'view_profile' }));
    tg.close();
});
document.getElementById('navSupport')?.addEventListener('click', function () {
    tg.HapticFeedback.impactOccurred('light');
    tg.sendData(JSON.stringify({ action: 'support' }));
    tg.close();
});

// ---------- If bot passes initial credits via initData (unsafe) ----------
try {
    const initData = tg.initDataUnsafe;
    if (initData?.user?.credits) {
        window.updateCredits(initData.user.credits);
    }
} catch (e) {}
