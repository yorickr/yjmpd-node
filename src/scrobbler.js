import filehound    from 'filehound';
import mm           from 'music-metadata';
import filequeue    from 'filequeue';

import config       from '../config.json';
import Api          from './api.js';
import log          from './logger.js';

const fs = new filequeue(200);

const parseFoundFiles = (files) => {
    const promises = files.map((file) => {
        return new Promise((resolveFile, rejectFile) => {
            const audioStream = fs.createReadStream(file);
            mm.parseStream(audioStream, {native: true}, (error, metadata) => {
                audioStream.close();
                if (error) {
                    log('Error while parsing');
                    log(error);
                    resolveFile({fileInfo: {path :file}, songInfo: null});
                }
                // Why change for example 'id3v2.3' into 'id3v2-3'? Because json doesn't like the dot in the naming.
                Object.keys(metadata).map((flag) => {
                    const tempData = metadata[flag];
                    delete metadata[flag];
                    metadata[flag.replace('.', '-')] = tempData;
                });
                resolveFile({fileInfo: {path: file}, songInfo: metadata});
            });
        });
    });
    return Promise.all(promises);
};

const scrobbler = () => {
    // Wipe everything from db
    return filehound.create()
    .paths(config.musicDir)
    .ext('mp3')
    .find()
    .then((foundFiles) => {
        log('Found files');
        return parseFoundFiles(foundFiles);
    })
    .then((response) => {
        // upload to db here.
        const promises = response.map((parsedFile) => {
            return new Promise((resolve) => {
                const {fileInfo, songInfo} = parsedFile;
                const query = Api.format('INSERT INTO tracks (artist, trackNumber, diskNumber, album, genre, title, year, duration, trackFormat, bitrate, image, path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
                    [
                        songInfo.common.artist,
                        songInfo.common.track.no,
                        songInfo.common.disk.no,
                        songInfo.common.album,
                        songInfo.common.genre,
                        songInfo.common.title,
                        songInfo.common.year,
                        songInfo.format.duration,
                        songInfo.format.dataformat,
                        songInfo.format.bitrate,
                        null,
                        fileInfo.path,
                    ]);
                Api.execute(query)
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    if (error.errno !== 1062) {
                        log(error);
                    } else {
                        resolve(); // it was just a duplicate error, so it's already in the db
                    }
                });
            });
        });
        return Promise.all(promises);
    })
    .then((response) => {
        log('Uploaded songs');
    })
    .catch((error) => {
        log('An error occured in scrobbler.js');
        throw error;
    });
};

scrobbler();
