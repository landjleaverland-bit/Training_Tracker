const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const AUTH_STORE_PATH = path.join(__dirname, '../src/lib/stores/auth.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

rl.question('Enter new password: ', (password) => {
    if (!password.trim()) {
        console.error('Error: Password cannot be empty.');
        rl.close();
        process.exit(1);
    }

    const hash = hashPassword(password.trim());

    try {
        let content = fs.readFileSync(AUTH_STORE_PATH, 'utf8');

        // Regex to find and replace the CORRECT_HASH value
        const updatedContent = content.replace(
            /const CORRECT_HASH = '[a-f0-9]+';/,
            `const CORRECT_HASH = '${hash}';`
        );

        if (content === updatedContent) {
            console.error('Error: Could not find CORRECT_HASH in auth.js. Make sure the file exists and has the correct format.');
            process.exit(1);
        }

        fs.writeFileSync(AUTH_STORE_PATH, updatedContent);
        console.log('\nSuccess! Password has been updated.');
        console.log(`New Hash: ${hash}`);
        console.log('\nIMPORTANT: Remember to build and deploy your changes to apply the new password to GitHub Pages.');

    } catch (err) {
        console.error('Error updating password:', err.message);
    }

    rl.close();
});
