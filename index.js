const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const admin = require('firebase-admin');
const serviceAccount = require("./volunteer--network-firebase-adminsdk-um2n1-e06fb4e34a.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://volunteer--network.firebaseio.com"
});

const { DB_USER, DB_PASS, DB_NAME, DB_REGISTERS_COLLECTION, DB_VOLUNTEERING_SCOPES_COLLECTION, PORT } = process.env;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.u7nut.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    console.log(err ? err : 'connected to mongodb');
    const registerCollection = client.db(`${DB_NAME}`).collection(`${DB_REGISTERS_COLLECTION}`);
    const volunteeringScopesCollection = client.db(`${DB_NAME}`).collection(`${DB_VOLUNTEERING_SCOPES_COLLECTION}`);



    app.get('/', (req, res) => {
        res.send('<h1> Welcome to Volunteer Network Database</h1>');
    });

    app.get('/volunteeringScopes', (req, res) => {
        volunteeringScopesCollection.find({})
            .toArray((err, collection) => {
                res.send(collection);
                console.log(err ? err : 'Successfully found all Scopes Objects')
            })
    });

    app.get('/registrationInfo', (req, res) => {
        registerCollection.find({})
            .toArray((err, collection) => {
                console.log(err ? err : 'Successfully found all Registration information');
                res.send(collection);
            })
    })


    app.post('/addVolunteeringScope', (req, res) => {
        volunteeringScopesCollection.insertOne(req.body)
            .then(result => {
                console.log(result.insertedCount)
                if (result.insertedCount > 0) {
                    res.sendStatus(200);
                    console.log('Posted Successfully')
                }
                else (console.log(result))
            })
    });

    app.delete('/deleteEvent/', (req, res) => {
        volunteeringScopesCollection.deleteOne({ _id: ObjectId(req.query.id) })
            .then(result => {
                console.log(result.deletedCount)
                if (result.deletedCount > 0) {
                    res.sendStatus(200);
                    console.log('Deleted Successfully')
                }
                else (console.log(result))
            })
    })

    app.post('/registerForVolunteering', (req, res) => {
        registerCollection.insertOne(req.body)
            .then(result => {
                console.log(result.insertedCount)
                if (result.insertedCount > 0) {
                    res.sendStatus(200);
                    console.log('Posted Successfully')
                }
                else (console.log(result))
            })
    });

    app.get('/getUserEvents/', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const token = bearer.split(' ');

            admin.auth().verifyIdToken(token[1])
                .then(decodedToken => {
                    const uniqueIdFromToken = decodedToken.uid;

                    registerCollection.find({ uniqueId: uniqueIdFromToken })
                        .toArray((err, collections) => {
                            res.send(collections);
                            console.log(err ? err : 'Successfully Found Users Events')
                        })
                })
                .catch(error => {
                    console.log(error);
                });
        }
    });

    app.delete('/cancelRegistration/', (req, res) => {
        registerCollection.deleteOne({ _id: ObjectId(req.query.id) })
            .then(result => {
                console.log(result.deletedCount)
                if (result.deletedCount > 0) {
                    res.sendStatus(200);
                    console.log('Deleted Successfully')
                }
                else (console.log(result))
            })
    });


});

app.listen(PORT || 4444)