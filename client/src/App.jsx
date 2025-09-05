import { useState } from 'react';
import { Toaster } from 'react-hot-toast'; // <-- import Toaster
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Control from './pages/Control';
import Settings from './pages/Settings';
import Tutorial from './pages/Tutorial';

function App() {
  const [activePage, setActivePage] = useState('Home');

  const renderContent = () => {
    switch(activePage.toLowerCase()) {
      case 'home': return <Home />;
      case 'control': return <Control />;
      case 'settings': return <Settings />;
      case 'user guide': return <Tutorial />;
      default: return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col md:flex-row">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>

      {/* Toast notifications */}
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}

export default App;
