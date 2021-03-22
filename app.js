const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const cors = require("cors");
const connectDB = require("./config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./models/user");

app.use(express.static("public"));
app.use(express.json({ extended: false }));
app.use(cors({ origin: true, credentials: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "DELETE, PUT, GET, POST");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

connectDB();

app.get("/auth", function (req, res) {
  const token = req.headers["x-auth-token"];
  if (token) {
    const decoded = jwt.verify(token, "shhhhh");
    return res.status(200).json({ user: decoded.email });
  }

  res.status(403).json({ message: "Failed Auth" });
});

app.post("/login", async function (req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });
  if (user) {
    const checkPassword = await bcrypt.compare(password, user.password);
    if (checkPassword) {
      const token = jwt.sign({ email: email, password: password }, "shhhhh");
      return res.status(200).json({ token, user: email });
    }
    return res.status(403).json({ message: "Failed" });
  }
  res.status(403).json({ message: "Failed" });
});

app.post("/register", async function (req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(500).json({ msg: "Please fill all!" });
  let user = await User.findOne({ email });
  if (user) {
    return res.status(500).json({ msg: "Account exists" });
  }
  const salt = await bcrypt.genSalt(10);
  user = new User({ name, email, password });
  user.password = await bcrypt.hash(password, salt);
  await user.save();
  res.status(200).json({ user: email });
});

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
