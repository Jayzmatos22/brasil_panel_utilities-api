//import { useState } from 'react'
import HeaderApp from "./components/Header";
import RegisterData from "./components/RegisterData";
import { BrowserRouter, Routes, Route, useLocation  } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginData from "./components/LoginDataUser";
import { CircleDollarSign  } from 'lucide-react';
import ExchangeInterface from "./components/Exchange";
import CriptosInterface from "./components/Criptos";

// bg-app
import './App.css'


function AppLayout() {
  const location = useLocation();
  const showMoneyIcon = location.pathname === '/registro-usuario' || location.pathname === '/login-usuario';

  return (
    <div className="w-full h-screen bg-app flex items-center justify-center">
      <HeaderApp />
      
      {showMoneyIcon && (
        <CircleDollarSign size={200} className="money-icon-bg left-2 fixed filter drop-shadow-lg money-animated" />
      )}

      <div className="flex-1 w-full flex items-center justify-center mt-20">
        <Routes>
          <Route path="/" element={<RegisterData />} />
          <Route path="/registro-usuario" element={<RegisterData />} />
          <Route path="/login-usuario" element={<LoginData />} />
          <Route path="/cotacao-criptomoedas" element={<CriptosInterface />} />
          <Route path="/cotacao-moedas" element={<ExchangeInterface />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="bottom-right" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            zIndex: 99999,
          },
          success: { duration: 4000 },
        }} 
      />
      <AppLayout />
    </BrowserRouter>
  );
}
