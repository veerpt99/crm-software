import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [openId, setOpenId] = useState(null);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    company_id: "",
    title: "",
    experience: "",
    salary: "",
    location: "",
    status: "Open",
    recruiter_name: "",
  });

  useEffect(() => {
    fetchJobs();
    fetchCompanies();
  }, []);

  const fetchJobs = async () => {
    const res = await axios.get(`${API}/jobs`);
    setJobs(Array.isArray(res.data) ? res.data : []);
  };

  const fetchCompanies = async () => {
    const res = await axios.get(`${API}/companies`);
    setCompanies(Array.isArray(res.data) ? res.data : []);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (j) => {
    setEditId(j.id);
    setForm({
      company_id: j.company_id,
      title: j.title,
      experience: j.experience,
      salary: j.salary,
      location: j.location,
      status: j.status,
      recruiter_name: j.recruiter_name || "",
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitJob = async () => {
    if (!form.title || !form.company_id) {
      alert("Job title and company required");
      return;
    }

    if (editId) {
      await axios.put(`${API}/edit-job/${editId}`, form);
    } else {
      await axios.post(`${API}/add-job`, form);
    }

    fetchJobs();
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      company_id: "",
      title: "",
      experience: "",
      salary: "",
      location: "",
      status: "Open",
      recruiter_name: "",
    });
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    await axios.delete(`${API}/delete-job/${id}`);
    fetchJobs();
  };

  const companyName = (id) =>
    companies.find((c) => c.id === id)?.name || "—";

  return (
    <div className="page jobs-page">
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>Jobs</h2>
        <button onClick={openAddModal}>➕ Add Job</button>
      </div>

      {/* JOB CARDS */}
      <div className="card-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {jobs.map((j) => {
          const isOpen = openId === j.id;

          return (
            <div
              key={j.id}
              className={`entity-card ${isOpen ? "open" : ""}`}
              onClick={() => setOpenId(isOpen ? null : j.id)}
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
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>{j.title}</h3>
                <span className={`status ${j.status.toLowerCase()}`} style={{ paddingLeft: "0", whiteSpace: "nowrap" }}>
                  {j.status}
                </span>
              </div>

              {isOpen && (
                <div
                  className="card-details"
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f3f4f6" }}
                >
                  <p style={{ margin: "8px 0", fontSize: "14px", color: "#4b5563" }}>🏢 <strong>{companyName(j.company_id)}</strong></p>
                  <p style={{ margin: "8px 0", fontSize: "14px", color: "#4b5563" }}>📍 <strong>{j.location || "-"}</strong></p>
                  <p style={{ margin: "8px 0", fontSize: "14px", color: "#4b5563" }}>🎯 <strong>{j.experience || "-"}</strong></p>
                  <p style={{ margin: "8px 0", fontSize: "14px", color: "#4b5563" }}>💰 <strong>{j.salary || "-"}</strong></p>
                  <p style={{ margin: "8px 0", fontSize: "14px", color: "#4b5563" }}>👤 <strong>{j.recruiter_name || "-"}</strong></p>

                  <div className="card-actions" style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                    <button 
                      onClick={() => openEditModal(j)}
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
                      onClick={() => deleteJob(j.id)}
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
            <h3>{editId ? "Edit Job" : "Add Job"}</h3>

            <select
              name="company_id"
              value={form.company_id}
              onChange={handleChange}
            >
              <option value="">Select Company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              name="title"
              placeholder="Job Title"
              value={form.title}
              onChange={handleChange}
            />

            <input
              name="experience"
              placeholder="Experience"
              value={form.experience}
              onChange={handleChange}
            />

            <input
              name="salary"
              placeholder="Salary"
              value={form.salary}
              onChange={handleChange}
            />

            <input
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
            />

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option>Open</option>
              <option>Closed</option>
              <option>On Hold</option>
            </select>

            <input
              name="recruiter_name"
              placeholder="Recruiter Name"
              value={form.recruiter_name}
              onChange={handleChange}
            />

            <div style={{ marginTop: 12 }}>
              <button onClick={submitJob}>
                {editId ? "Update Job" : "Add Job"}
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

export default Jobs;
