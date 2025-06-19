const express = require('express');
const settingsManager = require('./settings-manager');
const router = express.Router();

// GET /api/settings/{module} - Lade Settings
router.get('/api/settings/:module', async (req, res) => {
  try {
    const { module } = req.params;
    console.log(`📂 Lade Settings für: ${module}`);
    
    let settings = settingsManager.getCachedSettings(module);
    if (!settings) {
      settings = await settingsManager.loadSettings(module);
    }
    
    if (settings) {
      res.json({
        success: true,
        settings: settings,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Keine Settings für ${module} gefunden`
      });
    }
  } catch (error) {
    console.error(`❌ Fehler beim Laden:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/settings/{module} - Speichere Settings
router.post('/api/settings/:module', async (req, res) => {
  try {
    const { module } = req.params;
    const newSettings = req.body;
    
    console.log(`💾 Speichere Settings für: ${module}`);
    
    const validation = settingsManager.validateSettings(module, newSettings);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    
    const result = await settingsManager.updateSettings(module, newSettings);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Settings für ${module} gespeichert`,
        settings: result.settings,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`❌ Fehler beim Speichern:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 