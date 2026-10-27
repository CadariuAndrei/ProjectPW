import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    skill_level: 2.5
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Cont creat cu succes! Te redirecționăm spre login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Eroare la înregistrare');
      }
    } catch (err) {
      setError('Eroare de conexiune la server.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-md mx-auto bg-slate-800 p-8 rounded-xl border border-slate-700 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center text-emerald-400">Creare Cont</h2>
      
      {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 p-3 rounded mb-4 text-sm">{success}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Nume Complet</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
            required 
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Email</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm text-slate-300 mb-1">Parolă</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
            required 
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Nivel NTRP (Skill Level: 2.0 - 5.0)</label>
          <input 
            type="number" 
            name="skill_level"
            step="0.5"
            min="2.0"
            max="5.0"
            value={formData.skill_level}
            onChange={handleChange}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
            required 
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded mt-4 transition-colors"
        >
          Creează cont
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-slate-400">
        Ai deja cont? <Link to="/login" className="text-emerald-400 hover:underline">Loghează-te aici</Link>
      </div>
    </div>
  );
}

export default Register;