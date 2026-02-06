// PostgreSQL is primary in production.
// SQLite REMOVED (no local file DB in production)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

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

// ================= DATABASE (POSTGRES ONLY) =================
const { pg } = require("./db");

// ================= POSTGRES INIT & MIGRATIONS =================
async function initPostgres() {
  try {
    // Connection check
    await pg.query("SELECT 1");

    // ===== HR USERS =====
    await pg.query(`
      CREATE TABLE IF NOT EXISTS hr (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        last_login TIMESTAMP,
        role TEXT DEFAULT 'hr',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ===== COMPANIES =====
    await pg.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT,
        hr_name TEXT,
        phone TEXT,
        email TEXT,
        industry TEXT,
        status TEXT
      );
    `);

    // ===== JOBS =====
    await pg.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        title TEXT,
        experience TEXT,
        salary TEXT,
        location TEXT,
        status TEXT,
        recruiter_name TEXT
      );
    `);

    // ===== CANDIDATES =====
    await pg.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        position TEXT,
        status TEXT,
        cv TEXT
      );
    `);

    // ===== JOB ↔ CANDIDATES (CORE CRM TABLE) =====
    await pg.query(`
      CREATE TABLE IF NOT EXISTS job_candidates (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        stage TEXT DEFAULT 'shared',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_id, candidate_id)
      );
    `);

    // ===== INTERVIEWS =====
    await pg.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        interview_date DATE,
        interview_time TEXT,
        recruiter_name TEXT,
        mode TEXT,
        status TEXT
      );
    `);

    // ===== LEADS =====
    await pg.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
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
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ===== FOLLOW UPS =====
    await pg.query(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'Pending',
        follow_up_date DATE NOT NULL,
        notes TEXT NOT NULL,
        mode TEXT,
        priority TEXT DEFAULT 'Medium',
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ===== NOTIFICATIONS =====
    await pg.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        type TEXT,
        message TEXT,
        related_id INTEGER,
        notify_date DATE,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ PostgreSQL fully initialized");
  } catch (err) {
    console.error("❌ PostgreSQL init failed", err);
    process.exit(1); // 🔥 fail fast, no half-broken server
  }
}

// ================= UPLOADS FOLDER =================
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ================= STATIC FILES =================
app.use("/uploads", express.static("uploads"));

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });



  // ================= SAFE DEFAULT USERS =================
const createDefaultUsersIfEmpty = async () => {
  try {
    const { rows } = await pg.query(
      "SELECT COUNT(*)::int AS count FROM hr"
    );

    if (rows[0].count === 0) {
      console.log("⚠️ No users found. Creating default users...");

      const adminPass = await bcrypt.hash("admin123", 10);
      const hrPass = await bcrypt.hash("hr123", 10);

      await pg.query(
        "INSERT INTO hr (username, password, avatar) VALUES ($1,$2,$3)",
        ["admin", adminPass, null]
      );

      await pg.query(
        "INSERT INTO hr (username, password, avatar) VALUES ($1,$2,$3)",
        ["hr_manager", hrPass, null]
      );

      console.log("✅ Default users created");
    }
  } catch (err) {
    console.error("User seed error", err);
  }
};

createDefaultUsersIfEmpty();


// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const username = req.body.username?.toLowerCase();
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    await pg.query(
      "INSERT INTO hr (username, password) VALUES ($1,$2)",
      [username, hashed]
    );

    res.json({ message: "Registered successfully" });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "User already exists" });
    }
    res.status(500).json({ message: "Registration failed" });
  }
});


// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const username = req.body.username?.toLowerCase();
  const password = req.body.password;

  try {
    const { rows } = await pg.query(
      "SELECT * FROM hr WHERE username = $1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid login" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid login" });
    }

    await pg.query(
      "UPDATE hr SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        last_login: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= AVATAR UPLOAD =================
app.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
  const id = Number(req.body.id);

  if (!id || !req.file) {
    return res.status(400).json({ message: "Missing user id or file" });
  }

  const avatarPath = `/uploads/${req.file.filename}`;

  try {
    await pg.query(
      "UPDATE hr SET avatar = $1 WHERE id = $2",
      [avatarPath, id]
    );

    res.json({ avatar: avatarPath });
  } catch (err) {
    console.error("Avatar update error", err);
    res.status(500).json({ message: "Database update failed" });
  }
});


// ================= PROFILE =================
app.put("/update-profile", async (req, res) => {
  const { id, username, password } = req.body;

  if (!id || !username) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 10);

      await pg.query(
        "UPDATE hr SET username = $1, password = $2 WHERE id = $3",
        [username.toLowerCase(), hashed, id]
      );

      res.json({ message: "Profile updated" });
    } else {
      await pg.query(
        "UPDATE hr SET username = $1 WHERE id = $2",
        [username.toLowerCase(), id]
      );

      res.json({ message: "Username updated" });
    }
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Username already exists" });
    }
    console.error("Profile update error", err);
    res.status(500).json({ message: "Update failed" });
  }
});


// ================= COMPANIES =================
app.post("/add-company", async (req, res) => {
  const { name, hr_name, phone, email, industry, status } = req.body;

  try {
    await pg.query(
      `
      INSERT INTO companies (name, hr_name, phone, email, industry, status)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [name, hr_name, phone, email, industry, status]
    );

    res.json({ message: "Company added" });
  } catch (err) {
    console.error("Add company error", err);
    res.status(500).json({ message: "Company add failed" });
  }
});

app.get("/companies", async (_, res) => {
  const { rows } = await pg.query("SELECT * FROM companies");
  res.json(rows);
});

app.put("/edit-company/:id", async (req, res) => {
  const { name, hr_name, phone, email, industry, status } = req.body;

  await pg.query(
    `
    UPDATE companies
    SET name=$1, hr_name=$2, phone=$3, email=$4, industry=$5, status=$6
    WHERE id=$7
    `,
    [name, hr_name, phone, email, industry, status, req.params.id]
  );

  res.json({ message: "Company updated" });
});

app.delete("/delete-company/:id", async (req, res) => {
  await pg.query(
    "DELETE FROM companies WHERE id=$1",
    [req.params.id]
  );

  res.json({ message: "Company deleted" });
});


// ================= JOBS =================
app.post("/add-job", async (req, res) => {
  const {
    company_id,
    title,
    experience,
    salary,
    location,
    status,
    recruiter_name,
  } = req.body;

  try {
    await pg.query(
      `
      INSERT INTO jobs
      (company_id, title, experience, salary, location, status, recruiter_name)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        company_id,
        title,
        experience,
        salary,
        location,
        status,
        recruiter_name || "",
      ]
    );

    res.json({ message: "Job added" });
  } catch (err) {
    console.error("Add job error:", err);
    res.status(500).json({ message: "Error adding job" });
  }
});

app.get("/jobs", async (_, res) => {
  const { rows } = await pg.query("SELECT * FROM jobs");
  res.json(rows);
});

// ================= SINGLE JOB =================
app.get("/jobs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pg.query(
      "SELECT * FROM jobs WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Fetch single job error", err);
    res.status(500).json({ message: "Failed to fetch job" });
  }
});


app.put("/edit-job/:id", async (req, res) => {
  const {
    title,
    company_id,
    experience,
    salary,
    location,
    status,
    recruiter_name,
  } = req.body;

  try {
    await pg.query(
      `
      UPDATE jobs
      SET title=$1,
          company_id=$2,
          experience=$3,
          salary=$4,
          location=$5,
          status=$6,
          recruiter_name=$7
      WHERE id=$8
      `,
      [
        title,
        company_id,
        experience,
        salary,
        location,
        status,
        recruiter_name || "",
        req.params.id,
      ]
    );

    res.json({ message: "Job updated" });
  } catch (err) {
    console.error("Edit job error:", err);
    res.status(500).json({ message: "Error updating job" });
  }
});

app.delete("/delete-job/:id", async (req, res) => {
  await pg.query("DELETE FROM jobs WHERE id=$1", [req.params.id]);
  res.json({ message: "Job deleted" });
});

// ================= COMPANY → JOBS =================
app.get("/companies/:companyId/jobs", async (req, res) => {
  const { companyId } = req.params;

  try {
    const { rows } = await pg.query(
      `
      SELECT *
      FROM jobs
      WHERE company_id = $1
      ORDER BY id DESC
      `,
      [companyId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch company jobs error", err);
    res.status(500).json([]);
  }
});

// ================= AVAILABLE CANDIDATES FOR JOB =================
app.get("/jobs/:jobId/available-candidates", async (req, res) => {
  const { jobId } = req.params;

  try {
    const { rows } = await pg.query(
      `
      SELECT *
      FROM candidates
      WHERE id NOT IN (
        SELECT candidate_id
        FROM job_candidates
        WHERE job_id = $1
      )
      ORDER BY id DESC
      `,
      [jobId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch available candidates error", err);
    res.status(500).json([]);
  }
});

// ================= JOB → CANDIDATES (MODERN CRM CORE) =================

// Add candidate to a job
app.post("/jobs/:jobId/candidates", async (req, res) => {
  const { jobId } = req.params;
  const { candidateId } = req.body;

  try {
    await pg.query(
      `
      INSERT INTO job_candidates (job_id, candidate_id)
      VALUES ($1,$2)
      ON CONFLICT DO NOTHING
      `,
      [jobId, candidateId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Assign candidate error", err);
    res.status(500).json({ message: "Failed to assign candidate" });
  }
});


// Get candidates for a specific job
app.get("/jobs/:jobId/candidates", async (req, res) => {
  const { jobId } = req.params;

  try {
    const { rows } = await pg.query(
      `
      SELECT c.*, jc.stage
      FROM job_candidates jc
      JOIN candidates c ON c.id = jc.candidate_id
      WHERE jc.job_id = $1
      ORDER BY jc.assigned_at DESC
      `,
      [jobId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch job candidates error", err);
    res.status(500).json([]);
  }
});



// Update candidate stage for a job
app.put("/jobs/:jobId/candidates/:candidateId", async (req, res) => {
  const { jobId, candidateId } = req.params;
  const { stage } = req.body;

  try {
    await pg.query(
      `
      UPDATE job_candidates
      SET stage = $1
      WHERE job_id = $2 AND candidate_id = $3
      `,
      [stage, jobId, candidateId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Stage update error", err);
    res.status(500).json({ message: "Stage update failed" });
  }
});


// ================= CANDIDATES =================
app.post("/add-candidate", upload.single("cv"), async (req, res) => {
  const { name, email, phone, position, status } = req.body;
  const cv = req.file ? req.file.filename : null;

  try {
    const { rows } = await pg.query(
      `
      INSERT INTO candidates (name, email, phone, position, status, cv)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id
      `,
      [name, email, phone, position, status, cv]
    );

    res.json({ message: "Candidate added", id: rows[0].id });
  } catch (err) {
    console.error("Add candidate error", err);
    res.status(500).json({ message: "Candidate add failed" });
  }
});

app.get("/candidates", async (_, res) => {
  const { rows } = await pg.query("SELECT * FROM candidates");
  res.json(rows);
});

app.put("/update-candidate-status/:id", async (req, res) => {
  await pg.query(
    "UPDATE candidates SET status=$1 WHERE id=$2",
    [req.body.status, req.params.id]
  );

  res.json({ message: "Status updated" });
});

app.delete("/delete-candidate/:id", async (req, res) => {
  await pg.query("DELETE FROM candidates WHERE id=$1", [req.params.id]);
  res.json({ message: "Candidate deleted" });
});


// ================= INTERVIEWS =================
app.post("/add-interview", async (req, res) => {
  const {
    candidate_id,
    interview_date,
    interview_time,
    recruiter_name,
    mode,
    status,
  } = req.body;

  try {
    await pg.query(
      `
      INSERT INTO interviews
      (candidate_id, interview_date, interview_time, recruiter_name, mode, status)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        candidate_id,
        interview_date,
        interview_time,
        recruiter_name,
        mode,
        status,
      ]
    );

    // Auto-update candidate status
    await pg.query(
      "UPDATE candidates SET status=$1 WHERE id=$2",
      ["Interview Scheduled", candidate_id]
    );

    // Notification (1 day before)
    const notifyDate = new Date(interview_date);
    notifyDate.setDate(notifyDate.getDate() - 1);

    await pg.query(
      `
      INSERT INTO notifications (type, message, related_id, notify_date)
      VALUES ($1,$2,$3,$4)
      `,
      [
        "interview",
        "📅 Interview scheduled for tomorrow",
        candidate_id,
        notifyDate.toISOString().split("T")[0],
      ]
    );

    res.json({
      message: "Interview scheduled & candidate status updated",
    });
  } catch (err) {
    console.error("Interview add error", err);
    res.status(500).json({ message: "Interview scheduling failed" });
  }
});

app.get("/interviews", async (_, res) => {
  const { rows } = await pg.query(`
    SELECT i.*, c.name AS candidate, j.title AS job_title
    FROM interviews i
    LEFT JOIN candidates c ON i.candidate_id = c.id
    LEFT JOIN job_candidates jc ON jc.candidate_id = c.id
    LEFT JOIN jobs j ON jc.job_id = j.id
  `);

  res.json(rows);
});

app.delete("/delete-interview/:id", async (req, res) => {
  await pg.query("DELETE FROM interviews WHERE id=$1", [req.params.id]);
  res.json({ message: "Interview deleted" });
});


// ================= NOTIFICATIONS (COMBINED) =================
app.get("/notifications/all", async (_, res) => {
  try {
    const { rows } = await pg.query(`
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
      LEFT JOIN job_candidates jc ON jc.candidate_id = c.id
      LEFT JOIN jobs j ON jc.job_id = j.id
      WHERE i.interview_date = CURRENT_DATE + INTERVAL '1 day'

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
      WHERE f.follow_up_date = CURRENT_DATE
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
      WHERE f.follow_up_date < CURRENT_DATE
        AND f.status = 'Pending'

      ORDER BY date ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("NOTIFICATION ERROR:", err);
    res.status(500).json([]);
  }
});


// ================= LEADS =================
app.post("/add-lead", async (req, res) => {
  const l = req.body;

  try {
    await pg.query(
      `
      INSERT INTO leads
      (
        company_name,
        hr_person,
        designation,
        contact_no,
        email,
        address,
        source,
        reference,
        industry,
        company_size,
        city,
        lead_owner,
        lead_status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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
        l.lead_status || "New",
      ]
    );

    res.json({ message: "Lead added" });
  } catch (err) {
    console.error("ADD LEAD ERROR:", err);
    res.status(500).json({ message: "Lead add failed" });
  }
});

app.get("/leads", async (_, res) => {
  const { rows } = await pg.query(
    "SELECT * FROM leads ORDER BY created_date DESC"
  );
  res.json(rows);
});


// ================= EDIT LEAD =================
app.put("/edit-lead/:id", async (req, res) => {
  const l = req.body;

  try {
    await pg.query(
      `
      UPDATE leads SET
        company_name=$1,
        hr_person=$2,
        designation=$3,
        contact_no=$4,
        email=$5,
        address=$6,
        source=$7,
        reference=$8,
        industry=$9,
        company_size=$10,
        city=$11,
        lead_owner=$12,
        lead_status=$13
      WHERE id=$14
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
      ]
    );

    res.json({ message: "Lead updated successfully" });
  } catch (err) {
    console.error("EDIT LEAD ERROR:", err);
    res.status(500).json({ message: "Lead update failed" });
  }
});


// ================= DELETE LEAD =================
app.delete("/delete-lead/:id", async (req, res) => {
  const result = await pg.query(
    "DELETE FROM leads WHERE id=$1",
    [req.params.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Lead not found" });
  }

  res.json({ message: "Lead deleted successfully" });
});



// ================= FOLLOW UPS =================
app.post("/add-followup", async (req, res) => {
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

  try {
    if (id) {
      // UPDATE
      await pg.query(
        `
        UPDATE follow_ups SET
          status = $1,
          follow_up_date = $2,
          notes = $3,
          mode = $4,
          priority = $5,
          created_by = $6
        WHERE id = $7
        `,
        [
          status,
          follow_up_date,
          notes,
          mode,
          priority || "Medium",
          created_by,
          id,
        ]
      );

      res.json({ message: "Follow-up updated" });
    } else {
      // INSERT
      await pg.query(
        `
        INSERT INTO follow_ups
        (lead_id, status, follow_up_date, notes, mode, priority, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          lead_id,
          status,
          follow_up_date,
          notes,
          mode,
          priority || "Medium",
          created_by,
        ]
      );

      res.json({ message: "Follow-up added" });
    }
  } catch (err) {
    console.error("FOLLOW UP ERROR:", err);
    res.status(500).json({ message: "Follow-up save failed" });
  }
});


app.put("/update-followup/:id", async (req, res) => {
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

  try {
    await pg.query(
      `
      UPDATE follow_ups SET
        status = $1,
        follow_up_date = $2,
        notes = $3,
        mode = $4,
        priority = $5,
        created_by = $6
      WHERE id = $7
      `,
      [
        status,
        follow_up_date,
        notes,
        mode,
        priority || "Medium",
        created_by,
        req.params.id,
      ]
    );

    res.json({ message: "Follow-up updated" });
  } catch (err) {
    console.error("UPDATE FOLLOWUP ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
});


app.get("/followups/:leadId", async (req, res) => {
  const { rows } = await pg.query(
    `
    SELECT *
    FROM follow_ups
    WHERE lead_id = $1
    ORDER BY follow_up_date DESC
    `,
    [req.params.leadId]
  );

  res.json(rows);
});


app.delete("/delete-followup/:id", async (req, res) => {
  const result = await pg.query(
    "DELETE FROM follow_ups WHERE id = $1",
    [req.params.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Follow-up not found" });
  }

  res.json({ message: "Follow-up deleted" });
});


app.get("/followups-overdue", async (_, res) => {
  const { rows } = await pg.query(
    `
    SELECT f.*, l.company_name
    FROM follow_ups f
    JOIN leads l ON f.lead_id = l.id
    WHERE f.follow_up_date < CURRENT_DATE
      AND f.status = 'Pending'
    `
  );

  res.json(rows);
});


// ================= DASHBOARD COUNTS =================
app.get("/dashboard/counts", async (req, res) => {
  try {
    const counts = {
      total: 0,
      Applied: 0,
      Shortlisted: 0,
      "Interview Scheduled": 0,
      Hired: 0,
      Rejected: 0,
    };

    // TOTAL
    const totalResult = await pg.query(
      "SELECT COUNT(*)::int AS total FROM candidates"
    );
    counts.total = totalResult.rows[0].total;

    // STATUS-WISE
    const statusResult = await pg.query(
      "SELECT status, COUNT(*)::int AS count FROM candidates GROUP BY status"
    );

    statusResult.rows.forEach((r) => {
      counts[r.status] = r.count;
    });

    res.json(counts);
  } catch (err) {
    console.error("DASHBOARD COUNT ERROR:", err);
    res.status(500).json({ message: "Dashboard count failed" });
  }
});

// ================= START SERVER AFTER DB READY =================
initPostgres().then(async () => {
  await createDefaultUsersIfEmpty();

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
});
