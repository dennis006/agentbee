// Script zum Erstellen aller Welcome-Ordner auf GitHub
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'dennis006';
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'agentbee';

const WELCOME_FOLDERS = [
    'general',
    'valorant', 
    'minecraft',
    'gaming',
    'anime',
    'memes',
    'seasonal'
];

async function createWelcomeFolders() {
    console.log('🚀 Erstelle Welcome-Ordner auf GitHub...');
    
    for (const folder of WELCOME_FOLDERS) {
        try {
            console.log(`📁 Erstelle Ordner: ${folder}`);
            
            // Erstelle einen .gitkeep File um den Ordner zu erstellen
            const path = `public/images/welcome/${folder}/.gitkeep`;
            const content = `# This file ensures the ${folder} folder exists on GitHub\n# Welcome images for ${folder} theme\n`;
            
            await octokit.repos.createOrUpdateFileContents({
                owner: GITHUB_USERNAME,
                repo: GITHUB_REPOSITORY,
                path: path,
                message: `📁 Create welcome folder: ${folder}`,
                content: Buffer.from(content).toString('base64'),
                branch: 'main'
            });
            
            console.log(`✅ Ordner ${folder} erstellt`);
            
        } catch (error) {
            if (error.status === 422) {
                console.log(`📁 Ordner ${folder} existiert bereits`);
            } else {
                console.error(`❌ Fehler beim Erstellen von ${folder}:`, error.message);
            }
        }
    }
    
    console.log('🎉 Alle Welcome-Ordner erstellt!');
}

// Script ausführen
if (require.main === module) {
    createWelcomeFolders().catch(console.error);
}

module.exports = { createWelcomeFolders }; 