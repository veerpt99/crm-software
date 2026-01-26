import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

function Interview() {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [openId, setOpenId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");

  const [form, setForm] = useState({
    candidate_id: "",
    interview_date: "",
    interview_time: "",
    recruiter_name: "",
    mode: "Online",
    status: "Scheduled",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [candRes, jobRes, intRes] = await Promise.all([
      axios.get(`${API}/candidates`),
      axios.get(`${API}/jobs`),
      axios.get(`${API}/interviews`),
    ]);

    setCandidates(candRes.data || []);
    setJobs(jobRes.data || []);
    setInterviews(intRes.data || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "candidate_id") {
      const candidate = candidates.find((c) => c.id == value);
      const job = jobs.find((j) => j.id == candidate?.job_id);
      setSelectedJobTitle(job?.title || "");
      setForm({ ...form, [name]: value, recruiter_name: job?.recruiter_name || "" });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  /* ================= ADD / EDIT ================= */

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (i) => {
    setEditId(i.id);
    setSelectedJobTitle(i.job_title || "");
    setForm({
      candidate_id: i.candidate_id,
      interview_date: i.interview_date,
      interview_time: i.interview_time,
      recruiter_name: i.recruiter_name || "",
      mode: i.mode,
      status: i.status,
    });
    setModalOpen(true);
  };

  const submitInterview = async () => {
    if (!form.candidate_id || !form.interview_date || !form.interview_time) {
      alert("Candidate, date & time required");
      return;
    }

    if (editId) {
      await axios.delete(`${API}/delete-interview/${editId}`);
    }

    await axios.post(`${API}/add-interview`, form);

    fetchAll();
    resetForm();
    setModalOpen(false);
  };

  const resetForm = () => {
    setEditId(null);
    setSelectedJobTitle("");
    setForm({
      candidate_id: "",
      interview_date: "",
      interview_time: "",
      recruiter_name: "",
      mode: "Online",
      status: "Scheduled",
    });
  };

  const deleteInterview = async (id) => {
    if (!window.confirm("Delete this interview?")) return;
    await axios.delete(`${API}/delete-interview/${id}`);
    fetchAll();
  };

  /* ================= UI ================= */

  return (
    <div className="page interview-page">
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2>Interviews</h2>

        {/* ✅ FIXED BUTTON */}
        <button className="page-action-btn" onClick={openAdd}>
          ➕ Schedule Interview
        </button>
      </div>

      {/* INTERVIEW CARDS */}
      <div className="card-list">
        {interviews.length === 0 && <p>No interviews scheduled</p>}

        {interviews.map((i) => {
          const isOpen = openId === i.id;

          return (
            <div
              key={i.id}
              className={`entity-card ${isOpen ? "open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenId(isOpen ? null : i.id);
              }}
            >
              <div className="card-summary">
                <div>
                  <h3>{i.candidate}</h3>
                  <p className="muted">{i.job_title || "—"}</p>
                </div>
                <span className={`status ${i.status.toLowerCase()}`}>
                  {i.status}
                </span>
              </div>

              {isOpen && (
                <div
                  className="card-details"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p>📅 {i.interview_date}</p>
                  <p>⏰ {i.interview_time}</p>
                  <p>👤 {i.recruiter_name || "—"}</p>
                  <p>🌐 {i.mode}</p>

                  <div className="card-actions">
                    <button onClick={() => openEdit(i)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => deleteInterview(i.id)}
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

      {/* ================= MODAL ================= */}
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
            <h3>{editId ? "Edit Interview" : "Schedule Interview"}</h3>

            <select
              name="candidate_id"
              value={form.candidate_id}
              onChange={handleChange}
            >
              <option value="">Select Candidate</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              value={selectedJobTitle}
              placeholder="Job Title"
              disabled
              style={{ background: "#f3f4f6" }}
            />

            <input
              type="date"
              name="interview_date"
              value={form.interview_date}
              onChange={handleChange}
            />

            <input
              type="time"
              name="interview_time"
              value={form.interview_time}
              onChange={handleChange}
            />

            <input
              name="recruiter_name"
              placeholder="Recruiter Name"
              value={form.recruiter_name}
              disabled
              style={{ background: "#f3f4f6" }}
            />

            <select name="mode" value={form.mode} onChange={handleChange}>
              <option>Online</option>
              <option>Offline</option>
            </select>

            <div style={{ marginTop: 12 }}>
              <button onClick={submitInterview}>
                {editId ? "Update Interview" : "Schedule"}
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

export default Interview;
