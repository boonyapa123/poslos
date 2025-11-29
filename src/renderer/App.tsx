import React from 'react';
import { POSProvider } from './context/POSContext';
import Layout from './components/Layout';
import Header from './components/Header';
import SalesScreen from './components/SalesScreen';
import '../i18n/config';

const App: React.FC = () => {
  return (
    <POSProvider>
      <Layout>
        <Header />
        <main className="flex-1 overflow-hidden">
          <SalesScreen />
        </main>
      </Layout>
    </POSProvider>
  );
};

export default App;
