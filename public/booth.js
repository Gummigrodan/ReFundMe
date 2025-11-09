const urlParams = new URLSearchParams(window.location.search);
const boothId = urlParams.get("id");

const titleEl = document.getElementById("title");
const ownerEl = document.getElementById("owner");
const goalEl = document.getElementById("goal");
const raisedEl = document.getElementById("raised");
const progressBar = document.getElementById("progress-bar");
const donationInput = document.getElementById("donation-amount");
const paypalContainer = document.getElementById("paypal-button-container");

let boothData;

async function fetchBooth() {
    const res = await fetch(`/booths/${boothId}`);
    boothData = await res.json();
    if (res.ok) {
        titleEl.textContent = boothData.title;
        ownerEl.textContent = boothData.owner;
        goalEl.textContent = boothData.goal;
        raisedEl.textContent = boothData.raised;
        progressBar.style.width = `${(boothData.raised / boothData.goal) * 100}%`;
        setupPayPal();
    } else {
        alert(boothData.error);
    }
}

function setupPayPal() {
    paypal.Buttons({
        createOrder: function(data, actions) {
            let amount = donationInput.value;
            if (!amount || amount <= 0) {
                alert("Enter a valid amount");
                return;
            }
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: amount
                    },
                    payee: {
                        email_address: boothData.paypalEmail
                    }
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(async function(details) {
                await fetch(`/booths/${boothId}/donate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: donationInput.value })
                });
                alert(`Donation successful!`);
                fetchBooth();
            });
        }
    }).render("#paypal-button-container");
}

fetchBooth();