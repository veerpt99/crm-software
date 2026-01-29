import React, { useEffect, useState } from "react";
import api from "./api";

function Candidate() {
  const [candidates, setCandidates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [openId, setOpenId] = useState(null);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    status: "Applied",
    company_id: "",
    job_id: "",
    cv: null,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [cRes, compRes, jobRes] = await Promise.all([
        api.get("/candidates"),
        api.get("/companies"),
        api.get("/jobs"),
      ]);

      setCandidates(cRes.data || []);
      setCompanies(compRes.data || []);
      setJobs(jobRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      position: c.position,
      status: c.status,
      company_id: c.company_id,
      job_id: c.job_id,
      cv: null,
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      position: "",
      status: "Applied",
      company_id: "",
      job_id: "",
      cv: null,
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setForm({ ...form, cv: e.target.files[0] });
  };

  const submitCandidate = async () => {
    if (!form.name || !form.job_id) {
      alert("Candidate name and job required");
      return;
    }

    try {
      if (editId) {
        await api.put(`/update-candidate-status/${editId}`, {
          status: form.status,
        });
      } else {
        const data = new FormData();
        Object.keys(form).forEach((k) => {
          if (form[k] !== null) data.append(k, form[k]);
        });

        await api.post("/add-candidate", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchAll();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const deleteCandidate = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    await api.delete(`/delete-candidate/${id}`);
    fetchAll();
  };

  const companyName = (id) =>
    companies.find((c) => c.id === id)?.name || "—";

  const jobTitle = (id) =>
    jobs.find((j) => j.id === id)?.title || "—";

  return (
    <div className="page candidate-page">
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>Candidates</h2>
        <button onClick={openAddModal}>➕ Add Candidate</button>
      </div>

      {/* CANDIDATE CARDS */}
      <div className="card-list">
        {candidates.map((c) => {
          const isOpen = openId === c.id;

          return (
            <div
              key={c.id}
              className={`entity-card ${isOpen ? "open" : ""}`}
              onClick={() => setOpenId(isOpen ? null : c.id)}
            >
              <div className="card-summary">
                <h3>{c.name}</h3>
                <span
                  className={`status ${c.status
                    .toLowerCase()
                    .replace(" ", "")}`}
                >
                  {c.status}
                </span>
              </div>

              {isOpen && (
                <div
                  className="card-details"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p>📧 {c.email}</p>
                  <p>📞 {c.phone}</p>
                  <p>🏢 {companyName(c.company_id)}</p>
                  <p>💼 {jobTitle(c.job_id)}</p>

                  {c.cv && (
                    <a
                      href={`${api.defaults.baseURL}/uploads/${c.cv}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📄 View CV
                    </a>
                  )}

                  <div className="card-actions">
                    <button onClick={() => openEditModal(c)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => deleteCandidate(c.id)}
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
          <div
            className="card"
            style={{ width: 420, maxHeight: "80vh", overflowY: "auto" }}
          >
            <h3>{editId ? "Edit Candidate" : "Add Candidate"}</h3>

            <input
              name="name"
              placeholder="Candidate Name"
              value={form.name}
              onChange={handleChange}
            />

            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />

            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
            />

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

            <select
              name="job_id"
              value={form.job_id}
              onChange={handleChange}
            >
              <option value="">Select Job</option>
              {jobs
                .filter(
                  (j) => String(j.company_id) === String(form.company_id)
                )
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
            </select>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option>Applied</option>
              <option>Shortlisted</option>
              <option>Interview Scheduled</option>
              <option>Shared</option>
              <option>Hired</option>
              <option>Rejected</option>
            </select>

            {!editId && <input type="file" onChange={handleFile} />}

            <div style={{ marginTop: 12 }}>
              <button onClick={submitCandidate}>
                {editId ? "Update Candidate" : "Add Candidate"}
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

export default Candidate;
