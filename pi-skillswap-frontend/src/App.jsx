import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Search from './components/Search';
import ExchangeDetail from './components/ExchangeDetail';
import TransactionHistory from './components/TransactionHistory';
import DisputeManager from './components/DisputeManager';
import './styles/components.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/exchange/:id" element={<ExchangeDetail />} />
        <Route path="/history" element={<TransactionHistory />} />
        <Route path="/dispute" element={<DisputeManager />} />
      </Routes>
    </div>
  );
}

export default App;
