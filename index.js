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
  const data = req.body;
  console.log(data);
  try {
    // Convert the 'id' from the URL parameter to an ObjectId
    // Convert the string to ObjectId

    const database = client.db(`leo_profile`);
    const postsCollection = database.collection(`${id}`);

   
    const newPost = {
      user_id: id, // Convert ObjectId to string if necessary
      profilePic: "", // Provide a default image or null
      first_name: "name",
      last_name: "",
      bio: "",
      email: data.email,
      ecoPoint: 0,
      phone: "",
      country: data.country,
      city: data.city,
      profession: data.profession,
      gender: data.gender,
      badges: [
        {
          id: 1,
          name: "Eco Explorer",
          description: "Awarded to new contributors for their first steps in recycling and awareness.",
          
        },
        {
          id: 2,
          name: "Green Guardian",
          description: "Given to active members who frequently blog, recycle, or trade plastics.",

        },
        {
          id: 3,
          name: "Climate Champion",
          description: "The highest honor for contributors making a major impact in plastic reduction.",

        }
      ]
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
        user_id: id
      }, // Find the user by _id
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
  const { id } = req.params;
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
  const { id } = req.params;
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

// Add this route to your server code
app.post("/:id/updateProfile", async (req, res) => {
  const { id } = req.params; // Get the user ID from the URL parameter
  const { first_name, last_name, bio } = req.body; // Get updated profile data from the request body

  try {
    // Validate that required fields are provided
    if (!first_name || !last_name || !bio) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Get the user collection and update the profile
    const database = client.db(`leo_profile`);
    const postsCollection = database.collection(`${id}`);

    const result = await postsCollection.updateOne(
      { user_id: id }, // Find the user by user_id
      { $set: { first_name, last_name, bio } } // Update the profile fields
    );

    // Check if a user was found and updated
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "User not found or no changes made" });
    }

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new post
app.post("/:id/api/posts", async (req, res) => {
  const { id } = req.params;
  try {
    const database = client.db(`leo_posts`);
    const postsCollection = database.collection(`${id}`);
    
    // Get current date and time
    const timestamp = new Date(); 

    // Attach date and time to the post
    const newPost = {
      ...req.body,
      createdAt: timestamp, // Stores both date & time in ISO format
      like: 0,
      Comment: [],
      likedBy: [],
    };

    const result = await postsCollection.insertOne(newPost);

    res.status(201).json({
      message: "Post created successfully",
      id: result.insertedId,
      createdAt: timestamp, // Send timestamp in response as well
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.delete("/:id/api/posts/:postId", async (req, res) => {
  const { id, postId } = req.params; // Get user ID and post ID from URL params

  try {
    const database = client.db("leo_posts");
    const postsCollection = database.collection(`${id}`);

    // Delete the post by its _id
    const result = await postsCollection.deleteOne({ _id: new ObjectId(postId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/:id/updatePlasticData", async (req, res) => {
  const { id } = req.params; // Get the user ID from the URL parameter
  const plasticData = req.body; // Get the updated plastic data from the request body

  try {
    // Validate that the plastic data is provided
    if (!plasticData || typeof plasticData !== "object" || Object.keys(plasticData).length === 0) {
      return res.status(400).json({ message: "Invalid plastic data provided" });
    }

    // Get the user collection
    const database = client.db("leo_profile");
    const postsCollection = database.collection(`${id}`);

    // Update the plastic data in the user's collection
    const result = await postsCollection.updateOne(
      { user_id: id }, // Find the user by user_id
      { $set: { plasticData } } // Update the plasticData field
    );

    // Check if a user was found and updated
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "User not found or no changes made" });
    }

    res.status(200).json({ message: "Plastic data updated successfully" });
  } catch (error) {
    console.error("Error updating plastic data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.put("/:userId/api/posts/:postId", async (req, res) => {
  const { userId, postId } = req.params;
  const { content } = req.body;
  console.log(userId);

  try {
    // Ensure content is provided
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Access the posts collection for the specific user
    const database = client.db("leo_posts");
    const postsCollection = database.collection(`${userId}`);

    // Find the post by its ID
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Ensure the user owns the post (or remove this check if not needed)


    // Update the post content
    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $set: { content } }
    );

    // Check if the update was successful
    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: "Post content update failed" });
    }

    // Respond with the updated post (or just send a success message)
    res.status(200).json({ message: "Post updated successfully" });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update post" });
  }
});
// Like/Unlike a Post
app.put("/:userId/api/posts/:postId/like", async (req, res) => {
  const { userId, postId } = req.params;
  const { id } = req.body;
  console.log(id);
  

  try {
    console.log(`Received like/unlike request for userId: ${userId}, postId: ${postId}`);

    const database = client.db("leo_posts");
    const postsCollection = database.collection(`${userId}`);

    // Validate postId
    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid postId" });
    }

    // Find the post
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has already liked the post
    const hasLiked = post.likedBy && post.likedBy.includes(id);

    let updateQuery;
    if (hasLiked) {
      // Unlike the post: remove user ID from likedBy and decrement like count
      updateQuery = {
        $pull: { likedBy: id }, // Remove user ID from likedBy array
        $inc: { like: -1 }, // Decrement the like count
      };
    } else {
      // Like the post: add user ID to likedBy and increment like count
      updateQuery = {
        $push: { likedBy: id }, // Add user ID to likedBy array
        $inc: { like: 1 }, // Increment the like count
      };
    }

    // Update the post
    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      updateQuery
    );

    console.log("Update result:", result);

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: "Failed to update like status" });
    }

    // Fetch the updated post to get the new like count
    const updatedPost = await postsCollection.findOne({ _id: new ObjectId(postId) });

    res.status(200).json({
      message: hasLiked ? "Post unliked successfully" : "Post liked successfully",
      like: updatedPost.like,
      liked: !hasLiked, // Return the new liked status
    });
  } catch (error) {
    console.error("Error updating like status:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});
// Add a Comment to a Post
app.post("/:userId/api/posts/:postId/comment", async (req, res) => {
  const { userId, postId } = req.params;
  const { comment, id } = req.body;
  console.log(id);
  

  try {
    console.log(`Received comment request for userId: ${userId}, postId: ${postId}`);

    const database = client.db("leo_posts");
    const postsCollection = database.collection(`${userId}`);

    // Validate postId
    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid postId" });
    }

    // Validate the comment
    if (!comment || typeof comment !== "string" || comment.trim() === "") {
      return res.status(400).json({ message: "Invalid comment" });
    }

    // Add the comment to the post
    const newComment = {
      userId: id,
      comment,
      createdAt: new Date(),
    };

    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $push: { Comment: newComment } }
    );

    console.log("Update result:", result);

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: "Failed to add comment" });
    }

    res.status(201).json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});








// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

