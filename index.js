const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
var ObjectId = require('mongodb').ObjectId;

const cors = require('cors');
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())






const uri = "mongodb+srv://inventory:inventory@cluster0.ffl8g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    

    app.get('/users', async (req, res) => {

      try {
        const database = client.db("users");
        const post = database.collection("userLoginInfo");
        const documents = await post.find({}).toArray();

        const data = documents;
        // Print the document returned by findOne()
        res.json(data)
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });




    app.post("/addPic", async (req, res) => {

      const newUser = req.body;
      console.log("called");
      console.log(newUser);




      const myDB = client.db("users");
      const myColl = myDB.collection(`userLoginInfo`);

      const result = await myColl.insertOne(newUser);

      console.log(
        `A document was inserted with the _id: ${result.insertedId}`,
      );




    });


    app.put('/update', async (req, res) => {
      const database = client.db("users");
      const post = database.collection("userLoginInfo");

      const updateData = req.body; // Assuming 'req.body' contains an array of objects

      // Validate input data (optional, but recommended)
      if (!Array.isArray(updateData) || updateData.length === 0) {
        return res.status(400).json({ message: 'Invalid update data provided' });
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
        return res.status(400).json({ message: 'No valid updates found' });
      }

      try {
        const results = await post.bulkWrite(filteredUpdateDocs);
        const updatedCount = results.modifiedCount;
        res.status(200).json({ message: `${updatedCount} documents updated successfully` });
      } catch (err) {
        console.error('Error updating documents:', err);
        res.status(500).json({ message: 'Error updating documents' });
      }
    });

    // app.get('/users', async (req, res) => {

    //   try {
    //     const database = client.db("users");
    //     const post = database.collection("userLoginInfo");
    //     const documents = await post.find({}).toArray();

    //     // Query for a movie that has the title 'The Room'
    //     // const query = { _id: new ObjectId(`user_${id}`) };

    //     // Execute query
    //     // const data = await post.findOne(query);
    //     // console.log(documents);
    //     const data = documents;
    //     // Print the document returned by findOne()
    //     res.json(data)
    //   } catch (error) {
    //     console.error('Error fetching data:', error);
    //     res.status(500).json({ message: 'Server error' });
    //   }
    //   });

    // app.post("/users", async (req, res) => {

    //   if (req.body.data.user_key == "user") {
    //     console.log("called");
    //     console.log(req.body);
    //     const newUser = req.body.data.user
    //     // const id = req.body.length +1
    //     // newUser._id = id
    //     console.log(newUser);




    //     const myDB = client.db("users");
    //     const myColl = myDB.collection(`userLoginInfo`);

    //     const result = await myColl.insertOne(newUser);

    //     console.log(
    //        `A document was inserted with the _id: ${result.insertedId}`,
    //     );
    //   }else if (req.body.data.user_key == "course") {
    //     console.log("called");
    //     console.log(req.body.data);
    //     const newUser = req.body.data.course_data
    //     // const id = req.body.length +1
    //     // newUser._id = id
    //     console.log(newUser);




    //     const myDB = client.db("user_courses");
    //     const myColl = myDB.collection(req.body.data.id);

    //     const result = await myColl.insertOne(newUser);

    //     console.log(
    //        `A document was inserted with the _id: ${result.insertedId}`,
    //     );

    //   }


    // });


    // app.get('/users/:id', async (req, res) => {
    //   const id = req.params.id
    //   try {
    //     const database = client.db("users");
    //     const post = database.collection("userLoginInfo");
    //     // Query for a movie that has the title 'The Room'
    //     const query = { _id: new ObjectId(`${id}`) };

    //     // Execute query
    //     const data = await post.findOne(query);
    //     // Print the document returned by findOne()
    //     res.send(data)
    //   } catch (error) {
    //     console.error('Error fetching data:', error);
    //     res.status(500).json({ message: 'Server error' });
    //   }
    //   });


    // app.get('/users/:id/courses', async (req, res) => {
    //   const id = req.params.id
    //   try {
    //     const database = client.db("user_courses");
    //     const post = database.collection(`${id}`);
    //     const data = await post.find({}).toArray();
    //     res.send(data)
    //   } catch (error) {
    //     console.error('Error fetching data:', error);
    //     res.status(500).json({ message: 'Server error' });
    //   }
    //   });



    // app.get('/users/:id/courses/:secondId', async (req, res) => {
    //   const id = req.params.id 
    //   const secondId = req.params.secondId
    //   try {
    //     const database = client.db("courses");
    //     const post = database.collection(secondId);
    //     const documents = await post.find({}).toArray();



    //     const data = documents;
    //     res.send(data)
    //   } catch (error) {
    //     console.error('Error fetching data:', error);
    //     res.status(500).json({ message: 'Server error' });
    //   }
    //   });


    // app.get('/users/:id/user_courses/:secondId', async (req, res) => {
    //   const id = req.params.id 
    //   const secondId = req.params.secondId
    //   try {
    //     const database = client.db("user_courses");
    //     const post = database.collection(id);
    //     const query = { name: `${secondId}` };

    //     // Execute query
    //     const data = await post.findOne(query);
    //     // Print the document returned by findOne()
    //     res.send(data)
    //     // const data = documents;
    //     // res.send(data)
    //   } catch (error) {
    //     console.error('Error fetching data:', error);
    //     res.status(500).json({ message: 'Server error' });
    //   }
    // });




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
  res.send("the server is running")
});

app.listen(port, () => {
  console.log(`listenning to ${port}`);
})






