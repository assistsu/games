const mongodb = require('mongodb');
const config = require('../config');

const ObjectId = mongodb.ObjectId;

let db = null;

function connect() {
    return new Promise((resolve, reject) => {
        mongodb.MongoClient.connect(config.mongodb.url, { useUnifiedTopology: true }, function (err, client) {
            if (err) return reject(err);
            console.log("Connected successfully to mongo server");
            db = client.db(config.mongodb.dbName);
            resolve();
        });
    })
}

function find(collectionName, query) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName).find(query).toArray(function (err, result) {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

function findOne(collectionName, query) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName).findOne(query, function (err, result) {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

function findById(collectionName, id) {
    return findOne(collectionName, { _id: ObjectId(id) });
}

function insertOne(collectionName, insertObj) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName).insertOne(insertObj, function (err, res) {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

function updateOne(collectionName, queryObj, updateObj) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName).updateOne(queryObj, updateObj, function (err, res) {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

function updateById(collectionName, id, updateObj) {
    return updateOne(collectionName, { _id: ObjectId(id) }, updateObj);
}

module.exports = {
    ObjectId,
    connect,
    find,
    findOne,
    findById,
    insertOne,
    updateOne,
    updateById,
}