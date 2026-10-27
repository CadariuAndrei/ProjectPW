import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Profile() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('http://localhost:5000/api/bookings/my-bookings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Nu am putut încărca rezervările');
        return res.json();
      })
      .then(data => {
        setBookings(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [navigate]);

  const handleCancel = async (bookingId) => {
    const confirmare = window.confirm('Ești sigur că vrei să anulezi această rezervare?');
    if (!confirmare) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        // Actualizăm starea locală pentru a reflecta anularea fără să dăm refresh la pagină
        setBookings(prevBookings => 
          prevBookings.map(b => 
            b.booking_id === bookingId ? { ...b, status: 'cancelled' } : b
          )
        );
        alert('Rezervare anulată cu succes!');
      } else {
        const data = await res.json();
        alert(data.error || 'Eroare la anulare.');
      }
    } catch (err) {
      alert('Eroare de conexiune cu serverul.');
    }
  };

  if (loading) return <div className="text-center mt-10">Se încarcă profilul...</div>;
  if (error) return <div className="text-red-400 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-emerald-400">Rezervările Mele</h2>
        <Link to="/" className="text-slate-300 hover:text-white transition-colors">&larr; Înapoi la cluburi</Link>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400 mb-4">Nu ai nicio rezervare înregistrată încă.</p>
          <Link to="/" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-semibold transition-colors">
            Găsește un teren
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => {
            // Formatăm data  (ex: DD/MM/YYYY)
            const dateObj = new Date(booking.booking_date);
            const formattedDate = dateObj.toLocaleDateString('ro-RO');
            const isActive = booking.status === 'active';

            return (
              <div 
                key={booking.booking_id} 
                className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isActive ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800 opacity-75'
                }`}
              >
                <div>
                  <h3 className="text-xl font-bold mb-1">{booking.club_name} - <span className="text-emerald-400">{booking.court_name}</span></h3>
                  <div className="text-sm text-slate-300 grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                    <p>Data: <span className="font-semibold text-white">{formattedDate}</span></p>
                    <p>Ora: <span className="font-semibold text-white">{booking.start_hour}:00</span></p>
                    <p>Preț: <span className="font-semibold text-white">{booking.total_price} RON</span></p>
                    <p>
                      Status:{' '}
                      <span className={`font-semibold ${isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isActive ? 'Activă' : 'Anulată'}
                      </span>
                    </p>
                  </div>
                </div>

                {isActive && (
                  <button 
                    onClick={() => handleCancel(booking.booking_id)}
                    className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/50 hover:border-red-500 px-4 py-2 rounded font-semibold transition-all w-full sm:w-auto"
                  >
                    Anulează
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Profile;