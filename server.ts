import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("landlordos.db");
const JWT_SECRET = (process.env.JWT_SECRET || "4hQK+Kj8WjT7svGhqp+KooXk5Pikmw+fHjwFsMr8Gd0=").trim();

// --- DATABASE INITIALIZATION ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('LANDLORD', 'MANAGER', 'CARETAKER')) DEFAULT 'LANDLORD',
    owner_id TEXT, -- For multi-tenant isolation
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    total_units INTEGER NOT NULL,
    currency TEXT DEFAULT 'TZS',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    unit_number TEXT NOT NULL,
    rent_amount REAL NOT NULL,
    status TEXT CHECK(status IN ('VACANT', 'OCCUPIED', 'MAINTENANCE')) DEFAULT 'VACANT',
    tenant_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 1,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    unit_id TEXT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    national_id TEXT,
    lease_start DATETIME,
    lease_end DATETIME,
    rent_amount REAL NOT NULL,
    security_deposit REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 1,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    unit_id TEXT NOT NULL,
    amount_paid REAL NOT NULL,
    amount_due_at_time REAL NOT NULL,
    balance_after_transaction REAL NOT NULL,
    payment_date DATETIME NOT NULL,
    method TEXT NOT NULL,
    late_fee REAL DEFAULT 0,
    reference_number TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    category TEXT CHECK(category IN ('MAINTENANCE', 'UTILITY', 'REPAIR', 'VENDOR', 'OTHER')) NOT NULL,
    amount REAL NOT NULL,
    date DATETIME NOT NULL,
    notes TEXT,
    receipt_url TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 1,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL,
    tenant_id TEXT,
    description TEXT NOT NULL,
    image_url TEXT,
    status TEXT CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'PENDING',
    assigned_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 1,
    FOREIGN KEY(unit_id) REFERENCES units(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// --- MIDDLEWARE ---
const app = express();
app.use(express.json());

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error("JWT Verify Error:", err.message);
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

const authorize = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

const logAudit = (userId: string | null, action: string, entityType: string, entityId: string | null, oldVal: any = null, newVal: any = null) => {
  const id = Math.random().toString(36).substring(2, 15);
  const stmt = db.prepare('INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, userId, action, entityType, entityId, JSON.stringify(oldVal), JSON.stringify(newVal));
};

// --- AUTH ROUTES ---
app.post("/api/auth/register", async (req, res) => {
  const { email, password, fullName } = req.body;
  const id = Math.random().toString(36).substring(2, 15);
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const stmt = db.prepare('INSERT INTO users (id, email, password, full_name, role, owner_id) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, email, hashedPassword, fullName, 'LANDLORD', id);
    res.status(201).json({ message: "User registered" });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, role: user.role, owner_id: user.owner_id }, JWT_SECRET, { expiresIn: '24h' });
    logAudit(user.id, 'LOGIN', 'USER', user.id);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// --- PROPERTY ROUTES ---
app.get("/api/properties", authenticateToken, (req: any, res) => {
  const properties = db.prepare('SELECT * FROM properties WHERE owner_id = ? AND deleted_at IS NULL').all(req.user.owner_id);
  res.json(properties);
});

app.post("/api/properties", authenticateToken, authorize(['LANDLORD']), (req: any, res) => {
  const { name, address, totalUnits, currency, description } = req.body;
  const id = Math.random().toString(36).substring(2, 15);
  const stmt = db.prepare('INSERT INTO properties (id, owner_id, name, address, total_units, currency, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, req.user.owner_id, name, address, totalUnits, currency, description);
  
  // Create units automatically
  const unitStmt = db.prepare('INSERT INTO units (id, property_id, unit_number, rent_amount) VALUES (?, ?, ?, ?)');
  for (let i = 1; i <= totalUnits; i++) {
    unitStmt.run(Math.random().toString(36).substring(2, 15), id, `Unit ${i}`, 0);
  }
  
  logAudit(req.user.id, 'CREATE', 'PROPERTY', id, null, req.body);
  res.status(201).json({ id });
});

// --- UNIT ROUTES ---
app.get("/api/properties/:id/units", authenticateToken, (req: any, res) => {
  const units = db.prepare(`
    SELECT u.*, t.full_name as tenant_name 
    FROM units u 
    LEFT JOIN tenants t ON u.tenant_id = t.id 
    WHERE u.property_id = ? AND u.deleted_at IS NULL
  `).all(req.params.id);
  res.json(units);
});

app.put("/api/units/:id", authenticateToken, authorize(['LANDLORD', 'MANAGER']), (req: any, res) => {
  const { rent_amount, status } = req.body;
  const stmt = db.prepare('UPDATE units SET rent_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ?');
  stmt.run(rent_amount, status, req.params.id);
  res.json({ message: "Unit updated" });
});

// --- TENANT ROUTES ---
app.get("/api/tenants", authenticateToken, (req: any, res) => {
  const tenants = db.prepare(`
    SELECT t.*, p.name as property_name, u.unit_number 
    FROM tenants t
    JOIN properties p ON t.property_id = p.id
    LEFT JOIN units u ON t.unit_id = u.id
    WHERE p.owner_id = ? AND t.deleted_at IS NULL
  `).all(req.user.owner_id);
  res.json(tenants);
});

app.post("/api/tenants", authenticateToken, authorize(['LANDLORD', 'MANAGER']), (req: any, res) => {
  const { property_id, unit_id, full_name, phone, email, national_id, lease_start, lease_end, rent_amount, security_deposit } = req.body;
  const id = Math.random().toString(36).substring(2, 15);
  
  const dbTransaction = db.transaction(() => {
    // Insert tenant
    const stmt = db.prepare(`
      INSERT INTO tenants (id, property_id, unit_id, full_name, phone, email, national_id, lease_start, lease_end, rent_amount, security_deposit) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, property_id, unit_id, full_name, phone, email, national_id, lease_start, lease_end, rent_amount, security_deposit);

    // Update unit
    if (unit_id) {
      db.prepare('UPDATE units SET tenant_id = ?, status = "OCCUPIED" WHERE id = ?').run(id, unit_id);
    }
  });

  dbTransaction();
  logAudit(req.user.id, 'CREATE', 'TENANT', id, null, req.body);
  res.status(201).json({ id });
});

// --- PAYMENT ROUTES ---
app.post("/api/payments", authenticateToken, authorize(['LANDLORD', 'MANAGER']), (req: any, res) => {
  const { tenant_id, property_id, unit_id, amount_paid, amount_due_at_time, method, late_fee, reference_number, payment_date } = req.body;
  const id = Math.random().toString(36).substring(2, 15);
  const balance_after = amount_due_at_time - amount_paid;

  const stmt = db.prepare(`
    INSERT INTO payments (id, tenant_id, property_id, unit_id, amount_paid, amount_due_at_time, balance_after_transaction, payment_date, method, late_fee, reference_number, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, tenant_id, property_id, unit_id, amount_paid, amount_due_at_time, balance_after, payment_date, method, late_fee, reference_number, req.user.id);
  
  logAudit(req.user.id, 'CREATE', 'PAYMENT', id, null, req.body);
  res.status(201).json({ id });
});

app.get("/api/payments", authenticateToken, (req: any, res) => {
  const { property_id } = req.query;
  let query = `
    SELECT pay.*, t.full_name as tenant_name, p.name as property_name, u.unit_number
    FROM payments pay
    JOIN tenants t ON pay.tenant_id = t.id
    JOIN properties p ON pay.property_id = p.id
    JOIN units u ON pay.unit_id = u.id
    WHERE p.owner_id = ?
  `;
  const params = [req.user.owner_id];
  if (property_id) {
    query += " AND pay.property_id = ?";
    params.push(property_id);
  }
  query += " ORDER BY pay.payment_date DESC";
  
  const payments = db.prepare(query).all(...params);
  res.json(payments);
});

// --- EXPENSE ROUTES ---
app.post("/api/expenses", authenticateToken, authorize(['LANDLORD', 'MANAGER']), (req: any, res) => {
  const { property_id, category, amount, date, notes } = req.body;
  const id = Math.random().toString(36).substring(2, 15);
  const stmt = db.prepare('INSERT INTO expenses (id, property_id, category, amount, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, property_id, category, amount, date, notes, req.user.id);
  res.status(201).json({ id });
});

app.get("/api/expenses", authenticateToken, (req: any, res) => {
  const expenses = db.prepare(`
    SELECT e.*, p.name as property_name 
    FROM expenses e
    JOIN properties p ON e.property_id = p.id
    WHERE p.owner_id = ? AND e.deleted_at IS NULL
  `).all(req.user.owner_id);
  res.json(expenses);
});

// --- MAINTENANCE ROUTES ---
app.post("/api/maintenance", authenticateToken, (req: any, res) => {
  const { unit_id, tenant_id, description, assigned_to } = req.body;
  const id = Math.random().toString(36).substring(2, 15);
  const stmt = db.prepare('INSERT INTO maintenance (id, unit_id, tenant_id, description, assigned_to) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, unit_id, tenant_id, description, assigned_to);
  res.status(201).json({ id });
});

app.get("/api/maintenance", authenticateToken, (req: any, res) => {
  const tickets = db.prepare(`
    SELECT m.*, u.unit_number, p.name as property_name
    FROM maintenance m
    JOIN units u ON m.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE p.owner_id = ? AND m.deleted_at IS NULL
  `).all(req.user.owner_id);
  res.json(tickets);
});

app.put("/api/maintenance/:id", authenticateToken, (req: any, res) => {
  const { status, assigned_to } = req.body;
  const stmt = db.prepare('UPDATE maintenance SET status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(status, assigned_to, req.params.id);
  res.json({ message: "Maintenance updated" });
});

// --- DASHBOARD STATS ---
app.get("/api/dashboard/stats", authenticateToken, (req: any, res) => {
  const ownerId = req.user.owner_id;
  
  const income = db.prepare(`
    SELECT SUM(amount_paid) as total 
    FROM payments pay
    JOIN properties p ON pay.property_id = p.id
    WHERE p.owner_id = ? AND strftime('%m', pay.payment_date) = strftime('%m', 'now')
  `).get(ownerId) as any;

  const expenses = db.prepare(`
    SELECT SUM(amount) as total 
    FROM expenses e
    JOIN properties p ON e.property_id = p.id
    WHERE p.owner_id = ? AND strftime('%m', e.date) = strftime('%m', 'now')
  `).get(ownerId) as any;

  const units = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied
    FROM units u
    JOIN properties p ON u.property_id = p.id
    WHERE p.owner_id = ?
  `).get(ownerId) as any;

  const arrears = db.prepare(`
    SELECT SUM(rent_amount) as total
    FROM tenants t
    JOIN properties p ON t.property_id = p.id
    WHERE p.owner_id = ? AND t.id NOT IN (
      SELECT tenant_id FROM payments WHERE strftime('%m', payment_date) = strftime('%m', 'now')
    )
  `).get(ownerId) as any;

  res.json({
    monthlyIncome: income.total || 0,
    monthlyExpenses: expenses.total || 0,
    netProfit: (income.total || 0) - (expenses.total || 0),
    totalArrears: arrears.total || 0,
    occupancyRate: units.total > 0 ? (units.occupied / units.total) * 100 : 0,
    totalUnits: units.total,
    occupiedUnits: units.occupied
  });
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LandlordOS running on http://localhost:${PORT}`);
  });
}

startServer();
