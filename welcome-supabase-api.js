// ==============================================
// WELCOME SYSTEM - SUPABASE ONLY API
// ==============================================

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

// Supabase Client
let supabaseClient = null;

// Cache für bessere Performance (5 Minuten)
let welcomeSettingsCache = new Map();
let welcomeImagesCache = new Map();
let welcomeFoldersCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

// ==============================================
// SUPABASE INITIALISIERUNG
// ==============================================

function initializeSupabaseForWelcome(supabase) {
    supabaseClient = supabase;
    console.log('🎉 Welcome System - Supabase Client initialisiert (ONLY)');
}

// ==============================================
// WELCOME SETTINGS FUNKTIONEN
// ==============================================

// Lade Welcome Settings aus Supabase
async function loadWelcomeSettings(guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.error('❌ Supabase nicht initialisiert - Welcome System nicht verfügbar!');
        return null;
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
                thumbnail: 'custom', // Nur custom - wie gewünscht
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
        return null;
    }
}

// Speichere Welcome Settings in Supabase
async function saveWelcomeSettings(settings, guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.error('❌ Supabase nicht initialisiert - Welcome Settings können nicht gespeichert werden!');
        return { success: false, error: 'Supabase nicht verfügbar' };
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
            leave_message: settings.leaveMessage,
            updated_at: new Date().toISOString()
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
        return { success: false, error: error.message };
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
        thumbnail: 'custom', // Nur custom - wie gewünscht
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
// WELCOME IMAGES FUNKTIONEN (SUPABASE STORAGE)
// ==============================================

// Lade Welcome Images aus Supabase
async function loadWelcomeImages(guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.error('❌ Supabase nicht initialisiert - Welcome Images nicht verfügbar!');
        return { folders: {}, images: [], folderNames: [], allFolderNames: [] };
    }

    // Prüfe Cache
    const cacheKey = `images_${guildId}`;
    const cached = welcomeImagesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
    }

    try {
        console.log(`🔄 Lade Welcome Images & Folders für Guild ${guildId}...`);

        // 1. Lade ALLE verfügbaren Ordner aus welcome_folders
        const { data: folderDefinitions, error: folderError } = await supabaseClient
            .from('welcome_folders')
            .select('folder_name, display_name, emoji')
            .eq('guild_id', guildId)
            .order('folder_name');

        if (folderError) throw folderError;

        // Auto-create Standard-Ordner falls keine existieren
        if (!folderDefinitions || folderDefinitions.length === 0) {
            console.log('📁 Keine Ordner gefunden - erstelle Standard-Ordner...');
            await autoCreateGameFolders(guildId);
            
            // Lade Ordner nach Erstellung erneut
            const { data: newFolderDefinitions, error: newFolderError } = await supabaseClient
                .from('welcome_folders')
                .select('folder_name, display_name, emoji')
                .eq('guild_id', guildId)
                .order('folder_name');

            if (newFolderError) throw newFolderError;
            folderDefinitions = newFolderDefinitions || [];
        }

        // 2. Lade Bilder aus der Datenbank
        const { data: images, error: imageError } = await supabaseClient
            .from('welcome_images')
            .select('*')
            .eq('guild_id', guildId)
            .order('created_at', { ascending: false });

        if (imageError) throw imageError;

        // 3. Erstelle alle verfügbaren Ordner (auch leere)
        const folders = {};
        const allFolderNames = [];
        const folderNamesWithImages = new Set();

        // Initialisiere alle definierten Ordner
        folderDefinitions.forEach(folder => {
            const folderName = folder.folder_name;
            allFolderNames.push(folderName);
            folders[folderName] = [];
        });

        // 4. Organisiere Bilder in Ordner
        const allImages = [];
        images.forEach(image => {
            const folderName = image.folder_name || 'general';
            folderNamesWithImages.add(folderName);

            // Erstelle Ordner falls er nicht in der Definition existiert
            if (!folders[folderName]) {
                folders[folderName] = [];
                if (!allFolderNames.includes(folderName)) {
                    allFolderNames.push(folderName);
                }
            }

            const imageData = {
                id: image.id,
                filename: image.filename,
                originalName: image.original_name,
                folder: folderName,
                size: image.file_size,
                url: image.storage_url,
                created: new Date(image.created_at)
            };

            folders[folderName].push(imageData);
            allImages.push(imageData);
        });

        const result = {
            folders,
            images: allImages,
            folderNames: Array.from(folderNamesWithImages), // Nur Ordner mit Bildern
            allFolderNames: allFolderNames, // ALLE verfügbaren Ordner
            folderDefinitions: folderDefinitions // Ordner-Metadaten
        };

        // Cache aktualisieren
        welcomeImagesCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        console.log(`✅ ${allImages.length} Welcome Images aus ${allFolderNames.length} Ordnern geladen`);
        return result;

    } catch (error) {
        console.error('❌ Fehler beim Laden der Welcome Images:', error);
        return { folders: {}, images: [], folderNames: [], allFolderNames: [] };
    }
}

// Upload Bild zu Supabase Storage
async function saveWelcomeImage(imageData, guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.error('❌ Supabase nicht initialisiert - Bild kann nicht gespeichert werden!');
        return { success: false, error: 'Supabase nicht verfügbar' };
    }

    try {
        console.log(`📤 Speichere Welcome Image: ${imageData.filename}...`);

        // 1. Upload Bild zu Supabase Storage
        const storagePath = `welcome/${guildId}/${imageData.folder || 'general'}/${imageData.filename}`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('welcome-images')
            .upload(storagePath, imageData.buffer, {
                contentType: imageData.mimetype,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 2. Hole öffentliche URL
        const { data: urlData } = supabaseClient.storage
            .from('welcome-images')
            .getPublicUrl(storagePath);

        // 3. Speichere Metadata in Datenbank
        const { error: dbError } = await supabaseClient
            .from('welcome_images')
            .insert({
                guild_id: guildId,
                filename: imageData.filename,
                original_name: imageData.originalName,
                folder_name: imageData.folder || 'general',
                storage_path: storagePath,
                storage_url: urlData.publicUrl,
                file_size: imageData.size,
                mime_type: imageData.mimetype
            });

        if (dbError) throw dbError;

        // Cache invalidieren
        welcomeImagesCache.delete(`images_${guildId}`);

        console.log('✅ Welcome Image in Supabase gespeichert');
        return { 
            success: true, 
            url: urlData.publicUrl,
            filename: imageData.filename,
            folder: imageData.folder || 'general'
        };

    } catch (error) {
        console.error('❌ Fehler beim Speichern des Welcome Images:', error);
        return { success: false, error: error.message };
    }
}

// Lösche Bild aus Supabase
async function deleteWelcomeImage(imageId, guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.error('❌ Supabase nicht initialisiert - Bild kann nicht gelöscht werden!');
        return { success: false, error: 'Supabase nicht verfügbar' };
    }

    try {
        console.log(`🗑️ Lösche Welcome Image ID: ${imageId}...`);

        // 1. Hole Image-Daten für Storage-Path
        const { data: imageData, error: fetchError } = await supabaseClient
            .from('welcome_images')
            .select('storage_path')
            .eq('id', imageId)
            .eq('guild_id', guildId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Lösche aus Storage
        const { error: storageError } = await supabaseClient.storage
            .from('welcome-images')
            .remove([imageData.storage_path]);

        if (storageError) throw storageError;

        // 3. Lösche aus Datenbank
        const { error: dbError } = await supabaseClient
            .from('welcome_images')
            .delete()
            .eq('id', imageId)
            .eq('guild_id', guildId);

        if (dbError) throw dbError;

        // Cache invalidieren
        welcomeImagesCache.delete(`images_${guildId}`);

        console.log('✅ Welcome Image aus Supabase gelöscht');
        return { success: true };

    } catch (error) {
        console.error('❌ Fehler beim Löschen des Welcome Images:', error);
        return { success: false, error: error.message };
    }
}

// ==============================================
// WELCOME FOLDERS FUNKTIONEN (SUPABASE)
// ==============================================

// Erstelle neuen Ordner in Supabase
async function createWelcomeFolder(folderName, guildId = process.env.GUILD_ID || '1203994020779532348', displayName = null, emoji = null) {
    if (!supabaseClient) {
        console.error('❌ Supabase nicht initialisiert - Ordner kann nicht erstellt werden!');
        return { success: false, error: 'Supabase nicht verfügbar' };
    }

    try {
        console.log(`📁 Erstelle Welcome Folder: ${folderName}...`);

        const { error } = await supabaseClient
            .from('welcome_folders')
            .insert({
                guild_id: guildId,
                folder_name: folderName,
                display_name: displayName || folderName.charAt(0).toUpperCase() + folderName.slice(1),
                emoji: emoji || getFolderEmoji(folderName),
                description: `Folder für ${folderName} Bilder`
            });

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return { success: false, error: 'Ordner existiert bereits' };
            }
            throw error;
        }

        // Cache invalidieren
        welcomeFoldersCache.delete(`folders_${guildId}`);
        welcomeImagesCache.delete(`images_${guildId}`);

        console.log('✅ Welcome Folder in Supabase erstellt');
        return { success: true, folderName };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Welcome Folders:', error);
        return { success: false, error: error.message };
    }
}

// Lösche Ordner aus Supabase
async function deleteWelcomeFolder(folderName, guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.error('❌ Supabase nicht initialisiert - Ordner kann nicht gelöscht werden!');
        return { success: false, error: 'Supabase nicht verfügbar' };
    }

    try {
        console.log(`🗑️ Lösche Welcome Folder: ${folderName}...`);

        // 1. Lösche alle Bilder in diesem Ordner zuerst
        const { data: images, error: fetchError } = await supabaseClient
            .from('welcome_images')
            .select('id, storage_path')
            .eq('guild_id', guildId)
            .eq('folder_name', folderName);

        if (fetchError) throw fetchError;

        // Lösche Bilder aus Storage und DB
        for (const image of images) {
            await supabaseClient.storage
                .from('welcome-images')
                .remove([image.storage_path]);
            
            await supabaseClient
                .from('welcome_images')
                .delete()
                .eq('id', image.id);
        }

        // 2. Lösche Ordner
        const { error } = await supabaseClient
            .from('welcome_folders')
            .delete()
            .eq('guild_id', guildId)
            .eq('folder_name', folderName);

        if (error) throw error;

        // Cache invalidieren
        welcomeFoldersCache.delete(`folders_${guildId}`);
        welcomeImagesCache.delete(`images_${guildId}`);

        console.log('✅ Welcome Folder aus Supabase gelöscht');
        return { success: true };

    } catch (error) {
        console.error('❌ Fehler beim Löschen des Welcome Folders:', error);
        return { success: false, error: error.message };
    }
}

// Erstelle Standard-Ordner automatisch
async function autoCreateGameFolders(guildId = process.env.GUILD_ID || '1203994020779532348') {
    const standardFolders = [
        { name: 'general', display: 'Allgemein', emoji: '📁' },
        { name: 'valorant', display: 'Valorant', emoji: '🎯' },
        { name: 'minecraft', display: 'Minecraft', emoji: '⛏️' },
        { name: 'beellgrounds', display: 'Beellgrounds', emoji: '🐝' },
        { name: 'gaming', display: 'Gaming', emoji: '🎮' },
        { name: 'anime', display: 'Anime', emoji: '🎌' },
        { name: 'memes', display: 'Memes', emoji: '😂' },
        { name: 'seasonal', display: 'Seasonal', emoji: '🎄' }
    ];

    console.log('🎮 Erstelle Standard Game Folders...');

    for (const folder of standardFolders) {
        const result = await createWelcomeFolder(folder.name, guildId, folder.display, folder.emoji);
        if (result.success) {
            console.log(`✅ Ordner "${folder.name}" erstellt`);
        } else if (result.error && !result.error.includes('already exists') && !result.error.includes('existiert bereits')) {
            console.error(`❌ Fehler bei Ordner "${folder.name}":`, result.error);
        }
    }

    console.log('✅ Standard Folders Initialisierung abgeschlossen');
}

// Hole Emoji für Ordner-Typ
function getFolderEmoji(folderName) {
    const emojiMap = {
        'general': '📁',
        'valorant': '🎯',
        'minecraft': '⛏️',
        'beellgrounds': '🐝',
        'gaming': '🎮',
        'anime': '🎌',
        'memes': '😂',
        'seasonal': '🎄'
    };
    
    return emojiMap[folderName.toLowerCase()] || '📁';
}

// ==============================================
// WELCOME EMBED FUNKTIONEN
// ==============================================

// Hole zufälliges Welcome-Bild aus Supabase
async function getRandomWelcomeImage(specificFolder = null, guildId = process.env.GUILD_ID || '1203994020779532348') {
    if (!supabaseClient) {
        console.error('❌ Supabase nicht initialisiert - Keine Bilder verfügbar!');
        return null;
    }

    try {
        const { images } = await loadWelcomeImages(guildId);
        
        let availableImages = images;
        if (specificFolder) {
            availableImages = images.filter(img => img.folder === specificFolder);
        }

        if (availableImages.length === 0) {
            console.log(`⚠️ Keine Bilder gefunden${specificFolder ? ` in Ordner: ${specificFolder}` : ''}`);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const randomImage = availableImages[randomIndex];
        
        console.log(`🎲 Zufälliges Welcome-Bild gewählt: ${randomImage.folder}/${randomImage.filename}`);
        return randomImage.url;

    } catch (error) {
        console.error('❌ Fehler beim Laden des zufälligen Welcome-Bildes:', error);
        return null;
    }
}

// Erstelle Welcome-Embed mit Supabase-Daten
async function createWelcomeEmbed(guild, member, settings) {
    if (!settings) {
        console.error('❌ Keine Welcome Settings vorhanden!');
        return { embed: null, attachment: null };
    }

    try {
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

        // Bild setzen (nur custom mit Supabase)
        if (settings.imageRotation && settings.imageRotation.enabled) {
            const randomImageUrl = await getRandomWelcomeImage(settings.imageRotation.folder, guild.id);
            if (randomImageUrl) {
                embed.setImage(randomImageUrl);
                console.log(`🎲 Zufälliges Welcome-Bild verwendet: ${randomImageUrl}`);
            }
        } else if (settings.customThumbnail) {
            embed.setImage(settings.customThumbnail);
            console.log(`📌 Spezifisches Bild verwendet: ${settings.customThumbnail}`);
        }

        // Felder hinzufügen
        if (settings.fields && Array.isArray(settings.fields)) {
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

        return { embed, attachment: null };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Welcome-Embeds:', error);
        return { embed: null, attachment: null };
    }
}

// Erstelle Leave-Embed mit Supabase-Daten
async function createLeaveEmbed(guild, member, leaveSettings) {
    if (!leaveSettings) {
        console.error('❌ Keine Leave Settings vorhanden!');
        return null;
    }

    try {
        const { 
            title = '👋 Tschüss!',
            description = '**{user}** hat den Server verlassen. Auf Wiedersehen!',
            color = '0xFF6B6B'
        } = leaveSettings;

        // Erstelle Discord Embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(parseInt(color.replace('0x', ''), 16))
            .setTimestamp();

        // Verarbeite Platzhalter in der Beschreibung
        let processedDescription = description
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

        console.log(`✅ Leave-Embed erstellt für ${member.user.tag}`);
        return embed;

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Leave-Embeds:', error);
        return null;
    }
}

// ==============================================
// STATISTIKEN FUNKTIONEN
// ==============================================

// Aktualisiere Welcome-Statistiken
async function updateWelcomeStats(guildId, statType) {
    if (!supabaseClient) {
        console.log('⚠️ Supabase nicht verfügbar - Statistiken werden nicht aktualisiert');
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { error } = await supabaseClient
            .from('welcome_stats')
            .upsert({
                guild_id: guildId,
                date: today,
                welcome_count: statType === 'welcome' ? 1 : 0,
                leave_count: statType === 'leave' ? 1 : 0
            }, {
                onConflict: 'guild_id,date',
                ignoreDuplicates: false
            });

        if (error) throw error;
        
        console.log(`📊 Welcome Stats aktualisiert: ${statType}`);

    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Welcome Stats:', error);
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
    deleteWelcomeImage,
    createWelcomeFolder,
    deleteWelcomeFolder,
    autoCreateGameFolders,
    getRandomWelcomeImage,
    createWelcomeEmbed,
    createLeaveEmbed,
    updateWelcomeStats
}; 