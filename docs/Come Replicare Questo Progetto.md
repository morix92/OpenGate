## Come Replicarlo (Guida Rapida)
Se desideri replicare questo progetto per automatizzare il tuo cancello o un altro dispositivo eWeLink, ecco i passaggi fondamentali:

### 0. Requisito
Avere la disponibilità di un citofono di casa o di un qualsiasi pulsante fisico che azioni l'apertura  del cancello elettricamente

### 1. Hardware Necessario
- Un attuatore relè smart eWeLink a 1 o più canali compatibile con API v2 (il mio modello: **`CK-BL602-4SW-HS`**, acquistato su Amazon, vedi allegato).
- Un alimentatore adatto per il relè (va bene un vecchio caricabatterie per smartphone da 5v) e un cavo collegato in parallelo al pulsante fisico di apertura del citofono di casa, in modo che il contatto pulito del relè simuli la pressione del tasto (vedi allegato).

### 2. Configurazione del dispositivo
Scaricare l'app eWeLink, seguire la procedura di configurazione per connetterlo al Wi-Fi domestico e verificare che, dall'app ufficiale, il dispositivo risponda perfettamente ai comandi.

### 3. Recupero dei Token Iniziali (AT e RT)
Poiché l'endpoint di login ufficiale richiede cifratura avanzata, il modo più semplice per ottenere la prima coppia di token è:
1. Accedi da browser al sito "eWeLink Web" tramite URL: https://web.ewelink.cc
2. Apri gli strumenti per sviluppatori (cliccare sul tasto `F12` della tastiera e selezionare il tab **Network** , filtrando per la categoria "Fetch/XHR").
3. Effettua il login, individua la chiamata "login" dentro la colonna "Name", cliccaci sopra e seleziona il tab "Response": al suo interno troverai l'`at` (Access Token) e l'`rt` (Refresh Token), salvali da qualche parte.
4. Successivamente, lasciando lo strumento per sviluppatori aperto, clicca sul dispositivo di interesse (si aprirà una specie di interruttore con in alto a destra una rotellina per le impostazioni, cliccala e verifica nuovamente la colonna "Name", dovrebbe uscire una chiamata "thing", cliccaci sopra e seleziona il tab "Response": all'interno, nelle prime righe, dovresti trovare "deviceid: 100xxxxxxx"; salva anche questo dato.

### 4. Configurazione del Progetto
1. Clona la repository e installa le dipendenze (assicurati di avere **Node.js** installato):
   
```bash
npm install express node-fetch
```
2. Modifica il file "config.json" inserendo "at", "rt" e "deviceid" recuperati nel punto 3.3 e 3.4
3. Lancia il server con il comando 
```bash
node index.js
```
4. Vai sul browser del pc dove gira il server all'indirizzo http://localhost:3000 e vedrai un pulsante che, una volta cliccato aprirà il cancello.

**Nota**: Per l'accesso da altri dispositivi su rete LAN è sufficiente puntare non più all'indirizzo http://localhost:3000 ma a http://hostName:3000 (dove hostName deve essere recuperato dal pannello admin del proprio router).
Per accesso dall'esterno è necessario scaricare Tailscale sia sul pc dove gira il server che su tutti gli altri dispositivi che si intende utilizzare e registrare questi dispositivi sotto un unico profilo (così da creare una sottorete privata senza esporre il server dall'esterno)