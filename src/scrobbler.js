import filehound    from 'filehound';
import id3          from 'node-id3';
import mm           from 'music-metadata';
import fs           from 'fs';
import util         from 'util';

import config       from '../config.json';
import Api          from './api.js';
import log          from './logger.js';

const parseFoundFiles = (files) => {
    const tags = files.map((file) => {
        return new Promise((resolveParser, rejectParser) => {
            const audioStream = fs.createReadStream(file);
            mm.parseStream(audioStream, {native: true}, function (err, metadata) {
                audioStream.close();
                if (err) {
                    log('Error while parsing');
                    log(err);
                    rejectParser(err);
                }
                // Why change 'id3v2.3' into 'id3'? Because json doesn't like the dot in the naming.
                const tempData = metadata['id3v2.3'];
                delete metadata['id3v2.3'];
                metadata['id3'] = tempData;
                resolveParser({fileInfo: {path: file}, songInfo: metadata});
            });
        });
    });
    return Promise.all(tags);
};

const checkMongoResponse = (response) => {
    if (response.result && response.result.ok === 1) {
        return true;
    }
    return false;
};

const scrobbler = () => {
    // Wipe everything from db
    return Api.del([{}])
    .then((response) => {
        log('Deleted Database');
        // Fetch new files
        return filehound.create()
        .paths(config.musicDir)
        .ext('mp3')
        .find();
    })
    .then((foundFiles) => {
        log('Found files');
        return parseFoundFiles(foundFiles);
    })
    .then((taggedFiles) => {
        log('Uploading found files');
        return Api.put(taggedFiles);
    })
    .then((response) => {
        if (checkMongoResponse(response)){
            log('Succesfully updated database');
            return {success: true};
        } else {
            log('Error pushing data to database');
            return {success: false};
        }
    })
    .catch((error) => {
        log('An error occured in scrobbler.js');
        throw error;
    });
};

process.on('message', (m) => {
    console.log('CHILD got message:', m);
    scrobbler().then(() => {
        process.send({succes: true});
    });
});

export default scrobbler;
