import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function ClubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookedSlots, setBookedSlots] = useState({});

  // Stări pentru fereastra (modalul) de rezervare
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isOpenMatch, setIsOpenMatch] = useState(false);
  const [matchType, setMatchType] = useState('Singles');

  // Stări pentru Recenzii
  const [reviewsData, setReviewsData] = useState({ averageRating: 0, totalReviews: 0, reviews: [] });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    // 1. Aducem terenurile
    fetch(`http://localhost:5000/api/clubs/${id}/courts`)
      .then(res => res.json())
      .then(data => {
        setCourts(data);
        setLoading(false);
      })
      .catch(err => console.error('Eroare la terenuri:', err));

    // 2. Aducem recenziile clubului
    fetch(`http://localhost:5000/api/clubs/${id}/reviews`)
      .then(res => res.json())
      .then(data => setReviewsData(data))
      .catch(err => console.error('Eroare la recenzii:', err));
  }, [id]);

  useEffect(() => {
    if (courts.length > 0) {
      courts.forEach(court => {
        fetch(`http://localhost:5000/api/bookings/${court.id}?date=${selectedDate}`)
          .then(res => res.json())
          .then(data => {
            const occupiedHours = {};
            data.forEach(booking => {
              occupiedHours[booking.start_hour] = {
                bookingId: booking.id,
                creatorId: booking.creator_id
              };
            });
            setBookedSlots(prev => ({ ...prev, [court.id]: occupiedHours }));
          })
          .catch(err => console.error('Eroare rezervări:', err));
      });
    }
  }, [courts, selectedDate]);

  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  const openBookingModal = (court, hour) => {
    if (!user) {
      alert('Trebuie să fii autentificat pentru a rezerva!');
      navigate('/login');
      return;
    }
    setSelectedSlot({ court, hour });
    setIsOpenMatch(false);
    setMatchType('Singles');
    setShowModal(true);
  };

  const confirmBooking = async () => {
    const { court, hour } = selectedSlot;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          court_id: court.id,
          booking_date: selectedDate,
          start_hour: hour,
          total_price: court.base_price,
          is_open_match: isOpenMatch,
          match_type: matchType
        })
      });

      const data = await res.json();

      if (res.ok) {
        setBookedSlots(prev => ({
          ...prev,
          [court.id]: {
            ...prev[court.id],
            [hour]: { bookingId: data.booking.id, creatorId: user.id }
          }
        }));
        setShowModal(false);
      } else {
        alert(data.error || 'Eroare la rezervare.');
      }
    } catch (err) {
      alert('Eroare de conexiune cu serverul.');
    }
  };

  const handleCancelBooking = async (bookingId, courtId, hour) => {
    const confirmare = window.confirm(`Anulezi rezervarea de la ora ${hour}:00?`);
    if (!confirmare) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setBookedSlots(prev => {
          const courtSlots = { ...prev[courtId] };
          delete courtSlots[hour];
          return { ...prev, [courtId]: courtSlots };
        });
      } else {
        alert('Eroare la anulare.');
      }
    } catch (err) {
      alert('Eroare de conexiune.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Trebuie să fii autentificat pentru a lăsa o recenzie!');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/clubs/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Recenzie adăugată cu succes!');
        setReviewComment('');
        setReviewRating(5);
        
        // Reîmprospătăm recenziile pentru a o vedea pe cea nouă instant
        const updatedReviews = await fetch(`http://localhost:5000/api/clubs/${id}/reviews`).then(r => r.json());
        setReviewsData(updatedReviews);
      } else {
        alert(data.error || 'Eroare la adăugarea recenziei.');
      }
    } catch (err) {
      alert('Eroare de conexiune.');
    }
  };

  return (
    <div className="relative pb-10">
      <Link to="/" className="text-emerald-400 hover:underline mb-6 inline-block">&larr; Înapoi la cluburi</Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Terenuri și Disponibilitate</h2>
          {reviewsData.totalReviews > 0 && (
            <div className="text-emerald-400 font-semibold flex items-center gap-1">
              ⭐ {reviewsData.averageRating} <span className="text-slate-400 text-sm font-normal ml-2">({reviewsData.totalReviews} recenzii)</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <label className="text-slate-300 font-semibold">Alege data:</label>
          <input 
            type="date" 
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex gap-4 mb-6 text-sm font-semibold">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-600/50 border border-emerald-500 rounded"></div> Liber</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500/50 border border-red-500 rounded"></div> Ocupat</div>
        {user && <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500/50 border border-orange-500 rounded"></div> Rezervarea ta</div>}
      </div>
      
      {loading ? <p>Se încarcă terenurile...</p> : courts.length === 0 ? <p>Nu există terenuri adăugate.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {courts.map(court => (
            <div key={court.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col">
              <div className="mb-4 pb-4 border-b border-slate-700">
                <h3 className="text-xl font-bold text-emerald-400 mb-2">{court.name}</h3>
                <p className="text-slate-300 text-sm">Suprafață: <span className="font-semibold text-white">{court.surface}</span> | Tip: <span className="font-semibold text-white">{court.is_indoor ? 'Indoor' : 'Exterior'}</span></p>
                <p className="text-slate-200 font-bold mt-2">Preț: {court.base_price} RON / oră</p>
              </div>
              
              <div className="flex-grow">
                <h4 className="text-sm text-slate-400 mb-3">Ore disponibile pentru {selectedDate}:</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {hours.map(hour => {
                    const slotData = bookedSlots[court.id]?.[hour];
                    const isBooked = !!slotData;
                    const isMyBooking = isBooked && slotData.creatorId === user?.id;

                    let btnClass = 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600 hover:text-white cursor-pointer';
                    if (isMyBooking) {
                      btnClass = 'bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500 hover:text-white cursor-pointer';
                    } else if (isBooked) {
                      btnClass = 'bg-red-500/20 text-red-300 border-red-500/30 cursor-not-allowed';
                    }

                    return (
                      <button
                        key={hour}
                        disabled={isBooked && !isMyBooking}
                        onClick={() => {
                          if (isMyBooking) handleCancelBooking(slotData.bookingId, court.id, hour);
                          else if (!isBooked) openBookingModal(court, hour);
                        }}
                        className={`py-2 px-1 text-sm font-semibold rounded border transition-colors ${btnClass}`}
                      >
                        {hour}:00
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECȚIUNEA DE RECENZII */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-2xl font-bold mb-6">Recenzii ({reviewsData.totalReviews})</h3>
        
        {/* Formular adăugare recenzie */}
        {user ? (
          <form onSubmit={handleReviewSubmit} className="mb-8 bg-slate-900 p-5 rounded-lg border border-slate-700">
            <h4 className="font-semibold mb-3 text-emerald-400">Lasă o recenzie</h4>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nota ta:</label>
                <select 
                  value={reviewRating} 
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="p-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ (4/5)</option>
                  <option value="3">⭐⭐⭐ (3/5)</option>
                  <option value="2">⭐⭐ (2/5)</option>
                  <option value="1">⭐ (1/5)</option>
                </select>
              </div>
              <div className="flex-grow">
                <label className="block text-sm text-slate-400 mb-1">Comentariu:</label>
                <input 
                  type="text" 
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Cum ți s-au părut terenurile?"
                  className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded text-white font-bold transition-colors">
              Trimite
            </button>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-slate-900 rounded border border-slate-700 text-slate-400">
            Trebuie să fii <Link to="/login" className="text-emerald-400 hover:underline">autentificat</Link> pentru a lăsa o recenzie.
          </div>
        )}

        {/* Lista de recenzii */}
        {reviewsData.reviews.length === 0 ? (
          <p className="text-slate-400">Nu există recenzii pentru acest club încă.</p>
        ) : (
          <div className="grid gap-4">
            {reviewsData.reviews.map(review => (
              <div key={review.id} className="pb-4 border-b border-slate-700 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-white">{review.user_name}</strong>
                  <span className="text-emerald-400 font-bold">
                    {'⭐'.repeat(review.rating)}
                  </span>
                </div>
                <p className="text-slate-300">{review.comment}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(review.created_at).toLocaleDateString('ro-RO')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FEREASTRA MODALĂ PENTRU REZERVARE (Rămâne neschimbată) */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-emerald-400">Confirmare Rezervare</h3>
            <p className="mb-2">Teren: <span className="font-semibold text-white">{selectedSlot.court.name}</span></p>
            <p className="mb-2">Data: <span className="font-semibold text-white">{selectedDate}</span> la ora <span className="font-semibold text-white">{selectedSlot.hour}:00</span></p>
            <p className="mb-6">Total: <span className="font-semibold text-white">{selectedSlot.court.base_price} RON</span></p>

            <div className="mb-6 bg-slate-900 p-4 rounded border border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input 
                  type="checkbox" 
                  checked={isOpenMatch} 
                  onChange={(e) => setIsOpenMatch(e.target.checked)}
                  className="w-4 h-4 text-emerald-500"
                />
                <span className="text-white font-semibold">Caut parteneri (Open Match)</span>
              </label>
              
              {isOpenMatch && (
                <div className="ml-6">
                  <label className="text-sm text-slate-300 block mb-1">Ce fel de meci joci?</label>
                  <select 
                    value={matchType} 
                    onChange={(e) => setMatchType(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none"
                  >
                    <option value="Singles">Simplu (1 la 1)</option>
                    <option value="Doubles">Dublu (2 la 2)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded font-semibold transition-colors"
              >
                Anulează
              </button>
              <button 
                onClick={confirmBooking}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition-colors"
              >
                Confirmă Rezervarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubDetails;