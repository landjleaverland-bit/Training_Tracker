import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, '../static/exercises');

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.forEach((file) => {
        if (path.extname(file).toLowerCase() === '.png') {
            const inputPath = path.join(directoryPath, file);
            const outputPath = path.join(directoryPath, path.parse(file).name + '.webp');

            sharp(inputPath)
                .webp({ quality: 80 })
                .toFile(outputPath)
                .then(() => {
                    console.log(`Converted ${file} to WebP`);
                    // Optional: Delete original PNG
                    fs.unlink(inputPath, (err) => {
                        if (err) console.error(`Error deleting ${file}:`, err);
                    });
                })
                .catch(err => {
                    console.error(`Error converting ${file}:`, err);
                });
        }
    });
});
