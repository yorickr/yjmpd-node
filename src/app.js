import express  from 'express';

import jwt      from 'jwt-simple';

import Api      from './api.js';

import config   from '../config.json';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200);
    res.json({hello: "I am alive good sir."})
});

router.get('/songs/', (req, res) => {
    res.status(200);
    res.json({Hi: 'I am getting your songs'});
});

export default router;
