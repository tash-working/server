const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const app = express();
const port = 5000; // Set the port to 5000

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse incoming JSON request bodies

// MongoDB Connection
const uri =
  "mongodb+srv://inventory:inventory@cluster0.ffl8g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect once and keep the connection open
client
  .connect()
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

app.get("/collections", async (req, res) => {
  try {
    const db = client.db("leo_profile"); // Replace with your actual DB name
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    res.json({ collections: collectionNames });
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

  
 




app.post("/:id/create_id", async (req, res) => {
  const { id } = req.params; // Get the id from the URL parameter
  try {
    // Convert the 'id' from the URL parameter to an ObjectId
   // Convert the string to ObjectId

    const database = client.db(`leo_profile`);
    const postsCollection = database.collection(`${id}`);

    // Create the new post with the ObjectId from the URL as 'id'
    const newPost = {
      user_id: id, // Use the ObjectId as 'id'
      profilePic : ""
    };

    const result = await postsCollection.insertOne(newPost);

    res.status(201).json({
      message: "Post created successfully",
      id: newPost.id, // Return the custom 'id' (ObjectId)
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/:id/uploadPP", async (req, res) => {
  const { id } = req.params; // Get the user ID from URL parameter
  const { imageUrl } = req.body; // Get the image URL from the request body

  try {
    // Validate that the image URL is provided
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    // Convert the 'id' to ObjectId (assuming it's stored as ObjectId in MongoDB)
    // const userId = new ObjectId(id);

    // Get the user collection and update the profile picture
    
    const database = client.db(`leo_profile`);
    const postsCollection = database.collection(`${id}`);

    const result = await postsCollection.updateOne(
      { 
        user_id: id }, // Find the user by _id
      { $set: { profilePic: imageUrl } } // Set the profilePic field to the new image URL
    );

    // Check if a user was found and updated
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "User not found or no changes made" });
    }

    res.status(200).json({ message: "Profile picture updated successfully" });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

  





app.get("/:id/get_id", async (req, res) => {
  const { id} = req.params;
  try {
    const database = client.db(`leo_profile`);
    const postsCollection = database.collection(`${id}`);
    const posts = await postsCollection.find({}).toArray();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/:id/api/posts", async (req, res) => {
  const { id} = req.params;
  try {
    const database = client.db(`leo_posts`);
const postsCollection = database.collection(`${id}`);
    const posts = await postsCollection.find({}).toArray();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new post
app.post("/:id/api/posts", async (req, res) => {
  const { id} = req.params;
  try {
    const database = client.db(`leo_posts`);
const postsCollection = database.collection(`${id}`);
    const newPost = req.body;
    const result = await postsCollection.insertOne(newPost);
    res.status(201).json({
      message: "Post created successfully",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
