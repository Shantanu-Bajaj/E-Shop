import dotenv from "dotenv";
import mysql from "mysql";
import express from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import bodyParser from "body-parser";

dotenv.config();
const PORT = 8080;
const app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var jsonParser = bodyParser.json();

var con = mysql.createConnection({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  database: process.env.database,
  password: process.env.password,
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected");
});

//ADMIN AUTHENTICATION MIDDLEWARE
const adminAuthentication = function (req, res, next) {
  if (!req.headers.hasOwnProperty("authorization")) {
    // res.status(401).send({err:"There was some error"});
    res.status(401).send({ err: "Please login first" });
  }
  let adminToken = req.headers.authorization;
  adminToken = adminToken.split(" ")[1];
  var sql = "SELECT token FROM admintoken where token='" + adminToken + "'";
  con.query(sql, function (err, result) {
    if (result.length)
      // console.log(result);
      jwt.verify(adminToken, process.env.ADMIN_SECRET_KEY, (err, decoded) => {
        if (err) res.status(401).send({ error: "Unauthorized" });
        req.decoded = decoded;
      });
    else res.status(401).send({ error: "Please Login First" });
    next();
  });
};

//USER AUTHENTICATION MIDDLEWARE
const userAuthentication = function (req, res, next) {
  if (!req.headers.hasOwnProperty("authorization")) {
    // res.status(401).send({err:"There was some error"});
    res.status(401).send({ err: "Please login first" });
  }
  let userToken = req.headers.authorization;
  userToken = userToken.split(" ")[1];
  var sql = "SELECT token FROM usertoken where token='" + userToken + "'";
  con.query(sql, function (err, result) {
    if (result.length)
      // console.log(result);
      jwt.verify(userToken, process.env.USER_SECRET_KEY, (err, decoded) => {
        if (err) res.status(401).send({ error: "Unauthorized" });
        req.decoded = decoded;
      });
    else res.status(401).send({ error: "Please Login First" });
    next();
  });
};


//ADMIN ROUTES
app.get("/admin/login", urlencodedParser, (req, res) => {
  if (req.body.email && req.body.password) {
    var sql ="SELECT * FROM admins WHERE email = '" +req.body.email +"' AND password = '" +req.body.password +"'";
    con.query(sql, function (err, result) {
      if (err) throw err;
      if (result.length) {
        let adminToken = jwt.sign({ data: result[0] },process.env.ADMIN_SECRET_KEY,{ expiresIn: 604800 });
        var sql1 ="INSERT INTO admintoken (email, token) values ('" +req.body.email +"', '" +adminToken +"')";
        con.query(sql1, function (err, result) {
          if (err) throw err;
        });
        res.send({message: "success",
          token: adminToken,
          data: {
            adminid: result[0].admin_id,
            name: result[0].name,
            email: result[0].email,
            password: result[0].password,
            phone: result[0].phone,
          },
        });
      } else res.status(401).send({ err: "Invalid Credentials" });
    });
  } else {
    res.status(204).send({ err: "Enter email or password" });
  }
});

app.get("/admin/", adminAuthentication, (req, res) => {
  res.send(req.decoded);
});

app.post("/admin/addproduct", adminAuthentication, jsonParser, (req, res) => {
  var sql =
    "INSERT INTO products (name,category,description,price,quantity,unit,stock,options) values('" +
    req.body.name +
    "', '" +
    req.body.category +
    "', '" +
    req.body.description +
    "','" +
    req.body.price +
    "','" +
    req.body.quantity +
    "','" +
    req.body.unit +
    "','" +
    req.body.stock +
    "','" +
    JSON.stringify(req.body.options) +
    "')";
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.status(200).send({ message: "success" });
  });
});

app.post("/admin/removeproduct",adminAuthentication,urlencodedParser,(req, res) => {
  let data = [];
  if (!req.body.prod_id) res.status(400).send({ err: "enter product id" });
  else {
    var sqll ="SELECT prod_id FROM products WHERE prod_id='" + req.body.prod_id + "'";
    con.query(sqll, function (err, result) {
      if (err) throw err;
      if (!result.length) res.status(404).send({ err: "Not found" });
      else {
        var SQL ="SELECT * FROM products where prod_id='" + req.body.prod_id + "'";
        con.query(SQL, function (err, results) {
          if (err) throw err;
          data = results;
        });
        var sql ="DELETE FROM products where prod_id='" + req.body.prod_id + "'";
        con.query(sql, function (err, results) {
          if (err) throw err;
          res.status(200).send({
            message: "success",
            data: {
              prod_id: data[0].prod_id,
              name: data[0].name,
              category: data[0].category,
              description: data[0].description,
              price: data[0].price,
              quantity: data[0].quantity,
              unit: data[0].unit,
              stock: data[0].stock,
              options: data[0].options,
            },
          });
        });
      }
    });
  }}
);

app.get("/admin/allusers", adminAuthentication, (req, res) => {
  con.query("SELECT * FROM users", function (err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
}); 


