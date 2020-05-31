const mongodb = require('mongodb');
const config = require('../config');

let db = null;

class MongoDB {

    static ObjectId(id) {
        return mongodb.ObjectId(id);
    }

    static connect() {
        return new Promise((resolve, reject) => {
            mongodb.MongoClient.connect(config.mongodb.url, { useUnifiedTopology: true }, function (err, client) {
                if (err) return reject(err);
                console.log("Connected successfully to mongo server");
                db = client.db(config.mongodb.dbName);
                resolve();
            });
        })
    }

    static find(collectionName, query) {
        return new Promise((resolve, reject) => {
            db.collection(collectionName).find(query).toArray(function (err, result) {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static findOne(collectionName, query) {
        return new Promise((resolve, reject) => {
            db.collection(collectionName).findOne(query, function (err, result) {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static findById(collectionName, id) {
        return this.findOne(collectionName, { _id: this.ObjectId(id) });
    }

    static insertOne(collectionName, insertObj) {
        return new Promise((resolve, reject) => {
            db.collection(collectionName).insertOne(insertObj, function (err, res) {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }

    static updateOne(collectionName, queryObj, updateObj) {
        return new Promise((resolve, reject) => {
            db.collection(collectionName).updateOne(queryObj, updateObj, function (err, res) {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }

    static updateById(collectionName, id, updateObj) {
        return this.updateOne(collectionName, { _id: this.ObjectId(id) }, updateObj);
    }
}

module.exports = MongoDB;