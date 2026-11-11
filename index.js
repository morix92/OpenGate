const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// L'AppID ufficiale della web app v2 di eWeLink
const APP_ID = 'K0OCDSvIaBWdEaU4zxlKEwk26kmshoXK';
const CONFIG_FILE = path.join(__dirname, 'config.json');

app.use(express.static(path.join(__dirname, 'public')));

// Funzione per leggere la configurazione completa da file
function getConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Funzione per aggiornare i token nel file di configurazione mantenendo il deviceId intatto
function saveTokens(newAt, newRt) {
  const current = getConfig() || {};
  const updatedConfig = {
    deviceId: current.deviceId || "",
    at: newAt,
    rt: newRt || current.rt
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
  console.log('🔄 Token aggiornati e salvati con successo in config.json');
}

// Funzione di refresh v2 (AT nell'header, RT nel body)
async function refreshAccessToken(at, rt) {
  console.log('⏳ Richiesta rinnovo token al cloud...');
  
  const response = await fetch('https://eu-apia.coolkit.cc/v2/user/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CK-Appid': APP_ID,
      'Authorization': `Bearer ${at}`
    },
    body: JSON.stringify({ rt })
  });

  const data = await response.json();
  
  if (data.error === 0 && data.data && data.data.at) {
    saveTokens(data.data.at, data.data.rt);
    return data.data.at;
  } else {
    throw new Error(`Errore refresh: ${JSON.stringify(data)}`);
  }
}

// Funzione per inviare il comando di apertura al dispositivo
async function sendOpenCommand(token, deviceId) {
  const response = await fetch(`https://eu-apia.coolkit.cc/v2/device/thing/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-CK-Appid': APP_ID
    },
    body: JSON.stringify({
      type: 1,
      id: deviceId,
      params: { switches: [{ switch: 'on', outlet: 0 }] }
    })
  });
  return await response.json();
}

// Rotta API per azionare il cancello
app.get('/api/apri', async (req, res) => {
  try {
    console.log('Ricevuta richiesta di apertura cancello...');
    
    const config = getConfig();
    if (!config || !config.deviceId || !config.at || !config.rt) {
      return res.status(500).json({ 
        success: false, 
        error: 'Configurazione incompleta in config.json (Verifica deviceId, at e rt).' 
      });
    }

    // 1. Tentiamo l'invio del comando con l'Access Token corrente
    let result = await sendOpenCommand(config.at, config.deviceId);

    // 2. Se l'AT è scaduto, avviamo il refresh automatico usando l'RT
    if (result.error !== 0) {
      console.log('⚠️ Token rifiutato dal cloud, avvio auto-refresh...');
      try {
        const newAt = await refreshAccessToken(config.at, config.rt);
        // Riproponiamo il comando con il nuovo token fresco
        result = await sendOpenCommand(newAt, config.deviceId);
      } catch (refreshErr) {
        return res.status(401).json({ success: false, error: `Impossibile rinnovare la sessione: ${refreshErr.message}` });
      }
    }

    if (result.error === 0) {
      console.log('✅ Cancello aperto con successo!');
      res.json({ success: true, message: 'Cancello aperto con successo!' });
    } else {
      res.status(400).json({ success: false, error: `Errore eWeLink: ${result.msg || result.error}` });
    }

  } catch (error) {
    console.error('❌ Errore critico:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nServer del Cancello attivo su http://localhost:${PORT}`);
});