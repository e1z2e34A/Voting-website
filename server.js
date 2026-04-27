const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("Request received:", req.method, req.url);
  next();
});

// 🔐 Admin password
const ADMIN_PASSWORD = "30A9ZQ2";

// 🗄️ Connect to MongoDB (we fix this next step)
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

// TOKEN MODEL
const Token = mongoose.model("Token", {
  code: String,
  used: { type: Boolean, default: false },
});

// ITEM MODEL
const Item = mongoose.model("Item", {
  name: String,
  count: { type: Number, default: 0 },
});

// 🔑 Redeem token
app.post("/redeem", async (req, res) => {
  const { token } = req.body;

  console.log("Token entered:", token);

  console.log("Searching for:", token);

  const allTokens = await Token.find();
  console.log("ALL TOKENS IN DB:", allTokens);

  const found = await Token.findOne({ code: token.trim() });

  console.log("Found result:", found);

  if (!found) return res.json({ success: false, msg: "Invalid token" });
  if (found.used)
    return res.json({ success: false, msg: "Token already used" });

  found.used = true;
  await found.save();

  res.json({ success: true, points: 5 });
});

// 📦 Select item
app.post("/select", async (req, res) => {
  const { item } = req.body;

  let found = await Item.findOne({ name: item });

  if (!found) {
    found = new Item({ name: item });
  }

  found.count += 1;
  await found.save();

  res.json({ success: true });
});

// 🔐 Admin login
app.post("/admin-login", (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }

  res.json({ success: false });
});

// 📊 Admin data
app.get("/admin-data", async (req, res) => {
  const items = await Item.find();
  const tokensUsed = await Token.countDocuments({ used: true });

  res.json({ items, tokensUsed });
});

app.get("/", (req, res) => {
  res.send("✅ Token system backend is running successfully");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
