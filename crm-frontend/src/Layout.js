import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./layout.css";

import API from "./api";

function Layout() {
  // ✅ FIXED USER STATE (CLEAN & SAFE)
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );

  // ✅ KEEP USER IN SYNC WITH LOCALSTORAGE (AVATAR FIX)
  useEffect(() => {
    const syncUser = () => {
      setUser(JSON.parse(localStorage.getItem("user")));
    };

    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const [openUser, setOpenUser] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ================= ACTIVE SIDEBAR =================
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" ? "nav-item active" : "nav-item";
    }
    return location.pathname.startsWith(path)
      ? "nav-item active"
      : "nav-item";
  };

  // ================= FETCH NOTIFICATIONS =================
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= CLOSE DROPDOWNS ON OUTSIDE CLICK =================
  useEffect(() => {
    const handleClickOutside = (e) => {
      const notifWrapper = document.querySelector(".notif-wrapper");
      const userChip = document.querySelector(".user-chip");

      if (notifWrapper && !notifWrapper.contains(e.target)) {
        setOpenNotif(false);
      }

      if (
        userChip &&
        !userChip.contains(e.target) &&
        !document.querySelector(".user-dropdown")?.contains(e.target)
      ) {
        setOpenUser(false);
      }
    };

    if (openNotif || openUser) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openNotif, openUser]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/notifications/all`);
      const data = await res.json();
      setNotifications(data || []);
    } catch (err) {
      console.error("Notification fetch failed", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id) => {
    await axios.put(`${API}/notifications/read/${id}`);
    fetchNotifications();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1 className="logo animate-logo">ADROIT HR CRM</h1>

        <div className="topbar-tagline">
          Hire Us for Your Hiring
          <span className="tagline-glow" />
        </div>

        <div className="topbar-right">
          {/* 🔔 NOTIFICATIONS */}
          <div className="notif-wrapper">
            <div
              className="notif-bell"
              onClick={(e) => {
                e.stopPropagation();
                setOpenNotif(!openNotif);
                setOpenUser(false);
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notif-count">{unreadCount}</span>
              )}
            </div>

            {openNotif && (
              <div
                className="notif-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <h4>🔔 Reminders & Updates</h4>

                {notifications.length === 0 ? (
                  <p className="empty">No upcoming reminders</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${
                        n.type === "followup_overdue" ? "overdue" : ""
                      }`}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.type === "interview") {
                          navigate("/interviews");
                        } else {
                          navigate("/leads");
                        }
                        setOpenNotif(false);
                      }}
                    >
                      <strong>{n.title}</strong>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 👤 USER CHIP */}
          <div
            className="user-chip"
            onClick={() => {
              setOpenUser(!openUser);
              setOpenNotif(false);
            }}
          >
            {user?.avatar ? (
              <img
                src={`${API}${user.avatar}?t=${Date.now()}`}
                alt="avatar"
              />
            ) : (
              <div className="avatar-fallback">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="username">{user?.username}</span>
          </div>

          {openUser && (
            <div
              className="user-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="last-login">
                Last login:
                <br />
                <small>
                  {user?.last_login
                    ? new Date(user.last_login).toLocaleString()
                    : "First login"}
                </small>
              </p>

              <Link to="/profile" onClick={() => setOpenUser(false)}>
                👤 Profile
              </Link>

              <button
                className="logout-btn"
                onClick={() => {
                  localStorage.removeItem("user");
                  window.location = "/login";
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <Link className={isActive("/")} to="/">Dashboard</Link>
          <Link className={isActive("/leads")} to="/leads">Leads</Link>
          <Link className={isActive("/companies")} to="/companies">Companies</Link>
          <Link className={isActive("/jobs")} to="/jobs">Jobs</Link>
          <Link className={isActive("/candidates")} to="/candidates">Candidates</Link>
          <Link className={isActive("/interviews")} to="/interviews">Interviews</Link>
          <Link className={isActive("/profile")} to="/profile">Profile</Link>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
