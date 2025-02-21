import React, { useState, useEffect } from 'react';

const TransactionHistory = () => {
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/exchange/history');
      const data = await res.json();
      setHistory(data.exchanges);
    } catch (error) {
      console.error("Errore nel recupero dello storico:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="transaction-history">
      <h2>Storico Transazioni</h2>
      <ul>
        {history.map((tx) => (
          <li key={tx.id}>
            {new Date(tx.timestamp).toLocaleString()} - Scambio con {tx.partner} - Stato: {tx.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionHistory;
