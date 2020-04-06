const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

function getId(id) {
    return mongodb.ObjectId(id);
}

exports.getId = getId;

const url = 'mongodb://localhost:27017';

const dbName = 'uno';

let db = null;

exports.connect = function () {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, client) {
            if (err) return reject(err);
            console.log("Connected successfully to mongo server");
            db = client.db(dbName);
            resolve();
        });
    })
}

exports.find = function (collectionName, query) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName).find(query).toArray(function (err, result) {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

exports.findById = function (collectionName, id) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName).find({ _id: getId(id) }).toArray(function (err, result) {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

exports.insertOne = function (collectionName, insertObj) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName).insertOne(insertObj, function (err, res) {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

exports.updateOne = function (collectionName, queryObj, updateObj) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName).updateOne(queryObj, updateObj, function (err, res) {
            if (err) return reject(err);
            resolve(res);
        });
    });
}