const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express()
require('dotenv').config();
const port = process.env.port || 5000
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5bogalj.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('preloved').collection('categories')
        const productsCollection = client.db('preloved').collection('products')
        const usersCollection = client.db('preloved').collection('users');
        app.get('/categories', async (req, res) => {
            const query = {}
            const cursor = categoriesCollection.find(query)
            const categories = await cursor.toArray();
            res.send(categories);
        })
        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const cursor = productsCollection.find(query)
            const result = await cursor.toArray();
            res.send(result);
        })
        app.post("/users", async (req, res) => {
            const user = req.body;
            console.log(user);
            // TODO: make sure you do not enter duplicate user email
            // only insert users if the user doesn't exist in the database
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


    }
    finally {

    }
}
run().catch(err => console.error(err))






app.get('/', (req, res) => {
    res.send('Preloved server is running')
})
app.listen(port, () => {
    console.log(`Preloved server running on ${port}`)
})