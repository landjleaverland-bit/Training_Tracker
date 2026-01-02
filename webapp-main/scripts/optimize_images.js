import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, '../static/exercises');

if (!fs.existsSync(directoryPath)) {
    console.log(`Directory ${directoryPath} does not exist. Creating it.`);
    fs.mkdirSync(directoryPath, { recursive: true });
}

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
            const inputPath = path.join(directoryPath, file);
            // Replace spaces with underscores and convert to lowercase for the output filename
            const cleanName = path.parse(file).name.replace(/\s+/g, '_').toLowerCase();
            const outputPath = path.join(directoryPath, cleanName + '.webp');

            sharp(inputPath)
                .resize({ width: 800, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(outputPath)
                .then(() => {
                    console.log(`Converted ${file} to WebP`);
                    // Delete original PNG after successful conversion
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
