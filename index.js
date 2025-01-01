const express = require("express");
const app = express();
const SSLCommerzPayment = require("sslcommerz-lts");
const store_id = "yag67480e3f80d91";
const store_passwd = "yag67480e3f80d91@ssl";
const is_live = false; //true for live, false for sandbox
const http = require("http");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { Server, Socket } = require("socket.io");
var ObjectId = require("mongodb").ObjectId;

const cors = require("cors");
const { permission } = require("process");
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    // Create HTTP server and Socket.io instance
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*", // Replace with specific origins if needed
        methods: ["GET", "POST", "PUT"],
      },
    });

    // Connect Socket.io events
    io.on("connection", (socket) => {
      console.log("A user connected");

      socket.on("send_order", async (data) => {
        const myDB = client.db("menu");
        const myColl = myDB.collection(`cash`);

        const result = await myColl.insertOne(data);

        console.log(
          `A document was inserted with the _id: ${result.insertedId}`
        );

        socket.broadcast.emit("recive_order", data);
        socket.emit("order_sent", data);
      });
      socket.on("cancel_order", async (data) => {
        console.log("Received cancel_order:", data);

        const myDB = client.db("menu");
        const myColl = myDB.collection("cash");

        const filter = { _id: new ObjectId(data._id) };

        try {
          const updateResult = await myColl.updateOne(filter, {
            $set: { req: "cancel" },
          });

          if (updateResult.matchedCount === 0) {
            console.log(`Document with ID ${data._id} not found.`);
            socket.emit("documentNotFound", { message: "Document not found" });
          } else {
            console.log(`Document with ID ${data._id} updated successfully.`);
            socket.broadcast.emit("requested", { id: data._id, req: "cancel" });
          }
        } catch (err) {
          console.error("Error updating document:", err);
          socket.emit("internalServerError", {
            message: "Internal server error",
          });
        }
      });

      socket.on("updateToPrepare", async (data) => {
        const myDB = client.db("menu");
        const myColl = myDB.collection(`cash`);
        console.log(data);
        const id = data.id;
        const filter = { _id: new ObjectId(data.id) };
        const options = { upsert: true };
        if (data.status === "granted") {
          const update = {
            $set: {
              status: "granted",
            },
          };
          try {
            const updateResult = await myColl.updateOne(
              filter,
              update,
              options
            );

            if (updateResult.matchedCount === 0) {
              // Emit an event to the client indicating document not found
              socket.emit("documentNotFound", {
                message: "Document not found",
              });
            } else {
              // Emit an event to the client indicating success
              socket.broadcast.emit("statusGranted", { id, status: "granted" });
            }
          } catch (err) {
            console.error("Error updating document:", err);
            // Emit an event to the client indicating an internal server error
            socket.emit("internalServerError", {
              message: "Internal server error",
            });
          }
        } else if (data.status === "complete") {
          const update = {
            $set: {
              status: "complete",
              orderCompleteTime: data.orderCompleteTime,
            },
          };
          try {
            const updateResult = await myColl.updateOne(
              filter,
              update,
              options
            );

            if (updateResult.matchedCount === 0) {
              // Emit an event to the client indicating document not found
              socket.emit("documentNotFound", {
                message: "Document not found",
              });
            } else {
              // Emit an event to the client indicating success
              socket.broadcast.emit("statusGranted", {
                id,
                status: "complete",
              });
            }
          } catch (err) {
            console.error("Error updating document:", err);
            // Emit an event to the client indicating an internal server error
            socket.emit("internalServerError", {
              message: "Internal server error",
            });
          }
        } else if (data.status === "cancel") {
          const update = {
            $set: {
              status: "cancel",
              orderCompleteTime: data.orderCompleteTime,
            },
          };
          try {
            const updateResult = await myColl.updateOne(
              filter,
              update,
              options
            );

            if (updateResult.matchedCount === 0) {
              // Emit an event to the client indicating document not found
              socket.emit("documentNotFound", {
                message: "Document not found",
              });
            } else {
              // Emit an event to the client indicating success
              socket.broadcast.emit("statusGranted", { id, status: "cancel" });
            }
          } catch (err) {
            console.error("Error updating document:", err);
            // Emit an event to the client indicating an internal server error
            socket.emit("internalServerError", {
              message: "Internal server error",
            });
          }
        }
      });

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });


    // Pos
    app.post("/PosOrder", async (req, res) => {
      try {
        // Retrieve transaction ID with error handling
       console.log(req.body);
       const database = client.db("pos"); // Ensure client is properly connected
        const OrderCollection = database.collection("sizzle_orders");
        OrderCollection.insertOne(req.body).then((result) => {
          console.log("Order inserted successfully", result._id);
        });
       
      } catch (error) {
        console.error("An unexpected error occurred:", error);
        res.status(500).send("Internal server error. Please contact support.");
      }
    }); 

    app.get("/PosOrder", async (req, res) => {
      try {
        const database = client.db("pos");
        const post = database.collection("sizzle_orders");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });





    // start of order web
    //sslcommerz init
    app.post("/init", (req, res) => {
      console.log(req.body);
      const { price, phoneNumber, sector, road, house } = req.body;
      const tran_id = new ObjectId().toString();

      const data = {
        total_amount: price,
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success/${tran_id}`,
        fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "food",
        product_category: "food",
        product_profile: "general",
        cus_name: "Customer Name",
        cus_email: "customer@example.com",
        cus_add1: house,
        cus_add2: road,
        cus_add3: sector,
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: phoneNumber,
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        console.log("Redirecting to: ", GatewayPageURL);
        const finalOrder = req.body;
        finalOrder.paidStatus = false;
        finalOrder.tranId = tran_id;
        const database = client.db("menu");
        const collection = database.collection("cash");
        collection.insertOne(finalOrder).then((result) => {
          console.log("Order inserted successfully");
        });
      });
    });
    app.post("/payment/success/:tranId", async (req, res) => {
      try {
        // Retrieve transaction ID with error handling
        const { tranId } = req.params;

        const database = client.db("menu"); // Ensure client is properly connected
        const OrderCollection = database.collection("cash");

        // Update order with proper collection name and field
        const filter = { tranId: tranId };
        const update = { $set: { paidStatus: true } };
        const options = { update: true };

        const updateResult = await OrderCollection.updateOne(
          filter,
          update,
          options
        );

        // Handle update success and failure scenarios
        if (updateResult.modifiedCount > 0) {
          console.log(
            `Order with transaction ID ${tranId} successfully updated.`
          );
          res.redirect(`http://localhost:5173/payment/success/${tranId}`);
        }
      } catch (error) {
        console.error("An unexpected error occurred:", error);
        res.status(500).send("Internal server error. Please contact support.");
      }
    });
    app.post("/payment/fail/:tranId", async (req, res) => {
      try {
        // Retrieve transaction ID with error handling
        const { tranId } = req.params;

        const database = client.db("menu"); // Ensure client is properly connected
        const OrderCollection = database.collection("cash");

        // Delete order with matching transaction ID
        const deleteResult = await OrderCollection.deleteOne({
          tranId: tranId,
        });

        // Handle delete success and failure scenarios
        if (deleteResult.deletedCount > 0) {
          console.log(
            `Order with transaction ID ${tranId} successfully deleted.`
          );
          res.redirect(`http://localhost:5173/payment/failed/${tranId}`); // Redirect to a different success page for failed payment
        }
      } catch (error) {
        console.error("An unexpected error occurred:", error);
        res.status(500).send("Internal server error. Please contact support.");
      }
    });
    app.get("/getRecivedOrders", async (req, res) => {
      try {
        const database = client.db("menu");
        const post = database.collection("cash");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
    app.get("/getMenu", async (req, res) => {
      try {
        const database = client.db("menu");
        const post = database.collection("menu");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
    app.get("/getLastOrder/:tranID", async (req, res) => {
      const { tranID } = req.params;
      console.log(tranID);
    
      const database = client.db("menu");
      const post = database.collection("cash");
    
      try {
        // Use findOne method directly
        const result = await post.findOne({ tranID: tranID });
    
        if (result) {
          res.send(result);
        } else {
          res.status(404).json({ message: "Order not found" });
        }
      } catch (error) {
        console.error("Error fetching rating document:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/getMenu/:category", async (req, res) => {
      try {
        const database = client.db("menu");
        const post = database.collection("menu");
        const documents = await post.find({}).toArray();

        const data = documents;
        res.json(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.get("/", (req, res) => {
      res.send("Hello, World!");
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
