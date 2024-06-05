
const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors");
const port = 5000;


app.use(cors());
app.use(express.json());


function createToken(user) {
    const token = jwt.sign(
        {
            email: user.email,
        },
        "secret",
        { expiresIn: "7d" }
    );
    return token;
}

function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, "secret");
    if (!verify?.email) {
        return res.send("You are not authorized");
    }
    req.user = verify.email;
    next();
}

const uri = "mongodb+srv://saimun1513311:3RLUcmV3JypUo2el@cluster0.wk4ijl6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
        // Send a ping to confirm a successful connection
        const events = client.db("events");
        const userDB = client.db("userDB");
        const allEvent = events.collection("allEvent");
        const categories = events.collection("categories");
        const userCollection = userDB.collection("userCollection");

        //Routes

        app.post("/events", async (req, res) => {
            try {
                const eventData = req.body;
                const result = await allEvent.insertOne(eventData);
                res.status(201).send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to create event" });
            }
        });

        app.get("/events", async (req, res) => {
            try {
                const eventCursor = allEvent.find();
                const result = await eventCursor.toArray();
                res.status(200).send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to retrieve events" });
            }
        });

        app.get("/events/:id", async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ message: "Invalid event ID" });
                }
                const event = await allEvent.findOne({ _id: new ObjectId(id) });
                if (!event) {
                    return res.status(404).send({ message: "Event not found" });
                }
                res.status(200).send(event);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to retrieve event" });
            }
        });

        app.patch("/events/:id", async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ message: "Invalid event ID" });
                }
                const updateData = req.body;
                const result = await allEvent.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );
                if (result.matchedCount === 0) {
                    return res.status(404).send({ message: "Event not found" });
                }
                res.status(200).send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to update event" });
            }
        });

        app.delete("/events/:id", async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ message: "Invalid event ID" });
                }
                const result = await allEvent.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) {
                    return res.status(404).send({ message: "Event not found" });
                }
                res.status(200).send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to delete event" });
            }
        });



        // User


        app.post("/user", async (req, res) => {
            try {
                const user = req.body;
                const token = createToken(user);
                const isUserExist = await userCollection.findOne({ email: user?.email });
                if (isUserExist?._id) {
                    return res.send({
                        status: "success",
                        message: "Login success",
                        token,
                    });
                }
                await userCollection.insertOne(user);
                return res.send({ token });
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to create user" });
            }
        });

        app.get("/user/get/:id", async (req, res) => {
            try {
                const id = req.params.id;
                console.log(id);
                const result = await userCollection.findOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to retrieve user" });
            }
        });

        app.get("/user/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const result = await userCollection.findOne({ email });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to retrieve user" });
            }
        });

        app.patch("/user/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const userData = req.body;
                const result = await userCollection.updateOne(
                    { email },
                    { $set: userData },
                    { upsert: true }
                );
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to update user" });
            }
        });

        console.log("Database is connected");






    } finally {

    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Route is working");
});

app.listen(port, (req, res) => {
    console.log("App is listening on port :", port);
});










