import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function Company() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);

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
    try {
      const res = await api.get("/companies");
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch companies error:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (e, c) => {
    e.stopPropagation();
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

    try {
      if (editId) {
        await api.put(`/edit-company/${editId}`, form);
      } else {
        await api.post("/add-company", form);
      }

      fetchCompanies();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Submit company error:", err);
    }
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

  const deleteCompany = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this company?")) return;
    await api.delete(`/delete-company/${id}`);
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

      {/* COMPANY LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {companies.map((c) => (
          <div
            key={c.id}
            className="card"
            onClick={() => navigate(`/companies/${c.id}`)}
            style={{
              cursor: "pointer",
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              padding: "18px 22px",
              background: "#fff",
              transition: "0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#3b82f6")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#e5e7eb")
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>{c.name}</h3>
              <span className={`status ${c.status.toLowerCase()}`}>
                {c.status}
              </span>
            </div>

            <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
              👤 {c.hr_name || "-"} &nbsp; | &nbsp;
              📞 {c.phone || "-"} &nbsp; | &nbsp;
              🏭 {c.industry || "-"}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button
                onClick={(e) => openEditModal(e, c)}
                style={{
                  padding: "6px 12px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
              <button
                onClick={(e) => deleteCompany(e, c.id)}
                style={{
                  padding: "6px 12px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
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
          <div className="card" style={{ width: 420 }}>
            <h3>{editId ? "Edit Company" : "Add Company"}</h3>

            <input name="name" placeholder="Company Name" value={form.name} onChange={handleChange} />
            <input name="hr_name" placeholder="HR Name" value={form.hr_name} onChange={handleChange} />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
            <input name="industry" placeholder="Industry" value={form.industry} onChange={handleChange} />

            <select name="status" value={form.status} onChange={handleChange}>
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
