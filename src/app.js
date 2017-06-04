import express      from 'express';
import jwt          from 'jwt-simple';
import cp           from 'child_process';

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
    const trackId = req.params.id || null;
    var query = Api.format('SELECT * FROM tracks;');
    if (trackId) {
        query = Api.format('SELECT * FROM tracks WHERE id = ?', [trackId]);
    }
    Api.execute(query)
    .then((resp) => {
        res.status(200);
        res.json(response(1, true, 'Here are your songs.', resp.results));
    })
    .catch((error) => {
        res.status(401);
        res.json(response(2, false, 'Something went wrong.', error));
    });
});

router.get('/artists/', (req, res) => {
});

router.get('/genres/', (req, res) => {
});

router.get('/years/', (req, res) => {
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
