import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppBody from './components/AppBody.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function () {
  return (
    <Router>
      <ToastContainer />
      <AppBody />
    </Router>
  );
}