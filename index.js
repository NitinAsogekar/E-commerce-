import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

var connection = await mysql.createConnection({
    host: "localhost", user: "root", password: "", database: "acme",
});
console.log("Db connection Success");
const JWT_SECRET = "my_super_secret_key_123";

var app = express();
app.use(cors());
app.use(express.json());

function checkLogin(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: true, message: "Please login first" });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: true, message: "Invalid token" });
    }
}

app.post("/signup", async (req, res) => {
    const { username, password, role } = req.body;
    // FIXED: 3 placeholders = 3 values + fixed values in query
    await connection.query("INSERT INTO `user` (username, password, role, is_active, create_date) VALUES (?,?,?, 1, NOW())", [username, password, role || 'customer']);
    res.json({ message: "Signup Successful" });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const [loginresult] = await connection.query("SELECT * FROM `user` WHERE username=? AND password=?", [username, password]);
    if (loginresult.length > 0) {
        const user = loginresult[0];
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Login Successful", token: token, role: user.role });
    } else {
        res.status(401).json({ message: "Login Failed" });
    }
});

app.post("/product/add", checkLogin, async (req, res) => {
    const { name, price, detail } = req.body;
    await connection.query("insert into product(name, price, details, is_active, created_date) values(?,?,?,1,NOW())", [name, price, detail]);
    res.status(201).json({ error: false, message: "Product Upload Success" })
})

app.get("/product/view", async (req, res) => {
    const [SqlResult] = await connection.query("select * from product where is_active=1", [])
    res.status(200).json(SqlResult)
})

app.delete("/product/remove/:pid", checkLogin, async (req,res)=>{
    const {pid} = req.params;
    await connection.query("update product set is_active=0 where pid=?", [pid]);
    res.json({error:false, message:"Deleted"})
})

app.get("/product/:pid", checkLogin, async (req, res) => {
    const { pid } = req.params;
    const [result] = await connection.query("select * from product where pid=?", [pid]);
    res.json(result[0]);
});

app.put("/product/edit/:pid", checkLogin, async (req, res) => {
    const { pid } = req.params;
    const { name, price, detail } = req.body;
    await connection.query("update product set name=?, price=?, details=? where pid=?", [name, price, detail, pid]);
    res.json({ error: false, message: "Product Updated" });
});

app.get("/products", async (req,res)=>{
  const [r] = await connection.query("SELECT * FROM product WHERE is_active=1");
  res.json(r);
});

app.post("/cart/add", checkLogin, async (req,res)=>{
  const { pid } = req.body;
  // FIXED: check if already in cart -> increase qty
  const [exists] = await connection.query("SELECT * FROM cart WHERE customer_id=? AND pid=?", [req.user.id, pid]);
  if(exists.length > 0){
    await connection.query("UPDATE cart SET qty=qty+1 WHERE customer_id=? AND pid=?", [req.user.id, pid]);
  } else {
    await connection.query("INSERT INTO cart(customer_id, pid, qty) VALUES(?,?,?)", [req.user.id, pid, 1]);
  }
  res.json({message:"Added to Cart"});
});

app.get("/cart/view", checkLogin, async (req,res)=>{
  const [r] = await connection.query("SELECT cart.id, cart.qty, product.pid, product.name, product.price, product.details FROM cart JOIN product ON cart.pid=product.pid WHERE cart.customer_id=?", [req.user.id]);
  res.json(r);
});

app.delete("/cart/remove/:id", checkLogin, async (req,res)=>{
  await connection.query("DELETE FROM cart WHERE id=? AND customer_id=?", [req.params.id, req.user.id]);
  res.json({message:"Removed"});
});

app.post("/order/place", checkLogin, async (req,res)=>{
  const [c] = await connection.query("SELECT * FROM cart WHERE customer_id=?", [req.user.id]);
  if(c.length==0) return res.json({message:"Cart empty"});
  for(let i of c) await connection.query("INSERT INTO orders(customer_id,pid,qty,order_date) VALUES(?,?,?,NOW())", [req.user.id,i.pid,i.qty]);
  await connection.query("DELETE FROM cart WHERE customer_id=?", [req.user.id]);
  res.json({message:"Order Placed Successfully"});
});

app.listen(3000, () => {
    console.log("Server is waiting for requests on 3000...");
});