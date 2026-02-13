import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { CheckCircle2, Circle, Clock, Trash2, Archive } from 'lucide-react';
import { api } from '../../lib/api';
import { getWeekDateRange } from '../../lib/week';
import { formatDateKR } from '../../lib/utils';
import { toast } from 'sonner';
import { LoadingSpinner, EmptyState, PageHeader, UserAvatar } from '../common';
import type { Study, WeeklyHistory, HistoryTodo, StudyMember } from '../../types';

export function HistoryPage() {
  const { studyId } = useParams<{ studyId: string }>();

  const [study, setStudy] = useState<Study | null>(null);
  const [history, setHistory] = useState<WeeklyHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);

  const loadData = useCallback(async () => {
    if (!studyId) return;
    try {
      const [studyRes, historyRes] = await Promise.all([
        api.getStudy(studyId),
        api.getHistory(studyId),
      ]);
      setStudy(studyRes.study);
      setHistory(historyRes.history);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    if (studyId) loadData();
  }, [studyId, loadData]);

  async function handleArchive() {
    if (!studyId || !confirm('Archive current week? This will save your progress and reset todos.')) return;
    setArchiving(true);
    try {
      await api.archiveWeek(studyId);
      await loadData();
      toast.success('Week archived successfully!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to archive week';
      toast.error(message);
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete(historyId: string) {
    if (!studyId || !confirm('Delete this week record?')) return;
    try {
      await api.deleteHistory(historyId);
      await loadData();
      toast.success('History deleted!');
    } catch {
      toast.error('Failed to delete history');
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!study) return <div className="flex-1 flex items-center justify-center bg-[#1a1a1a]"><p className="text-white/40">Study not found</p></div>;

  const currentWeekNumber = Math.max(1, study.currentWeek || 1);
  const currentWeekRange = getWeekDateRange(currentWeekNumber);
  const hasGoal = Boolean(study.currentGoal?.trim());
  const hasTodos = Array.isArray(study.todos) && study.todos.length > 0;
  const canArchive = hasGoal || hasTodos;

  const sortedHistory = [...history].sort((a, b) => b.weekNumber - a.weekNumber);

  return (
    <div className="flex-1 overflow-y-auto bg-[#1a1a1a] p-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          label="HISTORY"
          value={history.length}
          subtitle={`Current Week ${currentWeekNumber} (${formatDateKR(currentWeekRange.start)} - ${formatDateKR(currentWeekRange.end)})`}
          action={
            <button
              onClick={handleArchive}
              disabled={archiving || !canArchive}
              className="h-12 px-6 bg-white text-black rounded-full hover:bg-white/90 transition-all text-sm font-medium tracking-wide flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Archive className="w-4 h-4" />
              {archiving ? 'ARCHIVING...' : 'ARCHIVE WEEK'}
            </button>
          }
        />

        {!canArchive && (
          <p className="text-xs text-white/30 mb-8">
            Archive하려면 이번 주 목표 또는 TODO가 최소 1개 필요합니다.
          </p>
        )}

        {history.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No history yet"
            description="Archive your week to save progress"
            actionLabel={archiving ? 'ARCHIVING...' : 'ARCHIVE CURRENT WEEK'}
            onAction={canArchive && !archiving ? handleArchive : undefined}
          />
        ) : (
          <div className="space-y-6">
            {sortedHistory.map((record) => (
              <HistoryCard
                key={record.id}
                record={record}
                members={study.members}
                onDelete={() => handleDelete(record.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function HistoryCard({ record, members, onDelete }: {
  record: WeeklyHistory;
  members: StudyMember[];
  onDelete: () => void;
}) {
  const completedCount = record.todos.filter((t) => t.completed).length;
  const totalCount = record.todos.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 ${progress === 100 ? 'bg-lime-400' : 'bg-cyan-400'} rounded-full flex items-center justify-center`}>
            <span className="text-3xl font-light text-black">{progress}%</span>
          </div>
          <div>
            <div className="text-2xl font-light text-white mb-1">Week {record.weekNumber}</div>
            <div className="text-xs text-white/40 font-light tracking-wide">
              {formatDateKR(record.weekStart)} - {formatDateKR(record.weekEnd)}
            </div>
          </div>
        </div>
        <button onClick={onDelete} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
          <Trash2 className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {record.goal && (
        <div className="mb-6 p-4 bg-white/5 rounded-2xl">
          <div className="text-xs tracking-wide text-white/40 font-light mb-2">GOAL</div>
          <div className="text-white font-light">{record.goal}</div>
        </div>
      )}

      {record.todos.length > 0 && (
        <div>
          <div className="text-xs tracking-widest text-white/40 font-light mb-4">COMPLETION STATUS</div>
          {members.map((member, memberIndex) => {
            const userTodos = record.todos.filter((t) => t.user.id === member.user.id);
            if (userTodos.length === 0) return null;
            return (
              <MemberTodos
                key={member.user.id}
                memberName={member.user.name}
                memberIndex={memberIndex}
                todos={userTodos}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function MemberTodos({ memberName, memberIndex, todos }: {
  memberName: string;
  memberIndex: number;
  todos: HistoryTodo[];
}) {
  const completed = todos.filter((t) => t.completed).length;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar name={memberName} index={memberIndex} size="md" />
        <div className="flex-1">
          <div className="text-white font-light">{memberName || 'Unknown'}</div>
          <div className="text-xs text-white/40 font-light">{completed}/{todos.length} completed</div>
        </div>
      </div>
      <div className="ml-12 space-y-2">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
            {todo.completed ? (
              <CheckCircle2 className="w-5 h-5 text-lime-400 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-white/20 flex-shrink-0" />
            )}
            <span className={`text-sm font-light ${todo.completed ? 'text-white/60' : 'text-white/40'}`}>
              {todo.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
