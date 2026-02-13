import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  Minus,
  Edit,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useSocketEvent } from '../../hooks';
import { toast } from 'sonner';
import { LoadingSpinner, EmptyState, Modal, PageHeader } from '../common';
import type { Study, Schedule, AttendanceStatus, ScheduleFormData } from '../../types';

const EMPTY_FORM: ScheduleFormData = { title: '', date: '', time: '', location: '' };

export function SchedulePage() {
  const { studyId } = useParams<{ studyId: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [study, setStudy] = useState<Study | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>(EMPTY_FORM);

  const loadSchedules = useCallback(async () => {
    if (!studyId) return;
    try {
      const response = await api.getSchedules(studyId);
      setSchedules(response.schedules);
    } catch {
      toast.error('Failed to load schedules');
    }
  }, [studyId]);

  useEffect(() => {
    if (!studyId) return;
    (async () => {
      try {
        const [studyRes, schedulesRes] = await Promise.all([
          api.getStudy(studyId),
          api.getSchedules(studyId),
        ]);
        setStudy(studyRes.study);
        setSchedules(schedulesRes.schedules);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [studyId]);

  useSocketEvent('schedule-updated', loadSchedules, !!studyId);

  const broadcastUpdate = () => socket?.emit('schedule-update', { studyId });

  async function handleSubmit() {
    if (!formData.title.trim() || !formData.date || !formData.time || !formData.location.trim() || !studyId) return;
    try {
      const payload = {
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time,
        location: formData.location.trim(),
      };
      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id, payload);
        toast.success('Schedule updated!');
      } else {
        await api.createSchedule(studyId, payload);
        toast.success('Schedule created!');
      }
      closeModal();
      await loadSchedules();
      broadcastUpdate();
    } catch {
      toast.error('Failed to save schedule');
    }
  }

  function openEditModal(schedule: Schedule) {
    setEditingSchedule(schedule);
    setFormData({ title: schedule.title, date: schedule.date, time: schedule.time, location: schedule.location });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData(EMPTY_FORM);
  }

  async function handleDelete(scheduleId: string) {
    if (!studyId || !confirm('Delete this schedule?')) return;
    try {
      await api.deleteSchedule(scheduleId);
      await loadSchedules();
      toast.success('Schedule deleted!');
      broadcastUpdate();
    } catch {
      toast.error('Failed to delete schedule');
    }
  }

  async function handleAttendance(scheduleId: string, status: AttendanceStatus) {
    if (!studyId) return;
    try {
      await api.updateAttendance(scheduleId, status);
      await loadSchedules();
      broadcastUpdate();
    } catch {
      toast.error('Failed to update attendance');
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!study) return <div className="flex-1 flex items-center justify-center bg-[#1a1a1a]"><p className="text-white/40">Study not found</p></div>;

  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime(),
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#1a1a1a] p-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          label="SCHEDULES"
          value={schedules.length}
          action={
            <button
              onClick={() => { setEditingSchedule(null); setFormData(EMPTY_FORM); setShowModal(true); }}
              className="h-12 px-6 bg-white text-black rounded-full hover:bg-white/90 transition-all text-sm font-medium tracking-wide"
            >
              ADD SCHEDULE
            </button>
          }
        />

        {schedules.length === 0 ? (
          <EmptyState icon={Calendar} title="No schedules yet" actionLabel="ADD FIRST SCHEDULE" onAction={() => setShowModal(true)} />
        ) : (
          <div className="space-y-6">
            {sortedSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                study={study}
                currentUserId={user?.id}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onAttendance={handleAttendance}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        title={editingSchedule ? 'EDIT SCHEDULE' : 'ADD SCHEDULE'}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={editingSchedule ? 'SAVE' : 'ADD'}
        submitDisabled={!formData.title.trim() || !formData.date || !formData.time || !formData.location.trim()}
      >
        <ScheduleForm formData={formData} onChange={setFormData} />
      </Modal>
    </div>
  );
}

// --- Sub-components ---

function ScheduleForm({ formData, onChange }: { formData: ScheduleFormData; onChange: (d: ScheduleFormData) => void }) {
  const update = (field: keyof ScheduleFormData, value: string) => onChange({ ...formData, [field]: value });
  const inputClass = 'w-full h-12 px-4 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/30 font-light';

  return (
    <div className="space-y-4">
      <input type="text" value={formData.title} onChange={(e) => update('title', e.target.value)} placeholder="Title" className={inputClass} />
      <input type="date" value={formData.date} onChange={(e) => update('date', e.target.value)} className={inputClass} />
      <input type="time" value={formData.time} onChange={(e) => update('time', e.target.value)} className={inputClass} />
      <input type="text" value={formData.location} onChange={(e) => update('location', e.target.value)} placeholder="Location" className={inputClass} />
    </div>
  );
}

function ScheduleCard({
  schedule, study, currentUserId, onEdit, onDelete, onAttendance,
}: {
  schedule: Schedule; study: Study; currentUserId?: string;
  onEdit: (s: Schedule) => void; onDelete: (id: string) => void;
  onAttendance: (id: string, status: AttendanceStatus) => void;
}) {
  const attendingCount = schedule.attendances.filter((a) => a.status === 'attending').length;
  const currentStatus: AttendanceStatus = schedule.attendances.find((a) => a.user.id === currentUserId)?.status ?? 'pending';

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-light text-white mb-2">{schedule.title}</h3>
          <div className="text-xs tracking-widest text-white/40 font-light">{attendingCount}/{study.members.length} ATTENDING</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(schedule)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
            <Edit className="w-5 h-5 text-white/60" />
          </button>
          <button onClick={() => onDelete(schedule.id)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
            <Trash2 className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <DetailCard icon={Calendar} label="DATE" value={schedule.date} />
        <DetailCard icon={Clock} label="TIME" value={schedule.time} />
        <DetailCard icon={MapPin} label="LOCATION" value={schedule.location} />
      </div>

      <div className="mb-6">
        <div className="text-xs tracking-widest text-white/40 font-light mb-3">YOUR STATUS</div>
        <div className="grid grid-cols-3 gap-3">
          {([
            { status: 'attending' as const, label: 'ATTENDING', icon: <Check className="w-5 h-5 inline mr-2" />, color: 'bg-lime-400 text-black' },
            { status: 'not-attending' as const, label: 'NOT ATTENDING', icon: <X className="w-5 h-5 inline mr-2" />, color: 'bg-pink-500 text-black' },
            { status: 'pending' as const, label: 'MAYBE', icon: <Minus className="w-5 h-5 inline mr-2" />, color: 'bg-amber-400 text-black' },
          ] as const).map((btn) => (
            <button
              key={btn.status}
              onClick={() => onAttendance(schedule.id, btn.status)}
              className={`h-12 rounded-2xl transition-all font-medium text-sm tracking-wide ${currentStatus === btn.status ? btn.color : 'bg-white/5 text-white hover:bg-white/10'}`}
            >
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs tracking-widest text-white/40 font-light mb-3">MEMBERS</div>
        <div className="space-y-2">
          {study.members.map((member) => {
            const status = schedule.attendances.find((a) => a.user.id === member.user.id)?.status ?? 'pending';
            return (
              <div key={member.user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                <span className="text-white font-light">{member.user.name || 'Unknown'}</span>
                <span className={`text-xs font-medium tracking-wide ${status === 'attending' ? 'text-lime-400' : status === 'not-attending' ? 'text-pink-500' : 'text-white/40'}`}>
                  {status === 'attending' ? 'ATTENDING' : status === 'not-attending' ? 'NOT ATTENDING' : 'PENDING'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/40" />
        <span className="text-xs tracking-wide text-white/40 font-light">{label}</span>
      </div>
      <div className="text-white font-light text-sm">{value}</div>
    </div>
  );
}
