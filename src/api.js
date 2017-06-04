import mysql from 'mysql';

import config from '../config.json';
import log from './logger.js';

const pool  = mysql.createPool({
    host     :  config.dbHostname,
    user     :  config.dbUsername,
    password :  config.dbPassword,
    database :  config.dbName,
});

export default {
    execute (query) {
        return new Promise((resolve, reject) => {
            pool.getConnection((error, connection) => {
                if (error) {
                    log('Something went wrong getting a connection');
                    reject(error);
                    return;
                } else {
                    connection.query(query, (error, results, fields) => {
                        connection.release();
                        if (error) {
                            log('Something went wrong querying the database');
                            reject(error);
                            return;
                        } else {
                            resolve({results, fields});
                        }
                    });
                }
            });
        });
    },

    format (query, data) {
        return mysql.format(query, data);
    }
};
