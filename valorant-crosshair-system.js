const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

/**
 * Valorant Crosshair System - Generates crosshair images using HenrikDev API
 */
class ValorantCrosshairSystem {
    constructor() {
        this.apiKey = process.env.HENRIKDEV_API_KEY;
        this.baseUrl = 'https://api.henrikdev.xyz/valorant/v1';
        
        if (!this.apiKey) {
            console.log('⚠️ HENRIKDEV_API_KEY nicht in Umgebungsvariablen gefunden');
        }
    }

    /**
     * Generate crosshair image from crosshair ID
     */
    async generateCrosshair(crosshairId) {
        try {
            const response = await axios.get(`${this.baseUrl}/crosshair/generate`, {
                params: {
                    id: crosshairId
                },
                headers: {
                    'Authorization': this.apiKey
                },
                responseType: 'arraybuffer',
                timeout: 15000
            });

            if (response.status === 200) {
                return {
                    success: true,
                    imageBuffer: Buffer.from(response.data),
                    contentType: response.headers['content-type'] || 'image/png'
                };
            }

            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`
            };

        } catch (error) {
            console.error('Fehler beim Generieren des Crosshairs:', error.message);
            
            if (error.response) {
                const status = error.response.status;
                switch (status) {
                    case 400:
                        return { success: false, error: 'Ungültige Crosshair-ID oder Parameter' };
                    case 403:
                        return { success: false, error: 'API-Zugriff verweigert (Wartung oder Rate-Limit)' };
                    case 404:
                        return { success: false, error: 'Crosshair nicht gefunden' };
                    case 408:
                        return { success: false, error: 'Timeout beim Abrufen der Daten' };
                    case 429:
                        return { success: false, error: 'Rate-Limit erreicht. Versuche es später erneut' };
                    case 503:
                        return { success: false, error: 'Valorant-API vorübergehend nicht verfügbar' };
                    default:
                        return { success: false, error: `HTTP-Fehler ${status}` };
                }
            }

            return { success: false, error: 'Netzwerk- oder API-Fehler' };
        }
    }

    /**
     * Parse crosshair code to extract settings
     */
    parseCrosshairCode(crosshairCode) {
        try {
            // Valorant crosshair codes start with "0;" followed by parameters
            if (!crosshairCode.startsWith('0;')) {
                throw new Error('Ungültiger Crosshair-Code');
            }

            const parts = crosshairCode.split(';');
            const settings = {};

            // Parse the crosshair settings
            for (let i = 1; i < parts.length; i++) {
                const [key, value] = parts[i].split('=');
                if (key && value) {
                    settings[key] = value;
                }
            }

            return {
                success: true,
                settings: settings,
                raw: crosshairCode
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create crosshair embed
     */
    createCrosshairEmbed(crosshairId, userTag) {
        const embed = new EmbedBuilder()
            .setTitle('🎯 Valorant Crosshair')
            .setDescription(`Crosshair generiert für **${userTag}**`)
            .addFields(
                { name: '🆔 Crosshair-ID', value: `\`${crosshairId}\``, inline: true },
                { name: '⏰ Erstellt', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setColor('#FF4655')
            .setTimestamp()
            .setFooter({ 
                text: 'Powered by HenrikDev API',
                iconURL: 'https://i.imgur.com/8QpCQx8.png'
            });

        return embed;
    }

    /**
     * Register crosshair slash commands
     */
    getSlashCommands() {
        return [
            {
                name: 'crosshair',
                description: 'Generiere ein Valorant Crosshair-Bild',
                options: [
                    {
                        name: 'id',
                        description: 'Crosshair-ID oder vollständiger Crosshair-Code',
                        type: 3, // STRING
                        required: true
                    }
                ]
            }
        ];
    }

    /**
     * Handle crosshair slash command
     */
    async handleCrosshairCommand(interaction) {
        try {
            await interaction.deferReply();

            const input = interaction.options.getString('id');
            
            // Extract crosshair ID from code if full code provided
            let crosshairId = input;
            
            // If it's a full crosshair code, extract just the ID part
            if (input.includes(';')) {
                const parsed = this.parseCrosshairCode(input);
                if (parsed.success) {
                    // Use the raw code as ID for the API
                    crosshairId = input;
                } else {
                    return await interaction.editReply({
                        content: `❌ **Fehler:** ${parsed.error}`,
                        ephemeral: true
                    });
                }
            }

            // Generate crosshair image
            const result = await this.generateCrosshair(crosshairId);

            if (!result.success) {
                return await interaction.editReply({
                    content: `❌ **Fehler beim Generieren des Crosshairs:** ${result.error}`,
                    ephemeral: true
                });
            }

            // Create attachment and embed
            const attachment = new AttachmentBuilder(result.imageBuffer, { 
                name: `crosshair_${Date.now()}.png`,
                description: 'Valorant Crosshair'
            });

            const embed = this.createCrosshairEmbed(crosshairId, interaction.user.tag);
            embed.setImage(`attachment://${attachment.name}`);

            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });

            console.log(`✅ Crosshair generiert für User: ${interaction.user.tag} (ID: ${crosshairId})`);

        } catch (error) {
            console.error('Fehler beim Verarbeiten des Crosshair-Kommandos:', error);
            
            const errorMessage = error.message || 'Unbekannter Fehler';
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: `❌ **Unerwarteter Fehler:** ${errorMessage}`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `❌ **Unerwarteter Fehler:** ${errorMessage}`,
                    ephemeral: true
                });
            }
        }
    }

    /**
     * Get help information for crosshair commands
     */
    getCrosshairHelp() {
        return {
            title: '🎯 Valorant Crosshair System',
            description: 'Generiere Valorant Crosshair-Bilder mit der HenrikDev API',
            commands: [
                {
                    name: '/crosshair',
                    description: 'Generiert ein Crosshair-Bild aus einer ID oder einem Code',
                    usage: '/crosshair id:`deine_crosshair_id`',
                    examples: [
                        '`/crosshair id:0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0`',
                        '`/crosshair id:simple_crosshair_id`'
                    ]
                }
            ],
            notes: [
                '• Crosshair-IDs können aus dem Spiel kopiert werden',
                '• Vollständige Crosshair-Codes werden automatisch erkannt',
                '• Das generierte Bild ist 1024x1024 Pixel groß',
                '• API-Rate-Limits: 30-90 Requests pro Minute je nach Key-Typ'
            ]
        };
    }
}

module.exports = ValorantCrosshairSystem; 