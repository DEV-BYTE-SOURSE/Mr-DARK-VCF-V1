
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyC9yunW4riFuHqaX5CWgQSSGQZDzQ4nYjo",
    authDomain: "mr-dark-5d7da.firebaseapp.com",
    databaseURL: "https://mr-dark-5d7da-default-rtdb.firebaseio.com",
    projectId: "mr-dark-5d7da",
    storageBucket: "mr-dark-5d7da.firebasestorage.app",
    messagingSenderId: "175441718248",
    appId: "1:175441718248:web:a36b7015a013581178525d",
    measurementId: "G-172Q6T5623"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);


// DOM
const submitBtn = document.getElementById("submitBtn");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const successMsg = document.getElementById("success");
const currentElem = document.getElementById("current");
const remainingElem = document.getElementById("remaining");
const percentElem = document.getElementById("percent");
const progressFill = document.getElementById("progressFill");
const lockedBox = document.getElementById("locked");
const formCard = document.querySelector(".form-card");
const downloadBtn = document.getElementById("downloadVCF");
const channelBox = document.getElementById("channelBox");
const alreadySubmittedMsg = document.getElementById("alreadySubmitted");
const supportBtn = document.querySelector(".support-btn");

const statCurrent = document.getElementById("stat-current");
const statTarget = document.getElementById("stat-target");
const statRemaining = document.getElementById("stat-remaining");

const whatsappWebLink = "https://whatsapp.com/channel/0029Vb6XAv0GOj9lYT2p3l1X";

// Update support link (preserve)
supportBtn.href = "https://wa.link/li5xwd";

function openWhatsApp() {
  window.open(whatsappWebLink, "_blank");
}

// --- ROUND SYSTEM (kept but NOT used in counting) ---
const roundStartKey = "princev_roundStart";
const vcfCreatedForRoundKey = "princev_vcfCreatedForRound";

function getRoundStart() {
  const raw = localStorage.getItem(roundStartKey);
  return raw ? Number(raw) : Date.now();
}

// Voice greeting setup
let voicePlayed = false;
nameInput.addEventListener("focus", () => {
  if (!voicePlayed) {
    try {
      const audio = new Audio("https://audio-srwq.onrender.com/audio.mp3");
      audio.play();
    } catch (e) {}
    voicePlayed = true;
  }
}, { once: true });

// Update stats (GLOBAL count – FIXED)
async function updateStats() {
  try {
    const snapshot = await getDocs(collection(db, "contacts3"));

    const docs = [];
    snapshot.forEach(d => {
      const data = d.data();
      if (data) docs.push({ id: d.id, data });
    });

    const total = docs.length;

    currentElem.textContent = total;
    const remaining = Math.max(TARGET - total, 0);
    remainingElem.textContent = remaining;

    const percent = Math.min(Math.floor((total / TARGET) * 100), 100);
    percentElem.textContent = percent + "%";
    progressFill.style.width = percent + "%";

    const currentDeg = Math.round((total / Math.max(TARGET,1)) * 360);
    const remainingDeg = Math.max(0, 360 - currentDeg);

    statCurrent.style.setProperty("--pct", currentDeg);
    statTarget.style.setProperty("--pct", 360);
    statRemaining.style.setProperty("--pct", remainingDeg);

    document.getElementById("current").textContent = total;
    document.getElementById("target").textContent = TARGET;
    document.getElementById("remaining").textContent = remaining;

    if (total >= TARGET) {
      formCard.style.display = "none";
      lockedBox.classList.remove("hidden");
      channelBox.style.display = "block";

      const vcfFlag = localStorage.getItem(vcfCreatedForRoundKey);
      if (!vcfFlag) {
        await generateVCF(true);
        localStorage.setItem(vcfCreatedForRoundKey, String(getRoundStart()));
      } else {
        downloadBtn.style.display = "inline-block";
      }
    } else {
      formCard.style.display = "block";
      lockedBox.classList.add("hidden");
      const vcfFlag = localStorage.getItem(vcfCreatedForRoundKey);
      if (!vcfFlag) downloadBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Error updating stats:", err);
  }
}

// Submit contact
submitBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  if (!name || !phone) {
    alert("Please fill in both fields");
    return;
  }

  try {
    const q = query(collection(db, "contacts3"), where("phone", "==", phone));
    const snapshot = await getDocs(q);
    let already = false;

    snapshot.forEach(doc => {
      already = true;
    });

    if (already) {
      successMsg.textContent = "⚠️ This number is already registered!";
      successMsg.style.color = "red";
      successMsg.classList.remove("hidden");
      setTimeout(() => successMsg.classList.add("hidden"), 2500);
      return;
    }

    const prefixedName = "💨 " + name;
    await addDoc(collection(db, "contacts3"), { name: prefixedName, phone, time: Date.now() });

    successMsg.textContent = "💨 Contact submitted successfully!";
    successMsg.style.color = "#ffd700";
    successMsg.classList.remove("hidden");

    nameInput.value = "";
    phoneInput.value = "";

    setTimeout(() => {
      successMsg.classList.add("hidden");
      openWhatsApp();
    }, 1000);

    updateStats();
  }
});

// Generate VCF (GLOBAL – FIXED)
async function generateVCF(auto = false) {
  try {
    const snapshot = await getDocs(collection(db, "contacts3"));

    const docs = [];
    snapshot.forEach(d => docs.push(d.data()));

    if (docs.length === 0) return;

    let vcf = "";
    docs.forEach(data => {
      const fn = (data.name || "").toString().replace(/\r?\n/g, " ");
      const tel = (data.phone || "").toString().replace(/\r?\n/g, " ");
      vcf += `BEGIN:VCARD
VERSION:3.0
FN:${fn}
TEL:${tel}
END:VCARD
`;
    });

    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Prince_VCF_v3.vcf";

    downloadBtn.style.display = "inline-block";

    if (auto) {
      setTimeout(() => {
        try { a.click(); } catch (e) {}
      }, 400);
    }

    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (err) {
    console.error("Error generating VCF:", err);
  }
}

downloadBtn.addEventListener("click", () => generateVCF(false));

updateStats();
setInterval(updateStats, 4500);
