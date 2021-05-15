const mongodb = require('mongodb');
const { MONGO_DB_URL, MONGO_DB_NAME } = require('../config');

let db = null;

class MongoDB {

    static ObjectId(id) {
        return mongodb.ObjectId(id);
    }

    static connect() {
        return new Promise((resolve, reject) => {
            mongodb.MongoClient.connect(MONGO_DB_URL, { useUnifiedTopology: true }, function (err, client) {
                if (err) return reject(err);
                console.log("Connected successfully to mongo server");
                db = client.db(MONGO_DB_NAME);
                resolve();
            });
        })
    }

    static findById(collectionName, id) {
        return new Promise((resolve, reject) => {
            db.collection(collectionName).findOne({ _id: this.ObjectId(id) }, function (err, result) {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static insertOne(collectionName, insertObj) {
        return new Promise((resolve, reject) => {
            db.collection(collectionName).insertOne(insertObj, function (err, res) {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }

    static updateById(collectionName, id, updateObj) {
        return new Promise((resolve, reject) => {
            db.collection(collectionName).updateOne({ _id: this.ObjectId(id) }, updateObj, function (err, res) {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }
}

module.exports = MongoDB;