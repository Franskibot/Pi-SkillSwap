import React, { useState, useEffect } from 'react';
import { PiButton, PiInput } from '@pi-community/toolkit';

const DisputeManager = () => {
  const [disputes, setDisputes] = useState([]);
  const [exchangeId, setExchangeId] = useState("");
  const [vote, setVote] = useState(false); // false = conferma, true = contesta

  const fetchDisputes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/exchange/disputes');
      const data = await res.json();
      setDisputes(data.disputes);
    } catch (error) {
      console.error("Errore nel recupero contestazioni:", error);
    }
  };

  const submitDisputeVote = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/exchange/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchangeId, vote, captchaToken: "valido" })
      });
      const data = await res.json();
      if (data.success) {
        alert("Voto registrato correttamente!");
        fetchDisputes();
      } else {
        alert("Errore: " + data.error);
      }
    } catch (error) {
      console.error("Errore nell'invio del voto di contestazione:", error);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  return (
    <div className="dispute-manager">
      <h2>Gestione Contestazioni</h2>
      <div>
        <label>ID Scambio:</label>
        <PiInput value={exchangeId} onChange={(e) => setExchangeId(e.target.value)} />
      </div>
      <div>
        <label>Vota per contestare? (true/false):</label>
        <PiInput 
          type="text" 
          value={vote} 
          onChange={(e) => setVote(e.target.value === "true")} 
        />
      </div>
      <PiButton onClick={submitDisputeVote}>Invia Voto Contestazione</PiButton>
      <hr />
      <h3>Elenco Contestazioni</h3>
      <ul>
        {disputes.map((d, idx) => (
          <li key={idx}>
            Scambio {d.exchangeId} - Voti: {JSON.stringify(d.votes)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DisputeManager;
