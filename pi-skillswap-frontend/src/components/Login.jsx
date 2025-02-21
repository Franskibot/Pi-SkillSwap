import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const initializePiSDK = async () => {
    try {
      // Inizializza l'SDK
      await Pi.init({ version: "2.0" });
      console.log("SDK Pi inizializzato con successo");
    } catch (error) {
      console.error("Errore nell'inizializzazione dell'SDK Pi:", error);
    }
  };

  useEffect(() => {
    initializePiSDK();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Autenticazione con Pi Network
      const auth = await Pi.authenticate(['payments'], {
        onIncompletePaymentFound: (payment) => {
          console.log('Pagamento incompleto trovato:', payment);
        }
      });

      // Ottenimento access token e info utente
      const { accessToken, user } = auth;

      // Chiamata al backend per login
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          userId: user.uid,
          username: user.username
        })
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('accessToken', accessToken);
        navigate('/dashboard');
      } else {
        alert("Errore di login: " + data.error);
      }
    } catch (error) {
      console.error("Errore di login:", error);
      alert("Errore durante l'autenticazione con Pi Network");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Benvenuto su Pi SkillSwap</h1>
      <button 
        className="pi-button"
        onClick={handleLogin} 
        disabled={loading}
      >
        {loading ? "Autenticazione in corso..." : "Accedi con Pi Network"}
      </button>
    </div>
  );
};

export default Login;
