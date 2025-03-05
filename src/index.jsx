import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { Provider } from 'react-redux';
import { store } from './components/DetailedBookViewer/store/store';
// import PlanFetcher from './src/components/DetailedBookViewer/PlanFetcher'; // Only if needed here

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Wrap your entire app in the Redux Provider */}
    <Provider store={store}>
      <App />
      {/* If you want PlanFetcher directly here instead of inside App, uncomment below: */}
      {/* <PlanFetcher /> */}
    </Provider>
  </React.StrictMode>
);

reportWebVitals();