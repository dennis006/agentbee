import { useState } from 'react'
import { Search, Smile, Heart, Zap, Star, Flame, Sparkles, Gamepad2, User, Leaf, Utensils, MapPin, Package, Flag } from 'lucide-react'
import { Input } from './input'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClose?: () => void
}

const EMOJI_CATEGORIES = {
  frequent: {
    name: 'Häufig verwendet',
    icon: Zap,
    emojis: ['🎮', '🎯', '⚔️', '🧱', '🪂', '💥', '🚀', '🔥', '💜', '⚡', '🎉', '✅']
  },
  gaming: {
    name: 'Gaming',
    icon: Gamepad2,
    emojis: [
      // Gaming Allgemein
      '🎮', '🕹️', '🎯', '🏆', '🥇', '🏅', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵', '🎶', '📻',
      // Waffen & Action
      '⚔️', '🗡️', '🏹', '🔫', '💣', '💥', '🔥', '⚡', '💫', '✨', '🌟', '⭐', '💎', '🔮',
      // Fahrzeuge & Transport
      '🚀', '✈️', '🚁', '🏎️', '🚗', '🏍️', '🚲', '⛵', '🚢', '🛸', '🚂', '🚇', '🚌', '🚙',
      // Tiere & Kreaturen
      '🐉', '🦄', '🐺', '🦅', '🐍', '🕷️', '🦂', '🐙', '🦖', '🦕', '👾', '🤖', '👻', '💀',
      // Sport & Aktivitäten
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳', '🎣', '🎿',
      // Symbole & Icons
      '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔲', '🔳', '◼️', '◻️', '▪️', '▫️',
      // Zahlen & Marker
      '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '💯', '#️⃣', '*️⃣', '0️⃣',
      // Spezielle Gaming Emojis
      '🎪', '🎡', '🎢', '🎠', '🎨', '🖼️', '🖌️', '✏️', '📝', '📊', '📈', '📉', '💹', '💰',
      // Essen & Items (oft in Games)
      '🍎', '🍕', '🍔', '🍟', '🍗', '🧙‍♂️', '🧙‍♀️', '👑', '💍', '📿', '🔑', '🗝️', '🔒', '🔓',
      // Wetter & Umgebung  
      '☀️', '🌙', '⭐', '🌟', '💫', '✨', '🌈', '⛅', '🌩️', '❄️', '🔥', '💧', '🌊', '🌋'
    ]
  },
  smileys: {
    name: 'Smileys & Gesichter',
    icon: Smile,
    emojis: [
      // Glücklich & Positiv
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😋', '😛', '😝', '😜', '🤪', '🤗', '🤭', '🫠', '🫢', '🫣', '🤫', '🤔', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', 
      
      // Liebe & Zuneigung
      '😍', '🥰', '😘', '😗', '😙', '😚', '💋', '🥴', '😵‍💫',
      
      // Traurig & Negativ
      '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😰', '😨', '😱', '😥', '😓',
      
      // Neutral & Überrascht
      '😐', '😑', '😶', '🫥', '😶‍🌫️', '🤐', '🫡', '🙄', '😬', '😮‍💨', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠',
      
      // Fantasy & Spezial
      '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
      
      // Zusätzliche neue Emojis (falls unterstützt)
      '🫨', '🫷', '🫸', '🫰', '🫱', '🫲', '🫳', '🫴', '🫵', '🫶', '🫦', '🫧', '🫶🏻', '🫶🏼', '🫶🏽', '🫶🏾', '🫶🏿'
    ]
  },
  people: {
    name: 'Menschen & Körper',
    icon: User,
    emojis: [
      // Handbewegungen - Alle Hauttöne
      '👋', '👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿', // Winken
      '🤚', '🤚🏻', '🤚🏼', '🤚🏽', '🤚🏾', '🤚🏿', // Erhobene Hand
      '🖐️', '🖐🏻', '🖐🏼', '🖐🏽', '🖐🏾', '🖐🏿', // Hand mit gespreizten Fingern
      '✋', '✋🏻', '✋🏼', '✋🏽', '✋🏾', '✋🏿', // Erhobene Hand
      '🖖', '🖖🏻', '🖖🏼', '🖖🏽', '🖖🏾', '🖖🏿', // Vulkanier-Gruß
      '👌', '👌🏻', '👌🏼', '👌🏽', '👌🏾', '👌🏿', // OK-Zeichen
      '🤌', '🤌🏻', '🤌🏼', '🤌🏽', '🤌🏾', '🤌🏿', // Eingeklemmte Finger
      '🤏', '🤏🏻', '🤏🏼', '🤏🏽', '🤏🏾', '🤏🏿', // Kleine Menge
      '✌️', '✌🏻', '✌🏼', '✌🏽', '✌🏾', '✌🏿', // Victory
      '🤞', '🤞🏻', '🤞🏼', '🤞🏽', '🤞🏾', '🤞🏿', // Gekreuzte Finger
      '🤟', '🤟🏻', '🤟🏼', '🤟🏽', '🤟🏾', '🤟🏿', // Ich liebe dich
      '🤘', '🤘🏻', '🤘🏼', '🤘🏽', '🤘🏾', '🤘🏿', // Rock on
      '🤙', '🤙🏻', '🤙🏼', '🤙🏽', '🤙🏾', '🤙🏿', // Ruf mich an
      '👈', '👈🏻', '👈🏼', '👈🏽', '👈🏾', '👈🏿', // Zeigt nach links
      '👉', '👉🏻', '👉🏼', '👉🏽', '👉🏾', '👉🏿', // Zeigt nach rechts
      '👆', '👆🏻', '👆🏼', '👆🏽', '👆🏾', '👆🏿', // Zeigt nach oben
      '👇', '👇🏻', '👇🏼', '👇🏽', '👇🏾', '👇🏿', // Zeigt nach unten
      '☝️', '☝🏻', '☝🏼', '☝🏽', '☝🏾', '☝🏿', // Zeigefinger
      '👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿', // Daumen hoch
      '👎', '👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿', // Daumen runter
      '👊', '👊🏻', '👊🏼', '👊🏽', '👊🏾', '👊🏿', // Faust
      '✊', '✊🏻', '✊🏼', '✊🏽', '✊🏾', '✊🏿', // Erhobene Faust
      '🤛', '🤛🏻', '🤛🏼', '🤛🏽', '🤛🏾', '🤛🏿', // Faust links
      '🤜', '🤜🏻', '🤜🏼', '🤜🏽', '🤜🏾', '🤜🏿', // Faust rechts
      '👏', '👏🏻', '👏🏼', '👏🏽', '👏🏾', '👏🏿', // Klatschen
      '🙌', '🙌🏻', '🙌🏼', '🙌🏽', '🙌🏾', '🙌🏿', // Beide Hände hoch
      '👐', '👐🏻', '👐🏼', '👐🏽', '👐🏾', '👐🏿', // Offene Hände
      '🤲', '🤲🏻', '🤲🏼', '🤲🏽', '🤲🏾', '🤲🏿', // Handflächen zusammen
      '🤝', '🤝🏻', '🤝🏼', '🤝🏽', '🤝🏾', '🤝🏿', // Händeschütteln
      '🙏', '🙏🏻', '🙏🏼', '🙏🏽', '🙏🏾', '🙏🏿', // Beten/Danke
      '🫶', '🫶🏻', '🫶🏼', '🫶🏽', '🫶🏾', '🫶🏿', // Herz mit Händen

      // Körperteile - Hauttöne
      '✍️', '✍🏻', '✍🏼', '✍🏽', '✍🏾', '✍🏿', // Schreiben
      '💅', '💅🏻', '💅🏼', '💅🏽', '💅🏾', '💅🏿', // Nagellack
      '🤳', '🤳🏻', '🤳🏼', '🤳🏽', '🤳🏾', '🤳🏿', // Selfie
      '💪', '💪🏻', '💪🏼', '💪🏽', '💪🏾', '💪🏿', // Bizeps
      '🦵', '🦵🏻', '🦵🏼', '🦵🏽', '🦵🏾', '🦵🏿', // Bein
      '🦶', '🦶🏻', '🦶🏼', '🦶🏽', '🦶🏾', '🦶🏿', // Fuß
      '👂', '👂🏻', '👂🏼', '👂🏽', '👂🏾', '👂🏿', // Ohr
      '👃', '👃🏻', '👃🏼', '👃🏽', '👃🏾', '👃🏿', // Nase
      
      // Menschen - Alle Hauttöne
      '👶', '👶🏻', '👶🏼', '👶🏽', '👶🏾', '👶🏿', // Baby
      '🧒', '🧒🏻', '🧒🏼', '🧒🏽', '🧒🏾', '🧒🏿', // Kind
      '👦', '👦🏻', '👦🏼', '👦🏽', '👦🏾', '👦🏿', // Junge
      '👧', '👧🏻', '👧🏼', '👧🏽', '👧🏾', '👧🏿', // Mädchen
      '🧑', '🧑🏻', '🧑🏼', '🧑🏽', '🧑🏾', '🧑🏿', // Person
      '👱', '👱🏻', '👱🏼', '👱🏽', '👱🏾', '👱🏿', // Blonde Person
      '👨', '👨🏻', '👨🏼', '👨🏽', '👨🏾', '👨🏿', // Mann
      '🧔', '🧔🏻', '🧔🏼', '🧔🏽', '🧔🏾', '🧔🏿', // Mann mit Bart
      '👩', '👩🏻', '👩🏼', '👩🏽', '👩🏾', '👩🏿', // Frau
      '🧓', '🧓🏻', '🧓🏼', '🧓🏽', '🧓🏾', '🧓🏿', // Ältere Person
      '👴', '👴🏻', '👴🏼', '👴🏽', '👴🏾', '👴🏿', // Alter Mann
      '👵', '👵🏻', '👵🏼', '👵🏽', '👵🏾', '👵🏿', // Alte Frau

      // Gesten & Aktivitäten
      '🙍', '🙍🏻', '🙍🏼', '🙍🏽', '🙍🏾', '🙍🏿', // Stirnrunzeln
      '🙎', '🙎🏻', '🙎🏼', '🙎🏽', '🙎🏾', '🙎🏿', // Schmollen
      '🙅', '🙅🏻', '🙅🏼', '🙅🏽', '🙅🏾', '🙅🏿', // Nein sagen
      '🙆', '🙆🏻', '🙆🏼', '🙆🏽', '🙆🏾', '🙆🏿', // OK sagen
      '💁', '💁🏻', '💁🏼', '💁🏽', '💁🏾', '💁🏿', // Informieren
      '🙋', '🙋🏻', '🙋🏼', '🙋🏽', '🙋🏾', '🙋🏿', // Hand heben
      '🧏', '🧏🏻', '🧏🏼', '🧏🏽', '🧏🏾', '🧏🏿', // Taub
      '🙇', '🙇🏻', '🙇🏼', '🙇🏽', '🙇🏾', '🙇🏿', // Verbeugung
      '🤦', '🤦🏻', '🤦🏼', '🤦🏽', '🤦🏾', '🤦🏿', // Facepalm
      '🤷', '🤷🏻', '🤷🏼', '🤷🏽', '🤷🏾', '🤷🏿', // Schulterzucken

      // Berufe
      '👮', '👮🏻', '👮🏼', '👮🏽', '👮🏾', '👮🏿', // Polizist
      '🕵️', '🕵🏻', '🕵🏼', '🕵🏽', '🕵🏾', '🕵🏿', // Detektiv
      '💂', '💂🏻', '💂🏼', '💂🏽', '💂🏾', '💂🏿', // Wache
      '🥷', '🥷🏻', '🥷🏼', '🥷🏽', '🥷🏾', '🥷🏿', // Ninja
      '👷', '👷🏻', '👷🏼', '👷🏽', '👷🏾', '👷🏿', // Bauarbeiter
      '🤴', '🤴🏻', '🤴🏼', '🤴🏽', '🤴🏾', '🤴🏿', // Prinz
      '👸', '👸🏻', '👸🏼', '👸🏽', '👸🏾', '👸🏿', // Prinzessin
      '👳', '👳🏻', '👳🏼', '👳🏽', '👳🏾', '👳🏿', // Turban
      '👲', '👲🏻', '👲🏼', '👲🏽', '👲🏾', '👲🏿', // Mann mit Kappe
      '🧕', '🧕🏻', '🧕🏼', '🧕🏽', '🧕🏾', '🧕🏿', // Kopftuch
      '🤵', '🤵🏻', '🤵🏼', '🤵🏽', '🤵🏾', '🤵🏿', // Mann im Smoking
      '👰', '👰🏻', '👰🏼', '👰🏽', '👰🏾', '👰🏿', // Braut
      '🤰', '🤰🏻', '🤰🏼', '🤰🏽', '🤰🏾', '🤰🏿', // Schwangere
      '🤱', '🤱🏻', '🤱🏼', '🤱🏽', '🤱🏾', '🤱🏿', // Stillen
      '👼', '👼🏻', '👼🏼', '👼🏽', '👼🏾', '👼🏿', // Engel

      // Sport & Aktivitäten
      '🚶', '🚶🏻', '🚶🏼', '🚶🏽', '🚶🏾', '🚶🏿', // Gehen
      '🧍', '🧍🏻', '🧍🏼', '🧍🏽', '🧍🏾', '🧍🏿', // Stehen
      '🧎', '🧎🏻', '🧎🏼', '🧎🏽', '🧎🏾', '🧎🏿', // Knien
      '🏃', '🏃🏻', '🏃🏼', '🏃🏽', '🏃🏾', '🏃🏿', // Laufen
      '💃', '💃🏻', '💃🏼', '💃🏽', '💃🏾', '💃🏿', // Tanzen (Frau)
      '🕺', '🕺🏻', '🕺🏼', '🕺🏽', '🕺🏾', '🕺🏿', // Tanzen (Mann)
      '🧘', '🧘🏻', '🧘🏼', '🧘🏽', '🧘🏾', '🧘🏿', // Meditation
      '🛀', '🛀🏻', '🛀🏼', '🛀🏽', '🛀🏾', '🛀🏿', // Baden
      '🛌', '🛌🏻', '🛌🏼', '🛌🏽', '🛌🏾', '🛌🏿', // Schlafen

      // Andere Körperteile (ohne Hauttöne)
      '🦾', '🦿', '🦻', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '��', '💋'
    ]
  },
  animals: {
    name: 'Tiere & Natur',
    icon: Leaf,
    emojis: [
      // Tiere
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪱', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔',
      // Natur
      '🌱', '🌿', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌊', '💧', '💦'
    ]
  },
  food: {
    name: 'Essen & Trinken',
    icon: Utensils,
    emojis: [
      // Früchte
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯',
      // Getränke
      '🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾'
    ]
  },
  hearts: {
    name: 'Herzen & Liebe',
    icon: Heart,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💋', '💌', '💐', '🌹', '😍', '🥰', '😘', '💑', '💏', '👨‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👩', '💒', '👰', '🤵', '💍']
  },
  activities: {
    name: 'Aktivitäten & Sport',
    icon: Zap,
    emojis: [
      // Sport
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🚣', '🧗', '🚵', '🚴', '🏃', '🚶',
      // Musik & Kunst
      '🎼', '🎵', '🎶', '🎙️', '🎚️', '🎛️', '🎤', '🎧', '📻', '🎷', '🪗', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '🪘', '🎬', '🎭', '🎨', '🎰', '🎲', '🎯', '🎳', '🎮', '🕹️',
      // Events & Feiern
      '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🥳', '🎃', '🎄', '🎆', '🎇', '🧨', '✨', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉'
    ]
  },
  travel: {
    name: 'Reisen & Orte',
    icon: MapPin,
    emojis: [
      // Transport
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚉', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚟', '🚠', '🚡', '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🛑', '🚏',
      // Orte & Gebäude
      '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖', '🏘️', '🏙️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🏰', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋'
    ]
  },
  objects: {
    name: 'Objekte & Werkzeuge',
    icon: Package,
    emojis: [
      // Technologie
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'
    ]
  },
  symbols: {
    name: 'Symbole & Zeichen',
    icon: Star,
    emojis: [
      // Grundsymbole
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '👁️‍🗨️', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', '➿', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫'
    ]
  },
  numbers: {
    name: 'Zahlen',
    icon: Sparkles,
    emojis: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '💯', '#️⃣', '*️⃣', '0️⃣']
  },
  flags: {
    name: 'Flaggen & Länder',
    icon: Flag,
    emojis: [
      // Universelle Flaggen (funktionieren überall)
      '🏁', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴', '🏴‍☠️', '🚩', '🎌', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      
      // Alternative Land-Symbole und echte Flaggen
      '🗾', '🗽', '🎌', '⛩️', '🕌', '🗿', '🏛️', '🏰', '🏯', '🗼', '🎪', '🏟️', '🏞️', '🗻', '🌋', '🏝️', '🏜️', '🏔️',
      
      // Europa (mit Fallback zu Ländercodes)
      '🇩🇪', '🇦🇹', '🇨🇭', '🇳🇱', '🇧🇪', '🇫🇷', '🇪🇸', '🇮🇹', '🇬🇧', '🇮🇪', '🇵🇹', '🇬🇷', '🇵🇱', '🇨🇿', '🇸🇰', '🇭🇺', '🇷🇴', '🇧🇬', '🇭🇷', '🇸🇮', '🇷🇸', '🇧🇦', '🇲🇪', '🇲🇰', '🇦🇱', '🇺🇦', '🇧🇾', '🇷🇺', '🇱🇹', '🇱🇻', '🇪🇪', '🇫🇮', '🇸🇪', '🇳🇴', '🇩🇰', '🇮🇸', '🇱🇺', '🇲🇹', '🇨🇾', '🇲🇩', '🇲🇨', '🇸🇲', '🇻🇦', '🇦🇩', '🇱🇮', '🇪🇺',
      
      // Nordamerika
      '🇺🇸', '🇨🇦', '🇲🇽', '🇬🇹', '🇧🇿', '🇸🇻', '🇭🇳', '🇳🇮', '🇨🇷', '🇵🇦', '🇨🇺', '🇯🇲', '🇭🇹', '🇩🇴', '🇵🇷', '🇧🇸', '🇧🇧', '🇹🇹', '🇬🇩', '🇱🇨', '🇻🇨', '🇦🇬', '🇩🇲', '🇰🇳',
      
      // Südamerika
      '🇧🇷', '🇦🇷', '🇨🇱', '🇵🇪', '🇨🇴', '🇻🇪', '🇪🇨', '🇧🇴', '🇺🇾', '🇵🇾', '🇬🇾', '🇸🇷', '🇫🇬',
      
      // Asien
      '🇨🇳', '🇯🇵', '🇰🇷', '🇰🇵', '🇹🇼', '🇭🇰', '🇲🇴', '🇹🇭', '🇻🇳', '🇱🇦', '🇰🇭', '🇲🇾', '🇸🇬', '🇮🇩', '🇵🇭', '🇧🇳', '🇹🇱', '🇮🇳', '🇵🇰', '🇧🇩', '🇱🇰', '🇲🇻', '🇳🇵', '🇧🇹', '🇦🇫', '🇮🇷', '🇮🇶', '🇸🇾', '🇱🇧', '🇯🇴', '🇮🇱', '🇵🇸', '🇸🇦', '🇾🇪', '🇴🇲', '🇦🇪', '🇶🇦', '🇧🇭', '🇰🇼', '🇹🇷', '🇦🇲', '🇦🇿', '🇬🇪', '🇰🇿', '🇰🇬', '🇺🇿', '🇹🇯', '🇹🇲', '🇲🇳',
      
      // Afrika
      '🇪🇬', '🇱🇾', '🇹🇳', '🇩🇿', '🇲🇦', '🇪🇭', '🇸🇳', '🇬🇲', '🇬🇼', '🇬🇳', '🇸🇱', '🇱🇷', '🇨🇮', '🇬🇭', '🇹🇬', '🇧🇯', '🇧🇫', '🇳🇪', '🇲🇱', '🇲🇷', '🇳🇬', '🇨🇲', '🇹🇩', '🇨🇫', '🇸🇸', '🇸🇩', '🇪🇹', '🇪🇷', '🇩🇯', '🇸🇴', '🇰🇪', '🇺🇬', '🇷🇼', '🇧🇮', '🇹🇿', '🇲🇼', '🇿🇲', '🇿🇼', '🇲🇿', '🇲🇬', '🇲🇺', '🇸🇨', '🇰🇲', '🇧🇼', '🇳🇦', '🇿🇦', '🇱🇸', '🇸🇿', '🇦🇴', '🇨🇩', '🇨🇬', '🇬🇶', '🇬🇦', '🇸🇹', '🇨🇻',
      
      // Ozeanien
      '🇦🇺', '🇳🇿', '🇫🇯', '🇵🇬', '🇸🇧', '🇻🇺', '🇳🇨', '🇵🇫', '🇼🇸', '🇹🇴', '🇨🇰', '🇳🇺', '🇰🇮', '🇹🇻', '🇳🇷', '🇵🇼', '🇫🇲', '🇲🇭', '🇬🇺', '🇲🇵', '🇦🇸', '🇺🇲', '🇻🇮',
      
      // UN & Internationale Organisationen
      '🇺🇳'
    ]
  },
  discord: {
    name: 'Discord',
    icon: Flame,
    emojis: ['🟢', '🔴', '🟡', '🔵', '🟠', '🟣', '⚪', '⚫', '🔘', '🔲', '🔳', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '⬛', '⬜', '🟫', '🟪', '🟦', '🟩', '🟨', '🟧', '🟥']
  }
}

const EmojiPicker = ({ onEmojiSelect, onClose }: EmojiPickerProps) => {
  const [activeCategory, setActiveCategory] = useState('gaming')
  const [searchTerm, setSearchTerm] = useState('')

  // Erweiterte Emoji-Namen-Mapping für bessere Suche
  const emojiNames: Record<string, string[]> = {
    // Gaming
    '🎮': ['game', 'gaming', 'controller', 'spiel', 'spielen', 'console', 'konsole'],
    '🎯': ['target', 'aim', 'valorant', 'ziel', 'treffer', 'dartboard', 'darts'],
    '⚔️': ['sword', 'weapon', 'fight', 'schwert', 'waffe', 'kampf', 'battle'],
    '🧱': ['block', 'minecraft', 'build', 'bauen', 'stein', 'brick'],
    '🪂': ['parachute', 'fortnite', 'fallschirm', 'drop', 'landen'],
    '💥': ['explosion', 'boom', 'cs', 'counter', 'strike', 'bang'],
    '🚀': ['rocket', 'space', 'apex', 'legends', 'rakete', 'weltraum'],
    '🏎️': ['car', 'racing', 'formula', 'auto', 'rennen', 'fast'],
    '⚽': ['football', 'soccer', 'ball', 'fussball', 'fifa'],
    '🏀': ['basketball', 'sport', 'nba'],
    '🐉': ['dragon', 'fantasy', 'drache', 'wow', 'skyrim'],
    '👾': ['alien', 'retro', 'classic', 'arcade', 'space'],
    '🤖': ['robot', 'ai', 'roboter', 'tech', 'bot'],
    '🔫': ['gun', 'shooter', 'fps', 'pistole', 'weapon'],
    '💎': ['diamond', 'gem', 'valuable', 'diamant', 'edelstein'],
    '👑': ['crown', 'king', 'royal', 'krone', 'könig'],
    '🏆': ['trophy', 'win', 'victory', 'pokal', 'sieg'],
    '🎪': ['circus', 'fun', 'zirkus', 'spass'],
    '🔥': ['fire', 'hot', 'flame', 'feuer', 'heiss', 'lit'],
    '⚡': ['lightning', 'fast', 'power', 'blitz', 'energie', 'thunder', 'donner'],
    '🌟': ['star', 'shiny', 'stern', 'glänzend'],
    '💀': ['skull', 'death', 'totenkopf', 'tod'],
    '🕷️': ['spider', 'spinne', 'web'],
    '🦄': ['unicorn', 'magic', 'einhorn', 'magie'],
    '🛸': ['ufo', 'alien', 'space', 'weltraum'],
    '🔮': ['crystal', 'magic', 'kristall', 'zauber'],

    // Gefühle & Reaktionen
    '😂': ['laugh', 'lachen', 'funny', 'lustig', 'lol', 'haha'],
    '😭': ['cry', 'weinen', 'sad', 'traurig', 'tears'],
    '😍': ['love', 'liebe', 'heart', 'herz', 'crush'],
    '🥰': ['love', 'liebe', 'cute', 'süß', 'adorable'],
    '😎': ['cool', 'sunglasses', 'awesome', 'epic'],
    '🤔': ['think', 'denken', 'hmm', 'consider'],
    '😴': ['sleep', 'schlafen', 'tired', 'müde'],
    '🤯': ['mind', 'blown', 'wow', 'amazing', 'explode'],
    '😤': ['angry', 'mad', 'sauer', 'wütend'],
    '🥳': ['party', 'celebrate', 'feiern', 'birthday'],
    '🫠': ['melting', 'schmelzen', 'overwhelmed', 'überwältigt'],
    '🫢': ['gasp', 'shock', 'überrascht', 'hand', 'mouth'],
    '🫣': ['peek', 'shy', 'schüchtern', 'verstecken', 'hide'],
    '🫡': ['salute', 'salutieren', 'respect', 'respekt'],
    '🫥': ['invisible', 'unsichtbar', 'dotted', 'line'],
    '😶‍🌫️': ['fog', 'nebel', 'confused', 'verwirrt'],
    '😮‍💨': ['exhale', 'ausatmen', 'sigh', 'seufzen'],
    '😵‍💫': ['dizzy', 'schwindelig', 'confused', 'verwirrt'],
    '😺': ['cat', 'katze', 'happy', 'glücklich', 'smile'],
    '😸': ['cat', 'katze', 'laugh', 'lachen', 'joy'],
    '😹': ['cat', 'katze', 'tears', 'tränen', 'joy'],
    '😻': ['cat', 'katze', 'love', 'liebe', 'heart'],
    '😼': ['cat', 'katze', 'smirk', 'grinsen'],
    '😽': ['cat', 'katze', 'kiss', 'kuss'],
    '🙀': ['cat', 'katze', 'scared', 'erschrocken', 'shock'],
    '😿': ['cat', 'katze', 'sad', 'traurig', 'cry'],
    '😾': ['cat', 'katze', 'angry', 'sauer', 'mad'],
    '🫶': ['heart', 'herz', 'hands', 'hände', 'love', 'liebe'],
    '🫦': ['biting', 'lip', 'lippe', 'nervous', 'nervös'],

    // Tiere
    '🐶': ['dog', 'hund', 'puppy', 'welpe', 'cute'],
    '🐱': ['cat', 'katze', 'kitten', 'kätzchen'],
    '🦊': ['fox', 'fuchs', 'clever', 'orange'],
    '🐺': ['wolf', 'howl', 'pack', 'wild'],
    '🦁': ['lion', 'löwe', 'king', 'könig', 'mane'],
    '🐯': ['tiger', 'stripes', 'wild', 'orange'],
    '🐼': ['panda', 'china', 'bamboo', 'cute'],
    '🦅': ['eagle', 'adler', 'freedom', 'fly'],
    '🐙': ['octopus', 'tintenfisch', 'tentacles'],
    '🦈': ['shark', 'hai', 'dangerous', 'ocean'],

    // Essen
    '🍕': ['pizza', 'italian', 'cheese', 'käse'],
    '🍔': ['burger', 'hamburger', 'fast', 'food'],
    '🍟': ['fries', 'pommes', 'potato', 'kartoffel'],
    '🍎': ['apple', 'apfel', 'fruit', 'frucht', 'healthy'],
    '🍌': ['banana', 'banane', 'yellow', 'gelb'],
    '🍓': ['strawberry', 'erdbeere', 'berry', 'red'],
    '☕': ['coffee', 'kaffee', 'morning', 'morgen', 'wake'],
    '🍺': ['beer', 'bier', 'party', 'alcohol'],
    '🍷': ['wine', 'wein', 'glass', 'glas', 'red'],
    '🎂': ['cake', 'kuchen', 'birthday', 'geburtstag'],

    // Aktivitäten
    '🎵': ['music', 'musik', 'note', 'song', 'lied'],
    '🎸': ['guitar', 'gitarre', 'rock', 'music'],
    '🎤': ['microphone', 'mikrofon', 'sing', 'singen'],
    '🏃': ['run', 'laufen', 'sport', 'exercise'],
    '🏊': ['swim', 'schwimmen', 'pool', 'water'],
    '🚴': ['bike', 'fahrrad', 'cycling', 'sport'],
    '⛷️': ['ski', 'snow', 'schnee', 'winter'],
    '🏂': ['snowboard', 'snow', 'winter', 'sport'],

    // Objekte
    '📱': ['phone', 'handy', 'mobile', 'call'],
    '💻': ['laptop', 'computer', 'work', 'arbeit'],
    '🖥️': ['desktop', 'computer', 'monitor', 'pc'],
    '⌚': ['watch', 'uhr', 'time', 'zeit'],
    '📷': ['camera', 'kamera', 'photo', 'foto'],
    '🔑': ['key', 'schlüssel', 'unlock', 'open'],
    '💰': ['money', 'geld', 'bag', 'rich'],
    '💳': ['card', 'karte', 'credit', 'pay'],
    '🚗': ['car', 'auto', 'drive', 'fahren'],
    '✈️': ['plane', 'flugzeug', 'travel', 'reisen'],

    // Symbole
    '❤️': ['heart', 'herz', 'love', 'liebe', 'red'],
    '💛': ['heart', 'herz', 'yellow', 'gelb', 'love'],
    '💚': ['heart', 'herz', 'green', 'grün', 'love'],
    '💙': ['heart', 'herz', 'blue', 'blau', 'love'],
    '💜': ['heart', 'herz', 'purple', 'lila', 'love'],
    '✅': ['check', 'correct', 'richtig', 'yes', 'ja'],
    '❌': ['cross', 'wrong', 'falsch', 'no', 'nein'],
    '⭐': ['star', 'stern', 'favorite', 'favorit', 'space', 'weltraum'],
    '💯': ['hundred', 'perfect', 'perfekt', 'score'],
    '🔔': ['bell', 'glocke', 'notification', 'sound'],

    // Wetter & Natur
    '☀️': ['sun', 'sonne', 'sunny', 'warm', 'hot'],
    '🌙': ['moon', 'mond', 'night', 'nacht'],
    '🌈': ['rainbow', 'regenbogen', 'colorful', 'bunt'],
    '❄️': ['snow', 'schnee', 'cold', 'kalt', 'winter'],
    '🌊': ['wave', 'welle', 'ocean', 'meer', 'water'],
    '🌺': ['flower', 'blume', 'tropical', 'beautiful'],
    '🌹': ['rose', 'romantic', 'romantisch', 'love'],

    // Länder & Flaggen
    '🇩🇪': ['deutschland', 'germany', 'flagge', 'flag'],
    '🇦🇹': ['österreich', 'austria', 'flagge', 'flag'],
    '🇨🇭': ['schweiz', 'switzerland', 'flagge', 'flag'],
    '🇺🇸': ['usa', 'america', 'amerika', 'united', 'states'],
    '🇬🇧': ['england', 'britain', 'uk', 'united', 'kingdom'],
    '🇫🇷': ['frankreich', 'france', 'french', 'französisch'],
    '🇪🇸': ['spanien', 'spain', 'spanish', 'spanisch'],
    '🇮🇹': ['italien', 'italy', 'italian', 'italienisch'],
    '🇳🇱': ['niederlande', 'netherlands', 'holland', 'dutch'],
    '🇷🇺': ['russland', 'russia', 'russian', 'russisch'],
    '🇨🇳': ['china', 'chinese', 'chinesisch'],
    '🇯🇵': ['japan', 'japanese', 'japanisch'],
    '🇰🇷': ['korea', 'south', 'korean', 'koreanisch'],
    '🇧🇷': ['brasilien', 'brazil', 'brazilian', 'brasilianisch'],
    '🇨🇦': ['kanada', 'canada', 'canadian', 'kanadisch'],
    '🇦🇺': ['australien', 'australia', 'australian', 'australisch'],
    '🇮🇳': ['indien', 'india', 'indian', 'indisch'],
    '🇲🇽': ['mexiko', 'mexico', 'mexican', 'mexikanisch'],
    '🇵🇱': ['polen', 'poland', 'polish', 'polnisch'],
    '🇹🇷': ['türkei', 'turkey', 'turkish', 'türkisch'],
    '🇸🇪': ['schweden', 'sweden', 'swedish', 'schwedisch'],
    '🇳🇴': ['norwegen', 'norway', 'norwegian', 'norwegisch'],
    '🇩🇰': ['dänemark', 'denmark', 'danish', 'dänisch'],
    '🇫🇮': ['finnland', 'finland', 'finnish', 'finnisch'],
    '🇧🇪': ['belgien', 'belgium', 'belgian', 'belgisch'],
    '🇵🇹': ['portugal', 'portuguese', 'portugiesisch'],
    '🇬🇷': ['griechenland', 'greece', 'greek', 'griechisch'],
    '🇮🇪': ['irland', 'ireland', 'irish', 'irisch'],
    '🇨🇿': ['tschechien', 'czech', 'republic', 'tschechisch'],
    '🇭🇺': ['ungarn', 'hungary', 'hungarian', 'ungarisch'],
    '🇺🇦': ['ukraine', 'ukrainian', 'ukrainisch'],
    '🇪🇺': ['eu', 'europa', 'europe', 'european', 'europäisch'],
    '🇺🇳': ['un', 'united', 'nations', 'vereinte', 'nationen'],
    '🏳️‍🌈': ['pride', 'rainbow', 'lgbtq', 'regenbogen', 'gay'],
    '🏁': ['racing', 'finish', 'zielflagge', 'rennen'],
    '🏴‍☠️': ['pirate', 'pirat', 'skull', 'totenkopf'],

    // Alternative Land-Symbole
    '🗾': ['japan', 'japanisch', 'insel', 'map', 'karte'],
    '🗽': ['usa', 'america', 'freiheit', 'liberty', 'statue'],
    '⛩️': ['japan', 'temple', 'tempel', 'shrine'],
    '🕌': ['mosque', 'moschee', 'islam', 'türkei', 'arabien'],
    '🗿': ['easter', 'island', 'osterinsel', 'statue', 'moai'],
    '🏛️': ['greece', 'griechenland', 'ancient', 'tempel', 'säule'],
    '🏰': ['castle', 'schloss', 'europa', 'medieval', 'könig'],
    '🏯': ['japan', 'pagoda', 'castle', 'asian', 'asien'],
    '🗼': ['tower', 'turm', 'eiffel', 'tokyo', 'paris'],
    '🏔️': ['mountain', 'berg', 'alpen', 'himalaya', 'swiss'],
    '🏜️': ['desert', 'wüste', 'sahara', 'africa', 'afrika'],
    '🏝️': ['island', 'insel', 'tropical', 'paradise', 'strand']
  };

  const filteredEmojis = searchTerm
    ? Object.values(EMOJI_CATEGORIES)
        .flatMap(cat => cat.emojis)
        .filter(emoji => {
          const term = searchTerm.toLowerCase();
          return emoji.includes(term) || 
                 emojiNames[emoji]?.some(name => name.includes(term)) ||
                 false;
        })
    : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || []

  return (
    <div className="bg-dark-surface/95 backdrop-blur-xl border border-purple-primary/30 rounded-xl shadow-neon-strong p-4 w-96 max-h-[500px]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-neon">
          Emoji wählen
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-dark-muted hover:text-dark-text transition-colors duration-200 hover:scale-110"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <Input
          placeholder="Emoji suchen (z.B. hund, pizza, love, rocket, angry)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
        />
      </div>

      {/* Custom Emoji Input */}
      <div className="mb-4 p-3 bg-purple-primary/10 border border-purple-primary/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-dark-text">Oder eigenes Emoji eingeben:</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Füge hier dein Emoji ein..."
            className="flex-1 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple text-center text-2xl"
            onChange={(e) => {
              const value = e.target.value;
              if (value && /\p{Emoji}/u.test(value)) {
                onEmojiSelect(value);
              }
            }}
          />
          <div className="text-dark-muted text-sm flex items-center">
            Kopiere & füge ein! 📋
          </div>
        </div>
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon
            const isActive = activeCategory === key
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`
                  flex-shrink-0 p-2 rounded-lg transition-all duration-300 hover:scale-105
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-primary to-purple-secondary text-white shadow-neon' 
                    : 'bg-dark-bg/50 text-dark-muted hover:text-dark-text hover:bg-purple-primary/20'
                  }
                `}
                title={category.name}
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            onClick={() => onEmojiSelect(emoji)}
            className="
              w-8 h-8 text-xl flex items-center justify-center rounded-lg
              hover:bg-purple-primary/20 hover:scale-110 
              transition-all duration-200 hover:shadow-neon-sm
              border border-transparent hover:border-purple-primary/30
            "
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* No Results */}
      {searchTerm && filteredEmojis.length === 0 && (
        <div className="text-center py-8 text-dark-muted">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Keine Emojis gefunden</p>
          <p className="text-sm">Versuche einen anderen Suchbegriff</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-purple-primary/20">
        <p className="text-xs text-dark-muted text-center">
          💡 Suche nach: "hund", "pizza", "love", "angry", "car", "music" usw. ✨
        </p>
      </div>
    </div>
  )
}

export default EmojiPicker 