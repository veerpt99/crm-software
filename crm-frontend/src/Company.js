import React, { useEffect, useState } from "react";
import axios from "axios";

function Company() {
  const [companies, setCompanies] = useState([]);
  const [openId, setOpenId] = useState(null);

  // modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    hr_name: "",
    phone: "",
    email: "",
    industry: "",
    status: "Active",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const res = await axios.get("http://localhost:5000/companies");
    setCompanies(Array.isArray(res.data) ? res.data : []);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      hr_name: c.hr_name,
      phone: c.phone,
      email: c.email,
      industry: c.industry,
      status: c.status,
    });
    setModalOpen(true);
  };

  const submitCompany = async () => {
    if (!form.name) {
      alert("Company name required");
      return;
    }

    if (editId) {
      await axios.put(
        `http://localhost:5000/edit-company/${editId}`,
        form
      );
    } else {
      await axios.post("http://localhost:5000/add-company", form);
    }

    fetchCompanies();
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      hr_name: "",
      phone: "",
      email: "",
      industry: "",
      status: "Active",
    });
  };

  const deleteCompany = async (id) => {
    if (!window.confirm("Delete this company?")) return;
    await axios.delete(`http://localhost:5000/delete-company/${id}`);
    fetchCompanies();
  };

  return (
    <div className="page company-page">
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>Companies</h2>
        <button onClick={openAddModal}>➕ Add Company</button>
      </div>

      {/* COMPANY CARDS */}
      <div className="card-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {companies.map((c) => {
          const isOpen = openId === c.id;

          return (
            <div
              key={c.id}
              className={`entity-card ${isOpen ? "open" : ""}`}
              onClick={() => setOpenId(isOpen ? null : c.id)}
              style={{
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                padding: "20px 24px",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                transition: "all 0.3s ease",
                marginBottom: 0,
                width: "100%",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.12)";
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.backgroundColor = "#fafbfc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.06)";
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.backgroundColor = "#ffffff";
              }}
            >
              <div className="card-summary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>{c.name}</h3>
                <span className={`status ${c.status.toLowerCase()}`} style={{ paddingLeft: "0", whiteSpace: "nowrap" }}>
                  {c.status}
                </span>
              </div>

              {isOpen && (
                <div
                  className="card-details"
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f3f4f6" }}
                >
                  <p style={{ margin: "8px 0", fontSize: "14px", color: "#4b5563" }}>👤 <strong>{c.hr_name || "-"}</strong></p>
                  <p style={{ margin: "8px 0", fontSize: "14px", color: "#4b5563" }}>📞 <strong>{c.phone || "-"}</strong></p>
                  <p style={{ margin: "8px 0", fontSize: "14px", color: "#4b5563" }}>✉️ <strong>{c.email || "-"}</strong></p>
                  <p style={{ margin: "8px 0", fontSize: "14px", color: "#4b5563" }}>🏭 <strong>{c.industry || "-"}</strong></p>

                  <div className="card-actions" style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                    <button 
                      onClick={() => openEditModal(c)}
                      style={{
                        flex: 1,
                        padding: "8px 14px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "500",
                        fontSize: "13px",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() => deleteCompany(c.id)}
                      style={{
                        flex: 1,
                        padding: "8px 14px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "500",
                        fontSize: "13px",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {modalOpen && (
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
            style={{ width: 420, maxHeight: "80vh", overflowY: "auto" }}
          >
            <h3>{editId ? "Edit Company" : "Add Company"}</h3>

            <input
              name="name"
              placeholder="Company Name"
              value={form.name}
              onChange={handleChange}
            />
            <input
              name="hr_name"
              placeholder="HR Name"
              value={form.hr_name}
              onChange={handleChange}
            />
            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
            />
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              name="industry"
              placeholder="Industry"
              value={form.industry}
              onChange={handleChange}
            />

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div style={{ marginTop: 12 }}>
              <button onClick={submitCompany}>
                {editId ? "Update Company" : "Add Company"}
              </button>
              <button
                className="danger"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
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

export default Company;
