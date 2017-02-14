import mongodb  from 'mongodb';
import config   from '../config.json';

const mongoClient = mongodb.MongoClient;

const url = config.dbUrl + config.dbName;

export default {
    getCollection () {
        return new Promise((resolve, reject) => {
            mongoClient.connect(url, (err, db) => {
                if (err) {
                    reject(err);
                } else {
                    const coll = db.collection('yjmpd');
                    resolve({coll, db});
                }
            });
        });
    },

    // Thou musn't forget to close thy db
    get (filter = {}) {
        return new Promise((resolve, reject) => {
            this.getCollection()
            .then(({coll, db}) => {
                coll.find(filter).toArray((err, result) => {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            })
            .catch((error) => {
                throw error;
            });
        });
    },

    put (values) {
        return new Promise((resolve, reject) => {
            this.getCollection()
            .then(({coll, db}) => {
                coll.insertMany(values, (err, result) => {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            })
            .catch((error) => {
                throw error;
            })
        });
    },

    del (valuesFilter) {
        return new Promise((resolve, reject) => {
            this.getCollection()
            .then(({coll, db}) => {
                const results = valuesFilter.map((filter) => {
                    coll.removeMany(filter, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            return result;
                        }
                    });
                });
                db.close();
                resolve(results);

            })
            .catch((error) => {
                throw error;
            });
        });
    },
}
