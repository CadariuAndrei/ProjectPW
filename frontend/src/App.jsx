import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ClubDetails from './ClubDetails';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import OpenMatches from './OpenMatches';
import AdminDashboard from './AdminDashboard';
import { Toaster } from 'react-hot-toast';

function Home() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [indoorFilter, setIndoorFilter] = useState(false);

  // Link-uri către imagini placeholder cu tematică de tenis
  const clubImages = {
    'Club Helios': 'https://images.unsplash.com/photo-1595436065982-89f1d0442371?q=80&w=800&auto=format&fit=crop', // Zgură
    'CS Dyadora': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=800&auto=format&fit=crop', // Minge pe teren
    'Baza Sportivă UPT': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800&auto=format&fit=crop', // Fileu și teren
    'Tenis Club Rogo': 'https://images.unsplash.com/photo-1560012057-4372e14c5085?q=80&w=800&auto=format&fit=crop', // Rachete
    'Next Gen': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=800&auto=format&fit=crop' // Teren hard verde
  };
  const defaultImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop';

  useEffect(() => {
    fetch('http://localhost:5000/api/clubs')
      .then((res) => res.json())
      .then((data) => {
        setClubs(data);
        setLoading(false);
      });
  }, []);

  const uniqueCities = [...new Set(clubs.map(club => club.city))];

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === '' || club.city === cityFilter;
    const matchesIndoor = !indoorFilter || club.has_indoor === true;
    return matchesSearch && matchesCity && matchesIndoor;
  });

  return (
    <main className="max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-emerald-400 mb-2">Găsește clubul perfect</h2>
          <p className="text-slate-400">Alege din {filteredClubs.length} cluburi disponibile</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto bg-slate-800 p-4 rounded-xl border border-slate-700">
          <input 
            type="text" 
            placeholder="Caută club..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
          />
          <select 
            value={cityFilter} 
            onChange={(e) => setCityFilter(e.target.value)}
            className="p-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">Toate orașele</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 p-2">
            <input 
              type="checkbox" 
              checked={indoorFilter}
              onChange={(e) => setIndoorFilter(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded"
            />
            <span className="font-semibold">Doar Indoor</span>
          </label>
        </div>
      </div>

      {loading ? <div className="text-center mt-10">Se încarcă...</div> : (
        filteredClubs.length === 0 ? (
          <div className="text-center p-10 bg-slate-800 rounded-xl border border-slate-700 text-slate-400">
            Nu am găsit niciun club care să corespundă căutării tale.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => (
              <Link 
                key={club.id} 
                to={`/club/${club.id}`} 
                className="relative border border-slate-700 rounded-xl hover:border-emerald-400 transition-colors block cursor-pointer group shadow-lg overflow-hidden min-h-[220px] flex flex-col justify-end"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(15, 23, 42, 0.1) 100%), url(${clubImages[club.name] || defaultImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="relative z-10 p-5 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors drop-shadow-md">{club.name}</h3>
                    {club.has_indoor && <span className="bg-blue-600/80 text-white text-xs font-bold px-2 py-1 rounded border border-blue-400/50 backdrop-blur-sm">Indoor</span>}
                  </div>
                  
                  <p className="text-slate-300 text-sm mb-3 font-medium">📍 {club.city}</p>
                  
                  {club.surfaces && club.surfaces.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {club.surfaces.map(surface => (
                        <span key={surface} className="bg-slate-800/80 text-slate-200 text-xs px-2 py-1 rounded backdrop-blur-sm border border-slate-600/50">
                          {surface}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-white font-semibold bg-emerald-600/90 px-3 py-1.5 rounded inline-block backdrop-blur-sm border border-emerald-500/50 shadow-sm">
                    🕒 {club.opening_hour}:00 - {club.closing_hour}:00
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </main>
  );
}

function App() {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } }} />
      
      <header className="max-w-5xl mx-auto mb-8 pb-4 border-b border-slate-700 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <Link to="/">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 transition-all">
              CourtReserve
            </h1>
          </Link>
          <Link to="/open-matches" className="text-slate-300 hover:text-white font-semibold transition-colors mt-1">
            Găsește Parteneri
          </Link>
          
          {user && user.role === 'club_admin' && (
            <Link to="/admin" className="text-orange-400 hover:text-orange-300 font-bold transition-colors mt-1 border border-orange-500/50 bg-orange-500/10 px-3 py-1 rounded">
              Panou Admin
            </Link>
          )}
        </div>
        
        <div className="flex gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-slate-300">
                Salut,{' '}
                <Link to="/profile" className="text-white hover:text-emerald-400 font-bold hover:underline transition-colors">
                  {user.name}
                </Link>
              </span>
              <button 
                onClick={handleLogout}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-1 rounded text-sm font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded font-semibold transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-semibold transition-colors shadow-lg shadow-emerald-600/20">
                Cont Nou
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/club/:id" element={<ClubDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/open-matches" element={<OpenMatches />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;