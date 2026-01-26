import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);

  // 🔹 Edit states
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

 useEffect(() => {
  load();
}, [load]);



  const load = async () => {
    const res = await axios.get(`${API}/leads`);
    const found = res.data.find((l) => String(l.id) === id);
    setLead(found);
    setEditForm(found);
  };

  // 🔹 SAVE EDIT
  const saveEdit = async () => {
    if (!editForm) return;

    try {
      await axios.put(`${API}/edit-lead/${lead.id}`, editForm);
      setEditOpen(false);
      load();
    } catch (err) {
      alert("Save failed. Backend edit API missing or error.");
      console.error(err);
    }
  };

  // 🔹 DELETE LEAD
  const deleteLead = async () => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    try {
      await axios.delete(`${API}/delete-lead/${lead.id}`);
      navigate("/leads");
    } catch (err) {
      alert("Delete failed. Backend delete API missing or error.");
      console.error(err);
    }
  };

  if (!lead) return <div>Loading lead details...</div>;

  return (
    <div className="page">
      <button onClick={() => navigate(-1)}>⬅ Back</button>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <h2>Lead Details</h2>

        <div>
          <button onClick={() => setEditOpen(true)}>✏️ Edit</button>
          <button
            className="danger"
            style={{ marginLeft: 8 }}
            onClick={deleteLead}
          >
            🗑 Delete
          </button>
        </div>
      </div>

      {/* DETAILS TABLE */}
      <table className="table" style={{ marginTop: 16 }}>
        <tbody>
          <tr><th>Company</th><td>{lead.company_name}</td></tr>
          <tr><th>HR Person</th><td>{lead.hr_person}</td></tr>
          <tr><th>Designation</th><td>{lead.designation}</td></tr>
          <tr><th>Contact No</th><td>{lead.contact_no}</td></tr>
          <tr><th>Email</th><td>{lead.email}</td></tr>
          <tr><th>Address</th><td>{lead.address}</td></tr>
          <tr><th>Source</th><td>{lead.source}</td></tr>
          <tr><th>Reference</th><td>{lead.reference}</td></tr>
          <tr><th>Industry</th><td>{lead.industry}</td></tr>
          <tr><th>Company Size</th><td>{lead.company_size}</td></tr>
          <tr><th>City</th><td>{lead.city}</td></tr>
          <tr><th>Lead Owner</th><td>{lead.lead_owner}</td></tr>
          <tr>
            <th>Status</th>
            <td>
              <b
                style={{
                  color:
                    lead.lead_status === "Converted"
                      ? "green"
                      : lead.lead_status === "Lost"
                      ? "red"
                      : "#111",
                }}
              >
                {lead.lead_status}
              </b>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ACTIONS */}
      <div style={{ marginTop: 20 }}>
        <button onClick={() => navigate(`/followups/${lead.id}`)}>
          Follow Ups
        </button>

        {lead.lead_status !== "Converted" && (
          <button
            style={{ marginLeft: 8 }}
            onClick={() => alert("Convert logic already exists")}
          >
            Convert Lead
          </button>
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editOpen && editForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: 520,
              maxHeight: "80vh",     // ✅ SCROLL FIX
              overflowY: "auto",     // ✅ SCROLL FIX
            }}
          >
            <h3>Edit Lead</h3>

            {[
              "company_name",
              "hr_person",
              "designation",
              "contact_no",
              "email",
              "address",
              "source",
              "reference",
              "industry",
              "company_size",
              "city",
              "lead_owner",
            ].map((k) => (
              <input
                key={k}
                value={editForm[k] || ""}
                placeholder={k.replaceAll("_", " ").toUpperCase()}
                onChange={(e) =>
                  setEditForm({ ...editForm, [k]: e.target.value })
                }
              />
            ))}

            <select
              value={editForm.lead_status}
              onChange={(e) =>
                setEditForm({ ...editForm, lead_status: e.target.value })
              }
            >
              <option value="New">New</option>
              <option value="Old">Old</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>

            <div style={{ marginTop: 12 }}>
              <button onClick={saveEdit}>Save</button>
              <button
                className="danger"
                style={{ marginLeft: 8 }}
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
