
const fs = require('fs');
const { createWriteStream } = require('fs');
const { createHybridFS } = require('hybrid-fs');

function pullS3File(s3path, interval, callback) {
    const hfs = createHybridFS();

    const pullFunction = async () => {
        try {
            const objectData = await hfs.getObject(s3path, false); 
            const filePath = await saveObj(objectData);
            callback(filePath, null);
        } catch (error) {
            callback(null, error);
        }
    };

    pullFunction();
    setInterval(pullFunction, interval);
}

async function saveObj(objectData) {
    return new Promise((resolve, reject) => {
        const tempDir = fs.mkdtempSync('/tmp/s3-download-');
        const filePath = `${tempDir}/downloaded_file`;
        const fileStream = createWriteStream(filePath);

        fileStream.on('error', (error) => {
            reject(error);
        });

        objectData.on('error', (error) => {
            reject(error);
        });

        objectData.pipe(fileStream);

        fileStream.on('finish', () => {
            resolve(filePath);
        });
    });
}

module.exports = { pullS3File };


const { pullS3File } = require('./utils');

async function refreshData(binEndpoint, localpath) {
    pullS3File(binEndpoint, 5000, (location, error) => {
        if (error) {
            console.error('Error occurred:', error);
        } else {
            console.log('File downloaded successfully:', location);
            // Proceed with refreshing the database or setting flags
        }
    });
}

module.exports = { refreshData };



const fs = require('fs');
const { createWriteStream } = require('fs');
const { createHybridFS } = require('hybrid-fs');

async function saveObj(objectData) {
    const tempDir = fs.mkdtempSync('/tmp/s3-download-');
    const filePath = `${tempDir}/downloaded_file`;

    const fileStream = createWriteStream(filePath);
    objectData.pipe(fileStream);

    await new Promise((resolve, reject) => {
        fileStream.on('error', reject);
        fileStream.on('finish', resolve);
    });

    return filePath;
}

module.exports = { saveObj };
