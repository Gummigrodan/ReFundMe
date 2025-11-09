import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

let booths = []; // In-memory storage for booths

// Get all booths
app.get("/booths", (req, res) => {
    res.json(booths);
});

// Create a booth
app.post("/booths", (req, res) => {
    const { title, owner, goal, paypalEmail } = req.body;
    if (!title || !owner || !goal || !paypalEmail) {
        return res.status(400).json({ error: "All fields are required." });
    }
    const newBooth = { id: booths.length, title, owner, goal, raised: 0, paypalEmail };
    booths.push(newBooth);
    res.json(newBooth);
});

// Get booth by id
app.get("/booths/:id", (req, res) => {
    const booth = booths[req.params.id];
    if (!booth) return res.status(404).json({ error: "Booth not found." });
    res.json(booth);
});

// Update raised amount
app.post("/booths/:id/donate", (req, res) => {
    const booth = booths[req.params.id];
    if (!booth) return res.status(404).json({ error: "Booth not found." });
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: "Invalid amount." });
    booth.raised += parseFloat(amount);
    res.json(booth);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
