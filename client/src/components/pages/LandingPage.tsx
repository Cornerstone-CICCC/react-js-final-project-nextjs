import { useNavigate } from "react-router";
import {
  Users,
  Target,
  CheckSquare,
  Calendar,
  MessageCircle,
  Video,
  Clock,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate("/app");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center mb-32">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-lime-400 rounded-full mb-12">
            <Users className="w-16 h-16 text-black" />
          </div>
          <h1 className="text-8xl font-extralight tracking-tighter text-white mb-6">
            STUDYHUB
          </h1>
          <p className="text-xl text-white/40 mb-12 font-light tracking-wide max-w-2xl mx-auto">
            Manage your study group with transparency and efficiency
          </p>
          <button
            onClick={handleStart}
            className="h-16 px-12 bg-white text-black rounded-full hover:bg-white/90 transition-all text-lg font-medium tracking-wide"
          >
            GET STARTED
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          <div className="aspect-square bg-lime-400 rounded-[3rem] p-8 flex flex-col justify-between">
            <MessageCircle className="w-12 h-12 text-black" />
            <div>
              <div className="text-3xl font-light text-black mb-2">Chat</div>
              <div className="text-sm text-black/60 font-light tracking-wide">
                Real-time messaging
              </div>
            </div>
          </div>

          <div className="aspect-square bg-cyan-400 rounded-[3rem] p-8 flex flex-col justify-between">
            <Target className="w-12 h-12 text-black" />
            <div>
              <div className="text-3xl font-light text-black mb-2">Goals</div>
              <div className="text-sm text-black/60 font-light tracking-wide">
                Weekly objectives
              </div>
            </div>
          </div>

          <div className="aspect-square bg-pink-500 rounded-[3rem] p-8 flex flex-col justify-between">
            <CheckSquare className="w-12 h-12 text-black" />
            <div>
              <div className="text-3xl font-light text-black mb-2">Todos</div>
              <div className="text-sm text-black/60 font-light tracking-wide">
                Track progress
              </div>
            </div>
          </div>

          <div className="aspect-square bg-amber-400 rounded-[3rem] p-8 flex flex-col justify-between">
            <Calendar className="w-12 h-12 text-black" />
            <div>
              <div className="text-3xl font-light text-black mb-2">
                Schedule
              </div>
              <div className="text-sm text-black/60 font-light tracking-wide">
                Plan meetings
              </div>
            </div>
          </div>

          <div className="aspect-square bg-purple-500 rounded-[3rem] p-8 flex flex-col justify-between">
            <Video className="w-12 h-12 text-black" />
            <div>
              <div className="text-3xl font-light text-black mb-2">Video</div>
              <div className="text-sm text-black/60 font-light tracking-wide">
                Screen sharing
              </div>
            </div>
          </div>

          <div className="aspect-square bg-white/5 backdrop-blur-xl rounded-[3rem] p-8 flex flex-col justify-between border border-white/10">
            <Clock className="w-12 h-12 text-white/40" />
            <div>
              <div className="text-3xl font-light text-white mb-2">History</div>
              <div className="text-sm text-white/40 font-light tracking-wide">
                Archive progress
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-16 text-center">
          <h2 className="text-5xl font-light text-white mb-12 tracking-tight">
            Built for small study groups
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-6xl font-extralight text-white/20 mb-4">
                01
              </div>
              <p className="text-white/60 font-light leading-relaxed">
                Transparent progress tracking for all members
              </p>
            </div>
            <div>
              <div className="text-6xl font-extralight text-white/20 mb-4">
                02
              </div>
              <p className="text-white/60 font-light leading-relaxed">
                Video meetings with screen sharing support
              </p>
            </div>
            <div>
              <div className="text-6xl font-extralight text-white/20 mb-4">
                03
              </div>
              <p className="text-white/60 font-light leading-relaxed">
                Simple interface that keeps everyone accountable
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
