const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId

const admin = require("firebase-admin");
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ucxei.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];

      try {
          const decodedUser = await admin.auth().verifyIdToken(token);
          req.decodedEmail = decodedUser.email;
      }
      catch {

      }

  }
  next();
}

async function run() {
  try {
      await client.connect();
      const database = client.db('cars-portal');
      const carsCollection = database.collection('cars');
      const purchaseCollection = database.collection('purchase');
      const reviewCollection = database.collection('review');
      const usersCollection = database.collection('users');

      app.get('/cars', verifyToken, async (req, res) => {
          const email = req.query.email;
          const date = req.query.date;

          const query = { email: email, date: date }

          const cursor = carsCollection.find(query);
          const cars = await cursor.toArray();
          res.json(cars);
      })

      app.post('/cars', async (req, res) => {
          const appointment = req.body;
          const result = await carsCollection.insertOne(appointment);
          res.json(result)
      });


       //   single data get 
       app.get('/cars/:id', async (req, res) => {
        const id= req.params.id;
        const query ={_id: ObjectId(id)};
        console.log('get id')
        const result = await carsCollection.findOne(query);
        res.json(result);
      })



        //Update booking status
     app.patch('/cars/:id', (req, res) => {
        carsCollection.updateOne({ _id: ObjectId(req.params.id) },
            {
                $set: { status: req.body.status }
            })
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })
        // delete api 
  
        app.delete('/cars/:id',async(req,res)=>{
          const id= req.params.id;
          const query ={_id: ObjectId(id)};
          const result = await carsCollection.deleteOne(query);
          res.json(result);
        })


    //   check admin 
      app.get('/users/:email', async (req, res) => {
          const email = req.params.email;
          const query = { email: email };
          const user = await usersCollection.findOne(query);
          let isAdmin = false;
          if (user?.role === 'admin') {
              isAdmin = true;
          }
          res.json({ admin: isAdmin });
      })

   



      app.get('/purchase', async (req, res) => {
        const cursor = purchaseCollection.find({});
        const purchase = await cursor.toArray();
        res.json(purchase);

    })
       // post api

       app.post('/purchase',async(req,res)=>{
        const purchase = req.body; 
         const result = await purchaseCollection.insertOne(purchase);
         res.json(result);
      
     })


     
       //   single data get 
       app.get('/purchase/:id', async (req, res) => {
        const id= req.params.id;
        const query ={_id: ObjectId(id)};
        console.log('get id')
        const result = await purchaseCollection.findOne(query);
        res.json(result);
      })



        //Update booking status
     app.patch('/purchase/:id', (req, res) => {
        purchaseCollection.updateOne({ _id: ObjectId(req.params.id) },
            {
                $set: { status: req.body.status }
            })
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })
        // delete api 
  
        app.delete('/purchase/:id',async(req,res)=>{
          const id= req.params.id;
          const query ={_id: ObjectId(id)};
          const result = await purchaseCollection.deleteOne(query);
          res.json(result);
        })


     app.get('/review', async (req, res) => {
        const cursor = reviewCollection.find({});
        const orders = await cursor.toArray();
        res.send(orders);

    })
       app.post('/review',async(req,res)=>{
        const review = req.body; 
         const result = await reviewCollection.insertOne(review);
         res.json(result);
      
     })

      app.post('/users', async (req, res) => {
          const user = req.body;
          const result = await usersCollection.insertOne(user);
          console.log(result);
          res.json(result);
      });

      app.put('/users', async (req, res) => {
          const user = req.body;
          const filter = { email: user.email };
          const options = { upsert: true };
          const updateDoc = { $set: user };
          const result = await usersCollection.updateOne(filter, updateDoc, options);
          res.json(result);
      });


    //   make admin 
      app.put('/users/admin', verifyToken, async (req, res) => {
          const user = req.body;
          const requester = req.decodedEmail;
          if (requester) {
              const requesterAccount = await usersCollection.findOne({ email: requester });
              if (requesterAccount.role === 'admin') {
                  const filter = { email: user.email };
                  const updateDoc = { $set: { role: 'admin' } };
                  const result = await usersCollection.updateOne(filter, updateDoc);
                  res.json(result);
              }
          }
          else {
              res.status(403).json({ message: 'you do not have access to make admin' })
          }

      })

  }
  finally {
      // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Cars portal!')
})

app.listen(port, () => {
  console.log(`listening at ${port}`)
})

