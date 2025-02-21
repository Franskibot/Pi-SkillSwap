import React, { useState, useEffect } from 'react';
import { PiSelect, PiInput, PiButton } from '@pi-community/toolkit';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [profile, setProfile] = useState({
    possessed: [],
    desired: [],
    reputation: 0,
  });
  const [skillOptions] = useState([
    "Python", "Javascript", "Data Analysis", "UX Design", "Blockchain", "Machine Learning"
  ]);
  const [exchanges, setExchanges] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Salvataggio profilo
  const saveProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, possessed: profile.possessed, desired: profile.desired, captchaToken: "valido" })
      });
      const data = await response.json();
      if (data.success) {
        alert("Profilo aggiornato!");
      } else {
        alert("Errore: " + data.error);
      }
    } catch (error) {
      console.error("Errore salvataggio profilo:", error);
    }
  };

  const fetchExchanges = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/exchange/history?userId=${userId}`);
      const data = await res.json();
      setExchanges(data.exchanges);
    } catch (error) {
      console.error("Errore nel recupero storico:", error);
    }
  };

  // Simulazione notifiche in tempo reale (es. tramite polling ogni 10 secondi)
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:5000/api/notifications?userId=${userId}`);
      const data = await res.json();
      setNotifications(data.notifications);
    }, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    fetchExchanges();
  }, [userId]);

  return (
    <div className="dashboard">
      <h2>Dashboard Utente</h2>
      <div className="profile-section">
        <h3>Profilo Personale</h3>
        <div>
          <label>Skill Possedute (max 5):</label>
          <PiSelect
            multiple
            options={skillOptions}
            maxSelection={5}
            onChange={(selected) => setProfile({...profile, possessed: selected})}
            placeholder="Seleziona le skill possedute"
          />
        </div>
        <div>
          <label>Skill Desiderate (max 3):</label>
          <PiSelect
            multiple
            options={skillOptions}
            maxSelection={3}
            onChange={(selected) => setProfile({...profile, desired: selected})}
            placeholder="Seleziona le skill desiderate"
          />
        </div>
        <div>
          <label>Reputazione:</label>
          <PiInput value={profile.reputation} disabled />
        </div>
        <PiButton onClick={saveProfile}>Salva Profilo</PiButton>
      </div>
      <div className="exchanges-section">
        <h3>Storico Scambi Completati</h3>
        <ul>
          {exchanges.map((exchange) => (
            <li key={exchange.id}>
              Scambio con {exchange.partner} - Stato: {exchange.status}
            </li>
          ))}
        </ul>
      </div>
      <div className="notifications-section">
        <h3>Notifiche</h3>
        <ul>
          {notifications.map((note, index) => (
            <li key={index}>{note.message}</li>
          ))}
        </ul>
      </div>
      <div className="nav-section">
        <PiButton onClick={() => navigate('/search')}>Cerca Scambi</PiButton>
        <PiButton onClick={() => navigate('/history')}>Visualizza Storico</PiButton>
        <PiButton onClick={() => navigate('/dispute')}>Gestione Contestazioni</PiButton>
      </div>
    </div>
  );
};

export default Dashboard;
