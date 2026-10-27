import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    
    if (!token || !userString) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userString);
    // Securitate Frontend: Verificăm dacă user-ul are rolul corect
    if (user.role !== 'club_admin') {
      setError('Acces interzis. Această pagină este rezervată administratorilor de club.');
      setLoading(false);
      return;
    }

    fetch('http://localhost:5000/api/bookings/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Eroare la preluarea datelor. Poate nu ești asociat niciunui club.');
        return res.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDashboardData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <div className="text-center mt-10">Se încarcă panoul de administrare...</div>;
  if (error) return <div className="text-center mt-10 text-red-500 font-bold bg-red-900/20 p-4 rounded border border-red-500/50 max-w-lg mx-auto">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-emerald-400 mb-1">Panou de Administrare</h2>
      <h3 className="text-xl text-slate-300 mb-8">
        Club: <span className="text-white font-bold">{dashboardData.clubName}</span>
      </h3>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-300">
                <th className="p-4 font-semibold">Data & Ora</th>
                <th className="p-4 font-semibold">Teren</th>
                <th className="p-4 font-semibold">Jucător</th>
                <th className="p-4 font-semibold">Contact</th>
                <th className="p-4 font-semibold">Preț</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Nu există nicio rezervare înregistrată pentru clubul tău.
                  </td>
                </tr>
              ) : (
                dashboardData.bookings.map(booking => {
                  const dateObj = new Date(booking.booking_date);
                  const isCancelled = booking.status === 'cancelled';
                  
                  return (
                    <tr 
                      key={booking.booking_id} 
                      className={`border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                    >
                      <td className="p-4">
                        <div className="font-semibold text-white">{dateObj.toLocaleDateString('ro-RO')}</div>
                        <div className="text-sm text-slate-400">{booking.start_hour}:00</div>
                      </td>
                      <td className="p-4 font-medium text-emerald-400">{booking.court_name}</td>
                      <td className="p-4 text-white">{booking.player_name}</td>
                      <td className="p-4 text-sm text-slate-300">{booking.player_email}</td>
                      <td className="p-4 font-semibold text-white">{booking.total_price} RON</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          isCancelled 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isCancelled ? 'Anulată' : 'Activă'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;