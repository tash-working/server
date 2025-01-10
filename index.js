const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
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

client.connect().then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Signin route for a specific user profile
app.post("/:id/signin", async (req, res) => {
  const { id } = req.params;
  try {
    console.log(req.body);
    const database = client.db("pos");
    const OrderCollection = database.collection(`${id}_profile`);
    const result = await OrderCollection.insertOne(req.body);
    console.log("Profile inserted successfully", result.insertedId);
    res.status(201).send({ message: "Profile inserted successfully", id: result.insertedId });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    res.status(500).send("Internal server error. Please contact support.");
  }
});

// Create a new order for a specific user
app.post("/PosOrder/:id", async (req, res) => {
  const { id } = req.params;
  try {
    console.log(req.body);
    const database = client.db("pos");
    const OrderCollection = database.collection(`${id}_orders`);
    const result = await OrderCollection.insertOne(req.body);
    console.log("Order inserted successfully", result.insertedId);
    res.status(201).send({ message: "Order inserted successfully", id: result.insertedId });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    res.status(500).send("Internal server error. Please contact support.");
  }
});

// Get all orders for a specific user
app.get("/PosOrder/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const database = client.db("pos");
    const post = database.collection(`${id}_orders`);
    const documents = await post.find({}).toArray();
    res.json(documents);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get the menu from the 'menu' collection
app.get("/getMenu/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const database = client.db("menu");
    const post = database.collection(`${id}_menu`);
    const documents = await post.find({}).toArray();
    res.json(documents);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// delete category
app.post("/add_item/:id/delete_category", async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;

  try {
    await YourModel.updateOne(
      { _id: id },
      { $pull: { category: category } }
    );
    res.status(200).send({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Failed to delete category", error });
  }
});


// add item to menu
app.post("/add_item/:id", async (req, res) => {
  const { id } = req.params;
  try {
    console.log(req.body);

    const { category, name, price, size, selectedSize, imageUrl } = req.body;

    // Validate the request body
    if (!category || !name || !price || !imageUrl || size.some((s) => !s.size || !s.price)) {
      return res.status(400).send("Please fill in all fields!");
    }

    // Connect to the database
    const database = client.db("menu");
    const menuCollection = database.collection(`${id}_menu`);

    // Find the category in the menu collection
    const menuDoc = await menuCollection.findOne({ "menu.category": category });

    if (!menuDoc) {
      // If the category doesn't exist, create a new category and add the item
      const newItem = { name, price, size, selectedSize, imageUrl };
      const result = await menuCollection.updateOne(
        {},
        {
          $push: {
            menu: {
              category,
              items: [newItem],
            },
          },
        },
        { upsert: true }
      );
      console.log("New category added with item:", result);
      return res.status(201).send("Menu item added successfully!");
    } else {
      // If the category exists, add the item to the existing category
      const newItem = { name, price, size, selectedSize, imageUrl };
      const result = await menuCollection.updateOne(
        { "menu.category": category },
        {
          $push: {
            "menu.$.items": newItem,
          },
        }
      );
      console.log("Item added to existing category:", result);
      return res.status(201).send("Menu item added successfully!");
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    res.status(500).send("Internal server error. Please contact support.");
  }
});

// DElete item from menu
app.delete('/delete_item/:id/:itemName', async (req, res) => {
  const { id, itemName } = req.params;

  try {
    const database = client.db("menu");
    const menuCollection = database.collection(`${id}_menu`);

    // Find and delete the item from the menu collection by its name
    const result = await menuCollection.updateOne(
      { "menu.items.name": itemName },
      { $pull: { "menu.$.items": { name: itemName } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send("Item not found.");
    }

    res.status(200).send("Item deleted successfully.");
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).send("Internal server error.");
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
