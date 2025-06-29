const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
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
     * Create crosshair panel embed with buttons
     */
    createCrosshairPanel() {
        const embed = new EmbedBuilder()
            .setTitle('🎯 Valorant Crosshair Generator')
            .setDescription('Generiere hochauflösende Bilder deiner Valorant Crosshairs!')
            .addFields(
                { 
                    name: '📋 Wie es funktioniert', 
                    value: '1. Kopiere deinen Crosshair-Code aus Valorant\n2. Klicke auf "Crosshair generieren"\n3. Füge den Code ein und bestätige\n4. Erhalte dein 1024x1024px Crosshair-Bild', 
                    inline: false 
                },
                { 
                    name: '🎮 Crosshair-Code finden', 
                    value: 'Valorant → Einstellungen → Crosshair → Teilen → Code kopieren', 
                    inline: true 
                },
                { 
                    name: '⚡ Beispiel-Code', 
                    value: '`0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0`', 
                    inline: true 
                }
            )
            .setColor('#FF4655')
            .setThumbnail('https://i.imgur.com/ZQpT5nR.png') // Valorant Crosshair Icon
            .setTimestamp()
            .setFooter({ 
                text: 'Powered by AgentBee Bot',
                iconURL: 'https://i.imgur.com/8QpCQx8.png'
            });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('crosshair_generate')
                    .setLabel('🎯 Crosshair generieren')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('crosshair_help')
                    .setLabel('❓ Hilfe')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('crosshair_examples')
                    .setLabel('📝 Beispiele')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [buttons] };
    }

    /**
     * Create crosshair input modal
     */
    createCrosshairModal() {
        const modal = new ModalBuilder()
            .setCustomId('crosshair_input_modal')
            .setTitle('🎯 Crosshair Code eingeben');

        const codeInput = new TextInputBuilder()
            .setCustomId('crosshair_code')
            .setLabel('Valorant Crosshair Code')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0')
            .setRequired(true)
            .setMaxLength(200);

        const actionRow = new ActionRowBuilder().addComponents(codeInput);
        modal.addComponents(actionRow);

        return modal;
    }

    /**
     * Handle crosshair panel button interactions
     */
    async handleCrosshairButton(interaction) {
        try {
            switch (interaction.customId) {
                case 'crosshair_generate':
                    const modal = this.createCrosshairModal();
                    await interaction.showModal(modal);
                    break;

                case 'crosshair_creator':
                    await this.handleCrosshairCreator(interaction);
                    break;

                case 'crosshair_code_input':
                    const codeModal = this.createCrosshairModal();
                    await interaction.showModal(codeModal);
                    break;

                case 'crosshair_help':
                    await this.showCrosshairHelp(interaction);
                    break;

                case 'crosshair_examples':
                    await this.showCrosshairExamples(interaction);
                    break;

                default:
                    await interaction.reply({
                        content: '❌ Unbekannte Button-Aktion',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Fehler beim Verarbeiten des Crosshair-Buttons:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ **Fehler beim Verarbeiten der Aktion**',
                    ephemeral: true
                });
            }
        }
    }

    /**
     * Handle crosshair modal submission
     */
    async handleCrosshairModal(interaction) {
        try {
            await interaction.deferReply({ ephemeral: false });

            const crosshairCode = interaction.fields.getTextInputValue('crosshair_code');
            
            // Generate crosshair image
            const result = await this.generateCrosshair(crosshairCode);

            if (!result.success) {
                return await interaction.editReply({
                    content: `❌ **Fehler beim Generieren des Crosshairs:** ${result.error}`
                });
            }

            // Create attachment and embed
            const attachment = new AttachmentBuilder(result.imageBuffer, { 
                name: `crosshair_${Date.now()}.png`,
                description: 'Valorant Crosshair'
            });

            const embed = this.createCrosshairEmbed(crosshairCode, interaction.user.tag);
            embed.setImage(`attachment://${attachment.name}`);

            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });

            console.log(`✅ Crosshair über Panel generiert für User: ${interaction.user.tag}`);

        } catch (error) {
            console.error('Fehler beim Verarbeiten des Crosshair-Modals:', error);
            
            const errorMessage = error.message || 'Unbekannter Fehler';
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: `❌ **Unerwarteter Fehler:** ${errorMessage}`
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
     * Show crosshair help information
     */
    async showCrosshairHelp(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setTitle('❓ Crosshair System Hilfe')
            .setDescription('Hier findest du alle Informationen zum Crosshair-Generator')
            .addFields(
                {
                    name: '🎮 Crosshair-Code finden',
                    value: '1. Öffne Valorant\n2. Gehe zu **Einstellungen**\n3. Wähle **Crosshair**\n4. Klicke auf **Teilen**\n5. **Code kopieren**',
                    inline: false
                },
                {
                    name: '📋 Commands',
                    value: '• `/crosshair id:dein_code` - Generiert Crosshair\n• Panel-Buttons für einfache Bedienung',
                    inline: false
                },
                {
                    name: '⚡ Features',
                    value: '• 1024x1024px hochauflösende Bilder\n• Unterstützt alle Valorant Crosshair-Codes\n• Sofortige Generierung',
                    inline: false
                },
                {
                    name: '🔒 Limits',
                    value: '• 30 Requests pro Minute\n• Abhängig vom API-Key-Typ\n• Fair-Use-Policy',
                    inline: false
                }
            )
            .setColor('#FF4655')
            .setTimestamp();

        await interaction.reply({
            embeds: [helpEmbed],
            ephemeral: true
        });
    }

    /**
     * Show crosshair examples
     */
    async showCrosshairExamples(interaction) {
        const examplesEmbed = new EmbedBuilder()
            .setTitle('📝 Crosshair Code Beispiele')
            .setDescription('Hier sind einige beliebte Crosshair-Codes zum Ausprobieren:')
            .addFields(
                {
                    name: '🎯 Standard Crosshair',
                    value: '```0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0```',
                    inline: false
                },
                {
                    name: '🔥 Pro Player Style',
                    value: '```0;p=1;o=1;f=0;0t=4;0l=2;0o=2;0a=1;0f=0;1b=0```',
                    inline: false
                },
                {
                    name: '💎 Precision Crosshair',
                    value: '```0;p=0;o=1;f=0;0t=1;0l=1;0o=1;0a=1;0f=0;1b=0```',
                    inline: false
                },
                {
                    name: '⭐ Classic Style',
                    value: '```0;p=0;o=1;f=0;0t=2;0l=3;0o=2;0a=1;0f=0;1b=0```',
                    inline: false
                }
            )
            .addFields({
                name: '💡 Tipp',
                value: 'Kopiere einen Code und verwende ihn mit dem "Crosshair generieren" Button!',
                inline: false
            })
            .setColor('#FF4655')
            .setTimestamp();

        await interaction.reply({
            embeds: [examplesEmbed],
            ephemeral: true
        });
    }

    /**
     * Erstellt ein verbessertes Crosshair-Panel mit Creator-Modal
     * @param {string} channelName - Name des Channels
     * @returns {Object} - Ergebnis des Panel-Sendens
     */
    async sendCrosshairPanel(channelName) {
        try {
            const channel = this.findChannelByName(channelName);
            
            if (!channel) {
                throw new Error(`Channel "${channelName}" nicht gefunden`);
            }

            const embed = new EmbedBuilder()
                .setTitle('🎯 Valorant Crosshair Generator')
                .setDescription('**Erstelle und generiere deine perfekten Valorant Crosshairs!**\n\n' +
                               '• **🎨 Crosshair Creator**: Erstelle dein eigenes Crosshair\n' +
                               '• **📋 Code eingeben**: Nutze bereits vorhandene Codes\n' +
                               '• **🔄 Sofort-Generierung**: 1024x1024px PNG-Bilder\n' +
                               '• **📱 Einfache Bedienung**: Alles mit wenigen Klicks')
                .setColor(0x00FF7F)
                .addFields(
                    {
                        name: '🎨 Crosshair Creator',
                        value: 'Erstelle dein individuelles Crosshair mit allen Einstellungen:\n• Farbe, Dicke, Länge\n• Punkt-Optionen\n• Innere/Äußere Linien\n• Transparenz-Einstellungen',
                        inline: true
                    },
                    {
                        name: '📋 Code Generator',
                        value: 'Gib deinen bestehenden Valorant Code ein:\n• Aus den Spiel-Einstellungen kopieren\n• Automatische Code-Validierung\n• Sofort-Vorschau verfügbar',
                        inline: true
                    },
                    {
                        name: '🔧 Pro Features',
                        value: '• HenrikDev API Integration\n• Hochauflösende Bilder\n• Schnelle Generierung\n• Unbegrenzte Erstellungen',
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: 'Powered by AgentBee Bot',
                    iconURL: 'https://i.imgur.com/8QpCQx8.png'
                });

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('crosshair_creator')
                        .setLabel('🎨 Crosshair Creator')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎨'),
                    new ButtonBuilder()
                        .setCustomId('crosshair_code_input')
                        .setLabel('📋 Code eingeben')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📋'),
                    new ButtonBuilder()
                        .setCustomId('crosshair_help')
                        .setLabel('❓ Hilfe')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('❓')
                );

            await channel.send({ embeds: [embed], components: [actionRow] });
            
            this.log(`✅ Verbessertes Crosshair-Panel in #${channelName} gesendet`);
            return { success: true, channel: channelName };

        } catch (error) {
            this.log(`❌ Fehler beim Senden des Crosshair-Panels: ${error.message}`);
            throw error;
        }
    }

    /**
     * Behandelt das Crosshair Creator Modal
     * @param {Interaction} interaction - Discord Interaction
     */
    async handleCrosshairCreator(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('crosshair_creator_modal')
                .setTitle('🎨 Crosshair Creator');

            // Creator Optionen als Text-Inputs (vereinfacht für Modal)
            const primaryColorInput = new TextInputBuilder()
                .setCustomId('primary_color')
                .setLabel('Primärfarbe (0-7)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('0=Weiß, 1=Rot, 2=Grün, 3=Gelb, 4=Blau, 5=Cyan, 6=Pink, 7=Orange')
                .setValue('0')
                .setMaxLength(1)
                .setRequired(true);

            const centerDotInput = new TextInputBuilder()
                .setCustomId('center_dot')
                .setLabel('Mittelpunkt (0=Aus, 1=An)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('0 oder 1')
                .setValue('1')
                .setMaxLength(1)
                .setRequired(true);

            const thicknessInput = new TextInputBuilder()
                .setCustomId('thickness')
                .setLabel('Linienstärke (1-8)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('1-8')
                .setValue('2')
                .setMaxLength(1)
                .setRequired(true);

            const lengthInput = new TextInputBuilder()
                .setCustomId('length')
                .setLabel('Linienlänge (1-50)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('1-50')
                .setValue('6')
                .setMaxLength(2)
                .setRequired(true);

            const offsetInput = new TextInputBuilder()
                .setCustomId('offset')
                .setLabel('Linienabstand (0-50)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('0-50')
                .setValue('3')
                .setMaxLength(2)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(primaryColorInput),
                new ActionRowBuilder().addComponents(centerDotInput),
                new ActionRowBuilder().addComponents(thicknessInput),
                new ActionRowBuilder().addComponents(lengthInput),
                new ActionRowBuilder().addComponents(offsetInput)
            );

            await interaction.showModal(modal);

        } catch (error) {
            this.log(`❌ Fehler beim Crosshair Creator: ${error.message}`);
            await interaction.reply({ 
                content: '❌ Fehler beim Öffnen des Crosshair Creators!', 
                ephemeral: true 
            });
        }
    }

    /**
     * Behandelt das eingereichte Crosshair Creator Modal
     * @param {Interaction} interaction - Modal Submit Interaction
     */
    async handleCrosshairCreatorSubmit(interaction) {
        try {
            await interaction.deferReply();

            // Werte aus Modal extrahieren
            const primaryColor = parseInt(interaction.fields.getTextInputValue('primary_color')) || 0;
            const centerDot = parseInt(interaction.fields.getTextInputValue('center_dot')) || 0;
            const thickness = parseInt(interaction.fields.getTextInputValue('thickness')) || 2;
            const length = parseInt(interaction.fields.getTextInputValue('length')) || 6;
            const offset = parseInt(interaction.fields.getTextInputValue('offset')) || 3;

            // Validierung
            if (primaryColor < 0 || primaryColor > 7) {
                throw new Error('Primärfarbe muss zwischen 0-7 sein');
            }
            if (centerDot < 0 || centerDot > 1) {
                throw new Error('Mittelpunkt muss 0 oder 1 sein');
            }
            if (thickness < 1 || thickness > 8) {
                throw new Error('Linienstärke muss zwischen 1-8 sein');
            }
            if (length < 1 || length > 50) {
                throw new Error('Linienlänge muss zwischen 1-50 sein');
            }
            if (offset < 0 || offset > 50) {
                throw new Error('Linienabstand muss zwischen 0-50 sein');
            }

            // Crosshair-Code generieren
            const crosshairCode = `0;p=${primaryColor};o=1;f=0;0t=${centerDot};0l=${thickness};0o=1;0a=1;0f=0;1b=0;1s=1;1l=${length};1t=${thickness};1o=${offset};1a=1;1m=0;1f=0;2b=1;2s=1;2l=${length};2t=${thickness};2o=${offset};2a=1;2m=0;2f=0`;

            this.log(`🎨 Generiere Custom Crosshair für ${interaction.user.tag}: ${crosshairCode}`);

            // Crosshair generieren
            const result = await this.generateCrosshair(crosshairCode, interaction.user.id);

            if (result.success) {
                const colorNames = ['Weiß', 'Rot', 'Grün', 'Gelb', 'Blau', 'Cyan', 'Pink', 'Orange'];
                
                const embed = new EmbedBuilder()
                    .setTitle('🎨 Dein Custom Crosshair')
                    .setDescription(`**Erfolgreich erstellt!**\n\n**Einstellungen:**\n• Farbe: ${colorNames[primaryColor]}\n• Mittelpunkt: ${centerDot ? 'An' : 'Aus'}\n• Stärke: ${thickness}\n• Länge: ${length}\n• Abstand: ${offset}`)
                    .setColor(0x00FF7F)
                    .addFields(
                        {
                            name: '📋 Crosshair Code',
                            value: `\`\`\`${crosshairCode}\`\`\``,
                            inline: false
                        }
                    )
                    .setImage('attachment://crosshair.png')
                    .setTimestamp()
                    .setFooter({ 
                        text: `Erstellt von ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                await interaction.editReply({
                    embeds: [embed],
                    files: [result.attachment]
                });

                // Statistiken aktualisieren
                this.updateStats('generated');

            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            this.log(`❌ Fehler beim Verarbeiten des Custom Crosshairs: ${error.message}`);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Fehler beim Erstellen')
                .setDescription(`**Fehler:** ${error.message}`)
                .setColor(0xFF0000)
                .addFields(
                    {
                        name: '💡 Tipps',
                        value: '• Überprüfe deine Eingaben\n• Alle Werte müssen in den angegebenen Bereichen liegen\n• Verwende nur Zahlen',
                        inline: false
                    }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
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