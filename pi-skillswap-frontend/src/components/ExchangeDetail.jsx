import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Pi } from '@pinetwork-js/sdk';

const ExchangeDetail = () => {
  const { id } = useParams();
  const [exchange, setExchange] = useState(null);

  const fetchExchangeDetail = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/exchange/${id}`);
      const data = await res.json();
      setExchange(data.exchange);
    } catch (error) {
      console.error("Errore nel recupero dettagli scambio:", error);
    }
  };

  useEffect(() => {
    fetchExchangeDetail();
  }, [id]);

  const executeExchange = async () => {
    try {
      // Inizia la transazione Pi
      const payment = await Pi.createPayment({
        amount: exchange.deposit,
        memo: `Deposito per scambio ${exchange.id}`,
        metadata: { exchangeId: exchange.id }
      });

      // Completa la transazione
      const txn = await payment.complete();

      // Invia la conferma al backend
      const res = await fetch('http://localhost:5000/api/exchange/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          exchangeId: id, 
          txnId: txn.identifier,
          captchaToken: "valido" 
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Scambio completato con successo!");
        window.location.reload();
      } else {
        alert("Errore: " + data.error);
      }
    } catch (error) {
      console.error("Errore nell'esecuzione dello scambio:", error);
    }
  };

  if (!exchange) return <div>Caricamento dettagli...</div>;

  return (
    <div className="exchange-detail">
      <h2>Dettagli dello Scambio</h2>
      <p>Tutor: {exchange.partner}</p>
      <p>Skill Offerta: {exchange.skill}</p>
      <p>Durata: {exchange.duration} minuti</p>
      <p>Deposito Cauzionale: 10% del valore</p>
      <p>Stato: {exchange.status}</p>
      <PiButton onClick={executeExchange}>Conferma e Avvia Scambio</PiButton>
    </div>
  );
};

export default ExchangeDetail;
