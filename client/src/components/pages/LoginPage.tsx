import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { LogIn } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-lime-400 rounded-full mb-6">
            <LogIn className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-5xl font-extralight tracking-tighter text-white mb-2">
            STUDYHUB
          </h1>
          <p className="text-white/40 font-light tracking-wide">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-xs text-white/40 font-light tracking-widest mb-2"
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-14 px-6 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/30 font-light"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs text-white/40 font-light tracking-widest mb-2"
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-14 px-6 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/30 font-light"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-red-400 text-sm font-light">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-white text-black rounded-full hover:bg-white/90 transition-all font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "LOGGING IN..." : "LOG IN"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/40 font-light">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-white hover:text-white/80 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-white/40 hover:text-white/60 text-sm font-light"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
