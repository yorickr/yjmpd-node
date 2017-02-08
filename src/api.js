import mongodb  from 'mongodb';
import config   from '../config.json';

const mongoClient = mongodb.MongoClient;

const url = config.dbUrl + config.dbName;

export default class Api {
    getCollection () {
        return new Promise((resolve, reject) => {
            mongoClient.connect(url, (err, db) => {
                const coll = db.collection('yjpmd');
                if (err) {
                    db.close();
                    reject(err);
                } else {
                    resolve({coll, db});
                }
            });
        });
    }

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
                reject(error);
            });
        });
    }

    put () {
    }


}
