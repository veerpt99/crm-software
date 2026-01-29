import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const navigate = useNavigate();

  /* ================= MODAL ================= */
  const [showAddModal, setShowAddModal] = useState(false);

  /* ================= FORM ================= */
  const [form, setForm] = useState({
    company_name: "",
    hr_person: "",
    designation: "",
    contact_no: "",
    email: "",
    address: "",
    source: "",
    reference: "",
    industry: "",
    company_size: "",
    city: "",
    lead_owner: "",
    lead_status: "New",
  });

  /* ================= LOAD ================= */
  const loadLeads = async () => {
    const res = await api.get("/leads");
    setLeads(res.data || []);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  /* ================= SUBMIT ================= */
  const submit = async () => {
    if (!form.company_name) {
      alert("Company name required");
      return;
    }

    await api.post("/add-lead", form);

    setForm({
      ...form,
      company_name: "",
    });

    setShowAddModal(false);
    loadLeads();
  };

  /* ================= CONVERT ================= */
  const convertLead = async (l) => {
    if (l.lead_status === "Converted") return;

    await api.post("/add-company", {
      name: l.company_name,
      hr_name: l.hr_person,
      phone: l.contact_no,
      email: l.email,
      industry: l.industry,
      status: "Active",
    });

    alert("Lead converted to Company ✅");
    loadLeads();
  };

  const statusColor = (status) => {
    switch (status) {
      case "New":
        return "#2563eb";
      case "Contacted":
        return "#f59e0b";
      case "Converted":
        return "#16a34a";
      case "Lost":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  /* ================= UI ================= */
  return (
    <div className="page">
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>Leads</h2>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            Track and manage potential clients
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)}>➕ Add Lead</button>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {leads.map((l) => (
          <div
            key={l.id}
            className="card"
            style={{
              cursor: "pointer",
              borderLeft: `5px solid ${statusColor(l.lead_status)}`,
            }}
            onClick={() => navigate(`/leads/${l.id}`)}
          >
            <h3 style={{ marginBottom: 6 }}>{l.company_name}</h3>

            <div style={{ fontSize: 14, color: "#374151" }}>
              <div><b>HR:</b> {l.hr_person || "—"}</div>
              <div><b>City:</b> {l.city || "—"}</div>
              <div><b>Industry:</b> {l.industry || "—"}</div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: statusColor(l.lead_status),
                }}
              >
                {l.lead_status}
              </span>

              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/followups/${l.id}`);
                  }}
                >
                  Follow Ups
                </button>

                {l.lead_status !== "Converted" && (
                  <button
                    style={{ marginLeft: 6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      convertLead(l);
                    }}
                  >
                    Convert
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
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
            style={{ width: 520, maxHeight: "90vh", overflowY: "auto" }}
          >
            <h3 style={{ marginBottom: 12 }}>Add Lead</h3>

            <div className="form-grid">
              {Object.keys(form).map((k) => (
                <input
                  key={k}
                  placeholder={k.replaceAll("_", " ").toUpperCase()}
                  value={form[k]}
                  onChange={(e) =>
                    setForm({ ...form, [k]: e.target.value })
                  }
                />
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
                gap: 8,
              }}
            >
              <button
                className="danger"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button onClick={submit}>Save Lead</button>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {leads.length === 0 && !showAddModal && (
        <div
          style={{
            marginTop: 60,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <h3>No leads yet</h3>
          <p>Click “Add Lead” to create your first lead</p>
        </div>
      )}
    </div>
  );
}
