import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Users,
  Target,
  CheckSquare,
  Calendar,
  MessageCircle,
  Video,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { api } from "../../lib/api";
import { getWeekDateRange } from "../../lib/week";
import { formatDateKR } from "../../lib/utils";
import { toast } from "sonner";
import { LoadingSpinner, UserAvatar } from "../common";
import type { Study, WeeklyHistory } from "../../types";

export function StudyHomePage() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();

  const [study, setStudy] = useState<Study | null>(null);
  const [history, setHistory] = useState<WeeklyHistory[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const loadData = useCallback(async () => {
    if (!studyId) return;
    try {
      const [studyRes, progressRes, historyRes] = await Promise.all([
        api.getStudy(studyId),
        api.getProgress(studyId),
        api.getHistory(studyId),
      ]);
      setStudy(studyRes.study);
      setHistory(historyRes.history);
      setProgress(progressRes.progress);
      setGoalInput(studyRes.study.currentGoal || "");
    } catch {
      toast.error("Failed to load study data");
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    if (studyId) loadData();
  }, [studyId, loadData]);

  async function handleSaveGoal() {
    if (!studyId || !goalInput.trim()) return;
    try {
      await api.updateStudy(studyId, { currentGoal: goalInput.trim() });
      setIsEditingGoal(false);
      toast.success("Goal updated!");
      await loadData();
    } catch {
      toast.error("Failed to update goal");
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!study)
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1a1a1a]">
        <p className="text-white/40">Study not found</p>
      </div>
    );

  const currentWeekNumber = Math.max(1, study.currentWeek || 1);
  const currentWeekRange = getWeekDateRange(currentWeekNumber);
  const recentHistory = [...history]
    .sort((a, b) => b.weekNumber - a.weekNumber)
    .slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto bg-[#1a1a1a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <div className="aspect-square bg-lime-400 rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <div className="text-8xl font-light text-black mb-2">
                  {progress}%
                </div>
                <div className="text-sm tracking-widest text-black/60 font-light">
                  PROGRESS
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-6 lg:col-span-2">
            <div className="aspect-square bg-white/5 rounded-full flex flex-col items-center justify-center p-6">
              <Users className="w-8 h-8 text-white/40 mb-3" />
              <div className="text-4xl font-light text-white">
                {study.members.length}
              </div>
              <div className="text-xs tracking-widest text-white/40 font-light mt-2">
                MEMBERS
              </div>
            </div>
          </div>

          <NavCircle
            icon={Video}
            label={"VIDEO\nSTUDY"}
            color="bg-cyan-400"
            onClick={() => navigate(`/meeting/${studyId}`)}
          />
          <NavCircle
            icon={MessageCircle}
            label="CHAT"
            color="bg-pink-500"
            onClick={() => navigate(`/app/study/${studyId}/chat`)}
          />
          <NavCircle
            icon={CheckSquare}
            label="TODOS"
            color="bg-purple-500"
            onClick={() => navigate(`/app/study/${studyId}/todos`)}
          />

          <div className="col-span-12 lg:col-span-8 bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
            <GoalHeader
              weekNumber={currentWeekNumber}
              weekRange={currentWeekRange}
            />

            {isEditingGoal ? (
              <GoalEditor
                value={goalInput}
                onChange={setGoalInput}
                onSave={handleSaveGoal}
                onCancel={() => {
                  setIsEditingGoal(false);
                  setGoalInput(study.currentGoal || "");
                }}
              />
            ) : (
              <GoalDisplay
                goal={study.currentGoal}
                onEdit={() => setIsEditingGoal(true)}
              />
            )}

            <RecentArchives
              history={recentHistory}
              onViewAll={() => navigate(`/app/study/${studyId}/history`)}
            />
          </div>

          <div className="col-span-12 lg:col-span-4 bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
            <h3 className="text-sm tracking-widest text-white/40 font-light mb-6">
              MEMBERS
            </h3>
            <div className="space-y-4">
              {study.members.map((member, index) => (
                <div key={member.user.id} className="flex items-center gap-3">
                  <UserAvatar name={member.user.name} index={index} size="md" />
                  <div>
                    <div className="text-sm font-medium text-white">
                      {member.user.name}
                    </div>
                    <div className="text-xs text-white/40 font-light">
                      {member.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function NavCircle({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: typeof Video;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="col-span-6 lg:col-span-2 cursor-pointer group"
    >
      <div
        className={`aspect-square ${color} rounded-full flex flex-col items-center justify-center p-6 hover:scale-105 transition-transform`}
      >
        <Icon className="w-10 h-10 text-black mb-3" />
        <div className="text-xs tracking-widest text-black/80 font-medium text-center whitespace-pre-line">
          {label}
        </div>
      </div>
    </div>
  );
}

function GoalHeader({
  weekNumber,
  weekRange,
}: {
  weekNumber: number;
  weekRange: { start: string; end: string };
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center">
        <Target className="w-6 h-6 text-black" />
      </div>
      <div>
        <h3 className="text-sm tracking-widest text-white/40 font-light">
          WEEKLY GOAL
        </h3>
        <p className="text-xs text-white/20 font-light">
          Week {weekNumber} ({formatDateKR(weekRange.start)} -{" "}
          {formatDateKR(weekRange.end)})
        </p>
      </div>
    </div>
  );
}

function GoalEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Set your weekly goal..."
        className="w-full h-32 px-4 py-3 bg-white/5 text-white rounded-2xl mb-4 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/30 font-light resize-none"
        autoFocus
      />
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="h-10 px-6 bg-white/5 text-white rounded-full hover:bg-white/10 transition-all text-sm font-medium tracking-wide flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          CANCEL
        </button>
        <button
          onClick={onSave}
          disabled={!value.trim()}
          className="h-10 px-6 bg-white text-black rounded-full hover:bg-white/90 transition-all text-sm font-medium tracking-wide flex items-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          SAVE
        </button>
      </div>
    </div>
  );
}

function GoalDisplay({ goal, onEdit }: { goal: string; onEdit: () => void }) {
  return (
    <div>
      {goal ? (
        <p className="text-2xl font-light text-white mb-6">{goal}</p>
      ) : (
        <p className="text-xl font-light text-white/30 mb-6 italic">
          No goal set yet
        </p>
      )}
      <button
        onClick={onEdit}
        className="h-10 px-6 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all text-sm font-medium tracking-wide flex items-center gap-2"
      >
        <Edit2 className="w-4 h-4" />
        {goal ? "EDIT GOAL" : "SET GOAL"}
      </button>
    </div>
  );
}

function RecentArchives({
  history,
  onViewAll,
}: {
  history: WeeklyHistory[];
  onViewAll: () => void;
}) {
  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs tracking-widest text-white/40 font-light">
          RECENT ARCHIVES
        </h4>
        <button
          onClick={onViewAll}
          className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors tracking-wide"
        >
          VIEW ALL
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-white/30 font-light">
          아직 아카이브된 주차가 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {history.map((record) => (
            <button
              key={record.id}
              onClick={onViewAll}
              className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              <div className="text-sm text-white">Week {record.weekNumber}</div>
              <div className="text-xs text-white/40">
                {formatDateKR(record.weekStart)} -{" "}
                {formatDateKR(record.weekEnd)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
