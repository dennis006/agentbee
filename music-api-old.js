const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    VoiceConnectionStatus, 
    AudioPlayerStatus,
    entersState,
    getVoiceConnection,
    StreamType
} = require('@discordjs/voice');
// 🆕 Moderne YouTube-API Implementierung mit youtubei.js
const { Innertube } = require('youtubei.js');
const yts = require('yt-search');

// 🚀 youtubei.js Initialisierung
console.log('🎵 Musik-System gestartet mit youtubei.js (interne YouTube-API)');
console.log('✅ Keine Cookies oder Bot-Detection mehr nötig!');
const fs = require('fs');
const path = require('path');

// Music Settings Management
let musicSettings = {
    enabled: true,
    defaultVolume: 50,
    maxQueueLength: 100,
    autoJoinVoice: true,
    voiceChannels: {
        autoJoin: [],
        preferred: "",
        blacklist: []
    },
    commands: {
        enabled: true,
        prefix: "!",
        djRole: "",
        allowEveryone: true
    },
    queue: {
        autoplay: false,
        shuffle: false,
        repeat: "off", // off, song, queue
        clearOnEmpty: true
    },
    filters: {
        bass: false,
        nightcore: false,
        vaporwave: false,
        lowpass: false
    },
    youtube: {
        quality: "highestaudio",
        maxLength: 600, // 10 minutes in seconds
        playlistLimit: 50
    },
    announcements: {
        nowPlaying: true,
        queueAdd: true,
        channelId: ""
    },
    embedColor: "#9333EA",
    songRequests: {
        enabled: true,
        channels: [], // Channel-IDs wo Song-Requests erlaubt sind
        prefix: "!play",
        embedColor: "#9333EA",
        requireDJRole: false,
        maxRequestsPerUser: 5,
        cooldownMinutes: 1,
        rateLimit: {
            enabled: true,
            maxRequests: 5,
            timeWindow: 60,
            timeUnit: 'minutes'
        },
        interactivePanel: {
            enabled: true,
            channelId: "", // Channel wo das Interactive Panel gepostet wird
            messageId: "", // ID der Interactive Message
            autoUpdate: true,
            showQueue: true,
            maxQueueDisplay: 5,
            requireDJForControls: false,
            autoJoinLeave: false,
            adminRole: ""
        }
    },
    radio: {
        enabled: true,
        stations: [
            {
                id: "1live",
                name: "1LIVE",
                url: "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
                genre: "Pop/Rock",
                country: "Deutschland",
                description: "Der junge Radiosender von WDR",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwMDAiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MUxJVkU8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "swr3",
                name: "SWR3",
                url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3",
                genre: "Pop/Rock",
                country: "Deutschland", 
                description: "Popmusik und Comedy",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMDc3QkUiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U1dSMzwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "antenne",
                name: "ANTENNE BAYERN",
                url: "https://s1-webradio.antenne.de/antenne",
                genre: "Pop/Hits",
                country: "Deutschland",
                description: "Bayerns Hit-Radio",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRkZGRkYiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDA3N0JFIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5BTlRFTk5FPC90ZXh0Pgo8L3N2Zz4K"
            },
            {
                id: "bigfm",
                name: "bigFM",
                url: "https://streams.bigfm.de/bigfm-deutschland-128-mp3",
                genre: "Hip-Hop/R&B",
                country: "Deutschland",
                description: "Deutschlands biggste Beats",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMDAwMDAiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5iaWdGTTwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "ndr2",
                name: "NDR 2",
                url: "https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3",
                genre: "Pop/Rock",
                country: "Deutschland",
                description: "Das Beste von heute und gestern",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMDU1QUEiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TkRSIDI8L3RleHQ+Cjwvc3ZnPgo="
            },

            {
                id: "sunshine",
                name: "sunshine live",
                url: "https://stream.sunshine-live.de/live/mp3-192/stream.sunshine-live.de/",
                genre: "Electronic/Dance",
                country: "Deutschland",
                description: "Electronic Music Radio",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRkE1MDAiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+c3Vuc2hpbmU8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "lofi",
                name: "Lofi Hip Hop Radio",
                url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
                genre: "Lofi/Chill",
                country: "International",
                description: "24/7 Lofi Hip Hop Beats",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjMzOTkiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9GaTwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "chillhop",
                name: "ChillHop Radio",
                url: "https://www.youtube.com/watch?v=5yx6BWlEVcY",
                genre: "Chillhop/Jazz",
                country: "International",
                description: "Chill beats to relax/study to",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM0NEFBODgiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2hpbGxIb3A8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "deutschrap1",
                name: "Deutschrap One",
                url: "https://stream.laut.fm/deutschrap",
                genre: "Deutschrap/Hip-Hop",
                country: "Deutschland",
                description: "24/7 Deutschrap und Hip-Hop",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMxQTFBMUEiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRFVVRTQ0g8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0ZGRDcwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UkFQPC90ZXh0Pgo8L3N2Zz4K"
            },

            {
                id: "hiphopradio",
                name: "HipHop Radio",
                url: "https://stream.laut.fm/hiphop",
                genre: "Hip-Hop/Rap",
                country: "Deutschland",
                description: "Pure Hip-Hop Musik",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM0QjAwODIiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ISVBIT1A8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlJBRElPPC90ZXh0Pgo8L3N2Zz4K"
            },
            {
                id: "urbanradio",
                name: "Urban Radio",
                url: "https://stream.laut.fm/urban",
                genre: "Urban/Rap",
                country: "Deutschland",
                description: "Urban Beats und Deutschrap",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMyRTJFMkUiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDBGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5VUkJBTjwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "gtaradio",
                name: "GTA Radio",
                url: "https://stream.laut.fm/gta-radio",
                genre: "GTA/Gaming",
                country: "International",
                description: "GTA-Style Radio mit Hip-Hop und Rap",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwNzciLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R1RBPC90ZXh0Pgo8L3N2Zz4K"
            },

            {
                id: "oldschool",
                name: "Old School Hip-Hop",
                url: "https://stream.laut.fm/oldschool-hiphop",
                genre: "Old School Hip-Hop",
                country: "USA",
                description: "80s & 90s Hip-Hop Klassiker",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM4QjQ1MTMiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk9MRDwvdGV4dD4KPHRleHQgeD0iMzIiIHk9IjQ0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNDSE9PTDwvdGV4dD4KPC9zdmc+Cg=="
            },

            {
                id: "synthwave",
                name: "Synthwave Radio",
                url: "https://stream.laut.fm/synthwave",
                genre: "Synthwave/80s",
                country: "International",
                description: "80s Synthwave und Retrowave",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwRkYiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TWU5USDwvdGV4dD4KPHRleHQgeD0iMzIiIHk9IjQ0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5XQVZFPC90ZXh0Pgo8L3N2Zz4K"
            },
            {
                id: "phonkradio",
                name: "Phonk Radio",
                url: "https://stream.laut.fm/phonk",
                genre: "Phonk/Memphis",
                country: "USA",
                description: "Phonk und Memphis Rap",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM0QjAwODIiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjRkZENzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QSE9OSzwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "deephouse",
                name: "Deep House Radio",
                url: "https://www.youtube.com/watch?v=36YnV9STBqc",
                genre: "Deep House/Electronic",
                country: "International",
                description: "24/7 Deep House Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMDMzNjYiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMEZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRFRVA8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDBGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5IT1VTRTI8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "trapmusic",
                name: "Trap Music 24/7",
                url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
                genre: "Trap/Hip-Hop",
                country: "USA",
                description: "24/7 Trap Music Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwNzciLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VFJBUDwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "gaming",
                name: "Gaming Music Radio",
                url: "https://www.youtube.com/watch?v=4xDzrJKXOOY",
                genre: "Gaming/Electronic",
                country: "International",
                description: "24/7 Gaming Music Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMEZGMDAiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdBTUlORzwvdGV4dD4KPHRleHQgeD0iMzIiIHk9IjQ0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1VU0lDPC90ZXh0Pgo8L3N2Zz4K"
            },
            {
                id: "jazzhop",
                name: "Jazz Hop Cafe",
                url: "https://www.youtube.com/watch?v=Dx5qFachd3A",
                genre: "Jazz Hop/Chill",
                country: "International",
                description: "24/7 Jazz Hop Cafe Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM4QjQ1MTMiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkpBWlo8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjRkZENzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5IT1A8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "retrowave",
                name: "Retrowave 24/7",
                url: "https://www.youtube.com/watch?v=MV_3Dpw-BRY",
                genre: "Retrowave/80s",
                country: "International",
                description: "24/7 Retrowave Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwRkYiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SRVRST1dBVkU8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MjQvNzwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "bassmusic",
                name: "Bass Music 24/7",
                url: "https://www.youtube.com/watch?v=6p0DAz_30qQ",
                genre: "Bass/Dubstep",
                country: "International",
                description: "24/7 Bass Music Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwMDAiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QkFTUzwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "gangstarap",
                name: "Gangsta Rap Radio 24/7",
                url: "https://www.youtube.com/watch?v=0MOkLkTP-Jk",
                genre: "Gangsta Rap/Underground",
                country: "USA",
                description: "Underground Rap & Hip Hop Live Music (Rap Mafia Radio)",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMDAwMDAiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdBTkdTVEE8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjRkZENzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SQVA8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "artoftechno",
                name: "Art of Techno 'Deep' Radio",
                url: "https://www.youtube.com/watch?v=UYOb37KRFqk",
                genre: "Melodic/Progressive/House",
                country: "International",
                description: "Melodic • Progressive • House Music 24/7 by Trippy Code",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMxQTFBMUEiLz4KPHRleHQgeD0iMzIiIHk9IjI0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNyIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMEZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFSVCBPRjwvdGV4dD4KPHRleHQgeD0iMzIiIHk9IjM2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNyIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMEZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRFQ0hOTzwvdGV4dD4KPHRleHQgeD0iMzIiIHk9IjQ4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRFRVA8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "spinninrecords",
                name: "Spinnin' Records Radio",
                url: "https://www.youtube.com/watch?v=xf9Ejt4OmWQ",
                genre: "Dance/EDM",
                country: "International",
                description: "24/7 Live Radio | Best Dance Music",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwMDAiLz4KPHRleHQgeD0iMzIiIHk9IjI0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNyIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TUElOTklOJzwvdGV4dD4KPHRleHQgeD0iMzIiIHk9IjQ0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNyIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SRUNPUkRTPC90ZXh0Pgo8L3N2Zz4K"
            },
            {
                id: "deutschrapradio",
                name: "Deutschrap Radio 24/7",
                url: "https://www.youtube.com/watch?v=dx23U7KC9dM",
                genre: "Deutschrap/Deutschpop",
                country: "Deutschland",
                description: "24/7 Best Deutschrap/Deutschpop Music",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRkQ3MDAiLz4KPHRleHQgeD0iMzIiIHk9IjI0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNyIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRFVVRTQ0g8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjciIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDAwMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SQVA8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "nonstopelectronic",
                name: "Non-Stop Electronic Music",
                url: "https://www.youtube.com/watch?v=etj2WOkKfgs",
                genre: "Future Bass/EDM/Nightcore",
                country: "International",
                description: "24/7 | Future Bass, EDM, Nightcore & More! 🚀🎧🔥",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM4QjAwRkYiLz4KPHRleHQgeD0iMzIiIHk9IjIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5OT04tU1RPUDU8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSIzNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RUxFQ1RST05JQzwvdGV4dD4KPHRleHQgeD0iMzIiIHk9IjUyIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NVVNJQzwvdGV4dD4KPC9zdmc+Cg=="
            }
        ],
        defaultStation: "1live",
        autoStop: false,
        showNowPlaying: true,
        embedColor: "#FF6B6B"
    }
};

const musicQueues = new Map(); // guild -> queue
const voiceConnections = new Map(); // guild -> connection
const audioPlayers = new Map(); // guild -> player
const progressTrackers = new Map(); // guild -> progress tracker
const userRequestCooldowns = new Map(); // userId -> timestamp
const userRequestCounts = new Map(); // userId -> count

function loadMusicSettings() {
    try {
        if (fs.existsSync('music-settings.json')) {
            const data = fs.readFileSync('music-settings.json', 'utf8');
            const loadedSettings = JSON.parse(data);
            // Deep merge to preserve all nested properties
            musicSettings = deepMerge(musicSettings, loadedSettings);
            console.log('🎵 Musik-Einstellungen geladen');
            console.log(`🔍 Debug: requireDJForControls = ${musicSettings.songRequests?.interactivePanel?.requireDJForControls}`);
            console.log(`🔍 Debug: adminRole = ${musicSettings.songRequests?.interactivePanel?.adminRole}`);
        } else {
            saveMusicSettings();
            console.log('🎵 Standard-Musik-Einstellungen erstellt');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Einstellungen:', error);
    }
}

// Deep merge function to properly merge nested objects
function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    
    return result;
}

function saveMusicSettings() {
    try {
        fs.writeFileSync('music-settings.json', JSON.stringify(musicSettings, null, 2));
        console.log('💾 Musik-Einstellungen gespeichert');
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Musik-Einstellungen:', error);
    }
}

// YouTube Search
async function searchYouTube(query) {
    try {
        const results = await yts(query);
        return results.videos.slice(0, 10).map(video => ({
            title: video.title,
            url: video.url,
            duration: video.duration.seconds,
            thumbnail: video.thumbnail,
            author: video.author.name,
            views: video.views
        }));
    } catch (error) {
        console.error('❌ YouTube Suche fehlgeschlagen:', error);
        return [];
    }
}

// 🆕 VEREINFACHTE YouTube-Info Funktion (nach User-Muster) mit Debug
async function getVideoInfoWithYoutubei(url) {
    try {
        console.log(`🆕 Lade Video-Info mit youtubei.js: ${url}`);
        
        // 🎯 SAUBERE Video-ID Extraction (nach User-Muster)
        const videoId = extractVideoId(url);
        if (!videoId) {
            console.error(`❌ Video-ID Extraction fehlgeschlagen für URL: ${url}`);
            throw new Error('Ungültige YouTube-URL');
        }
        
        console.log(`🔍 Video-ID extrahiert: ${videoId}`);
        
        // Initialisiere youtubei.js Client
        console.log('🔄 Initialisiere Innertube...');
        const youtube = await Innertube.create();
        console.log('✅ Innertube initialisiert');
        
        // 🎯 DIREKTE API-Nutzung (nach User-Muster)
        console.log('🔄 Verwende youtube.getInfo() (normale API)...');
        const info = await youtube.getInfo(videoId);
        
        if (!info) {
            console.error('❌ info ist null oder undefined');
            throw new Error('Video-Info nicht verfügbar');
        }
        
        if (!info.streaming_data) {
            console.error('❌ info.streaming_data ist null oder undefined');
            console.error('🔍 Verfügbare info Properties:', Object.keys(info));
            throw new Error('Streaming-Daten nicht verfügbar');
        }
        
        console.log(`✅ youtubei.js Video-Details erhalten: ${info.basic_info?.title || 'UNKNOWN TITLE'}`);
        
        // 🎯 INTELLIGENTE Stream-Auswahl (nach User-Muster: AUDIO_QUALITY_MEDIUM)
        const streamingData = info.streaming_data;
        console.log(`🔍 Adaptive Formats verfügbar: ${streamingData.adaptive_formats?.length || 0}`);
        
        if (!streamingData.adaptive_formats || streamingData.adaptive_formats.length === 0) {
            console.error('❌ Keine adaptive_formats verfügbar');
            throw new Error('Keine Audio-Streams verfügbar');
        }
        
        const audioStream = streamingData.adaptive_formats.find(f => 
            f.mime_type && f.mime_type.includes('audio/webm') && 
            f.audio_quality === 'AUDIO_QUALITY_MEDIUM'
        );
        
        if (!audioStream || !audioStream.url) {
            console.log('⚠️ AUDIO_QUALITY_MEDIUM nicht gefunden, versuche andere Qualitäten...');
            
            // Debug: Zeige alle verfügbaren Streams
            const audioStreams = streamingData.adaptive_formats.filter(f => 
                f.mime_type && f.mime_type.includes('audio')
            );
            console.log(`🔍 Verfügbare Audio-Streams: ${audioStreams.length}`);
            audioStreams.forEach((stream, index) => {
                console.log(`  ${index + 1}. ${stream.mime_type} - ${stream.audio_quality || 'UNKNOWN'} - URL: ${!!stream.url}`);
            });
            
            // Fallback: Suche nach anderen Audio-Qualitäten
            const alternativeStream = streamingData.adaptive_formats.find(f => 
                f.mime_type && f.mime_type.includes('audio/webm') && f.url
            );
            
            if (!alternativeStream || !alternativeStream.url) {
                console.error('❌ Auch alternative Audio-Streams haben keine URL');
                throw new Error('Kein gültiger Audio-Stream gefunden');
            }
            
            console.log(`🎯 Alternative Audio-Qualität gefunden: ${alternativeStream.audio_quality || 'UNKNOWN'}`);
            return createVideoInfoResult(info, alternativeStream, url);
        }
        
        console.log(`🎯 AUDIO_QUALITY_MEDIUM Stream gefunden: ${audioStream.mime_type}`);
        return createVideoInfoResult(info, audioStream, url);
        
    } catch (error) {
        console.error('❌ youtubei.js Detaillierter Fehler:', {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3),
            url: url
        });
        return null;
    }
}

// 🎯 ERWEITERTE Video-ID Extraction (robuster als User-Muster)
function extractVideoId(url) {
    // Verschiedene YouTube URL-Formate abdecken
    const patterns = [
        /(?:v=|\/v\/|embed\/|youtu\.be\/|\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            console.log(`✅ Video-ID gefunden mit Pattern: ${pattern.source.substring(0, 30)}...`);
            return match[1];
        }
    }
    
    console.error(`❌ Keine Video-ID gefunden in URL: ${url}`);
    console.error(`🔍 URL-Format nicht erkannt. Unterstützte Formate:
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtu.be/VIDEO_ID
        - https://www.youtube.com/embed/VIDEO_ID`);
    
    return null;
}

// 🎯 Helper-Funktion für einheitliches Result-Format
function createVideoInfoResult(info, audioStream, originalUrl) {
    return {
        title: info.basic_info.title,
        url: originalUrl,
        duration: info.basic_info.duration?.seconds_total || 0,
        thumbnail: info.basic_info.thumbnail?.[0]?.url || '',
        author: info.basic_info.channel?.name || 'Unbekannt',
        requestedBy: null,
        // 🆕 youtubei.js spezifische Daten
        streamUrl: audioStream.url,
        mimeType: audioStream.mime_type,
        audioQuality: audioStream.audio_quality,
        isYoutubei: true
    };
}

// 🗑️ normalizeYouTubeURL() entfernt - wird durch extractVideoId() ersetzt



// 🎯 DIREKTE YouTube-Info Funktion (FIXED - nach User-Muster)
async function getVideoInfo(url) {
    try {
        console.log(`🎵 Lade Video-Info für: ${url}`);
        
        // 🎯 DIREKTER ANSATZ - keine URL-Normalisierung mehr nötig (youtubei.js macht das intern)
        
        // 🆕 youtubei.js (Primär-Methode - interne YouTube-API ohne Bot-Detection)
        try {
            console.log('🆕 Versuche youtubei.js (interne YouTube-API)...');
            const youtubeIResult = await getVideoInfoWithYoutubei(url);
            
            if (youtubeIResult) {
                console.log(`✅ youtubei.js Video-Info erfolgreich: ${youtubeIResult.title}`);
                return youtubeIResult;
            } else {
                console.log('⚠️ youtubei.js lieferte null zurück');
            }
        } catch (youtubeIError) {
            console.log('⚠️ youtubei.js Exception:', youtubeIError.message);
        }
        
        // Methode 2: Fallback mit yt-search (für Suche-Queries)
        try {
            console.log('🔍 Verwende Fallback yt-search...');
            const searchResults = await searchYouTube(url);
            if (searchResults.length > 0) {
                console.log('✅ Fallback-Suche erfolgreich');
                const firstResult = searchResults[0];
                return {
                    title: firstResult.title,
                    url: firstResult.url,
                    duration: firstResult.duration,
                    thumbnail: firstResult.thumbnail,
                    author: firstResult.author,
                    requestedBy: null,
                    // Markiere als Fallback-Ergebnis
                    isFallback: true
                };
            } else {
                console.log('⚠️ yt-search lieferte keine Ergebnisse');
            }
        } catch (fallbackError) {
            console.error('❌ Auch Fallback-Suche fehlgeschlagen:', fallbackError.message);
        }
        
        console.error('❌ ALLE Methoden fehlgeschlagen für URL:', url);
        return null;
        
    } catch (error) {
        console.error('❌ Alle Video-Info Methoden fehlgeschlagen:', error.message);
        return null;
    }
}

// Queue Management
function getQueue(guildId) {
    if (!musicQueues.has(guildId)) {
        musicQueues.set(guildId, {
            songs: [],
            currentSong: null,
            volume: musicSettings.defaultVolume,
            repeat: musicSettings.queue.repeat,
            shuffle: musicSettings.queue.shuffle,
            autoplay: musicSettings.queue.autoplay,
            progress: {
                startTime: null,
                pausedTime: 0,
                duration: 0,
                currentTime: 0
            }
        });
    }
    return musicQueues.get(guildId);
}

function addToQueue(guildId, song) {
    try {
        const queue = getQueue(guildId);
        
        if (queue.songs.length >= musicSettings.maxQueueLength) {
            console.log(`❌ Queue voll (${musicSettings.maxQueueLength} Songs)`);
            return false;
        }

        const wasEmpty = queue.songs.length === 0 && !queue.currentSong;
        queue.songs.push(song);
        console.log(`✅ Song zur Queue hinzugefügt: ${song.title} (Position: ${queue.songs.length})`);
        
        // Auto-Join: If queue was empty and now has songs, try to join a voice channel
        if (wasEmpty && musicSettings.songRequests?.interactivePanel?.autoJoinLeave) {
            autoJoinForQueue(guildId).then(joined => {
                if (joined) {
                    console.log('🎵 Auto-Join erfolgreich - warte kurz und starte Wiedergabe');
                    // Wait a moment for connection to stabilize, then start playback
                    setTimeout(() => {
                        const currentQueue = getQueue(guildId);
                        const connection = voiceConnections.get(guildId);
                        
                        if (connection && !currentQueue.currentSong && currentQueue.songs.length > 0) {
                            console.log('🎵 Starte Auto-Playback nach erfolgreichem Join');
                            playNext(guildId).catch(error => {
                                console.error('❌ Fehler beim Auto-Playback:', error);
                            });
                        } else {
                            console.log('⚠️ Auto-Playback übersprungen - Bedingungen nicht erfüllt');
                            console.log(`   Connection: ${!!connection}, CurrentSong: ${!!currentQueue.currentSong}, QueueLength: ${currentQueue.songs.length}`);
                        }
                    }, 1000); // 1 second delay for connection stability
                } else {
                    console.log('⚠️ Auto-Join fehlgeschlagen - Songs bleiben in Queue');
                }
            }).catch(error => {
                console.error('❌ Fehler beim Auto-Join:', error);
            });
        }
        
        // Update interactive panel when song is added
        updateInteractivePanel(guildId).catch(console.error);
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen zur Queue:', error);
        return false;
    }
}

function removeFromQueue(guildId, index) {
    try {
        const queue = getQueue(guildId);
        
        if (index < 0 || index >= queue.songs.length) {
            return false;
        }

        const removedSong = queue.songs.splice(index, 1)[0];
        console.log(`🗑️ Song aus Queue entfernt: ${removedSong.title}`);
        
        // Update interactive panel when song is removed
        updateInteractivePanel(guildId).catch(console.error);
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Entfernen aus Queue:', error);
        return false;
    }
}

function clearQueue(guildId) {
    try {
        const queue = getQueue(guildId);
        const clearedCount = queue.songs.length;
        queue.songs = [];
        
        console.log(`🗑️ Queue geleert (${clearedCount} Songs entfernt)`);
        
        // Auto-Leave: If queue is now empty and no song is playing, leave voice channel
        if (!queue.currentSong && musicSettings.songRequests?.interactivePanel?.autoJoinLeave) {
            autoLeaveWhenEmpty(guildId).catch(console.error);
        }
        
        // Update interactive panel when queue is cleared
        updateInteractivePanel(guildId).catch(console.error);
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Leeren der Queue:', error);
        return false;
    }
}

function shuffleQueue(guildId) {
    const queue = getQueue(guildId);
    for (let i = queue.songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
    }
}

// Progress Tracking
function startProgressTracking(guildId, duration) {
    const queue = getQueue(guildId);
    queue.progress = {
        startTime: Date.now(),
        pausedTime: 0,
        duration: duration,
        currentTime: 0
    };
    
    // Clear any existing tracker
    const existingTracker = progressTrackers.get(guildId);
    if (existingTracker) {
        clearInterval(existingTracker);
    }
    
    // Start new progress tracker
    const tracker = setInterval(() => {
        if (queue.progress.startTime) {
            const elapsed = Math.floor((Date.now() - queue.progress.startTime - queue.progress.pausedTime) / 1000);
            queue.progress.currentTime = Math.min(elapsed, duration);
            
            // Stop tracking if song is finished
            if (queue.progress.currentTime >= duration) {
                clearInterval(tracker);
                progressTrackers.delete(guildId);
            }
        }
    }, 1000);
    
    progressTrackers.set(guildId, tracker);
    console.log(`⏱️ Progress-Tracking gestartet für Guild ${guildId}, Dauer: ${duration}s`);
}

// Song Request System
function canUserRequest(userId) {
    const now = Date.now();
    const cooldownMs = musicSettings.songRequests.cooldownMinutes * 60 * 1000;
    
    // Check cooldown
    const lastRequest = userRequestCooldowns.get(userId);
    if (lastRequest && (now - lastRequest) < cooldownMs) {
        const remainingMs = cooldownMs - (now - lastRequest);
        return {
            canRequest: false,
            reason: 'cooldown',
            remainingTime: Math.ceil(remainingMs / 1000)
        };
    }
    
    // Check rate limit (new system)
    const rateLimit = musicSettings.songRequests.rateLimit;
    if (rateLimit && rateLimit.enabled) {
        const requestData = userRequestCounts.get(userId);
        if (requestData) {
            const timeWindowMs = getTimeWindowInMs(rateLimit.timeWindow, rateLimit.timeUnit);
            const timeSinceFirst = now - requestData.firstRequest;
            
            // If we're still within the time window and hit the limit
            if (timeSinceFirst < timeWindowMs && requestData.count >= rateLimit.maxRequests) {
                const remainingMs = timeWindowMs - timeSinceFirst;
                return {
                    canRequest: false,
                    reason: 'rateLimit',
                    remainingTime: Math.ceil(remainingMs / 1000),
                    maxRequests: rateLimit.maxRequests,
                    timeWindow: rateLimit.timeWindow,
                    timeUnit: rateLimit.timeUnit
                };
            }
            
            // If time window has passed, reset the counter
            if (timeSinceFirst >= timeWindowMs) {
                userRequestCounts.delete(userId);
            }
        }
    } else {
        // Fallback to old system (daily limit)
        const requestCount = userRequestCounts.get(userId)?.count || 0;
        if (requestCount >= musicSettings.songRequests.maxRequestsPerUser) {
            return {
                canRequest: false,
                reason: 'limit',
                maxRequests: musicSettings.songRequests.maxRequestsPerUser
            };
        }
    }
    
    return { canRequest: true };
}

function getTimeWindowInMs(timeWindow, timeUnit) {
    switch (timeUnit) {
        case 'minutes':
            return timeWindow * 60 * 1000;
        case 'hours':
            return timeWindow * 60 * 60 * 1000;
        case 'days':
            return timeWindow * 24 * 60 * 60 * 1000;
        default:
            return timeWindow * 60 * 1000; // default to minutes
    }
}

function recordUserRequest(userId) {
    const now = Date.now();
    userRequestCooldowns.set(userId, now);
    
    // Update request count tracking
    const rateLimit = musicSettings.songRequests.rateLimit;
    if (rateLimit && rateLimit.enabled) {
        const existingData = userRequestCounts.get(userId);
        if (existingData) {
            // Update existing tracking
            userRequestCounts.set(userId, {
                firstRequest: existingData.firstRequest,
                count: existingData.count + 1
            });
        } else {
            // Start new tracking window
            userRequestCounts.set(userId, {
                firstRequest: now,
                count: 1
            });
        }
    } else {
        // Fallback to old system (simple counter)
        const currentCount = userRequestCounts.get(userId)?.count || 0;
        userRequestCounts.set(userId, { count: currentCount + 1 });
    }
}

function resetDailyRequestCounts() {
    userRequestCounts.clear();
    console.log('🔄 Song-Request-Zähler zurückgesetzt');
}

// Reset daily counts at midnight
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        resetDailyRequestCounts();
    }
}, 60000); // Check every minute

async function handleSongRequest(message, query) {
    try {
        const { guild, author, channel } = message;
        const guildId = guild.id;
        const userId = author.id;
        
        console.log(`🎵 Song-Request von ${author.tag}: "${query}"`);
        
        // Check if song requests are enabled
        if (!musicSettings.songRequests.enabled) {
            return await message.reply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: '❌ Song-Requests deaktiviert',
                    description: 'Song-Requests sind derzeit deaktiviert.',
                    timestamp: new Date().toISOString()
                }]
            });
        }
        
        // Check if channel is allowed
        if (musicSettings.songRequests.channels.length > 0 && 
            !musicSettings.songRequests.channels.includes(channel.id)) {
            return await message.reply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: '❌ Falscher Channel',
                    description: 'Song-Requests sind in diesem Channel nicht erlaubt.',
                    timestamp: new Date().toISOString()
                }]
            });
        }
        
        // Check user permissions
        const canRequest = canUserRequest(userId);
        if (!canRequest.canRequest) {
            let description = '';
            let title = '⏰ Request-Limit erreicht';
            
            if (canRequest.reason === 'cooldown') {
                description = `Du musst noch ${canRequest.remainingTime} Sekunden warten.`;
            } else if (canRequest.reason === 'rateLimit') {
                const timeUnitText = {
                    'minutes': 'Minute(n)',
                    'hours': 'Stunde(n)', 
                    'days': 'Tag(e)'
                };
                const unit = timeUnitText[canRequest.timeUnit] || 'Minute(n)';
                description = `Du hast dein Limit von ${canRequest.maxRequests} Requests pro ${canRequest.timeWindow} ${unit} erreicht.\nVersuche es in ${Math.floor(canRequest.remainingTime / 60)}min ${canRequest.remainingTime % 60}s erneut.`;
            } else if (canRequest.reason === 'limit') {
                description = `Du hast dein Tageslimit von ${canRequest.maxRequests} Requests erreicht.`;
            }
            
            return await message.reply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: title,
                    description: description,
                    timestamp: new Date().toISOString()
                }]
            });
        }
        
        // Check DJ role if required
        if (musicSettings.songRequests.requireDJRole && musicSettings.commands.djRole) {
            const member = guild.members.cache.get(userId);
            const hasDJRole = member.roles.cache.has(musicSettings.commands.djRole);
            const hasAdminPerms = member.permissions.has('Administrator');
            
            if (!hasDJRole && !hasAdminPerms) {
                return await message.reply({
                    embeds: [{
                        color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                        title: '🎧 DJ-Rolle erforderlich',
                        description: 'Du benötigst die DJ-Rolle um Songs zu requesten.',
                        timestamp: new Date().toISOString()
                    }]
                });
            }
        }
        
        // Get video info
        const videoInfo = await getVideoInfo(query);
        if (!videoInfo) {
            return await message.reply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: '❌ Song nicht gefunden',
                    description: `Konnte "${query}" nicht finden oder laden.`,
                    timestamp: new Date().toISOString()
                }]
            });
        }
        
        // Add requested by info
        videoInfo.requestedBy = author.tag;
        
        // Add to queue
        const added = addToQueue(guildId, videoInfo);
        if (!added) {
            return await message.reply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: '📋 Queue voll',
                    description: `Die Queue ist voll (max. ${musicSettings.maxQueueLength} Songs).`,
                    timestamp: new Date().toISOString()
                }]
            });
        }
        
        // Record the request
        recordUserRequest(userId);
        
        // Create success embed
        const queue = getQueue(guildId);
        const position = queue.songs.length;
        const estimatedWait = queue.songs.slice(0, position - 1).reduce((total, song) => total + (song.duration || 180), 0);
        
        const successEmbed = {
            color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
            title: '🎵 Song zur Queue hinzugefügt!',
            description: `**${videoInfo.title}**\nvon ${videoInfo.author}`,
            thumbnail: {
                url: videoInfo.thumbnail
            },
            fields: [
                {
                    name: '👤 Requested by',
                    value: author.tag,
                    inline: true
                },
                {
                    name: '⏱️ Dauer',
                    value: formatDuration(videoInfo.duration || 0),
                    inline: true
                },
                {
                    name: '📍 Position in Queue',
                    value: `${position}`,
                    inline: true
                }
            ],
            footer: {
                text: `Geschätzte Wartezeit: ${formatDuration(estimatedWait)}`
            },
            timestamp: new Date().toISOString()
        };
        
        if (estimatedWait > 0) {
            successEmbed.fields.push({
                name: '⏰ Geschätzte Wartezeit',
                value: formatDuration(estimatedWait),
                inline: true
            });
        }
        
        await message.reply({ embeds: [successEmbed] });
        
        // Auto-start playback if bot is in voice channel and nothing is playing
        const connection = voiceConnections.get(guildId);
        if (!queue.currentSong && queue.songs.length === 1 && connection) {
            console.log('🎵 Auto-Start: Beginne Wiedergabe des ersten Songs');
            await playNext(guildId);
        }
        
        console.log(`✅ Song-Request erfolgreich: ${videoInfo.title} von ${author.tag}`);
        
    } catch (error) {
        console.error('❌ Fehler beim Song-Request:', error);
        await message.reply({
            embeds: [{
                color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                title: '❌ Fehler',
                description: 'Ein Fehler ist beim Verarbeiten deines Requests aufgetreten.',
                timestamp: new Date().toISOString()
            }]
        });
    }
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateRateLimitFooter() {
    const rateLimit = musicSettings.songRequests.rateLimit;
    const cooldown = musicSettings.songRequests.cooldownMinutes;
    
    let footerText = '🎵 Musik-Bot';
    
    // Rate Limiting Info
    if (rateLimit && rateLimit.enabled) {
        const timeUnitText = {
            'minutes': `${rateLimit.timeWindow}min`,
            'hours': `${rateLimit.timeWindow}h`,
            'days': `${rateLimit.timeWindow}d`
        };
        
        footerText += ` • Requests: ${rateLimit.maxRequests}/${timeUnitText[rateLimit.timeUnit] || `${rateLimit.timeWindow}min`}`;
    } else {
        // Fallback zu alten Settings
        footerText += ` • Requests: ${musicSettings.songRequests.maxRequestsPerUser}/Tag`;
    }
    
    // Cooldown Info
    if (cooldown > 0) {
        footerText += ` • Cooldown: ${cooldown}min`;
    }
    
    return footerText;
}

// Interactive Song Request Panel
async function createInteractivePanel(guildId) {
    try {
        const guild = global.client?.guilds.cache.get(guildId);
        if (!guild) {
            console.log('❌ Guild nicht gefunden für Interactive Panel');
            return null;
        }

        const channelId = musicSettings.songRequests.interactivePanel.channelId;
        if (!channelId) {
            console.log('❌ Kein Channel für Interactive Panel konfiguriert');
            return null;
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            console.log('❌ Interactive Panel Channel nicht gefunden');
            return null;
        }

        const queue = getQueue(guildId);
        const embedColor = parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16);

        // Create main embed
        const embed = {
            color: embedColor,
            title: '🎵 Song Request Panel',
            description: '**Klicke auf einen Button um einen Song zu requesten!**\n\n' +
                        '🎯 **Wie funktioniert es?**\n' +
                        '• Klicke auf "🎵 Song Request"\n' +
                        '• Gib einen Song-Titel oder YouTube-Link ein\n' +
                        '• Der Song wird automatisch zur Queue hinzugefügt!\n\n' +
                        '🎧 **Unterstützte Formate:**\n' +
                        '• Song-Titel: "Never Gonna Give You Up"\n' +
                        '• Künstler + Song: "Queen Bohemian Rhapsody"\n' +
                        '• YouTube-Links: https://youtube.com/watch?v=...',
            fields: [],
            footer: {
                text: generateRateLimitFooter()
            },
            timestamp: new Date().toISOString()
        };

        // Add current playing song
        if (queue.currentSong) {
            embed.fields.push({
                name: '🎵 Aktuell spielt',
                value: `**${queue.currentSong.title}**\nvon ${queue.currentSong.author}${queue.currentSong.requestedBy ? `\nAngefragt von: ${queue.currentSong.requestedBy}` : ''}`,
                inline: false
            });
        }

        // Add queue preview
        if (musicSettings.songRequests.interactivePanel.showQueue && queue.songs.length > 0) {
            const maxDisplay = musicSettings.songRequests.interactivePanel.maxQueueDisplay;
            const displaySongs = queue.songs.slice(0, maxDisplay);
            
            let queueText = '';
            displaySongs.forEach((song, index) => {
                queueText += `**${index + 1}.** ${song.title}\n`;
                queueText += `    von ${song.author} • ${formatDuration(song.duration)}${song.requestedBy ? ` • ${song.requestedBy}` : ''}\n\n`;
            });

            if (queue.songs.length > maxDisplay) {
                queueText += `... und ${queue.songs.length - maxDisplay} weitere Songs`;
            }

            embed.fields.push({
                name: `📋 Nächste Songs (${queue.songs.length} in Queue)`,
                value: queueText || 'Queue ist leer',
                inline: false
            });
        } else if (queue.songs.length === 0) {
            embed.fields.push({
                name: '📋 Queue Status',
                value: '🎵 Keine Songs in der Queue\nSei der Erste und request einen Song!',
                inline: false
            });
        }

        // Create buttons
        const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('song_request')
                    .setLabel('🎵 Song Request')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('view_queue')
                    .setLabel('📋 Queue anzeigen')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('player_controls')
                    .setLabel('⏯️ Player')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [buttons] };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Interactive Panels:', error);
        return null;
    }
}

async function postInteractivePanel(guildId) {
    try {
        const guild = global.client?.guilds.cache.get(guildId);
        if (!guild) return false;

        const channelId = musicSettings.songRequests.interactivePanel.channelId;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return false;

        console.log(`🎵 Poste Interactive Song Request Panel in #${channel.name}`);

        const panelData = await createInteractivePanel(guildId);
        if (!panelData) return false;

        // Delete old message if exists
        const oldMessageId = musicSettings.songRequests.interactivePanel.messageId;
        if (oldMessageId) {
            try {
                const oldMessage = await channel.messages.fetch(oldMessageId);
                if (oldMessage) {
                    await oldMessage.delete();
                    console.log('🗑️ Alte Interactive Panel Message gelöscht');
                }
            } catch (error) {
                console.log('⚠️ Alte Message nicht gefunden oder bereits gelöscht');
            }
        }

        // Post new message
        const message = await channel.send(panelData);
        
        // Save message ID
        musicSettings.songRequests.interactivePanel.messageId = message.id;
        saveMusicSettings();

        console.log(`✅ Interactive Panel gepostet: ${message.id}`);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Posten des Interactive Panels:', error);
        return false;
    }
}

async function updateInteractivePanel(guildId) {
    try {
        if (!musicSettings.songRequests.interactivePanel.autoUpdate) return;

        const guild = global.client?.guilds.cache.get(guildId);
        if (!guild) return;

        const channelId = musicSettings.songRequests.interactivePanel.channelId;
        const messageId = musicSettings.songRequests.interactivePanel.messageId;
        
        if (!channelId || !messageId) return;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(messageId);
        if (!message) return;

        const panelData = await createInteractivePanel(guildId);
        if (!panelData) return;

        await message.edit(panelData);
        console.log('🔄 Interactive Panel aktualisiert');

    } catch (error) {
        console.log('⚠️ Fehler beim Aktualisieren des Interactive Panels:', error.message);
    }
}

async function handleSongRequestButton(interaction) {
    try {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

        const modal = new ModalBuilder()
            .setCustomId('song_request_modal')
            .setTitle('🎵 Song Request');

        const songInput = new TextInputBuilder()
            .setCustomId('song_query')
            .setLabel('Song-Titel oder YouTube-Link')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('z.B. "Never Gonna Give You Up" oder YouTube-Link')
            .setRequired(true)
            .setMaxLength(500);

        const firstActionRow = new ActionRowBuilder().addComponents(songInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);

    } catch (error) {
        console.error('❌ Fehler beim Song Request Button:', error);
        await interaction.reply({
            content: '❌ Ein Fehler ist aufgetreten. Versuche es später erneut.',
            ephemeral: true
        });
    }
}

async function handleSongRequestModal(interaction) {
    try {
        const query = interaction.fields.getTextInputValue('song_query');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        console.log(`🎵 Interactive Song-Request von ${interaction.user.tag}: "${query}"`);

        // Check if song requests are enabled
        if (!musicSettings.songRequests.enabled) {
            return await interaction.reply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: '❌ Song-Requests deaktiviert',
                    description: 'Song-Requests sind derzeit deaktiviert.',
                    timestamp: new Date().toISOString()
                }],
                ephemeral: true
            });
        }

        // Check user permissions
        const canRequest = canUserRequest(userId);
        if (!canRequest.canRequest) {
            let description = '';
            let title = '⏰ Request-Limit erreicht';
            
            if (canRequest.reason === 'cooldown') {
                description = `Du musst noch ${canRequest.remainingTime} Sekunden warten.`;
            } else if (canRequest.reason === 'rateLimit') {
                const timeUnitText = {
                    'minutes': 'Minute(n)',
                    'hours': 'Stunde(n)', 
                    'days': 'Tag(e)'
                };
                const unit = timeUnitText[canRequest.timeUnit] || 'Minute(n)';
                description = `Du hast dein Limit von ${canRequest.maxRequests} Requests pro ${canRequest.timeWindow} ${unit} erreicht.\nVersuche es in ${Math.floor(canRequest.remainingTime / 60)}min ${canRequest.remainingTime % 60}s erneut.`;
            } else if (canRequest.reason === 'limit') {
                description = `Du hast dein Tageslimit von ${canRequest.maxRequests} Requests erreicht.`;
            }
            
            return await interaction.reply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: title,
                    description: description,
                    timestamp: new Date().toISOString()
                }],
                ephemeral: true
            });
        }

        // Check DJ role if required
        if (musicSettings.songRequests.requireDJRole && musicSettings.commands.djRole) {
            const member = interaction.guild.members.cache.get(userId);
            const hasDJRole = member.roles.cache.has(musicSettings.commands.djRole);
            const hasAdminPerms = member.permissions.has('Administrator');
            
            if (!hasDJRole && !hasAdminPerms) {
                return await interaction.reply({
                    embeds: [{
                        color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                        title: '🎧 DJ-Rolle erforderlich',
                        description: 'Du benötigst die DJ-Rolle um Songs zu requesten.',
                        timestamp: new Date().toISOString()
                    }],
                    ephemeral: true
                });
            }
        }

        await interaction.deferReply({ ephemeral: true });

        // Get video info
        const videoInfo = await getVideoInfo(query);
        if (!videoInfo) {
            return await interaction.editReply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: '❌ Song nicht gefunden',
                    description: `Konnte "${query}" nicht finden oder laden.`,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        // Add requested by info
        videoInfo.requestedBy = interaction.user.tag;

        // Add to queue
        const added = addToQueue(guildId, videoInfo);
        if (!added) {
            return await interaction.editReply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: '📋 Queue voll',
                    description: `Die Queue ist voll (max. ${musicSettings.maxQueueLength} Songs).`,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        // Record the request
        recordUserRequest(userId);

        // Create success embed
        const queue = getQueue(guildId);
        const position = queue.songs.length;
        const estimatedWait = queue.songs.slice(0, position - 1).reduce((total, song) => total + (song.duration || 180), 0);

        const successEmbed = {
            color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
            title: '🎵 Song zur Queue hinzugefügt!',
            description: `**${videoInfo.title}**\nvon ${videoInfo.author}`,
            thumbnail: {
                url: videoInfo.thumbnail
            },
            fields: [
                {
                    name: '👤 Requested by',
                    value: interaction.user.tag,
                    inline: true
                },
                {
                    name: '⏱️ Dauer',
                    value: formatDuration(videoInfo.duration || 0),
                    inline: true
                },
                {
                    name: '📍 Position in Queue',
                    value: `${position}`,
                    inline: true
                }
            ],
            footer: {
                text: `Geschätzte Wartezeit: ${formatDuration(estimatedWait)}`
            },
            timestamp: new Date().toISOString()
        };

        await interaction.editReply({ embeds: [successEmbed] });

        // Update interactive panel
        await updateInteractivePanel(guildId);

        // Auto-start playback if bot is in voice channel and nothing is playing
        const connection = voiceConnections.get(guildId);
        if (!queue.currentSong && queue.songs.length === 1 && connection) {
            console.log('🎵 Auto-Start: Beginne Wiedergabe des ersten Songs');
            await playNext(guildId);
        }

        console.log(`✅ Interactive Song-Request erfolgreich: ${videoInfo.title} von ${interaction.user.tag}`);

    } catch (error) {
        console.error('❌ Fehler beim Interactive Song-Request:', error);
        await interaction.editReply({
            embeds: [{
                color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                title: '❌ Fehler',
                description: 'Ein Fehler ist beim Verarbeiten deines Requests aufgetreten.',
                timestamp: new Date().toISOString()
            }]
        });
    }
}

function stopProgressTracking(guildId) {
    const tracker = progressTrackers.get(guildId);
    if (tracker) {
        clearInterval(tracker);
        progressTrackers.delete(guildId);
        console.log(`⏹️ Progress-Tracking gestoppt für Guild ${guildId}`);
    }
    
    const queue = getQueue(guildId);
    queue.progress = {
        startTime: null,
        pausedTime: 0,
        duration: 0,
        currentTime: 0
    };
}

function pauseProgressTracking(guildId) {
    const queue = getQueue(guildId);
    if (queue.progress.startTime) {
        queue.progress.pausedTime += Date.now() - queue.progress.startTime;
        queue.progress.startTime = null;
        console.log(`⏸️ Progress-Tracking pausiert für Guild ${guildId}`);
    }
}

function resumeProgressTracking(guildId) {
    const queue = getQueue(guildId);
    if (!queue.progress.startTime && queue.progress.duration > 0) {
        queue.progress.startTime = Date.now();
        console.log(`▶️ Progress-Tracking fortgesetzt für Guild ${guildId}`);
    }
}

// Voice Connection Management
async function joinVoiceChannelSafe(channel) {
    try {
        console.log(`🔊 Versuche Voice-Channel "${channel.name}" beizutreten...`);
        
        // Prüfe Bot-Permissions
        const botMember = channel.guild.members.cache.get(global.client.user.id);
        if (!botMember) {
            console.error('❌ Bot-Member nicht gefunden');
            return null;
        }
        
        const permissions = channel.permissionsFor(botMember);
        console.log('🔐 Bot Permissions:', {
            connect: permissions.has('Connect'),
            speak: permissions.has('Speak'),
            useVAD: permissions.has('UseVAD')
        });
        
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            console.error('❌ Bot hat keine Voice-Permissions!');
            return null;
        }
        
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        // Store connection immediately (even if Ready state fails due to DNS issues)
        voiceConnections.set(channel.guild.id, connection);
        
        // Connection Event-Handler
        connection.on('stateChange', (oldState, newState) => {
            console.log(`🔊 Voice-Connection: ${oldState.status} → ${newState.status}`);
        });
        
        connection.on('error', (error) => {
            console.error('❌ Voice-Connection Error:', error);
        });
        
        try {
            console.log('⏳ Warte auf Voice-Connection Ready-Status...');
            await entersState(connection, VoiceConnectionStatus.Ready, 15000); // Reduced timeout
            console.log(`✅ Bot ist Voice-Channel "${channel.name}" beigetreten (Ready)`);
        } catch (readyError) {
            console.log('⚠️ Ready-Status Timeout, aber Connection könnte trotzdem funktionieren');
            console.log(`🔊 Aktueller Connection Status: ${connection.state.status}`);
            
            // Check if connection is at least connecting or ready
            if (connection.state.status === VoiceConnectionStatus.Connecting || 
                connection.state.status === VoiceConnectionStatus.Ready ||
                connection.state.status === VoiceConnectionStatus.Signalling) {
                console.log('✅ Connection scheint zu funktionieren trotz Ready-Timeout');
            } else {
                console.log('❌ Connection wirklich fehlgeschlagen');
                voiceConnections.delete(channel.guild.id);
                return null;
            }
        }
        
        console.log(`🔊 Final Connection Status: ${connection.state.status}`);
        return connection;
    } catch (error) {
        console.error('❌ Fehler beim Beitreten des Voice-Channels:', error);
        return null;
    }
}

function leaveVoiceChannel(guildId) {
    const connection = voiceConnections.get(guildId);
    if (connection) {
        connection.destroy();
        voiceConnections.delete(guildId);
        audioPlayers.delete(guildId);
        console.log('👋 Voice-Channel verlassen');
    }
}

// Audio Player Management
function createPlayerForGuild(guildId) {
    if (!audioPlayers.has(guildId)) {
        console.log(`🎮 Erstelle neuen AudioPlayer für Guild ${guildId}`);
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: 'pause',
                maxMissedFrames: Math.round(5000 / 20)
            }
        });
        audioPlayers.set(guildId, player);
        
        player.on(AudioPlayerStatus.Playing, () => {
            console.log('🎵 AudioPlayer: Playing');
            resumeProgressTracking(guildId);
        });
        
        player.on(AudioPlayerStatus.Paused, () => {
            console.log('⏸️ AudioPlayer: Paused');
            pauseProgressTracking(guildId);
        });
        
        player.on(AudioPlayerStatus.Idle, () => {
            console.log('💤 AudioPlayer: Idle - spiele nächsten Song');
            stopProgressTracking(guildId);
            playNext(guildId);
        });
        
        player.on(AudioPlayerStatus.Buffering, () => {
            console.log('📡 AudioPlayer: Buffering...');
        });

        player.on('error', error => {
            console.error('❌ Audio Player Fehler:', error);
            console.error('❌ Fehler-Details:', {
                name: error.name,
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3)
            });
            
            // Bei DNS-Fehlern: Versuche aktuellen Song erneut (max 2x), dann nächsten
            if (error.message && error.message.includes('ENOTFOUND')) {
                const queue = getQueue(guildId);
                const currentSong = queue.currentSong;
                
                if (currentSong && !currentSong.retryCount) {
                    currentSong.retryCount = 1;
                    console.log('🔄 DNS-Fehler: Versuche aktuellen Song erneut...');
                    setTimeout(() => {
                        playMusic(guildId, currentSong).catch(() => {
                            console.log('❌ Retry fehlgeschlagen - spiele nächsten Song');
                            playNext(guildId);
                        });
                    }, 3000); // 3 Sekunden warten
                    return;
                } else if (currentSong && currentSong.retryCount === 1) {
                    currentSong.retryCount = 2;
                    console.log('🔄 DNS-Fehler: Letzter Retry-Versuch...');
                    setTimeout(() => {
                        playMusic(guildId, currentSong).catch(() => {
                            console.log('❌ Alle Retries fehlgeschlagen - spiele nächsten Song');
                            playNext(guildId);
                        });
                    }, 5000); // 5 Sekunden warten
                    return;
                }
            }
            
            // Standard-Verhalten: Nächsten Song spielen
            playNext(guildId);
        });
        
        player.on('stateChange', (oldState, newState) => {
            console.log(`🎮 Player Status: ${oldState.status} → ${newState.status}`);
        });
        
        console.log('✅ AudioPlayer erstellt mit Event-Handlern');
    }
    return audioPlayers.get(guildId);
}

// Play Music
async function playMusic(guildId, song) {
    let songData; // Declare outside try-catch for error handling
    try {
        const connection = voiceConnections.get(guildId);
        if (!connection) {
            console.error('❌ Keine Voice-Verbindung gefunden');
            return false;
        }

        console.log(`🔊 Voice-Connection Status: ${connection.state.status}`);
        
        const player = createPlayerForGuild(guildId);
        const queue = getQueue(guildId);
        
        // Handle both song objects and URLs
        if (typeof song === 'string') {
            // If it's a URL string, get video info
            console.log(`🔍 URL erkannt, hole Video-Info: ${song}`);
            songData = await getVideoInfo(song);
            if (!songData) {
                console.error('❌ Konnte Video-Info nicht abrufen');
                return false;
            }
        } else {
            // It's already a song object
            songData = song;
        }
        
        console.log(`🎵 Versuche abzuspielen: ${songData.title} (${songData.url})`);
        
        let stream;
        let streamCreated = false;
        
        // 🎯 VEREINFACHTE YOUTUBE-STREAMING (nach User-Muster)
        if (!streamCreated) {
            try {
                console.log('🆕 Versuche sauberes youtubei.js Streaming...');
                
                // Hole oder verwende vorhandene youtubei.js Daten
                let youtubeData = songData.isYoutubei ? songData : await getVideoInfoWithYoutubei(songData.url);
                
                if (youtubeData && youtubeData.streamUrl) {
                    console.log(`🎯 Stream-URL gefunden (${youtubeData.audioQuality || 'UNKNOWN'}): ${youtubeData.mimeType}`);
                    
                    // 🎯 DIREKTER FETCH → RESPONSE.BODY ANSATZ (nach User-Muster)
                    const fetch = require('node-fetch');
                    const response = await fetch(youtubeData.streamUrl);
                    
                    if (!response.ok || !response.body) {
                        throw new Error('Stream konnte nicht geladen werden');
                    }
                    
                    console.log(`📡 Stream Response: ${response.status} OK`);
                    
                    // ✅ DIREKTER STREAM WIE USER VORGESCHLAGEN
                    stream = response.body;
                    streamCreated = true;
                    console.log(`✅ youtubei.js Stream bereit für Discord!`);
                    
                    // Update songData falls nötig
                    if (!songData.isYoutubei) {
                        Object.assign(songData, youtubeData);
                    }
                    
                } else {
                    console.log('❌ Keine gültige Stream-URL erhalten');
                }
                
            } catch (youtubeError) {
                console.log('⚠️ youtubei.js Streaming fehlgeschlagen:', youtubeError.message);
            }
        }

        // 🔄 FALLBACK: Alternative yt-search (vereinfacht)
        if (!streamCreated) {
            try {
                console.log('🔍 Fallback: Suche Alternativen...');
                
                const searchResults = await searchYouTube(songData.title || songData.url);
                
                if (searchResults.length > 0) {
                    console.log(`🔄 Teste Alternative: ${searchResults[0].title}`);
                    
                    const alternativeData = await getVideoInfoWithYoutubei(searchResults[0].url);
                    
                    if (alternativeData && alternativeData.streamUrl) {
                        const fetch = require('node-fetch');
                        const response = await fetch(alternativeData.streamUrl);
                        
                        if (response.ok && response.body) {
                            stream = response.body;
                            streamCreated = true;
                            Object.assign(songData, alternativeData);
                            console.log(`✅ Alternative erfolgreich!`);
                        }
                    }
                }
                
            } catch (alternativeError) {
                console.log('⚠️ Alternative fehlgeschlagen:', alternativeError.message);
            }
        }
        

        
        if (!streamCreated) {
            console.error('❌ Alle Stream-Methoden fehlgeschlagen');
            
            // Methode 5: Letzter Versuch - Direkter Audio-Stream falls URL eine direkte Audio-URL ist
            const testUrl = songData?.url || song?.url;
            if (testUrl && testUrl.match(/\.(mp3|m4a|ogg|webm)(\?.*)?$/i)) {
                try {
                    console.log('🎧 Letzter Versuch: Direkter Audio-Stream...');
                    const fetch = require('node-fetch');
                    const response = await fetch(testUrl, {
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    if (response.ok && response.headers.get('content-type')?.includes('audio')) {
                        stream = response.body;
                        streamCreated = true;
                        console.log('✅ Direkter Audio-Stream erfolgreich');
                    }
                } catch (directError) {
                    console.log('❌ Direkter Audio-Stream fehlgeschlagen:', directError.message);
                }
            }
            

            
            // 🚫 Radio-Fallback temporär deaktiviert für Tests
            // Direkter Fehler wenn youtubei.js fehlschlägt, kein Radio-Fallback
            
            if (!streamCreated) {
                throw new Error('Alle YouTube-Stream-Methoden fehlgeschlagen - Video möglicherweise nicht verfügbar oder Region-gesperrt.');
            }
        }

        console.log('🎧 Erstelle AudioResource...');
        
        // 🎯 DIREKTER AUDIORESSOURCE-ANSATZ (nach User-Muster)
        const resource = createAudioResource(stream, {
            inputType: StreamType.WebmOpus, // YouTube liefert immer WebM/Opus
            metadata: songData,
            inlineVolume: true
        });
        
        console.log(`🎵 AudioResource erstellt: StreamType.WebmOpus`);
        
        // Setze initiale Lautstärke
        const currentQueue = getQueue(guildId);
        if (resource.volume) {
            resource.volume.setVolume(currentQueue.volume / 100);
            console.log(`🔊 Lautstärke gesetzt: ${currentQueue.volume}%`);
        }
        
        console.log('✅ AudioResource erstellt');

        // 🎯 SAUBERES PLAYER-HANDLING (nach User-Muster)
        player.play(resource);
        connection.subscribe(player);
        
        // Update Queue Status
        queue.currentSong = songData;
        startProgressTracking(guildId, songData.duration || 0);
        
        console.log(`🎵 Spielt jetzt: ${songData.title}`);
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Abspielen:', error.message);
        
        // Sichere songData Referenz
        const safeSongData = songData || song || { title: 'Unknown', url: 'Unknown', duration: 'Unknown', author: 'Unknown' };
        
        console.error('❌ Song-Details:', {
            title: safeSongData?.title || 'Unknown',
            url: safeSongData?.url || 'Unknown',
            duration: safeSongData?.duration || 'Unknown'
        });
        
        // Spezielle Behandlung für YouTube-Bot-Blockierung
        let errorMessage = error.message;
        let errorTitle = '❌ Musik-Fehler';
        
        if (error.message.includes('Sign in to confirm you\'re not a bot') || 
            error.message.includes('UnrecoverableError') ||
            error.message.includes('Video unavailable') ||
            error.message.includes('This video is not available')) {
            
            errorMessage = `YouTube blockiert Bot-Zugriff. Versuche alternative Methoden...`;
            errorTitle = '🤖 YouTube Bot-Erkennung';
            
            console.log('🔄 YouTube Bot-Blockierung erkannt, versuche alternative Streaming-Methoden...');
            
            // Sende Info über Fallback-Versuche
            if (musicSettings.announcements.channelId && global.client) {
                try {
                    const channel = global.client.channels.cache.get(musicSettings.announcements.channelId);
                    if (channel) {
                        await channel.send({
                            embeds: [{
                                color: 0xFFA500, // Orange
                                title: '🔄 YouTube-Blockierung erkannt',
                                description: `YouTube blockiert den Song **${safeSongData?.title || 'Unknown'}**\n\n🔍 Versuche alternative Quellen...`,
                                                footer: {
                    text: 'Nutze youtubei.js (interne YouTube-API ohne Cookies)'
                },
                                timestamp: new Date().toISOString()
                            }]
                        });
                    }
                } catch (notifyError) {
                    console.log('⚠️ Fehler beim Senden der Fallback-Benachrichtigung:', notifyError.message);
                }
            }
            
            // Versuche mit alternativer Suche (nur wenn safeSongData verfügbar)
            if (safeSongData && safeSongData.title && safeSongData.title !== 'Unknown') {
                try {
                    console.log('🔍 Suche nach alternativen Quellen...');
                    const searchQuery = `${safeSongData.title} ${safeSongData.author || ''}`.trim();
                    const altResults = await searchYouTube(searchQuery);
                    
                    if (altResults.length > 0) {
                        console.log(`🔄 Gefunden: ${altResults.length} alternative Quellen`);
                        
                        // Teste die ersten 2 Alternativen
                        for (let i = 0; i < Math.min(2, altResults.length); i++) {
                            const altResult = altResults[i];
                            try {
                                console.log(`🧪 Teste alternative Quelle ${i+1}: ${altResult.title}`);
                                const altVideoInfo = await getVideoInfo(altResult.url);
                                
                                if (altVideoInfo) {
                                    altVideoInfo.requestedBy = safeSongData.requestedBy || 'System';
                                    console.log('✅ Alternative Quelle gefunden, versuche Wiedergabe...');
                                    
                                    // Rekursiver Aufruf mit alternativer Quelle (nur 1 Versuch)
                                    const success = await playMusic(guildId, altVideoInfo);
                                    if (success) {
                                        console.log('🎉 Alternative Quelle erfolgreich abgespielt!');
                                        return true;
                                    }
                                }
                            } catch (altError) {
                                console.log(`⚠️ Alternative Quelle ${i+1} fehlgeschlagen: ${altError.message}`);
                                continue;
                            }
                        }
                    }
                } catch (altSearchError) {
                    console.log('❌ Alternative Suche fehlgeschlagen:', altSearchError.message);
                }
            }
        }
        
        // Sende Fehler-Nachricht an Bot-Channel falls konfiguriert
        if (musicSettings.announcements.channelId && global.client && safeSongData) {
            try {
                const channel = global.client.channels.cache.get(musicSettings.announcements.channelId);
                if (channel) {
                    await channel.send({
                        embeds: [{
                            color: 0xFF6B6B,
                            title: errorTitle,
                            description: `**Song:** ${safeSongData.title || 'Unknown'}\n**Fehler:** ${errorMessage}`,
                            fields: [
                                {
                                    name: '🔧 Lösungsvorschläge',
                                    value: `• Versuche einen anderen Song\n• Nutze einen direkteren YouTube-Link\n• Warte 5-10 Minuten und versuche es erneut`,
                                    inline: false
                                }
                            ],
                            footer: {
                                text: 'youtubei.js nutzt interne YouTube-API - keine Cookie-Probleme mehr'
                            },
                            timestamp: new Date().toISOString()
                        }]
                    });
                }
            } catch (embedError) {
                console.error('❌ Fehler beim Senden der Fehler-Nachricht:', embedError);
            }
        }
        
        return false;
    }
}

async function playNext(guildId) {
    const queue = getQueue(guildId);
    const player = audioPlayers.get(guildId);
    
    if (queue.repeat === 'song' && queue.currentSong) {
        // Repeat current song
        console.log(`🔁 Wiederhole aktuellen Song: ${queue.currentSong.title}`);
        await playMusic(guildId, queue.currentSong);
        await updateInteractivePanel(guildId);
        return;
    }
    
    if (queue.repeat === 'queue' && queue.currentSong && queue.songs.length === 0) {
        // Add current song back to queue
        queue.songs.push(queue.currentSong);
    }
    
    if (queue.songs.length === 0) {
        console.log('📭 Queue ist leer - stoppe Wiedergabe');
        queue.currentSong = null;
        stopProgressTracking(guildId);
        await updateInteractivePanel(guildId);
        
        // Auto-Leave: Leave voice channel when queue is empty
        if (musicSettings.songRequests?.interactivePanel?.autoJoinLeave) {
            await autoLeaveWhenEmpty(guildId);
        }
        
        return;
    }
    
    const nextSong = queue.songs.shift();
    queue.currentSong = nextSong;
    
    console.log(`🎵 Spiele nächsten Song: ${nextSong.title}`);
    
    const success = await playMusic(guildId, nextSong);
    if (success) {
        startProgressTracking(guildId, nextSong.duration);
        await updateInteractivePanel(guildId);
        
        // Send announcement if enabled
        if (musicSettings.announcements.nowPlaying && musicSettings.announcements.channelId) {
            await sendNowPlayingAnnouncement(guildId, nextSong);
        }
    } else {
        console.log('❌ Fehler beim Abspielen - versuche nächsten Song');
        queue.currentSong = null;
        await playNext(guildId); // Try next song
    }
}

// Auto-join voice channels
async function checkAutoJoinChannels(guild) {
    if (!musicSettings.autoJoinVoice || !musicSettings.enabled) return;
    
    for (const channelId of musicSettings.voiceChannels.autoJoin) {
        const channel = guild.channels.cache.get(channelId);
        if (channel && channel.isVoiceBased() && channel.members.size > 0) {
            const connection = getVoiceConnection(guild.id);
            if (!connection) {
                await joinVoiceChannelSafe(channel);
                break;
            }
        }
    }
}

// Auto-Join Logic: Join voice channel when songs are added to queue
async function autoJoinForQueue(guildId) {
    try {
        console.log(`🤖 Auto-Join gestartet für Guild: ${guildId}`);
        
        if (!global.client) {
            console.log('❌ global.client nicht verfügbar');
            return false;
        }
        
        const guild = global.client.guilds.cache.get(guildId);
        if (!guild) {
            console.log(`❌ Guild ${guildId} nicht gefunden`);
            return false;
        }
        
        console.log(`✅ Guild gefunden: ${guild.name}`);
        
        // Check if bot is already in a voice channel
        let connection = voiceConnections.get(guildId);
        if (connection) {
            console.log('🎵 Bot ist bereits im Voice-Channel');
            return true;
        }
        
        // Find voice channels (preferably with users, but also empty ones)
        const voiceChannelsWithUsers = guild.channels.cache.filter(channel => 
            channel.isVoiceBased() && 
            channel.members.size > 0 &&
            !channel.members.every(member => member.user.bot) // Nicht nur Bots
        );
        
        const allVoiceChannels = guild.channels.cache.filter(channel => 
            channel.isVoiceBased() && 
            channel.joinable // Bot kann beitreten
        );
        
        console.log(`🔍 Voice-Channels mit Usern: ${voiceChannelsWithUsers.size}`);
        console.log(`🔍 Alle verfügbare Voice-Channels: ${allVoiceChannels.size}`);
        
        let targetChannel;
        
        // Priorität 1: Channel mit Usern
        if (voiceChannelsWithUsers.size > 0) {
            targetChannel = voiceChannelsWithUsers.sort((a, b) => b.members.size - a.members.size).first();
            console.log(`🎯 Wähle Channel mit Usern: ${targetChannel.name} (${targetChannel.members.size} User)`);
        }
        // Priorität 2: Bevorzugter Channel aus Settings
        else if (musicSettings.voiceChannels?.preferred) {
            const preferredChannel = allVoiceChannels.find(ch => 
                ch.name.toLowerCase().includes(musicSettings.voiceChannels.preferred.toLowerCase()) ||
                ch.id === musicSettings.voiceChannels.preferred
            );
            if (preferredChannel) {
                targetChannel = preferredChannel;
                console.log(`🎯 Wähle bevorzugten Channel: ${targetChannel.name}`);
            }
        }
        // Priorität 3: Erster verfügbarer Voice-Channel
        if (!targetChannel && allVoiceChannels.size > 0) {
            targetChannel = allVoiceChannels.first();
            console.log(`🎯 Wähle ersten verfügbaren Channel: ${targetChannel.name}`);
        }
        
        if (!targetChannel) {
            console.log('❌ Keine beitretbaren Voice-Channels gefunden');
            return false;
        }
        
        console.log(`🎵 Auto-Join: Trete ${targetChannel.name} bei (${targetChannel.members.size} User)`);
        const joinResult = await joinVoiceChannelSafe(targetChannel);
        console.log(`🔗 joinVoiceChannelSafe Ergebnis: ${joinResult ? 'Erfolgreich' : 'Fehlgeschlagen'}`);
        
        // Wait a moment for connection to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Even if joinVoiceChannelSafe returns null due to DNS errors,
        // check if the bot actually joined successfully
        connection = voiceConnections.get(guildId);
        if (connection) {
            console.log('✅ Auto-Join erfolgreich (Voice-Connection vorhanden)');
            return true;
        }
        
        // Also check if bot is actually in the voice channel (Discord.js cache)
        const botMember = guild.members.cache.get(global.client.user.id);
        if (botMember && botMember.voice.channel) {
            console.log('✅ Auto-Join erfolgreich (Bot ist im Voice-Channel laut Discord)');
            return true;
        }
        
        console.log('❌ Auto-Join fehlgeschlagen - Bot nicht im Voice-Channel');
        return !!joinResult;
    } catch (error) {
        console.error('❌ Fehler beim Auto-Join:', error);
        
        // Even after error, check if bot is actually connected
        try {
            const guild = global.client.guilds.cache.get(guildId);
            if (guild) {
                const connection = voiceConnections.get(guildId);
                const botMember = guild.members.cache.get(global.client.user.id);
                
                if (connection || (botMember && botMember.voice.channel)) {
                    console.log('✅ Auto-Join erfolgreich (trotz Fehler)');
                    return true;
                }
            }
        } catch (checkError) {
            console.error('❌ Fehler beim Prüfen der Voice-Verbindung:', checkError);
        }
        
        return false;
    }
}

// Auto-Leave Logic: Leave voice channel when queue is empty
async function autoLeaveWhenEmpty(guildId) {
    try {
        const queue = getQueue(guildId);
        
        // Check if queue is truly empty (no current song and no queued songs)
        if (queue.currentSong || queue.songs.length > 0) {
            return; // Queue not empty, don't leave
        }
        
        console.log('📭 Queue ist leer - starte Auto-Leave Timer (30 Sekunden)');
        
        // Wait 30 seconds before leaving (in case new songs are added quickly)
        setTimeout(async () => {
            const currentQueue = getQueue(guildId);
            
            // Double-check queue is still empty
            if (!currentQueue.currentSong && currentQueue.songs.length === 0) {
                console.log('🚪 Auto-Leave: Verlasse Voice-Channel (Queue leer)');
                leaveVoiceChannel(guildId);
            } else {
                console.log('🎵 Auto-Leave abgebrochen: Neue Songs in Queue');
            }
        }, 30000); // 30 seconds delay
        
    } catch (error) {
        console.error('❌ Fehler beim Auto-Leave:', error);
    }
}

// Music API Endpoints
// Radio System Functions
const radioStations = new Map(); // guildId -> current radio station

function getRadioStations() {
    return musicSettings.radio?.stations || [];
}

function getRadioStation(stationId) {
    const stations = getRadioStations();
    return stations.find(station => station.id === stationId);
}

async function playRadioStation(guildId, stationId) {
    try {
        const station = getRadioStation(stationId);
        if (!station) {
            throw new Error(`Radio-Sender "${stationId}" nicht gefunden`);
        }

        console.log(`📻 Starte Radio-Sender: ${station.name} für Guild ${guildId}`);

        // Auto-Join falls nicht im Voice-Channel
        let connection = voiceConnections.get(guildId);
        if (!connection) {
            console.log('📻 Auto-Join für Radio-Wiedergabe');
            const autoJoinSuccess = await autoJoinForQueue(guildId);
            if (!autoJoinSuccess) {
                throw new Error('Bot konnte keinem Voice-Channel beitreten');
            }
        }

        // Stoppe aktuelle Musik
        const player = audioPlayers.get(guildId);
        if (player) {
            player.stop();
        }

        // Erstelle Radio-Song Objekt
        const radioSong = {
            title: `📻 ${station.name}`,
            url: station.url,
            duration: 0, // Unendlich für Radio
            thumbnail: station.logo,
            author: station.description,
            isRadio: true,
            radioStation: station,
            requestedBy: 'Radio-System'
        };

        // Setze als aktueller Radio-Sender
        radioStations.set(guildId, station);

        // Spiele Radio-Stream ab
        await playMusic(guildId, radioSong);

        console.log(`✅ Radio-Sender ${station.name} gestartet`);
        return true;

    } catch (error) {
        console.error(`❌ Fehler beim Starten des Radio-Senders:`, error);
        throw error;
    }
}

function stopRadio(guildId) {
    try {
        console.log(`📻 Stoppe Radio für Guild ${guildId}`);
        
        // Entferne aktuellen Radio-Sender
        radioStations.delete(guildId);
        
        // Stoppe Player
        const player = audioPlayers.get(guildId);
        if (player) {
            player.stop();
        }

        // Lösche Queue wenn Radio gestoppt wird
        if (musicSettings.radio?.autoStop) {
            clearQueue(guildId);
        }

        console.log(`✅ Radio gestoppt`);
        return true;

    } catch (error) {
        console.error(`❌ Fehler beim Stoppen des Radios:`, error);
        return false;
    }
}

function getCurrentRadioStation(guildId) {
    return radioStations.get(guildId) || null;
}

function isPlayingRadio(guildId) {
    return radioStations.has(guildId);
}

// Erweitere die playMusic Funktion für Radio-Support
const originalPlayMusic = playMusic;
async function playMusicWithRadio(guildId, song) {
    try {
        // Wenn es ein Radio-Stream ist, verwende spezielle Behandlung
        if (song.isRadio) {
            console.log(`📻 Spiele Radio-Stream: ${song.radioStation.name}`);
            
            const connection = voiceConnections.get(guildId);
            if (!connection) {
                throw new Error('Keine Voice-Verbindung vorhanden');
            }

            let player = audioPlayers.get(guildId);
            if (!player) {
                player = createPlayerForGuild(guildId);
            }

            // Erstelle Audio-Resource für Radio-Stream
            let resource;
            
            // Prüfe ob es ein YouTube-Stream ist (für Lofi/ChillHop)
            if (song.url.includes('youtube.com') || song.url.includes('youtu.be')) {
                const youtubeData = await getVideoInfoWithYoutubei(song.url);
                if (youtubeData && youtubeData.streamUrl) {
                    const fetch = require('node-fetch');
                    console.log(`📻 Fetching Radio YouTube Stream: ${youtubeData.streamUrl}`);
                    
                    const response = await fetch(youtubeData.streamUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                            'Referer': 'https://www.youtube.com/',
                            'Range': 'bytes=0-'
                        }
                    });
                    
                    console.log(`📻 Radio Response Status: ${response.status} ${response.statusText}`);
                    
                    if (response.ok && response.body && typeof response.body.pipe === 'function') {
                        // Bestimme StreamType für Radio YouTube-Stream
                        let radioInputType = StreamType.Arbitrary;
                        if (youtubeData.mimeType) {
                            if (youtubeData.mimeType.includes('audio/webm') && youtubeData.mimeType.includes('opus')) {
                                radioInputType = StreamType.WebmOpus;
                                console.log('📻 Radio: Verwende StreamType.WebmOpus');
                            } else {
                                console.log(`📻 Radio: Verwende StreamType.Arbitrary für ${youtubeData.mimeType}`);
                            }
                        }
                        
                        resource = createAudioResource(response.body, {
                            inputType: radioInputType,
                            inlineVolume: true
                        });
                        console.log(`✅ Radio YouTube-Stream ReadableStream validiert`);
                    } else {
                        throw new Error(`Radio YouTube-Stream Response invalid: Status ${response.status}, Body type: ${typeof response.body}`);
                    }
                } else {
                    throw new Error('Radio YouTube-Stream konnte nicht geladen werden');
                }
            } else {
                // Direkter Radio-Stream (nicht YouTube)
                console.log('📻 Erstelle direkter Radio-Stream Resource');
                resource = createAudioResource(song.url, {
                    inputType: StreamType.Arbitrary, // Für normale Radio-Streams
                    inlineVolume: true
                });
            }

            // Setze Lautstärke
            if (resource.volume) {
                resource.volume.setVolume(musicSettings.defaultVolume / 100);
            }

            // Spiele ab
            player.play(resource);
            connection.subscribe(player);

            // Aktualisiere Queue
            const queue = getQueue(guildId);
            queue.currentSong = song;
            queue.isPlaying = true;
            queue.isPaused = false;

            // Sende Now-Playing Nachricht für Radio
            if (musicSettings.radio?.showNowPlaying && musicSettings.announcements?.channelId) {
                await sendRadioNowPlayingMessage(guildId, song);
            }

            return true;
        } else {
            // Normale Musik-Wiedergabe
            return await originalPlayMusic(guildId, song);
        }

    } catch (error) {
        console.error(`❌ Fehler beim Abspielen:`, error);
        throw error;
    }
}

// Überschreibe die playMusic Funktion
playMusic = playMusicWithRadio;

async function sendRadioNowPlayingMessage(guildId, radioSong) {
    try {
        if (!musicSettings.announcements?.channelId) return;

        const guild = global.client?.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(musicSettings.announcements.channelId);
        if (!channel) return;

        const station = radioSong.radioStation;
        
        const embed = {
            color: parseInt(musicSettings.radio?.embedColor?.replace('#', '') || 'FF6B6B', 16),
            title: '📻 Radio läuft jetzt',
            description: `**${station.name}** wird abgespielt`,
            fields: [
                {
                    name: '🎵 Genre',
                    value: station.genre,
                    inline: true
                },
                {
                    name: '🌍 Land',
                    value: station.country,
                    inline: true
                },
                {
                    name: '📝 Beschreibung',
                    value: station.description,
                    inline: false
                }
            ],
            thumbnail: {
                url: station.logo
            },
            timestamp: new Date().toISOString(),
            footer: {
                text: '📻 Radio-Modus aktiv • Verwende !radio stop zum Beenden'
            }
        };

        await channel.send({ embeds: [embed] });

    } catch (error) {
        console.error('❌ Fehler beim Senden der Radio Now-Playing Nachricht:', error);
    }
}

function registerMusicAPI(app) {
    // Get music settings
    app.get('/api/music/settings', (req, res) => {
        res.json({
            success: true,
            settings: musicSettings
        });
    });

    // Get request tracking data
    app.get('/api/music/request-tracking', (req, res) => {
        try {
            const trackingData = [];
            const now = Date.now();
            const rateLimit = musicSettings.songRequests.rateLimit;
            
            for (const [userId, requestData] of userRequestCounts.entries()) {
                let remainingRequests = 0;
                let resetTime = null;
                
                if (rateLimit && rateLimit.enabled && requestData.firstRequest) {
                    const timeWindowMs = getTimeWindowInMs(rateLimit.timeWindow, rateLimit.timeUnit);
                    const timeSinceFirst = now - requestData.firstRequest;
                    
                    if (timeSinceFirst < timeWindowMs) {
                        remainingRequests = Math.max(0, rateLimit.maxRequests - requestData.count);
                        resetTime = requestData.firstRequest + timeWindowMs;
                    } else {
                        // Time window expired, user can make full requests again
                        remainingRequests = rateLimit.maxRequests;
                    }
                } else {
                    // Fallback to old system
                    remainingRequests = Math.max(0, musicSettings.songRequests.maxRequestsPerUser - (requestData.count || 0));
                }
                
                // Get user info from Discord if possible
                let username = userId;
                try {
                    if (global.client) {
                        const user = global.client.users.cache.get(userId);
                        if (user) {
                            username = user.tag;
                        }
                    }
                } catch (error) {
                    // Keep userId as fallback
                }
                
                trackingData.push({
                    userId,
                    username,
                    requestsUsed: requestData.count || 0,
                    remainingRequests,
                    resetTime,
                    lastRequest: userRequestCooldowns.get(userId) || null
                });
            }
            
            // Sort by most requests used
            trackingData.sort((a, b) => b.requestsUsed - a.requestsUsed);
            
            res.json({
                success: true,
                trackingData,
                rateLimit: rateLimit || {
                    enabled: false,
                    maxRequests: musicSettings.songRequests.maxRequestsPerUser,
                    timeWindow: 24,
                    timeUnit: 'hours'
                },
                cooldownMinutes: musicSettings.songRequests.cooldownMinutes
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Save music settings
    app.post('/api/music/settings', (req, res) => {
        try {
            musicSettings = { ...musicSettings, ...req.body };
            saveMusicSettings();
            res.json({
                success: true,
                message: 'Musik-Einstellungen gespeichert'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Search YouTube
    app.get('/api/music/search', async (req, res) => {
        try {
            const { query } = req.query;
            const results = await searchYouTube(query);
            res.json({
                success: true,
                results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get current queue
    app.get('/api/music/queue/:guildId', (req, res) => {
        const { guildId } = req.params;
        const queue = getQueue(guildId);
        res.json({
            success: true,
            queue: {
                currentSong: queue.currentSong,
                songs: queue.songs,
                volume: queue.volume,
                repeat: queue.repeat,
                shuffle: queue.shuffle
            }
        });
    });

    // Add song to queue
    app.post('/api/music/queue/:guildId/add', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { url, requestedBy } = req.body;
            
            console.log(`🎵 Versuche Song hinzuzufügen: ${url} für Guild: ${guildId}`);
            
            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'URL ist erforderlich'
                });
            }
            
            const videoInfo = await getVideoInfo(url);
            if (!videoInfo) {
                console.log('❌ Video-Info konnte nicht abgerufen werden');
                return res.status(400).json({
                    success: false,
                    error: 'Video nicht gefunden oder nicht verfügbar'
                });
            }
            
            console.log(`✅ Video-Info erhalten: ${videoInfo.title}`);
            videoInfo.requestedBy = requestedBy;
            
            const added = addToQueue(guildId, videoInfo);
            if (!added) {
                console.log('❌ Queue ist voll');
                return res.status(400).json({
                    success: false,
                    error: `Queue ist voll (max. ${musicSettings.maxQueueLength} Songs)`
                });
            }
            
            console.log(`✅ Song zur Queue hinzugefügt: ${videoInfo.title}`);
            
            // Starte automatisch Wiedergabe nur wenn Bot im Voice-Channel ist
            const queue = getQueue(guildId);
            const connection = voiceConnections.get(guildId);
            
            if (!queue.currentSong && queue.songs.length === 1 && connection) {
                console.log('🎵 Starte automatische Wiedergabe (Bot ist im Voice-Channel)');
                await playNext(guildId);
            } else if (!connection) {
                console.log('⚠️ Bot ist nicht im Voice-Channel - Songs bleiben in Queue');
            }
            
            res.json({
                success: true,
                message: 'Song zur Queue hinzugefügt',
                song: videoInfo
            });
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen zur Queue:', error);
            res.status(500).json({
                success: false,
                error: `Interner Fehler: ${error.message}`
            });
        }
    });

    // Set volume
    app.post('/api/music/volume/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            const { volume } = req.body;
            
            if (volume < 0 || volume > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Lautstärke muss zwischen 0 und 100 liegen'
                });
            }
            
            const queue = getQueue(guildId);
            const player = audioPlayers.get(guildId);
            
            // Update queue volume
            queue.volume = volume;
            
            // Update current playing resource volume
            if (player && player.state.resource && player.state.resource.volume) {
                player.state.resource.volume.setVolume(volume / 100);
                console.log(`🔊 Lautstärke geändert auf: ${volume}%`);
            }
            
            res.json({
                success: true,
                message: `Lautstärke auf ${volume}% gesetzt`,
                volume: volume
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Control playback
    app.post('/api/music/control/:guildId/:action', async (req, res) => {
        try {
            const { guildId, action } = req.params;
            const player = audioPlayers.get(guildId);
            const queue = getQueue(guildId);
            
            switch (action) {
                case 'play':
                    let connection = voiceConnections.get(guildId);
                    
                    // If bot is not connected but auto-join is enabled, try to join
                    if (!connection && musicSettings.songRequests?.interactivePanel?.autoJoinLeave) {
                        console.log('🎵 Bot nicht verbunden - versuche Auto-Join für Play-Button');
                        const joinSuccess = await autoJoinForQueue(guildId);
                        if (joinSuccess) {
                            connection = voiceConnections.get(guildId);
                            console.log('✅ Auto-Join für Play-Button erfolgreich');
                        } else {
                            return res.status(400).json({
                                success: false,
                                error: 'Bot konnte keinem Voice-Channel beitreten. Stelle sicher, dass du in einem Voice-Channel bist!'
                            });
                        }
                    } else if (!connection) {
                        return res.status(400).json({
                            success: false,
                            error: 'Bot ist nicht im Voice-Channel. Auto-Join ist deaktiviert - trete manuell einem Voice-Channel bei!'
                        });
                    }
                    
                    // Prüfe aktuellen Spielstatus
                    if (player && player.state.status === 'playing') {
                        console.log('🎵 Song spielt bereits - keine Aktion nötig');
                        return res.json({
                            success: true,
                            message: 'Song spielt bereits'
                        });
                    }
                    
                    if (queue.songs.length > 0 && !queue.currentSong) {
                        console.log('🎵 Starte Wiedergabe der Queue');
                        await playNext(guildId);
                    } else if (player && player.state.status === 'paused') {
                        console.log('▶️ Pausierte Wiedergabe fortsetzen');
                        player.unpause();
                    } else if (queue.currentSong && !player) {
                        console.log('🎵 Starte aktuellen Song neu');
                        await playMusic(guildId, queue.currentSong);
                    } else {
                        return res.status(400).json({
                            success: false,
                            error: 'Keine Songs in der Queue'
                        });
                    }
                    break;
                    
                case 'pause':
                    if (player) player.pause();
                    break;
                    
                case 'skip':
                    await playNext(guildId);
                    break;
                    
                case 'stop':
                    if (player) player.stop();
                    clearQueue(guildId);
                    break;
                    
                case 'shuffle':
                    shuffleQueue(guildId);
                    break;
                    
                case 'clear':
                    clearQueue(guildId);
                    if (player) player.stop();
                    break;
            }
            
            res.json({
                success: true,
                message: `Aktion ${action} ausgeführt`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get voice connection status and progress
    app.get('/api/music/voice/:guildId/status', (req, res) => {
        try {
            const { guildId } = req.params;
            const connection = voiceConnections.get(guildId);
            const player = audioPlayers.get(guildId);
            const queue = getQueue(guildId);
            
            // Format time helper
            const formatTime = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            
            res.json({
                success: true,
                status: {
                    connected: !!connection,
                    connectionStatus: connection?.state?.status || 'disconnected',
                    playerStatus: player?.state?.status || 'idle',
                    hasActivePlayer: !!player,
                    progress: {
                        currentTime: queue.progress.currentTime,
                        duration: queue.progress.duration,
                        currentTimeFormatted: formatTime(queue.progress.currentTime),
                        durationFormatted: formatTime(queue.progress.duration),
                        percentage: queue.progress.duration > 0 ? Math.round((queue.progress.currentTime / queue.progress.duration) * 100) : 0
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Reconnect Voice Channel (Fix Audio Issues)
    app.post('/api/music/reconnect/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const guild = global.client?.guilds.cache.get(guildId);
            
            if (!guild) {
                return res.status(400).json({
                    success: false,
                    error: 'Server nicht gefunden - Bot offline?'
                });
            }
            
            console.log(`🔄 Voice-Reconnect für Server: ${guild.name}`);
            
            // 1. Aktuelle Connection beenden
            const oldConnection = voiceConnections.get(guildId);
            if (oldConnection) {
                console.log('🚪 Beende alte Voice-Connection...');
                oldConnection.destroy();
                voiceConnections.delete(guildId);
            }
            
            // 2. Audio-Player stoppen
            const player = audioPlayers.get(guildId);
            if (player) {
                console.log('⏹️ Stoppe Audio-Player...');
                player.stop();
            }
            
            // 3. Kurz warten für saubere Trennung
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 4. Auto-Join versuchen
            console.log('🎵 Versuche Voice-Reconnect...');
            const joinSuccess = await autoJoinForQueue(guildId);
            
            if (joinSuccess) {
                // 5. Aktuellen Song neu starten falls vorhanden
                const queue = getQueue(guildId);
                if (queue.currentSong) {
                    console.log('🎵 Starte aktuellen Song nach Reconnect neu...');
                    setTimeout(async () => {
                        await playMusic(guildId, queue.currentSong);
                        await updateInteractivePanel(guildId);
                    }, 1000);
                }
                
                res.json({
                    success: true,
                    message: 'Voice-Reconnect erfolgreich! Audio sollte jetzt funktionieren.'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Voice-Reconnect fehlgeschlagen. Stelle sicher, dass du in einem Voice-Channel bist!'
                });
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Voice-Reconnect:', error);
            res.status(500).json({
                success: false,
                error: `Voice-Reconnect fehlgeschlagen: ${error.message}`
            });
        }
    });

    // Create DJ Role
    app.post('/api/music/create-dj-role/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const guild = global.client?.guilds.cache.get(guildId);
            
            if (!guild) {
                return res.status(400).json({
                    success: false,
                    error: 'Server nicht gefunden - Bot offline?'
                });
            }
            
            // Prüfe ob Rolle bereits existiert
            const existingRole = guild.roles.cache.find(role => role.name === 'DJ 🎵');
            if (existingRole) {
                return res.status(400).json({
                    success: false,
                    error: 'DJ-Rolle existiert bereits!',
                    roleId: existingRole.id
                });
            }
            
            console.log(`🎭 Erstelle DJ-Rolle für Server: ${guild.name}`);
            
            // Erstelle DJ-Rolle mit passenden Permissions
            const djRole = await guild.roles.create({
                name: 'DJ 🎵',
                color: '#9333EA', // Purple - passend zum Theme
                permissions: [
                    'Connect',           // Voice-Channel beitreten
                    'Speak',            // Im Voice sprechen
                    'UseVAD',           // Voice-Activity verwenden
                    'PrioritySpeaker',  // Prioritätssprecher
                    'MoveMembers',      // Mitglieder zwischen Voice-Channels verschieben
                    'ManageMessages',   // Nachrichten verwalten für Bot-Commands
                    'AddReactions',     // Reaktionen hinzufügen
                    'UseExternalEmojis', // Externe Emojis verwenden
                    'ReadMessageHistory' // Nachrichtenverlauf lesen
                ],
                reason: 'Automatisch erstellte DJ-Rolle für Musik-Bot',
                mentionable: true,
                hoist: true // Rolle wird separat in der Mitgliederliste angezeigt
            });
            
            console.log(`✅ DJ-Rolle erstellt: ${djRole.name} (${djRole.id})`);
            
            res.json({
                success: true,
                message: `DJ-Rolle "${djRole.name}" erfolgreich erstellt!`,
                role: {
                    id: djRole.id,
                    name: djRole.name,
                    color: djRole.hexColor,
                    permissions: djRole.permissions.toArray(),
                    memberCount: djRole.members.size
                }
            });
            
        } catch (error) {
            console.error('❌ Fehler beim Erstellen der DJ-Rolle:', error);
            res.status(500).json({
                success: false,
                error: `Fehler beim Erstellen der DJ-Rolle: ${error.message}`
            });
        }
    });

    // 🔍 DEBUG: Video-Info Test Route
    app.post('/api/music/debug-video-info', async (req, res) => {
        try {
            const { url } = req.body;
            
            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'URL ist erforderlich'
                });
            }
            
            console.log(`🔍 DEBUG: Teste Video-Info für URL: ${url}`);
            
            // Test Video-ID Extraction
            const videoId = extractVideoId(url);
            console.log(`🔍 DEBUG: Video-ID Result: ${videoId}`);
            
            if (!videoId) {
                return res.json({
                    success: false,
                    debug: {
                        step: 'video_id_extraction',
                        result: null,
                        error: 'Video-ID konnte nicht extrahiert werden',
                        url: url
                    }
                });
            }
            
            // Test getVideoInfo
            const videoInfo = await getVideoInfo(url);
            console.log(`🔍 DEBUG: Video-Info Result:`, videoInfo ? 'SUCCESS' : 'NULL');
            
            if (!videoInfo) {
                return res.json({
                    success: false,
                    debug: {
                        step: 'video_info_retrieval',
                        result: null,
                        error: 'Video-Info konnte nicht abgerufen werden',
                        videoId: videoId,
                        url: url
                    }
                });
            }
            
            res.json({
                success: true,
                debug: {
                    step: 'complete',
                    videoId: videoId,
                    videoInfo: {
                        title: videoInfo.title,
                        duration: videoInfo.duration,
                        author: videoInfo.author,
                        hasStreamUrl: !!videoInfo.streamUrl,
                        isYoutubei: !!videoInfo.isYoutubei,
                        mimeType: videoInfo.mimeType,
                        audioQuality: videoInfo.audioQuality
                    }
                }
            });
            
        } catch (error) {
            console.error('🔍 DEBUG: Fehler beim Video-Info Test:', error);
            res.json({
                success: false,
                debug: {
                    step: 'error',
                    error: error.message,
                    stack: error.stack?.split('\n').slice(0, 5)
                }
            });
        }
    });

    // Test popular song (für Debugging)
    app.post('/api/music/test-popular-song/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            // Teste mit einem populären, bekannt funktionierenden Song
            const testSongs = [
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll (immer verfügbar)
                'https://www.youtube.com/watch?v=L_jWHffIx5E', // Smash Mouth - All Star
                'https://www.youtube.com/watch?v=9bZkp7q19f0'  // PSY - Gangnam Style
            ];
            
            for (const testUrl of testSongs) {
                console.log(`🧪 Teste Song: ${testUrl}`);
                
                const videoInfo = await getVideoInfo(testUrl);
                if (videoInfo) {
                    videoInfo.requestedBy = 'Test-System';
                    
                    const added = addToQueue(guildId, videoInfo);
                    if (added) {
                        console.log(`✅ Test-Song erfolgreich hinzugefügt: ${videoInfo.title}`);
                        
                        // Starte Wiedergabe wenn Bot im Voice-Channel ist
                        const queue = getQueue(guildId);
                        const connection = voiceConnections.get(guildId);
                        
                        if (!queue.currentSong && connection) {
                            await playNext(guildId);
                        }
                        
                        return res.json({
                            success: true,
                            message: `Test-Song hinzugefügt: ${videoInfo.title}`,
                            song: videoInfo
                        });
                    }
                }
            }
            
            res.status(400).json({
                success: false,
                error: 'Alle Test-Songs fehlgeschlagen'
            });
            
        } catch (error) {
            console.error('❌ Test-Song Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Interactive Panel Management
    app.post('/api/music/interactive-panel/:guildId/post', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            console.log(`🎵 Interactive Panel Post Request für Guild: ${guildId}`);
            console.log(`📍 Konfigurierter Channel: ${musicSettings.songRequests.interactivePanel.channelId}`);
            
            if (!musicSettings.songRequests.interactivePanel.channelId) {
                console.log('❌ Kein Channel konfiguriert');
                return res.status(400).json({
                    success: false,
                    error: 'Kein Channel für Interactive Panel konfiguriert. Bitte wähle einen Channel im Dashboard aus.'
                });
            }
            
            // Check if guild exists
            const guild = global.client?.guilds.cache.get(guildId);
            if (!guild) {
                console.log('❌ Guild nicht gefunden');
                return res.status(400).json({
                    success: false,
                    error: 'Discord-Server nicht gefunden'
                });
            }
            
            // Check if channel exists
            const channel = guild.channels.cache.get(musicSettings.songRequests.interactivePanel.channelId);
            if (!channel) {
                console.log('❌ Channel nicht gefunden');
                return res.status(400).json({
                    success: false,
                    error: 'Der ausgewählte Channel wurde nicht gefunden. Bitte wähle einen anderen Channel.'
                });
            }
            
            const success = await postInteractivePanel(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: `Interactive Panel erfolgreich in #${channel.name} gepostet!`,
                    channelId: musicSettings.songRequests.interactivePanel.channelId,
                    messageId: musicSettings.songRequests.interactivePanel.messageId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Posten des Interactive Panels. Überprüfe die Bot-Berechtigungen im Channel.'
                });
            }
        } catch (error) {
            console.error('❌ Fehler beim Interactive Panel Post:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post('/api/music/interactive-panel/:guildId/update', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            await updateInteractivePanel(guildId);
            
            res.json({
                success: true,
                message: 'Interactive Panel aktualisiert'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Debug endpoint for Interactive Panel settings
    app.get('/api/music/interactive-panel/debug', (req, res) => {
        res.json({
            success: true,
            settings: {
                songRequests: musicSettings.songRequests,
                interactivePanel: musicSettings.songRequests?.interactivePanel || null
            },
            timestamp: new Date().toISOString()
        });
    });

    // Join/Leave voice channel
    app.post('/api/music/voice/:guildId/:action', async (req, res) => {
        try {
            const { guildId, action } = req.params;
            const { channelId } = req.body;
            
            if (action === 'join' && channelId) {
                const guild = global.client?.guilds.cache.get(guildId);
                const channel = guild?.channels.cache.get(channelId);
                
                if (channel && channel.isVoiceBased()) {
                    const connection = await joinVoiceChannelSafe(channel);
                    if (connection) {
                        res.json({
                            success: true,
                            message: `Voice-Channel "${channel.name}" beigetreten`
                        });
                    } else {
                        res.status(500).json({
                            success: false,
                            error: 'Fehler beim Beitreten'
                        });
                    }
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Channel nicht gefunden'
                    });
                }
            } else if (action === 'leave') {
                leaveVoiceChannel(guildId);
                res.json({
                    success: true,
                    message: 'Voice-Channel verlassen'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Radio API Endpoints
    
    // Get all radio stations
    app.get('/api/music/radio/stations', (req, res) => {
        try {
            const stations = getRadioStations();
            res.json({
                success: true,
                stations: stations,
                enabled: musicSettings.radio?.enabled || false
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get current radio status
    app.get('/api/music/radio/:guildId/status', (req, res) => {
        try {
            const { guildId } = req.params;
            const currentStation = getCurrentRadioStation(guildId);
            const isPlaying = isPlayingRadio(guildId);
            
            res.json({
                success: true,
                isPlaying: isPlaying,
                currentStation: currentStation,
                queue: getQueue(guildId)
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Start radio station
    app.post('/api/music/radio/:guildId/play', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { stationId } = req.body;

            console.log(`📻 Radio API Request - Guild: ${guildId}, Station: ${stationId}`);

            if (!stationId) {
                console.log('❌ Keine Station-ID bereitgestellt');
                return res.status(400).json({
                    success: false,
                    error: 'Station-ID erforderlich'
                });
            }

            const station = getRadioStation(stationId);
            if (!station) {
                console.log(`❌ Radio-Sender "${stationId}" nicht gefunden`);
                return res.status(400).json({
                    success: false,
                    error: `Radio-Sender "${stationId}" nicht gefunden`
                });
            }

            console.log(`✅ Radio-Sender gefunden: ${station.name}`);

            // Prüfe ob global.client verfügbar ist
            if (!global.client) {
                console.log('❌ Discord Client nicht verfügbar');
                return res.status(500).json({
                    success: false,
                    error: 'Discord Bot nicht bereit'
                });
            }

            // Auto-Join: Prüfe ob Bot im Voice-Channel ist, wenn nicht, trete automatisch bei
            let connection = voiceConnections.get(guildId);
            console.log(`🔍 Voice Connection Status: ${connection ? 'Verbunden' : 'Nicht verbunden'}`);
            
            if (!connection) {
                console.log('📻 Bot nicht im Voice-Channel - versuche Auto-Join für Radio');
                const autoJoinSuccess = await autoJoinForQueue(guildId);
                console.log(`🤖 Auto-Join Ergebnis: ${autoJoinSuccess}`);
                
                if (!autoJoinSuccess) {
                    console.log('❌ Auto-Join fehlgeschlagen');
                    return res.status(400).json({
                        success: false,
                        error: 'Bot konnte keinem Voice-Channel beitreten. Stelle sicher, dass du in einem Voice-Channel bist.'
                    });
                }
                
                // Prüfe erneut nach Auto-Join
                connection = voiceConnections.get(guildId);
                console.log(`🔍 Voice Connection nach Auto-Join: ${connection ? 'Verbunden' : 'Nicht verbunden'}`);
                
                if (!connection) {
                    console.log('❌ Keine Voice-Verbindung nach Auto-Join');
                    return res.status(400).json({
                        success: false,
                        error: 'Auto-Join fehlgeschlagen. Bitte manuell einem Voice-Channel beitreten.'
                    });
                }
            }

            console.log('🎵 Starte Radio-Wiedergabe...');
            const success = await playRadioStation(guildId, stationId);
            console.log(`📻 Radio-Wiedergabe Ergebnis: ${success}`);
            
            if (success) {
                res.json({
                    success: true,
                    message: `📻 Radio-Sender "${station.name}" gestartet`,
                    station: station
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Starten des Radio-Senders'
                });
            }

        } catch (error) {
            console.error('❌ Radio Start Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Stop radio
    app.post('/api/music/radio/:guildId/stop', (req, res) => {
        try {
            const { guildId } = req.params;
            
            const success = stopRadio(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: '📻 Radio gestoppt'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Stoppen des Radios'
                });
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Add custom radio station
    app.post('/api/music/radio/stations', (req, res) => {
        try {
            const { name, url, genre, country, description, logo } = req.body;

            if (!name || !url) {
                return res.status(400).json({
                    success: false,
                    error: 'Name und URL sind erforderlich'
                });
            }

            const newStation = {
                id: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                name: name,
                url: url,
                genre: genre || 'Unbekannt',
                country: country || 'Unbekannt',
                description: description || name,
                logo: logo || 'https://via.placeholder.com/150x150?text=Radio'
            };

            // Prüfe ob Station bereits existiert
            const existingStations = getRadioStations();
            if (existingStations.find(s => s.id === newStation.id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Radio-Sender mit diesem Namen existiert bereits'
                });
            }

            // Füge Station hinzu
            musicSettings.radio.stations.push(newStation);
            saveMusicSettings();

            res.json({
                success: true,
                message: `Radio-Sender "${name}" hinzugefügt`,
                station: newStation
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Remove custom radio station
    app.delete('/api/music/radio/stations/:stationId', (req, res) => {
        try {
            const { stationId } = req.params;
            
            const stationIndex = musicSettings.radio.stations.findIndex(s => s.id === stationId);
            if (stationIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Radio-Sender nicht gefunden'
                });
            }

            const removedStation = musicSettings.radio.stations.splice(stationIndex, 1)[0];
            saveMusicSettings();

            res.json({
                success: true,
                message: `Radio-Sender "${removedStation.name}" entfernt`,
                station: removedStation
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}

module.exports = {
    loadMusicSettings,
    saveMusicSettings,
    registerMusicAPI,
    searchYouTube,
    getVideoInfo,
    joinVoiceChannelSafe,
    leaveVoiceChannel,
    playMusic,
    playNext,
    addToQueue,
    removeFromQueue,
    clearQueue,
    shuffleQueue,
    getQueue,
    checkAutoJoinChannels,
    autoJoinForQueue,
    autoLeaveWhenEmpty,
    musicSettings,
    handleSongRequest,
    postInteractivePanel,
    updateInteractivePanel,
    handleSongRequestButton,
    handleSongRequestModal,
    // Radio Functions
    getRadioStations,
    getRadioStation,
    playRadioStation,
    stopRadio,
    getCurrentRadioStation,
    isPlayingRadio
}; 