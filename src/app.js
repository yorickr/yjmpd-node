import express      from 'express';
import jwt          from 'jwt-simple';
import filehound    from 'filehound';
import id3          from 'node-id3';

import Api          from './api.js';
import config       from '../config.json';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200);
    res.json({hello: "I am alive good sir."})
});

router.get('/songs/', (req, res) => {
    res.status(200);
    Api.get()
    .then((response) => console.log(response))
    .catch((error) => console.log(error));

    res.json({Hi: 'I am getting your songs'});
});

const parseFoundFiles = (files) => {
    return new Promise((resolve) => {
        const tags = files.map((file) => {
            return {songInfo: id3.read(file)};
        });
        resolve(tags);
    });
};

router.put('/update', (req, res) => {
    filehound.create()
    .paths(config.musicDir)
    .ext('mp3')
    .find()
    .then((foundFiles) => {
        parseFoundFiles(foundFiles)
        .then((taggedFiles) => {
            Api.put(taggedFiles)
            .then((response) => console.log(response))
            // .catch((error) => console.log(error));
        });
    });
    res.status(200);
    res.json({ok: "shit's done"});
});

export default router;
