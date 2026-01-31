
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const pg = require("./db"); // ✅ ADD THIS


// ✅ INITIALIZE APP FIRST
const app = express();

const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: "https://crm-software-tau.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);



app.use(express.json());



// ================= UPLOADS FOLDER =================
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ STATIC FILE SERVING (AFTER app INIT)
app.use("/uploads", express.static("uploads"));


// ================= DATABASE =================
const dbPath = path.join(__dirname, "crm.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB error", err);
  else console.log("SQLite Connected");
});


// ================= MULTER =================
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });
// ================= TABLES =================
db.serialize(() => {
 db.run(`
  CREATE TABLE IF NOT EXISTS hr(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    avatar TEXT,
    last_login DATETIME
  )
`);


  db.run(`
    CREATE TABLE IF NOT EXISTS companies(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      hr_name TEXT,
      phone TEXT,
      email TEXT,
      industry TEXT,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS jobs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      title TEXT,
      experience TEXT,
      salary TEXT,
      location TEXT,
      status TEXT,
      recruiter_name TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS candidates(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      position TEXT,
      status TEXT,
      company_id INTEGER,
      job_id INTEGER,
      cv TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS interviews(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER,
      interview_date TEXT,
      interview_time TEXT,
      recruiter_name TEXT,
      mode TEXT,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leads(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      hr_person TEXT,
      designation TEXT,
      contact_no TEXT,
      email TEXT,
      address TEXT,
      source TEXT,
      reference TEXT,
      industry TEXT,
      company_size TEXT,
      city TEXT,
      lead_owner TEXT,
      lead_status TEXT DEFAULT 'New',
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

 db.run(`
  CREATE TABLE IF NOT EXISTS follow_ups(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Pending',
    follow_up_date DATE NOT NULL,
    notes TEXT NOT NULL,
    mode TEXT,
    priority TEXT CHECK(priority IN ('Low','Medium','High')) DEFAULT 'Medium',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  )
`);


  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      message TEXT,
      related_id INTEGER,
      notify_date DATE,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.get("/debug/users", (req, res) => {
  db.all("SELECT id, username, avatar FROM hr", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

  // ================= SAFE DEFAULT USERS =================
const createDefaultUsersIfEmpty = async () => {
  db.get("SELECT COUNT(*) as count FROM hr", async (err, row) => {
    if (err) {
      console.error("User count error", err);
      return;
    }

    if (row.count === 0) {
      console.log("⚠️ No users found. Creating default users...");

      const adminPass = await bcrypt.hash("admin123", 10);
      const hrPass = await bcrypt.hash("hr123", 10);

      db.run(
        "INSERT INTO hr(username,password,avatar) VALUES(?,?,?)",
        ["admin", adminPass, null]
      );

      db.run(
        "INSERT INTO hr(username,password,avatar) VALUES(?,?,?)",
        ["hr_manager", hrPass, null]
      );

      console.log("✅ Default users created");
    }
  });
};

createDefaultUsersIfEmpty();

 
});

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const username = req.body.username?.toLowerCase();
  const password = req.body.password;

  if (!username || !password)
    return res.status(400).json({ message: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO hr(username,password) VALUES(?,?)",
    [username, hashed],
    (err) => {
      if (err)
        return res.status(400).json({ message: "User already exists" });
      res.json({ message: "Registered successfully" });
    }
  );
});

// ================= DEFAULT ACCOUNTS (PROTECTED) =================

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const username = req.body.username?.toLowerCase();
  const password = req.body.password;

  db.get("SELECT * FROM hr WHERE username=?", [username], async (_, row) => {
    if (!row) return res.status(401).json({ message: "Invalid login" });

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(401).json({ message: "Invalid login" });

    db.run("UPDATE hr SET last_login=CURRENT_TIMESTAMP WHERE id=?", [row.id]);

    res.json({
  success: true,
  user: {
    id: row.id,
    username: row.username,
    avatar: row.avatar,
    last_login: new Date().toISOString(),
  },
});

  });
});


// ================= AVATAR UPLOAD =================
app.post("/upload-avatar", upload.single("avatar"), (req, res) => {
  const id = Number(req.body.id);

  if (!id || !req.file) {
    return res.status(400).json({ message: "Missing user id or file" });
  }

  const avatarPath = `/uploads/${req.file.filename}`;

  db.run(
    "UPDATE hr SET avatar=? WHERE id=?",
    [avatarPath, id],
    function (err) {
      if (err) {
        console.error("AVATAR DB ERROR:", err);
        return res.status(500).json({ message: "Database update failed" });
      }

      res.json({
        avatar: avatarPath,
      });
    }
  );
});





// ================= PROFILE =================
app.put("/update-profile", async (req, res) => {
  const { id, username, password } = req.body;

  if (!id || !username)
    return res.status(400).json({ message: "Missing fields" });

  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      db.run(
        "UPDATE hr SET username=?, password=? WHERE id=?",
        [username.toLowerCase(), hashed, id],
        function (err) {
          if (err) {
            if (err.message.includes("UNIQUE"))
              return res
                .status(400)
                .json({ message: "Username already exists" });
            return res.status(500).json({ message: "Update failed" });
          }
          res.json({ message: "Profile updated" });
        }
      );
    } else {
      db.run(
        "UPDATE hr SET username=? WHERE id=?",
        [username.toLowerCase(), id],
        function (err) {
          if (err) {
            if (err.message.includes("UNIQUE"))
              return res
                .status(400)
                .json({ message: "Username already exists" });
            return res.status(500).json({ message: "Update failed" });
          }
          res.json({ message: "Username updated" });
        }
      );
    }
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= COMPANIES =================
app.post("/add-company", (req, res) => {
  const { name, hr_name, phone, email, industry, status } = req.body;

  db.run(
    "INSERT INTO companies VALUES(NULL,?,?,?,?,?,?)",
    [name, hr_name, phone, email, industry, status],
    function (err) {
      if (err) return res.status(500).json({ message: "Company add failed" });
      res.json({ message: "Company added" });
    }
  );
});

app.get("/companies", (_, res) => {
  db.all("SELECT * FROM companies", [], (_, rows) => {
    res.json(rows || []);
  });
});

app.put("/edit-company/:id", (req, res) => {
  const { name, hr_name, phone, email, industry, status } = req.body;

  db.run(
    `UPDATE companies 
     SET name=?, hr_name=?, phone=?, email=?, industry=?, status=? 
     WHERE id=?`,
    [name, hr_name, phone, email, industry, status, req.params.id],
    () => res.json({ message: "Company updated" })
  );
});

app.delete("/delete-company/:id", (req, res) => {
  db.run(
    "DELETE FROM companies WHERE id=?",
    [req.params.id],
    () => res.json({ message: "Company deleted" })
  );
});

// ================= JOBS =================
app.post("/add-job", (req, res) => {
  const { company_id, title, experience, salary, location, status, recruiter_name } = req.body;

  db.run(
    "INSERT INTO jobs VALUES(NULL,?,?,?,?,?,?,?)",
    [company_id, title, experience, salary, location, status, recruiter_name || ""],
    (err) => {
      if (err) {
        console.error("Add job error:", err);
        return res.status(500).json({ message: "Error adding job", error: err.message });
      }
      res.json({ message: "Job added" });
    }
  );
});

app.get("/jobs", (_, res) => {
  db.all("SELECT * FROM jobs", [], (_, rows) => {
    res.json(rows || []);
  });
});

app.put("/edit-job/:id", (req, res) => {
  const { title, company_id, experience, salary, location, status, recruiter_name } = req.body;

  db.run(
    `UPDATE jobs 
     SET title=?, company_id=?, experience=?, salary=?, location=?, status=?, recruiter_name=? 
     WHERE id=?`,
    [title, company_id, experience, salary, location, status, recruiter_name || "", req.params.id],
    (err) => {
      if (err) {
        console.error("Edit job error:", err);
        return res.status(500).json({ message: "Error updating job", error: err.message });
      }
      res.json({ message: "Job updated" });
    }
  );
});

app.delete("/delete-job/:id", (req, res) => {
  db.run(
    "DELETE FROM jobs WHERE id=?",
    [req.params.id],
    () => res.json({ message: "Job deleted" })
  );
});

// ================= CANDIDATES =================
app.post("/add-candidate", upload.single("cv"), (req, res) => {
  const { name, email, phone, position, status, company_id, job_id } = req.body;
  const cv = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO candidates VALUES(NULL,?,?,?,?,?,?,?,?)`,
    [name, email, phone, position, status, company_id, job_id, cv],
    () => res.json({ message: "Candidate added" })
  );
});

app.get("/candidates", (_, res) => {
  db.all("SELECT * FROM candidates", [], (_, rows) => {
    res.json(rows || []);
  });
});

app.put("/update-candidate-status/:id", (req, res) => {
  db.run(
    "UPDATE candidates SET status=? WHERE id=?",
    [req.body.status, req.params.id],
    () => res.json({ message: "Status updated" })
  );
});

app.delete("/delete-candidate/:id", (req, res) => {
  db.run(
    "DELETE FROM candidates WHERE id=?",
    [req.params.id],
    () => res.json({ message: "Candidate deleted" })
  );
});

// ================= INTERVIEWS =================
app.post("/add-interview", (req, res) => {
  const {
    candidate_id,
    interview_date,
    interview_time,
    recruiter_name,
    mode,
    status,
  } = req.body;

  db.run(
    `INSERT INTO interviews (candidate_id, interview_date, interview_time, recruiter_name, mode, status) VALUES (?,?,?,?,?,?)`,
    [candidate_id, interview_date, interview_time, recruiter_name, mode, status],
    function (err) {
      if (err) {
        console.error("INTERVIEW ADD ERROR:", err);
        return res.status(500).json({ message: "Interview scheduling failed", error: err.message });
      }

      // ✅ AUTO-UPDATE CANDIDATE STATUS
      db.run(
        "UPDATE candidates SET status=? WHERE id=?",
        ["Interview Scheduled", candidate_id],
        (err) => {
          if (err) console.error("CANDIDATE UPDATE ERROR:", err);
        }
      );

      // 🔔 CREATE NOTIFICATION FOR 1 DAY BEFORE INTERVIEW
      const notifyDate = new Date(interview_date);
      notifyDate.setDate(notifyDate.getDate() - 1);
      
      db.run(
        `INSERT INTO notifications (type, message, related_id, notify_date) VALUES (?,?,?,?)`,
        [
          "interview",
          "📅 Interview scheduled for tomorrow",
          candidate_id,
          notifyDate.toISOString().split('T')[0],
        ],
        (err) => {
          if (err) console.error("NOTIFICATION ERROR:", err);
        }
      );

      res.json({
        message: "Interview scheduled & candidate status updated",
      });
    }
  );
});


app.put("/notifications/read/:id", (req, res) => {
  db.run(
    "UPDATE notifications SET is_read=1 WHERE id=?",
    [req.params.id],
    () => res.json({ message: "Notification marked as read" })
  );
});



app.get("/interviews", (_, res) => {
  db.all(
    `
    SELECT i.*, c.name AS candidate, j.title AS job_title
    FROM interviews i
    LEFT JOIN candidates c ON i.candidate_id = c.id
    LEFT JOIN jobs j ON c.job_id = j.id
    `,
    [],
    (_, rows) => res.json(rows || [])
  );
});

app.delete("/delete-interview/:id", (req, res) => {
  db.run(
    "DELETE FROM interviews WHERE id=?",
    [req.params.id],
    () => res.json({ message: "Interview deleted" })
  );
});

// ================= NOTIFICATIONS (COMBINED) =================
app.get("/notifications/all", (_, res) => {
  db.all(
    `
    -- 📅 Interviews tomorrow
    SELECT 
      i.id,
      'interview' AS type,
      i.interview_date AS date,
      i.interview_time AS time,
      'Interview Tomorrow' AS status,
      c.name AS title,
      j.title AS subtitle,
      c.id AS redirect_id
    FROM interviews i
    JOIN candidates c ON i.candidate_id = c.id
    LEFT JOIN jobs j ON c.job_id = j.id
    WHERE DATE(i.interview_date) = DATE('now', '+1 day')

    UNION ALL

    -- ⏳ Follow-ups due today
    SELECT 
      f.id,
      'followup' AS type,
      f.follow_up_date AS date,
      NULL AS time,
      'Due Today' AS status,
      l.company_name AS title,
      f.notes AS subtitle,
      l.id AS redirect_id
    FROM follow_ups f
    JOIN leads l ON f.lead_id = l.id
    WHERE DATE(f.follow_up_date) = DATE('now')
      AND f.status = 'Pending'

    UNION ALL

    -- 🚨 Overdue follow-ups
    SELECT 
      f.id,
      'followup_overdue' AS type,
      f.follow_up_date AS date,
      NULL AS time,
      'Overdue' AS status,
      l.company_name AS title,
      f.notes AS subtitle,
      l.id AS redirect_id
    FROM follow_ups f
    JOIN leads l ON f.lead_id = l.id
    WHERE f.follow_up_date < DATE('now')
      AND f.status = 'Pending'

    ORDER BY date ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error("NOTIFICATION ERROR:", err);
        return res.status(500).json([]);
      }
      res.json(rows || []);
    }
  );
});


// ================= LEADS =================
app.post("/add-lead", (req, res) => {
  const l = req.body;
  db.run(
    `INSERT INTO leads VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
    [
      l.company_name,
      l.hr_person,
      l.designation,
      l.contact_no,
      l.email,
      l.address,
      l.source,
      l.reference,
      l.industry,
      l.company_size,
      l.city,
      l.lead_owner,
      l.lead_status || "New",
    ],
    () => res.json({ message: "Lead added" })
  );
});

app.get("/leads", (_, res) =>
  db.all("SELECT * FROM leads ORDER BY created_date DESC", [], (_, rows) =>
    res.json(rows || [])
  )
);


// ================= EDIT LEAD =================
app.put("/edit-lead/:id", (req, res) => {
  const l = req.body;

  db.run(
    `
    UPDATE leads SET
      company_name=?,
      hr_person=?,
      designation=?,
      contact_no=?,
      email=?,
      address=?,
      source=?,
      "reference"=?,
      industry=?,
      company_size=?,
      city=?,
      lead_owner=?,
      lead_status=?
    WHERE id=?
    `,
    [
      l.company_name,
      l.hr_person,
      l.designation,
      l.contact_no,
      l.email,
      l.address,
      l.source,
      l.reference,
      l.industry,
      l.company_size,
      l.city,
      l.lead_owner,
      l.lead_status,
      req.params.id,
    ],
    function (err) {
      if (err) {
        console.error("EDIT LEAD ERROR:", err);
        return res.status(500).json({ message: "Lead update failed" });
      }
      res.json({ message: "Lead updated successfully" });
    }
  );
});


// ================= DELETE LEAD =================
app.delete("/delete-lead/:id", (req, res) => {
  db.run(
    "DELETE FROM leads WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Delete failed" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "Lead not found" });
      }

      res.json({ message: "Lead deleted successfully" });
    }
  );
});


// ================= FOLLOW UPS =================
app.post("/add-followup", (req, res) => {
  const {
    id,
    lead_id,
    status,
    follow_up_date,
    notes,
    mode,
    priority,
    created_by,
  } = req.body;

  if (!lead_id || !status || !follow_up_date || !notes) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (id) {
    // UPDATE
    db.run(
      `
      UPDATE follow_ups SET
        status=?,
        follow_up_date=?,
        notes=?,
        mode=?,
        priority=?,
        created_by=?
      WHERE id=?
      `,
      [
        status,
        follow_up_date,
        notes,
        mode,
        priority || "Medium",
        created_by,
        id,
      ],
      (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Follow-up updated" });
      }
    );
  } else {
    // INSERT
    db.run(
      `
      INSERT INTO follow_ups
      (lead_id, status, follow_up_date, notes, mode, priority, created_by)
      VALUES (?,?,?,?,?,?,?)
      `,
      [
        lead_id,
        status,
        follow_up_date,
        notes,
        mode,
        priority || "Medium",
        created_by,
      ],
      (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Follow-up added" });
      }
    );
  }
});



app.put("/update-followup/:id", (req, res) => {
  const {
    status,
    follow_up_date,
    notes,
    mode,
    priority,
    created_by,
  } = req.body;

  if (!status || !follow_up_date || !notes) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  db.run(
    `
    UPDATE follow_ups SET
      status=?,
      follow_up_date=?,
      notes=?,
      mode=?,
      priority=?,
      created_by=?
    WHERE id=?
    `,
    [
      status,
      follow_up_date,
      notes,
      mode,
      priority || "Medium",
      created_by,
      req.params.id,
    ],
    function (err) {
      if (err) {
        console.error("UPDATE FOLLOWUP ERROR:", err);
        return res.status(500).json({ message: "Update failed" });
      }
      res.json({ message: "Follow-up updated" });
    }
  );
});


app.get("/followups/:leadId", (req, res) =>
  db.all(
    `
    SELECT *
    FROM follow_ups
    WHERE lead_id=?
    ORDER BY follow_up_date DESC
    `,
    [req.params.leadId],
    (_, rows) => res.json(rows || [])
  )
);


app.delete("/delete-followup/:id", (req, res) =>
  db.run(
    "DELETE FROM follow_ups WHERE id=?",
    [req.params.id],
    () => res.json({ message: "Follow-up deleted" })
  )
);


app.get("/followups-overdue", (_, res) =>
  db.all(
    `
    SELECT f.*, l.company_name
    FROM follow_ups f
    JOIN leads l ON f.lead_id = l.id
    WHERE f.follow_up_date < DATE('now')
      AND f.status = 'Pending'
    `,
    [],
    (_, rows) => res.json(rows || [])
  )
);


// ================= DASHBOARD COUNTS =================
app.get("/dashboard/counts", (req, res) => {
  const counts = {
    total: 0,
    Applied: 0,
    Shortlisted: 0,
    "Interview Scheduled": 0,
    Hired: 0,
    Rejected: 0,
  };

  // TOTAL CANDIDATES
  db.get("SELECT COUNT(*) as total FROM candidates", [], (err, row) => {
    if (err) return res.status(500).json(err);
    counts.total = row.total;

    // STATUS-WISE COUNTS
    db.all(
      "SELECT status, COUNT(*) as count FROM candidates GROUP BY status",
      [],
      (err, rows) => {
        if (err) return res.status(500).json(err);

        rows.forEach((r) => {
          counts[r.status] = r.count;
        });

        res.json(counts);
      }
    );
  });
});



// ================= SERVER =================
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
