import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetchJob();
    fetchCandidates();
    // eslint-disable-next-line
  }, [id]);

  // ---------------- FETCH JOB ----------------
  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
    } catch (err) {
      console.error("Fetch job error", err);
    }
  };

  // ---------------- FETCH CANDIDATES ----------------
  const fetchCandidates = async () => {
    try {
      const res = await api.get(`/jobs/${id}/candidates`);
      setCandidates(res.data || []);
    } catch (err) {
      console.error("Fetch candidates error", err);
    }
  };

  if (!job) {
    return <p style={{ padding: 20 }}>Loading job...</p>;
  }

  return (
    <div className="page">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <h2>Job Details</h2>

        <button onClick={() => navigate(-1)}>
          ⬅ Back
        </button>
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

      {/* ASSIGNED CANDIDATES */}
      <div style={{ marginTop: 30 }}>
        <h3>Candidates for this Job</h3>

        {candidates.length === 0 && (
          <p style={{ color: "#6b7280" }}>
            No candidates assigned to this job
          </p>
        )}

        {candidates.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{ marginTop: 12 }}
          >
            <strong>{c.name}</strong>

            <div style={{ color: "#6b7280", fontSize: 14 }}>
              {c.email} • {c.phone}
            </div>

            <div style={{ marginTop: 6 }}>
              Status: <b>{c.status}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default JobDetails;
