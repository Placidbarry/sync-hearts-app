// ---------- TELEGRAM WEB APP INIT ----------
const tg = window.Telegram.WebApp;
tg.expand();                // Use full screen
tg.enableClosingConfirmation(); // Ask user before closing

// Get Telegram user info (who is opening the app)
const user = tg.initDataUnsafe?.user;
console.log('User opened app:', user);

// ---------- WORKER DATA (CHANGE THESE TO YOUR REAL WORKERS) ----------
// You can replace this object with data sent from your bot later.
// For now, it's a real example – no placeholder.
const worker = {
    id: 'worker_001',
    name: 'Sophia',
    age: 26,
    avatar: '👩‍💼',         // You can replace with photo URL later
    bio: 'Friendly and professional. Here to make your day better. Speaks English & Spanish.',
    badge: '✓ Verified companion'
};

// Display worker info on the page
document.getElementById('name').innerText = `${worker.name}, ${worker.age}`;
document.getElementById('avatar').innerText = worker.avatar;
document.getElementById('bio').innerText = worker.bio;
document.getElementById('badge').innerText = worker.badge;

// ---------- BUTTON ACTION: PAY & CONNECT ----------
document.getElementById('connectBtn').addEventListener('click', function() {
    // Give instant haptic feedback (nice vibration)
    tg.HapticFeedback.impactOccurred('heavy');
    
    // Show a confirmation popup (Telegram native)
    tg.showConfirm(
        `Connect with ${worker.name}? Payment is required.`,
        function(isConfirmed) {
            if (isConfirmed) {
                // User clicked "OK" – send request to your bot
                tg.sendData(JSON.stringify({
                    action: 'pay_connect',
                    worker_id: worker.id,
                    worker_name: worker.name,
                    user_id: user?.id,
                    timestamp: Date.now()
                }));
                
                // Show success message
                tg.showAlert(`✅ Request sent! You'll be connected to ${worker.name} shortly.`);
                
                // Optional: close the web app after a moment
                setTimeout(() => {
                    tg.close();
                }, 2000);
            } else {
                // User cancelled
                tg.HapticFeedback.notificationOccurred('warning');
            }
        }
    );
});

// ---------- SEND PAGE VIEW TO BOT (optional) ----------
// Let your bot know that the user viewed this worker
tg.sendData(JSON.stringify({
    action: 'view_worker',
    worker_id: worker.id,
    user_id: user?.id
}));