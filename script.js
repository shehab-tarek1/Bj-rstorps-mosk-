// إعدادات Firebase الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSyDLOQ3i-cyhZV-A1oN5Jhy_OQj_KdqClzk",
    authDomain: "al-rahman-d0529.firebaseapp.com",
    projectId: "al-rahman-d0529",
    storageBucket: "al-rahman-d0529.firebasestorage.app",
    messagingSenderId: "1081097400036",
    appId: "1:1081097400036:web:a5b9ada478c9bdb7ae06f1"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth(); 

const publicVapidKey = "BOX0a8Dg181ZMjLic3risMEkJZio0hNHGIABg1Mym1qaSorpI6NcJ3QQ79WXg0qi6R1n4SXo-aib3WUkNcIII6E";

let messaging; 
try { if (firebase.messaging.isSupported()) messaging = firebase.messaging(); } catch (e) { }

let isNotifEnabled = localStorage.getItem('notifEnabled') === 'true';
let pendingNotifAction = ''; 

let siteData = { activities:[], gallery:[], notifications:[] };
let prayerTimes =[];

const langData = {
    ar: { 
        nav: "مسجد الرحمن", menuTitle: "القائمة", home: "الرئيسية", prayers: "مواقيت الصلاة", activities: "الأنشطة", gallery: "المعرض", admin: "الإدارة", heroTitle: "مسجد الرحمن", heroSub: "نرحب بكم في بيت الله في مدينة بيرستورب السويدية", tPrayer: "مواقيت الصلاة", tAct: "أنشطة المسجد", tDonate: "تبرع للمسجد", tSwish: "ساهم في دعم المسجد، تبرعك صدقة جارية.", btnDonate: "التبرع <i class='fas fa-hand-holding-usd'></i>", tGallery: "معرض الصور", tContact: "تواصل مع الإدارة", address: "Islamiska kultur center Perstorp, Hantverkaregatan 1, 284 31 Perstorp, السويد", 
        prayerNames: { fajr: "الفجر", shurooq: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء" }, pLabels: { adhan: "أذان:", iqama: "إقامة:", noP: "الشروق" }, timerTexts: { adhan: "باقي على أذان", iqama: "باقي على إقامة" }, notifTitle: "الإشعارات", notifBtnEnable: "تفعيل الإشعارات", notifBtnActive: "الإشعارات مفعلة",
        modalEnableTitle: "تفعيل الإشعارات", modalEnableMsg: "تفعيل التنبيهات لمواعيد الصلاة؟",
        modalDisableTitle: "إيقاف الإشعارات", modalDisableMsg: "إيقاف استلام الإشعارات من المسجد؟", btnYes: "تأكيد", btnNo: "إلغاء",
        lblTotal: "إجمالي الزوار", lblActive: "نشط الآن",
        btnMonthly: "جدول مواقيت الصلاة الشهري", tableTitle: "مواقيت الصلاة لشهر", thDay: "اليوم", thFajr: "الفجر", thDhuhr: "الظهر", thAsr: "العصر", thMaghrib: "المغرب", thIsha: "العشاء", btnCloseTable: "إغلاق", btnSaveImg: "حفظ كصورة",
        monthsAr:["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
        tvMode: "شاشة العرض (TV)"
    },
    sv: { 
        nav: "Moské Ar-Rahman", menuTitle: "Meny", home: "Hem", prayers: "Bönetider", activities: "Aktiviteter", gallery: "Galleri", admin: "Admin", heroTitle: "Moské Ar-Rahman", heroSub: "Välkommen till Allahs hus i Perstorp, Sverige", tPrayer: "Bönetider", tAct: "Aktiviteter", tDonate: "Stöd Moskén", tSwish: "Bidra till att stödja moskén enkelt via Swish.", btnDonate: "Donera <i class='fas fa-hand-holding-usd'></i>", tGallery: "Bildgalleri", tContact: "Kontakta Admin", address: "Islamiska kultur center Perstorp, Hantverkaregatan 1, 284 31 Perstorp, Sverige", 
        prayerNames: { fajr: "Fajr", shurooq: "Shurooq", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" }, pLabels: { adhan: "Adhan:", iqama: "Iqama:", noP: "Soluppgång" }, timerTexts: { adhan: "Tid till Adhan", iqama: "Tid till Iqama" }, notifTitle: "Notiser", notifBtnEnable: "Aktivera Notiser", notifBtnActive: "Notiser Aktiverade",
        modalEnableTitle: "Aktivera Notiser", modalEnableMsg: "Vill du tillåta notiser för bönetider?",
        modalDisableTitle: "Inaktivera Notiser", modalDisableMsg: "Vill du sluta ta emot notiser?", btnYes: "Bekräfta", btnNo: "Avbryt",
        lblTotal: "Totalt Besökare", lblActive: "Aktiva Nu",
        btnMonthly: "Månatlig Bönetidtabell", tableTitle: "Bönetider för", thDay: "Dag", thFajr: "Fajr", thDhuhr: "Dhuhr", thAsr: "Asr", thMaghrib: "Maghrib", thIsha: "Isha", btnCloseTable: "Stäng", btnSaveImg: "Spara bild",
        monthsSv:["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"],
        tvMode: "TV-skärm"
    }
};

// --- نظام الإحصائيات المباشر ---
auth.signInAnonymously().catch(e => e);
let activeUsersData =[];

auth.onAuthStateChanged((user) => {
    if (user) {
        if (!localStorage.getItem('hasVisited_v1')) {
            db.collection('site_statistics').doc('global_stats').set({ total_visitors: firebase.firestore.FieldValue.increment(1) }, { merge: true });
            localStorage.setItem('hasVisited_v1', 'true');
        }
        const presenceRef = db.collection('active_users').doc(user.uid);
        const updatePresence = () => { presenceRef.set({ last_active: firebase.firestore.FieldValue.serverTimestamp() }).catch(e=>e); };
        updatePresence(); setInterval(updatePresence, 60000); 
        window.addEventListener('beforeunload', () => { presenceRef.delete(); });
    }
});

function listenToStatistics() {
    db.collection('site_statistics').doc('global_stats').onSnapshot(doc => {
        if (doc.exists) {
            const countEl = document.getElementById('count-total');
            const newCount = doc.data().total_visitors || 0;
            if (countEl.innerText !== newCount.toString() && countEl.innerText !== '...') {
                countEl.classList.remove('pop-update'); void countEl.offsetWidth; countEl.classList.add('pop-update');
            }
            countEl.innerText = newCount;
        }
    });

    db.collection('active_users').onSnapshot(snapshot => {
        activeUsersData =[];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.last_active) activeUsersData.push({ ref: doc.ref, time: data.last_active.toMillis() });
        });
        renderActiveCount();
    });
    setInterval(renderActiveCount, 5000);
}

function renderActiveCount() {
    let activeCount = 0; const now = Date.now();
    activeUsersData.forEach(user => {
        if (now - user.time < 180000) activeCount++;
        else if (now - user.time > 3600000) user.ref.delete().catch(e=>e);
    });
    const countEl = document.getElementById('count-active');
    const newCount = Math.max(1, activeCount);
    if (countEl.innerText !== newCount.toString() && countEl.innerText !== '1') {
        countEl.classList.remove('pop-update'); void countEl.offsetWidth; countEl.classList.add('pop-update');
    }
    countEl.innerText = newCount;
}

// --- وظائف الجدول الشهري ---
function generateMonthlyTable() {
    const today = new Date();
    const monthIndex = today.getMonth();
    const todayDate = today.getDate().toString();

    const swedishMonths =["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    const currentMonthNameForData = swedishMonths[monthIndex];

    const displayMonthName = currentLang === 'ar' ? langData.ar.monthsAr[monthIndex] : langData.sv.monthsSv[monthIndex];
    document.getElementById('timetable-month-name').innerText = `${langData[currentLang].tableTitle} ${displayMonthName}`;

    const tbody = document.getElementById('timetable-tbody');
    tbody.innerHTML = ''; 

    if (typeof yearlyPrayerData !== 'undefined' && yearlyPrayerData.months[currentMonthNameForData]) {
        const monthData = yearlyPrayerData.months[currentMonthNameForData];

        monthData.forEach(dayInfo => {
            const tr = document.createElement('tr');
            if (dayInfo.Dat === todayDate) tr.className = 'today-row';

            tr.innerHTML = `
                <td style="font-weight:bold;">${dayInfo.Dat}</td>
                <td>${dayInfo.Fajr}</td>
                <td>${dayInfo.Dhohr}</td>
                <td>${dayInfo.Asr}</td>
                <td>${dayInfo.Magrib}</td>
                <td>${dayInfo.Isha}</td>
            `;
            tbody.appendChild(tr);
        });

        setTimeout(() => {
            const todayRow = document.querySelector('.today-row');
            if (todayRow) todayRow.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
    }
}

function openTimetable() {
    generateMonthlyTable();
    document.getElementById('timetable-backdrop').classList.add('active');
    document.getElementById('timetable-wrapper').classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

function closeTimetable() {
    document.getElementById('timetable-backdrop').classList.remove('active');
    document.getElementById('timetable-wrapper').classList.remove('active');
    document.body.style.overflow = '';
}

function saveTimetableImage() {
    const captureArea = document.getElementById('capture-area');
    const originalBackground = captureArea.style.background;
    captureArea.style.background = '#ffffff'; 

    showToast(currentLang === 'ar' ? "جاري التقاط الصورة..." : "Sparar bild...", 2000);

    html2canvas(captureArea, {
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff"
    }).then(canvas => {
        captureArea.style.background = originalBackground; 

        const monthName = document.getElementById('timetable-month-name').innerText;
        const link = document.createElement('a');
        link.download = `Moske_Ar_Rahman_${monthName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        captureArea.style.background = originalBackground;
        console.error("Error saving image:", err);
        showToast(currentLang === 'ar' ? "حدث خطأ" : "Ett fel uppstod", 2000);
    });
}

// --- وظائف متصفح الصور الداخلي (Lightbox) ---
function openLightbox(imageUrl) {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    img.src = imageUrl;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

function closeLightbox(event) {
    if (event && event.target.id === 'lightbox-img') return;
    document.getElementById('lightbox-modal').classList.remove('active');
    document.body.style.overflow = ''; 
}

function openNotificationModal() {
    toggleSidebar(); 
    const t = langData[currentLang];
    const modal = document.getElementById('notif-confirm-modal');
    const title = document.getElementById('notif-modal-title');
    const msg = document.getElementById('notif-modal-msg');
    const icon = document.getElementById('notif-modal-icon');
    const btnYes = document.getElementById('notif-btn-yes');

    document.getElementById('notif-btn-no').innerText = t.btnNo;
    btnYes.innerText = t.btnYes;

    if (!isNotifEnabled) {
        pendingNotifAction = 'enable';
        title.innerText = t.modalEnableTitle; msg.innerText = t.modalEnableMsg;
        icon.className = "fas fa-bell"; icon.style.color = "var(--primary)"; btnYes.className = "btn btn-confirm";
    } else {
        pendingNotifAction = 'disable';
        title.innerText = t.modalDisableTitle; msg.innerText = t.modalDisableMsg;
        icon.className = "fas fa-bell-slash"; icon.style.color = "var(--danger)"; btnYes.className = "btn btn-danger";
    }
    modal.style.display = 'flex';
}

function closeNotifModal() { document.getElementById('notif-confirm-modal').style.display = 'none'; }

async function confirmNotificationAction() {
    closeNotifModal();
    if (pendingNotifAction === 'enable') {
        if (!('Notification' in window)) { showToast(currentLang === 'sv' ? "Stöds inte." : "غير مدعوم."); return; }
        try {
            const permission = await Notification.requestPermission(); 
            if (permission === 'granted') {
                isNotifEnabled = true; localStorage.setItem('notifEnabled', 'true');
                updateNotifBtnUI(); 
                showToast(currentLang === 'sv' ? "Aktiverat! 🔔" : "تم التفعيل! 🔔");
                await saveFCMToken(); 
            }
        } catch(e) {}
    } else if (pendingNotifAction === 'disable') {
        isNotifEnabled = false; localStorage.setItem('notifEnabled', 'false');
        updateNotifBtnUI();
        showToast(currentLang === 'sv' ? "Inaktiverat." : "تم الإيقاف.");
    }
}

async function saveFCMToken() {
    if(!messaging || !('serviceWorker' in navigator)) return;
    try {
        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { updateViaCache: 'none' });
        const token = await messaging.getToken({ vapidKey: publicVapidKey, serviceWorkerRegistration: reg });
        if (token) {
            const savedLocalToken = localStorage.getItem('savedFCMToken');
            if (savedLocalToken !== token) {
                await db.collection('users_tokens').doc(token).set({ token: token, timestamp: firebase.firestore.FieldValue.serverTimestamp(), userAgent: navigator.userAgent });
                localStorage.setItem('savedFCMToken', token); 
            }
        }
    } catch(e) { console.log("Token error", e); }
}

if (messaging) {
    messaging.onMessage((payload) => {
        const title = payload.notification?.title || (currentLang === 'sv' ? 'Ny Notis' : 'إشعار جديد');
        const body = payload.notification?.body || '';
        showToast(`🔔 ${title}: ${body}`, 5000);
    });
}

async function checkAndRefreshFCMToken() {
    if ('Notification' in window && Notification.permission === 'granted') {
        isNotifEnabled = true; localStorage.setItem('notifEnabled', 'true'); updateNotifBtnUI(); await saveFCMToken();
    } else if ('Notification' in window && Notification.permission !== 'granted') {
        isNotifEnabled = false; localStorage.setItem('notifEnabled', 'false'); updateNotifBtnUI();
    }
}

setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'default' && !localStorage.getItem('notifPromptShown')) {
        openNotificationModal(); localStorage.setItem('notifPromptShown', 'true');
    }
}, 8000);

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'sv' : 'ar';
    localStorage.setItem('lang', currentLang);
    applyTranslations(); updateAnalogClock();

    if(document.getElementById('timetable-wrapper').classList.contains('active')) {
        generateMonthlyTable();
    }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('sidebar-overlay').classList.toggle('active'); }
function toggleNotifications() { const box = document.getElementById('notif-box'); box.classList.toggle('show'); if(box.classList.contains('show')) document.getElementById('notif-dot').classList.remove('active'); }

function updateNotifBtnUI() {
    const t = langData[currentLang]; const btnWrapper = document.getElementById('btn-toggle-notif');
    const btnText = document.getElementById('menu-notif-btn'); const btnIcon = document.getElementById('menu-notif-icon');
    if (isNotifEnabled) { btnText.innerText = t.notifBtnActive; btnIcon.className = "fas fa-check-circle"; btnWrapper.classList.add('btn-notif-active'); } 
    else { btnText.innerText = t.notifBtnEnable; btnIcon.className = "fas fa-bell"; btnWrapper.classList.remove('btn-notif-active'); }
}

function applyTranslations() {
    const t = langData[currentLang]; document.documentElement.lang = currentLang; document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    if (currentLang === 'ar') document.body.classList.add('lang-ar'); else document.body.classList.remove('lang-ar');

    document.getElementById('nav-title').innerText = t.nav; document.getElementById('menu-title').innerText = t.menuTitle; document.getElementById('menu-home').innerText = t.home; document.getElementById('menu-prayers').innerText = t.prayers; document.getElementById('menu-activities').innerText = t.activities; document.getElementById('menu-gallery').innerText = t.gallery; document.getElementById('menu-admin').innerText = t.admin; document.getElementById('hero-title').innerText = t.heroTitle; document.getElementById('hero-subtitle').innerText = t.heroSub; document.getElementById('title-prayer').innerText = t.tPrayer; document.getElementById('title-activities').innerText = t.tAct; document.getElementById('title-donate').innerText = t.tDonate; document.getElementById('text-swish').innerText = t.tSwish; document.getElementById('btn-donate').innerHTML = t.btnDonate; document.getElementById('title-gallery').innerText = t.tGallery; document.getElementById('title-contact').innerText = t.tContact; document.getElementById('address-text').innerText = t.address; document.getElementById('notif-title-text').innerText = t.notifTitle;

    document.getElementById('label-total').innerText = t.lblTotal; document.getElementById('label-active').innerText = t.lblActive;

    if(document.getElementById('menu-tv')) document.getElementById('menu-tv').innerText = t.tvMode;

    document.getElementById('text-btn-monthly').innerText = t.btnMonthly;
    document.getElementById('timetable-modal-title').innerText = t.btnMonthly;
    document.getElementById('th-day').innerText = t.thDay;
    document.getElementById('th-fajr').innerText = t.thFajr;
    document.getElementById('th-dhuhr').innerText = t.thDhuhr;
    document.getElementById('th-asr').innerText = t.thAsr;
    document.getElementById('th-maghrib').innerText = t.thMaghrib;
    document.getElementById('th-isha').innerText = t.thIsha;
    document.getElementById('btn-timetable-close').innerText = t.btnCloseTable;
    document.getElementById('btn-timetable-save').innerHTML = `<i class="fas fa-download"></i> ${t.btnSaveImg}`;

    updateNotifBtnUI(); renderPrayers(); renderActivities(); renderGallery();
}

function createClockTicks() {
    const face = document.getElementById('clock-face');
    for (let i = 0; i < 60; i++) {
        const tick = document.createElement('div');
        tick.className = i % 5 === 0 ? 'tick hour-tick' : 'tick';
        tick.style.transform = `rotate(${i * 6}deg)`; face.appendChild(tick);
    }
}

function updateAnalogClock() {
    const now = new Date();
    if (now.getDate() !== currentDayTracker) {
        currentDayTracker = now.getDate();
        loadTodaysPrayers(); 
    }
    document.getElementById('second-hand').style.transform = `rotate(${((now.getSeconds() / 60) * 360)}deg)`;
    document.getElementById('minute-hand').style.transform = `rotate(${((now.getMinutes() / 60) * 360) + ((now.getSeconds()/60)*6)}deg)`;
    document.getElementById('hour-hand').style.transform = `rotate(${((now.getHours() / 12) * 360) + ((now.getMinutes()/60)*30)}deg)`;
    document.getElementById('lux-date').innerText = now.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
} setInterval(updateAnalogClock, 1000);

function addMinutes(timeStr, minsToAdd) { if (!timeStr) return ""; let[h, m] = timeStr.split(':').map(Number); let d = new Date(); d.setHours(h, m + minsToAdd, 0, 0); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }

function loadTodaysPrayers() {
    const today = new Date(); const monthNames =["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    let tD = null; if (typeof yearlyPrayerData !== 'undefined' && yearlyPrayerData.months[monthNames[today.getMonth()]]) tD = yearlyPrayerData.months[monthNames[today.getMonth()]].find(d => d.Dat === today.getDate().toString());
    if (!tD) tD = { Fajr: "04:00", Shuruk: "06:00", Dhohr: "13:00", Asr: "16:00", Magrib: "19:00", Isha: "21:00" };
    prayerTimes =[ { id: 'fajr', icon: 'fa-moon', adhan: tD.Fajr, iqama: addMinutes(tD.Fajr, 20) }, { id: 'shurooq', icon: 'fa-sun', time: tD.Shuruk, type: 'no-prayer' }, { id: 'dhuhr', icon: 'fa-sun', adhan: tD.Dhohr, iqama: addMinutes(tD.Dhohr, 10) }, { id: 'asr', icon: 'fa-cloud-sun', adhan: tD.Asr, iqama: addMinutes(tD.Asr, 10) }, { id: 'maghrib', icon: 'fa-cloud-moon', adhan: tD.Magrib, iqama: addMinutes(tD.Magrib, 10) }, { id: 'isha', icon: 'fa-star-and-crescent', adhan: tD.Isha, iqama: addMinutes(tD.Isha, 10) } ];
    renderPrayers(); 
}

function renderPrayers() {
    const t = langData[currentLang]; let html = '';
    prayerTimes.forEach(p => { html += `<div class="prayer-card" id="card-${p.id}"><i class="fas ${p.icon} prayer-icon"></i><div class="prayer-name">${t.prayerNames[p.id]}</div>`; if(p.type === 'no-prayer') html += `<div class="prayer-time">${p.time} <br> <span style="font-size:0.75rem">(${t.pLabels.noP})</span></div></div>`; else html += `<div class="prayer-time">${t.pLabels.adhan} <strong>${p.adhan}</strong><br>${t.pLabels.iqama} <strong>${p.iqama}</strong></div></div>`; });
    document.getElementById('prayer-container').innerHTML = html; updateTimer();
}

function updateTimer() {
    if (prayerTimes.length === 0) return; const now = new Date(); const t = langData[currentLang]; let target = null; let title = ""; let cId = null; 
    for (let p of prayerTimes.filter(p => p.type !== 'no-prayer')) {
        let aDate = new Date(); aDate.setHours(...p.adhan.split(':'), 0, 0); let iDate = new Date(); iDate.setHours(...p.iqama.split(':'), 0, 0);
        if (now < aDate) { target = aDate; title = `${t.timerTexts.adhan} ${t.prayerNames[p.id]}`; cId = p.id; break; } 
        else if (now < iDate) { target = iDate; title = `${t.timerTexts.iqama} ${t.prayerNames[p.id]}`; cId = p.id; break; }
    }
    if (!target) { let f = prayerTimes[0]; target = new Date(); target.setDate(target.getDate() + 1); target.setHours(...f.adhan.split(':'), 0, 0); title = `${t.timerTexts.adhan} ${t.prayerNames[f.id]}`; cId = f.id; }
    let diff = target - now; let h = Math.floor((diff % 86400000) / 3600000); let m = Math.floor((diff % 3600000) / 60000); let s = Math.floor((diff % 60000) / 1000);
    document.getElementById('timer-title').innerText = title; document.getElementById('countdown-clock').innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    document.querySelectorAll('.prayer-card').forEach(el => el.classList.remove('next-prayer')); if(document.getElementById(`card-${cId}`)) document.getElementById(`card-${cId}`).classList.add('next-prayer');
} setInterval(updateTimer, 1000);

function showToast(text, duration = 3000) { const toastEl = document.getElementById('app-toast-box'); document.getElementById('toast-msg-text').innerText = text; toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show'); setTimeout(() => { toastEl.classList.remove('show'); }, duration); }

function listenToFirebase() {
    db.collection("activities").orderBy("timestamp", "desc").limit(6).onSnapshot(snapshot => { siteData.activities =[]; snapshot.forEach(doc => siteData.activities.push({ id: doc.id, ...doc.data() })); renderActivities(); });
    db.collection("gallery").orderBy("timestamp", "desc").limit(8).onSnapshot(snapshot => { siteData.gallery =[]; snapshot.forEach(doc => siteData.gallery.push({ id: doc.id, ...doc.data() })); renderGallery(); });
    db.collection("notifications").orderBy("timestamp", "desc").limit(5).onSnapshot(snapshot => { siteData.notifications =[]; snapshot.forEach(doc => siteData.notifications.push({ id: doc.id, ...doc.data() })); renderNotifications(); });
}

function renderActivities() {
    const container = document.getElementById('activities-container'); let html = '';
    siteData.activities.forEach(act => { const title = currentLang === 'ar' ? (act.titleAr || act.title) : (act.titleSv || act.title); const desc = currentLang === 'ar' ? (act.descAr || act.desc) : (act.descSv || act.desc); html += `<div class="activity-card"><img src="${act.img}" loading="lazy" class="activity-img"><div class="activity-content"><h3 class="activity-title">${title}</h3><p class="activity-desc">${desc}</p></div></div>`; }); container.innerHTML = html;
}

function renderGallery() { 
    const container = document.getElementById('gallery-container'); let html = ''; 
    siteData.gallery.forEach(img => { html += `<div class="gallery-item" onclick="openLightbox('${img.url}')"><img src="${img.url}" loading="lazy"></div>`; }); 
    container.innerHTML = html; 
}

function renderNotifications() {
    const adminContainer = document.getElementById('admin-notifs'); let allNotifs =[]; siteData.notifications.forEach(n => { allNotifs.push({ text: currentLang === 'ar' ? n.ar : n.sv, time: n.timestamp, icon: 'fa-envelope' }); });
    if(allNotifs.length === 0) return; let html = ''; allNotifs.forEach(n => { const date = new Date(n.time).toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'sv-SE'); html += `<div class="notif-item"><i class="fas ${n.icon}" style="margin-top:4px; color: var(--primary);"></i><div><div style="font-size:0.85rem; font-weight:600;">${n.text}</div><div style="font-size:0.7rem; color:#888; margin-top:2px;">${date}</div></div></div>`; });
    adminContainer.innerHTML = html; document.getElementById('notif-dot').classList.add('active');
}

const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }); }, { threshold: 0.1 });

/* =========================================
   TV Display Mode Logic (منطق شاشة العرض)
   ========================================= */

async function fetchTvWeather() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=56.1389&longitude=13.3881&current_weather=true');
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        document.getElementById('tv-weather-display').innerHTML = `<i class="fas fa-cloud-sun" style="color:#d4af37;"></i> ${temp}°C`;
    } catch (e) {
        document.getElementById('tv-weather-display').innerHTML = '';
    }
}

function enterTvMode() {
    document.getElementById('tv-mode-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderTvPrayers();
    setupTvClockFace();
    fetchTvWeather(); 

    let elem = document.documentElement;
    if (elem.requestFullscreen) { elem.requestFullscreen(); }
    else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); }
    else if (elem.msRequestFullscreen) { elem.msRequestFullscreen(); }
}

function exitTvMode() {
    document.getElementById('tv-mode-overlay').classList.remove('active');
    document.body.style.overflow = '';

    if (document.exitFullscreen) { document.exitFullscreen(); }
    else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
    else if (document.msExitFullscreen) { document.msExitFullscreen(); }
}

function renderTvPrayers() {
    const container = document.getElementById('tv-prayers-container');
    const t = langData['ar']; 
    let html = '';

    prayerTimes.forEach(p => {
        let isActive = document.getElementById(`card-${p.id}`) && document.getElementById(`card-${p.id}`).classList.contains('next-prayer') ? 'active' : '';

        let iqamaText = p.type === 'no-prayer' ? `${t.pLabels.noP}` : `إقامة ${p.iqama}`;
        let timeText = p.type === 'no-prayer' ? p.time : p.adhan;

        html += `
        <div class="tv-prayer-row ${isActive}" id="tv-row-${p.id}">
            <i class="fas ${p.icon} tv-prayer-icon"></i>
            <div class="tv-prayer-details">
                <div class="tv-prayer-name">${t.prayerNames[p.id]}</div>
                <div class="tv-prayer-time">${timeText}</div>
                <div class="tv-prayer-iqama">${iqamaText}</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function setupTvClockFace() {
    const face = document.getElementById('tv-clock-face');
    document.querySelectorAll('.tv-clock-number, .tv-tick-container').forEach(e => e.remove());

    const arabicNumbers =['١٢', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', '١١'];

    for (let i = 0; i < 60; i++) {
        const tickContainer = document.createElement('div');
        tickContainer.className = 'tv-tick-container';
        tickContainer.style.position = 'absolute';
        tickContainer.style.width = i % 5 === 0 ? '4px' : '2px';
        tickContainer.style.height = '100%'; 
        tickContainer.style.left = `calc(50% - ${i % 5 === 0 ? '2px' : '1px'})`;
        tickContainer.style.top = '0';
        tickContainer.style.transform = `rotate(${i * 6}deg)`;

        const tickMark = document.createElement('div');
        tickMark.style.width = '100%';
        tickMark.style.height = i % 5 === 0 ? '16px' : '8px';
        tickMark.style.background = i % 5 === 0 ? '#fff' : 'rgba(255,255,255,0.5)';
        tickMark.style.marginTop = '6px'; 
        tickMark.style.borderRadius = '2px';

        tickContainer.appendChild(tickMark);
        face.appendChild(tickContainer);
    }

    for (let i = 0; i < 12; i++) {
        const num = document.createElement('div');
        num.className = 'tv-clock-number';
        num.innerText = arabicNumbers[i];
        let angle = (i * 30) * (Math.PI / 180);
        let radius = 38; 
        let x = 50 + radius * Math.sin(angle);
        let y = 50 - radius * Math.cos(angle);
        num.style.left = `${x}%`;
        num.style.top = `${y}%`;
        face.appendChild(num);
    }
}

setInterval(() => {
    if (document.getElementById('tv-mode-overlay').classList.contains('active')) {
        fetchTvWeather();
    }
}, 3600000);

setInterval(() => {
    if (!document.getElementById('tv-mode-overlay').classList.contains('active')) return;

    const now = new Date();

    document.getElementById('tv-second-hand').style.transform = `rotate(${((now.getSeconds() / 60) * 360)}deg)`;
    document.getElementById('tv-minute-hand').style.transform = `rotate(${((now.getMinutes() / 60) * 360) + ((now.getSeconds()/60)*6)}deg)`;
    document.getElementById('tv-hour-hand').style.transform = `rotate(${((now.getHours() / 12) * 360) + ((now.getMinutes()/60)*30)}deg)`;

    const timeZone = 'Europe/Stockholm';
    const gregDate = now.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timeZone });
    let hijriDate = "";
    try {
        hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric', timeZone: timeZone }).format(now);
    } catch(e) {}
    document.getElementById('tv-date-display').innerText = `${gregDate} | ${hijriDate}`;

    const t = langData['ar'];
    let target = null; let title = "";
    for (let p of prayerTimes.filter(p => p.type !== 'no-prayer')) {
        let aDate = new Date(); aDate.setHours(...p.adhan.split(':'), 0, 0); 
        let iDate = new Date(); iDate.setHours(...p.iqama.split(':'), 0, 0);
        if (now < aDate) { target = aDate; title = `${t.timerTexts.adhan} ${t.prayerNames[p.id]}`; break; } 
        else if (now < iDate) { target = iDate; title = `${t.timerTexts.iqama} ${t.prayerNames[p.id]}`; break; }
    }
    if (!target) { 
        let f = prayerTimes[0]; 
        target = new Date(); target.setDate(target.getDate() + 1); 
        target.setHours(...f.adhan.split(':'), 0, 0); 
        title = `${t.timerTexts.adhan} ${t.prayerNames[f.id]}`; 
    }
    let diff = target - now; 
    let h = Math.floor((diff % 86400000) / 3600000); 
    let m = Math.floor((diff % 3600000) / 60000); 
    let s = Math.floor((diff % 60000) / 1000);
    let timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    document.getElementById('tv-countdown-text').innerText = `${title} - ${timeString}`;

    renderTvPrayers(); 
}, 1000);

window.onload = () => { 
    createClockTicks(); updateAnalogClock(); loadTodaysPrayers(); applyTranslations(); listenToFirebase(); listenToStatistics();
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    checkAndRefreshFCMToken(); 
};