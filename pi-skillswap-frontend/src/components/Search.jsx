import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiButton } from './common/PiComponents';

const Search = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);

  const fetchMatches = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/matching', { method: 'GET' });
      const data = await res.json();
      setMatches(data.matches);
    } catch (error) {
      console.error("Errore nel matching:", error);
    }
  };

  return (
    <div className="search-page">
      <h2>Ricerca e Matching</h2>
      <PiButton onClick={fetchMatches}>Trova Scambi Compatibili</PiButton>
      <ul>
        {matches.map((match) => (
          <li key={match.id}>
            Tutor: {match.partner} - Skill: {match.skill}
            <PiButton onClick={() => navigate(`/exchange/${match.id}`)}>
              Avvia Scambio
            </PiButton>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Search;
