
const express = require("express");
const app = express();
const http = require('http');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { Server, Socket } = require("socket.io");
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


        const isTaken = await myColl.findOne({ userName: data.userData.userName });
        if (isTaken === null) {

          const result = await myColl.insertOne(data.userData);



          // console.log(result.insertedId); // Output: ObjectId("6464252729455d5810000000")

          // Retrieve the full document with its _id
          const insertedDocument = await myColl.findOne({ _id: result.insertedId });
          console.log(insertedDocument);

          socket.emit("newUser_msg", { isSigned: true, msg: "You have been signed in" });
          socket.broadcast.emit("receive_newUser", insertedDocument);


        } else {
          socket.emit("newUser_msg", { isSigned: false, msg: "this username is taken" });
        }



      });
      socket.on("send_postLike", async (data) => {
        // console.log("data",data);

        const database = client.db("users");
        const post = database.collection("userLoginInfo");


        const query = {
          _id: new ObjectId(data.id)
        };
        // console.log(query);

        const item = await post.findOne(query);

        // console.log("items: ",item);
        const posts = item.url
        //  console.log("posts: ",posts);

        let editArray = []
        for (let i = 0; i < posts.length; i++) {
          if (data.postId === posts[i].id) {
            editArray = posts[i].likes
          }

        }

        console.log(editArray);
        let update = {}
        if (data.add && !editArray.includes(data.userName)) {
          update = {
            $push: {
              "url.$[elem].likes": data.userName
            }
          };

          const filter = {
            _id: { $eq: new ObjectId(data.id) } // Replace with your actual document's _id
          };

          const options = {
            arrayFilters: [
              {
                "elem.id": { $eq: data.postId } // Update the object with this specific id in the url array (optional)
              }
            ]
          };

          const result = await post.updateOne(filter, update, options);

          if (result.modifiedCount > 0) {
            console.log("Document updated successfully:", result.modifiedCount);
          } else {
            console.log("No document found for the specified filter.");
          }

        } else if (!data.add && editArray.includes(data.userName)) {
          update = {
            $pull: {
              "url.$[elem].likes": data.userName
            }
          };

          const filter = {
            _id: { $eq: new ObjectId(data.id) } // Replace with your actual document's _id
          };

          const options = {
            arrayFilters: [
              {
                "elem.id": { $eq: data.postId } // Update the object with this specific id in the url array (optional)
              }
            ]
          };

          const result = await post.updateOne(filter, update, options);

          if (result.modifiedCount > 0) {
            console.log("Document updated successfully:", result.modifiedCount);
          } else {
            console.log("No document found for the specified filter.");
          }
        } else {
          console.log("no");


        }


      })






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










      socket.on('send_order', async (data) => {

        const myDB = client.db("menu");
        const myColl = myDB.collection(`cash`);

        const result = await myColl.insertOne(data);

        console.log(
          `A document was inserted with the _id: ${result.insertedId}`,
        );
        
        socket.broadcast.emit("recive_order", data)
        socket.emit("order_sent", data)

        // const database = client.db("users");
        // const post = database.collection("userLoginInfo");

        // const updateData = data.data; // Assuming 'data.data' contains an array of objects

        // console.log(updateData);
        // console.log(data);
      });
      socket.on('cancel_order', async (data) => {
        console.log(data);
        const myDB = client.db("menu");
        const myColl = myDB.collection(`cash`);
        console.log(data);
        const id = data._id
        const filter = { _id: new ObjectId(id) }
        const options = { upsert: true }
        const update = {
          $set: {
            req: "cancel"
          }
        };
        try {
          const updateResult = await myColl.updateOne(filter, update, options);
      
          if (updateResult.matchedCount === 0) {
            // Emit an event to the client indicating document not found
            socket.emit('documentNotFound', { message: 'Document not found' });
          } else {
            // Emit an event to the client indicating success
            socket.broadcast.emit('requested', { id ,req:"cancel"});
          }
        } catch (err) {
          console.error('Error updating document:', err);
          // Emit an event to the client indicating an internal server error
          socket.emit('internalServerError', { message: 'Internal server error' });
        }
       

        // const myDB = client.db("menu");
        // const myColl = myDB.collection(`cash`);

        // const result = await myColl.insertOne(data);

        // console.log(
        //   `A document was inserted with the _id: ${result.insertedId}`,
        // );
        
        // socket.broadcast.emit("recive_order", data)
        // socket.emit("order_sent", data)

      });
      
      socket.on('updateToPrepare', async (data) => {

        const myDB = client.db("menu");
        const myColl = myDB.collection(`cash`);
        console.log(data);
        const id = data.id
        const filter = { _id: new ObjectId(data.id) }
        const options = { upsert: true }
        if (data.status === "granted") {
          const update = {
            $set: {
              status: "granted"
            }
          };
          try {
            const updateResult = await myColl.updateOne(filter, update, options);
        
            if (updateResult.matchedCount === 0) {
              // Emit an event to the client indicating document not found
              socket.emit('documentNotFound', { message: 'Document not found' });
            } else {
              // Emit an event to the client indicating success
              socket.broadcast.emit('statusGranted', { id ,status:"granted"});
            }
          } catch (err) {
            console.error('Error updating document:', err);
            // Emit an event to the client indicating an internal server error
            socket.emit('internalServerError', { message: 'Internal server error' });
          }
        
        }else if (data.status === "complete") {
          const update = {
            $set: {
              status: "complete",
              orderCompleteTime: data.orderCompleteTime

            }
          };
          try {
            const updateResult = await myColl.updateOne(filter, update, options);
        
            if (updateResult.matchedCount === 0) {
              // Emit an event to the client indicating document not found
              socket.emit('documentNotFound', { message: 'Document not found' });
            } else {
              // Emit an event to the client indicating success
              socket.broadcast.emit('statusGranted', { id, status:"complete" });
            }
          } catch (err) {
            console.error('Error updating document:', err);
            // Emit an event to the client indicating an internal server error
            socket.emit('internalServerError', { message: 'Internal server error' });
          }
        }else if (data.status === "cancel") {
          const update = {
            $set: {
              status: "cancel",
              orderCompleteTime: data.orderCompleteTime

            }
          };
          try {
            const updateResult = await myColl.updateOne(filter, update, options);
        
            if (updateResult.matchedCount === 0) {
              // Emit an event to the client indicating document not found
              socket.emit('documentNotFound', { message: 'Document not found' });
            } else {
              // Emit an event to the client indicating success
              socket.broadcast.emit('statusGranted', { id, status:"cancel" });
            }
          } catch (err) {
            console.error('Error updating document:', err);
            // Emit an event to the client indicating an internal server error
            socket.emit('internalServerError', { message: 'Internal server error' });
          }
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
    app.get(`/get_user/:id`, async (req, res) => {
      const database = client.db("users");
      const post = database.collection("userLoginInfo");


      const query = {
        _id: new ObjectId(req.params.id)
      };
      console.log(query);

      const item = await post.findOne(query);

      console.log(item);

      if (item === null) {
        res.send({ permission: false })
      } else {
        item.password = ""
        res.send(item)

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








    // start of order web
    app.get('/getRecivedOrders', async (req, res) => {

      try {
        const database = client.db("menu");
        const post = database.collection("cash");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });
    app.get('/getMenu', async (req, res) => {

      try {
        const database = client.db("menu");
        const post = database.collection("menu");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });



    app.get('/getMenu/:category', async (req, res) => {

      try {
        const database = client.db("menu");
        const post = database.collection("menu");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });



    // end of order web








    app.get('/orders', async (req, res) => {
      try {
        const database = client.db("tables");
        const post = database.collection("table");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });

    app.get('/tables/getMenu', async (req, res) => {
      const tableNum = req.params.table_num
      try {
        const database = client.db("menu");
        const post = database.collection("items");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });










    app.put('/addPick', async (req, res) => {
      const updatedUserPic = req.body;
      const database = client.db("users");
      const post = database.collection("userLoginInfo");
      const filter = { _id: new ObjectId(updatedUserPic.id) }
      const options = { upsert: true }

      console.log(updatedUserPic);
      const update = {
        $push: {
          url: {
            $each: [updatedUserPic.newUrl]
          }
        }
      }

      try {
        const updateResult = await post.updateOne(filter, update, options);

        if (updateResult.matchedCount === 0) {
          return res.status(404).json({ message: 'Document not found' });
        }

        res.json({ message: 'Document updated successfully' });
      } catch (err) {
        console.error('Error updating document:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });


    app.get('/get_rating', async (req, res) => {
      try {
        const database = client.db("rating");
        const post = database.collection("rating");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });
    app.get('/get_rating/:id', async (req, res) => {
      try {
        const database = client.db("rating");
        const post = database.collection("rating");
        const id = req.params.id; // Get the ID from the URL parameter

        const document = await post.findOne({ _id: new ObjectId(id) }); // Find the document by ID

        if (document) {
          res.json(document);
        } else {
          res.status(404).json({ message: 'Document not found' });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });
    app.get('/rating/:id', async (req, res) => {
      const database = client.db("rating"); // Assuming client is a MongoDB client instance
      const post = database.collection("rating");
      const id = req.params.id;

      try {
        // Use findOne method directly
        const result = await post.findOne({ _id: new ObjectId(id) });

        if (!result) {
          // Handle case where no document is found
          return res.status(404).json({ message: 'Rating not found' });
        }

        res.send(result);
      } catch (error) {
        console.error('Error fetching rating document:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
    app.post('/set_rating', async (req, res) => {
      const updatedUserPic = req.body;
      const database = client.db("rating");
      const post = database.collection("rating");

      try {
        const updateResult = await post.insertOne(updatedUserPic);

        if (updateResult.matchedCount === 0) {
          return res.status(404).json({ message: 'Document not found' });
        }

        res.json(updateResult);
      } catch (err) {
        console.error('Error updating document:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
    app.delete('/deleteRating/:id', async (req, res) => {
      const database = client.db("rating");
      const post = database.collection("rating");
      const id = req.params.id
      const query = { _id: new ObjectId(id) }

      try {
        const result = await post.deleteOne(query);
        res.send(result)




      } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ message: 'Internal server error' });
      }

    });
    app.put('/set_rating/:id', async (req, res) => {
      const database = client.db("rating");
      const post = database.collection("rating");
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const options = { update: true }
      const updateOrder = req.body

      const order = {
        $set: {
          foodQuality: updateOrder.foodQuality,
          overallServiceQuality: updateOrder.overallServiceQuality,
          cleanliness: updateOrder.cleanliness,
          orderAccuracy: updateOrder.orderAccuracy,
          speedOfService: updateOrder.speedOfService,
          value: updateOrder.value,
          overallExperience: updateOrder.overallExperience,
          text: updateOrder.text,
          bill: updateOrder.bill - updateOrder.bill * 0.1
        }
      }

      try {
        const result = await post.updateOne(filter, order, options);
        res.send(result)




      } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ message: 'Internal server error' });
      }

    });

    app.put('/update', async (req, res) => {
      const database = client.db("users");
      const post = database.collection("userLoginInfo");

      const updateData = req.body; // Assuming 'req.body' contains an array of objects
      console.log(updateData);




    });
    app.get('/', (req, res) => {
      res.send('Hello, World!');

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
