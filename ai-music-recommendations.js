const express = require('express');
const router = express.Router();

// OpenAI Integration
let openai;
try {
  const { OpenAI } = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY
  });
} catch (error) {
  console.log('⚠️ OpenAI nicht verfügbar:', error.message);
}

// Musik-Discovery Prompts für NEUE Songs
const MUSIC_PROMPTS = {
  similarSongs: (songs) => `
Du bist ein Musik-Experte für Song-Discovery. Analysiere diese Playlist:
${songs.map(s => `- ${s.title} von ${s.artist}`).join('\n')}

Schlage 10-15 NEUE Songs vor, die perfekt zu dieser Playlist passen würden.
Berücksichtige: Genre, Stimmung, Tempo, Energie-Level, Künstler-Stil und Jahrzehnt.

WICHTIG: Schlage Songs vor, die der User noch NICHT hat, aber die thematisch und stilistisch perfekt passen!

Antworte mit einem JSON Array mit Objekten:
[
  {"title": "Song Titel", "artist": "Künstler Name", "reason": "Passt weil ähnlicher Vibe/Genre"},
  {"title": "Song Titel 2", "artist": "Künstler Name 2", "reason": "Ähnliche Energie und Stimmung"}
]
`,

  moodBasedSuggestions: (mood, genre) => `
Erstelle Song-Empfehlungen für eine ${mood} ${genre} Playlist.

Schlage 12-18 Songs vor, die perfekt zu "${mood} ${genre}" passen.
Mische bekannte und weniger bekannte Tracks, die alle das gewünschte Feeling haben.

Antworte mit einem JSON Array mit Objekten:
[
  {"title": "Song Titel", "artist": "Künstler Name", "reason": "Perfekt für ${mood} Stimmung"},
  {"title": "Song Titel 2", "artist": "Künstler Name 2", "reason": "Klassiker des ${genre} Genres"}
]
`,

  playlistCompletion: (playlistName, description, currentSongs) => `
Diese Playlist heißt "${playlistName}" - ${description}
Aktuelle Songs:
${currentSongs.map(s => `- ${s.title} von ${s.artist}`).join('\n')}

Schlage 8-12 NEUE Songs vor, die diese Playlist perfekt vervollständigen würden.
Berücksichtige das Thema, die Stimmung und den Stil der vorhandenen Songs.

Antworte mit einem JSON Array mit Objekten:
[
  {"title": "Song Titel", "artist": "Künstler Name", "reason": "Ergänzt das Thema perfekt"},
  {"title": "Song Titel 2", "artist": "Künstler Name 2", "reason": "Passt zur Playlist-Stimmung"}
]
`,

  playlistNaming: (songs) => `
Basierend auf diesen Songs, schlage 5 kreative Playlist-Namen vor:
${songs.map(s => `- ${s.title} von ${s.artist}`).join('\n')}

Antworte NUR mit einem JSON Array von Namen:
["Name 1", "Name 2", "Name 3", "Name 4", "Name 5"]
`
};

// AI Song-Discovery für NEUE Songs
router.post('/ai/recommend', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI-Service nicht verfügbar',
        message: 'OpenAI API Key nicht konfiguriert'
      });
    }

    const { type, data } = req.body;
    let prompt = '';
    let maxTokens = 500; // Mehr Tokens für detaillierte Empfehlungen

    // Prompt basierend auf Typ generieren
    switch (type) {
      case 'similar':
        prompt = MUSIC_PROMPTS.similarSongs(data.currentSongs);
        break;
      case 'mood':
        prompt = MUSIC_PROMPTS.moodBasedSuggestions(data.mood, data.genre);
        break;
      case 'complete':
        prompt = MUSIC_PROMPTS.playlistCompletion(
          data.playlistName, 
          data.description, 
          data.currentSongs
        );
        break;
      case 'naming':
        prompt = MUSIC_PROMPTS.playlistNaming(data.songs);
        maxTokens = 100;
        break;
      default:
        return res.status(400).json({ error: 'Unbekannter AI-Typ' });
    }

    console.log('🎵 AI Song-Discovery Anfrage:', type);
    console.log('📝 Prompt:', prompt.substring(0, 300) + '...');

    // OpenAI API Aufruf
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Du bist ein Musik-Experte für Song-Discovery. Du hilfst dabei, neue Songs zu entdecken, die perfekt zu bestehenden Playlists passen. Antworte immer mit validen JSON Arrays." 
        },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.8 // Mehr Kreativität für Song-Discovery
    });

    const aiResponse = completion.choices[0].message.content.trim();
    console.log('🤖 AI Song-Discovery Antwort:', aiResponse);

    // Parse JSON Response
    let suggestions = [];
    try {
      suggestions = JSON.parse(aiResponse);
    } catch (parseError) {
      console.log('⚠️ JSON Parse Fehler:', parseError);
      // Fallback: Versuche AI-Antwort zu extrahieren
      try {
        // Suche nach JSON-ähnlichen Strukturen
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          // Erstelle Basic-Struktur aus Text
          const lines = aiResponse.split('\n').filter(line => 
            line.includes('-') && (line.includes('von') || line.includes('by') || line.includes('feat'))
          );
          suggestions = lines.map(line => {
            const parts = line.replace(/[-•"'\[\]]/g, '').trim().split(/\s*von\s*|\s*by\s*|\s*-\s*/);
            return {
              title: parts[0]?.trim() || 'Unbekannt',
              artist: parts[1]?.trim() || 'Unbekannt',
              reason: 'AI Empfehlung'
            };
          });
        }
      } catch (fallbackError) {
        console.log('⚠️ Fallback Parse auch fehlgeschlagen:', fallbackError);
        suggestions = [];
      }
    }

    // Filtere und validiere Empfehlungen
    const validSuggestions = suggestions
      .filter(song => song && song.title && song.artist)
      .map(song => ({
        title: song.title.trim(),
        artist: song.artist.trim(),
        reason: song.reason || 'AI Empfehlung',
        isNewDiscovery: true, // Markiere als neue Entdeckung
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(song.artist + ' ' + song.title)}`,
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(song.artist + ' ' + song.title)}`
      }));

    console.log(`✨ ${validSuggestions.length} neue Song-Empfehlungen erstellt`);

    res.json({
      success: true,
      type: type,
      suggestions: validSuggestions,
      discoveryMode: true, // Kennzeichnet als Song-Discovery
      message: `${validSuggestions.length} neue Songs entdeckt, die perfekt zu deiner Musik passen!`,
      rawResponse: aiResponse
    });

  } catch (error) {
    console.error('❌ AI Song-Discovery Fehler:', error);
    res.status(500).json({ 
      error: 'Song-Discovery fehlgeschlagen',
      message: error.message
    });
  }
});

// AI Playlist-Namen Vorschläge
router.post('/ai/suggest-names', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI-Service nicht verfügbar'
      });
    }

    const { genre, mood, description, songs } = req.body;

    let prompt = '';
    if (songs && songs.length > 0) {
      prompt = MUSIC_PROMPTS.playlistNaming(songs);
    } else {
      prompt = `Schlage 5 kreative Playlist-Namen für eine ${genre} Playlist mit dem Mood "${mood}" vor.
      ${description ? `Beschreibung: ${description}` : ''}
      
      Antworte NUR mit einem JSON Array:
      ["Name 1", "Name 2", "Name 3", "Name 4", "Name 5"]`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Du bist ein kreativer Playlist-Namen-Generator. Antworte nur mit JSON Arrays." },
        { role: "user", content: prompt }
      ],
      max_tokens: 100,
      temperature: 0.8
    });

    const aiResponse = completion.choices[0].message.content.trim();
    let names = [];
    
    try {
      names = JSON.parse(aiResponse);
    } catch (error) {
      // Fallback parsing
      names = aiResponse.split('\n')
        .map(line => line.replace(/[-•"'\[\]0-9.]/g, '').trim())
        .filter(name => name.length > 0 && name.length < 50);
    }

    res.json({
      success: true,
      names: names
    });

  } catch (error) {
    console.error('❌ AI Namen-Vorschlag Fehler:', error);
    res.status(500).json({ 
      error: 'AI-Namen-Vorschlag fehlgeschlagen',
      message: error.message
    });
  }
});

// AI Mood-Analyse für Songs
router.post('/ai/analyze-mood', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI-Service nicht verfügbar'
      });
    }

    const { songs } = req.body;

    const prompt = `Analysiere diese Songs und beschreibe die Stimmung in 3-5 Worten:
${songs.map(s => `- ${s.title} von ${s.artist}`).join('\n')}

Antworte nur mit einer kurzen Stimmungs-Beschreibung (z.B. "Energetic Hip-Hop Vibes" oder "Chill Lofi Atmosphere"):`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Du bist ein Musik-Stimmungs-Analyst. Antworte kurz und präzise." },
        { role: "user", content: prompt }
      ],
      max_tokens: 50,
      temperature: 0.6
    });

    const mood = completion.choices[0].message.content.trim();

    res.json({
      success: true,
      mood: mood,
      songCount: songs.length
    });

  } catch (error) {
    console.error('❌ AI Mood-Analyse Fehler:', error);
    res.status(500).json({ 
      error: 'Mood-Analyse fehlgeschlagen',
      message: error.message
    });
  }
});

// Health Check
router.get('/ai/status', (req, res) => {
  res.json({
    aiAvailable: !!openai,
    hasApiKey: !!(process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY),
    service: 'AI Music Recommendations'
  });
});

// Debug Route für verfügbare Songs
router.get('/ai/debug-songs', async (req, res) => {
  try {
    let availableSongs = [];
    
    // Versuche Songs von verschiedenen Quellen zu laden
    try {
      const musicApiModule = require('./music-api');
      if (musicApiModule && musicApiModule.getAvailableSongs) {
        availableSongs = await musicApiModule.getAvailableSongs();
      }
    } catch (error) {
      console.log('Musik-API nicht verfügbar:', error.message);
    }
    
    // Fallback: music-library.json
    if (availableSongs.length === 0) {
      try {
        const fs = require('fs');
        const path = require('path');
        const musicLibPath = path.join(__dirname, 'music-library.json');
        if (fs.existsSync(musicLibPath)) {
          const musicLib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));
          availableSongs = musicLib.songs || musicLib.tracks || [];
        }
      } catch (error) {
        console.log('music-library.json Fehler:', error.message);
      }
    }
    
    res.json({
      count: availableSongs.length,
      songs: availableSongs.slice(0, 10), // Erste 10 Songs für Debug
      sources: {
        musicApi: 'checked',
        musicLibrary: 'checked'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug-Fehler',
      message: error.message
    });
  }
});

module.exports = router; 