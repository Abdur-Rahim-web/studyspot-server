const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
const uri = process.env.MONGODB_URI;

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

        const database = client.db('studyspot');
        const roomsCollection = database.collection('rooms');

        app.get('/rooms', async (req, res) => {
            const result = await roomsCollection.find().toArray();
            res.send(result);
        });

        app.get('/rooms/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await roomsCollection.findOne(query);
            res.send(result);
        });

        app.get("/featured-rooms", async (req, res) => {

            const result = await roomsCollection
                .find()
                .sort({ createdAt: -1 })
                .limit(6)
                .toArray();

            res.send(result);

        });

        app.post('/rooms', async (req, res) => {
            const newRoom = req.body;
            const result = await roomsCollection.insertOne(newRoom);
            res.send(result);
        });

        app.patch('/rooms/:id', async (req, res) => {
            const id = req.params.id;
            const updatedRoom = req.body;
            const result = await roomsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedRoom }
            );
            res.send(result);
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});