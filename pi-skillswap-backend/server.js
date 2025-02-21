const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- MECCANISMI ANTI-SPAM ---------- //

// Rate limiting: massimo 100 richieste per ora per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 100,
  message: "Troppi tentativi, riprova tra un'ora"
});
app.use('/api/', apiLimiter);

// Middleware Challenge-Response (simulazione CAPTCHA)
const captchaMiddleware = (req, res, next) => {
  if (req.body.suspicious || req.body.captchaRequired) {
    if (req.body.captchaToken === "valido") {
      next();
    } else {
      return res.status(429).json({ error: "Captcha non valido" });
    }
  } else {
    next();
  }
};

// Middleware per monitorare il comportamento degli utenti
const monitorBehavior = (req, res, next) => {
  console.log(`User ${req.ip} -> ${req.method} ${req.url}`);
  // Qui si potrebbe salvare il log in un sistema esterno per analisi
  next();
};
app.use(monitorBehavior);

// ---------- SIMULAZIONE DATABASE (in memoria) ---------- //

let profiles = {};         // key: userId, value: { possessed, desired, reputation }
let exchanges = [];        // array degli scambi
let disputes = [];         // array contestazioni (per gestione dispute)
let notifications = [];    // array notifiche (in tempo reale)

// ---------- API DI AUTENTICAZIONE (simulata con Pi SDK) ---------- //
app.post('/api/login', (req, res) => {
  const { userId } = req.body;
  if (userId) {
    if (!profiles[userId]) {
      profiles[userId] = { possessed: [], desired: [], reputation: 0 };
    }
    res.json({ success: true, userId });
  } else {
    res.status(400).json({ error: "UserId mancante" });
  }
});

// ---------- API PER PROFILO ---------- //
app.get('/api/profile', (req, res) => {
  const userId = req.query.userId;
  res.json({ profile: profiles[userId] || {} });
});

app.post('/api/profile', captchaMiddleware, (req, res) => {
  const { userId, possessed, desired } = req.body;
  profiles[userId] = { possessed, desired, reputation: profiles[userId]?.reputation || 0 };
  res.json({ success: true, profile: profiles[userId] });
});

// ---------- MATCHING ALGORITMO TF-IDF (lato backend) ---------- //
const idfWeights = {
  "Python": 1.2,
  "Javascript": 1.5,
  "Data Analysis": 1.8,
  "UX Design": 2.0,
  "Blockchain": 2.2,
  "Machine Learning": 2.5
};

function computeMatchScore(profileA, profileB) {
  // Matching: per ogni skill posseduta da A che compare in quelle desiderate di B
  let score = 0;
  profileA.possessed.forEach(skill => {
    if (profileB.desired.includes(skill)) {
      score += idfWeights[skill] || 1;
    }
  });
  // Possiamo anche considerare il match inverso (B possiede, A desidera)
  profileB.possessed.forEach(skill => {
    if (profileA.desired.includes(skill)) {
      score += idfWeights[skill] || 1;
    }
  });
  return score;
}

// Endpoint per ottenere matching per l'utente corrente
app.get('/api/matching', (req, res) => {
  const userId = req.query.userId;
  if (!profiles[userId]) return res.status(404).json({ error: "Profilo non trovato" });
  const userProfile = profiles[userId];
  let matches = [];
  // Per ogni altro profilo, calcola punteggio di compatibilità
  Object.keys(profiles).forEach(otherId => {
    if (otherId !== userId) {
      const otherProfile = profiles[otherId];
      const score = computeMatchScore(userProfile, otherProfile);
      if (score > 0) {
        matches.push({ id: `ex-${Date.now()}-${otherId}`, partner: otherId, skill: userProfile.possessed[0] || "N/A", score });
      }
    }
  });
  // Ordina per punteggio decrescente
  matches.sort((a, b) => b.score - a.score);
  res.json({ matches });
});

// ---------- API PER GESTIONE SCAMBI ---------- //

// Creazione scambio
app.post('/api/exchange/create', captchaMiddleware, (req, res) => {
  const { userA, userB, skillOffered, skillRequested, duration, deposit } = req.body;
  // Simulazione verifica saldo tramite Pi SDK (qui si assume sempre saldo sufficiente)
  const exchange = {
    id: `exch-${Date.now()}`,
    userA,
    userB,
    partner: userB,
    skill: skillOffered,
    duration, // in minuti
    deposit,
    status: "CREATED",
    startTime: Date.now(),
    timestamp: Date.now()
  };
  exchanges.push(exchange);
  // Notifica a userB per nuovo scambio
  notifications.push({ userId: userB, message: `Nuovo scambio proposto da ${userA} per ${skillOffered}` });
  res.json({ success: true, exchange });
});

// Recupera i dettagli di uno scambio
app.get('/api/exchange/:id', (req, res) => {
  const exchange = exchanges.find(ex => ex.id === req.params.id);
  if (exchange) {
    res.json({ exchange });
  } else {
    res.status(404).json({ error: "Scambio non trovato" });
  }
});

// Aggiungi le credenziali Pi Network (da configurare nel tuo Pi Developer Portal)
const PI_API_KEY = process.env.PI_API_KEY;
const PI_WEBHOOK_KEY = process.env.PI_WEBHOOK_KEY;

// Verifica la transazione Pi
async function verifyPiPayment(txnId) {
  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${txnId}`, {
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.status === 'completed';
  } catch (error) {
    console.error('Errore nella verifica del pagamento:', error);
    return false;
  }
}

// Esecuzione scambio: verifica tempo, simula trasferimento fondi tramite Pi SDK
app.post('/api/exchange/execute', captchaMiddleware, async (req, res) => {
  const { exchangeId, txnId } = req.body;
  const exchange = exchanges.find(ex => ex.id === exchangeId);
  if (!exchange) return res.status(404).json({ error: "Scambio non trovato" });
  
  // Verifica il pagamento Pi
  const isPaymentValid = await verifyPiPayment(txnId);
  if (!isPaymentValid) {
    return res.status(400).json({ error: "Verifica pagamento Pi fallita" });
  }
  
  // Controllo tempo: scambio completabile solo se il tempo è trascorso
  if (Date.now() < exchange.startTime + exchange.duration * 60000) {
    return res.status(400).json({ error: "Scambio ancora in corso" });
  }
  
  // Simula verifica transazione con Explore Pi API
  const verified = true; // sostituire con chiamata reale a Pi API
  if (!verified) {
    return res.status(400).json({ error: "Verifica transazione fallita" });
  }
  
  // Simula trasferimenti: deduzione fee e invio fondi a Pi Charity Hub
  const totalValue = exchange.deposit * 2;
  const fee = totalValue * 0.005;
  // Simula trasferimento fondi
  exchange.status = "COMPLETED";
  exchange.timestamp = Date.now();
  
  // Notifica ad entrambi gli utenti
  notifications.push({ userId: exchange.userA, message: `Scambio ${exchange.id} completato` });
  notifications.push({ userId: exchange.userB, message: `Scambio ${exchange.id} completato` });
  
  res.json({ success: true, exchange });
});

// Storico scambi filtrato per utente (opzionale)
app.get('/api/exchange/history', (req, res) => {
  const userId = req.query.userId;
  let userExchanges = exchanges;
  if (userId) {
    userExchanges = exchanges.filter(ex => ex.userA === userId || ex.userB === userId);
  }
  res.json({ exchanges: userExchanges });
});

// ---------- API PER GESTIONE CONTESTAZIONI ---------- //

// Invia voto contestazione
app.post('/api/exchange/dispute', captchaMiddleware, (req, res) => {
  const { exchangeId, vote } = req.body;
  // Trova lo scambio
  const exchange = exchanges.find(ex => ex.id === exchangeId);
  if (!exchange) return res.status(404).json({ error: "Scambio non trovato" });
  if (exchange.status !== "COMPLETED") {
    return res.status(400).json({ error: "Solo scambi completati possono essere contestati" });
  }
  // Registra il voto nella lista delle contestazioni
  let dispute = disputes.find(d => d.exchangeId === exchangeId);
  if (!dispute) {
    dispute = { exchangeId, votes: [] };
    disputes.push(dispute);
  }
  dispute.votes.push(vote);
  res.json({ success: true, dispute });
});

// Recupera tutte le contestazioni
app.get('/api/exchange/disputes', (req, res) => {
  res.json({ disputes });
});

// Endpoint per risolvere una contestazione (chiamato dal sistema di governance)
app.post('/api/exchange/dispute/resolve', captchaMiddleware, (req, res) => {
  const { exchangeId } = req.body;
  const dispute = disputes.find(d => d.exchangeId === exchangeId);
  if (!dispute) return res.status(404).json({ error: "Contestazione non trovata" });
  
  // Semplice logica: se la maggioranza dei voti è "true", restituisci i depositi
  const votes = dispute.votes;
  const contested = votes.filter(v => v === true).length;
  const approved = contested > (votes.length / 2);
  
  const exchange = exchanges.find(ex => ex.id === exchangeId);
  if (!exchange) return res.status(404).json({ error: "Scambio non trovato" });
  
  if (approved) {
    exchange.status = "DISPUTED";
    // Simula restituzione dei fondi ai rispettivi utenti
    notifications.push({ userId: exchange.userA, message: `Contestazione approvata per scambio ${exchangeId}. Fondi restituiti.` });
    notifications.push({ userId: exchange.userB, message: `Contestazione approvata per scambio ${exchangeId}. Fondi restituiti.` });
    res.json({ success: true, message: "Contestazione risolta: fondi restituiti" });
  } else {
    res.json({ success: true, message: "Contestazione respinta, scambio confermato" });
  }
});

// ---------- NOTIFICHE IN TEMPO REALE (simulazione tramite polling) ---------- //
app.get('/api/notifications', (req, res) => {
  const userId = req.query.userId;
  const userNotifications = notifications.filter(n => n.userId === userId);
  // Resetta le notifiche dopo averle lette
  notifications = notifications.filter(n => n.userId !== userId);
  res.json({ notifications: userNotifications });
});

// ---------- AVVIO SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend in ascolto sulla porta ${PORT}`);
});
