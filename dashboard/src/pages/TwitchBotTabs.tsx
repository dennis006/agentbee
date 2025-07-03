// Tab Render Functions werden in separaten Aufrufen hinzugefügt...
};

// Overview Tab Render Function
function renderOverviewTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bot Status Card */}
      <Card className="bg-dark-card border-purple-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Bot Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Status:</span>
            <Badge variant={stats.isConnected ? 'default' : 'outline'}>
              {stats.isConnected ? '🟢 Online' : '🔴 Offline'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Uptime:</span>
            <span className="text-sm">{stats.uptime}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Bot Name:</span>
            <span className="text-sm font-medium">{settings.botUsername || 'Nicht konfiguriert'}</span>
          </div>
          <div className="pt-2">
            <Button 
              onClick={toggleBot}
              className={`w-full ${settings.botEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {settings.botEnabled ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Bot Stoppen
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Bot Starten
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card className="bg-dark-card border-purple-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Statistiken
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-primary">{stats.totalChannels}</div>
              <div className="text-xs text-gray-400">Gesamt Channels</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{stats.activeChannels}</div>
              <div className="text-xs text-gray-400">Aktive Channels</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{stats.messagesLast24h}</div>
              <div className="text-xs text-gray-400">Nachrichten 24h</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">{stats.commandsUsedLast24h}</div>
              <div className="text-xs text-gray-400">Commands 24h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card className="bg-dark-card border-purple-primary/20 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => setActiveTab('stream-events')}
              className="flex flex-col gap-2 h-auto py-4"
            >
              <Video className="w-6 h-6" />
              <span>Stream Events</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('channels')}
              className="flex flex-col gap-2 h-auto py-4"
            >
              <Hash className="w-6 h-6" />
              <span>Channels</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('commands')}
              className="flex flex-col gap-2 h-auto py-4"
            >
              <MessageSquare className="w-6 h-6" />
              <span>Commands</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('settings')}
              className="flex flex-col gap-2 h-auto py-4"
            >
              <Settings className="w-6 h-6" />
              <span>Einstellungen</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Stream Events Tab Render Function
function renderStreamEventsTab() {
  const saveStreamSettings = async () => {
    try {
      const res = await fetch('/api/twitch-bot/stream-events/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamSettings)
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess('Stream Events Einstellungen gespeichert!');
        loadData(); // Reload data
      } else {
        showError(data.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      showError('Fehler beim Speichern der Stream Events');
    }
  };

  const triggerStreamStart = async () => {
    try {
      const res = await fetch('/api/twitch-bot/stream-events/trigger/start', {
        method: 'POST'
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess(data.message);
        loadData(); // Reload history
      } else {
        showError(data.error || 'Fehler beim Senden');
      }
    } catch (error) {
      console.error('❌ Fehler beim Stream-Start:', error);
      showError('Fehler beim Triggern des Stream-Starts');
    }
  };

  const triggerStreamEnd = async () => {
    try {
      const res = await fetch('/api/twitch-bot/stream-events/trigger/end', {
        method: 'POST'
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess(data.message);
        loadData(); // Reload history
      } else {
        showError(data.error || 'Fehler beim Senden');
      }
    } catch (error) {
      console.error('❌ Fehler beim Stream-Ende:', error);
      showError('Fehler beim Triggern des Stream-Endes');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stream Start/End Messages */}
      <Card className="bg-dark-card border-purple-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Stream Start/Ende Nachrichten
          </CardTitle>
          <CardDescription>
            Automatische Nachrichten wenn der Stream startet oder endet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stream Start */}
          <div className="space-y-4 p-4 bg-dark-bg rounded-lg border border-green-500/20">
            <div className="flex items-center gap-3">
              <Switch
                id="stream-start"
                checked={streamSettings.streamStartEnabled}
                onCheckedChange={(checked) => setStreamSettings(prev => ({ ...prev, streamStartEnabled: checked }))}
              />
              <Label htmlFor="stream-start" className="text-green-400 font-medium">
                🟢 Stream-Start Nachrichten aktivieren
              </Label>
            </div>
            
            {streamSettings.streamStartEnabled && (
              <div className="space-y-4 ml-8">
                <div>
                  <Label className="text-sm text-gray-400 mb-2 block">Stream-Start Nachricht:</Label>
                  <Textarea
                    value={streamSettings.streamStartMessage}
                    onChange={(e) => setStreamSettings(prev => ({ ...prev, streamStartMessage: e.target.value }))}
                    placeholder="🔴 Stream startet! Lasst uns Spaß haben! 🎮"
                    rows={2}
                    className="bg-dark-bg border-green-500/30 focus:border-green-400"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-400 mb-2 block">Verzögerung (Sekunden):</Label>
                  <Input
                    type="number"
                    value={streamSettings.streamStartDelay}
                    onChange={(e) => setStreamSettings(prev => ({ ...prev, streamStartDelay: parseInt(e.target.value) || 30 }))}
                    className="bg-dark-bg border-green-500/30 focus:border-green-400 w-32"
                    min="0"
                    max="300"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Wartezeit bevor die Nachricht gesendet wird
                  </p>
                </div>

                <Button
                  onClick={triggerStreamStart}
                  variant="outline"
                  className="border-green-500 text-green-400 hover:bg-green-500/20"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Stream-Start Test
                </Button>
              </div>
            )}
          </div>

          {/* Stream End */}
          <div className="space-y-4 p-4 bg-dark-bg rounded-lg border border-red-500/20">
            <div className="flex items-center gap-3">
              <Switch
                id="stream-end"
                checked={streamSettings.streamEndEnabled}
                onCheckedChange={(checked) => setStreamSettings(prev => ({ ...prev, streamEndEnabled: checked }))}
              />
              <Label htmlFor="stream-end" className="text-red-400 font-medium">
                🔴 Stream-Ende Nachrichten aktivieren
              </Label>
            </div>
            
            {streamSettings.streamEndEnabled && (
              <div className="space-y-4 ml-8">
                <div>
                  <Label className="text-sm text-gray-400 mb-2 block">Stream-Ende Nachricht:</Label>
                  <Textarea
                    value={streamSettings.streamEndMessage}
                    onChange={(e) => setStreamSettings(prev => ({ ...prev, streamEndMessage: e.target.value }))}
                    placeholder="📴 Stream beendet! Danke fürs Zuschauen! ❤️"
                    rows={2}
                    className="bg-dark-bg border-red-500/30 focus:border-red-400"
                  />
                </div>

                <Button
                  onClick={triggerStreamEnd}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/20"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Stream-Ende Test
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-purple-primary/20">
            <Button onClick={saveStreamSettings} className="bg-purple-primary hover:bg-purple-primary/80">
              <Save className="w-4 h-4 mr-2" />
              Einstellungen speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Events */}
      <Card className="bg-dark-card border-purple-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="w-5 h-5" />
            Interaktive Events
          </CardTitle>
          <CardDescription>
            Automatische Nachrichten bei Follows, Subs, Raids etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Follow Messages */}
          <div className="space-y-3 p-4 bg-dark-bg rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Switch
                id="follow-msg"
                checked={streamSettings.followMessageEnabled}
                onCheckedChange={(checked) => setStreamSettings(prev => ({ ...prev, followMessageEnabled: checked }))}
              />
              <Label htmlFor="follow-msg" className="text-purple-400 font-medium">
                💜 Follow Nachrichten
              </Label>
            </div>
            {streamSettings.followMessageEnabled && (
              <Textarea
                value={streamSettings.followMessage}
                onChange={(e) => setStreamSettings(prev => ({ ...prev, followMessage: e.target.value }))}
                placeholder="💜 Danke für den Follow {username}! 🙏"
                rows={2}
                className="bg-dark-bg border-purple-500/30 focus:border-purple-400 ml-8"
              />
            )}
          </div>

          {/* Subscription Messages */}
          <div className="space-y-3 p-4 bg-dark-bg rounded-lg border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <Switch
                id="sub-msg"
                checked={streamSettings.subMessageEnabled}
                onCheckedChange={(checked) => setStreamSettings(prev => ({ ...prev, subMessageEnabled: checked }))}
              />
              <Label htmlFor="sub-msg" className="text-yellow-400 font-medium">
                👑 Subscription Nachrichten
              </Label>
            </div>
            {streamSettings.subMessageEnabled && (
              <Textarea
                value={streamSettings.subMessage}
                onChange={(e) => setStreamSettings(prev => ({ ...prev, subMessage: e.target.value }))}
                placeholder="🎉 {username} ist jetzt Subscriber! Willkommen in der Familie! 👑"
                rows={2}
                className="bg-dark-bg border-yellow-500/30 focus:border-yellow-400 ml-8"
              />
            )}
          </div>

          {/* Raid Messages */}
          <div className="space-y-3 p-4 bg-dark-bg rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-3">
              <Switch
                id="raid-msg"
                checked={streamSettings.raidMessageEnabled}
                onCheckedChange={(checked) => setStreamSettings(prev => ({ ...prev, raidMessageEnabled: checked }))}
              />
              <Label htmlFor="raid-msg" className="text-orange-400 font-medium">
                ⚡ Raid Nachrichten
              </Label>
            </div>
            {streamSettings.raidMessageEnabled && (
              <Textarea
                value={streamSettings.raidMessage}
                onChange={(e) => setStreamSettings(prev => ({ ...prev, raidMessage: e.target.value }))}
                placeholder="⚡ Raid incoming! Willkommen {raiders}! 🎉"
                rows={2}
                className="bg-dark-bg border-orange-500/30 focus:border-orange-400 ml-8"
              />
            )}
          </div>

          {/* Donation Messages */}
          <div className="space-y-3 p-4 bg-dark-bg rounded-lg border border-green-500/20">
            <div className="flex items-center gap-3">
              <Switch
                id="donation-msg"
                checked={streamSettings.donationMessageEnabled}
                onCheckedChange={(checked) => setStreamSettings(prev => ({ ...prev, donationMessageEnabled: checked }))}
              />
              <Label htmlFor="donation-msg" className="text-green-400 font-medium">
                💰 Donation Nachrichten
              </Label>
            </div>
            {streamSettings.donationMessageEnabled && (
              <Textarea
                value={streamSettings.donationMessage}
                onChange={(e) => setStreamSettings(prev => ({ ...prev, donationMessage: e.target.value }))}
                placeholder="💰 Wow! {username} hat {amount} gespendet! Vielen Dank! 🙏"
                rows={2}
                className="bg-dark-bg border-green-500/30 focus:border-green-400 ml-8"
              />
            )}
          </div>

          <div className="pt-4 border-t border-purple-primary/20">
            <Button onClick={saveStreamSettings} className="bg-purple-primary hover:bg-purple-primary/80">
              <Save className="w-4 h-4 mr-2" />
              Alle Events speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event History */}
      <Card className="bg-dark-card border-purple-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Event Historie
          </CardTitle>
          <CardDescription>
            Letzte Stream Events (max. 50)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {streamEvents.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Noch keine Events vorhanden</p>
            ) : (
              streamEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      event.type.includes('start') ? 'bg-green-400' : 
                      event.type.includes('end') ? 'bg-red-400' : 'bg-blue-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">
                        {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      {event.data.channels_count && (
                        <p className="text-xs text-gray-400">
                          {event.data.channels_count} Channels
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleString('de-DE')}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Tab Render Function
function renderSettingsTab() {
  const saveSettings = async () => {
    try {
      const res = await fetch('/api/twitch-bot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess('Bot-Einstellungen erfolgreich gespeichert!');
      } else {
        showError(data.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      showError('Fehler beim Speichern der Einstellungen');
    }
  };

  return (
    <Card className="bg-dark-card border-purple-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Bot-Einstellungen
        </CardTitle>
        <CardDescription>
          Grundlegende Konfiguration des Twitch Bots
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bot Name & OAuth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-400 mb-2 block">Bot Username:</Label>
            <Input
              value={settings.botUsername}
              onChange={(e) => setSettings(prev => ({ ...prev, botUsername: e.target.value }))}
              placeholder="AgentBeeBot"
              className="bg-dark-bg border-purple-primary/30"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-400 mb-2 block">
              OAuth Token:
              <a href="https://twitchapps.com/tmi/" target="_blank" rel="noopener noreferrer" className="text-purple-primary hover:underline ml-2">
                Token generieren <Link className="w-3 h-3 inline" />
              </a>
            </Label>
            <Input
              type="password"
              value={settings.oauthToken}
              onChange={(e) => setSettings(prev => ({ ...prev, oauthToken: e.target.value }))}
              placeholder="oauth:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="bg-dark-bg border-purple-primary/30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Kann auch als Railway Environment Variable gesetzt werden: TWITCH_BOT_OAUTH
            </p>
          </div>
        </div>

        {/* Bot Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="auto-connect"
                checked={settings.autoConnect}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoConnect: checked }))}
              />
              <Label htmlFor="auto-connect">Automatisches Verbinden</Label>
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                id="mod-only"
                checked={settings.modCommandsOnly}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, modCommandsOnly: checked }))}
              />
              <Label htmlFor="mod-only">Nur Moderator Commands</Label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Command Prefix:</Label>
              <Input
                value={settings.commandPrefix}
                onChange={(e) => setSettings(prev => ({ ...prev, commandPrefix: e.target.value }))}
                placeholder="!"
                className="bg-dark-bg border-purple-primary/30 w-20"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Global Cooldown (Sekunden):</Label>
              <Input
                type="number"
                value={settings.globalCooldown}
                onChange={(e) => setSettings(prev => ({ ...prev, globalCooldown: parseInt(e.target.value) || 3 }))}
                className="bg-dark-bg border-purple-primary/30 w-32"
                min="0"
                max="60"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-purple-primary/20">
          <Button onClick={saveSettings} className="bg-purple-primary hover:bg-purple-primary/80">
            <Save className="w-4 h-4 mr-2" />
            Einstellungen speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Channels Tab Render Function
function renderChannelsTab() {
  const addChannel = async () => {
    if (!newChannel.channelName.trim()) {
      showError('Bitte gib einen Channel-Namen ein');
      return;
    }

    try {
      const res = await fetch('/api/twitch-bot/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel)
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess('Channel erfolgreich hinzugefügt!');
        setNewChannel({ channelName: '', discordChannelId: '', syncMessages: false });
        loadData();
      } else {
        showError(data.error || 'Fehler beim Hinzufügen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen:', error);
      showError('Fehler beim Hinzufügen des Channels');
    }
  };

  const removeChannel = async (channelId: string) => {
    try {
      const res = await fetch(`/api/twitch-bot/channels/${channelId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess('Channel erfolgreich entfernt!');
        loadData();
      } else {
        showError(data.error || 'Fehler beim Entfernen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Entfernen:', error);
      showError('Fehler beim Entfernen des Channels');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Channel */}
      <Card className="bg-dark-card border-purple-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Channel hinzufügen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              value={newChannel.channelName}
              onChange={(e) => setNewChannel(prev => ({ ...prev, channelName: e.target.value }))}
              placeholder="TwitchChannel (ohne #)"
              className="bg-dark-bg border-purple-primary/30"
            />
            <Input
              value={newChannel.discordChannelId}
              onChange={(e) => setNewChannel(prev => ({ ...prev, discordChannelId: e.target.value }))}
              placeholder="Discord Channel ID (optional)"
              className="bg-dark-bg border-purple-primary/30"
            />
            <Button onClick={addChannel} className="bg-purple-primary hover:bg-purple-primary/80">
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channels List */}
      <Card className="bg-dark-card border-purple-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Aktive Channels ({channels.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {channels.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Noch keine Channels hinzugefügt</p>
            ) : (
              channels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-purple-primary/10">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${channel.enabled ? 'bg-green-400' : 'bg-gray-400'}`} />
                    <div>
                      <div className="font-medium">#{channel.channelName}</div>
                      {channel.discordChannelId && (
                        <div className="text-sm text-gray-400">Discord: {channel.discordChannelId}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={channel.enabled ? 'default' : 'outline'}>
                      {channel.enabled ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeChannel(channel.id)}
                      className="text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Commands Tab Render Function
function renderCommandsTab() {
  return (
    <Card className="bg-dark-card border-purple-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Custom Commands
        </CardTitle>
        <CardDescription>
          Benutzerdefinierte Bot-Commands (Coming Soon)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Custom Commands</h3>
          <p className="text-gray-400 mb-4">
            Diese Funktion wird in einem zukünftigen Update verfügbar sein.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• Eigene Commands erstellen</p>
            <p>• Cooldowns konfigurieren</p>
            <p>• Moderator-only Commands</p>
            <p>• Verwendungsstatistiken</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Moderators Tab Render Function
function renderModeratorsTab() {
  return (
    <Card className="bg-dark-card border-purple-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Bot Moderatoren
        </CardTitle>
        <CardDescription>
          Moderator-Verwaltung für den Bot (Coming Soon)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Moderator System</h3>
          <p className="text-gray-400 mb-4">
            Diese Funktion wird in einem zukünftigen Update verfügbar sein.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• Bot-Moderatoren hinzufügen</p>
            <p>• Berechtigungen verwalten</p>
            <p>• Event-Trigger Zugriff</p>
            <p>• Command-Management</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Toggle Bot Function
const toggleBot = async () => {
  try {
    const res = await fetch('/api/twitch-bot/toggle', {
      method: 'POST'
    });

    const data = await res.json();
    
    if (data.success) {
      showSuccess(data.message);
      loadData(); // Reload data to update status
    } else {
      showError(data.error || 'Fehler beim Umschalten');
    }
  } catch (error) {
    console.error('❌ Fehler beim Umschalten:', error);
    showError('Fehler beim Umschalten des Bots');
  }
};

export default TwitchBotTabs; 