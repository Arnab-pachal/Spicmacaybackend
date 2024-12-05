const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Mongo = require("./schema");
const vidMongo = require("./vidschema");
const methodOverride = require("method-override");
const cors = require("cors");
require("dotenv").config();

if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
  console.error("Missing Cloudinary configuration in .env");
  process.exit(1);
}



const app = express();

// Middleware
app.use(cors({ origin: "*", credentials: true, methods: ["GET", "POST", "DELETE"] }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Server Start

// File Upload Middleware
const upload = multer({
  dest:"./tmp",
  limits: { fileSize: 100 * 1024 * 1024 }, // Max file size: 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg","image/jpg","image/webp","image/png", "video/mp4"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"), false);
    }
    cb(null, true);
  },
});

app.listen(3001, () => console.log("App is listening on port 3001"));
// Routes

// Fetch all images
app.get("/", async (req, res) => {
  try {
    const data = await Mongo.find({});
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ message: "Error fetching photos" });
  }
});

// Fetch all videos
app.get("/getvideo", async (req, res) => {
  try {
    const data = await vidMongo.find({});
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Error fetching videos" });
  }
});
const check=(req,res,next)=>{
console.log(req);
next();
}
// Upload an image
app.post("/cloud",check ,upload.single('file') ,async (req, res) => {
  try {
    console.log(req.file);
    if (!req.file) throw new Error("No file provided");
    const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
      });
    const newPic = new Mongo({ name: req.file.originalname, url: result.url });
    await newPic.save();

    res.status(200).json({ message: "Image uploaded successfully!", url: result.url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Error uploading image", error });
  }
});

// Upload a video
app.post("/upload", upload.single('video'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file provided");

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
    });

    const newVideo = new vidMongo({ public_id: result.public_id, name: req.file.originalname, url: result.secure_url });
    await newVideo.save();

    res.status(200).json({ message: "Video uploaded successfully!", url: result.secure_url });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Error uploading video", error });
  }
});

// Delete an image
app.delete("/delete", async (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: "ID is required" });

  try {
    const doc = await Mongo.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Image not found" });

    await cloudinary.uploader.destroy(doc.name);
    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Error deleting image", error });
  }
});

// Delete a video
app.delete("/deletevid", async (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: "ID is required" });

  try {
    const doc = await vidMongo.findOneAndDelete({ public_id: id });
    if (!doc) return res.status(404).json({ message: "Video not found" });

    await cloudinary.uploader.destroy(id, { resource_type: "video" });
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Error deleting video", error });
  }
});
