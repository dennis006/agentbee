// ==============================================
// WELCOME SYSTEM - SUPABASE API
// ==============================================

const fs = require('fs');
const path = require('path');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

// Supabase Client
let supabaseClient = null;

// Cache für bessere Performance
let welcomeSettingsCache = new Map();
let welcomeImagesCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

// ==============================================
// SUPABASE INITIALISIERUNG
// ==============================================

function initializeSupabaseForWelcome(supabase) {
    supabaseClient = supabase;
    console.log('🎉 Welcome System - Supabase Client initialisiert');
}

// ==============================================
// WELCOME SETTINGS FUNKTIONEN
// ==============================================

// Lade Welcome Settings aus Supabase
async function loadWelcomeSettings(guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.log('⚠️ Supabase nicht initialisiert, verwende JSON-Fallback für Welcome Settings');
        return loadWelcomeSettingsFromJSON();
    }

    // Prüfe Cache
    const cacheKey = `settings_${guildId}`;
    const cached = welcomeSettingsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
    }

    try {
        console.log(`🔄 Lade Welcome Settings für Guild ${guildId}...`);
        
        const { data, error } = await supabaseClient
            .from('welcome_settings')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = keine Daten gefunden
            throw error;
        }

        let settings;
        if (!data) {
            console.log('📄 Keine Welcome Settings gefunden, erstelle Standard-Einstellungen...');
            settings = await createDefaultWelcomeSettings(guildId);
        } else {
            settings = {
                enabled: data.enabled,
                channelName: data.channel_name,
                title: data.title,
                description: data.description,
                color: data.color,
                customThumbnail: data.custom_thumbnail,
                imageRotation: data.image_rotation,
                fields: data.fields,
                footer: data.footer,
                autoRole: data.auto_role,
                mentionUser: data.mention_user,
                deleteAfter: data.delete_after,
                dmMessage: data.dm_message,
                leaveMessage: data.leave_message
            };
        }

        // Cache aktualisieren
        welcomeSettingsCache.set(cacheKey, {
            data: settings,
            timestamp: Date.now()
        });

        console.log('✅ Welcome Settings aus Supabase geladen');
        return settings;

    } catch (error) {
        console.error('❌ Fehler beim Laden der Welcome Settings:', error);
        return loadWelcomeSettingsFromJSON();
    }
}

// Speichere Welcome Settings in Supabase
async function saveWelcomeSettings(settings, guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.log('⚠️ Supabase nicht initialisiert, verwende JSON-Fallback');
        return saveWelcomeSettingsToJSON(settings);
    }

    try {
        console.log('💾 Speichere Welcome Settings in Supabase...');

        const dbSettings = {
            guild_id: guildId,
            enabled: settings.enabled,
            channel_name: settings.channelName,
            title: settings.title,
            description: settings.description,
            color: settings.color,
            custom_thumbnail: settings.customThumbnail || '',
            image_rotation: settings.imageRotation,
            fields: settings.fields,
            footer: settings.footer,
            auto_role: settings.autoRole || '',
            mention_user: settings.mentionUser,
            delete_after: settings.deleteAfter,
            dm_message: settings.dmMessage,
            leave_message: settings.leaveMessage
        };

        const { error } = await supabaseClient
            .from('welcome_settings')
            .upsert(dbSettings, {
                onConflict: 'guild_id'
            });

        if (error) throw error;

        // Cache invalidieren
        welcomeSettingsCache.delete(`settings_${guildId}`);

        console.log('✅ Welcome Settings in Supabase gespeichert');
        return { success: true };

    } catch (error) {
        console.error('❌ Fehler beim Speichern der Welcome Settings:', error);
        return saveWelcomeSettingsToJSON(settings);
    }
}

// Erstelle Standard Welcome Settings
async function createDefaultWelcomeSettings(guildId) {
    const defaultSettings = {
        enabled: true,
        channelName: 'willkommen',
        title: '🎉 Willkommen auf dem Server!',
        description: 'Hey **{user}**! Schön dass du zu **{server}** gefunden hast! 🎊',
        color: '0x00FF7F',
        customThumbnail: '',
        imageRotation: {
            enabled: false,
            mode: 'random',
            folder: null
        },
        fields: [
            {
                name: '📋 Erste Schritte',
                value: 'Schaue dir unsere Regeln an und werde Teil der Community!',
                inline: false
            },
            {
                name: '💬 Support',
                value: 'Bei Fragen wende dich an unsere Moderatoren!',
                inline: true
            },
            {
                name: '🎮 Viel Spaß',
                value: 'Wir freuen uns auf dich!',
                inline: true
            }
        ],
        footer: 'Mitglied #{memberCount} • {server}',
        autoRole: '',
        mentionUser: true,
        deleteAfter: 0,
        dmMessage: {
            enabled: false,
            message: 'Willkommen! Schau gerne im Server vorbei! 😊'
        },
        leaveMessage: {
            enabled: false,
            channelName: 'verlassen',
            title: '👋 Tschüss!',
            description: '**{user}** hat den Server verlassen. Auf Wiedersehen! 😢',
            color: '0xFF6B6B',
            mentionUser: false,
            deleteAfter: 0
        }
    };

    // Speichere die Standard-Einstellungen
    await saveWelcomeSettings(defaultSettings, guildId);
    return defaultSettings;
}

// ==============================================
// WELCOME IMAGES FUNKTIONEN
// ==============================================

// Lade Welcome Images aus Supabase
async function loadWelcomeImages(guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        return loadWelcomeImagesFromFileSystem();
    }

    const cacheKey = `images_${guildId}`;
    const cached = welcomeImagesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
    }

    try {
        console.log(`🔄 Lade Welcome Images für Guild ${guildId}...`);

        // Lade Images
        const { data: images, error: imagesError } = await supabaseClient
            .from('welcome_images')
            .select('*')
            .eq('guild_id', guildId)
            .order('uploaded_at', { ascending: false });

        if (imagesError) throw imagesError;

        // Lade Folders
        const { data: folders, error: foldersError } = await supabaseClient
            .from('welcome_folders')
            .select('*')
            .eq('guild_id', guildId)
            .order('folder_name');

        if (foldersError) throw foldersError;

        // Strukturiere Daten
        const imagesByFolder = {};
        const allImages = [];

        // Initialisiere alle Ordner
        folders.forEach(folder => {
            imagesByFolder[folder.folder_name] = [];
        });

        // Sortiere Images in Ordner
        images.forEach(image => {
            const imageData = {
                filename: image.filename,
                originalName: image.original_name,
                folder: image.folder_name,
                size: image.file_size,
                type: image.file_type,
                url: image.url,
                githubPath: image.github_path,
                uploadedAt: image.uploaded_at
            };

            allImages.push(imageData);
            
            if (!imagesByFolder[image.folder_name]) {
                imagesByFolder[image.folder_name] = [];
            }
            imagesByFolder[image.folder_name].push(imageData);
        });

        const result = {
            images: allImages,
            folders: imagesByFolder,
            allFolderNames: folders.map(f => f.folder_name),
            folderDetails: folders
        };

        // Cache aktualisieren
        welcomeImagesCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        console.log(`✅ ${allImages.length} Welcome Images aus Supabase geladen`);
        return result;

    } catch (error) {
        console.error('❌ Fehler beim Laden der Welcome Images:', error);
        return loadWelcomeImagesFromFileSystem();
    }
}

// Speichere Image in Supabase
async function saveWelcomeImage(imageData, guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.log('⚠️ Supabase nicht initialisiert');
        return { success: false, error: 'Supabase nicht verfügbar' };
    }

    try {
        console.log(`💾 Speichere Welcome Image: ${imageData.filename}`);

        // Metadaten in Supabase speichern
        const { error } = await supabaseClient
            .from('welcome_images')
            .insert({
                guild_id: guildId,
                filename: imageData.filename,
                original_name: imageData.originalName,
                folder_name: imageData.folder,
                file_size: imageData.size,
                file_type: imageData.type,
                url: imageData.url,
                github_path: imageData.githubPath || null
            });

        if (error) throw error;

        // Cache invalidieren
        welcomeImagesCache.delete(`images_${guildId}`);

        console.log('✅ Welcome Image in Supabase gespeichert');
        return { success: true };

    } catch (error) {
        console.error('❌ Fehler beim Speichern des Welcome Images:', error);
        return { success: false, error: error.message };
    }
}

// ==============================================
// ORDNER MANAGEMENT
// ==============================================

// Erstelle neuen Ordner
async function createWelcomeFolder(folderName, guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.log('⚠️ Supabase nicht initialisiert');
        return { success: false, error: 'Supabase nicht verfügbar' };
    }

    try {
        console.log(`📁 Erstelle Welcome Ordner: ${folderName}`);

        const { error } = await supabaseClient
            .from('welcome_folders')
            .insert({
                guild_id: guildId,
                folder_name: folderName,
                display_name: folderName.charAt(0).toUpperCase() + folderName.slice(1),
                emoji: getFolderEmoji(folderName)
            });

        if (error) throw error;

        // Cache invalidieren
        welcomeImagesCache.delete(`images_${guildId}`);

        console.log(`✅ Welcome Ordner "${folderName}" erstellt`);
        return { success: true };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Welcome Ordners:', error);
        return { success: false, error: error.message };
    }
}

// Lösche Ordner
async function deleteWelcomeFolder(folderName, guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.log('⚠️ Supabase nicht initialisiert');
        return { success: false, error: 'Supabase nicht verfügbar' };
    }

    if (folderName === 'general') {
        return { success: false, error: 'General-Ordner kann nicht gelöscht werden' };
    }

    try {
        console.log(`🗑️ Lösche Welcome Ordner: ${folderName}`);

        // Lösche alle Bilder in diesem Ordner
        await supabaseClient
            .from('welcome_images')
            .delete()
            .eq('guild_id', guildId)
            .eq('folder_name', folderName);

        // Lösche den Ordner
        const { error } = await supabaseClient
            .from('welcome_folders')
            .delete()
            .eq('guild_id', guildId)
            .eq('folder_name', folderName);

        if (error) throw error;

        // Cache invalidieren
        welcomeImagesCache.delete(`images_${guildId}`);

        console.log(`✅ Welcome Ordner "${folderName}" gelöscht`);
        return { success: true };

    } catch (error) {
        console.error('❌ Fehler beim Löschen des Welcome Ordners:', error);
        return { success: false, error: error.message };
    }
}

// Auto-Create Game Folders
async function autoCreateGameFolders(guildId = process.env.GUILD_ID || '1203994020779532348') {
    const gameFolders = [
        'valorant',
        'minecraft', 
        'fortnite',
        'apex-legends',
        'league-of-legends',
        'cs2',
        'beellgrounds',
        'genshin-impact',
        'rocket-league',
        'overwatch'
    ];

    console.log('🎮 Erstelle automatisch Game-Ordner...');
    
    const results = [];
    for (const folderName of gameFolders) {
        const result = await createWelcomeFolder(folderName, guildId);
        results.push({ folder: folderName, ...result });
    }

    return { success: true, results };
}

// Hilfsfunktion für Ordner-Emojis
function getFolderEmoji(folderName) {
    const emojiMap = {
        'general': '📂',
        'valorant': '🎯',
        'minecraft': '⛏️',
        'fortnite': '🏗️',
        'apex-legends': '🔫',
        'league-of-legends': '⚔️',
        'cs2': '💣',
        'beellgrounds': '🐝',
        'genshin-impact': '⭐',
        'rocket-league': '🚀',
        'overwatch': '🎮',
        'events': '🎉',
        'seasonal': '🌟'
    };
    
    return emojiMap[folderName.toLowerCase()] || '🎮';
}

// ==============================================
// WELCOME EMBED FUNKTIONEN
// ==============================================

// Zufälliges Welcome-Bild aus Supabase wählen
async function getRandomWelcomeImage(specificFolder = null, guildId = process.env.GUILD_ID || '1203994020779532348') {
    try {
        const imageData = await loadWelcomeImages(guildId);
        
        if (!imageData || !imageData.images.length) {
            console.log('⚠️ Keine Bilder für Rotation gefunden');
            return null;
        }

        let availableImages = imageData.images;

        // Filter nach spezifischem Ordner falls angegeben
        if (specificFolder && imageData.folders[specificFolder]) {
            availableImages = imageData.folders[specificFolder];
            console.log(`📁 ${specificFolder}-Ordner: ${availableImages.length} Bilder gefunden`);
        }

        if (availableImages.length === 0) {
            console.log(`⚠️ Keine Bilder in Ordner "${specificFolder}" gefunden`);
            return null;
        }

        // Zufälliges Bild auswählen
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const randomImage = availableImages[randomIndex];
        
        console.log(`🎯 Gewähltes Bild: ${randomImage.folder}/${randomImage.filename} (Index: ${randomIndex}/${availableImages.length - 1})`);
        console.log(`🎲 Zufälliges Welcome-Bild gewählt: ${randomImage.url}`);
        
        return randomImage.url;

    } catch (error) {
        console.error('❌ Fehler beim Laden der Welcome-Bilder für Rotation:', error);
        return null;
    }
}

// Welcome-Embed erstellen
async function createWelcomeEmbed(guild, member, guildId = process.env.GUILD_ID || '1203994020779532348') {
    try {
        // Lade aktuelle Settings
        const settings = await loadWelcomeSettings(guildId);
        
        // Fallback für description falls leer oder undefined
        let description = settings.description || 'Willkommen auf dem Server!';
        
        description = description
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{server}/g, guild.name)
            .replace(/{memberCount}/g, guild.memberCount.toString());
        
        // Sicherstellen dass description nicht leer ist
        if (!description.trim()) {
            description = `Willkommen <@${member.id}> auf **${guild.name}**! 🎉`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(parseInt(settings.color.replace('0x', ''), 16))
            .setTitle(settings.title || '🎉 Willkommen!')
            .setDescription(description)
            .setTimestamp();

        let attachment = null;
        let thumbnailUrl = settings.customThumbnail;

        // Bild-Rotation aktiviert? (überschreibt customThumbnail)
        if (settings.imageRotation && settings.imageRotation.enabled) {
            const randomImage = await getRandomWelcomeImage(settings.imageRotation.folder, guildId);
            if (randomImage) {
                thumbnailUrl = randomImage;
                console.log(`🎲 Zufälliges Welcome-Bild gewählt: ${thumbnailUrl}`);
            } else {
                console.log(`⚠️ Keine Bilder für Rotation gefunden, verwende Fallback: ${thumbnailUrl}`);
            }
        }

        // Setze Bild (nur noch custom Images unterstützt)
        if (thumbnailUrl) {
            // GitHub/Externe URL direkt verwenden
            if (thumbnailUrl.startsWith('https://')) {
                embed.setImage(thumbnailUrl);
                console.log(`🖼️ Setze externe Image URL: ${thumbnailUrl}`);
            } 
            // Lokale URLs für lokale Entwicklung
            else if (thumbnailUrl.startsWith('/images/')) {
                try {
                    const imagePath = `./dashboard/public${thumbnailUrl}`;
                    if (fs.existsSync(imagePath)) {
                        const fileName = path.basename(imagePath);
                        attachment = new AttachmentBuilder(imagePath, { name: fileName });
                        embed.setImage(`attachment://${fileName}`);
                        console.log(`🎮 Lokales Bild als großes Image verwendet: ${imagePath}`);
                    } else {
                        console.log(`⚠️ Bild nicht gefunden: ${imagePath}`);
                        embed.setImage('https://cdn.discordapp.com/embed/avatars/0.png');
                    }
                } catch (error) {
                    console.error(`❌ Fehler beim Laden des Bildes:`, error);
                    embed.setImage('https://cdn.discordapp.com/embed/avatars/0.png');
                }
            } else {
                // Externe URL direkt verwenden
                embed.setImage(thumbnailUrl);
                console.log(`🖼️ Setze Image URL: ${thumbnailUrl}`);
            }
        }

        // Felder hinzufügen
        if (settings.fields && settings.fields.length > 0) {
            settings.fields.forEach(field => {
                embed.addFields({
                    name: field.name,
                    value: field.value
                        .replace(/{user}/g, `<@${member.id}>`)
                        .replace(/{server}/g, guild.name)
                        .replace(/{memberCount}/g, guild.memberCount.toString()),
                    inline: field.inline
                });
            });
        }

        // Footer hinzufügen
        if (settings.footer) {
            const footerText = settings.footer
                .replace(/{user}/g, member.displayName)
                .replace(/{server}/g, guild.name)
                .replace(/{memberCount}/g, guild.memberCount.toString());
            embed.setFooter({ text: footerText });
        }

        // Statistik aktualisieren
        await updateWelcomeStats(guildId, 'welcome');

        return { embed, attachment, settings };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Welcome-Embeds:', error);
        // Fallback zu simplem Embed
        const embed = new EmbedBuilder()
            .setColor(0x00FF7F)
            .setTitle('🎉 Willkommen!')
            .setDescription(`Willkommen <@${member.id}> auf **${guild.name}**!`)
            .setTimestamp();
        
        return { embed, attachment: null, settings: null };
    }
}

// Leave-Embed erstellen
async function createLeaveEmbed(guild, member, guildId = process.env.GUILD_ID || '1203994020779532348') {
    try {
        const settings = await loadWelcomeSettings(guildId);
        const leaveSettings = settings.leaveMessage;
        
        if (!leaveSettings || !leaveSettings.enabled) {
            return null;
        }

        const embed = new EmbedBuilder()
            .setTitle(leaveSettings.title || '👋 Tschüss!')
            .setColor(parseInt(leaveSettings.color?.replace('0x', '') || 'FF6B6B', 16))
            .setTimestamp();

        // Verarbeite Platzhalter in der Beschreibung
        let processedDescription = (leaveSettings.description || '**{user}** hat den Server verlassen.')
            .replace(/{user}/g, member.user.username)
            .replace(/{server}/g, guild.name)
            .replace(/{memberCount}/g, guild.memberCount.toString());

        embed.setDescription(processedDescription);

        // User Avatar als Thumbnail
        embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }));

        // Footer mit Member Count
        embed.setFooter({
            text: `Mitglied verlassen • ${guild.name}`,
            iconURL: guild.iconURL({ dynamic: true }) || undefined
        });

        // Statistik aktualisieren
        await updateWelcomeStats(guildId, 'leave');

        console.log(`✅ Leave-Embed erstellt für ${member.user.tag}`);
        return { embed, settings: leaveSettings };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Leave-Embeds:', error);
        return null;
    }
}

// ==============================================
// STATISTIK FUNKTIONEN
// ==============================================

// Aktualisiere Welcome Statistiken
async function updateWelcomeStats(guildId, statType) {
    if (!supabaseClient) return;

    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Upsert Statistik für heute
        const { error } = await supabaseClient
            .from('welcome_stats')
            .upsert({
                guild_id: guildId,
                date: today,
                [`${statType}_messages_sent`]: 1
            }, {
                onConflict: 'guild_id,date'
            });

        if (error) throw error;

    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Welcome Stats:', error);
    }
}

// ==============================================
// FALLBACK FUNKTIONEN (für Migration)
// ==============================================

// JSON Fallback - Laden
function loadWelcomeSettingsFromJSON() {
    try {
        if (fs.existsSync('./welcome.json')) {
            const settings = JSON.parse(fs.readFileSync('./welcome.json', 'utf8'));
            
            // Migration: Sicherstellen dass alle Felder existieren
            if (!settings.imageRotation) {
                settings.imageRotation = { enabled: false, mode: 'random', folder: null };
            }
            if (!settings.leaveMessage) {
                settings.leaveMessage = {
                    enabled: false,
                    channelName: 'verlassen',
                    title: '👋 Tschüss!',
                    description: '**{user}** hat den Server verlassen. Auf Wiedersehen! 😢',
                    color: '0xFF6B6B',
                    mentionUser: false,
                    deleteAfter: 0
                };
            }
            
            console.log('✅ Welcome Settings aus JSON geladen (Fallback)');
            return settings;
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Welcome Settings aus JSON:', error);
    }

    // Standard-Einstellungen zurückgeben
    return {
        enabled: true,
        channelName: 'willkommen',
        title: '🎉 Willkommen auf dem Server!',
        description: 'Hey **{user}**! Schön dass du zu **{server}** gefunden hast! 🎊',
        color: '0x00FF7F',
        customThumbnail: '',
        imageRotation: { enabled: false, mode: 'random', folder: null },
        fields: [
            { name: '📋 Erste Schritte', value: 'Schaue dir unsere Regeln an!', inline: false },
            { name: '💬 Support', value: 'Bei Fragen wende dich an Moderatoren!', inline: true },
            { name: '🎮 Viel Spaß', value: 'Wir freuen uns auf dich!', inline: true }
        ],
        footer: 'Mitglied #{memberCount} • {server}',
        autoRole: '',
        mentionUser: true,
        deleteAfter: 0,
        dmMessage: { enabled: false, message: 'Willkommen! 😊' },
        leaveMessage: { enabled: false, channelName: 'verlassen', title: '👋 Tschüss!', description: '**{user}** hat uns verlassen.', color: '0xFF6B6B', mentionUser: false, deleteAfter: 0 }
    };
}

// JSON Fallback - Speichern
function saveWelcomeSettingsToJSON(settings) {
    try {
        fs.writeFileSync('./welcome.json', JSON.stringify(settings, null, 2));
        console.log('✅ Welcome Settings in JSON gespeichert (Fallback)');
        return { success: true };
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Welcome Settings in JSON:', error);
        return { success: false, error: error.message };
    }
}

// Filesystem Fallback für Images
function loadWelcomeImagesFromFileSystem() {
    try {
        const welcomeImagesPath = './dashboard/public/images/welcome/';
        
        if (!fs.existsSync(welcomeImagesPath)) {
            console.log('📁 Welcome Images Ordner existiert nicht, erstelle ihn...');
            fs.mkdirSync(welcomeImagesPath, { recursive: true });
            return { images: [], folders: {}, allFolderNames: ['general'] };
        }

        const result = { images: [], folders: {}, allFolderNames: [] };
        const items = fs.readdirSync(welcomeImagesPath);

        // Lade Ordner und Dateien
        items.forEach(item => {
            const itemPath = path.join(welcomeImagesPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                result.allFolderNames.push(item);
                result.folders[item] = [];
                
                const folderFiles = fs.readdirSync(itemPath);
                folderFiles.forEach(file => {
                    if (file.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
                        const imageData = {
                            filename: file,
                            originalName: file,
                            folder: item,
                            size: fs.statSync(path.join(itemPath, file)).size,
                            type: path.extname(file),
                            url: `/images/welcome/${item}/${file}`,
                            uploadedAt: stats.mtime
                        };
                        result.images.push(imageData);
                        result.folders[item].push(imageData);
                    }
                });
            }
        });

        console.log(`✅ ${result.images.length} Welcome Images aus Filesystem geladen (Fallback)`);
        return result;

    } catch (error) {
        console.error('❌ Fehler beim Laden der Images aus Filesystem:', error);
        return { images: [], folders: {}, allFolderNames: ['general'] };
    }
}

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    initializeSupabaseForWelcome,
    loadWelcomeSettings,
    saveWelcomeSettings,
    loadWelcomeImages,
    saveWelcomeImage,
    createWelcomeEmbed,
    createLeaveEmbed,
    getRandomWelcomeImage,
    createWelcomeFolder,
    deleteWelcomeFolder,
    autoCreateGameFolders,
    updateWelcomeStats,
    
    // Fallback Funktionen
    loadWelcomeSettingsFromJSON,
    saveWelcomeSettingsToJSON,
    loadWelcomeImagesFromFileSystem
}; 