/**
 * BookOTS Database Driver
 * Supports LocalStorage (standalone/offline demo) and Firebase Firestore (production)
 * Developed by Xevion Byte (https://xevion-byte.vercel.app / 9693776982)
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBTvHJ70ZoubdbCgZjBdhG-qQKlMU64ycw",
  authDomain: "bookots.firebaseapp.com",
  projectId: "bookots",
  storageBucket: "bookots.firebasestorage.app",
  messagingSenderId: "890026849010",
  appId: "1:890026849010:web:b1490b5d5965dd4969d66b"
};

// Default preloaded routes (merged Patna and Ranchi route lists)
const DEFAULT_ROUTES = [
  { id: "r1", from: "Muzaffarpur", to: "Patna", price: "1590", type: "One Way" },
  { id: "r2", from: "Muzaffarpur", to: "Darbhanga", price: "1590", type: "One Way" },
  { id: "r3", from: "Muzaffarpur", to: "Motihari", price: "1690", type: "One Way" },
  { id: "r4", from: "Muzaffarpur", to: "Sitamarhi", price: "1690", type: "One Way" },
  { id: "r5", from: "Patna", to: "Darbhanga", price: "2790", type: "One Way" },
  { id: "r6", from: "Patna", to: "Sitamarhi", price: "2790", type: "One Way" },
  { id: "r7", from: "Patna", to: "Motihari", price: "2790", type: "One Way" },
  { id: "r8", from: "Patna", to: "Siwan", price: "2490", type: "One Way" },
  { id: "r9", from: "Patna", to: "Gaya", price: "2090", type: "One Way" },
  { id: "r10", from: "Patna", to: "Muzaffarpur", price: "1690", type: "One Way" },
  { id: "r11", from: "Patna", to: "Delhi", price: "19990", type: "One Way" },
  { id: "r12", from: "Patna", to: "Banaras", price: "5000", type: "One Way" },
  { id: "r13", from: "Patna", to: "Raxaul", price: "5500", type: "One Way" },
  { id: "r14", from: "Patna", to: "Aurangabad", price: "3000", type: "One Way" },
  { id: "r15", from: "Patna", to: "Gorakhpur", price: "4500", type: "One Way" },
  { id: "r16", from: "Darbhanga", to: "Samastipur", price: "1790", type: "One Way" },
  { id: "r17", from: "Darbhanga", to: "Sitamarhi", price: "1790", type: "One Way" },
  { id: "r18", from: "Darbhanga", to: "Madhubani", price: "1490", type: "One Way" },
  { id: "r19", from: "Darbhanga", to: "Patna", price: "2790", type: "One Way" },
  { id: "r20", from: "Motihari", to: "Patna", price: "3000", type: "One Way" },
  { id: "r21", from: "Katihar", to: "Muzaffarpur", price: "6000", type: "One Way" },
  { id: "r22", from: "Ranchi", to: "Jamshedpur", price: "2000", type: "One Way" },
  { id: "r23", from: "Hazaribagh", to: "Ranchi / Hatia", price: "1700", type: "One Way" },
  { id: "r24", from: "Ranchi", to: "Hazaribagh", price: "1700", type: "One Way" },
  { id: "r25", from: "Ranchi", to: "Bokaro", price: "2500", type: "One Way" },
  { id: "r26", from: "Ranchi", to: "Gaya", price: "4800", type: "One Way" },
  { id: "r27", from: "Hazaribagh", to: "Patna", price: "4500", type: "One Way" },
  { id: "r28", from: "Hazaribagh", to: "Kolkata", price: "9000", type: "One Way" },
  { id: "r29", from: "Ranchi", to: "Patna", price: "7000", type: "One Way" }
];

// Default preloaded fleets
const DEFAULT_FLEETS = [
  { id: "f1", name: "Swift Dzire", category: "Comfort Sedan", ac: "Yes", seats: "4", bags: "2", feature: "Dual Airbags", image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400" },
  { id: "f2", name: "Baleno Premium", category: "Premium Hatchback", ac: "Yes", seats: "4", bags: "2", feature: "GPS Enabled", image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=400" },
  { id: "f3", name: "Maruti Ertiga", category: "Family MUV", ac: "Yes", seats: "6", bags: "4", feature: "Best Value", image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=400" },
  { id: "f4", name: "Innova Crysta", category: "Executive SUV", ac: "Yes", seats: "7", bags: "5", feature: "Captain Seats", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400" }
];

// Default configurations
const DEFAULT_SETTINGS = {
  hostName: "Nitish Ji",
  clientPhone: "7352121002",
  googleRating: "4.9",
  happyRides: "150k+",
  activeDrivers: "2500+",
  serviceableCities: "45+",
  useFirebase: true // Attempt firebase by default as user provided valid config
};

class DBManager {
  constructor() {
    this.firebaseApp = null;
    this.firestore = null;
    this.firebaseLoaded = false;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._initialize();
    return this.initPromise;
  }

  async _initialize() {
    const settings = this.getLocalSettings();
    const useFirebase = settings.useFirebase !== undefined ? settings.useFirebase : DEFAULT_SETTINGS.useFirebase;

    if (!useFirebase) {
      console.log("[DBManager] Using LocalStorage mode (Firebase disabled in settings).");
      return;
    }

    try {
      // Dynamic import of Firebase SDKs from official ESM CDN
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js");
      const { getFirestore, collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js");
      
      this.firebaseApp = initializeApp(FIREBASE_CONFIG);
      this.firestore = getFirestore(this.firebaseApp);
      this.firebaseLoaded = true;
      this.sdk = { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc };
      console.log("[DBManager] Firebase Firestore successfully initialized!");
    } catch (error) {
      console.warn("[DBManager] Failed to load Firebase. Falling back to LocalStorage.", error);
      this.firebaseLoaded = false;
    }
  }

  async seedDefaultsIfEmpty() {
    await this.init();
    if (!this.firebaseLoaded) {
      console.warn("[DBManager] Cannot seed: Firebase Firestore is not loaded/active.");
      return;
    }
    
    try {
      const { collection, getDocs, doc, setDoc } = this.sdk;
      
      // 1. Seed branding settings if empty
      const settingsRef = collection(this.firestore, "settings");
      const settingsSnap = await getDocs(settingsRef);
      if (settingsSnap.empty) {
        console.log("[DBManager] Firebase settings collection is empty. Auto-seeding defaults...");
        for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
          await setDoc(doc(this.firestore, "settings", key), { value: val });
        }
        console.log("[DBManager] Settings seeding complete!");
      }

      // 2. Seed outstation routes if empty
      const routesRef = collection(this.firestore, "routes");
      const routesSnap = await getDocs(routesRef);
      if (routesSnap.empty) {
        console.log("[DBManager] Firebase routes collection is empty. Auto-seeding defaults...");
        for (const route of DEFAULT_ROUTES) {
          await setDoc(doc(this.firestore, "routes", route.id), {
            from: route.from,
            to: route.to,
            price: route.price,
            type: route.type
          });
        }
        console.log("[DBManager] Routes seeding complete!");
      }

      // 3. Seed showroom fleets if empty
      const fleetsRef = collection(this.firestore, "fleets");
      const fleetsSnap = await getDocs(fleetsRef);
      if (fleetsSnap.empty) {
        console.log("[DBManager] Firebase fleets collection is empty. Auto-seeding defaults...");
        for (const fleet of DEFAULT_FLEETS) {
          await setDoc(doc(this.firestore, "fleets", fleet.id), {
            name: fleet.name,
            category: fleet.category,
            ac: fleet.ac,
            seats: fleet.seats,
            bags: fleet.bags,
            feature: fleet.feature,
            image: fleet.image
          });
        }
        console.log("[DBManager] Fleets seeding complete!");
      }

    } catch (e) {
      console.error("[DBManager] Exception raised during Firestore auto-seeding engine run:", e);
    }
  }

  // Helper to read local settings
  getLocalSettings() {
    const data = localStorage.getItem("ots_settings");
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  }

  // Set local settings
  saveLocalSettings(settings) {
    localStorage.setItem("ots_settings", JSON.stringify(settings));
  }

  // --- SETTINGS CRUD ---
  async getSettings() {
    await this.init();
    if (this.firebaseLoaded) {
      try {
        const { doc, getDocs, collection } = this.sdk;
        const ref = collection(this.firestore, "settings");
        const snapshot = await getDocs(ref);
        if (!snapshot.empty) {
          const settings = {};
          snapshot.forEach(doc => {
            settings[doc.id] = doc.data().value;
          });
          return { ...DEFAULT_SETTINGS, ...settings };
        }
      } catch (e) {
        console.error("Firestore settings fetch failed, using local settings", e);
      }
    }
    return this.getLocalSettings();
  }

  async saveSettings(settings) {
    await this.init();
    // Update LocalStorage first
    const local = { ...this.getLocalSettings(), ...settings };
    this.saveLocalSettings(local);

    if (this.firebaseLoaded) {
      try {
        const { doc, setDoc } = this.sdk;
        for (const [key, val] of Object.entries(settings)) {
          await setDoc(doc(this.firestore, "settings", key), { value: val });
        }
        
        // Synchronize administrative credentials to Firestore 'admins' (plural) collection in real-time
        const uid = sessionStorage.getItem("ots_admin_uid");
        if (uid && uid !== "local_admin_uid") {
          let email = "";
          try {
            const { getAuth } = await import("https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js");
            const auth = getAuth(this.firebaseApp);
            if (auth.currentUser) {
              email = auth.currentUser.email;
            }
          } catch (authErr) {
            console.warn("[DBManager] Failed to query current user's authenticated email from Firebase Auth:", authErr);
          }

          const adminUpdate = {
            updatedAt: Date.now()
          };
          if (email) adminUpdate.email = email;

          await setDoc(doc(this.firestore, "admins", uid), adminUpdate, { merge: true });
          console.log("[DBManager] Synchronized administrator settings to Firestore 'admins' collection.");
        }
      } catch (e) {
        console.error("Firestore settings save failed", e);
      }
    }
  }


  // --- ADMIN AUTH CREDENTIALS LOOKUP ---
  async verifyCredentials(email, password) {
    await this.init();
    if (this.firebaseLoaded) {
      // 1. Attempt Firebase Authentication (Email & Password sign-in)
      try {
        const { getAuth, signInWithEmailAndPassword, signOut } = await import("https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js");
        const auth = getAuth(this.firebaseApp);
        
        let user = null;
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
          console.log("[DBManager] Firebase Authentication successful! UID:", user.uid);
        } catch (authError) {
          console.error("[DBManager] Firebase Auth login failed:", authError.code);
          let errMsg = "Invalid Email or Password!";
          if (authError.code === "auth/wrong-password" || authError.code === "auth/invalid-credential") {
            errMsg = "Galat Password! (Incorrect Password)";
          } else if (authError.code === "auth/user-not-found") {
            errMsg = "Yeh Email ID registered nahi hai! (User Not Found)";
          } else if (authError.code === "auth/invalid-email") {
            errMsg = "Sahi Email ID bharein! (Invalid Email Format)";
          } else if (authError.code === "auth/network-request-failed") {
            errMsg = "Internet connection check karein! (Network Error)";
          }
          return { success: false, error: errMsg };
        }

        if (user) {
          const { doc, getDoc, setDoc } = this.sdk;
          const adminDocRef = doc(this.firestore, "admins", user.uid);
          let adminDocSnap = null;
          
          try {
            adminDocSnap = await getDoc(adminDocRef);
          } catch (snapError) {
            console.error("[DBManager] Failed to read admins collection from Firestore:", snapError);
            await signOut(auth);
            return { success: false, error: "Firestore Database read failed!" };
          }

          // Strict Security Check: Verify document exists and has admin/SuperAdmin role in Firestore collection
          if (adminDocSnap && adminDocSnap.exists()) {
            const adminData = adminDocSnap.data();
            if (adminData.role === "SuperAdmin" || adminData.role === "admin") {
              console.log("[DBManager] Admin authorized! Profile name:", adminData.Spectrum || adminData.Owner || "Admin");
              
              // Update last login timestamp
              await setDoc(adminDocRef, {
                lastLogin: Date.now(),
                email: email
              }, { merge: true });

              // Store authentication states in sessionStorage
              sessionStorage.setItem("ots_admin_uid", user.uid);
              sessionStorage.setItem("ots_admin_auth", "true");
              return { success: true };
            } else {
              console.warn("[DBManager] Access denied. User does not have administrative role permissions.");
              await signOut(auth);
              return { success: false, error: "Access Denied: Aapka account admin list me toh hai par SuperAdmin role nahi hai!" };
            }
          } else {
            console.warn("[DBManager] Access denied. User UID is not registered in Firestore admins collection.");
            await signOut(auth);
            return { success: false, error: "Access Denied: Aapka UID Firestore `admins` collection me registered nahi hai!" };
          }
        }
      } catch (err) {
        console.error("[DBManager] Firebase Authentication pipeline exception:", err);
        return { success: false, error: "Firebase Error: " + err.message };
      }
    }

    // 2. Fallback to LocalStorage settings / default credentials
    const settings = await this.getSettings();
    if (email === settings.adminEmail && password === settings.adminPasscode) {
      sessionStorage.setItem("ots_admin_auth", "true");
      sessionStorage.setItem("ots_admin_uid", "local_admin_uid");
      return { success: true };
    }
    return { success: false, error: "Galat Email ya Password! (Fallback LocalStorage Mode)" };
  }

  // --- ROUTES CRUD ---
  async getRoutes() {
    await this.init();
    if (this.firebaseLoaded) {
      try {
        const { collection, getDocs } = this.sdk;
        const ref = collection(this.firestore, "routes");
        const snapshot = await getDocs(ref);
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          return list;
        }
      } catch (e) {
        console.error("Firestore routes fetch failed, using local routes", e);
      }
    }

    // LocalStorage fallback
    const localData = localStorage.getItem("ots_routes");
    if (!localData) {
      localStorage.setItem("ots_routes", JSON.stringify(DEFAULT_ROUTES));
      return DEFAULT_ROUTES;
    }
    return JSON.parse(localData);
  }

  async saveRoute(route) {
    await this.init();
    if (this.firebaseLoaded) {
      try {
        const { collection, doc, setDoc, addDoc } = this.sdk;
        if (route.id) {
          const docId = route.id;
          const toSave = { ...route };
          delete toSave.id;
          await setDoc(doc(this.firestore, "routes", docId), toSave);
          return route;
        } else {
          const docRef = await addDoc(collection(this.firestore, "routes"), route);
          return { id: docRef.id, ...route };
        }
      } catch (e) {
        console.error("Firestore routes save failed", e);
      }
    }

    // LocalStorage logic
    const routes = await this.getRoutes();
    if (route.id) {
      const idx = routes.findIndex(r => r.id === route.id);
      if (idx !== -1) {
        routes[idx] = route;
      }
    } else {
      route.id = "r_" + Date.now();
      routes.push(route);
    }
    localStorage.setItem("ots_routes", JSON.stringify(routes));
    return route;
  }

  async deleteRoute(routeId) {
    await this.init();
    if (this.firebaseLoaded) {
      try {
        const { doc, deleteDoc } = this.sdk;
        await deleteDoc(doc(this.firestore, "routes", routeId));
      } catch (e) {
        console.error("Firestore route delete failed", e);
      }
    }

    const routes = await this.getRoutes();
    const filtered = routes.filter(r => r.id !== routeId);
    localStorage.setItem("ots_routes", JSON.stringify(filtered));
  }

  // --- FLEETS CRUD (DYNAMIC CAR FLEET) ---
  async getFleets() {
    await this.init();
    if (this.firebaseLoaded) {
      try {
        const { collection, getDocs } = this.sdk;
        const ref = collection(this.firestore, "fleets");
        const snapshot = await getDocs(ref);
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          return list;
        }
      } catch (e) {
        console.error("Firestore fleets fetch failed, using local fleets", e);
      }
    }

    // LocalStorage fallback
    const localData = localStorage.getItem("ots_fleets");
    if (!localData) {
      localStorage.setItem("ots_fleets", JSON.stringify(DEFAULT_FLEETS));
      return DEFAULT_FLEETS;
    }
    return JSON.parse(localData);
  }

  async saveFleet(fleet) {
    await this.init();
    if (this.firebaseLoaded) {
      try {
        const { collection, doc, setDoc, addDoc } = this.sdk;
        if (fleet.id) {
          const docId = fleet.id;
          const toSave = { ...fleet };
          delete toSave.id;
          await setDoc(doc(this.firestore, "fleets", docId), toSave);
          return fleet;
        } else {
          const docRef = await addDoc(collection(this.firestore, "fleets"), fleet);
          return { id: docRef.id, ...fleet };
        }
      } catch (e) {
        console.error("Firestore fleets save failed", e);
      }
    }

    const fleets = await this.getFleets();
    if (fleet.id) {
      const idx = fleets.findIndex(f => f.id === fleet.id);
      if (idx !== -1) {
        fleets[idx] = fleet;
      }
    } else {
      fleet.id = "f_" + Date.now();
      fleets.push(fleet);
    }
    localStorage.setItem("ots_fleets", JSON.stringify(fleets));
    return fleet;
  }

  async deleteFleet(fleetId) {
    await this.init();
    if (this.firebaseLoaded) {
      try {
        const { doc, deleteDoc } = this.sdk;
        await deleteDoc(doc(this.firestore, "fleets", fleetId));
      } catch (e) {
        console.error("Firestore fleet delete failed", e);
      }
    }

    const fleets = await this.getFleets();
    const filtered = fleets.filter(f => f.id !== fleetId);
    localStorage.setItem("ots_fleets", JSON.stringify(filtered));
  }

  // --- BOOKINGS CRUD ---
  async getBookings() {
    await this.init();
    if (this.firebaseLoaded) {
      try {
        const { collection, getDocs } = this.sdk;
        const ref = collection(this.firestore, "bookings");
        const snapshot = await getDocs(ref);
        const list = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        return list.sort((a,b) => b.timestamp - a.timestamp);
      } catch (e) {
        console.error("Firestore bookings fetch failed", e);
      }
    }

    const localData = localStorage.getItem("ots_bookings");
    const bookings = localData ? JSON.parse(localData) : [];
    return bookings.sort((a,b) => b.timestamp - a.timestamp);
  }

  async saveBooking(booking) {
    await this.init();
    const timestamp = Date.now();
    const newBooking = { ...booking, timestamp };

    if (this.firebaseLoaded) {
      try {
        const { collection, addDoc } = this.sdk;
        await addDoc(collection(this.firestore, "bookings"), newBooking);
      } catch (e) {
        console.error("Firestore booking save failed", e);
      }
    }

    // Always mirror to LocalStorage
    const bookings = await this.getBookings();
    newBooking.id = "b_" + timestamp;
    bookings.push(newBooking);
    localStorage.setItem("ots_bookings", JSON.stringify(bookings));
    return newBooking;
  }

  async deleteBooking(bookingId) {
    await this.init();
    if (this.firebaseLoaded) {
      try {
        const { doc, deleteDoc } = this.sdk;
        await deleteDoc(doc(this.firestore, "bookings", bookingId));
      } catch (e) {
        console.error("Firestore booking delete failed", e);
      }
    }

    const bookings = await this.getBookings();
    const filtered = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem("ots_bookings", JSON.stringify(filtered));
  }
}

export const db = new DBManager();
