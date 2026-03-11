import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('database.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('admin', 'technician'))
  );

  CREATE TABLE IF NOT EXISTS company_info (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT,
    address TEXT,
    logo_url TEXT,
    signature_url TEXT,
    npwp TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    signatory_name TEXT,
    signatory_role TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_name TEXT
  );

  CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    category TEXT,
    unit TEXT,
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    price REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    technician_id INTEGER,
    type TEXT CHECK(type IN ('invoice', 'receipt')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'validated', 'rejected')),
    client_name TEXT,
    client_address TEXT,
    due_date TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    other_costs REAL DEFAULT 0,
    other_costs_description TEXT,
    ppn REAL DEFAULT 0,
    down_payment REAL DEFAULT 0,
    total_amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(technician_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS submission_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER,
    item_name TEXT,
    description TEXT,
    quantity INTEGER,
    price REAL,
    is_from_stock INTEGER DEFAULT 0,
    stock_id INTEGER,
    FOREIGN KEY(submission_id) REFERENCES submissions(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    file_url TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration for other_costs and ppn
try {
  db.prepare('ALTER TABLE submissions ADD COLUMN other_costs REAL DEFAULT 0').run();
  db.prepare('ALTER TABLE submissions ADD COLUMN other_costs_description TEXT').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE submissions ADD COLUMN ppn REAL DEFAULT 0').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE submissions ADD COLUMN down_payment REAL DEFAULT 0').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE stock ADD COLUMN category TEXT').run();
} catch (e) {}

// Seed initial admin if not exists
const adminExists = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'admin');
}

// Seed initial company info if not exists
const companyExists = db.prepare('SELECT * FROM company_info WHERE id = 1').get();
if (!companyExists) {
  db.prepare('INSERT INTO company_info (id, name) VALUES (1, ?)').run('My Company');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      res.json({ id: user.id, username: user.username, role: user.role });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/company', (req, res) => {
    const info = db.prepare('SELECT * FROM company_info WHERE id = 1').get();
    res.json(info);
  });

  app.post('/api/company', (req, res) => {
    const { 
      name, address, logo_url, signature_url, npwp, phone, email, website, 
      signatory_name, signatory_role, bank_name, bank_account_number, bank_account_name 
    } = req.body;
    db.prepare(`
      UPDATE company_info SET 
        name = ?, address = ?, logo_url = ?, signature_url = ?, 
        npwp = ?, phone = ?, email = ?, website = ?, 
        signatory_name = ?, signatory_role = ?,
        bank_name = ?, bank_account_number = ?, bank_account_name = ?
      WHERE id = 1
    `).run(
      name, address, logo_url, signature_url, npwp, phone, email, website, 
      signatory_name, signatory_role, bank_name, bank_account_number, bank_account_name
    );
    res.json({ success: true });
  });

  app.post('/api/change-password', (req, res) => {
    const { userId, newPassword } = req.body;
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
    res.json({ success: true });
  });

  app.get('/api/stock', (req, res) => {
    const stock = db.prepare('SELECT * FROM stock').all();
    res.json(stock);
  });

  app.post('/api/stock', (req, res) => {
    const { name, description, category, unit, quantity, min_stock, price } = req.body;
    db.prepare('INSERT INTO stock (name, description, category, unit, quantity, min_stock, price) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      name, description, category, unit, quantity, min_stock, price
    );
    res.json({ success: true });
  });

  app.put('/api/stock/:id', (req, res) => {
    const { name, description, category, unit, quantity, min_stock, price } = req.body;
    db.prepare(`
      UPDATE stock SET 
        name = ?, description = ?, category = ?, unit = ?, 
        quantity = ?, min_stock = ?, price = ? 
      WHERE id = ?
    `).run(name, description, category, unit, quantity, min_stock, price, req.params.id);
    res.json({ success: true });
  });

  app.put('/api/stock/:id', (req, res) => {
    const { name, description, quantity, price } = req.body;
    db.prepare('UPDATE stock SET name = ?, description = ?, quantity = ?, price = ? WHERE id = ?').run(name, description, quantity, price, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/stock/:id', (req, res) => {
    db.prepare('DELETE FROM stock WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/services', (req, res) => {
    const services = db.prepare('SELECT * FROM services').all();
    res.json(services);
  });

  app.post('/api/services', (req, res) => {
    const { name, description, price } = req.body;
    db.prepare('INSERT INTO services (name, description, price) VALUES (?, ?, ?)').run(name, description, price);
    res.json({ success: true });
  });

  app.put('/api/services/:id', (req, res) => {
    const { name, description, price } = req.body;
    db.prepare('UPDATE services SET name = ?, description = ?, price = ? WHERE id = ?').run(name, description, price, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/services/:id', (req, res) => {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/submissions', (req, res) => {
    const { role, userId } = req.query;
    let submissions;
    if (role === 'admin') {
      submissions = db.prepare(`
        SELECT s.*, u.username as technician_name 
        FROM submissions s 
        JOIN users u ON s.technician_id = u.id
        ORDER BY s.created_at DESC
      `).all();
    } else {
      submissions = db.prepare('SELECT * FROM submissions WHERE technician_id = ? ORDER BY created_at DESC').all(userId);
    }
    res.json(submissions);
  });

  app.get('/api/submissions/:id', (req, res) => {
    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
    const items = db.prepare('SELECT * FROM submission_items WHERE submission_id = ?').all(req.params.id);
    res.json({ ...submission, items });
  });

  app.post('/api/submissions', (req, res) => {
    const { 
      technician_id, type, client_name, client_address, due_date, 
      payment_status, other_costs, other_costs_description, ppn, down_payment, total_amount, items 
    } = req.body;
    
    const info = db.prepare(`
      INSERT INTO submissions (
        technician_id, type, client_name, client_address, due_date, 
        payment_status, other_costs, other_costs_description, ppn, down_payment, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      technician_id, type, client_name, client_address, due_date, 
      payment_status, other_costs || 0, other_costs_description || '', ppn || 0, down_payment || 0, total_amount
    );
    const submissionId = info.lastInsertRowid;

    const insertItem = db.prepare('INSERT INTO submission_items (submission_id, item_name, description, quantity, price, is_from_stock, stock_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE stock SET quantity = quantity - ? WHERE id = ?');

    for (const item of items) {
      insertItem.run(submissionId, item.item_name, item.description, item.quantity, item.price, item.is_from_stock ? 1 : 0, item.stock_id);
      if (item.is_from_stock && item.stock_id) {
        updateStock.run(item.quantity, item.stock_id);
      }
    }

    res.json({ id: submissionId });
  });

  app.patch('/api/submissions/:id/status', (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  app.patch('/api/submissions/:id/payment-status', (req, res) => {
    const { payment_status } = req.body;
    db.prepare('UPDATE submissions SET payment_status = ? WHERE id = ?').run(payment_status, req.params.id);
    res.json({ success: true });
  });

  app.put('/api/submissions/:id', (req, res) => {
    const { 
      client_name, client_address, due_date, payment_status, 
      other_costs, other_costs_description, ppn, down_payment, total_amount, items 
    } = req.body;
    
    db.transaction(() => {
      db.prepare(`
        UPDATE submissions SET 
          client_name = ?, client_address = ?, due_date = ?, 
          payment_status = ?, other_costs = ?, other_costs_description = ?, 
          ppn = ?, down_payment = ?, total_amount = ?
        WHERE id = ?
      `).run(
        client_name, client_address, due_date, payment_status, 
        other_costs, other_costs_description, ppn, down_payment, total_amount, req.params.id
      );

      // Simple approach: delete and re-insert items
      // In production, you'd want to handle stock adjustments carefully
      db.prepare('DELETE FROM submission_items WHERE submission_id = ?').run(req.params.id);
      const insertItem = db.prepare('INSERT INTO submission_items (submission_id, item_name, description, quantity, price, is_from_stock, stock_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const item of items) {
        insertItem.run(req.params.id, item.item_name, item.description, item.quantity, item.price, item.is_from_stock ? 1 : 0, item.stock_id);
      }
    })();
    
    res.json({ success: true });
  });

  app.delete('/api/submissions/:id', (req, res) => {
    db.transaction(() => {
      db.prepare('DELETE FROM submission_items WHERE submission_id = ?').run(req.params.id);
      db.prepare('DELETE FROM submissions WHERE id = ?').run(req.params.id);
    })();
    res.json({ success: true });
  });

  app.get('/api/documents', (req, res) => {
    const docs = db.prepare('SELECT * FROM documents').all();
    res.json(docs);
  });

  app.post('/api/documents', (req, res) => {
    const { name, file_url } = req.body;
    db.prepare('INSERT INTO documents (name, file_url) VALUES (?, ?)').run(name, file_url);
    res.json({ success: true });
  });

  app.delete('/api/documents/:id', (req, res) => {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/technicians', (req, res) => {
    const techs = db.prepare('SELECT id, username FROM users WHERE role = ?').all('technician');
    res.json(techs);
  });

  app.post('/api/technicians', (req, res) => {
    const { username, password } = req.body;
    try {
      db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, 'technician');
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: 'Username already exists' });
    }
  });

  app.delete('/api/technicians/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(req.params.id, 'technician');
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
