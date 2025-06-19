// Ticket API Endpoints (wie im Giveaway-System)
const express = require('express');

function registerTicketAPI(app, client) {
    // Ticket-Einstellungen abrufen
    app.get('/api/tickets', (req, res) => {
        try {
            const ticketSystem = client.ticketSystemV2;
            if (!ticketSystem) {
                return res.status(503).json({ error: 'Ticket-System noch nicht initialisiert' });
            }
            res.json({
                success: true,
                settings: ticketSystem.settings,
                version: '2.0',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Fehler beim Laden der Ticket-Einstellungen:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Einstellungen' });
        }
    });

    // Ticket-Einstellungen speichern
    app.post('/api/tickets', async (req, res) => {
        try {
            const ticketSystem = client.ticketSystemV2;
            if (!ticketSystem) {
                return res.status(503).json({ error: 'Ticket-System noch nicht initialisiert' });
            }
            const newSettings = req.body;
            
            console.log('📝 [V2] Empfange Ticket-Einstellungen Update...');
            console.log(`🎨 Farbe: ${newSettings.embed?.color}`);
            
            const savedSettings = await ticketSystem.updateSettings(newSettings);
            
            console.log('✅ Ticket-Einstellungen gespeichert');
            res.json({ 
                success: true, 
                message: 'Einstellungen gespeichert!',
                settings: savedSettings,
                version: '2.0'
            });
        } catch (error) {
            console.error('Fehler beim Speichern der Ticket-Einstellungen:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen' });
        }
    });

    // Ticket-Statistiken abrufen
    app.get('/api/tickets/stats', (req, res) => {
        try {
            const ticketSystem = client.ticketSystemV2;
            if (!ticketSystem) {
                return res.status(503).json({ error: 'Ticket-System noch nicht initialisiert' });
            }
            res.json(ticketSystem.getTicketStats());
        } catch (error) {
            console.error('Fehler beim Laden der Ticket-Statistiken:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Ticket-Statistiken' });
        }
    });

    // Ticket-Nachricht posten
    app.post('/api/tickets/post', async (req, res) => {
        if (!client.isReady()) {
            return res.status(503).json({ error: 'Bot ist nicht online' });
        }

        try {
            const { channelName } = req.body;
            const ticketSystem = client.ticketSystemV2;
            
            if (!ticketSystem) {
                return res.status(503).json({ error: 'Ticket-System noch nicht initialisiert' });
            }

            // Finde den Channel in allen Servern
            let targetChannel = null;
            for (const guild of client.guilds.cache.values()) {
                const channel = guild.channels.cache.find(ch => 
                    ch.name === channelName && ch.type === 0 // Text Channel
                );
                if (channel) {
                    targetChannel = channel;
                    break;
                }
            }

            if (!targetChannel) {
                return res.status(404).json({ error: `Channel "${channelName}" nicht gefunden` });
            }

            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

            // Erstelle Embed mit aktuellen Settings
            const embed = new EmbedBuilder()
                .setTitle(ticketSystem.settings.embed.title)
                .setDescription(ticketSystem.settings.embed.description)
                .setColor(parseInt(ticketSystem.settings.embed.color.replace('0x', ''), 16))
                .setFooter({ text: ticketSystem.settings.embed.footer });

            // Erstelle Buttons
            const buttons = [];
            let currentRow = new ActionRowBuilder();
            let buttonCount = 0;

            for (const button of ticketSystem.settings.buttons) {
                if (buttonCount === 5) {
                    buttons.push(currentRow);
                    currentRow = new ActionRowBuilder();
                    buttonCount = 0;
                }

                const buttonStyle = {
                    'PRIMARY': ButtonStyle.Primary,
                    'SECONDARY': ButtonStyle.Secondary,
                    'SUCCESS': ButtonStyle.Success,
                    'DANGER': ButtonStyle.Danger
                }[button.style] || ButtonStyle.Primary;

                const discordButton = new ButtonBuilder()
                    .setCustomId(`ticket_create_${button.id}`)
                    .setLabel(button.label)
                    .setStyle(buttonStyle);

                if (button.emoji) {
                    discordButton.setEmoji(button.emoji);
                }

                currentRow.addComponents(discordButton);
                buttonCount++;
            }

            if (buttonCount > 0) {
                buttons.push(currentRow);
            }

            await targetChannel.send({
                embeds: [embed],
                components: buttons
            });

            res.json({ success: true, message: 'Ticket-Nachricht erfolgreich gepostet!' });
            
        } catch (error) {
            console.error('❌ Fehler beim Posten der Ticket-Nachricht:', error);
            res.status(500).json({ error: 'Fehler beim Posten der Ticket-Nachricht' });
        }
    });
}

module.exports = { registerTicketAPI }; 