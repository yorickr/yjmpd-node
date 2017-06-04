// Express router
import express      from 'express';

import util         from 'util';

import bodyParser   from 'body-parser';
import moment       from 'moment';

import settings     from '../config.json';
import routes       from './app.js';

const app = express();

// Catches all uncaught errors and logs
// process.on('uncaughtException', (err) => {
//     console.log('An error occured')
//     console.log(err);
// });

console.log = (msg) => {
    const now = moment().format('MMMM Do YYYY, h:mm:ss a');
    process.stdout.write(util.format('[' + now + ']' + ' ' + JSON.stringify(msg, null, 2)) + '\n');
};

console.log('Starting thing');

app.set('apiPort', settings.apiPort);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.all('*', (req, res, next) => {
    console.log('CALL: ' + req.method + ' ' + req.url);
    next();
});

app.all('/api*/*', (req, res, next) => {
    // Set response header
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Accept,X-Access-Token,X-Key');
	// Set response contenttype
    res.contentType('application/json');
    next();
});

app.use('/api', routes);


// Start server
const PORT = process.env.PORT || app.get('apiPort');
const server = app.listen(PORT, () => {
    console.log('Actively listening on port ' + server.address().port);
});
