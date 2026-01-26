import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

export default function FollowUps() {
  const { id } = useParams();
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [form, setForm] = useState({
    status: "Pending",
    notes: "",
    mode: "Call",
    last_follow_up_date: "",
    next_follow_up_date: "",
    priority: "Medium",
    created_by: "",
  });

  const load = async () => {
    const res = await axios.get(`${API}/followups/${id}`);
    setList(res.data);
  };

 useEffect(() => {
  load();
}, [load]);


  const submit = async () => {
    await axios.post(`${API}/add-followup`, {
      ...form,
      lead_id: id,
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
    await axios.post(`${API}/add-followup`, {
      ...f,
      status: "Done",
      lead_id: id,
    });

    if (rescheduleDate) {
      await axios.post(`${API}/add-followup`, {
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
    await axios.post(`${API}/add-followup`, {
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

    await axios.delete(`${API}/delete-followup/${fid}`);
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

      {/* 🔥 NEXT ACTION */}
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
          onChange={(e) => setForm({ ...form, status: e.target.value, last_follow_up_date: "", next_follow_up_date: "" })}
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

        {/* Conditional Date Field */}
        {form.status === "Pending" && (
          <input
            type="date"
            placeholder="Next Follow Up Date"
            value={form.next_follow_up_date}
            onChange={(e) =>
              setForm({ ...form, next_follow_up_date: e.target.value })
            }
          />
        )}

        {form.status === "Done" && (
          <input
            type="date"
            placeholder="Follow Up Completed Date"
            value={form.last_follow_up_date}
            onChange={(e) =>
              setForm({ ...form, last_follow_up_date: e.target.value })
            }
          />
        )}

        {form.status === "Missed" && (
          <input
            type="date"
            placeholder="Missed Date"
            value={form.next_follow_up_date}
            onChange={(e) =>
              setForm({ ...form, next_follow_up_date: e.target.value })
            }
          />
        )}

        <input
          placeholder="Notes"
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <input
          placeholder="Created By"
          onChange={(e) => setForm({ ...form, created_by: e.target.value })}
        />

        <button onClick={submit}>Add Follow Up</button>
      </div>

      <hr />

      {/* TABLE WITH EDIT + DELETE */}
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
            <tr key={f.id} style={{backgroundColor: isOverdue(f) ? "#fee2e2" : ""}}>
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
                    value={editForm.next_follow_up_date || editForm.last_follow_up_date}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        next_follow_up_date: editForm.status === "Pending" ? e.target.value : editForm.next_follow_up_date,
                        last_follow_up_date: editForm.status === "Done" ? e.target.value : editForm.last_follow_up_date,
                      })
                    }
                  />
                ) : (
                  <span style={{color: isOverdue(f) ? "#dc2626" : ""}}>
                    {f.status === "Pending" ? f.next_follow_up_date : f.last_follow_up_date}
                    {isOverdue(f) && <span style={{marginLeft: 8, color: "#dc2626", fontWeight: "bold"}}>⚠️ OVERDUE</span>}
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
                      style={{ marginLeft: 6, background: "#9ca3af" }}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {f.status === "Pending" && (
                      <button
                        style={{
                          background: "#16a34a",
                          marginRight: 6,
                        }}
                        onClick={() => markDone(f)}
                      >
                        ✔ Done
                      </button>
                    )}
                    <button onClick={() => startEdit(f)}>✏️ Edit</button>
                    <button
                      style={{
                        marginLeft: 6,
                        background: "#ef4444",
                      }}
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
