// ===================================
// CONFIG
// ===================================
const API = "/api";
const STORAGE_KEY = "refundme_booths";
let booths = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// ===================================
// DOM
// ===================================
const boothGrid = document.getElementById("boothGrid");
const recommendGrid = document.getElementById("recommendGrid");
const addBoothBtn = document.getElementById("addBoothBtn");
const addModal = document.getElementById("addModal");
const cancelCreate = document.getElementById("cancelCreate");
const createBooth = document.getElementById("createBooth");

// view modal
const viewModal = document.getElementById("viewModal");
const closeView = document.getElementById("closeView");
const viewImg = document.getElementById("viewImg");
const viewTitle = document.getElementById("viewTitle");
const viewDesc = document.getElementById("viewDesc");
const viewRaised = document.getElementById("viewRaised");
const viewGoal = document.getElementById("viewGoal");
const viewViews = document.getElementById("viewViews");
const progressBar = document.getElementById("progressBar");
const donationInput = document.getElementById("donationAmount");
const thanks = document.getElementById("thanks");



// ===================================
// PAYPAL SDK
// ===================================
let paypalLoaded = false;
let paypalClientId = "sb"; // Sandbox

async function loadPayPal() {
    if (paypalLoaded) return;

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.src =
            `https://www.paypal.com/sdk/js?client-id=${paypalClientId}` +
            `&currency=USD&components=buttons`;

        script.onload = () => {
            paypalLoaded = true;
            console.log("PayPal SDK loaded");
            resolve();
        };

        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function renderPayPalButton(boothId) {
    const booth = booths.find(b => b.id === boothId);
    if (!booth) return;

    await loadPayPal();

    const container = document.getElementById("paypal-button-container");
    container.innerHTML = "";

    paypal.Buttons({
        style: {
            layout: "vertical",
            height: 45
        },

        createOrder: (data, actions) => {
            const amount = parseFloat(donationInput.value || 1);

            // 20% cut
            const platform = amount * 0.20;
            const creatorCut = amount * 0.80;

            // Spara cuten i booth objektet
            booth.pendingCreatorCut = creatorCut;

            return actions.order.create({
                purchase_units: [
                    {
                        description: booth.title,
                        amount: {
                            value: amount.toFixed(2)
                        },
                        payee: {
                            email_address: "isacericlarsson@outlook.com" // 20% hit
                        }
                    }
                ]
            });
        },

        onApprove: async (data, actions) => {
            const order = await actions.order.capture();

            const booth = booths.find(b => b.id === boothId);

            booth.raised = (booth.raised || 0) + (booth.pendingCreatorCut || 0);
            delete booth.pendingCreatorCut;

            localStorage.setItem(STORAGE_KEY, JSON.stringify(booths));
            render();

            thanks.classList.remove("hidden");
        },

        onError: (err) => {
            console.error("PayPal error:", err);
            alert("PayPal error – check console.");
        }

    }).render(container);
}

// ===================================
// RENDER BOOTHS
// ===================================
function render() {
    boothGrid.innerHTML = "";
    recommendGrid.innerHTML = "";

    booths.forEach(b => {
        const box = document.createElement("div");
        box.className = "card";
        box.innerHTML = `
            <img src="${b.img || 'https://placehold.co/600x400'}" class="cardImg">
            <h3>${b.title}</h3>
            <p class="muted">${b.desc}</p>
            <button class="btn ghost" onclick="openView('${b.id}')">Open</button>
        `;
        boothGrid.appendChild(box);
    });

    // random 3 recommended
    booths.slice(0, 3).forEach(b => {
        const box = document.createElement("div");
        box.className = "card";
        box.innerHTML = `
            <img src="${b.img || 'https://placehold.co/600x400'}" class="cardImg">
            <h3>${b.title}</h3>
            <button class="btn ghost" onclick="openView('${b.id}')">Open</button>
        `;
        recommendGrid.appendChild(box);
    });
}

render();

// ===================================
// OPEN VIEW
// ===================================
async function openView(id) {
    const b = booths.find(x => x.id === id);
    if (!b) return;

    b.views = (b.views || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(booths));
    render();

    // attempt fetch fresh (ignore fails)
    try {
        const res = await fetch(API + "/booths/" + id);
        if (res.ok) {
            const full = await res.json();
            Object.assign(b, full);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(booths));
            render();
        }
    } catch {}

    viewImg.src = b.img || "https://placehold.co/600x400";
    viewTitle.innerText = b.title;
    viewDesc.innerText = b.desc;
    viewRaised.innerText = (b.raised || 0).toFixed(2);
    viewGoal.innerText = b.goal || 0;
    viewViews.innerText = b.views || 0;

    progressBar.style.width = Math.min(100, (b.raised || 0) / (b.goal || 1) * 100) + "%";

    donationInput.value = 5;

    thanks.classList.add("hidden");

    // QR Code
    new QRious({
        element: document.getElementById("qrCanvas"),
        value: window.location.origin + window.location.pathname + "#booth=" + b.id,
        size: 140
    });

    // PayPal
    renderPayPalButton(b.id);

    viewModal.classList.remove("hidden");
}

window.openView = openView;

// ===================================
// CREATE BOOTH
// ===================================
createBooth.onclick = async () => {
    const title = document.getElementById("addTitle").value.trim();
    const desc = document.getElementById("addDesc").value.trim();
    const goal = parseFloat(document.getElementById("addGoal").value);
    const email = document.getElementById("addPayPal").value.trim();
    const imgFile = document.getElementById("addImg").files[0];

    if (!title || !desc || !goal || !email) {
        alert("Please fill all fields!");
        return;
    }

    let imgURL = "https://placehold.co/600x400";
    if (imgFile) {
        imgURL = URL.createObjectURL(imgFile);
    }

    const newBooth = {
        id: Date.now().toString(),
        title,
        desc,
        goal,
        raised: 0,
        views: 0,
        email,
        img: imgURL
    };

    booths.push(newBooth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(booths));
    render();

    addModal.classList.add("hidden");
};

// ===================================
// MODAL HANDLING
// ===================================
addBoothBtn.onclick = () => addModal.classList.remove("hidden");
cancelCreate.onclick = () => addModal.classList.add("hidden");
closeView.onclick = () => viewModal.classList.add("hidden");
