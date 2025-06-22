import { useState, useEffect, useRef } from 'react'
import { Heart, Settings, Users, MessageCircle, Crown, Send, Eye, Smile, Upload, Trash2, Folder, Plus, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import { Input } from '../components/ui/input'
import { useToast, ToastContainer } from '../components/ui/toast'
import EmojiPicker from '../components/ui/emoji-picker'
// Matrix Blocks Komponente direkt hier

// Matrix Blocks Komponente
const MatrixBlocks = ({ density = 30 }: { density?: number }) => {
  const blocks = Array.from({ length: density }, (_, i) => (
    <div
      key={i}
      className="matrix-block"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${2 + Math.random() * 3}s`
      }}
    />
  ));
  return <div className="matrix-blocks">{blocks}</div>;
};

interface WelcomeSettings {
  enabled: boolean;
  channelName: string;
  title: string;
  description: string;
  color: string;
  thumbnail: 'user' | 'server' | 'custom' | 'none';
  customThumbnail: string;
  imageRotation: {
    enabled: boolean;
    mode: 'random' | 'sequential';
    folder?: string; // Spezifischer Ordner für Rotation
  };
  fields: Array<{
    name: string;
    value: string;
    inline: boolean;
  }>;
  footer: string;
  autoRole: string;
  mentionUser: boolean;
  deleteAfter: number;
  dmMessage: {
    enabled: boolean;
    message: string;
  };
  leaveMessage: {
    enabled: boolean;
    channelName: string;
    title: string;
    description: string;
    color: string;
    mentionUser: boolean;
    deleteAfter: number;
  };
}

const Welcome = () => {
  const { toasts, showSuccess, showError, removeToast } = useToast()
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [folders, setFolders] = useState<{[key: string]: any[]}>({})
  const [selectedFolder, setSelectedFolder] = useState<string>('general')
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    filename: string;
    folder?: string;
    type: 'single' | 'all';
  }>({
    show: false,
    filename: '',
    folder: undefined,
    type: 'single'
  })
  const [draggedImage, setDraggedImage] = useState<{filename: string, folder: string} | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
  const [galleryCollapsed, setGalleryCollapsed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [welcomeSettings, setWelcomeSettings] = useState<WelcomeSettings>({
    enabled: true,
    channelName: 'willkommen',
    title: '🎉 Willkommen auf dem Server!',
    description: 'Hey **{user}**! Schön dass du zu **{server}** gefunden hast! 🎊',
    color: '0x00FF7F',
    thumbnail: 'user',
    customThumbnail: '',
    imageRotation: {
      enabled: false,
      mode: 'random',
      folder: undefined
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
  });

  // API-Funktionen
  const saveWelcomeSettings = async () => {
    try {
      console.log('💾 SPEICHERE Settings - RAW DATA:', JSON.stringify(welcomeSettings, null, 2));
      console.log('🔍 ImageRotation vor Speichern:', {
        enabled: welcomeSettings.imageRotation?.enabled,
        mode: welcomeSettings.imageRotation?.mode,
        folder: welcomeSettings.imageRotation?.folder,
        'typeof folder': typeof welcomeSettings.imageRotation?.folder
      });
      
      const response = await fetch('/api/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(welcomeSettings),
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Einstellungen gespeichert', '🎉 Willkommensnachrichten-Einstellungen gespeichert!');
        console.log('✅ Einstellungen gespeichert - Server Response:', result);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
        console.error('API Error:', response.status, errorData);
        showError('Speichern fehlgeschlagen', `❌ ${errorData.error || 'Fehler beim Speichern der Einstellungen'}`);
      }
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      showError('Netzwerkfehler', '❌ Netzwerkfehler beim Speichern');
    }
  };

  const loadWelcomeSettings = async () => {
    try {
      console.log('🔄 Starte Laden der Welcome Settings...');
      const response = await fetch('/api/welcome');
      console.log('📡 API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 RAW API Data erhalten:', JSON.stringify(data, null, 2));
        
        // Robuste Verarbeitung der Daten
        if (data && typeof data === 'object') {
          console.log('🔍 Analysiere API Data:', {
            'data.thumbnail': data.thumbnail,
            'data.customThumbnail': data.customThumbnail,
            'typeof data': typeof data,
            'keys': Object.keys(data)
          });
          
          // Sicherstellen dass imageRotation existiert (neues Feature)
          if (!data.imageRotation) {
            data.imageRotation = {
              enabled: false,
              mode: 'random',
              folder: undefined  // Explizit setzen für korrekte TypeScript-Struktur
            };
          }
          
          // Sicherstellen dass folder property existiert falls imageRotation vorhanden ist
          if (data.imageRotation && !data.imageRotation.hasOwnProperty('folder')) {
            data.imageRotation.folder = undefined;
          }

          // Sicherstellen dass leaveMessage existiert (neues Feature)
          if (!data.leaveMessage) {
            data.leaveMessage = {
              enabled: false,
              channelName: 'verlassen',
              title: '👋 Tschüss!',
              description: '**{user}** hat den Server verlassen. Auf Wiedersehen! 😢',
              color: '0xFF6B6B',
              mentionUser: false,
              deleteAfter: 0
            };
          }
          
          console.log('⚙️ Vor setState - aktuelle Settings:', {
            'prevSettings.thumbnail': welcomeSettings.thumbnail,
            'data.thumbnail': data.thumbnail
          });
          
          // Merge mit aktuellen Einstellungen statt kompletten Ersatz
          setWelcomeSettings(prevSettings => {
            const newSettings = {
              ...prevSettings,
              ...data,
              imageRotation: {
                ...prevSettings.imageRotation,
                ...data.imageRotation
              },
              leaveMessage: {
                ...prevSettings.leaveMessage,
                ...data.leaveMessage
              }
            };
            console.log('🎯 Neue Settings nach Merge:', {
              'thumbnail': newSettings.thumbnail,
              'customThumbnail': newSettings.customThumbnail,
              'imageRotation.folder': newSettings.imageRotation?.folder,
              'imageRotation.enabled': newSettings.imageRotation?.enabled
            });
            return newSettings;
          });
          setSettingsLoaded(true);
          console.log('✅ Settings erfolgreich geladen und gesetzt!');
        } else {
          console.error('❌ Ungültige Datenstruktur von API erhalten:', data);
          showError('Ungültige Daten', '❌ Ungültige Daten von Server erhalten');
        }
      } else {
        console.error('❌ API Error beim Laden der Einstellungen:', response.status, response.statusText);
        showError('Laden fehlgeschlagen', '❌ Fehler beim Laden der Einstellungen');
      }
    } catch (err) {
      console.error('❌ Fehler beim Laden der Einstellungen:', err);
      showError('Netzwerkfehler', '❌ Netzwerkfehler beim Laden der Einstellungen');
    }
  };

  const testWelcomeMessage = async () => {
    try {
      const response = await fetch('/api/welcome/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(welcomeSettings),
      });

      if (response.ok) {
        showSuccess('Test erfolgreich', '📨 Test-Willkommensnachricht gesendet!');
      } else {
                  showError('Test fehlgeschlagen', '❌ Fehler beim Senden der Testnachricht');
      }
    } catch (err) {
              showError('Test Netzwerkfehler', '❌ Fehler beim Testen der Nachricht');
    }
  };

  const testLeaveMessage = async () => {
    try {
      const response = await fetch('/api/welcome/test-leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(welcomeSettings),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Test Leave erfolgreich', `👋 ${data.message}`);
      } else {
        const errorData = await response.json();
        showError(`❌ ${errorData.error || 'Fehler beim Senden der Test-Abschiedsnachricht'}`);
      }
    } catch (err) {
      showError('Test Netzwerkfehler', '❌ Fehler beim Testen der Abschiedsnachricht');
    }
  };

  // Funktionen für Felder
  const updateField = (index: number, field: string, value: string | boolean) => {
    const newSettings = { ...welcomeSettings };
    if (field === 'name' || field === 'value') {
      newSettings.fields[index][field] = value as string;
    } else if (field === 'inline') {
      newSettings.fields[index][field] = value as boolean;
    }
    setWelcomeSettings(newSettings);
  };

  const addField = () => {
    const newSettings = { ...welcomeSettings };
    newSettings.fields.push({
      name: 'Neues Feld',
      value: 'Beschreibung hier...',
      inline: false
    });
    setWelcomeSettings(newSettings);
  };

  const removeField = (index: number) => {
    const newSettings = { ...welcomeSettings };
    newSettings.fields.splice(index, 1);
    setWelcomeSettings(newSettings);
  };

  // Upload-Funktionen
  const loadUploadedImages = async () => {
    try {
      const response = await fetch('/api/welcome/images');
      if (response.ok) {
        const data = await response.json();
        
        // Robuste Verarbeitung der API-Response
        const images = Array.isArray(data.images) ? data.images : [];
        const folders = data.folders && typeof data.folders === 'object' ? data.folders : {};
        
        // Normalisiere Folder-Struktur: Stelle sicher dass jeder Folder ein Array ist
        const normalizedFolders: {[key: string]: any[]} = {};
        Object.keys(folders).forEach(folderName => {
          const folderData = folders[folderName];
          // Wenn es ein Objekt mit 'images' Property ist, extrahiere das Array
          if (folderData && typeof folderData === 'object' && Array.isArray(folderData.images)) {
            normalizedFolders[folderName] = folderData.images;
          } 
          // Wenn es bereits ein Array ist, verwende es direkt
          else if (Array.isArray(folderData)) {
            normalizedFolders[folderName] = folderData;
          } 
          // Fallback: leeres Array
          else {
            normalizedFolders[folderName] = [];
          }
        });
        
        setUploadedImages(images);
        setFolders(normalizedFolders);
        
        // Setze ersten verfügbaren Ordner als Standard falls selectedFolder nicht existiert
        const availableFolders = data.allFolderNames || data.folderNames || Object.keys(normalizedFolders) || [];
        if (availableFolders.length > 0 && !availableFolders.includes(selectedFolder)) {
          setSelectedFolder(availableFolders[0]);
        }
      } else {
        console.error('API Error:', response.status, response.statusText);
        showError('Laden fehlgeschlagen', '❌ Fehler beim Laden der Bilder');
      }
    } catch (err) {
      console.error('Fehler beim Laden der Bilder:', err);
             showError('Netzwerkfehler', '❌ Netzwerkfehler beim Laden der Bilder');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validierung aller Dateien
    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Datei zu groß', `❌ ${file.name} ist zu groß! Maximum: 5MB`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        showError('Falscher Dateityp', `❌ ${file.name} ist keine Bilddatei!`);
        return;
      }
    }

    setUploading(true);
    let successCount = 0;
    let lastUploadedUrl = '';

    try {
      // Multi-Upload: Alle Dateien in einem Request
      const formData = new FormData();
      fileArray.forEach(file => {
        formData.append('welcomeImage', file);
      });
      formData.append('folder', selectedFolder);

      const response = await fetch('/api/welcome/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          successCount = data.successCount || data.totalFiles || 1;
          
          // Finde die letzte erfolgreiche URL für Auto-Auswahl
          if (data.results && Array.isArray(data.results)) {
            const successfulResults = data.results.filter((r: any) => r.success);
            if (successfulResults.length > 0) {
              lastUploadedUrl = successfulResults[successfulResults.length - 1].url;
            }
          } else if (data.url) {
            // Fallback für Single-Upload Kompatibilität
            lastUploadedUrl = data.url;
            successCount = 1;
          }
        } else {
          throw new Error(data.message || 'Upload fehlgeschlagen');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
        throw new Error(errorData.error || 'Upload fehlgeschlagen');
      }
      
      // Erfolgs-Meldung
      if (successCount === 1) {
        showSuccess('Upload erfolgreich', '🎉 Bild erfolgreich hochgeladen!');
      } else {
        showSuccess('Uploads erfolgreich', `🎉 ${successCount} Bilder erfolgreich hochgeladen!`);
      }
      
      // Automatisch das letzte Bild auswählen
      if (lastUploadedUrl) {
        setWelcomeSettings({
          ...welcomeSettings,
          thumbnail: 'custom',
          customThumbnail: lastUploadedUrl
        });
      }

      // Bilderliste neu laden
      try {
        await loadUploadedImages();
      } catch (loadError) {
        console.error('Fehler beim Neuladen der Bilder:', loadError);
      }
      
    } catch (err) {
      console.error('Upload Fehler:', err);
      showError('Upload fehlgeschlagen', `❌ ${successCount}/${fileArray.length} Bilder hochgeladen`);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const deleteImage = async (filename: string, folder?: string) => {
    setDeleteModal({
      show: true,
      filename: filename,
      folder: folder,
      type: 'single'
    });
  };

  const confirmDelete = async () => {
    const { filename, folder, type } = deleteModal;
    
    try {
      if (type === 'single') {
        const deleteUrl = folder 
          ? `/api/welcome/images/${folder}/${filename}`
          : `/api/welcome/images/${filename}`;
        
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
        });

        if (response.ok) {
          showSuccess('Gelöscht', '🗑️ Bild erfolgreich gelöscht!');
          
          // Wenn das gelöschte Bild gerade ausgewählt ist, zurücksetzen
          if (welcomeSettings.customThumbnail === `/images/welcome/${filename}`) {
            setWelcomeSettings({
              ...welcomeSettings,
              thumbnail: 'none',
              customThumbnail: ''
            });
          }

          // Bilderliste neu laden
          await loadUploadedImages();
        } else {
          const errorData = await response.json();
          showError(`❌ ${errorData.error || 'Fehler beim Löschen'}`);
        }
      } else if (type === 'all') {
        const deletePromises = uploadedImages.map(image => 
          fetch(`/api/welcome/images/${image.filename}`, { method: 'DELETE' })
        );

        await Promise.all(deletePromises);
        
        showSuccess('Alle gelöscht', '🗑️ Alle Bilder erfolgreich gelöscht!');
        
        // Settings zurücksetzen
        setWelcomeSettings({
          ...welcomeSettings,
          thumbnail: 'none',
          customThumbnail: ''
        });

        // Bilderliste neu laden
        await loadUploadedImages();
      }
    } catch (err) {
      console.error('Lösch-Fehler:', err);
      showError('Löschen fehlgeschlagen', '❌ Fehler beim Löschen');
    } finally {
      setDeleteModal({ show: false, filename: '', type: 'single' });
    }
  };

  const deleteAllImages = async () => {
    setDeleteModal({
      show: true,
      filename: '',
      type: 'all'
    });
  };

  // Ordner-Management Funktionen
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      showError('Ordnername erforderlich', '❌ Bitte geben Sie einen Ordnernamen ein');
      return;
    }

    try {
      const response = await fetch('/api/welcome/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: newFolderName.trim() })
      });

      if (response.ok) {
        showSuccess('Ordner erstellt', `📁 Ordner "${newFolderName}" erfolgreich erstellt!`);
        setNewFolderName('');
        setShowNewFolderInput(false);
        setSelectedFolder(newFolderName.trim());
        await loadUploadedImages();
      } else {
        const errorData = await response.json();
        showError(`❌ ${errorData.error || 'Fehler beim Erstellen des Ordners'}`);
      }
    } catch (err) {
      showError('Ordner Netzwerkfehler', '❌ Netzwerkfehler beim Erstellen des Ordners');
    }
  };

  const deleteFolder = async (folderName: string) => {
    if (folderName === 'general') {
      showError('Löschen nicht erlaubt', '❌ Der General-Ordner kann nicht gelöscht werden');
      return;
    }

    if (!confirm(`Möchten Sie den Ordner "${folderName}" und alle enthaltenen Bilder wirklich löschen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/welcome/folders/${folderName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Ordner gelöscht', `🗑️ Ordner "${folderName}" erfolgreich gelöscht!`);
        
        // Wechsle zu anderem Ordner falls der aktuelle gelöscht wurde
        if (selectedFolder === folderName) {
          setSelectedFolder('general');
        }
        
        await loadUploadedImages();
      } else {
        const errorData = await response.json();
        showError(`❌ ${errorData.error || 'Fehler beim Löschen des Ordners'}`);
      }
    } catch (err) {
              showError('Löschen Netzwerkfehler', '❌ Netzwerkfehler beim Löschen des Ordners');
    }
  };

  // Move Image zwischen Ordnern
  const moveImage = async (filename: string, sourceFolder: string, targetFolder: string) => {
    try {
      const response = await fetch('/api/welcome/images/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, sourceFolder, targetFolder })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Bild verschoben', `📦 Bild erfolgreich von "${sourceFolder}" nach "${targetFolder}" verschoben!`);
        
        // Falls das verschobene Bild aktuell ausgewählt ist, Update die URL
        if (welcomeSettings.customThumbnail === `/images/welcome/${sourceFolder}/${filename}`) {
          setWelcomeSettings({
            ...welcomeSettings,
            customThumbnail: data.newUrl
          });
        }
        
        await loadUploadedImages();
      } else {
        const errorData = await response.json();
        showError(`❌ ${errorData.error || 'Fehler beim Verschieben'}`);
      }
    } catch (err) {
      showError('Verschieben Netzwerkfehler', '❌ Netzwerkfehler beim Verschieben');
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, filename: string, folder: string) => {
    setDraggedImage({ filename, folder });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
    setDragOverFolder(null);
  };

  const handleDragOver = (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    if (draggedImage && draggedImage.folder !== targetFolder) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverFolder(targetFolder);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Nur wenn wir den Ordner-Button wirklich verlassen
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverFolder(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    if (draggedImage && draggedImage.folder !== targetFolder) {
      await moveImage(draggedImage.filename, draggedImage.folder, targetFolder);
    }
    setDraggedImage(null);
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Erst Settings laden, dann Images
        await loadWelcomeSettings();
        await loadUploadedImages();
      } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
      }
    };
    
    initializeData();
  }, []);

  // Separater Effect für Auto-Save bei Änderungen
  useEffect(() => {
    // Nur speichern wenn Settings bereits geladen wurden (nicht bei erster Initialisierung)
    if (settingsLoaded) {
      const timeoutId = setTimeout(() => {
        saveWelcomeSettings();
      }, 1000); // 1 Sekunde Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [welcomeSettings, settingsLoaded]);

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      {/* Matrix Background Effects */}
      <MatrixBlocks density={25} />
      
      {/* Page Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="w-12 h-12 text-pink-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
            Willkommensnachrichten
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Erstelle warme Willkommensnachrichten für neue Mitglieder! 
          <span className="ml-2 inline-block relative">
            <svg 
              className="w-6 h-6 animate-pulse hover:animate-bounce text-pink-400 hover:text-pink-300 transition-all duration-300 hover:scale-110 drop-shadow-lg" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <div className="absolute inset-0 animate-ping">
              <svg 
                className="w-6 h-6 text-pink-500 opacity-30" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </span>
        </div>
        <div className="w-32 h-1 bg-gradient-to-r from-pink-400 to-purple-600 mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Main Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-pink-400" />
            Grundeinstellungen
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere die Basis-Einstellungen für Willkommensnachrichten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Enable/Disable & Channel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enabled"
                checked={welcomeSettings.enabled}
                onChange={(e) => setWelcomeSettings({...welcomeSettings, enabled: e.target.checked})}
                className="w-5 h-5 text-pink-400 bg-dark-bg border-purple-primary/30 rounded focus:ring-pink-400 focus:ring-2"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-dark-text">
                Willkommensnachrichten aktiviert
              </label>
            </div>
            
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Channel Name</label>
              <Input
                value={welcomeSettings.channelName}
                onChange={(e) => setWelcomeSettings({...welcomeSettings, channelName: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-pink-400"
                placeholder="willkommen"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-dark-text">Auto-Role (optional)</label>
                <div className="relative group">
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors duration-200"
                  >
                    ❓
                  </button>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    <div className="font-medium text-blue-400 mb-1">👑 Auto-Role erklärt:</div>
                    <div>Rolle wird automatisch an neue</div>
                    <div>Mitglieder vergeben (z.B. "member")</div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
                  </div>
                </div>
              </div>
              <Input
                value={welcomeSettings.autoRole}
                onChange={(e) => setWelcomeSettings({...welcomeSettings, autoRole: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-pink-400"
                placeholder="member"
              />
            </div>
          </div>

          {/* Message Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Titel</label>
              <div className="relative">
                <Input
                  value={welcomeSettings.title}
                  onChange={(e) => setWelcomeSettings({...welcomeSettings, title: e.target.value})}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-pink-400 pr-10"
                  placeholder="🎉 Willkommen!"
                />
                <button
                  onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'title' ? null : 'title')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-pink-400 transition-colors duration-200 hover:scale-110"
                >
                  <Smile className="w-5 h-5" />
                </button>

              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-dark-text">Embed Farbe</label>
                <div className="relative group">
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors duration-200"
                  >
                    ❓
                  </button>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    <div className="font-medium text-blue-400 mb-1">🎨 Embed Farbe erklärt:</div>
                    <div>Die Farbe des seitlichen Balkens</div>
                    <div>in der Discord Nachricht</div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                {/* Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={welcomeSettings.color.startsWith('0x') ? `#${welcomeSettings.color.slice(2)}` : welcomeSettings.color.startsWith('#') ? welcomeSettings.color : '#00FF7F'}
                    onChange={(e) => {
                      const hexColor = e.target.value;
                      const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                      setWelcomeSettings({...welcomeSettings, color: discordColor});
                    }}
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 bg-dark-bg cursor-pointer hover:border-pink-400 transition-all duration-300 hover:scale-105"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(244, 114, 182, 0.3))'
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full animate-ping opacity-60"></div>
                </div>
                
                {/* Hex Input */}
                <div className="flex-1">
                  <Input
                    value={welcomeSettings.color}
                    onChange={(e) => setWelcomeSettings({...welcomeSettings, color: e.target.value})}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-pink-400 font-mono"
                    placeholder="0x00FF7F"
                  />
                </div>

                {/* Color Preview */}
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                  style={{
                    backgroundColor: welcomeSettings.color.startsWith('0x') ? `#${welcomeSettings.color.slice(2)}` : welcomeSettings.color.startsWith('#') ? welcomeSettings.color : '#00FF7F',
                    filter: 'drop-shadow(0 0 8px rgba(244, 114, 182, 0.3))'
                  }}
                >
                  💝
                </div>
              </div>
              
              {/* Preset Colors */}
              <div className="mt-3">
                <p className="text-xs text-dark-muted mb-2">Beliebte Discord Farben:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { name: 'Blau', color: '0x3498DB' },
                    { name: 'Grün', color: '0x2ECC71' },
                    { name: 'Rot', color: '0xE74C3C' },
                    { name: 'Lila', color: '0x9B59B6' },
                    { name: 'Orange', color: '0xE67E22' },
                    { name: 'Pink', color: '0xE91E63' },
                    { name: 'Cyan', color: '0x1ABC9C' },
                    { name: 'Gelb', color: '0xF1C40F' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setWelcomeSettings({...welcomeSettings, color: preset.color})}
                      className="w-8 h-8 rounded-lg border border-purple-primary/30 hover:border-pink-400 transition-all duration-300 hover:scale-110 relative group"
                      style={{
                        backgroundColor: `#${preset.color.slice(2)}`,
                        filter: 'drop-shadow(0 0 4px rgba(244, 114, 182, 0.2))'
                      }}
                      title={preset.name}
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-dark-text mb-2 block">Beschreibung</label>
            <div className="relative">
              <Textarea
                value={welcomeSettings.description}
                onChange={(e) => setWelcomeSettings({...welcomeSettings, description: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-pink-400 pr-10"
                placeholder="Willkommen **{user}** auf **{server}**!"
                rows={3}
              />
              <button
                onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'description' ? null : 'description')}
                className="absolute right-2 top-2 text-dark-muted hover:text-pink-400 transition-colors duration-200 hover:scale-110"
              >
                <Smile className="w-5 h-5" />
              </button>

            </div>
            <p className="text-xs text-dark-muted mt-1">
              Verfügbare Platzhalter: <code>{'{user}'}</code>, <code>{'{server}'}</code>, <code>{'{memberCount}'}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Embed Fields */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-400" />
            Embed-Felder
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Füge zusätzliche Informations-Felder zu deiner Willkommensnachricht hinzu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-pink-400">📝 Nachrichtenfelder</h3>
            <Button 
              onClick={addField}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Feld hinzufügen
            </Button>
          </div>

          <div className="space-y-4">
            {welcomeSettings.fields.map((field, index) => (
              <div key={index} className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-3">
                    <label className="text-xs text-dark-muted mb-1 block">Feld Name</label>
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(index, 'name', e.target.value)}
                      className="bg-dark-bg border-purple-primary/30 text-dark-text focus:border-pink-400"
                      placeholder="Feld Name"
                    />
                  </div>
                  <div className="md:col-span-6">
                    <label className="text-xs text-dark-muted mb-1 block">Feld Inhalt</label>
                    <Textarea
                      value={field.value}
                      onChange={(e) => updateField(index, 'value', e.target.value)}
                      className="bg-dark-bg border-purple-primary/30 text-dark-text resize-none focus:border-pink-400"
                      placeholder="Feld Inhalt..."
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-center">
                    <div className="flex items-center space-x-2 relative group">
                      <input
                        type="checkbox"
                        id={`inline-${index}`}
                        checked={field.inline}
                        onChange={(e) => updateField(index, 'inline', e.target.checked)}
                        className="w-4 h-4 text-pink-400 bg-dark-bg border-purple-primary/30 rounded focus:ring-pink-400 focus:ring-2"
                      />
                      <label htmlFor={`inline-${index}`} className="text-xs text-dark-text">
                        Inline
                      </label>
                      <button
                        type="button"
                        className="text-blue-400 hover:text-blue-300 text-xs ml-1 transition-colors duration-200"
                      >
                        ❓
                      </button>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                        <div className="font-medium text-blue-400 mb-1">💡 Inline erklärt:</div>
                        <div>✅ AN: Felder nebeneinander (max. 3 pro Zeile)</div>
                        <div>❌ AUS: Felder untereinander</div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button 
                      onClick={() => removeField(index)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div>
            <label className="text-sm font-medium text-dark-text mb-2 block">Footer Text</label>
            <Input
              value={welcomeSettings.footer}
              onChange={(e) => setWelcomeSettings({...welcomeSettings, footer: e.target.value})}
              className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-pink-400"
              placeholder="Mitglied #{memberCount} • {server}"
            />
          </div>
        </CardContent>
      </Card>

      {/* Welcome Images Gallery */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            Willkommensbilder
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Wähle ein Bild für deine Willkommensnachrichten aus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Thumbnail Type Selection */}
          <div>
            <label className="text-sm font-medium text-dark-text mb-3 block">Bild-Typ</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'none', label: 'Kein Bild', emoji: '🚫' },
                { value: 'user', label: 'Benutzer Avatar', emoji: '👤' },
                { value: 'server', label: 'Server Icon', emoji: '🏠' },
                { value: 'custom', label: 'Eigenes Bild', emoji: '🖼️' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setWelcomeSettings({...welcomeSettings, thumbnail: option.value as any})}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                    welcomeSettings.thumbnail === option.value
                      ? 'border-pink-400 bg-pink-400/20 shadow-pink-glow'
                      : 'border-purple-primary/30 bg-dark-bg/50 hover:border-pink-400/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="text-xs text-dark-text font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Image Gallery mit Ordner-System */}
          {welcomeSettings.thumbnail === 'custom' && (
            <div className="animate-fade-in space-y-4">
              {/* Accordion Header für Bildergalerie */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-dark-text">📷 Willkommensbilder-Galerie</label>
                  <span className="text-xs bg-purple-primary/20 text-purple-300 px-2 py-1 rounded-full">
                    {uploadedImages.length} {uploadedImages.length === 1 ? 'Bild' : 'Bilder'}
                  </span>
                </div>
                <button
                  onClick={() => setGalleryCollapsed(!galleryCollapsed)}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg bg-dark-bg/50 hover:bg-dark-bg/70 text-dark-text border border-purple-primary/30 transition-all duration-300 hover:border-purple-primary/50"
                  title={galleryCollapsed ? "Galerie ausklappen" : "Galerie einklappen"}
                >
                  <span className="text-xs font-medium">
                    {galleryCollapsed ? "Ausklappen" : "Einklappen"}
                  </span>
                  <span className={`transition-transform duration-300 ${galleryCollapsed ? "rotate-180" : ""}`}>
                    ⌄
                  </span>
                </button>
              </div>
              
              {/* Collapsible Galerie Content */}
              <div className={`transition-all duration-500 overflow-hidden ${
                galleryCollapsed 
                  ? "max-h-0 opacity-0" 
                  : "max-h-[2000px] opacity-100"
              }`}>
                {/* Ordner-Management */}
                <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-dark-text">📁 Ordner-Management</h5>
                  <Button
                    onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs"
                  >
                    <span className="mr-1">+</span>
                    Neuer Ordner
                  </Button>
                </div>
                
                {/* Neuer Ordner Input */}
                {showNewFolderInput && (
                  <div className="mb-4 p-3 bg-dark-surface/50 rounded-lg border border-purple-primary/30">
                    <div className="flex gap-2">
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Ordnername (z.B. valorant, minecraft...)"
                        className="bg-dark-bg border-purple-primary/30 text-dark-text focus:border-pink-400"
                      />
                      <Button
                        onClick={createFolder}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Erstellen
                      </Button>
                      <Button
                        onClick={() => {
                          setShowNewFolderInput(false);
                          setNewFolderName('');
                        }}
                        size="sm"
                        variant="outline"
                        className="border-purple-primary/30 text-dark-text hover:bg-dark-bg"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Ordner-Tabs */}
                <div className="flex flex-wrap gap-2">
                  {Object.keys(folders).map((folderName) => (
                    <div
                      key={folderName}
                      className="relative group"
                    >
                      <button
                        onClick={() => setSelectedFolder(folderName)}
                        onDragOver={(e) => handleDragOver(e, folderName)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, folderName)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                          selectedFolder === folderName
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-glow'
                            : dragOverFolder === folderName && draggedImage && draggedImage.folder !== folderName
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-glow border-2 border-green-400'
                            : 'bg-dark-bg/70 text-dark-text hover:bg-purple-primary/20 border border-purple-primary/30'
                        }`}
                      >
                        <span className="text-base">
                          {folderName === 'general' ? '📂' : 
                           folderName.includes('valorant') ? '🎯' :
                           folderName.includes('minecraft') ? '⛏️' :
                           folderName.includes('fortnite') ? '🏗️' :
                           folderName.includes('beellgrounds') ? '🐝' :
                           folderName.includes('apex') ? '🔫' :
                           folderName.includes('lol') ? '⚔️' :
                           folderName.includes('cs') ? '💣' :
                           '🎮'}
                        </span>
                        <span>{folderName}</span>
                        <span className="text-xs bg-purple-primary/30 px-1.5 py-0.5 rounded-full">
                          {folders[folderName]?.length || 0}
                        </span>
                      </button>
                      {folderName !== 'general' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFolder(folderName);
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10 shadow-lg"
                          title={`Ordner "${folderName}" löschen`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Aktueller Ordner Info & Rotation */}
              <div className="bg-dark-bg/30 rounded-lg p-3 border border-purple-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-text">
                      📁 Aktiver Ordner: <strong className="text-pink-400">{selectedFolder}</strong>
                    </span>
                    <span className="text-xs text-dark-muted">
                      ({folders[selectedFolder]?.length || 0} Bilder)
                    </span>
                  </div>
                  
                  {/* Rotation Controls */}
                  {uploadedImages.length > 1 && (
                    <div className="flex items-center gap-2 bg-dark-bg/50 rounded-lg px-3 py-1 border border-purple-primary/30">
                      <input
                        type="checkbox"
                        id="imageRotation"
                        checked={welcomeSettings.imageRotation?.enabled || false}
                        onChange={(e) => setWelcomeSettings({
                          ...welcomeSettings, 
                          imageRotation: {
                            enabled: e.target.checked,
                            mode: welcomeSettings.imageRotation?.mode || 'random',
                            folder: welcomeSettings.imageRotation?.folder
                          }
                        })}
                        className="w-4 h-4 text-pink-400 bg-dark-bg border-purple-primary/30 rounded focus:ring-pink-400 focus:ring-2"
                      />
                      <label htmlFor="imageRotation" className="text-xs text-dark-text">
                        🎲 Zufällige Bilder
                      </label>
                    </div>
                  )}
                </div>
                
                {/* Ordner-spezifische Rotation */}
                {welcomeSettings.imageRotation?.enabled && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-green-400">
                      <span className="animate-pulse">🎲</span>
                      <span>Rotation aktiv</span>
                    </div>
                    
                    <div>
                      <label className="text-xs text-dark-muted mb-1 block">Rotation auf bestimmten Ordner beschränken:</label>
                      <select
                        value={welcomeSettings.imageRotation.folder || ''}
                        onChange={(e) => setWelcomeSettings({
                          ...welcomeSettings,
                          imageRotation: {
                            ...welcomeSettings.imageRotation,
                            folder: e.target.value || undefined
                          }
                        })}
                        className="w-full bg-dark-bg border border-purple-primary/30 text-dark-text rounded-lg px-3 py-1 focus:border-pink-400 text-xs"
                      >
                        <option value="">Alle Ordner (Standard)</option>
                        {Object.keys(folders).map(folderName => (
                          <option key={folderName} value={folderName}>
                            {folderName} ({folders[folderName]?.length || 0} Bilder)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Drag & Drop Info */}
              {draggedImage && (
                <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3 text-center">
                  <div className="text-blue-400 text-sm font-medium flex items-center justify-center gap-2">
                    <span className="animate-bounce">🎯</span>
                    Ziehe "{draggedImage.filename}" auf einen anderen Ordner um es zu verschieben
                  </div>
                </div>
              )}

              {/* Image Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Upload New Image */}
                <div 
                  className="relative group cursor-pointer rounded-xl border-3 border-dashed border-purple-primary/50 hover:border-pink-400/50 bg-dark-bg/30 aspect-video flex items-center justify-center transition-all duration-300 hover:scale-105"
                  onClick={triggerFileUpload}
                >
                  {uploading ? (
                    <div className="text-center text-pink-400">
                      <div className="text-4xl mb-2 animate-spin">⚡</div>
                      <div className="text-sm font-medium">Uploading...</div>
                      <div className="text-xs">Nach "{selectedFolder}"</div>
                    </div>
                  ) : (
                    <div className="text-center text-dark-muted group-hover:text-pink-400 transition-colors duration-300">
                      <Upload className="w-10 h-10 mx-auto mb-2" />
                      <div className="text-sm font-medium">Bilder hochladen</div>
                      <div className="text-xs">Nach "{selectedFolder}"</div>
                      <div className="text-xs opacity-70 mt-1">📸 Multi-Upload möglich</div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Bilder aus dem aktuellen Ordner anzeigen */}
                {(folders[selectedFolder] || []).map((image, index) => (
                  <div 
                    key={image.filename}
                    draggable
                    onDragStart={(e) => handleDragStart(e, image.filename, selectedFolder)}
                    onDragEnd={handleDragEnd}
                    className={`relative group cursor-pointer rounded-xl overflow-hidden border-3 transition-all duration-300 hover:scale-105 ${
                      welcomeSettings.customThumbnail === image.url
                        ? 'border-pink-400 shadow-pink-glow'
                        : draggedImage?.filename === image.filename
                        ? 'border-blue-400 shadow-blue-glow opacity-50'
                        : 'border-purple-primary/30 hover:border-pink-400/50'
                    }`}
                    onClick={() => setWelcomeSettings({...welcomeSettings, customThumbnail: image.url})}
                  >
                    <img 
                      src={image.url} 
                      alt={image.filename}
                      className="w-full aspect-video object-contain bg-gradient-to-br from-gray-800 to-gray-900"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Erstelle Fehler-Anzeige aber ohne das parent Element zu überschreiben
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'w-full aspect-video bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white absolute inset-0 z-10';
                        errorDiv.innerHTML = '<div class="text-center p-4"><div class="text-4xl mb-2 animate-pulse">🚫</div><div class="text-sm font-bold mb-1">Bild fehlerhaft</div><div class="text-xs opacity-90">Datei kann nicht geladen werden</div><div class="text-xs mt-2 bg-white/20 rounded px-2 py-1">Löschbar mit 🗑️ Button</div></div>';
                        target.parentElement?.appendChild(errorDiv);
                      }}
                    />
                    {welcomeSettings.customThumbnail === image.url && (
                      <div className="absolute top-2 right-2 bg-pink-400 text-white rounded-full p-1 z-50 shadow-lg">
                        ✓
                      </div>
                    )}
                    
                    {/* Lösch-Button - immer sichtbar bei fehlerhaften Bildern */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(image.filename, image.folder);
                      }}
                      className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-50 pointer-events-auto shadow-lg"
                      title="Bild löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {/* Info Button für fehlerhafte Bilder */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Erstelle eine detaillierte Bild-Info
                        const fileSizeKB = (image.size / 1024).toFixed(1);
                        const fileSizeMB = (image.size / (1024 * 1024)).toFixed(2);
                        const displaySize = image.size > 1024 * 1024 ? `${fileSizeMB}MB` : `${fileSizeKB}KB`;
                        
                        // Verkürze langen Dateinamen für bessere Darstellung
                        const shortFilename = image.filename.length > 30 
                          ? image.filename.substring(0, 25) + '...' + image.filename.slice(-8)
                          : image.filename;
                        
                        // Schöner Toast mit emojis und Formatierung  
                        const toastMessage = `ℹ️ **Bild Information**\n📁 Ordner: **${image.folder}**\n📷 Datei: **${shortFilename}**\n💾 Größe: **${displaySize}**\n🗑️ Tipp: Löschbar mit Papierkorb-Button`;
                        
                        showSuccess('Bild Information', toastMessage);
                      }}
                      className="absolute bottom-2 left-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-50 pointer-events-auto shadow-lg"
                      title="Bild Info anzeigen"
                    >
                      <span className="text-xs">ℹ️</span>
                    </button>
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <div className="text-white font-bold text-sm truncate px-2">
                        {image.filename.replace(/^welcome-\d+-\d+-/, '').replace(/\.[^/.]+$/, '')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom URL Input */}
              <div className="mt-4">
                <label className="text-sm font-medium text-dark-text mb-2 block">Oder eigene Bild-URL eingeben:</label>
                <Input
                  value={welcomeSettings.customThumbnail}
                  onChange={(e) => setWelcomeSettings({...welcomeSettings, customThumbnail: e.target.value})}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-pink-400"
                  placeholder="https://example.com/mein-willkommensbild.png"
                />
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-400 mb-1">💡 Tipps für optimale Bildqualität:</h4>
                  <ul className="text-xs text-dark-muted space-y-1">
                    <li>• <strong>Empfohlene Größe:</strong> Mindestens 512x512px (oder größer)</li>
                    <li>• <strong>Beste Formate:</strong> PNG für Transparenz, JPG für Fotos</li>
                    <li>• <strong>Maximale Dateigröße:</strong> 5MB</li>
                    <li>• <strong>Für Discord:</strong> Quadratische Bilder (1:1) funktionieren am besten</li>
                  </ul>
                </div>
              </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Crown className="w-5 h-5 text-pink-400" />
            Erweiterte Einstellungen
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Zusätzliche Features für Willkommensnachrichten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DM Settings */}
            <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
              <h4 className="text-sm font-medium text-dark-text mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-pink-400" />
                Private Nachricht
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="dmEnabled"
                    checked={welcomeSettings.dmMessage.enabled}
                    onChange={(e) => setWelcomeSettings({
                      ...welcomeSettings, 
                      dmMessage: {...welcomeSettings.dmMessage, enabled: e.target.checked}
                    })}
                    className="w-4 h-4 text-pink-400 bg-dark-bg border-purple-primary/30 rounded focus:ring-pink-400 focus:ring-2"
                  />
                  <label htmlFor="dmEnabled" className="text-sm text-dark-text">
                    DM an neue Mitglieder senden
                  </label>
                </div>
                {welcomeSettings.dmMessage.enabled && (
                  <Textarea
                    value={welcomeSettings.dmMessage.message}
                    onChange={(e) => setWelcomeSettings({
                      ...welcomeSettings, 
                      dmMessage: {...welcomeSettings.dmMessage, message: e.target.value}
                    })}
                    className="bg-dark-bg border-purple-primary/30 text-dark-text focus:border-pink-400"
                    placeholder="Private Willkommensnachricht..."
                    rows={3}
                  />
                )}
              </div>
            </div>

            {/* Other Settings */}
            <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
              <h4 className="text-sm font-medium text-dark-text mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-400" />
                Weitere Einstellungen
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="mentionUser"
                    checked={welcomeSettings.mentionUser}
                    onChange={(e) => setWelcomeSettings({...welcomeSettings, mentionUser: e.target.checked})}
                    className="w-4 h-4 text-pink-400 bg-dark-bg border-purple-primary/30 rounded focus:ring-pink-400 focus:ring-2"
                  />
                  <label htmlFor="mentionUser" className="text-sm text-dark-text">
                    Benutzer erwähnen (@user)
                  </label>
                </div>
                <div>
                  <label className="text-xs text-dark-muted mb-1 block">Nachricht löschen nach (Sekunden, 0 = nie)</label>
                  <Input
                    type="number"
                    value={welcomeSettings.deleteAfter}
                    onChange={(e) => setWelcomeSettings({...welcomeSettings, deleteAfter: parseInt(e.target.value) || 0})}
                    className="bg-dark-bg border-purple-primary/30 text-dark-text focus:border-pink-400"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Messages Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-red-400/30 shadow-red-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            👋 Abschiedsnachrichten
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere Nachrichten wenn Mitglieder den Server verlassen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Enable/Disable & Channel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="leaveEnabled"
                checked={welcomeSettings.leaveMessage.enabled}
                onChange={(e) => setWelcomeSettings({
                  ...welcomeSettings, 
                  leaveMessage: {...welcomeSettings.leaveMessage, enabled: e.target.checked}
                })}
                className="w-5 h-5 text-red-400 bg-dark-bg border-purple-primary/30 rounded focus:ring-red-400 focus:ring-2"
              />
              <label htmlFor="leaveEnabled" className="text-sm font-medium text-dark-text">
                Abschiedsnachrichten aktiviert
              </label>
            </div>
            
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Channel Name</label>
              <Input
                value={welcomeSettings.leaveMessage.channelName}
                onChange={(e) => setWelcomeSettings({
                  ...welcomeSettings, 
                  leaveMessage: {...welcomeSettings.leaveMessage, channelName: e.target.value}
                })}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-red-400"
                placeholder="verlassen"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-dark-text">Embed Farbe</label>
                <div className="relative group">
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors duration-200"
                  >
                    ❓
                  </button>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    <div className="font-medium text-blue-400 mb-1">🎨 Embed Farbe erklärt:</div>
                    <div>Die Farbe des seitlichen Balkens</div>
                    <div>in der Discord Abschiedsnachricht</div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                {/* Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={welcomeSettings.leaveMessage.color.startsWith('0x') ? `#${welcomeSettings.leaveMessage.color.slice(2)}` : welcomeSettings.leaveMessage.color.startsWith('#') ? welcomeSettings.leaveMessage.color : '#FF6B6B'}
                    onChange={(e) => {
                      const hexColor = e.target.value;
                      const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                      setWelcomeSettings({
                        ...welcomeSettings, 
                        leaveMessage: {...welcomeSettings.leaveMessage, color: discordColor}
                      });
                    }}
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 bg-dark-bg cursor-pointer hover:border-red-400 transition-all duration-300 hover:scale-105"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(255, 107, 107, 0.3))'
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-400 to-orange-600 rounded-full animate-ping opacity-60"></div>
                </div>
                
                {/* Hex Input */}
                <div className="flex-1">
                  <Input
                    value={welcomeSettings.leaveMessage.color}
                    onChange={(e) => setWelcomeSettings({
                      ...welcomeSettings, 
                      leaveMessage: {...welcomeSettings.leaveMessage, color: e.target.value}
                    })}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-red-400 font-mono"
                    placeholder="0xFF6B6B"
                  />
                </div>

                {/* Color Preview */}
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                  style={{
                    backgroundColor: welcomeSettings.leaveMessage.color.startsWith('0x') ? `#${welcomeSettings.leaveMessage.color.slice(2)}` : welcomeSettings.leaveMessage.color.startsWith('#') ? welcomeSettings.leaveMessage.color : '#FF6B6B',
                    filter: 'drop-shadow(0 0 8px rgba(255, 107, 107, 0.3))'
                  }}
                >
                  👋
                </div>
              </div>
              
              {/* Preset Colors für Abschied */}
              <div className="mt-3">
                <p className="text-xs text-dark-muted mb-2">Beliebte Abschiedsfarben:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { name: 'Rot', color: '0xFF6B6B' },
                    { name: 'Orange', color: '0xFF8E53' },
                    { name: 'Grau', color: '0x95A5A6' },
                    { name: 'Blau', color: '0x74B9FF' },
                    { name: 'Lila', color: '0xA29BFE' },
                    { name: 'Dunkelrot', color: '0xD63031' },
                    { name: 'Violett', color: '0x6C5CE7' },
                    { name: 'Rosa', color: '0xFD79A8' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setWelcomeSettings({
                        ...welcomeSettings, 
                        leaveMessage: {...welcomeSettings.leaveMessage, color: preset.color}
                      })}
                      className="w-8 h-8 rounded-lg border border-purple-primary/30 hover:border-red-400 transition-all duration-300 hover:scale-110 relative group"
                      style={{
                        backgroundColor: `#${preset.color.slice(2)}`,
                        filter: 'drop-shadow(0 0 4px rgba(255, 107, 107, 0.2))'
                      }}
                      title={preset.name}
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Leave Message Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Titel</label>
              <div className="relative">
                <Input
                  value={welcomeSettings.leaveMessage.title}
                  onChange={(e) => setWelcomeSettings({
                    ...welcomeSettings, 
                    leaveMessage: {...welcomeSettings.leaveMessage, title: e.target.value}
                  })}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-red-400 pr-10"
                  placeholder="👋 Tschüss!"
                />
                <button
                  onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'leaveTitle' ? null : 'leaveTitle')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-red-400 transition-colors duration-200 hover:scale-110"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Beschreibung</label>
              <div className="relative">
                <Textarea
                  value={welcomeSettings.leaveMessage.description}
                  onChange={(e) => setWelcomeSettings({
                    ...welcomeSettings, 
                    leaveMessage: {...welcomeSettings.leaveMessage, description: e.target.value}
                  })}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-red-400 pr-10"
                  placeholder="**{user}** hat den Server verlassen. Auf Wiedersehen!"
                  rows={3}
                />
                <button
                  onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'leaveDescription' ? null : 'leaveDescription')}
                  className="absolute right-2 top-2 text-dark-muted hover:text-red-400 transition-colors duration-200 hover:scale-110"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-dark-muted mt-1">
                Verfügbare Platzhalter: <code>{'{user}'}</code>, <code>{'{server}'}</code>, <code>{'{memberCount}'}</code>
              </p>
            </div>
          </div>

          {/* Leave Message Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
              <h4 className="text-sm font-medium text-dark-text mb-3 flex items-center gap-2">
                👋 Abschiedseinstellungen
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="leaveMentionUser"
                    checked={welcomeSettings.leaveMessage.mentionUser}
                    onChange={(e) => setWelcomeSettings({
                      ...welcomeSettings, 
                      leaveMessage: {...welcomeSettings.leaveMessage, mentionUser: e.target.checked}
                    })}
                    className="w-4 h-4 text-red-400 bg-dark-bg border-purple-primary/30 rounded focus:ring-red-400 focus:ring-2"
                  />
                  <label htmlFor="leaveMentionUser" className="text-sm text-dark-text">
                    Benutzer erwähnen (@user)
                  </label>
                </div>
                <div>
                  <label className="text-xs text-dark-muted mb-1 block">Nachricht löschen nach (Sekunden, 0 = nie)</label>
                  <Input
                    type="number"
                    value={welcomeSettings.leaveMessage.deleteAfter}
                    onChange={(e) => setWelcomeSettings({
                      ...welcomeSettings, 
                      leaveMessage: {...welcomeSettings.leaveMessage, deleteAfter: parseInt(e.target.value) || 0}
                    })}
                    className="bg-dark-bg border-purple-primary/30 text-dark-text focus:border-red-400"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
              <h4 className="text-sm font-medium text-dark-text mb-3 flex items-center gap-2">
                📊 Schnell-Vorlagen
              </h4>
              <div className="space-y-2">
                {[
                  {
                    name: '😢 Traurig',
                    title: '😢 Schade!',
                    description: '**{user}** hat uns verlassen. Wir werden dich vermissen! 💔',
                    color: '0xFF6B6B'
                  },
                  {
                    name: '👋 Neutral',
                    title: '👋 Tschüss!',
                    description: '**{user}** hat den Server verlassen. Auf Wiedersehen! 🖐️',
                    color: '0x95A5A6'
                  },
                  {
                    name: '🌟 Positiv',
                    title: '🌟 Alles Gute!',
                    description: '**{user}** geht eigene Wege. Wir wünschen alles Gute! ✨',
                    color: '0xFDCB6E'
                  }
                ].map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setWelcomeSettings({
                      ...welcomeSettings,
                      leaveMessage: {
                        ...welcomeSettings.leaveMessage,
                        title: template.title,
                        description: template.description,
                        color: template.color
                      }
                    })}
                    className="w-full text-left px-3 py-2 rounded-lg bg-dark-bg/70 hover:bg-purple-primary/20 border border-purple-primary/20 hover:border-red-400/50 transition-all duration-300 text-xs"
                  >
                    <span className="font-bold text-red-400">{template.name}</span>
                    <div className="text-dark-muted mt-1 truncate">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button 
          onClick={testWelcomeMessage}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
        >
          <Send className="w-5 h-5 mr-2" />
          Test-Willkommensnachricht
        </Button>

        {/* Test Leave Message Button - nur anzeigen wenn aktiviert */}
        {welcomeSettings.leaveMessage.enabled && (
          <Button 
            onClick={testLeaveMessage}
            className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
          >
            👋 Test-Abschiedsnachricht
          </Button>
        )}
        
        <Button 
          onClick={() => setPreviewMode(!previewMode)}
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
        >
          <Eye className="w-5 h-5 mr-2" />
          {previewMode ? 'Preview verbergen' : 'Preview anzeigen'}
        </Button>
        
        <Button 
          onClick={saveWelcomeSettings}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-neon-strong transition-all duration-300 hover:scale-105 text-lg"
        >
          💾 Einstellungen speichern
        </Button>
      </div>

      {/* Preview */}
      {previewMode && (
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-pink-400/30 shadow-pink-glow animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Eye className="w-5 h-5 text-pink-400" />
              Willkommensnachricht Preview
            </CardTitle>
            <CardDescription className="text-dark-muted">
              So wird deine Willkommensnachricht aussehen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="bg-dark-bg/70 rounded-xl p-6 border-l-4 max-w-md"
              style={{
                borderLeftColor: welcomeSettings.color.startsWith('0x') ? `#${welcomeSettings.color.slice(2)}` : welcomeSettings.color
              }}
            >
              
              {/* Title */}
              <h3 className="font-bold text-lg text-dark-text mb-4">
                {welcomeSettings.title}
              </h3>

              {/* Main Welcome Image - Large Display */}
              {welcomeSettings.thumbnail === 'custom' && (
                <div className="mb-4">
                  <div className="w-full max-w-sm mx-auto rounded-xl overflow-hidden border-2 border-purple-primary/30 bg-dark-bg shadow-purple-glow">
                    {welcomeSettings.imageRotation?.enabled && uploadedImages.length > 1 ? (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center text-center p-4">
                        <div>
                          <div className="text-4xl mb-2">🎲</div>
                          <div className="text-white font-bold text-sm mb-1">Zufällige Bilder aktiviert</div>
                          <div className="text-xs text-dark-muted">
                            Jedes neue Mitglied bekommt ein<br/>
                            zufälliges Bild aus {uploadedImages.length} verfügbaren
                          </div>
                        </div>
                      </div>
                    ) : welcomeSettings.customThumbnail ? (
                      <img 
                        src={welcomeSettings.customThumbnail} 
                        alt="Welcome Image" 
                        className="w-full h-48 object-contain bg-gradient-to-br from-gray-800/50 to-gray-900/50"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-48 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white">🖼️ Bild konnte nicht geladen werden</div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white">
                        🖼️ Kein Bild ausgewählt
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-dark-muted text-center mt-2">
                    {welcomeSettings.imageRotation?.enabled && uploadedImages.length > 1 
                      ? "Die Bild-Rotation ist aktiv - jedes Mitglied bekommt ein zufälliges Bild"
                      : "So wird Ihr Willkommensbild in Discord angezeigt"
                    }
                  </p>
                </div>
              )}

              {/* Small Thumbnail Preview für user/server */}
              {(welcomeSettings.thumbnail === 'user' || welcomeSettings.thumbnail === 'server') && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0">
                    {welcomeSettings.thumbnail === 'user' && (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                        TU
                      </div>
                    )}
                    {welcomeSettings.thumbnail === 'server' && (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        🏠
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-dark-muted">
                    {welcomeSettings.thumbnail === 'user' ? 'Benutzer-Avatar wird als kleines Thumbnail angezeigt' : 'Server-Icon wird als kleines Thumbnail angezeigt'}
                  </div>
                </div>
              )}
              
              <p className="text-dark-text mb-4">
                {welcomeSettings.description
                  .replace('{user}', '@TestUser')
                  .replace('{server}', 'Mein Discord Server')
                  .replace('{memberCount}', '123')}
              </p>
              {welcomeSettings.fields.map((field, index) => (
                <div key={index} className={`mb-3 ${field.inline ? 'inline-block w-1/2 pr-2' : 'block'}`}>
                  <h4 className="font-semibold text-sm text-dark-text">{field.name}</h4>
                  <p className="text-xs text-dark-muted">{field.value}</p>
                </div>
              ))}
              {welcomeSettings.footer && (
                <div className="text-xs text-dark-muted mt-4 pt-2 border-t border-purple-primary/20">
                  {welcomeSettings.footer
                    .replace('{memberCount}', '123')
                    .replace('{server}', 'Mein Discord Server')}
                </div>
              )}
            </div>

            {/* Leave Message Preview - nur wenn aktiviert */}
            {welcomeSettings.leaveMessage.enabled && (
              <div className="mt-8 pt-6 border-t border-red-400/20">
                <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  👋 Abschiedsnachricht Preview
                </h4>
                <div 
                  className="bg-dark-bg/70 rounded-xl p-6 border-l-4 max-w-md"
                  style={{
                    borderLeftColor: welcomeSettings.leaveMessage.color.startsWith('0x') ? `#${welcomeSettings.leaveMessage.color.slice(2)}` : welcomeSettings.leaveMessage.color
                  }}
                >
                  <h3 className="font-bold text-lg text-dark-text mb-4">
                    {welcomeSettings.leaveMessage.title}
                  </h3>
                  
                  <p className="text-dark-text mb-4">
                    {welcomeSettings.leaveMessage.description
                      .replace('{user}', '@TestUser')
                      .replace('{server}', 'Mein Discord Server')
                      .replace('{memberCount}', '122')}
                  </p>

                  <div className="text-xs text-dark-muted pt-2 border-t border-red-400/20">
                    Mitglied verlassen • {welcomeSettings.leaveMessage.channelName ? `#${welcomeSettings.leaveMessage.channelName}` : '#verlassen'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-md mx-4 shadow-purple-glow transform transition-all duration-300 scale-100">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-dark-text mb-2">
                {deleteModal.type === 'single' ? 'Bild löschen' : 'Alle Bilder löschen'}
              </h3>
              
              {/* Message */}
              <p className="text-dark-muted mb-6">
                {deleteModal.type === 'single' 
                  ? `Möchten Sie das Bild "${deleteModal.filename}" wirklich löschen?`
                  : `Möchten Sie wirklich ALLE ${uploadedImages.length} hochgeladenen Bilder löschen? Diese Aktion kann nicht rückgängig gemacht werden!`
                }
              </p>
              
              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteModal({ show: false, filename: '', type: 'single' })}
                  className="px-6 py-2 bg-dark-bg border border-purple-primary/30 text-dark-text rounded-lg hover:bg-dark-bg/70 transition-all duration-200"
                >
                  Abbrechen
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteModal.type === 'single' ? 'Löschen' : 'Alle löschen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Overlays */}
      {emojiPickerOpen === 'title' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setWelcomeSettings({...welcomeSettings, title: welcomeSettings.title + emoji});
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'description' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setWelcomeSettings({...welcomeSettings, description: welcomeSettings.description + emoji});
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'leaveTitle' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setWelcomeSettings({
                  ...welcomeSettings, 
                  leaveMessage: {...welcomeSettings.leaveMessage, title: welcomeSettings.leaveMessage.title + emoji}
                });
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'leaveDescription' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setWelcomeSettings({
                  ...welcomeSettings, 
                  leaveMessage: {...welcomeSettings.leaveMessage, description: welcomeSettings.leaveMessage.description + emoji}
                });
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default Welcome