import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import zxcvbn from "zxcvbn";

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength
  const passwordStrength = password.length > 0 ? zxcvbn(password) : null;
  const strengthColors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#84cc16",
    "#22c55e",
  ];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password strength
    if (passwordStrength && passwordStrength.score < 2) {
      setError(
        "Password is too weak. " + (passwordStrength.feedback.warning || ""),
      );
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, name);
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-cyan-400 rounded-full mb-6">
            <UserPlus className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-5xl font-extralight tracking-tighter text-white mb-2">
            STUDYHUB
          </h1>
          <p className="text-white/40 font-light tracking-wide">
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-xs text-white/40 font-light tracking-widest mb-2"
            >
              NAME
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-14 px-6 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/30 font-light"
              placeholder="Your name"
            />
          </div>

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
              minLength={8}
              className="w-full h-14 px-6 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/30 font-light"
              placeholder="••••••••"
            />

            {passwordStrength && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        backgroundColor:
                          level <= passwordStrength.score
                            ? strengthColors[passwordStrength.score]
                            : "rgba(255, 255, 255, 0.1)",
                      }}
                    />
                  ))}
                </div>
                <p
                  className="text-xs font-light"
                  style={{ color: strengthColors[passwordStrength.score] }}
                >
                  {strengthLabels[passwordStrength.score]}
                </p>
                {passwordStrength.feedback.suggestions.length > 0 && (
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/40 font-light">
                      {passwordStrength.feedback.suggestions[0]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-red-400 text-sm font-light">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (passwordStrength !== null && passwordStrength.score < 2)
            }
            className="w-full h-14 bg-white text-black rounded-full hover:bg-white/90 transition-all font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/40 font-light">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-white hover:text-white/80 font-medium"
            >
              Log in
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
