import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function FollowUps({ id }) {
  const nav = useNavigate();

  const [list, setList] = useState([]);

  const [form, setForm] = useState({
    status: "Pending",
    mode: "Call",
    priority: "Medium",
    notes: "",
    created_by: "",
    next_follow_up_date: "",
    last_follow_up_date: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [rescheduleDate, setRescheduleDate] = useState("");

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
  // ✅ VALIDATION (CRITICAL)
  if (!form.notes) {
    alert("Please add notes");
    return;
  }

  if (form.status !== "Done" && !form.next_follow_up_date) {
    alert("Please select next follow-up date");
    return;
  }

  if (form.status === "Done" && !form.last_follow_up_date) {
    alert("Please select last follow-up date");
    return;
  }

  await api.post("/add-followup", {
    ...form,
    lead_id: id,
  });

  // ✅ RESET FORM (IMPORTANT)
  setForm({
    status: "Pending",
    mode: "Call",
    priority: "Medium",
    notes: "",
    created_by: "",
    next_follow_up_date: "",
    last_follow_up_date: "",
  });

  load();
};


  /* ================= LOGIC ================= */
  const today = new Date().toISOString().split("T")[0];
  const pending = list.filter((f) => f.status !== "Done");

  const nextAction = pending
    .filter((f) => f.next_follow_up_date)
    .sort((a, b) =>
      a.next_follow_up_date.localeCompare(b.next_follow_up_date)
    )[0];

  const markDone = async (f) => {
    await api.post("/add-followup", {
      ...f,
      status: "Done",
      lead_id: id,
    });

    if (rescheduleDate) {
      await api.post("/add-followup", {
        lead_id: id,
        status: "Pending",
        mode: f.mode,
        priority: f.priority,
        next_follow_up_date: rescheduleDate,
        notes: "Auto created follow-up",
        created_by: f.created_by,
      });
    }

    setRescheduleDate("");
    setEditingId(null);
    load();
  };

  const isOverdue = (f) =>
    f.next_follow_up_date &&
    f.next_follow_up_date < today &&
    f.status !== "Done";

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
    await api.post("/add-followup", {
      ...editForm,
      lead_id: id,
    });
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
          <p><b>Due:</b> {nextAction.next_follow_up_date}</p>
          <p><b>Notes:</b> {nextAction.notes}</p>

          <input
            type="date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
          />

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
            setForm({
              ...form,
              status: e.target.value,
              last_follow_up_date: "",
              next_follow_up_date: "",
            })
          }
        >
          <option value="Pending">Pending</option>
          <option value="Done">Done</option>
          <option value="Missed">Missed</option>
        </select>

        <select
          onChange={(e) => setForm({ ...form, mode: e.target.value })}
        >
          <option>Call</option>
          <option>Email</option>
          <option>WhatsApp</option>
          <option>LinkedIn</option>
        </select>

        <select
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        {form.status !== "Done" && (
          <input
            type="date"
            value={form.next_follow_up_date}
            onChange={(e) =>
              setForm({ ...form, next_follow_up_date: e.target.value })
            }
          />
        )}

        {form.status === "Done" && (
          <input
            type="date"
            value={form.last_follow_up_date}
            onChange={(e) =>
              setForm({ ...form, last_follow_up_date: e.target.value })
            }
          />
        )}

        <input
          placeholder="Notes"
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <input
          placeholder="Created By"
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
                      setEditForm({
                        ...editForm,
                        priority: e.target.value,
                      })
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
                    value={
                      editForm.next_follow_up_date ||
                      editForm.last_follow_up_date
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        next_follow_up_date:
                          editForm.status === "Pending"
                            ? e.target.value
                            : editForm.next_follow_up_date,
                        last_follow_up_date:
                          editForm.status === "Done"
                            ? e.target.value
                            : editForm.last_follow_up_date,
                      })
                    }
                  />
                ) : (
                  <span>
                    {f.status === "Pending"
                      ? f.next_follow_up_date
                      : f.last_follow_up_date}
                  </span>
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
