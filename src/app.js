import express      from 'express';
import jwt          from 'jwt-simple';
import cp           from 'child_process';
import {ObjectID}   from 'mongodb';

import Api          from './api.js';
import response     from './responses.js';
import log          from './logger.js';

const router = express.Router();

var realFs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

router.get('/', (req, res) => {
    res.status(200);
    res.json(response(0, true, 'I am alive and well good sir'));
});

// Song by id or all songs
router.get('/songs/:id?', (req, res) => {
    const id = req.params.id || null;
    let apiPromise = null;
    if (id) {
        const filter = {'_id': new ObjectID(id)};
        apiPromise = Api.get(filter);
    } else {
        apiPromise = Api.get();
    }
    apiPromise
    .then((songs) => {
        res.status(200);
        res.json(response(1, true, 'Here are your songs.', songs));
    })
    .catch((error) => {
        res.status(401);
        res.json(response(1, false, 'Could not get your songs.', error));
    });
});

router.get('/genre/', (req, res) => {
    const filters = [
        {$match: {songInfo: { common: { genre: {'$exists': true}}}}}
    ];
    log(filters);
    Api.aggregate(filters)
    .then((genres) => {
        log(genres);
        res.status(200);
        res.json(response(1, true, 'Here are your genres.', genres));
    })
    .catch((error) => {
        res.status(401);
        res.json(response(1, false, 'Could not get your genres.', error));
    });
});

router.put('/database', (req, res) => {
    const n = cp.fork(`${__dirname}/scrobbler.js`);
    n.on('message', (m) => {
        log('Parent');
        log(m);
        if (m.success) {
            log('Succesfully scrobbled for songs');
        }
    });
    n.send({start: true});
    res.status(200);
    res.json(response(2, true, 'Started updating the database.'));
});

export default router;
