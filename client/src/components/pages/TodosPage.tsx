import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { CheckSquare, Circle, CheckCircle2, Edit2, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { useSocketEvent } from "../../hooks";
import { toast } from "sonner";
import {
  LoadingSpinner,
  EmptyState,
  Modal,
  UserAvatar,
  PageHeader,
} from "../common";
import type { Study, Todo } from "../../types";

export function TodosPage() {
  const { studyId } = useParams<{ studyId: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [study, setStudy] = useState<Study | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [editingTodo, setEditingTodo] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const loadTodos = useCallback(async () => {
    if (!studyId) return;
    try {
      const response = await api.getTodos(studyId);
      setTodos(response.todos);
    } catch {
      toast.error("Failed to load todos");
    }
  }, [studyId]);

  useEffect(() => {
    if (!studyId) return;
    (async () => {
      try {
        const [studyRes, todosRes] = await Promise.all([
          api.getStudy(studyId),
          api.getTodos(studyId),
        ]);
        setStudy(studyRes.study);
        setTodos(todosRes.todos);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [studyId]);

  useSocketEvent("todo-updated", loadTodos, !!studyId);

  const broadcastUpdate = () => socket?.emit("todo-update", { studyId });

  async function handleToggle(todoId: string, userId: string) {
    if (userId !== user?.id) return;
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    try {
      await api.updateTodo(todoId, { completed: !todo.completed });
      await loadTodos();
      broadcastUpdate();
    } catch {
      toast.error("Failed to toggle todo");
    }
  }

  async function handleAddTodo() {
    if (!newTodoTitle.trim() || !studyId) return;
    try {
      await api.createTodo(studyId, newTodoTitle.trim());
      setNewTodoTitle("");
      setShowAddModal(false);
      await loadTodos();
      toast.success("Todo added!");
      broadcastUpdate();
    } catch {
      toast.error("Failed to add todo");
    }
  }

  async function handleUpdateTodo() {
    if (!editingTodo?.title.trim() || !studyId) return;
    try {
      await api.updateTodo(editingTodo.id, { title: editingTodo.title.trim() });
      setEditingTodo(null);
      setShowEditModal(false);
      await loadTodos();
      toast.success("Todo updated!");
      broadcastUpdate();
    } catch {
      toast.error("Failed to update todo");
    }
  }

  async function handleDeleteTodo(todoId: string) {
    if (!studyId || !confirm("Delete this todo?")) return;
    try {
      await api.deleteTodo(todoId);
      await loadTodos();
      toast.success("Todo deleted!");
      broadcastUpdate();
    } catch {
      toast.error("Failed to delete todo");
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!study)
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1a1a1a]">
        <p className="text-white/40">Study not found</p>
      </div>
    );

  const completedCount = todos.filter((t) => t.completed).length;
  const todosByUser = groupTodosByUser(todos, study);

  return (
    <div className="flex-1 overflow-y-auto bg-[#1a1a1a] p-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          label="PROGRESS"
          value={`${completedCount}/${todos.length}`}
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="h-12 px-6 bg-white text-black rounded-full hover:bg-white/90 transition-all text-sm font-medium tracking-wide"
            >
              ADD TODO
            </button>
          }
        />

        {todos.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No todos yet"
            actionLabel="ADD FIRST TODO"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="space-y-8">
            {study.members.map((member, memberIndex) => {
              const userTodos = todosByUser[member.user.id] ?? [];
              if (userTodos.length === 0) return null;

              const userCompleted = userTodos.filter((t) => t.completed).length;

              return (
                <div
                  key={member.user.id}
                  className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <UserAvatar
                      name={member.user.name}
                      index={memberIndex}
                      size="lg"
                    />
                    <div>
                      <div className="text-white font-medium">
                        {member.user.name || "Unknown"}
                      </div>
                      <div className="text-xs text-white/40 font-light tracking-wide">
                        {userCompleted}/{userTodos.length} COMPLETED
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {userTodos.map((todo) => {
                      const isOwner = todo.user.id === user?.id;
                      return (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          isOwner={isOwner}
                          onToggle={() => handleToggle(todo.id, todo.user.id)}
                          onEdit={() => {
                            setEditingTodo({ id: todo.id, title: todo.title });
                            setShowEditModal(true);
                          }}
                          onDelete={() => handleDeleteTodo(todo.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={showAddModal}
        title="ADD TODO"
        onClose={() => {
          setShowAddModal(false);
          setNewTodoTitle("");
        }}
        onSubmit={handleAddTodo}
        submitLabel="ADD"
        submitDisabled={!newTodoTitle.trim()}
      >
        <textarea
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-6 py-4 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 resize-none placeholder-white/30 font-light"
          rows={3}
          autoFocus
        />
      </Modal>

      <Modal
        open={showEditModal && !!editingTodo}
        title="EDIT TODO"
        onClose={() => {
          setShowEditModal(false);
          setEditingTodo(null);
        }}
        onSubmit={handleUpdateTodo}
        submitLabel="SAVE"
        submitDisabled={!editingTodo?.title.trim()}
      >
        <textarea
          value={editingTodo?.title ?? ""}
          onChange={(e) =>
            editingTodo &&
            setEditingTodo({ ...editingTodo, title: e.target.value })
          }
          className="w-full px-6 py-4 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 resize-none font-light"
          rows={3}
          autoFocus
        />
      </Modal>
    </div>
  );
}

// --- Helpers ---

function groupTodosByUser(todos: Todo[], study: Study): Record<string, Todo[]> {
  const result: Record<string, Todo[]> = {};
  study.members.forEach((m) => {
    result[m.user.id] = todos.filter((t) => t.user.id === m.user.id);
  });
  return result;
}

// --- Sub-components ---

function TodoItem({
  todo,
  isOwner,
  onToggle,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  isOwner: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${todo.completed ? "bg-white/5 border-white/10" : "bg-white/[0.02] border-white/5"}`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          disabled={!isOwner}
          className={`flex-shrink-0 ${isOwner ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
        >
          {todo.completed ? (
            <CheckCircle2 className="w-6 h-6 text-white" />
          ) : (
            <Circle className="w-6 h-6 text-white/30" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`font-light ${todo.completed ? "text-white/40 line-through" : "text-white"}`}
          >
            {todo.title}
          </p>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <Edit2 className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <Trash2 className="w-4 h-4 text-white/60" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
