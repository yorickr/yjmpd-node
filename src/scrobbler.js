import filehound    from 'filehound';
import id3          from 'node-id3';

import config       from '../config.json';
import Api          from './api.js';
import log          from './logger.js';

const parseFoundFiles = (files) => {
    return new Promise((resolve) => {
        const tags = files.map((file) => {
            let songInfo = id3.read(file);
            songInfo.image = undefined;
            return {fileInfo: {path: file}, songInfo};
        });
        resolve(tags);
    });
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
    })
};

export default scrobbler;
