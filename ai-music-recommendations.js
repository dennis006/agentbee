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

// Musik-Analyse Prompts
const MUSIC_PROMPTS = {
  similarSongs: (songs, availableSongs) => `
Du bist ein Musik-Experte. Analysiere diese Songs aus einer Playlist:
${songs.map(s => `- ${s.title} von ${s.artist}`).join('\n')}

Verfügbare Songs zum Vorschlagen:
${availableSongs.map(s => `- ${s.artist} von ${s.title}`).join('\n')}

Finde 5-8 ähnliche Songs aus der verfügbaren Liste, die perfekt zu dieser Playlist passen würden.
Berücksichtige: Genre, Stimmung, Tempo, Künstler-Stil, und Jahrzehnt.

Antworte NUR mit einem JSON Array von Song-Titeln (exakt wie in der verfügbaren Liste):
["Titel 1", "Titel 2", "Titel 3"]
`,

  moodBasedSuggestions: (mood, genre, availableSongs) => `
Erstelle eine ${mood} ${genre} Playlist. Verfügbare Songs:
${availableSongs.map(s => `- ${s.title} von ${s.artist}`).join('\n')}

Wähle 6-10 Songs die perfekt zu "${mood} ${genre}" passen.
Antworte NUR mit einem JSON Array von Song-Titeln:
["Titel 1", "Titel 2", "Titel 3"]
`,

  playlistCompletion: (playlistName, description, currentSongs, availableSongs) => `
Diese Playlist heißt "${playlistName}" - ${description}
Aktuelle Songs:
${currentSongs.map(s => `- ${s.title} von ${s.artist}`).join('\n')}

Verfügbare Songs:
${availableSongs.map(s => `- ${s.title} von ${s.artist}`).join('\n')}

Welche Songs aus der verfügbaren Liste würden diese Playlist perfekt vervollständigen?
Wähle 4-7 Songs die das Thema und die Stimmung ergänzen.

Antworte NUR mit einem JSON Array von Song-Titeln:
["Titel 1", "Titel 2", "Titel 3"]
`,

  playlistNaming: (songs) => `
Basierend auf diesen Songs, schlage 5 kreative Playlist-Namen vor:
${songs.map(s => `- ${s.title} von ${s.artist}`).join('\n')}

Antworte NUR mit einem JSON Array von Namen:
["Name 1", "Name 2", "Name 3", "Name 4", "Name 5"]
`
};

// AI Musik-Empfehlungen
router.post('/ai/recommend', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI-Service nicht verfügbar',
        message: 'OpenAI API Key nicht konfiguriert'
      });
    }

    const { type, data, availableSongs: frontendSongs } = req.body;
    let prompt = '';
    let maxTokens = 150;

    // Lade verfügbare Songs - Priorität: Frontend > API > Datei
    let availableSongs = [];
    
    if (frontendSongs && frontendSongs.length > 0) {
      availableSongs = frontendSongs;
      console.log(`📱 ${availableSongs.length} Songs vom Frontend erhalten`);
    } else {
      try {
        // Versuche Songs direkt von der Musik-API zu laden
        const musicApiModule = require('./music-api');
        if (musicApiModule && musicApiModule.getAvailableSongs) {
          availableSongs = await musicApiModule.getAvailableSongs();
          console.log(`🎵 ${availableSongs.length} Songs aus Musik-API geladen`);
        } else {
          // Fallback: Lade aus music-library.json
          const fs = require('fs');
          const path = require('path');
          const musicLibPath = path.join(__dirname, 'music-library.json');
          if (fs.existsSync(musicLibPath)) {
            const musicLib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));
            availableSongs = musicLib.songs || musicLib.tracks || [];
            console.log(`📚 ${availableSongs.length} Songs aus music-library.json geladen`);
          }
        }
      } catch (error) {
        console.log('⚠️ Fehler beim Laden der Musik-Bibliothek:', error.message);
      }
    }

    // Prompt basierend auf Typ generieren
    switch (type) {
      case 'similar':
        prompt = MUSIC_PROMPTS.similarSongs(data.currentSongs, availableSongs);
        break;
      case 'mood':
        prompt = MUSIC_PROMPTS.moodBasedSuggestions(data.mood, data.genre, availableSongs);
        break;
      case 'complete':
        prompt = MUSIC_PROMPTS.playlistCompletion(
          data.playlistName, 
          data.description, 
          data.currentSongs, 
          availableSongs
        );
        break;
      case 'naming':
        prompt = MUSIC_PROMPTS.playlistNaming(data.songs);
        maxTokens = 100;
        break;
      default:
        return res.status(400).json({ error: 'Unbekannter AI-Typ' });
    }

    console.log('🤖 AI Anfrage:', type, prompt.substring(0, 200) + '...');

    // OpenAI API Aufruf
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Du bist ein Musik-Experte, der perfekte Song-Empfehlungen gibt. Antworte immer nur mit validen JSON Arrays." 
        },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content.trim();
    console.log('🤖 AI Antwort:', aiResponse);

    // Parse JSON Response
    let suggestions = [];
    try {
      suggestions = JSON.parse(aiResponse);
    } catch (parseError) {
      console.log('⚠️ JSON Parse Fehler:', parseError);
      // Fallback: Extrahiere Song-Namen aus Text
      const lines = aiResponse.split('\n').filter(line => line.includes('-') || line.includes('•'));
      suggestions = lines.map(line => line.replace(/[-•"'\[\]]/g, '').trim()).filter(s => s.length > 0);
    }

    // Validiere Vorschläge gegen verfügbare Songs
    const validSuggestions = [];
    
    if (availableSongs.length === 0) {
      console.log('⚠️ Keine verfügbaren Songs zum Abgleichen gefunden');
      // Für Debug: Zeige alle AI-Vorschläge auch wenn keine Songs verfügbar sind
      return res.json({
        success: true,
        type: type,
        suggestions: [],
        rawResponse: aiResponse,
        availableSongsCount: 0,
        debug: {
          aiSuggestions: suggestions,
          message: 'Keine Songs in der Bibliothek verfügbar'
        }
      });
    }

    // Verbesserter Song-Matching-Algorithmus
    for (const suggestion of suggestions) {
      const found = availableSongs.find(song => {
        const songTitle = song.title.toLowerCase().trim();
        const suggestionLower = suggestion.toLowerCase().trim();
        
        // Exakte Übereinstimmung
        if (songTitle === suggestionLower) return true;
        
        // Teilstring-Übereinstimmung (beidseitig)
        if (songTitle.includes(suggestionLower) || suggestionLower.includes(songTitle)) return true;
        
        // Ähnlichkeitscheck ohne Sonderzeichen
        const cleanSongTitle = songTitle.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
        const cleanSuggestion = suggestionLower.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
        
        if (cleanSongTitle.includes(cleanSuggestion) || cleanSuggestion.includes(cleanSongTitle)) return true;
        
        // Wort-für-Wort Übereinstimmung
        const songWords = cleanSongTitle.split(' ');
        const suggestionWords = cleanSuggestion.split(' ');
        const matchingWords = songWords.filter(word => 
          suggestionWords.some(sugWord => 
            word.length > 2 && sugWord.length > 2 && 
            (word.includes(sugWord) || sugWord.includes(word))
          )
        );
        
        return matchingWords.length >= Math.min(2, suggestionWords.length);
      });
      
      if (found) {
        validSuggestions.push(found);
      }
    }

    console.log(`✅ ${validSuggestions.length} gültige Vorschläge gefunden`);
    console.log('🔍 Debug Info:', {
      totalAiSuggestions: suggestions.length,
      validMatches: validSuggestions.length,
      availableSongs: availableSongs.length,
      aiSuggestions: suggestions.slice(0, 3), // Erste 3 AI Vorschläge
      availableTitles: availableSongs.slice(0, 3).map(s => s.title) // Erste 3 verfügbare Songs
    });

    res.json({
      success: true,
      type: type,
      suggestions: validSuggestions,
      rawResponse: aiResponse,
      availableSongsCount: availableSongs.length,
      debug: {
        aiSuggestions: suggestions,
        matchedSongs: validSuggestions.map(s => s.title),
        availableSongTitles: availableSongs.map(s => s.title)
      }
    });

  } catch (error) {
    console.error('❌ AI Empfehlungs-Fehler:', error);
    res.status(500).json({ 
      error: 'AI-Empfehlung fehlgeschlagen',
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