const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra')
const admin = require("firebase-admin");
const serviceAccount = require("./config/creative-agency-4ad25-firebase-adminsdk-4w6uy-24f68a0cfd.json");
require('dotenv').config();

const port = 8080

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('service'));
app.use(fileUpload());

const uri = `mongodb+srv://adminUser:singleforever@cluster0.kqm2a.mongodb.net/CreativeAgency?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });




admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.FIRE_DB}`
});


client.connect(err => {
  const ordersCollection = client.db("CreativeAgency").collection("orders");
  const reviewCollection = client.db("CreativeAgency").collection("customerReview");
  const adminList = client.db("CreativeAgency").collection("admin");
  const serviceList = client.db("CreativeAgency").collection("services");

  app.post('/addOrder', (req, res) => {
    const newOrder = req.body;
    ordersCollection.insertOne(newOrder)
      .then(result => {
        res.send(result);
      })

  })
  app.post('/addReview', (req, res) => {
    const newReview = req.body;
    reviewCollection.insertOne(newReview)
      .then(result => {
        res.send(result);
      })

  })

  app.get('/userService', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            ordersCollection.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents)
              })
          }
          else {
            res.status(401).send('un-authorize access')
          }
        }).catch(function (error) {
          res.status(401).send('un-authorize access')
        });

    }

    else {
      res.status(401).send('un-authorize access')
    }

  })

  app.get('/userReview', (req, res) => {
    reviewCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })

  })

  // 
  // 
  // 
  // Admin Pannel Codes
  // 
  // 
  // 

  // add admin

  app.post('/makeAdmin', (req, res) => {
    const newService = req.body;
    adminList.insertOne(newService)
      .then(result => {
        res.send(result);
      })
  })

  // find admin for admin login

  app.get('/findAdmin', (req, res) => {
    adminList.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

  //  show all orders

  app.get('/allOrder', (req, res) => {
    ordersCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

  // add services

  app.post('/addServices', (req, res) => {
    const file = req.files.file;
    const serviceTitle = req.body.serviceTitle;
    const serviceDiscription = req.body.serviceDiscription;

    const newImg = file.data;
    const encImg = newImg.toString('base64');
    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    }
    serviceList.insertOne({ image, serviceTitle, serviceDiscription })
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  // find all services (new services & old services)

  app.get('/allService', (req, res) => {
    serviceList.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

  app.get('/admin', (req, res) => {
    const email = req.query.email;
    adminCollection.find({ email })
      .toArray((err, collection) => {
        res.send(collection.length > 0)
      })

  })

});

// Database Check

app.get('/', (req, res) => {
  res.send('nice work')
})

app.listen(process.env.PORT || port, () => {
  console.log('success')
})