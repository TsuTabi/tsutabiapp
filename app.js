// Supabase Entegrasyonu
const SUPABASE_URL = 'https://vchslwakepazewhujbmy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4VlT4TkKQGtQdvorccjvtQ_yV4kSOjz';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null; 
let userProfile = null;
let isDarkMode = false;

// 1. Ortak Navbar ve Footer'ı Yükleme
async function loadComponents() {
    try {
        const navRes = await fetch('navbar.html');
        document.getElementById('navbar-placeholder').innerHTML = await navRes.text();

        const footerRes = await fetch('footer.html');
        document.getElementById('footer-placeholder').innerHTML = await footerRes.text();
    } catch (e) {
        console.error('Bileşen yükleme hatası:', e);
    }
}

// 2. Uygulamayı Başlatma ve LocalStorage Kontrolü
async function initApp() {
    // Hafızadaki temayı anında uygula (Gecikmeyi önler)
    const cachedProfile = localStorage.getItem('userProfile');
    if (cachedProfile) {
        userProfile = JSON.parse(cachedProfile);
        isDarkMode = userProfile.theme === 'dark';
        document.body.classList.toggle('dark-mode', isDarkMode);
        renderUI();
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        
        // Kullanıcı giriş yaptığında günlük oturum ve akıllı kelime seçimini tetikle
        try {
            await supabaseClient.rpc('check_and_update_daily_session', { 
                p_user_id: currentUser.id 
            });
        } catch (err) {
            console.error('Günlük oturum kontrolü sırasında hata oluştu:', err);
        }

        await fetchProfile(currentUser.id);

        // Yeni kayıt olup kelimesi olmayan kullanıcılar için onboarding modal kontrolü
        await checkAndShowOnboardingModal(currentUser.id);
    }
    renderUI();
}

async function fetchProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (data) {
        userProfile = data;
        localStorage.setItem('userProfile', JSON.stringify(data));
        isDarkMode = data.theme === 'dark';
        document.body.classList.toggle('dark-mode', isDarkMode);
        renderUI();
    }
}

async function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    if (userProfile) {
        userProfile.theme = isDarkMode ? 'dark' : 'light';
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
    } else {
        localStorage.setItem('userProfile', JSON.stringify({ theme: isDarkMode ? 'dark' : 'light' }));
    }
    
    if (currentUser) {
        await supabaseClient
            .from('profiles')
            .update({ theme: isDarkMode ? 'dark' : 'light' })
            .eq('user_id', currentUser.id);
    }
    renderUI();
}

function toggleMobileDrawer() {
    document.getElementById('mobileDrawer').classList.toggle('active');
    document.getElementById('mobileOverlay').classList.toggle('active');
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('userProfile');
    currentUser = null;
    userProfile = null;
    renderUI();
}

// --- YENİ KULLANICI ONBOARDING (PAKET SEÇTİRME) FONKSİYONLARI ---

async function checkAndShowOnboardingModal(userId) {
    // 1. İstisna: Ana sayfada ('/' veya '/index.html') asla çıkmasın
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '/index.html' || currentPath === '') {
        return;
    }

    // 2. Bu oturumda daha önce kapatıldıysa tekrar gösterme
    if (sessionStorage.getItem('onboarding_dismissed') === 'true') return;

    // 3. Supabase'den kullanıcının kayıtlı kelimesi var mı kontrol et
    const { count, error } = await supabaseClient
        .from('saved_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (!error && count === 0) {
        showWelcomeModal();
    }
}

function showWelcomeModal() {
    if (document.getElementById('welcomeOnboardingModal')) return;

    const modalHtml = `
        <div id="welcomeOnboardingModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 1rem; padding: 2rem; max-width: 480px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; position: relative;">
                
                <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-dark); margin-bottom: 0.5rem;">TsuTabi'ye Hoş Geldin! 🎉</h2>
                <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.5rem;">Hnagi dünyadan başlamak istiyorsun?</p>
                <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.5rem;">Japonca yolculuğuna hızlı başlamak için popüler bir paket seçerek anında kelime yükle(önerilen en az 15 kelime):</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
                    <button onclick="dismissOnboarding(); location.href='/dictionary?tag=selamlasma'" style="padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--border-color); background: var(--nickname-bg); color: var(--text-dark); font-weight: 700; font-size: 0.8rem; cursor: pointer; text-align: left;">
                        🌸 Temel Selamlaşma
                    </button>
                    <button onclick="dismissOnboarding(); location.href='/dictionary?tag=seyahat'" style="padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--border-color); background: var(--nickname-bg); color: var(--text-dark); font-weight: 700; font-size: 0.8rem; cursor: pointer; text-align: left;">
                        🗺️ Seyahat & Gezi
                    </button>
                    <button onclick="dismissOnboarding(); location.href='/dictionary?tag=naruto'" style="padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--border-color); background: var(--nickname-bg); color: var(--text-dark); font-weight: 700; font-size: 0.8rem; cursor: pointer; text-align: left;">
                        🍥 Naruto Dünyası
                    </button>
                    <button onclick="dismissOnboarding(); location.href='/dictionary?tag=aot'" style="padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--border-color); background: var(--nickname-bg); color: var(--text-dark); font-weight: 700; font-size: 0.8rem; cursor: pointer; text-align: left;">
                        ⚔️ Attack on Titan
                    </button>
                </div>

                <button onclick="dismissOnboarding()" style="background: transparent; border: none; color: var(--text-muted); font-size: 0.75rem; cursor: pointer; text-decoration: underline;">
                    Şimdilik kendim keşfetmek istiyorum
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function dismissOnboarding() {
    sessionStorage.setItem('onboarding_dismissed', 'true');
    const modal = document.getElementById('welcomeOnboardingModal');
    if (modal) modal.remove();
}

// Global olarak erişilebilir yapalım ki HTML içinden çağrılabilsinler
window.toggleMobileDrawer = toggleMobileDrawer;
window.toggleDarkMode = toggleDarkMode;
window.handleLogout = handleLogout;
window.dismissOnboarding = dismissOnboarding;

// Navbar and Mobil Menüyü Güncelleme
function renderUI() {
    const desktopNav = document.getElementById('desktopNavRight');
    const mobileContent = document.getElementById('mobileDrawerContent');
    
    if (!desktopNav || !mobileContent) return;

    const modeText = isDarkMode ? '☀️ Gündüz Modu' : '🌙 Gece Modu';
    const nickname = userProfile ? userProfile.nickname : (currentUser ? currentUser.email : 'Hesap');

    if (currentUser) {
        desktopNav.innerHTML = `
            <a href="/blog" class="btn">Blog</a>
            <div class="dropdown">
                <button class="btn" style="background: var(--btn-bg);">Çalışma Alanı <span class="arrow">▼</span></button>
                <div class="dropdown-content">
                    <a href="/dashboard">Çalışma Alanın</a>
                    <a href="/dictionary">Sözlük</a>
                    <a href="/flashcards">Öğren</a>
                    <a href="/quiz">Mini Sınav</a>
                    <a href="/diary">Günün</a>
                </div>
            </div>
            <div class="dropdown">
                <button class="btn btn-anime">${nickname} <span class="arrow">▼</span></button>
                <div class="dropdown-content">
                    <div class="nickname-display">${nickname}</div>
                    <a href="/account">Hesap</a>
                    <button onclick="toggleDarkMode()">${modeText}</button>
                    <button onclick="handleLogout()" style="color: var(--primary-anime);">Çıkış yap</button>
                </div>
            </div>
        `;
        mobileContent.innerHTML = `
            <a href="/blog" class="mobile-drawer-link">Blog</a>
            <a href="/dashboard" class="mobile-drawer-link">Çalışma Alanın</a>
            <a href="/dictionary" class="mobile-drawer-link">Sözlük</a>
            <a href="/flashcards" class="mobile-drawer-link">Öğren</a>
            <a href="/quiz" class="mobile-drawer-link">Mini Sınav</a>
            <a href="/diary" class="mobile-drawer-link">Günün</a>
            <div style="border-top: 1px solid var(--border-color); margin: 0.25rem 0;"></div>
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-dark); padding: 0.2rem 0;">${nickname}</div>
            <a href="/account" class="mobile-drawer-link">Hesap</a>
            <button onclick="toggleDarkMode()" class="mobile-drawer-link">${modeText}</button>
            <button onclick="handleLogout()" class="mobile-drawer-link" style="color: var(--primary-anime); text-align: left;">Çıkış yap</button>
        `;
    } else {
        desktopNav.innerHTML = `
            <a href="/blog" class="btn">Blog</a>
            <div class="dropdown">
                <button class="btn" style="background: var(--btn-bg);">Çalışma Alanı <span class="arrow">▼</span></button>
                <div class="dropdown-content">
                    <a href="/dashboard">Çalışma Alanın</a>
                    <a href="/dictionary">Sözlük</a>
                    <a href="/flashcards">Öğren</a>
                    <a href="/quiz">Mini Sınav</a>
                    <a href="/diary">Günün</a>
                </div>
            </div>
            <button onclick="toggleDarkMode()" class="btn">${isDarkMode ? '☀️' : '🌙'}</button>
            <a href="/register" class="btn btn-outline">Oturum Aç</a>
            <a href="/register?type=signup" class="btn btn-anime">Kayıt Ol</a>
        `;
        mobileContent.innerHTML = `
            <a href="/blog" class="mobile-drawer-link">Blog</a>
            <a href="/dashboard" class="mobile-drawer-link">Çalışma Alanın</a>
            <a href="/dictionary" class="mobile-drawer-link">Sözlük</a>
            <a href="/flashcards" class="mobile-drawer-link">Öğren</a>
            <a href="/quiz" class="mobile-drawer-link">Mini Sınav</a>
            <a href="/diary" class="mobile-drawer-link">Günün</a>
            <div style="border-top: 1px solid var(--border-color); margin: 0.25rem 0;"></div>
            <button onclick="toggleDarkMode()" class="mobile-drawer-link">${modeText}</button>
            <a href="/register" class="btn btn-anime" style="width: 100%; padding: 0.65rem; justify-content: center; font-size: 0.8rem; margin-top: 0.25rem;">Oturum Aç</a>
            <a href="/register?type=signup" class="btn btn-outline" style="width: 100%; padding: 0.65rem; justify-content: center; font-size: 0.8rem;">Kaydol</a>
        `;
    }
}

// Sayfa Açıldığında Çalıştır
document.addEventListener("DOMContentLoaded", async () => {
    await loadComponents();
    await initApp();
});