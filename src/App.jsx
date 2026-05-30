import React, { useState } from 'react';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import DashboardPage from './DashboardPage';

// export default function App() {
//   // Navigation states: 'landing' or 'auth'
//   const [currentView, setCurrentView] = useState('landing');
//   const [startWithSignUp, setStartWithSignUp] = useState(true);

//   const handleNavigateToAuth = (showSignUp = true) => {
//     setStartWithSignUp(showSignUp);
//     setCurrentView('auth');
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   if (currentView === 'auth') {
//     return (
//       <div className="animate-fade-in" style={{ backgroundColor: '#0A0712', minHeight: '100vh' }}>
//         {/* Simple crisp back navigation bar link header row */}
//         <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 40px 0' }}>
//           <button 
//             onClick={() => setCurrentView('landing')}
//             style={{
//               background: 'rgba(255, 255, 255, 0.03)', 
//               border: '1px solid #1F192E', 
//               color: '#9ca3af', 
//               cursor: 'pointer', 
//               fontSize: '13px', 
//               fontWeight: '600',
//               padding: '10px 20px',
//               borderRadius: '9999px',
//               transition: 'all 0.2s'
//             }}
//             onMouseEnter={(e) => { e.target.style.color = '#ffffff'; e.target.style.borderColor = '#8B5CF6'; }}
//             onMouseLeave={(e) => { e.target.style.color = '#9ca3af'; e.target.style.borderColor = '#1F192E'; }}
//           >
//             &larr; Back to home
//           </button>
//         </div>
//         <AuthPage initialIsSignUp={startWithSignUp} />
//       </div>
//     );
//   }

//   return (
//     <LandingPage onJoinAction={() => handleNavigateToAuth(true)} />
//   );
// }

const App = () => {
  return (
    <div>
      <DashboardPage/>
    </div>
  )
}

export default App