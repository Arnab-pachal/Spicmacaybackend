const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require('cloudinary').v2;
const Mongo = require("./schema");
const methodOverride = require("method-override");
const vidMongo = require("./vidschema");
require('dotenv').config();

const app = express();
const cors = require("cors");
app.use(cors({
    origin: ["https://spicmacaynitdurgapur.vercel.app/"], 
    methods: ["GET", "POST", "DELETE"],
    credentials:true 
}));
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.listen(3001, () => {
    console.log("app is listening on port 3001");
});

app.use("/uploads", express.static("uploads"));
const path = require('path');
const uploadPath = path.join(__dirname, 'uploads');

app.get("/", async (req, res) => {
   try{ const alldata = await Mongo.find({});
    res.status(200).json(alldata);}
           catch (error) {
            console.error('Error fetching photos:', error);
            res.status(500).json({ message: 'Error fetching photos' });
      
    }
    
}
);
app.get("/getvideo",async(req,res)=>{
    try{
        const data = await vidMongo.find({});
        res.status(200).json(data);
    }
    catch(err){
        console.log(err);
        res.status(500).json(`some error occured ${err}`)
    }
})

app.delete("/delete", async (req, res) => {
    let id = req.query.id;
    console.log(id);
    try{
    let doc = await Mongo.findByIdAndDelete(id);
    const public_id = doc.name;
    await cloudinary.uploader.destroy(public_id);
    console.log(doc);
    res.status(200).send("file uploaded successfully");
    }
    catch(err){
        console.log("error occured");
    }
});

app.delete("/deletevid", async (req, res) => {
    let id = req.query.id;
    console.log(id);
    try{
    let doc = await vidMongo.findOneAndDelete({public_id:id});
    await cloudinary.uploader.destroy(id);
    console.log(doc);
    res.status(200).send("video file uploaded successfully");
    }
    catch(err){
        console.log("error occured");
    }
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

app.post('/cloud', upload.single('file'), async (req, res) => {
    const path = req.file.path;
    try {
        const result = await cloudinary.uploader.upload(path, {
            public_id: req.file.originalname,
        });

        const newPic = new Mongo({ name: req.file.originalname, url: result.url });
        await newPic.save();

        fs.unlink(path, (err) => {
            if (err) console.error('Error deleting file:', err);
            else console.log('File deleted successfully');
        });
        console.log("file saved successfully");
      
    } catch (error) {
        console.log('Upload error:', error);
        res.status(500).send('Error uploading file.');
    }
    res.status(200).json({ message: "File uploaded successfully!"});
});

app.post('/upload',upload.single('video'),async(req,res)=>{
    console.log(req.file);
    try{
        const result = await cloudinary.uploader.upload(req.file.path,{
            resource_type:'video',
        });
        console.log(result);
        const newvideo = new vidMongo({public_id:result.public_id,name:req.file.originalname,url:result.secure_url});
        await newvideo.save();
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
            else console.log('File deleted successfully');
        });
        res.status(200).json("video uploaded successfully");
    }
   catch(err){
    console.error('Error uploading video:', err);
    res.status(500).json({ err: 'Failed to upload video' });
   }
})