const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r81fqjh.mongodb.net/?appName=Cluster0`;




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
    await client.connect();

    const db = client.db('plate-db')
    const foodCollection = db.collection('foods')
    const requestsCollection = db.collection("requests");


    // Available Foods
    app.get('/foods', async (req, res) => {
      const result = await foodCollection.find().toArray()

      res.send(result)
    })

    // Food Details
    app.get('/foods/:id', async (req, res) => {
      const { id } = req.params;
      const result = await foodCollection.findOne({ _id: new ObjectId(id) })

      res.send(result)
    })

    // Manage My Foods
    app.get("/myFoods/:email", async (req, res) => {
      const email = req.params.email;
      const result = await foodCollection.find({ donators_email: email }).toArray();

      res.send(result);
    });


    // Delete My Food
    app.delete("/foods/:id", async (req, res) => {
      const { id } = req.params;
      const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });

      res.send(result);
    });

    // Update My Foods
    app.put('/foods/:id', async (req, res) => {
      const { id } = req.params;
      const update = req.body; // validate on server in production
      const result = await foodCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );

      res.send(result);
    });


    // Featured Foods
    app.get("/featuredFoods", async (req, res) => {
      try {
        const pipeline = [
          {
            $addFields: { qtyMatch: { $regexFind: { input: "$food_quantity", regex: "\\d+" } } }
          },

          {
            $addFields: {
              qtyNumber: {
                $cond: [
                  { $gt: ["$qtyMatch.match", null] },
                  { $toInt: "$qtyMatch.match" },
                  0]
              }
            }
          },
          { $sort: { qtyNumber: -1, created_at: -1 } },
          { $limit: 6 },
          { $project: { qtyMatch: 0, qtyNumber: 0 } }
        ];

        const results = await foodCollection.aggregate(pipeline).toArray();
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: "Could not fetch featured foods" });
      }
    });


    // post method
    app.post('/foods', async (req, res) => {
      const data = req.body;
      const result = await foodCollection.insertOne(data)

      res.send(result)
    })

    // ========================
    // Request Section
    // ========================

    app.post("/requests", async (req, res) => {
      try {
        const requestData = req.body;

        if (!requestData.foodId || !requestData.requester_email) {
          return res.status(400).send({ message: "Missing required fields" });
        }

        // find the food item to get donator details
        const food = await foodCollection.findOne({
          _id: new ObjectId(requestData.foodId),
        });

        if (!food) {
          return res.status(404).send({ message: "Food not found" });
        }

        // attach donator information to request
        requestData.donators_email = food.donators_email;
        requestData.donators_name = food.donators_name;
        requestData.donators_image = food.donators_image;

        const result = await requestsCollection.insertOne(requestData);

        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });



    // My Requests
    app.get("/requests/user/:email", async (req, res) => {
      const email = req.params.email;

      const result = await requestsCollection.find({ requester_email: email }).toArray();
      res.send(result);
    });



    // Who requested my food
    app.get("/requests/donator/:email", async (req, res) => {
      const email = req.params.email;

      const result = await requestsCollection.find({ donators_email: email }).toArray();
      res.send(result);
    });



    // Update requests status
    app.patch("/requests/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;

      const result = await requestsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      res.send(result);
    });


    // Delete a Request
    app.delete("/requests/:id", async (req, res) => {
      const id = req.params.id;

      const result = await requestsCollection.deleteOne({ _id: new ObjectId(id) });

      res.send(result);
    });

    









    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Plate Share listening on port ${port}`)
})
