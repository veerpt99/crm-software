import React, { useEffect, useState } from "react";
import api from "./api";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [openId, setOpenId] = useState(null);

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

  /* ================= FETCH ================= */
  const fetchJobs = async () => {
    const res = await api.get("/jobs");
    setJobs(Array.isArray(res.data) ? res.data : []);
  };

  const fetchCompanies = async () => {
    const res = await api.get("/companies");
    setCompanies(Array.isArray(res.data) ? res.data : []);
  };

  /* ================= FORM ================= */
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

  /* ================= SUBMIT ================= */
  const submitJob = async () => {
    if (!form.title || !form.company_id) {
      alert("Job title and company required");
      return;
    }

    if (editId) {
      await api.put(`/edit-job/${editId}`, form);
    } else {
      await api.post("/add-job", form);
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
    await api.delete(`/delete-job/${id}`);
    fetchJobs();
  };

  const companyName = (id) =>
    companies.find((c) => c.id === id)?.name || "—";

  /* ================= UI ================= */
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
      <div
        className="card-list"
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
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
                width: "100%",
              }}
            >
              <div
                className="card-summary"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                <h3 style={{ margin: 0 }}>{j.title}</h3>
                <span className={`status ${j.status.toLowerCase()}`}>
                  {j.status}
                </span>
              </div>

              {isOpen && (
                <div
                  className="card-details"
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: 16, borderTop: "1px solid #f3f4f6" }}
                >
                  <p>🏢 <b>{companyName(j.company_id)}</b></p>
                  <p>📍 {j.location || "-"}</p>
                  <p>🎯 {j.experience || "-"}</p>
                  <p>💰 {j.salary || "-"}</p>
                  <p>👤 {j.recruiter_name || "-"}</p>

                  <div className="card-actions" style={{ marginTop: 16 }}>
                    <button onClick={() => openEditModal(j)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => deleteJob(j.id)}
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

      {/* MODAL */}
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
