const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const Mongo = require("mongodb");

const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017?retryWrites=true&writeConcern=majority";
const client = new MongoClient(uri);

app.use(fileUpload());

app.post('/upload/:id', async function (req, res) {
    var id = req.params.id || '';
    let sampleFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    sampleFile = req.files.sampleFile;

    var collection = client.db("isletim").collection("photos");
    await client.connect();
    var inserted = await collection.insertOne({ "userId": id, "name": sampleFile.name});
    var insertedid = JSON.parse(JSON.stringify(inserted)).insertedId;

    uploadPath = __dirname + '/img/' + insertedid + "-" + sampleFile.name;

    sampleFile.mv(uploadPath, function (err) {
        if (err)
            return res.status(500).send(err);
        res.redirect('http://localhost:3030/gallery/'+id);
    });
});

app.set('view engine', 'ejs');

app.get("/gallery/:id", async function (req, res) {
    var id = req.params.id || '';

    await client.connect();
    var photoCollection = client.db("isletim").collection("photos");
    var myphotos = await photoCollection.find({ "userId": id }).toArray();

    res.render("gallery", { id: id, photos: myphotos });
})

app.get("/upload/:id", async function (req, res) {
    var id = req.params.id || '';

    res.render("upload", { id: id });
})

app.use(express.json());

app.post('/', async function (req, res) {
    var collection = client.db("isletim").collection("users");
    await client.connect();
    var user = await collection.findOne({ "username": req.body.username, "pass": req.body.password });
    if (user) {
        var id = JSON.parse(JSON.stringify(user))._id;
        res.send(id);
    }
    else {
        res.send("no");
    }
});

app.post('/sign', async function (req, res) {
    var collection = client.db("isletim").collection("users");
    await client.connect();
    var user = await collection.findOne({ "username": req.body.username, "pass": req.body.password });
    if (user) {
        res.send("no");
    }
    else {
        var inserted = await collection.insertOne({ "username": req.body.username, "pass": req.body.password });
        var insertedid = JSON.parse(JSON.stringify(inserted)).insertedId;
        res.send(insertedid);
    }
});

app.use("/img/", express.static('img'));

app.use("/", express.static('public'));

app.listen(3030);