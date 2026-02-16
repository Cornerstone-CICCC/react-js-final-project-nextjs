import { useNavigate } from 'react-router';
import { Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-white mb-4">404</h1>
        <p className="text-2xl text-zinc-500 mb-8 font-bold">Page not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-white text-black rounded-full hover:scale-110 transition-all font-black flex items-center gap-3 mx-auto"
        >
          <Home className="w-6 h-6" />
          <span>Go back to home</span>
        </button>
      </div>
    </div>
  );
}
