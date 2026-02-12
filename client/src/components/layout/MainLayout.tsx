import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import {
  Users,
  Hash,
  MessageCircle,
  CheckSquare,
  Calendar,
  Clock,
  LogOut,
  Copy,
  Check,
  Menu,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import { getUserColor } from "../../lib/utils";
import { toast } from "sonner";
import { Modal } from "../common";
import { ProtectedRoute } from "../ProtectedRoute";
import type { Study } from "../../types";

export function MainLayout() {
  const navigate = useNavigate();
  const { studyId } = useParams();
  const { user, logout } = useAuth();

  const [showSidebar, setShowSidebar] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [studyName, setStudyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [studies, setStudies] = useState<Study[]>([]);
  const [currentStudy, setCurrentStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudies = useCallback(async () => {
    try {
      const response = await api.getStudies();
      setStudies(response.studies);
    } catch {
      toast.error("Failed to load studies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudies();
  }, [loadStudies]);

  useEffect(() => {
    if (studyId) {
      (async () => {
        try {
          const response = await api.getStudy(studyId);
          setCurrentStudy(response.study);
        } catch {
          toast.error("Failed to load study");
        }
      })();
    } else {
      setCurrentStudy(null);
    }
  }, [studyId]);

  async function handleCreateStudy() {
    if (!studyName.trim()) return;
    try {
      const response = await api.createStudy(studyName.trim());
      setShowCreateModal(false);
      setStudyName("");
      toast.success("Study created!");
      await loadStudies();
      navigate(`/app/study/${response.study.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create study";
      toast.error(message);
    }
  }

  async function handleJoinStudy() {
    if (!inviteCode.trim()) return;
    try {
      const response = await api.joinStudy(inviteCode.trim().toUpperCase());
      setShowJoinModal(false);
      setInviteCode("");
      toast.success("Joined study!");
      await loadStudies();
      navigate(`/app/study/${response.study.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Invalid invite code";
      toast.error(message);
    }
  }

  function handleCopyInviteCode() {
    if (!currentStudy) return;
    navigator.clipboard.writeText(currentStudy.inviteCode);
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch {
      toast.error("Failed to logout");
    }
  }

  return (
    <ProtectedRoute>
      <div className="h-screen bg-[#1a1a1a] flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="w-72 bg-black/40 backdrop-blur-xl flex-col flex-shrink-0 hidden md:flex border-r border-white/5">
          <SidebarContent
            studies={studies}
            loading={loading}
            activeStudyId={studyId}
            userName={user?.name}
            onSelectStudy={(id) => navigate(`/app/study/${id}`)}
            onCreateStudy={() => setShowCreateModal(true)}
            onJoinStudy={() => setShowJoinModal(true)}
            onLogout={handleLogout}
          />
        </div>

        {/* Mobile sidebar overlay + drawer */}
        {showSidebar && (
          <div className="md:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSidebar(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#1a1a1a] border-r border-white/5 flex flex-col">
              <SidebarContent
                studies={studies}
                loading={loading}
                activeStudyId={studyId}
                userName={user?.name}
                onSelectStudy={(id) => {
                  navigate(`/app/study/${id}`);
                  setShowSidebar(false);
                }}
                onCreateStudy={() => {
                  setShowCreateModal(true);
                  setShowSidebar(false);
                }}
                onJoinStudy={() => {
                  setShowJoinModal(true);
                  setShowSidebar(false);
                }}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {currentStudy ? (
            <>
              <TopBar
                study={currentStudy}
                copied={copied}
                onCopy={handleCopyInviteCode}
                onMenuToggle={() => setShowSidebar(!showSidebar)}
              />
              <TabNav studyId={studyId!} />
              <Outlet />
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="h-14 flex items-center px-4 md:hidden">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Users className="w-16 h-16 text-white/20" />
                  </div>
                  <h2 className="text-3xl font-light tracking-tight text-white mb-4">
                    SELECT A STUDY
                  </h2>
                  <p className="text-white/40 font-light mb-8 tracking-wide">
                    Or create a new one
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="h-12 px-8 bg-white text-black rounded-full hover:bg-white/90 transition-all font-medium tracking-wide text-sm"
                  >
                    CREATE STUDY
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Modal
          open={showCreateModal}
          title="CREATE STUDY"
          onClose={() => {
            setShowCreateModal(false);
            setStudyName("");
          }}
          onSubmit={handleCreateStudy}
          submitLabel="CREATE"
          submitDisabled={!studyName.trim()}
        >
          <p className="text-white/40 text-sm font-light mb-6">
            Start a new study group
          </p>
          <input
            type="text"
            value={studyName}
            onChange={(e) => setStudyName(e.target.value)}
            placeholder="Study name"
            className="w-full h-12 px-4 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/30 font-light"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreateStudy()}
          />
        </Modal>

        <Modal
          open={showJoinModal}
          title="JOIN STUDY"
          onClose={() => {
            setShowJoinModal(false);
            setInviteCode("");
          }}
          onSubmit={handleJoinStudy}
          submitLabel="JOIN"
          submitDisabled={!inviteCode.trim()}
        >
          <p className="text-white/40 text-sm font-light mb-6">
            Enter the invite code
          </p>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="INVITE CODE"
            className="w-full h-12 px-4 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/30 uppercase font-mono text-center tracking-widest"
            autoFocus
            maxLength={8}
            onKeyDown={(e) => e.key === "Enter" && handleJoinStudy()}
          />
        </Modal>
      </div>
    </ProtectedRoute>
  );
}

// --- Sub-components ---

function SidebarContent({
  studies,
  loading,
  activeStudyId,
  userName,
  onSelectStudy,
  onCreateStudy,
  onJoinStudy,
  onLogout,
}: {
  studies: Study[];
  loading: boolean;
  activeStudyId?: string;
  userName?: string;
  onSelectStudy: (id: string) => void;
  onCreateStudy: () => void;
  onJoinStudy: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="p-8 pt-16 md:pt-8">
        <h1 className="text-3xl font-light tracking-tight text-white mb-2">
          STUDYHUB
        </h1>
        <p className="text-sm text-white/40 font-light tracking-wide">
          STUDY MANAGEMENT
        </p>
      </div>

      <div className="px-8 mb-6">
        <button
          onClick={onCreateStudy}
          className="w-full h-12 bg-white text-black rounded-full hover:bg-white/90 transition-all font-medium tracking-wide text-sm mb-3"
        >
          CREATE STUDY
        </button>
        <button
          onClick={onJoinStudy}
          className="w-full h-12 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all font-medium tracking-wide text-sm"
        >
          JOIN STUDY
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8">
        <div className="text-xs text-white/40 font-light tracking-widest mb-4">
          MY STUDIES
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          </div>
        ) : studies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-white/40 font-light">No studies yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {studies.map((study, index) => (
              <button
                key={study.id}
                onClick={() => onSelectStudy(study.id)}
                className={`w-full p-4 rounded-2xl text-left transition-all group ${activeStudyId === study.id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${getUserColor(index)} rounded-full flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-black font-medium text-sm">
                      {study.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">
                      {study.name}
                    </div>
                    <div className="text-xs text-white/40 font-light">
                      {study.members.length} members
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-black font-medium text-sm">
              {userName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {userName}
            </div>
            <div className="text-xs text-white/40 font-light">Online</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full h-10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all text-sm font-medium tracking-wide flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          LOGOUT
        </button>
      </div>
    </>
  );
}

function TopBar({
  study,
  copied,
  onCopy,
  onMenuToggle,
}: {
  study: Study;
  copied: boolean;
  onCopy: () => void;
  onMenuToggle: () => void;
}) {
  return (
    <div className="h-14 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-light tracking-tight text-white">
            {study.name}
          </h2>
          <p className="text-xs text-white/40 font-light tracking-wide">
            {study.members.length} MEMBERS
          </p>
        </div>
      </div>
      <button
        onClick={onCopy}
        className="h-10 px-4 md:px-6 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all text-sm font-medium tracking-wide flex items-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">COPIED!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">{study.inviteCode}</span>
          </>
        )}
      </button>
    </div>
  );
}

const TABS = [
  { path: "", label: "DASHBOARD", icon: Hash },
  { path: "/chat", label: "CHAT", icon: MessageCircle },
  { path: "/todos", label: "TODOS", icon: CheckSquare },
  { path: "/schedule", label: "SCHEDULE", icon: Calendar },
  { path: "/history", label: "HISTORY", icon: Clock },
] as const;

function TabNav({ studyId }: { studyId: string }) {
  const navigate = useNavigate();

  return (
    <div className="bg-black/40 backdrop-blur-xl border-b border-white/5 px-8 flex gap-6 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive =
          location.pathname === `/app/study/${studyId}${tab.path}`;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(`/app/study/${studyId}${tab.path}`)}
            className={`py-4 text-xs font-medium tracking-widest whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? "text-white border-white"
                : "text-white/40 border-transparent hover:text-white/60"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
