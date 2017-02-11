import express      from 'express';
import jwt          from 'jwt-simple';
import filehound    from 'filehound';
import id3          from 'node-id3';
import fork         from 'es-fork';
import Queue        from 'bull';

import Api          from './api.js';
import config       from '../config.json';
import response     from './responses.js';
import scrobbler    from './scrobbler.js';
import log          from './logger.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200);
    res.json(response(0, true, 'I am alive and well good sir'));
});

router.get('/songs/', (req, res) => {

    Api.get({})
    .then((response) => {
        res.status(200);
        res.json(response(1, true, 'Here are your songs.', response));
    })
    .catch((error) => {
        res.status(401);
        res.json(response(1, false, 'Could not get your songs.', error));
    });
});

router.put('/database', (req, res) => {
    const updateQueue = Queue('Database updating', 6379, '127.0.0.1');

    updateQueue.process((job) => {
        log('Starting scrobbler');
        return scrobbler();
    });
    updateQueue.on('completed', function(job, result){
        console.log('Job\'s done ' + result);
    });
    updateQueue.add();
    res.status(200);
    res.json(response(2, true, 'Started updating the database.'));
});

export default router;
