const boothsDiv = document.getElementById("booths");
const createBtn = document.getElementById("createBooth");

async function fetchBooths() {
    const res = await fetch("/booths");
    const data = await res.json();
    boothsDiv.innerHTML = "";
    data.forEach(booth => {
        const div = document.createElement("div");
        div.className = "booth";
        div.innerHTML = `
            <strong>${booth.title}</strong><br>
            Owner: ${booth.owner}<br>
            Goal: $${booth.goal}<br>
            Raised: $${booth.raised}<br>
            <a href="booth.html?id=${booth.id}">View Booth</a>
        `;
        boothsDiv.appendChild(div);
    });
}

createBtn.addEventListener("click", async () => {
    const title = document.getElementById("title").value;
    const owner = document.getElementById("owner").value;
    const goal = document.getElementById("goal").value;
    const paypalEmail = document.getElementById("paypalEmail").value;

    try {
        const res = await fetch("/booths", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, owner, goal, paypalEmail })
        });
        const data = await res.json();
        if (res.ok) {
            alert("Booth created!");
            fetchBooths();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Error creating booth.");
    }
});

fetchBooths();
