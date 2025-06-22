// Script zum Erstellen aller Welcome-Ordner auf GitHub
require('dotenv').config();
const { execSync } = require('child_process');

async function createWelcomeFolders() {
    try {
        console.log('🚀 Erstelle Welcome-Ordner auf GitHub...');
        
        // GitHub Token prüfen
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            console.error('❌ GITHUB_TOKEN Umgebungsvariable ist nicht gesetzt!');
            console.log('💡 Das Token muss auf Railway konfiguriert sein.');
            console.log('🔗 Du kannst das Script auch direkt auf Railway ausführen.');
            return;
        }
        
        // Repository automatisch aus Git Remote erkennen
        let GITHUB_USERNAME, GITHUB_REPOSITORY;
        try {
            const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
            console.log(`🔍 Git Remote: ${remoteUrl}`);
            
            // Parse GitHub URL: https://github.com/username/repo.git
            const match = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+)(?:\.git)?$/);
            if (match) {
                GITHUB_USERNAME = match[1];
                GITHUB_REPOSITORY = match[2].replace('.git', '');
                console.log(`📁 Repository erkannt: ${GITHUB_USERNAME}/${GITHUB_REPOSITORY}`);
            } else {
                throw new Error('Konnte Repository nicht aus Git Remote erkennen');
            }
        } catch (error) {
            console.log('⚠️ Fallback zu Umgebungsvariablen...');
            GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'dennis006';
            GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'agentbee';
        }
        
        // Dynamischer Import für ES Module
        const { Octokit } = await import('@octokit/rest');
        
        const octokit = new Octokit({
            auth: githubToken
        });

        const WELCOME_FOLDERS = [
            'general',
            'valorant', 
            'minecraft',
            'gaming',
            'anime',
            'memes',
            'seasonal'
        ];
        
        for (const folder of WELCOME_FOLDERS) {
            try {
                console.log(`📁 Erstelle Ordner: ${folder}`);
                
                // Erstelle einen .gitkeep File um den Ordner zu erstellen
                const path = `public/images/welcome/${folder}/.gitkeep`;
                const content = `# This file ensures the ${folder} folder exists on GitHub\n# Welcome images for ${folder} theme\n# Created: ${new Date().toISOString()}\n`;
                
                await octokit.rest.repos.createOrUpdateFileContents({
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
                    if (error.status === 404) {
                        console.log('💡 Mögliche Ursachen:');
                        console.log('   - Repository existiert nicht');
                        console.log('   - Token hat keine Berechtigung für dieses Repository');
                        console.log('   - Repository ist privat und Token fehlt Berechtigung');
                    }
                }
            }
        }
        
        console.log('🎉 Alle Welcome-Ordner Setup abgeschlossen!');
        
    } catch (error) {
        console.error('❌ Fehler beim Setup:', error);
    }
}

// Script ausführen
if (require.main === module) {
    createWelcomeFolders().catch(console.error);
}

module.exports = { createWelcomeFolders }; 