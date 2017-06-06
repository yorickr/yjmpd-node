import express      from 'express';
import jwt          from 'jwt-simple';
import cp           from 'child_process';

import Api                  from './api.js';
import formatResponse       from './responses.js';
import log                  from './logger.js';

const router = express.Router();

var realFs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

const PAGE_SIZE = 50;

const flattenArrayOfObjects = (array, elemParam = null) => {
    const reduced = array.reduce((prev, curr) => {
        prev.push(elemParam ? curr[elemParam] : curr);
        return prev;
    }, []);
    return reduced;
};

router.get('/', (req, res) => {
    res.status(200);
    res.json(formatResponse(0, true, 'I am alive and well good sir'));
});

router.get('/song/:id/:preserveFileName?', (req, res) => {
    const trackId = req.params.id || null;
    const preserveFileName = req.params.preserveFileName || true;
    const query = Api.format('SELECT path,trackFormat FROM tracks WHERE id = ?', [trackId]);
    Api.execute(query)
    .then((response) => {
        if (response.results.length === 1) {
            const { path, trackFormat } = response.results[0];
            var fileName = '' + trackId + (trackFormat ? '.' + trackFormat : '.mp3');
            if (preserveFileName === 'true') {
                fileName = null;
            }
            res.download(path, fileName, (error) => {
                if (error) {
                    console.log('An error occured while sending ' + path);
                    throw error;
                }
            });
        } else {
            res.status(401);
            res.json(formatResponse(3, false, 'That song is not contained in the database.', {trackId}));
        }
    })
    .catch((error) => {
        res.status(401);
        res.json(formatResponse(2, false, 'Something went wrong', error));
        throw error;
    });
});

// Song by id or all songs
router.get('/songs/:page?/:id?', (req, res) => {
    const trackId = req.params.id || null;
    const page = req.params.page || 0;
    // TODO: fix pagination in other calls
    var query = Api.format('SELECT * FROM tracks LIMIT ? OFFSET ?;', [ PAGE_SIZE, page * PAGE_SIZE ]);
    if (trackId) {
        query = Api.format('SELECT * FROM tracks WHERE id = ?;', [trackId]);
    }
    Api.execute(query)
    .then((resp) => {
        res.status(200);
        res.json(formatResponse(1, true, 'Here are your songs.', resp.results));
    })
    .catch((error) => {
        res.status(401);
        res.json(formatResponse(2, false, 'Something went wrong.', error));
        throw error;
    });
});

router.get('/albums/:page?/', (req, res) => {
    const page = req.params.page || 0;
    const query = Api.format('SELECT album FROM tracks GROUP BY album LIMIT ?,?;', [ page * PAGE_SIZE, (page + 1) * PAGE_SIZE]);
    Api.execute(query)
    .then((resp) => {
        res.status(200);
        const reduced = flattenArrayOfObjects(resp.results, 'album');
        res.json(formatResponse(1, true, 'Here are your albums.', reduced));
    })
    .catch((error) => {
        res.status(401);
        res.json(formatResponse(2, false, 'Something went wrong.', error));
        throw error;
    });
});

router.get('/artists/:page?', (req, res) => {
    const page = req.params.page || 0;
    const query = Api.format('SELECT artist FROM tracks GROUP BY artist LIMIT ?,?;', [ page * PAGE_SIZE, (page + 1) * PAGE_SIZE]);
    Api.execute(query)
    .then((resp) => {
        res.status(200);
        const reduced = flattenArrayOfObjects(resp.results, 'artist');
        res.json(formatResponse(1, true, 'Here are your artists.', reduced));
    })
    .catch((error) => {
        res.status(401);
        res.json(formatResponse(2, false, 'Something went wrong.', error));
        throw error;
    });
});

router.get('/genres/:page?', (req, res) => {
    const page = req.params.page || 0;
    const query = Api.format('SELECT genre FROM tracks GROUP BY genre LIMIT ?,?;', [ page * PAGE_SIZE, (page + 1) * PAGE_SIZE]);
    Api.execute(query)
    .then((resp) => {
        res.status(200);
        const reduced = flattenArrayOfObjects(resp.results, 'genre');
        res.json(formatResponse(1, true, 'Here are your genres.', reduced));
    })
    .catch((error) => {
        res.status(401);
        res.json(formatResponse(2, false, 'Something went wrong.', error));
        throw error;
    });
});

router.get('/years/:page?', (req, res) => {
    const page = req.params.page || 0;
    const query = Api.format('SELECT year FROM tracks GROUP BY year LIMIT ?,?;', [ page * PAGE_SIZE, (page + 1) * PAGE_SIZE]);
    Api.execute(query)
    .then((resp) => {
        res.status(200);
        const reduced = flattenArrayOfObjects(resp.results, 'year');
        res.json(formatResponse(1, true, 'Here are your years.', reduced));
    })
    .catch((error) => {
        res.status(401);
        res.json(formatResponse(2, false, 'Something went wrong.', error));
        throw error;
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
    res.json(formatResponse(2, true, 'Started updating the database.'));
});

export default router;
