// BACKUP - Dieser separate API Server wird nicht mehr gebraucht
// Der Bot (index.js) hat jetzt einen integrierten API Server

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

// Diese Datei ist nur als Backup hier - verwende den integrierten API Server im Bot! 