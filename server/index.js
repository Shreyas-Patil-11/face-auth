const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const faceapi = require("face-api.js");
const crypto = require("crypto");
const { Canvas, Image } = require("canvas");
const path = require("path");
require("dotenv").config();

faceapi.env.monkeyPatch({ Canvas, Image });

const app = express();
app.use(cors({
    origin: ["https://face-authjs.vercel.app", "http://localhost:5173",], // Replace with your frontend URL
    methods: ["GET", "POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use('/models', express.static(path.join(__dirname, 'models')));

mongoose
.connect(process.env.MONGO_URI, {             
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB connection error:", err));

const encryptionKey = process.env.ENCRYPTION_KEY; // 32-byte key stored in .env
const algorithm = "aes-256-gcm"; 

// Encrypt face descriptor
function encryptDescriptor(descriptor) {
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, "hex"), iv);
    let encrypted = cipher.update(JSON.stringify(descriptor), "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return iv.toString("hex") + ":" + encrypted + ":" + authTag; 
}

// Decrypt face descriptor
function decryptDescriptor(encryptedDescriptor) {
    const [ivHex, encrypted, authTagHex] = encryptedDescriptor.split(":");
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, "hex"), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted); 
}

const UserSchema = new mongoose.Schema({
    username: String,
    faceDescriptor: String // Store encrypted descriptor as a string
});

const User = mongoose.model("User", UserSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage });

// User Registration with Encrypted Face Descriptor
app.post('/register', upload.single('image'), async (req, res) => {
    const { username, descriptor } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
    }

    let parsedDescriptor;
    try {
        parsedDescriptor = JSON.parse(descriptor);
    } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid descriptor format" });
    }

    console.log("Received descriptor for registration:", parsedDescriptor.length);

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already taken!" });
    }

    const encryptedDescriptor = encryptDescriptor(parsedDescriptor);

    const user = new User({ username, faceDescriptor: encryptedDescriptor });
    await user.save();

    res.json({ success: true, message: "User registered successfully with encrypted face data!" });
});

// Authenticate User with Decrypted Face Descriptor
app.post('/login', upload.single('image'), async (req, res) => {
    console.log("Received Login Request:", req.body);

    const { descriptor } = req.body;
    if (!descriptor) {
        return res.status(400).json({ success: false, message: "Descriptor is missing" });
    }

    let parsedDescriptor;
    try {
        parsedDescriptor = JSON.parse(descriptor);
    } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid descriptor format" });
    }

    console.log("Descriptor from frontend:", parsedDescriptor.length);

    const users = await User.find();
    console.log("Stored Users:", users.length);

    let matchFound = null;

    users.forEach(user => {
        try {
            const decryptedDescriptor = decryptDescriptor(user.faceDescriptor);
            const distance = faceapi.euclideanDistance(parsedDescriptor, decryptedDescriptor);
            console.log(`Distance for ${user.username}:`, distance);

            if (distance < 0.6) {
                matchFound = user.username;
            }
        } catch (error) {
            console.error("Error decrypting descriptor:", error);
        }
    });

    if (matchFound) {
        console.log("User recognized:", matchFound);
        res.json({ success: true, username: matchFound });
    } else {
        console.log("Face not recognized");
        res.json({ success: false, message: "Face not recognized" });
    }
});

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

