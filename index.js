const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
require('dotenv').config();
const port = process.env.port || 5000
app.use(cors());
app.use(express.json());

// const jwt = require('jsonwebtoken');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5bogalj.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// function verifyJWT(req, res, next) {

//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//         return res.status(401).send('unauthorized access');
//     }

//     const token = authHeader.split(' ')[1];

//     jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
//         if (err) {
//             return res.status(403).send({ message: 'forbidden access' })
//         }
//         req.decoded = decoded;
//         next();
//     })

// }
async function run() {
    try {
        const categoriesCollection = client.db('preloved').collection('categories')
        const productsCollection = client.db('preloved').collection('products')
        const usersCollection = client.db('preloved').collection('users');
        const bookingsCollection = client.db('preloved').collection("bookingsCollection");
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== "admin") {
                return res.status(403).send({ message: "forbidden access" });
            }
            next();
        };

        const verifySeller = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== "seller") {
                return res.status(403).send({ message: "forbidden access" });
            }
            next();
        };
        // app.get('/categories', async (req, res) => {
        //     const query = {}
        //     const cursor = categoriesCollection.find(query)
        //     const categories = await cursor.toArray();
        //     res.send(categories);
        // })
        app.get("/categoryName", async (req, res) => {
            const query = {};
            const result = await productsCollection
                .find(query)
                .project({ category_name: 1 })
                .toArray();
            const unique = [...new Map(result.map((m) => [m.category_name, m])).values()];
            console.log(unique);
            res.send(unique);
        });
        // app.get('/categories/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { category_id: id };
        //     const cursor = productsCollection.find(query)
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })
        app.get("/category/:category", async (req, res) => {
            const category = req.params.category;
            const query = { category_name: category };
            const cursor = productsCollection.find(query)
            const result = await cursor.toArray();
            res.send(result);
        });
        app.post("/users", async (req, res) => {
            const user = req.body;
            console.log(user);
            // TODO: make sure you do not enter duplicate user email
            // only insert users if the user doesn't exist in the database
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        app.get("/users", async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === "admin" });
        });
        app.get("/users/seller/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === "seller" });
        });
        app.get("/allBuyers", async (req, res) => {
            // const email = req.query.email;
            const role = req.query.role;
            // console.log(email);
            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

            const query = {
                // email: email,
                role: role,
            };

            const allBuyers = await usersCollection.find(query).toArray();
            // console.log(products);
            res.send(allBuyers);
        });

        app.get("/allSellers", async (req, res) => {
            // const email = req.query.email;
            const role = req.query.role;
            // console.log(email);
            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

            const query = {
                // email: email,
                role: role,
            };

            const allSellers = await usersCollection.find(query).toArray();
            // console.log(products);
            res.send(allSellers);
        });
        app.put('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'Verified'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });


        app.get("/bookings", async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

            const query = { buyerEmail: email };

            const bookings = await bookingsCollection.find(query).toArray();
            console.log(bookings);
            res.send(bookings);
        });

        app.post("/bookings", async (req, res) => {
            const booking = req.body;

            const query = {

                product_name: booking.product_name,
            };

            const alreadyBooked = await bookingsCollection.find(query).toArray();

            // if (alreadyBooked.length) {
            //     const message = `Product already booked`;
            //     return res.send({ acknowledged: false, message });
            // }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });
        app.post("/products", async (req, res) => {
            const product = req.body;
            console.log(product);
            // TODO: make sure you do not enter duplicate user email
            // only insert users if the user doesn't exist in the database
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        app.get("/myProducts", async (req, res) => {
            const email = req.query.email;
            // console.log(email);
            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

            const query = { seller_email: email };

            const products = await productsCollection.find(query).toArray();
            // console.log(products);
            res.send(products);
        });
        app.get("/v2/category/:id", async (req, res) => {
            const id = req.params.id;
            const query = { cid: id };
            const result = await productsCollection.findOne(query);
            res.send(result);
        });

        // app.get("/category/:id", async (req, res) => {
        //   const id = req.params.id;
        //   const query = { _id: ObjectId(id) };
        //   const category = await categoryCollections.findOne(query);
        //   res.send(category);
        // });

        app.get("/category/:category", async (req, res) => {
            const category = req.params.category;
            const query = { category: category };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });
        app.post("/users", async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = {
                // buyerEmail: booking.buyerEmail,
                email: user.email,
            };

            const alreadySaved = await usersCollection.find(query).toArray();

            if (alreadySaved.length) {
                // const message = `You already have booked this book`;
                return res.send({ acknowledged: false });
            }
            // TODO: make sure you do not enter duplicate user email
            // only insert users if the user doesn't exist in the database
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        app.delete("/users/admin/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });
        app.patch("/seller/myProduct/:id", async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    // productStatus: 'sold',
                    isAdvertised: "yes",
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);

        });
        app.get("/seller/myProduct/:id", async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

            const query = { _id: ObjectId(id) }

            const result = await productsCollection.findOne(query);
            res.send(result);

        });
        app.get('/products', async (req, res) => {
            const isAdvertised = req.query.isAdvertised;
            const query = { isAdvertised: isAdvertised };
            const products = await productsCollection.find(query).toArray();
            res.send(products);

        })
        app.get('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.query.status;
            const query = { status: status };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
            console.log(users)

        })

        // app.get('/jwt', async (req, res) => {
        //     const email = req.query.email;
        //     const query = { email: email };
        //     const user = await usersCollection.findOne(query);
        //     if (user) {
        //         const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
        //         return res.send({ accessToken: token });
        //     }
        //     res.status(403).send({ accessToken: '' })
        // });


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