import React from 'react';
import { Wrench, Camera, MapPin, TrendingUp, Menu, X } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Report from './pages/Report'
import Gallery from './pages/Gallery'
import ReportDetail from './pages/ReportDetail'
import MyReports from './pages/MyReports'

// --- Component for the Feature Cards ---
const FeatureCard = ({ icon: Icon, title }) => (
  <div className="flex flex-col items-center p-6 bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1">
    <div className="p-3 mb-4 rounded-full bg-orange-600/20">
      <Icon className="w-8 h-8 text-orange-400" />
    </div>
    <h3 className="text-xl font-semibold text-white text-center">
      {title}
    </h3>
  </div>
);

// --- Main Application Component ---
const App = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null')
    } catch { return null }
  })

  // Placeholder image mimicking the drone/road scene
  const HERO_IMAGE_URL = "./background.png";

  // Data for the navigation links
  const navLinks = [
    { name: 'Home', to: '/', current: true },
    { name: 'Report', to: '/report', current: false },
    { name: 'Gallery', to: '/gallery', current: false },
  ];

  // Data for the feature cards
  const featureData = [
    { icon: Camera, title: 'AI-Powered Scanning' },
    { icon: MapPin, title: 'Real-Time Mapping' },
    { icon: TrendingUp, title: 'Community Impact' },
  ];

  return (
    <BrowserRouter>
    <div className="min-h-screen bg-gray-900 font-sans">
      
      {/* 1. Navigation Bar (Header) */}
      <nav className="bg-gray-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Wrench className="w-6 h-6 text-orange-500 mr-2" />
              <Link to="/" className="text-xl font-bold text-white tracking-wider">STREET SCAN</Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
              {navLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.to}
                  onClick={(e)=>{
                    // Protect Report and Gallery routes: require login
                    if((item.to === '/report' || item.to === '/gallery') && !currentUser){
                      e.preventDefault();
                      window.location.href = '/login';
                    }
                  }}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-150 ease-in-out text-gray-300 hover:border-gray-300 hover:text-white`}
                >
                  {item.name}
                </Link>
              ))}
              {currentUser ? (
                <div className="ml-4 flex items-center gap-3">
                  <div className="text-sm text-gray-300">{currentUser.name || currentUser.email}</div>
                  <button onClick={() => { localStorage.removeItem('currentUser'); setCurrentUser(null); window.location.href = '/'; }} className="px-3 py-1 border border-transparent bg-gray-700 text-sm text-white rounded">Logout</button>
                </div>
              ) : (
                <Link to="/login" className="ml-4 px-4 py-1 border border-orange-600 text-orange-600 text-sm font-medium rounded-lg hover:bg-orange-600 hover:text-white transition duration-150 ease-in-out">
                  Login
                </Link>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
              {isMenuOpen && (
          <div className="sm:hidden absolute w-full bg-gray-900 border-t border-gray-700 pb-3 z-40">
            <div className="pt-2 pb-3 space-y-1 px-2">
              {navLinks.map((item) => (
                <Link key={item.name} to={item.to} onClick={(e)=>{ if((item.to==='/report'||item.to==='/gallery') && !currentUser){ e.preventDefault(); window.location.href='/login'; } }} className={`block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white`}>
                  {item.name}
                </Link>
              ))}
              {currentUser ? (
                <div className="w-full mt-2 px-3 py-2 text-left text-gray-300">
                  <div className="text-sm mb-2">{currentUser.name || currentUser.email}</div>
                  <button onClick={() => { localStorage.removeItem('currentUser'); setCurrentUser(null); window.location.href = '/'; }} className="w-full px-3 py-2 bg-gray-700 rounded text-white">Logout</button>
                </div>
              ) : (
                <Link to="/login" className="w-full mt-2 px-3 py-2 border border-orange-600 text-orange-600 text-base font-medium rounded-md hover:bg-orange-600 hover:text-white transition duration-150 ease-in-out">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/login" element={<Login onLogin={(user) => setCurrentUser(user)} />} />
            <Route path="/signup" element={<Signup/>} />
            <Route path="/report" element={<Report/>} />
            <Route path="/report/:id" element={<ReportDetail/>} />
            <Route path="/gallery" element={<Gallery/>} />
            <Route path="/my-reports" element={<MyReports/>} />
            <Route path="/" element={
              <>
                {/* 2. Hero Section (Main Banner) */}
                <div className="relative h-[450px] w-full bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}>
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                  <div className="relative max-w-7xl mx-auto h-full flex items-center px-4 sm:px-6 lg:px-8">
                    <div className="max-w-xl p-8 rounded-xl backdrop-blur-sm bg-gray-900/40">
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                        See Them Before <br /> They See You
                      </h1>
                                <div className="flex gap-3">
                                  <Link to="/report" className="px-6 py-3 bg-orange-600 text-white font-semibold text-base rounded-lg shadow-xl hover:bg-orange-700 transition duration-300 transform hover:scale-[1.02]">Report a Pothole</Link>
                                  <Link to="/my-reports" className="px-6 py-3 border border-orange-600 text-orange-600 rounded-lg">My Reports</Link>
                                </div>
                    </div>
                  </div>
                </div>

                {/* 3. Feature Cards (Below Hero) */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featureData.map((feature, index) => (
                      <FeatureCard 
                        key={index} 
                        icon={feature.icon} 
                        title={feature.title} 
                      />
                    ))}
                  </div>
                </section>
              </>
            } />
          </Routes>
        </div>
      </main>

      {/* Optional Footer for completeness */}
      <footer className="bg-gray-800 text-gray-400 py-6 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm">
          &copy; {new Date().getFullYear()} Street Scan by Government of India. All rights reserved.
        </div>
      </footer>
    </div>
    </BrowserRouter>
  );
};

export default App;