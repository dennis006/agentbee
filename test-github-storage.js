#!/usr/bin/env node

/**
 * Test Script für GitHub Storage Integration
 * 
 * Testet die GitHub-basierte Image Storage für Welcome Images
 */

const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

// Lade API Keys
let apiKeys = {};
try {
    apiKeys = JSON.parse(fs.readFileSync('./api-keys.json', 'utf8'));
} catch (error) {
    console.error('❌ Fehler beim Laden der API-Keys:', error.message);
    process.exit(1);
}

// GitHub Configuration
const GITHUB_REPO = apiKeys.github?.repository || 'discordbot';
const GITHUB_OWNER = apiKeys.github?.username || 'default-user';
const GITHUB_BRANCH = 'main';
const GITHUB_BASE_PATH = 'public/images/welcome';

// GitHub Client
let githubClient = null;

function initializeGitHub() {
    if (apiKeys.github?.token) {
        githubClient = new Octokit({
            auth: apiKeys.github.token
        });
        console.log(`🐙 GitHub Client initialisiert (${GITHUB_OWNER}/${GITHUB_REPO})`);
        return true;
    } else {
        console.error('❌ GitHub Token nicht konfiguriert in api-keys.json');
        return false;
    }
}

// Test GitHub Connection
async function testGitHubConnection() {
    try {
        console.log('\n🔍 Teste GitHub-Verbindung...');
        
        const { data: user } = await githubClient.rest.users.getAuthenticated();
        console.log(`✅ Erfolgreich als ${user.login} angemeldet`);
        
        const { data: repo } = await githubClient.rest.repos.get({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO
        });
        console.log(`✅ Repository ${repo.full_name} erreichbar`);
        
        return true;
    } catch (error) {
        console.error('❌ GitHub-Verbindung fehlgeschlagen:', error.message);
        return false;
    }
}

// Test Upload
async function testImageUpload() {
    try {
        console.log('\n📤 Teste Image Upload...');
        
        // Erstelle ein kleines Test-Bild (1x1 PNG)
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0x60, 0x60, 0x60, 0x00,
            0x00, 0x00, 0x04, 0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00, 0x00,
            0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        const filename = `test-${Date.now()}.png`;
        const folder = 'general';
        const filePath = `${GITHUB_BASE_PATH}/${folder}/${filename}`;
        const base64Content = testImageBuffer.toString('base64');
        
        const response = await githubClient.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            message: `Test upload: ${filename}`,
            content: base64Content,
            branch: GITHUB_BRANCH
        });
        
        const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@${GITHUB_BRANCH}/${filePath}`;
        
        console.log(`✅ Test-Bild erfolgreich hochgeladen`);
        console.log(`📁 GitHub Path: ${filePath}`);
        console.log(`🌐 CDN URL: ${cdnUrl}`);
        
        return { filename, folder, cdnUrl };
        
    } catch (error) {
        console.error('❌ Upload-Test fehlgeschlagen:', error.message);
        return null;
    }
}

// Test List Images
async function testListImages() {
    try {
        console.log('\n📋 Teste Image Listing...');
        
        const folders = ['general', 'valorant', 'minecraft', 'gaming', 'anime', 'memes', 'seasonal'];
        let totalImages = 0;
        
        for (const folder of folders) {
            try {
                const folderPath = `${GITHUB_BASE_PATH}/${folder}`;
                const response = await githubClient.rest.repos.getContent({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    path: folderPath,
                    ref: GITHUB_BRANCH
                });
                
                const images = Array.isArray(response.data) 
                    ? response.data.filter(file => file.type === 'file' && /\.(png|jpg|jpeg|gif|webp)$/i.test(file.name))
                    : [];
                
                console.log(`📁 ${folder}: ${images.length} Bilder`);
                totalImages += images.length;
                
            } catch (error) {
                console.log(`📁 ${folder}: Ordner existiert noch nicht`);
            }
        }
        
        console.log(`✅ Gesamt: ${totalImages} Bilder gefunden`);
        return totalImages;
        
    } catch (error) {
        console.error('❌ Listing-Test fehlgeschlagen:', error.message);
        return 0;
    }
}

// Test Delete
async function testImageDelete(filename, folder) {
    try {
        console.log('\n🗑️ Teste Image Delete...');
        
        const filePath = `${GITHUB_BASE_PATH}/${folder}/${filename}`;
        
        // Hole SHA der zu löschenden Datei
        const existingFile = await githubClient.rest.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            ref: GITHUB_BRANCH
        });
        
        // Lösche die Datei
        await githubClient.rest.repos.deleteFile({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            message: `Test delete: ${filename}`,
            sha: existingFile.data.sha,
            branch: GITHUB_BRANCH
        });
        
        console.log(`✅ Test-Bild erfolgreich gelöscht: ${filePath}`);
        return true;
        
    } catch (error) {
        console.error('❌ Delete-Test fehlgeschlagen:', error.message);
        return false;
    }
}

// Main Test Function
async function runTests() {
    console.log('🚀 GitHub Storage Integration Test\n');
    console.log(`Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
    console.log(`Branch: ${GITHUB_BRANCH}`);
    console.log(`Base Path: ${GITHUB_BASE_PATH}`);
    
    // Initialize GitHub
    if (!initializeGitHub()) {
        console.error('\n❌ GitHub-Initialisierung fehlgeschlagen');
        process.exit(1);
    }
    
    // Test Connection
    const connectionOk = await testGitHubConnection();
    if (!connectionOk) {
        console.error('\n❌ GitHub-Verbindung fehlgeschlagen');
        process.exit(1);
    }
    
    // Test Upload
    const uploadResult = await testImageUpload();
    if (!uploadResult) {
        console.error('\n❌ Upload-Test fehlgeschlagen');
        process.exit(1);
    }
    
    // Test Listing
    await testListImages();
    
    // Test Delete
    const deleteOk = await testImageDelete(uploadResult.filename, uploadResult.folder);
    if (!deleteOk) {
        console.error('\n❌ Delete-Test fehlgeschlagen');
        process.exit(1);
    }
    
    console.log('\n🎉 Alle Tests erfolgreich!');
    console.log('\n💡 GitHub Storage ist bereit für den Produktivbetrieb');
    console.log('💡 Konfiguriere jetzt die API-Keys in Railway für den Bot');
}

// Script ausführen
if (require.main === module) {
    runTests().catch(error => {
        console.error('\n💥 Test-Script Fehler:', error);
        process.exit(1);
    });
} 