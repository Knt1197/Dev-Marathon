const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = 5228;

app.use(cors({
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
// ---------------------------------

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: "db",
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

// --- APIエンドポイント定義 ---
app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.get("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customerData = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [id]);
    if (customerData.rows.length > 0) {
      res.send(customerData.rows[0]);
    } else {
      res.status(404).send("Customer not found");
    }
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.post("/add-customer", async (req, res) => {
  try {
    const { companyName, industry, contact, location } = req.body;

    // Basic validation
    if (!companyName || !industry || !contact || !location) {
      return res.status(400).json({ success: false, message: 'すべてのフィールドを入力してください。' });
    }

    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [companyName, industry, contact, location]
    );
    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // unique_violation for contact
      return res.status(400).json({ success: false, message: 'この連絡先は既に使用されています。' });
    }
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
  }
});

app.delete("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM customers WHERE customer_id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.put("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, industry, contact, location } = req.body;
    const updatedCustomer = await pool.query(
      "UPDATE customers SET company_name = $1, industry = $2, contact = $3, location = $4, updated_date = CURRENT_TIMESTAMP WHERE customer_id = $5 RETURNING *",
      [company_name, industry, contact, location, id]
    );
    if (updatedCustomer.rows.length > 0) {
      res.json({ success: true, customer: updatedCustomer.rows[0] });
    } else {
      res.status(404).json({ success: false, message: "Customer not found" });
    }
  } catch (err) {
    console.error(err);
    // より具体的なエラーメッセージを返す
    if (err.code === '23505') { // unique_violation
        return res.status(400).json({ success: false, message: 'この連絡先は既に使用されています。' });
    }
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
  }
});

// --- サーバー起動 ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});