const mongoose = require("mongoose");
require('dotenv').config();
mongoose.connect(`mongodb+srv://ap23cs8031:ayantikalove9@cluster0.ustzk.mongodb.net/myDatabase?retryWrites=true&w=majority`)
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .catch((error) => console.error('Error connecting to MongoDB Atlas:', error));
const schema = new mongoose.Schema({
public_id : String,
name : String,    
url : String,
})    
const vidModel = mongoose.model("vidModel",schema);
module.exports = vidModel; 