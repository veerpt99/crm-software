import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api";

function FollowUps() {
  const nav = useNavigate();
  const { id } = useParams(); // ✅ FIX: read lead id from URL

  const [list, setList] = useState([]);

  const [form, setForm] = useState({
    status: "Pending",
    mode: "Call",
    priority: "Medium",
    notes: "",
    created_by: "",
    follow_up_date: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  /* ================= LOAD ================= */
  const load = useCallback(async () => {
    if (!id) return;
    const res = await api.get(`/followups/${id}?t=${Date.now()}`);
    setList(res.data || []);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /* ================= ADD ================= */
  const submit = async () => {
    if (!form.notes) {
      alert("Please add notes");
      return;
    }

    if (!form.follow_up_date) {
      alert("Please select follow-up date");
      return;
    }

    await api.post("/add-followup", {
      ...form,
      lead_id: id, // ✅ now always defined
    });

    // reset form
    setForm({
      status: "Pending",
      mode: "Call",
      priority: "Medium",
      notes: "",
      created_by: "",
      follow_up_date: "",
    });

    load();
  };

  /* ================= LOGIC ================= */
  const today = new Date().toISOString().split("T")[0];

  const pending = list.filter((f) => f.status === "Pending");

  const nextAction = pending
    .filter((f) => f.follow_up_date)
    .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date))[0];

  const markDone = async (f) => {
    await api.put(`/update-followup/${f.id}`, {
      ...f,
      status: "Done",
    });

    setEditingId(null);
    load();
  };

  const isOverdue = (f) =>
    f.status === "Pending" &&
    f.follow_up_date &&
    f.follow_up_date < today;

  const priorityStyle = (p) => ({
    color:
      p === "High"
        ? "#d32f2f"
        : p === "Medium"
        ? "#ed6c02"
        : "#2e7d32",
    fontWeight: "bold",
  });

  /* ================= EDIT ================= */
  const startEdit = (f) => {
    setEditingId(f.id);
    setEditForm({ ...f });
  };

  const saveEdit = async () => {
    if (!editForm.follow_up_date || !editForm.notes) {
      alert("Date and notes required");
      return;
    }

    await api.put(`/update-followup/${editingId}`, editForm);
    setEditingId(null);
    load();
  };

  /* ================= DELETE ================= */
  const deleteFollowUp = async (fid) => {
    const ok = window.confirm("Are you sure you want to delete this follow-up?");
    if (!ok) return;

    await api.delete(`/delete-followup/${fid}`);
    load();
  };

  /* ================= UI ================= */
  return (
    <div className="page">
      <button onClick={() => nav(-1)}>⬅ Back</button>

      <h2>Follow Ups</h2>
      <p style={{ fontSize: 14, color: "#6b7280" }}>
        Track conversations and decide the next action
      </p>

      {nextAction && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>🔥 Next Action</h3>
          <p><b>Mode:</b> {nextAction.mode}</p>
          <p><b>Date:</b> {nextAction.follow_up_date}</p>
          <p><b>Notes:</b> {nextAction.notes}</p>

          <button
            style={{ background: "#16a34a", marginTop: 10 }}
            onClick={() => markDone(nextAction)}
          >
            ✔ Mark as Done
          </button>
        </div>
      )}

      <hr />

      {/* ADD FOLLOW UP */}
      <div className="form-grid">
        <select
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value })
          }
        >
          <option value="Pending">Pending</option>
          <option value="Done">Done</option>
          <option value="Missed">Missed</option>
        </select>

        <select onChange={(e) => setForm({ ...form, mode: e.target.value })}>
          <option>Call</option>
          <option>Email</option>
          <option>WhatsApp</option>
          <option>LinkedIn</option>
        </select>

        <select onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <input
          type="date"
          value={form.follow_up_date}
          onChange={(e) =>
            setForm({ ...form, follow_up_date: e.target.value })
          }
        />

        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <input
          placeholder="Created By"
          value={form.created_by}
          onChange={(e) =>
            setForm({ ...form, created_by: e.target.value })
          }
        />

        <button onClick={submit}>Add Follow Up</button>
      </div>

      <hr />

      {/* TABLE */}
      <table className="table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Priority</th>
            <th>Mode</th>
            <th>Date</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {list.map((f) => (
            <tr
              key={f.id}
              style={{ backgroundColor: isOverdue(f) ? "#fee2e2" : "" }}
            >
              <td>{f.status}</td>

              <td>
                {editingId === f.id ? (
                  <select
                    value={editForm.priority}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priority: e.target.value })
                    }
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                ) : (
                  <span style={priorityStyle(f.priority)}>
                    {f.priority}
                  </span>
                )}
              </td>

              <td>{f.mode}</td>

              <td>
                {editingId === f.id ? (
                  <input
                    type="date"
                    value={editForm.follow_up_date}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        follow_up_date: e.target.value,
                      })
                    }
                  />
                ) : (
                  f.follow_up_date
                )}
              </td>

              <td>
                {editingId === f.id ? (
                  <input
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                  />
                ) : (
                  f.notes
                )}
              </td>

              <td>
                {editingId === f.id ? (
                  <>
                    <button onClick={saveEdit}>Save</button>
                    <button
                      style={{ marginLeft: 6 }}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {f.status === "Pending" && (
                      <button onClick={() => markDone(f)}>✔ Done</button>
                    )}
                    <button onClick={() => startEdit(f)}>✏️ Edit</button>
                    <button
                      style={{ marginLeft: 6 }}
                      onClick={() => deleteFollowUp(f.id)}
                    >
                      🗑 Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FollowUps;
