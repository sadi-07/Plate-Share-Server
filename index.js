const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require ("dotenv").config();
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


    // Available Foods
    app.get('/foods', async (req, res) => {
        const result = await foodCollection.find().toArray()

        res.send(result)
    })

    // Food Details
    app.get('/foods/:id', async (req, res) => {
        const { id } = req.params;
        const result = await foodCollection.findOne({ _id: new ObjectId(id)})

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


    // post method
    app.post('/foods', async (req, res) => {
        const data = req.body;
        const result = await foodCollection.insertOne(data)

        res.send(result)
    })









    
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
