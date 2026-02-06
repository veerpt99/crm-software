import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [assignedCandidates, setAssignedCandidates] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");

  useEffect(() => {
    fetchJob();
    fetchAssignedCandidates();
    fetchAllCandidates();
    // eslint-disable-next-line
  }, [id]);

  // ---------------- FETCH JOB ----------------
  const fetchJob = async () => {
    try {
      const res = await api.get("/jobs");
      const found = res.data.find(
        (j) => String(j.id) === String(id)
      );
      setJob(found || null);
    } catch (err) {
      console.error("Fetch job error", err);
    }
  };

  // ---------------- FETCH ASSIGNED ----------------
  const fetchAssignedCandidates = async () => {
    try {
      const res = await api.get(`/jobs/${id}/candidates`);
      setAssignedCandidates(res.data || []);
    } catch (err) {
      console.error("Fetch assigned candidates error", err);
    }
  };

  // ---------------- FETCH ALL CANDIDATES ----------------
  const fetchAllCandidates = async () => {
    try {
      const res = await api.get("/candidates");
      setAllCandidates(res.data || []);
    } catch (err) {
      console.error("Fetch all candidates error", err);
    }
  };

  // ---------------- AVAILABLE CANDIDATES ----------------
  const availableCandidates = allCandidates.filter(
    (c) =>
      !assignedCandidates.some(
        (ac) => ac.id === c.id
      )
  );

  // ---------------- ASSIGN ----------------
  const assignCandidate = async () => {
    if (!selectedCandidate) return;

    try {
      await api.post(`/jobs/${id}/candidates`, {
        candidateId: selectedCandidate,
      });

      setSelectedCandidate("");
      fetchAssignedCandidates();
    } catch (err) {
      console.error("Assign candidate error", err);
    }
  };

  if (!job) {
    return <p style={{ padding: 20 }}>Loading job...</p>;
  }

  return (
    <div className="page">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Job Details</h2>
        <button onClick={() => navigate(-1)}>⬅ Back</button>
      </div>

      {/* JOB DETAILS */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="detail-row">
          <span>Job Title</span>
          <strong>{job.title}</strong>
        </div>
        <div className="detail-row">
          <span>Experience</span>
          <strong>{job.experience || "-"}</strong>
        </div>
        <div className="detail-row">
          <span>Location</span>
          <strong>{job.location || "-"}</strong>
        </div>
        <div className="detail-row">
          <span>Salary</span>
          <strong>{job.salary || "-"}</strong>
        </div>
        <div className="detail-row">
          <span>Status</span>
          <strong>{job.status}</strong>
        </div>
        <div className="detail-row">
          <span>Recruiter</span>
          <strong>{job.recruiter_name || "-"}</strong>
        </div>
      </div>

      {/* ASSIGN CANDIDATE */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Assign Candidate</h3>

        {availableCandidates.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No available candidates</p>
        ) : (
          <>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
            >
              <option value="">Select Candidate</option>
              {availableCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>

            <button style={{ marginTop: 10 }} onClick={assignCandidate}>
              ➕ Assign
            </button>
          </>
        )}
      </div>

      {/* ASSIGNED CANDIDATES */}
      <div style={{ marginTop: 30 }}>
        <h3>Assigned Candidates</h3>

        {assignedCandidates.length === 0 && (
          <p style={{ color: "#6b7280" }}>No candidates assigned</p>
        )}

        {assignedCandidates.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{ marginTop: 12 }}
          >
            <strong>{c.name}</strong>
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              {c.email} • {c.phone}
            </div>
            <div style={{ marginTop: 4 }}>
              Stage: <b>{c.stage}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default JobDetails;
