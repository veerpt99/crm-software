import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function Dashboard() {
  const navigate = useNavigate();

  // ✅ SAFE DEFAULT STRUCTURE
  const [data, setData] = useState({
    total: 0,
    Applied: 0,
    Shortlisted: 0,
    "Interview Scheduled": 0,
    Hired: 0,
    Rejected: 0,
  });

  const [overdue, setOverdue] = useState([]);
  const [notifications, setNotifications] = useState([]);


  useEffect(() => {
  fetchDashboard();
  fetchOverdue();
  fetchNotifications();

  const interval = setInterval(() => {
    fetchOverdue();
    fetchNotifications();
  }, 5000);

  return () => clearInterval(interval);
}, []);

const notificationStyles = {
  interview: { bg: "#f3f4f6", color: "#000000", icon: "📅" },
  followup: { bg: "#fef9c3", color: "#92400e", icon: "⏳" },
  followup_overdue: { bg: "#fee2e2", color: "#991b1b", icon: "🚨" },
};


  /* ================= FETCH DASHBOARD ================= */
  const fetchDashboard = async () => {
    try {
      const res = await api.get("/dashboard/counts");

      console.log("📊 DASHBOARD DATA:", res.data);

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

  /* ================= OVERDUE FOLLOWUPS ================= */
  const fetchOverdue = async () => {
    try {
      const res = await api.get("/followups-overdue");
      setOverdue(res.data || []);
    } catch (err) {
      console.error("Overdue followups load failed", err);
    }
  };

  const fetchNotifications = async () => {
  try {
    const res = await api.get("/notifications/all");
    setNotifications(res.data || []);
  } catch (err) {
    console.error("Notifications load failed", err);
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

      {/* 🔔 OVERDUE ALERT */}
      {overdue.length > 0 && (
        <div
          style={{
            background: "#ffe5e5",
            border: "1px solid #ef4444",
            padding: 15,
            marginBottom: 20,
            cursor: "pointer",
            borderRadius: 8,
          }}
          onClick={() => navigate("/leads")}
        >
          🔔 <b>{overdue.length}</b> overdue follow-ups need attention!
          <div style={{ fontSize: 12 }}>Click to view leads</div>
        </div>
      )}

{notifications.length > 0 && (
  <div style={{ marginBottom: 30 }}>
    <h3>🔔 Notifications</h3>

    {notifications.map((n) => (
      <div
        key={`${n.type}-${n.id}`}
        onClick={() => {
          if (n.type === "interview") {
            navigate("/interviews");
          } else {
            navigate(`/leads/${n.redirect_id}/followups`);
          }
        }}
        style={{
          background: notificationStyles[n.type]?.bg,
          color: notificationStyles[n.type]?.color,
          padding: 12,
          borderRadius: 8,
          marginBottom: 10,
          cursor: "pointer",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <b>
          {notificationStyles[n.type]?.icon} {n.title}
        </b>

        <div style={{ fontSize: 13 }}>{n.subtitle}</div>

        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {n.status} • {n.date}
        </div>
      </div>
    ))}
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
