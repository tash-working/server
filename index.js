const express = require("express");
const app = express();
const http = require('http');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { Server } = require("socket.io");
var ObjectId = require('mongodb').ObjectId;

const cors = require('cors');
const { permission } = require("process");
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = "mongodb+srv://inventory:inventory@cluster0.ffl8g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    // Create HTTP server and Socket.io instance
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*", // Replace with specific origins if needed
        methods: ["GET", "POST", "PUT"]
      }
    });

    // Connect Socket.io events
    io.on('connection', (socket) => {
      console.log('A user connected');

      // Handle incoming events (e.g., 'chat-message')
      socket.on("send_user", async (data) => {

        console.log(data);
        const myDB = client.db("users");
        const myColl = myDB.collection(`userLoginInfo`);

        const result = await myColl.insertOne(data.userData);


        console.log(result.insertedId); // Output: ObjectId("6464252729455d5810000000")

        // Retrieve the full document with its _id
        const insertedDocument = await myColl.findOne({ _id: result.insertedId });
        console.log(insertedDocument);
        socket.broadcast.emit("receive_newUser", insertedDocument);
      });






      socket.on("send_like", async (data) => {
        console.log(data.data);

        const database = client.db("users");
        const post = database.collection("userLoginInfo");

        const updateData = data.data; // Assuming 'data.data' contains an array of objects

        console.log(updateData);

        // Validate input data (optional, but recommended)
        if (!Array.isArray(updateData) || updateData.length === 0) {
          // Emit an error event to notify the client about invalid data
          socket.emit("like_update_error", { message: "Invalid update data provided" });
          return;
        }

        const updateDocs = updateData.map((singleData) => {
          try {
            // Extract values for update (adjust these based on your data structure)
            const id = new ObjectId(`${singleData.new_id}`); // Assuming 'id' is a key in each object
            const newTotal = singleData.new_total;
            const newLike = singleData.new_like;

            return {
              updateOne: {
                filter: { _id: id },
                update: { $set: { total: newTotal, like: newLike } },
              },
            };
          } catch (err) {
            console.error(`Error processing update for ID: ${singleData.new_id}`, err);
            return null; // Skip updating this document on error
          }
        });

        // Filter out invalid update objects (optional, but recommended)
        const filteredUpdateDocs = updateDocs.filter(Boolean); // Remove null values

        if (filteredUpdateDocs.length === 0) {
          // Emit an error event to notify the client about no valid updates found
          socket.emit("like_update_error", { message: "No valid updates found" });
          return;
        }

        try {
          const results = await post.bulkWrite(filteredUpdateDocs);
          const updatedCount = results.modifiedCount;

          // Log the updated objects after successful update
          // console.log("Updated objects:", filteredUpdateDocs.updateOne.update);
          socket.broadcast.emit("like_success", { filteredUpdateDocs })

          // Emit a success event to notify the client about the update status
          socket.emit("like_update_success", { message: `${updatedCount} documents updated successfully` });
        } catch (err) {
          console.error("Error updating documents:", err);
          // Emit an error event to notify the client about the update failure
          socket.emit("like_update_error", { message: "Error updating documents" });
        }
      });




      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });

    // Existing API endpoints (GET /users, POST /addPic, PUT /update)
    app.get('/users', async (req, res) => {
      try {
        const database = client.db("users");
        const post = database.collection("userLoginInfo");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });
    app.get(`/get_user/:user_name/:password`, async (req, res) => {
      const database = client.db("users");
      const post = database.collection("userLoginInfo");


      const query = {
        userName: req.params.user_name,
        password: req.params.password,
      };
      console.log(query);

      const item = await post.findOne(query);

      console.log(item);

      if (item === null) {
        res.send({ permission: false })
      } else {
        item.password = ""
        res.send({
          permission: true,
          item
        })
        
      }
      // try {
      //   const database = client.db("users");
      //   const post = database.collection("userLoginInfo");
      //   const documents = await post.find({}).toArray();

      //   const data = documents;
      //   res.json(data);
      // } catch (error) {
      //   console.error('Error fetching data:', error);
      //   res.status(500).json({ message: 'Server error' });
      // }
    });

    // app.post("/addUser", async (req, res) => {
    //   const newUser = req.body;
    //   console.log("called");
    //   console.log(newUser);

    //   const myDB = client.db("users");
    //   const myColl = myDB.collection(`userLoginInfo`);

    //   const result = await myColl.insertOne(newUser);

    //   console.log(
    //     `A document was inserted with the _id: ${result.insertedId}`,
    //   );

    // });

    app.put('/addPick', async (req, res) => {
      const updatedUserPic = req.body;
      const database = client.db("users");
      const post = database.collection("userLoginInfo");
      const filter = {_id: new ObjectId(updatedUserPic.id)}
      const options = {upsert: true}
  
      console.log(updatedUserPic);
      const update = {
        $set: {
          url:updatedUserPic.url
        }
      }
    
      try {
        const updateResult = await post.updateOne(filter,update,options);
    
        if (updateResult.matchedCount === 0) {
          return res.status(404).json({ message: 'Document not found' });
        }
    
        res.json({ message: 'Document updated successfully' });
      } catch (err) {
        console.error('Error updating document:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
      

    
      // User.updateOne({ _id: userId }, updatedUser, (err, result) => {
      //   if (err) {
      //     console.error('Error updating user:', err);
      //     res.status(500).json({ message: 'Internal server error' });
      //     return;
      //   }
    
      //   if (result.modifiedCount === 0) {
      //     res.status(404).json({ message: 'User not found' });
      //     return;
      //   }
    
      //   res.status(200).json({ message: 'User updated successfully' });
      // });
    



    app.put('/update', async (req, res) => {
      const database = client.db("users");
      const post = database.collection("userLoginInfo");

      const updateData = req.body; // Assuming 'req.body' contains an array of objects
      console.log(updateData);


      // // Validate input data (optional, but recommended)
      // if (!Array.isArray(updateData) || updateData.length === 0) {
      //   return res.status(400).json({ message: 'Invalid update data provided' });
      // }

      // const updateDocs = updateData.map((singleData) => {
      //   try {
      //     // Extract values for update (adjust these based on your data structure)
      //     const id = new ObjectId(`${singleData.new_id}`); // Assuming 'id' is a key in each object
      //     const newTotal = singleData.new_total;
      //     const newLike = singleData.new_like;

      //     return {
      //       updateOne: {
      //         filter: { _id: id },
      //         update: { $set: { total: newTotal, like: newLike } },
      //       },
      //     };
      //   } catch (err) {
      //     console.error(`Error processing update for ID: ${singleData.new_id}`, err);
      //     return null; // Skip updating this document on error
      //   }
      // });

      // // Filter out invalid update objects (optional, but recommended)
      // const filteredUpdateDocs = updateDocs.filter(Boolean); // Remove null values

      // if (filteredUpdateDocs.length === 0) {
      //   return res.status(400).json({ message: 'No valid updates found' });
      // }

      // try {
      //   const results = await post.bulkWrite(filteredUpdateDocs);
      //   const updatedCount = results.modifiedCount;
      //   res.status(200).json({ message: `${updatedCount} documents updated successfully` });
      // } catch (err) {
      //   console.error('Error updating documents:', err);
      //   res.status(500).json({ message: 'Error updating documents' });
      // }
    });

    // Start the server
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } finally {
    // Ensure client closure even on errors (uncomment if needed)
    // await client.close();
  }
}

run().catch(console.dir);