# OpenGate
**App per il controllo smart condiviso di un cancello elettrico condominiale**

Applicazione web leggera e autonoma sviluppata in Node.js ed Express per il controllo remoto di un attuatore relè eWeLink a 4 canali (`CK-BL602-4SW-HS`, UIID 138) collegato all'apertura di un cancello elettrico; il dispositivo è stato collegato direttamente al pulsante di apertura del cancello, situato all'interno del citofono di casa (vedi allegato 2).
Progettata per essere ospitata su un server domestico sempre acceso, l'app si interfaccia direttamente con le moderne API v2 di Coolkit (`eu-apia.coolkit.cc`).

Lo scopo è quello realizzare un'applicazione fruibile da tutti i dispositivi (smartphone, tablet, pc) che abbiano accesso ad un browser e che siano configurati sul profilo Tailscale appositamente creato o, in alternativa, che siano collegati alla stessa LAN.
**Nota**: L'alternativa a quest'app sarebbe quella di condividere l'intero account eWeLink con altre persone; con questa soluzione, invece, si ottiene un'interfaccia dedicata e sicura senza condividere le credenziali principali. Inoltre, l'accesso dall'esterno non è vincolato esclusivamente a Tailscale: si potrebbe anche optare per aprire volutamente una porta del server verso l'esterno (tramite port forwarding), rendendo l'utilizzo immediato (chiunque conosca l'URL pubblico può aprire il cancello). Per impostazione predefinita, tuttavia, è consigliato un approccio sicuro via VPN.


## Tecnologie e Strumenti Utilizzati
- **Backend & Web Server**: Node.js, Express.js (gestione del server HTTP e hosting del file statico)
- **Formato Dati & Persistenza**: unico file JSON `config.json`, per la gestione locale di credenziali e token
- **Frontend**: Un unico file `index.html` con stili CSS incorporati e script JavaScript nativo per la gestione del click e l'interazione asincrona


## Funzionalità Principali

- **Interfaccia Web Minimal**: Frontend statico server-side privo di dipendenze pesanti, ottimizzato per l'azionamento rapido da dispositivi mobili.

- **Azionamento immediato del canale relè**: il frontend mette a disposizione un pulsante che, una volta azionato, invia una richiesta asincrona al server; quest'ultimo inoltra immediatamente la chiamata POST verso l'endpoint /v2/device/thing/status (configurato con l'header X-CK-Appid e autenticazione Bearer), che aziona il dispositivo e apre il cancello.

- **Auto-Refresh Persistente** (Catena Access Token - Refresh Token): Per garantire continuità operativa senza richiedere interventi manuali o salvare password in chiaro, il backend gestisce dinamicamente il ciclo di vita della sessione su file locale (`token.json`). Quando l'Access Token (con validità 30 giorni) scade, il server intercetta l'errore di autenticazione, invoca autonomamente `/v2/user/refresh` e, utilizzando il Refresh Token che ha validità 60 giorni, aggiorna entrambi i token e completa l'esecuzione del comando in modo trasparente.

**Nota Tecnica**: La prima coppia Access Token - Refresh Token è stata recuperata dal sito "eWeLink Web" tramite gli strumenti per sviluppatore, in quanto per l'API /login erano richieste cifrature particolari e non rappresentava un vantaggio per il raggiungimento dell'obiettivo finale. 


## Modalità di Accesso
Il server è pensato per girare in background su una macchina locale sempre attiva:

**Accesso Interno (LAN)**: Qualsiasi dispositivo connesso alla rete domestica può raggiungere l'interfaccia web direttamente tramite hostname o IP locale:
```text
  http://NomeHostLocale:3000/cancello
```
  
**Accesso Esterno Sicuro (VPN / Tailscale)**: Per aprire il cancello anche fuori casa (sotto rete mobile 4G/5G) senza esporre porte su Internet tramite port forwarding, l'infrastruttura sfrutta una rete mesh VPN privata tramite Tailscale (installato sia sul server ospitante che sugli smartphone client e configurato sotto lo stesso profilo utente). 
In questo modo l'applicazione resta raggiungibile ovunque, in totale sicurezza, tramite l'IP privato assegnato dalla VPN:
```text
  http://100.x.x.x:3000/cancello
```
Oppure, configurando "Tailscale DNS", tramite il nome Host scelto su Tailscale per il server ospitante:
```text
  http://NomeHostTailscale:3000/cancello
```


## Come Replicarlo (Guida Rapida)
Se desideri replicare questo progetto per automatizzare il tuo cancello o un altro dispositivo eWeLink, ecco i passaggi fondamentali:

### 0. Requisito
Avere la disponibilità di un citofono di casa o di un qualsiasi pulsante fisico che azioni l'apertura  del cancello elettricamente

### 1. Hardware Necessario
- Un attuatore relè smart eWeLink a 1 o più canali compatibile con API v2 (il mio modello: **`CK-BL602-4SW-HS`**, acquistato su Amazon, vedi allegato 3).
- Un alimentatore adatto per il relè (va bene un vecchio caricabatterie per smartphone da 5v) e un paio di fili elettrici collegati in parallelo al pulsante fisico di apertura del citofono di casa, in modo che il contatto pulito del relè simuli la pressione del tasto (per cablaggio vedi allegato 2).

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