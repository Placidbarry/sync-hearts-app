// ==========================================
// VELVET CHAT - CLIENT SIDE LOGIC
// ==========================================

const tg = window.Telegram.WebApp;
tg.expand(); // Make it full screen
tg.enableClosingConfirmation(); // Ask before closing

// ==========================================
// 1. CUSTOMIZE YOUR PROFILES HERE
// ==========================================
// Tip: Use Imgur, Postimages, or Telegram file links for 'img'.
// Since you are the only agent, all these profiles are just "masks" for you.

const femaleProfiles = [
    { 
        id: 'user_f1', 
        name: 'Sarah', 
        age: 23, 
        dist: '1.2km', 
        online: true,
        img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', 
        bio: 'Bored at home 🏠. Want to chat with someone fun? I reply fast. 😉' 
    },
    { 
        id: 'user_f2', 
        name: 'Jessica', 
        age: 25, 
        dist: '3km', 
        online: true,
        img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500', 
        bio: 'Love late night talks. Looking for a generous friend. 💎' 
    },
    { 
        id: 'user_f3', 
        name: 'Elena', 
        age: 27, 
        dist: '500m', 
        online: false, // Will show as "Recently active"
        img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500', 
        bio: 'Just moved here! Looking for a tour guide... or just a good time.' 
    },
    { 
        id: 'user_f4', 
        name: 'Mia', 
        age: 21, 
        dist: '4.5km', 
        online: true,
        img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500', 
        bio: 'Student. Stressing about exams. Distract me? 😈' 
    }
];

const maleProfiles = [
    { 
        id: 'user_m1', 
        name: 'Alex', 
        age: 26, 
        dist: '2km', 
        online: true,
        img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', 
        bio: 'Gym rat by day, chatter by night. Hmu.' 
    },
    { 
        id: 'user_m2', 
        name: 'Daniel', 
        age: 29, 
        dist: '1km', 
        online: true,
        img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', 
        bio: 'Professional vibe checker. Lets skip the small talk.' 
    }
];

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================
let userGender = '';
let lookingFor = '';
let currentProfileId = null;

// ==========================================
// 3. NAVIGATION FUNCTIONS
// ==========================================

function nextScreen(id) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Show target screen
    document.getElementById(id).classList.add('active');
}

// Step 1: User picks their own gender
function selectGender(gender) {
    userGender = gender;
    // Add a tiny vibration for realism
    if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    nextScreen('screen-looking');
}

// Step 2: User picks who they want to meet
function startSearch(preference) {
    lookingFor = preference;
    if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    
    nextScreen('screen-radar');
    
    // Simulate a realistic "Scanning" process
    const text = document.getElementById('radar-text');
    
    setTimeout(() => { text.innerText = "Triangulating location..."; }, 1200);
    setTimeout(() => { text.innerText = "Filtering active users..."; }, 2400);
    setTimeout(() => { 
        renderFeed(); // Load the data
        if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        nextScreen('screen-feed');
    }, 4000);
}

// ==========================================
// 4. FEED RENDERER (The "Tinder" List)
// ==========================================

function renderFeed() {
    const list = document.getElementById('feed-list');
    list.innerHTML = ''; // Clear previous

    // Filter profiles based on user choice
    let profilesToShow = [];
    if (lookingFor === 'girls') profilesToShow = femaleProfiles;
    else if (lookingFor === 'boys') profilesToShow = maleProfiles;
    else profilesToShow = [...femaleProfiles, ...maleProfiles];

    // Shuffle them so it looks fresh every time
    profilesToShow.sort(() => 0.5 - Math.random());

    profilesToShow.forEach(p => {
        const item = document.createElement('div');
        item.className = 'profile-item';
        item.onclick = () => openProfile(p);
        
        // Check if online
        const onlineBadge = p.online ? '<div class="online-dot"></div>' : '';

        item.innerHTML = `
            <div class="avatar-wrapper">
                <img src="${p.img}" class="avatar">
                ${onlineBadge}
            </div>
            <div class="profile-info">
                <div class="name">${p.name}, ${p.age}</div>
                <div class="preview">📍 ${p.dist} • Click to chat...</div>
            </div>
            <div class="action-icon">💬</div>
        `;
        list.appendChild(item);
    });
}

// ==========================================
// 5. PROFILE MODAL LOGIC
// ==========================================

function openProfile(profile) {
    currentProfileId = profile.id; // Remember who they clicked
    
    // Populate the modal with the fake data
    document.getElementById('modal-img').src = profile.img;
    document.getElementById('modal-name').innerText = `${profile.name}, ${profile.age}`;
    document.getElementById('modal-bio').innerText = profile.bio;
    document.getElementById('modal-dist').innerText = profile.dist;
    
    document.getElementById('profile-modal').classList.add('open');
    if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function closeModal() {
    document.getElementById('profile-modal').classList.remove('open');
}

// ==========================================
// 6. THE "CONNECT" ACTION (The Money Maker)
// ==========================================

document.getElementById('connect-btn').addEventListener('click', () => {
    // 1. Vibration
    if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
    
    // 2. Prepare data to send to Bot
    // We send 'connect_request' so the bot knows to ask for payment/subscription
    const data = {
        action: 'connect_request',
        target_id: currentProfileId, // e.g., 'user_f1'
        user_gender: userGender
    };

    // 3. Send to Telegram
    tg.sendData(JSON.stringify(data));
    
    // 4. Close the window (Bot takes over from here)
    tg.close();
});
