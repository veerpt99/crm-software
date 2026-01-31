import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function Dashboard() {
  const navigate = useNavigate();

  /* ================= DASHBOARD COUNTS ================= */
  const [data, setData] = useState({
    total: 0,
    Applied: 0,
    Shortlisted: 0,
    "Interview Scheduled": 0,
    Hired: 0,
    Rejected: 0,
  });

  /* ================= OVERDUE FOLLOWUPS ================= */
  const [overdue, setOverdue] = useState([]);

  useEffect(() => {
    fetchDashboard();
    fetchOverdue();

    const interval = setInterval(() => {
      fetchOverdue();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /* ================= FETCH DASHBOARD ================= */
  const fetchDashboard = async () => {
    try {
      const res = await api.get("/dashboard/counts");

      setData({
        total: res.data?.total || 0,
        Applied: res.data?.Applied || 0,
        Shortlisted: res.data?.Shortlisted || 0,
        "Interview Scheduled": res.data?.["Interview Scheduled"] || 0,
        Hired: res.data?.Hired || 0,
        Rejected: res.data?.Rejected || 0,
      });
    } catch (err) {
      console.error("Dashboard load failed", err);
    }
  };

  /* ================= FETCH OVERDUE ================= */
  const fetchOverdue = async () => {
    try {
      const res = await api.get("/followups-overdue");
      setOverdue(res.data || []);
    } catch (err) {
      console.error("Overdue followups load failed", err);
    }
  };

  /* ================= KPI CARD ================= */
  const StatCard = ({ title, value, status, className }) => (
    <div
      className={`dashboard-card ${className || ""}`}
      onClick={() =>
        status
          ? navigate(`/candidates?status=${encodeURIComponent(status)}`)
          : navigate("/candidates")
      }
    >
      <h3>{title}</h3>
      <div className="dashboard-count">{value}</div>
    </div>
  );

  /* ================= QUICK ACTION ================= */
  const QuickAction = ({ title, path }) => (
    <div className="quick-card" onClick={() => navigate(path)}>
      <h4>{title}</h4>
    </div>
  );

  return (
    <div>
      <h2>Dashboard Overview</h2>

      {/* 🚨 OVERDUE FOLLOW-UP ALERT (TOP PRIORITY) */}
      {overdue.length > 0 && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #ef4444",
            padding: 16,
            marginBottom: 24,
            borderRadius: 10,
            cursor: "pointer",
          }}
          onClick={() => navigate("/leads")}
        >
          🚨 <b>{overdue.length}</b> overdue follow-ups need immediate attention
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Click to view affected leads
          </div>
        </div>
      )}

      {/* ================= KPI CARDS ================= */}
      <div className="dashboard-grid">
        <StatCard title="Total Candidates" value={data.total} className="total" />
        <StatCard title="Applied" value={data.Applied} status="Applied" className="applied" />
        <StatCard
          title="Shortlisted"
          value={data.Shortlisted}
          status="Shortlisted"
          className="shortlisted"
        />
        <StatCard
          title="Interview Scheduled"
          value={data["Interview Scheduled"]}
          status="Interview Scheduled"
          className="interviewscheduled"
        />
        <StatCard title="Hired" value={data.Hired} status="Hired" className="hired" />
        <StatCard title="Rejected" value={data.Rejected} status="Rejected" className="rejected" />
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <h3 style={{ marginTop: 32 }}>Quick Actions</h3>

      <div className="quick-actions">
        <QuickAction title="🧲 Add Lead" path="/leads" />
        <QuickAction title="➕ Add Company" path="/companies" />
        <QuickAction title="💼 Add Job" path="/jobs" />
        <QuickAction title="👤 Add Candidate" path="/candidates" />
        <QuickAction title="📅 Schedule Interview" path="/interviews" />
      </div>
    </div>
  );
}

export default Dashboard;
