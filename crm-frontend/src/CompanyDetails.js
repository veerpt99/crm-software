import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";

function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchCompany();
    fetchJobs();
    // eslint-disable-next-line
  }, [id]);

  const fetchCompany = async () => {
    try {
      const res = await api.get("/companies");
      const found = res.data.find((c) => String(c.id) === String(id));
      setCompany(found || null);
    } catch (err) {
      console.error("Fetch company error", err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get(`/companies/${id}/jobs`);
      setJobs(res.data || []);
    } catch (err) {
      console.error("Fetch company jobs error", err);
    }
  };

  if (!company) {
    return <p style={{ padding: 20 }}>Loading company...</p>;
  }

  return (
    <div className="page">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Company Details</h2>
        <button onClick={() => navigate(-1)}>⬅ Back</button>
      </div>

      {/* COMPANY DETAILS (LeadDetails style) */}
      <div className="details-card">
  <div className="details-grid">
    <div className="detail-item">
      <span className="detail-label">Company Name</span>
      <span className="detail-value">{company.name}</span>
    </div>

    <div className="detail-item">
      <span className="detail-label">HR Name</span>
      <span className="detail-value">{company.hr_name}</span>
    </div>

    <div className="detail-item">
      <span className="detail-label">Phone</span>
      <span className="detail-value">{company.phone}</span>
    </div>

    <div className="detail-item">
      <span className="detail-label">Email</span>
      <span className="detail-value">{company.email}</span>
    </div>

    <div className="detail-item">
      <span className="detail-label">Industry</span>
      <span className="detail-value">{company.industry}</span>
    </div>

    <div className="detail-item">
      <span className="detail-label">Status</span>
      <span className={`status-badge ${company.status?.toLowerCase()}`}>
        {company.status}
      </span>
    </div>
  </div>
</div>


      {/* JOBS */}
      <div style={{ marginTop: 30 }}>
        <h3>Job Openings</h3>

        {jobs.length === 0 && (
          <p style={{ color: "#6b7280" }}>
            No jobs added for this company
          </p>
        )}

        {jobs.map((j) => (
          <div
            key={j.id}
            className="card"
            style={{ marginTop: 12, cursor: "pointer" }}
            onClick={() => navigate(`/companies/${id}/jobs/${j.id}`)}

          >
            <strong>{j.title}</strong>
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              {j.location || "-"} • {j.experience || "-"}
            </div>
            <div style={{ marginTop: 6 }}>
              Status: <b>{j.status}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompanyDetails;
