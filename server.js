import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Supabase Admin Client (using service role key for backend operations)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // --- API Routes ---

  // Get all products with categories
  app.get("/api/products", async (req, res) => {
    const { supplierid } = req.query;
    let query = supabase
      .from("product")
      .select(`
        *,
        category:category(categoryname)
      `);
    
    if (supplierid) {
      query = query.eq("supplierid", supplierid);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    const { data, error } = await supabase.from("category").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Admin: Create Product
  app.post("/api/products", async (req, res) => {
    const { productname, reorderlevel, unitprice, categoryid } = req.body;
    const { data, error } = await supabase
      .from("product")
      .insert([{ productname, reorderlevel, unitprice, categoryid }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  // Admin: Update Product
  app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase
      .from("product")
      .update(updates)
      .eq("productid", id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  // Admin: Delete Product
  app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from("product").delete().eq("productid", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Inventory: Get stock levels
  app.get("/api/inventory", async (req, res) => {
    const { warehouseid } = req.query;
    let query = supabase
      .from("stored_in")
      .select(`
        *,
        product:product(productname),
        warehouse:warehouse(location)
      `);
    
    if (warehouseid) {
      query = query.eq("warehouseid", warehouseid);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Orders: Get Sales Orders
  app.get("/api/sales", async (req, res) => {
    const { customerid } = req.query;
    let query = supabase
      .from("sales_order")
      .select(`
        *,
        customer:customer(customername),
        employee:employee(empname)
      `)
      .order('so_date', { ascending: false });
    
    if (customerid) {
      query = query.eq("customerid", customerid);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Customer: Create Sales Order (Purchase)
  app.post("/api/sales", async (req, res) => {
    const { customerid, empid, totalamount, items } = req.body;
    
    // 1. Create the Sales Order
    const { data: order, error: orderError } = await supabase
      .from("sales_order")
      .insert([{ 
        customerid, 
        empid: empid || 3, // Default employee if not provided
        totalamount, 
        status: 'Pending',
        so_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (orderError) return res.status(500).json({ error: orderError.message });

    // 2. Create Sales Items
    const salesItems = items.map((item, index) => ({
      so_id: order.so_id,
      lineno: index + 1,
      productid: item.productid,
      quantity: item.quantity,
      unitprice: item.unitprice
    }));

    const { error: itemsError } = await supabase
      .from("sales_item")
      .insert(salesItems);

    if (itemsError) return res.status(500).json({ error: itemsError.message });

    res.json(order);
  });

  // Admin/Manager: Update Order Status
  app.patch("/api/sales/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase
      .from("sales_order")
      .update({ status })
      .eq("so_id", id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  // --- Suppliers API ---
  app.get("/api/suppliers", async (req, res) => {
    const { data, error } = await supabase.from("supplier").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/suppliers", async (req, res) => {
    const { suppliername, contactname, phone, email, address } = req.body;
    const { data, error } = await supabase
      .from("supplier")
      .insert([{ suppliername, contactname, phone, email, address }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase
      .from("supplier")
      .update(updates)
      .eq("supplierid", id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from("supplier").delete().eq("supplierid", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // --- Users API (Admin Only) ---
  app.get("/api/users", async (req, res) => {
    const role = req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order('display_name', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.patch("/api/users/:id/role", async (req, res) => {
    const roleHeader = req.headers['x-user-role'];
    if (roleHeader !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { role } = req.body;
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  // Profiles: Get user profile
  app.get("/api/profile/:id", async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
