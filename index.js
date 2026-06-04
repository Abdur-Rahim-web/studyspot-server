const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const verifyJWT = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Please log in first' });
    }

    const token = authHeader?.split(' ')[1];
    if (!token) {
        return res.status(401).send({ message: 'Token not found' });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log(payload);
        next();
    } catch (error) {
        return res.status(403).send({ message: 'Forbidden' });
    }
};



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db('studyspot');
        const roomsCollection = database.collection('rooms');

        // Rooms API
        app.get('/rooms', async (req, res) => {
            const result = await roomsCollection.find().toArray();
            res.send(result);
        });

        app.get('/rooms/:id', verifyJWT, async (req, res) => {
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

        app.post('/rooms', verifyJWT, async (req, res) => {
            const newRoom = req.body;
            const result = await roomsCollection.insertOne(newRoom);
            res.send(result);
        });

        app.patch('/rooms/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const updatedRoom = req.body;
            const result = await roomsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedRoom }
            );
            res.send(result);
        });

        app.delete('/rooms/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const result = await roomsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Bookings API
        const bookingsCollection = database.collection('bookings');

        app.post('/bookings', verifyJWT, async (req, res) => {
            const newBooking = req.body;
            const result = await bookingsCollection.insertOne(newBooking);
            res.send(result);
        });

        app.get('/bookings/:userId', verifyJWT, async (req, res) => {
            const userId = req.params.userId;
            const result = await bookingsCollection.find({ userId: userId }).toArray();
            res.send(result);
        });

        app.delete('/bookings/:bookingId', verifyJWT, async (req, res) => {
            const bookingId = req.params.bookingId;
            const result = await bookingsCollection.deleteOne({ _id: new ObjectId(bookingId) });
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