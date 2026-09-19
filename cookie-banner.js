// Google Consent Mode Varsayılan Durumu (Banner çıkmadan önce reddedildi olarak başlar)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied'
});

// Sayfa yüklendiğinde banner'ı kontrol et ve ekle
document.addEventListener("DOMContentLoaded", function() {
    if (!localStorage.getItem("cookieConsent")) {
        const banner = document.createElement("div");
        banner.id = "cookieConsentBanner";
        banner.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            width: 90%; max-width: 600px; background: var(--card-bg, rgba(30, 41, 59, 0.95));
            backdrop-filter: blur(12px); border: 1px solid var(--border-color, rgba(255,255,255,0.1));
            color: var(--text-dark, #fff); padding: 1.25rem; border-radius: 1rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 99999; display: flex;
            flex-direction: column; gap: 1rem; font-family: 'Plus Jakarta Sans', sans-serif;
        `;

        banner.innerHTML = `
            <div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-main, #cbd5e1);">
                Sitemizde oturum güvenliğinizi sağlamak ve size reklam gösterebilmek için çerezler kullanıyoruz. 
                Detaylı bilgi için <a href="/cookie-policy" style="color: #ec4899; text-decoration: underline;">Çerez Politikamızı</a> inceleyebilirsiniz.
            </div>
            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                <button id="rejectCookies" style="background: transparent; border: 1px solid var(--border-color, #64748b); color: inherit; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 0.75rem;">Yalnızca Gerekli</button>
                <button id="acceptCookies" style="background: linear-gradient(135deg, #ec4899, #6366f1); border: none; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 700; font-size: 0.75rem;">Kabul Et</button>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById("acceptCookies").addEventListener("click", function() {
            localStorage.setItem("cookieConsent", "granted");
            banner.remove();
            updateConsent(true);
        });

        document.getElementById("rejectCookies").addEventListener("click", function() {
            localStorage.setItem("cookieConsent", "denied");
            banner.remove();
            updateConsent(false);
        });
    }
});

function updateConsent(isGranted) {
    gtag('consent', 'update', {
        'ad_storage': isGranted ? 'granted' : 'denied',
        'ad_user_data': isGranted ? 'granted' : 'denied',
        'ad_personalization': isGranted ? 'granted' : 'denied',
        'analytics_storage': isGranted ? 'granted' : 'denied'
    });
}