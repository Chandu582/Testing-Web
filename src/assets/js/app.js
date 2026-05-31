import { db } from "./db.js";

// State
let appSettings = {};
let activeRoutes = [];
let activeFleets = [];
let isHindi = false;

// UI Dictionary translations
const I18N = {
  en: {
    hero_subtitle: "Bihar & Jharkhand's Premium Cab Network",
    hero_title: "Elite <span>Taxi Service</span><br>For Comfort & Safety",
    hero_desc: "Experience top-tier travel with verified professional drivers. One-way drops, round trips, and local sightseeing across Bihar and Jharkhand with zero hidden charges.",
    stat_happy: "Happy Rides",
    stat_rating: "Google Rating",
    stat_drivers: "Clean Cars",
    stat_cities: "Hubs",
    btn_wa: "WhatsApp Booking",
    btn_fare: "Calculate Fare",
    badge_fleet: "100% Sanitized Fleet",
    badge_gps: "GPS Monitored Journeys",
    calc_title: "Instant Fare Estimator",
    calc_subtitle: "Select route & car type for transparent pricing",
    tab_oneway: "One Way Drop",
    tab_round: "Round Trip",
    lbl_pickup: "Pickup Location",
    lbl_drop: "Drop Destination",
    lbl_date: "Pickup Date",
    lbl_time: "Pickup Time",
    lbl_car: "Select Car Fleet Category",
    fare_lbl: "Book via WhatsApp",
    fare_note: "Select your route and send a WhatsApp message. Owner will reply with fare and confirm booking!",
    btn_confirm: "Send Booking on WhatsApp",
    fleet_subtitle: "Luxurious Fleets",
    fleet_title: "Our Premium Ride Options",
    route_subtitle: "Dynamic Rate Chart",
    route_title: "Popular Routes & Fixed Fares",
    route_note: "*If your required destination is not listed above, please use the Fare Estimator or contact host directly for special package pricing.",
    review_subtitle: "Client Endorsements",
    review_title: "Verified Customer Experiences",
    footer_desc: "Book Online Taxi Service is your elite transit network connecting major cities across Bihar and Jharkhand. Premium quality, transparent rates, 24/7 service.",
    footer_links: "Site Links",
    footer_reach: "Reach Us",
    btn_book: "Book",
    fixed_drop_rate: "Fixed Drop Rate"
  },
  hi: {
    hero_subtitle: "बिहार और झारखंड का प्रीमियम कैब नेटवर्क",
    hero_title: "आरामदायक और सुरक्षित<br><span>प्रीमियम टैक्सी</span> सर्विस",
    hero_desc: "सत्यापित पेशेवर ड्राइवरों के साथ यात्रा का अनुभव लें। शून्य छिपे हुए शुल्कों के साथ पूरे बिहार और झारखंड में वन-वे, राउंड ट्रिप और लोकल साइटसीइंग उपलब्ध।",
    stat_happy: "सफल यात्रा",
    stat_rating: "गूगल रेटिंग",
    stat_drivers: "साफ गाड़ियां",
    stat_cities: "मुख्य केंद्र",
    btn_wa: "व्हाट्सएप बुकिंग",
    btn_fare: "किराया चेक करें",
    badge_fleet: "100% सैनिटाइज्ड कारें",
    badge_gps: "GPS मॉनिटर यात्राएं",
    calc_title: "तुरंत किराया कैलकुलेटर",
    calc_subtitle: "पारदर्शी कीमतों के लिए मार्ग और कार का चयन करें",
    tab_oneway: "वन-वे ड्रॉप",
    tab_round: "राउंड ट्रिप",
    lbl_pickup: "पिकअप स्थान",
    lbl_drop: "ड्रॉप मंजिल",
    lbl_date: "पिकअप तारीख",
    lbl_time: "पिकअप का समय",
    lbl_car: "गाड़ी की श्रेणी चुनें",
    fare_lbl: "WhatsApp पे बुक करें",
    fare_note: "अपना रूट सेलेक्ट करें और WhatsApp पे मैसेज भेजें। Owner आपको किराया बताएंगे और बुकिंग कन्फर्म करेंगे!",
    btn_confirm: "WhatsApp पर बुकिंग भेजें",
    fleet_subtitle: "शानदार कारें",
    fleet_title: "हमारे प्रीमियम गाड़ियां",
    route_subtitle: "किराया सूची पत्र",
    route_title: "लोकप्रिय मार्ग एवं निश्चित किराया",
    route_note: "*यदि आपकी वांछित यात्रा सूची में नहीं है, तो कृपया किराया कैलकुलेटर का उपयोग करें या विशेष पैकेज के लिए सीधे होस्ट से संपर्क करें।",
    review_subtitle: "ग्राहकों की राय",
    review_title: "हमारे सम्मानित यात्रियों की समीक्षाएं",
    footer_desc: "बुक ऑनलाइन टैक्सी सर्विस (BookOTS) बिहार और झारखंड के प्रमुख शहरों को जोड़ने वाला एक प्रीमियम यात्रा नेटवर्क है। बेहतरीन गाड़ियां, पारदर्शी दरें, 24/7 सेवा।",
    footer_links: "लिंक्स",
    footer_reach: "संपर्क करें",
    btn_book: "बुक करें",
    fixed_drop_rate: "फिक्स्ड ड्रॉप रेट"
  }
};

// Preloaded review resources
const REVIEWERS = [
  { name: "Rahul Sharma", text: "Excellent ride from Patna to Muzaffarpur. The car was pristine, driver was very polite and punctual.", rating: 5 },
  { name: "Priya Singh", text: "Booked an Ertiga for family travel from Ranchi to Gaya. Highly recommended! Transparent rates and smooth service.", rating: 5 },
  { name: "Amit Kumar", text: "Best cab experience. Booked on WhatsApp in 2 minutes and cab arrived at my doorstep within 30 minutes.", rating: 5 },
  { name: "Vikash Prasad", text: "On time pickup. Clean Dzire. Highly professional driver partner who drove safely throughout the night.", rating: 5 },
  { name: "Neha Gupta", text: "Cheaper than other platforms, plus the customer care team followed up on GPS tracking continuously.", rating: 5 },
  { name: "Saurabh Mishra", text: "Clean AC and comfortable seats. Host Nitish Ji provided excellent coordination. Best in Jharkhand.", rating: 5 },
  { name: "Pooja Yadav", text: "Safe and secure for female solo travelers. GPS monitoring gave high peace of mind. Five stars!", rating: 5 },
  { name: "Rohit Dubey", text: "Very professional driver partner who assisted with heavy bags. Standard fixed rates, no hidden taxes.", rating: 5 }
];

document.addEventListener("DOMContentLoaded", async () => {
  await initPlatform();
  setupEventListeners();
});

async function initPlatform() {
  try {
    // 1. Fetch data from DB
    appSettings = await db.getSettings();
    activeRoutes = await db.getRoutes();
    activeFleets = await db.getFleets();
    
    // 2. Render branding specifications
    renderBranding();
    
    // 3. Render announcement ticker
    renderTicker();

    // 4. Render fleets dynamic showroom
    renderFleets();
    
    // 5. Render routes in grid
    renderRoutesGrid(activeRoutes);
    
    // 6. Setup pickup/drop autocompletes
    setupAutocompletes();
    
    // 7. Render reviews
    renderReviews();

    // 8. Trigger initial translation mapping
    translatePage();
    
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

function renderBranding() {
  document.getElementById("footerHostName").textContent = appSettings.hostName;
  document.getElementById("statHappyRides").textContent = appSettings.happyRides || "120k+";
  document.getElementById("statRating").innerHTML = `<i class="fas fa-star" style="font-size:16px;"></i> ${appSettings.googleRating || "4.8"}`;
  document.getElementById("statDrivers").textContent = appSettings.activeDrivers || "2100+";
  document.getElementById("statCities").textContent = appSettings.serviceableCities || "38+";
  
  const formattedPhone = appSettings.clientPhone;
  const waPhone = formattedPhone.startsWith("91") ? formattedPhone : "91" + formattedPhone;

  document.getElementById("navCallBtn").href = `tel:${formattedPhone}`;
  document.getElementById("heroWaBtn").href = `https://wa.me/${waPhone}?text=Hello%20BookOTS,%20I%20want%20to%20book%20a%20cab.`;
  
  const footerCall = document.getElementById("footerCallLink");
  footerCall.href = `tel:${formattedPhone}`;
  footerCall.textContent = formattedPhone;
  
  const footerWa = document.getElementById("footerWaLink");
  footerWa.href = `https://wa.me/${waPhone}`;
  footerWa.textContent = formattedPhone;
  
  document.getElementById("floatCall").href = `tel:${formattedPhone}`;
  document.getElementById("floatWa").href = `https://wa.me/${waPhone}?text=Hello%20BookOTS,%20I%20want%20to%20book%20a%20cab.`;
  
  document.getElementById("year").textContent = new Date().getFullYear();
}

function renderTicker() {
  const ticker = document.getElementById("announcementTicker");
  const host = appSettings.hostName;
  const phone = appSettings.clientPhone;

  ticker.innerHTML = `
    <span class="ticker-item"><i class="fas fa-taxi"></i> Book Online Taxi Service (BookOTS)</span>
    <span class="ticker-item"><i class="fas fa-user-tie"></i> Host Manager: <span>${host} (${phone})</span></span>
    <span class="ticker-item"><i class="fas fa-clock"></i> 24x7 Outstation & Local Drops</span>
    <span class="ticker-item"><i class="fas fa-shield-virus"></i> Sanitized Dzire, Baleno, Ertiga, Innova</span>
    <span class="ticker-item"><i class="fas fa-satellite"></i> GPS Enabled Safe Rides</span>
    <span class="ticker-item"><i class="fas fa-road"></i> Premium Travel Partner across Bihar & Jharkhand</span>
  `;
}

// Render dynamic showroom fleets (prevents image-stretching or cropping)
function renderFleets() {
  const container = document.getElementById("fleetsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (activeFleets.length === 0) {
    container.innerHTML = `
      <div style="grid-column: span 4; text-align: center; padding: 40px; color: hsl(var(--color-text-gray));">
        ${isHindi ? 'वर्तमान में कोई डायनामिक कार उपलब्ध नहीं है।' : 'No dynamic fleets currently registered.'}
      </div>
    `;
    return;
  }

  const formattedPhone = appSettings.clientPhone;
  const waPhone = formattedPhone.startsWith("91") ? formattedPhone : "91" + formattedPhone;

  activeFleets.forEach(fleet => {
    const card = document.createElement("div");
    card.className = "glass-card fleet-card";
    card.style.cssText = `
      padding: 24px;
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      border: 1px solid rgba(255, 255, 255, 0.05);
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(9, 13, 22, 0.8) 100%);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
      transition: var(--transition-smooth);
      position: relative;
      overflow: hidden;
    `;
    
    // Set dynamic variables based on current language
    const acLabel = isHindi ? "एयर कंडीशनर" : "Air Conditioner";
    const acCabinVal = (fleet.ac === 'Yes' || fleet.ac === 'yes') 
      ? (isHindi ? "एसी केबिन" : "AC Cabin") 
      : (isHindi ? "नॉन-एसी" : "Standard");
    const acBadgeText = (fleet.ac === 'Yes' || fleet.ac === 'yes') 
      ? (isHindi ? "एसी" : "AC") 
      : (isHindi ? "नॉन-एसी" : "Non-AC");
      
    const seatingLabel = isHindi ? "सीटें" : "Seating";
    const seatsVal = isHindi ? `${fleet.seats} सीटर` : `${fleet.seats} Seater`;
    
    const luggageLabel = isHindi ? "सामान" : "Luggage";
    const bagsVal = isHindi ? `${fleet.bags} बैग` : `${fleet.bags} Bags`;
    
    const specialtyLabel = isHindi ? "विशेषता" : "Specialty";
    const bookBtnText = isHindi ? `बुक करें ${fleet.name}` : `Book ${fleet.name}`;

    const waText = encodeURIComponent(`Hello BookOTS! I am interested in booking the premium fleet car: *${fleet.name}* (${fleet.category}).\n\nFeatures:\n- AC: ${fleet.ac}\n- Seats: ${fleet.seats} Seater\n- Bags: ${fleet.bags} Bags\n- Special: ${fleet.feature}\n\nPlease let me know the availability and booking process.`);
    const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

    // Premium layouts: Contain fitting images with dynamic borders and shadow effects
    card.innerHTML = `
      <div class="fleet-image-wrap" style="position: relative; height: 160px; width: 100%; background: radial-gradient(circle, rgba(234, 179, 8, 0.05) 0%, rgba(255,255,255,0.01) 70%); border-radius: 20px; display: flex; justify-content: center; align-items: center; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03); overflow: hidden;">
        <img src="${fleet.image}" alt="${fleet.name}" class="fleet-img" style="max-width: 90%; max-height: 90%; object-fit: contain; filter: drop-shadow(0 15px 15px rgba(0,0,0,0.6)); transition: var(--transition-smooth);">
        <span style="position: absolute; top: 12px; right: 12px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 30px; font-size: 10px; font-weight: 700; color: hsl(var(--color-gold-base)); text-transform: uppercase; letter-spacing: 0.05em;">
          ${acBadgeText}
        </span>
      </div>
      
      <div style="text-align: left; margin-bottom: 20px;">
        <h3 style="font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 4px; font-family: var(--font-display);">${fleet.name}</h3>
        <p style="color: hsl(var(--color-gold-base)); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; font-family: var(--font-display);">${fleet.category}</p>
      </div>

      <div class="fleet-specs-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px;">
        <div class="spec-box" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
          <i class="fas fa-snowflake" style="color: hsl(var(--color-gold-base)); font-size: 14px;"></i>
          <span style="font-size: 10px; color: hsl(var(--color-text-gray)); text-transform: uppercase; font-weight: 600;">${acLabel}</span>
          <span style="font-size: 12px; font-weight: 700; color: #fff;">${acCabinVal}</span>
        </div>
        
        <div class="spec-box" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
          <i class="fas fa-couch" style="color: hsl(var(--color-gold-base)); font-size: 14px;"></i>
          <span style="font-size: 10px; color: hsl(var(--color-text-gray)); text-transform: uppercase; font-weight: 600;">${seatingLabel}</span>
          <span style="font-size: 12px; font-weight: 700; color: #fff;">${seatsVal}</span>
        </div>

        <div class="spec-box" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
          <i class="fas fa-suitcase" style="color: hsl(var(--color-gold-base)); font-size: 14px;"></i>
          <span style="font-size: 10px; color: hsl(var(--color-text-gray)); text-transform: uppercase; font-weight: 600;">${luggageLabel}</span>
          <span style="font-size: 12px; font-weight: 700; color: #fff;">${bagsVal}</span>
        </div>

        <div class="spec-box" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
          <i class="fas fa-shield-halved" style="color: hsl(var(--color-gold-base)); font-size: 14px;"></i>
          <span style="font-size: 10px; color: hsl(var(--color-text-gray)); text-transform: uppercase; font-weight: 600;">${specialtyLabel}</span>
          <span style="font-size: 12px; font-weight: 700; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 100%;" title="${fleet.feature}">${fleet.feature}</span>
        </div>
      </div>

      <a href="${waUrl}" target="_blank" class="btn-premium btn-wa" style="width: 100%; justify-content: center; padding: 14px; border-radius: 16px; font-family: var(--font-display); font-size: 14px; font-weight: 700; margin-top: auto;">
        <i class="fab fa-whatsapp"></i> ${bookBtnText}
      </a>
    `;
    container.appendChild(card);
  });
}

function renderRoutesGrid(routes) {
  const container = document.getElementById("routesContainer");
  if (!container) return;
  container.innerHTML = "";

  if (routes.length === 0) {
    container.innerHTML = `
      <div style="grid-column: span 3; text-align: center; padding: 40px; color: hsl(var(--color-text-gray));">
        <i class="fas fa-folder-open" style="font-size: 40px; margin-bottom: 12px; display:block;"></i>
        No routes available at the moment.
      </div>
    `;
    return;
  }

  const formattedPhone = appSettings.clientPhone;
  const waPhone = formattedPhone.startsWith("91") ? formattedPhone : "91" + formattedPhone;
  const currentLang = isHindi ? "hi" : "en";
  const askFareText = isHindi ? "किराया पूछें" : "Ask Fare";
  const contactOwnerLabel = isHindi ? "Owner से किराया पूछें" : "Contact Owner for Fare";

  routes.forEach(route => {
    const waText = encodeURIComponent(`Hello BookOTS! I want to book a cab from *${route.from}* to *${route.to}* (${route.type}).\n\nPlease tell me the fare and confirm availability. 🙏`);
    const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

    const card = document.createElement("div");
    card.className = "glass-card route-card";
    card.innerHTML = `
      <div class="route-header">
        <div class="route-point">
          <span class="dot-green"></span>
          <span>${route.from}</span>
        </div>
        <div class="route-line"></div>
        <div class="route-point">
          <span class="dot-red"></span>
          <span>${route.to}</span>
        </div>
      </div>
      <div class="route-footer">
        <div>
          <div class="route-price-label">${contactOwnerLabel}</div>
        </div>
        <a href="${waUrl}" target="_blank" class="btn-premium" style="padding: 8px 18px; font-size:12px;">
          <span>${askFareText}</span>
          <i class="fab fa-whatsapp" style="margin-left: 4px;"></i>
        </a>
      </div>
    `;
    container.appendChild(card);
  });
}

function setupAutocompletes() {
  const pickups = new Set();
  const drops = new Set();
  
  activeRoutes.forEach(r => {
    pickups.add(r.from);
    drops.add(r.to);
  });

  const pickupDL = document.getElementById("pickupSuggestions");
  if (pickupDL) {
    pickupDL.innerHTML = "";
    pickups.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      pickupDL.appendChild(opt);
    });
  }

  const dropDL = document.getElementById("dropSuggestions");
  if (dropDL) {
    dropDL.innerHTML = "";
    drops.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d;
      dropDL.appendChild(opt);
    });
  }
}

function renderReviews() {
  const container = document.getElementById("reviewsContainer");
  const dotsContainer = document.getElementById("sliderDots");
  if (!container || !dotsContainer) return;
  
  container.innerHTML = "";
  dotsContainer.innerHTML = "";

  REVIEWERS.forEach((rev, idx) => {
    // Review Card
    const card = document.createElement("div");
    card.className = "glass-card review-card";
    
    let stars = "";
    for (let i = 0; i < rev.rating; i++) {
      stars += `<i class="fas fa-star" style="margin-right:2px;"></i>`;
    }

    card.innerHTML = `
      <div class="reviewer-meta">
        <div class="reviewer-avatar">${rev.name.charAt(0)}</div>
        <div>
          <div class="reviewer-name">${rev.name}</div>
          <div class="reviewer-rating">${stars}</div>
        </div>
      </div>
      <p class="review-text">"${rev.text}"</p>
      <div style="margin-top:15px; color:#10b981; font-size:11px; font-weight:600; display:flex; align-items:center; gap:5px;">
        <i class="fas fa-circle-check"></i> Verified Rider
      </div>
    `;
    container.appendChild(card);

    // Indicator dots
    const dot = document.createElement("div");
    dot.className = `dot ${idx === 0 ? 'active' : ''}`;
    dot.addEventListener("click", () => slideTo(idx));
    dotsContainer.appendChild(dot);
  });

  // Basic Auto Scroll
  let currentSlide = 0;
  setInterval(() => {
    currentSlide = (currentSlide + 1) % REVIEWERS.length;
    slideTo(currentSlide);
  }, 5000);
}

function slideTo(idx) {
  const container = document.getElementById("reviewsContainer");
  const dots = document.querySelectorAll("#sliderDots .dot");
  
  if (!container || container.children.length === 0) return;
  
  const cardWidth = container.children[0].offsetWidth + 24; // Width + gap
  container.scrollTo({
    left: cardWidth * idx,
    behavior: "smooth"
  });

  dots.forEach((dot, i) => {
    if (i === idx) dot.classList.add("active");
    else dot.classList.remove("active");
  });
}

// Highly reliable JS key-based translation mapping
function translatePage() {
  // Toggle the global body class so static CSS language rules are applied instantly
  if (isHindi) {
    document.body.classList.add("hindi-active");
  } else {
    document.body.classList.remove("hindi-active");
  }

  const langKey = isHindi ? "hi" : "en";
  const dictionary = I18N[langKey];

  document.querySelectorAll("[data-translate]").forEach(el => {
    const key = el.getAttribute("data-translate");
    if (dictionary[key]) {
      el.innerHTML = dictionary[key];
    }
  });

  // Handle placeholders dynamically
  const routeSearch = document.getElementById("routeSearch");
  if (routeSearch) {
    routeSearch.placeholder = isHindi ? "शहर खोजें (जैसे. पटना, रांची, गया)..." : "Type city (e.g. Patna, Ranchi, Gaya)...";
  }

  const pickupInput = document.getElementById("pickupInput");
  if (pickupInput) {
    pickupInput.placeholder = isHindi ? "जैसे. पटना, रांची..." : "e.g. Patna, Ranchi...";
  }

  const dropInput = document.getElementById("dropInput");
  if (dropInput) {
    dropInput.placeholder = isHindi ? "जैसे. दरभंगा, हज़ारीबाग..." : "e.g. Darbhanga, Hazaribagh...";
  }

  // Rerender grids with selected language
  renderRoutesGrid(activeRoutes);
  renderFleets();
}

function setupEventListeners() {
  // 1. Language Toggle
  const langBtn = document.getElementById("langToggle");
  const langText = document.getElementById("langText");

  if (langBtn) {
    langBtn.addEventListener("click", () => {
      isHindi = !isHindi;
      if (isHindi) {
        langText.textContent = "English";
      } else {
        langText.textContent = "हिंदी";
      }
      translatePage();
    });
  }

  // 2. Navbar shrink effect on scroll
  const navbar = document.getElementById("navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 40) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
  }

  // 3. Search filter for routes
  const routeSearch = document.getElementById("routeSearch");
  if (routeSearch) {
    routeSearch.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = activeRoutes.filter(r => 
        r.from.toLowerCase().includes(q) || 
        r.to.toLowerCase().includes(q)
      );
      renderRoutesGrid(filtered);
    });
  }

  // 4. Booking Form Inputs
  const pickupInput = document.getElementById("pickupInput");
  const dropInput = document.getElementById("dropInput");
  const carCategory = document.getElementById("carCategory");
  const tripTabs = document.querySelectorAll("#tripTypeTabs .booking-tab");
  
  let currentTripType = "One Way";

  tripTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tripTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentTripType = tab.getAttribute("data-type");
    });
  });

  // 5. Booking Form Submission
  const bookingForm = document.getElementById("bookingCalculator");
  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const pickup = pickupInput.value;
      const drop = dropInput.value;
      const date = document.getElementById("pickupDate").value;
      const time = document.getElementById("pickupTime").value;
      const car = carCategory.options[carCategory.selectedIndex].text;

      // Build booking request payload for DB (no fare - owner will decide)
      const bookingPayload = {
        pickup,
        drop,
        date,
        time,
        car,
        fare: "Owner se confirm hoga",
        tripType: currentTripType,
        status: "Pending"
      };

      // Save booking request in database
      await db.saveBooking(bookingPayload);

      // Trigger WhatsApp Redirection
      const formattedPhone = appSettings.clientPhone;
      const waPhone = formattedPhone.startsWith("91") ? formattedPhone : "91" + formattedPhone;

      let msg = `*🚕 NEW TAXI BOOKING REQUEST (BookOTS)*\n\n`;
      msg += `📍 *Pickup City:* ${pickup}\n`;
      msg += `🚩 *Drop Destination:* ${drop}\n`;
      msg += `📅 *Date:* ${date}\n`;
      msg += `⏰ *Time:* ${time}\n`;
      msg += `🚗 *Car Class:* ${car}\n`;
      msg += `🔄 *Trip Type:* ${currentTripType}\n\n`;
      msg += `🙏 *Kripya is trip ka fare bataiye aur booking confirm kariye!*`;

      const encoded = encodeURIComponent(msg);
      const waUrl = `https://wa.me/${waPhone}?text=${encoded}`;
      
      // Redirect to WhatsApp (opens WhatsApp app on phone, WhatsApp Web on desktop)
      window.open(waUrl, "_blank");
    });
  }
}



