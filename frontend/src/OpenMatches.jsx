import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // 1. Importăm toast

function OpenMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedMatches, setJoinedMatches] = useState([]); 
  const navigate = useNavigate();

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    fetch('http://localhost:5000/api/bookings/open/matches')
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Eroare:', err);
        setLoading(false);
      });
  }, []);

  const handleJoin = async (bookingId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Trebuie să fii autentificat!'); // 2. Folosim toast.error
      return navigate('/login');
    }

    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Te-ai alăturat meciului cu succes! 🎾'); // 3. Folosim toast.success
        setJoinedMatches(prev => [...prev, bookingId]);
      } else {
        if (data.error === 'Ești deja înscris la acest meci.') {
            setJoinedMatches(prev => [...prev, bookingId]);
        }
        toast.error(data.error || 'Eroare la alăturare.');
      }
    } catch (err) {
      toast.error('Eroare de conexiune.');
    }
  };

  const handleLeave = async (bookingId) => {
    const confirmare = window.confirm('Ești sigur că vrei să te retragi din acest meci?');
    if (!confirmare) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/leave`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setJoinedMatches(prev => prev.filter(id => id !== bookingId));
        toast.success('Te-ai retras cu succes!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Eroare la retragere.');
      }
    } catch (err) {
      toast.error('Eroare de conexiune.');
    }
  };

  if (loading) return <div className="text-center mt-10">Se caută meciuri...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-emerald-400 mb-6">Meciuri Deschise (Găsește Parteneri)</h2>
      
      {matches.length === 0 ? (
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400">Momentan nu există meciuri deschise.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map(match => {
            const dateObj = new Date(match.booking_date);
            const isMyMatch = user && user.name === match.creator_name;
            const hasJoined = joinedMatches.includes(match.booking_id);

            return (
              <div key={match.booking_id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    {match.club_name} - <span className="text-emerald-400">{match.court_name}</span>
                  </h3>
                  <div className="text-sm text-slate-300">
                    <p>Creat de: <strong className="text-white">{match.creator_name}</strong> (Nivel NTRP: {match.creator_skill || 'N/A'})</p>
                    <p>Tip meci: <strong className="text-emerald-400">{match.match_type === 'Singles' ? 'Simplu (1v1)' : 'Dublu (2v2)'}</strong></p>
                    <p className="mt-2">
                      📅 {dateObj.toLocaleDateString('ro-RO')} | ⏰ Ora {match.start_hour}:00
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => hasJoined ? handleLeave(match.booking_id) : handleJoin(match.booking_id)}
                  disabled={isMyMatch}
                  className={`px-6 py-2 rounded font-bold transition-colors w-full sm:w-auto ${
                    isMyMatch 
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : hasJoined
                      ? 'bg-blue-900/50 text-blue-300 border border-blue-500 hover:bg-blue-900 hover:text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isMyMatch ? 'Meciul Tău' : hasJoined ? 'Retrage-te' : 'Alătură-te'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OpenMatches;