import filehound    from 'filehound';
import mm           from 'music-metadata';
import filequeue    from 'filequeue';

import config       from '../config.json';
import Api          from './api.js';
import log          from './logger.js';

const fs = new filequeue(200);

const uploadToDatabase = (parsedFiles) => {
    const albums    = [];
    const artists   = [];
    const genres    = [];
    const years     = [];
    const songs     = [];

    const arrays = [albums, artists, genres, years];

    const insertIfNotAlreadyIn = (array, object) => {
        if (object) {
            if (object.constructor === Array) {
                // if obj === array, check if content of array is already contained in array
                const toAdd = object.map((obj) => {
                    if (array.indexOf(obj) === -1) {
                        return obj;
                    }
                });
                toAdd.map((val) => {
                    if(val) {
                        array.push(val);
                    }
                });
                log(array);
                return;
            } else if (array.indexOf(object) === -1) { // if not in array
                array.push(object);
                return;
            }
        }
    };

    // The index here has to match the index in 'songs'
    const KEYARRAY = ['album', 'artist', 'genre', 'year'];

    parsedFiles.map((file) => {
        log(file);
        // songinfo can be null :)
        if (file.songInfo) {
            const common = file.songInfo.common;
            // Split off into album art and data, split genres, albums, year, artists
            KEYARRAY.map((key, index) => { // populate arrays
                try {
                    insertIfNotAlreadyIn(arrays[index], common[key]);
                } catch (error) {
                    throw error;
                }
            });

            // populate songs
            delete common.picture;
            const songInfo = file.songInfo;
            Object.keys(songInfo).map((key) => {
                if (key.indexOf('id3') !== -1) {
                    // delete image because this'll be contained in a different collection
                    delete songInfo[key]['APIC']; 
                }
            });
            songs.push(file);
        }
    });
    const promises = [
        Api.put(songs ,'songs'),
        Api.put([{albums}], 'albums'),
        Api.put([{artists}], 'artists'),
        Api.put([{genres}], 'genres'),
        Api.put([{years}], 'years'),
    ];
    return Promise.all(promises);
};

const parseFoundFiles = (files) => {
    const tags = files.map((file) => {
        return new Promise((resolveParser) => {
            const audioStream = fs.createReadStream(file);
            mm.parseStream(audioStream, {native: true}, function (err, metadata) {
                audioStream.close();
                if (err) {
                    log('Error while parsing');
                    log(err);
                    resolveParser({fileInfo: {path: file}, songInfo: null});
                }
                // Why change for example 'id3v2.3' into 'id3v2-3'? Because json doesn't like the dot in the naming.
                Object.keys(metadata).map((flag) => {
                    const tempData = metadata[flag];
                    delete metadata[flag];
                    metadata[flag.replace('.', '-')] = tempData;
                });
                log('Parsed ' + file);
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
    return Api.drop()
    .then(() => {
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
        return uploadToDatabase(taggedFiles);
    })
    .then((response) => {
        log(response);
        // if (checkMongoResponse(response)){
        //     log('Succesfully updated database');
        //     return {success: true};
        // } else {
        //     log('Error pushing data to database');
        //     return {success: false};
        // }
    })
    .catch((error) => {
        log('An error occured in scrobbler.js');
        throw error;
    });
};

process.on('message', () => {
    scrobbler().then(() => {
        process.send({succes: true});
    });
});

export default scrobbler;
