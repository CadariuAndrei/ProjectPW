import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [clubs, setClubs] = useState([]);
  const [admins, setAdmins] = useState([]); 
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '', city: '', opening_hour: 8, closing_hour: 22, admin_email: ''
  });

  const fetchClubsAndAdmins = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const resClubs = await fetch('http://localhost:5000/api/clubs');
      const dataClubs = await resClubs.json();
      setClubs(dataClubs);

      const resAdmins = await fetch('http://localhost:5000/api/clubs/admins/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAdmins.ok) {
        const dataAdmins = await resAdmins.json();
        setAdmins(dataAdmins);
      }
    } catch (err) {
      toast.error('Eroare la încărcarea datelor');
    }
  }, []); 

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;

    if (!currentUser || currentUser.role !== 'super_admin') {
      toast.error('Acces interzis!');
      navigate('/');
      return;
    }
    
    fetchClubsAndAdmins();
  }, [navigate, fetchClubsAndAdmins]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingId ? `http://localhost:5000/api/clubs/${editingId}` : 'http://localhost:5000/api/clubs';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editingId ? 'Club actualizat!' : 'Club adăugat!');
        fetchClubsAndAdmins();
        setFormData({ name: '', city: '', opening_hour: 8, closing_hour: 22, admin_email: '' });
        setEditingId(null);
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Eroare la salvare');
      }
    } catch (err) {
      toast.error('Eroare de conexiune');
    }
  };

  const handleEditClick = (club) => {
    setFormData({
      name: club.name,
      city: club.city,
      opening_hour: club.opening_hour,
      closing_hour: club.closing_hour,
      admin_email: club.admin_email || '' 
    });
    setEditingId(club.id);
  };

  const handleDeleteClub = async (id) => {
    if (!window.confirm('Ștergi definitiv acest club?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/clubs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Club șters!');
        setClubs(clubs.filter(club => club.id !== id));
        if (editingId === id) {
            setEditingId(null);
            setFormData({ name: '', city: '', opening_hour: 8, closing_hour: 22, admin_email: '' });
        }
      }
    } catch (err) {
      toast.error('Eroare de conexiune');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-900 min-h-screen text-white">
      <h2 className="text-3xl font-bold text-emerald-400 mb-8">Panou Sistem: Super Admin</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit transition-all duration-300">
          <h3 className={`text-xl font-semibold mb-4 ${editingId ? 'text-blue-400' : 'text-emerald-400'}`}>
            {editingId ? 'Editează Clubul' : 'Adaugă Club Nou'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <input type="text" placeholder="Nume Club" required className="w-full p-2 bg-slate-900 border border-slate-700 rounded focus:border-emerald-500 focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            
            <input type="text" placeholder="Oraș" required className="w-full p-2 bg-slate-900 border border-slate-700 rounded focus:border-emerald-500 focus:outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            
            {/* Input cu datalist care îți sugerează emailurile existente, dar te lasă să tastezi ce vrei */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Email Administrator (Sugestie / Tastare liberă)</label>
              <input 
                type="email"
                list="admin-emails-list"
                placeholder="ex: admin@sparta.ro"
                className="p-2 bg-slate-900 border border-slate-700 rounded focus:border-emerald-500 focus:outline-none text-slate-300"
                value={formData.admin_email} 
                onChange={e => setFormData({...formData, admin_email: e.target.value})}
              />
              <datalist id="admin-emails-list">
                {admins.map(admin => (
                  <option key={admin.id} value={admin.email} />
                ))}
              </datalist>
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-xs text-slate-400 mb-1 block">Ora Deschidere</label>
                <input type="number" required className="w-full p-2 bg-slate-900 border border-slate-700 rounded focus:border-emerald-500 focus:outline-none" value={formData.opening_hour} onChange={e => setFormData({...formData, opening_hour: e.target.value})} />
              </div>
              <div className="w-1/2">
                <label className="text-xs text-slate-400 mb-1 block">Ora Închidere</label>
                <input type="number" required className="w-full p-2 bg-slate-900 border border-slate-700 rounded focus:border-emerald-500 focus:outline-none" value={formData.closing_hour} onChange={e => setFormData({...formData, closing_hour: e.target.value})} />
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              <button type="submit" className={`flex-1 font-bold py-2 rounded transition-colors ${editingId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                {editingId ? 'Salvează' : 'Adaugă'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', city: '', opening_hour: 8, closing_hour: 22, admin_email: '' }); }} className="bg-slate-600 hover:bg-slate-500 px-4 rounded font-bold transition-colors">
                  Anulează
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">Cluburi Existente ({clubs.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-600 text-slate-400">
                  <th className="py-3">Nume</th>
                  <th className="py-3">Oraș</th>
                  <th className="py-3">Email Admin</th> 
                  <th className="py-3">Program</th>
                  <th className="py-3 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map(club => (
                  <tr key={club.id} className="border-b border-slate-700 hover:bg-slate-750">
                    <td className="py-3 font-medium">{club.name}</td>
                    <td className="py-3 text-slate-300">{club.city}</td>
                    <td className="py-3 text-sm text-amber-400 font-semibold">{club.admin_email || 'Fără Admin'}</td> 
                    <td className="py-3 text-sm text-slate-400">{club.opening_hour}:00 - {club.closing_hour}:00</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button onClick={() => handleEditClick(club)} className="bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1 rounded transition-colors mr-2 text-sm">
                        Editează
                      </button>
                      <button onClick={() => handleDeleteClub(club.id)} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded transition-colors text-sm">
                        Șterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}