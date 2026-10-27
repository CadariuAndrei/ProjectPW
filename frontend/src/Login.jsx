import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        navigate('/');
      } else {
        setError(data.error || 'Eroare la autentificare');
      }
    } catch (err) {
      setError('Eroare de conexiune la server.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-800 p-8 rounded-xl border border-slate-700 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center text-emerald-400">Autentificare</h2>
      
      {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm text-slate-300 mb-1">Parolă</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
            required 
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded mt-4 transition-colors"
        >
          Intră în cont
        </button>
      </form>
    </div>
  );
}

export default Login;