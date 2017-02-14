import express      from 'express';
import jwt          from 'jwt-simple';
import filehound    from 'filehound';
import id3          from 'node-id3';
import kue          from 'kue';
import cp           from 'child_process';

import Api          from './api.js';
import config       from '../config.json';
import response     from './responses.js';
import scrobbler    from './scrobbler.js';
import log          from './logger.js';


const queue = kue.createQueue();
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200);
    res.json(response(0, true, 'I am alive and well good sir'));
});

router.get('/songs/', (req, res) => {

    Api.get({})
    .then((songs) => {
        res.status(200);
        res.json(response(1, true, 'Here are your songs.', songs));
    })
    .catch((error) => {
        res.status(401);
        res.json(response(1, false, 'Could not get your songs.', error));
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
    n.send({ start: true});
    res.status(200);
    res.json(response(2, true, 'Started updating the database.'));
});

export default router;
