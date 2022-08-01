import jwt from "jsonwebtoken";
import con from "../db.js"
import express from "express";
import dotenv from "dotenv";

const openRouter = express.Router();
dotenv.config();


openRouter.post("/user/register", (req, res) => {
  var sqll = "SELECT email FROM users WHERE email='" + req.body.email + "'";
  con.query(sqll, function (err, result) {
    if (err) throw err;
    if (!result.length) {
      if (req.body.password.length < 6) {
        res
          .status(401)
          .send({ err: "Password length should be at least 6 characters" });
      } else {
        var sql =
          "INSERT INTO users (name, email, password, phone) VALUES ('" +
          req.body.name +
          "','" +
          req.body.email +
          "','" +
          req.body.password +
          "','" +
          req.body.phone +
          "')";
        con.query(sql, function (err, results) {
          if (err) throw err;
          res.status(200).send({
            message: "success",
            data: {
              name: req.body.name,
              email: req.body.email,
              password: req.body.password,
              phone: req.body.phone,
            },
          });
        });
      }
    } else {
      res.status(401).send({ err: "Email already exists" });
    }
  });
});

openRouter.get("/user/login", (req, res) => {
  if (req.body.email && req.body.password) {
    var sql =
      "SELECT * FROM users WHERE email = '" +
      req.body.email +
      "' AND password = '" +
      req.body.password +
      "'";
    con.query(sql, function (err, result) {
      if (err) throw err;
      if (result.length) {
        let userToken = jwt.sign(
          { data: result[0] },
          process.env.USER_SECRET_KEY,
          { expiresIn: 604800 }
        );
        var sql1 =
          "INSERT INTO usertoken (email, token) values ('" +
          req.body.email +
          "', '" +
          userToken +
          "')";
        con.query(sql1, function (err, result) {
          if (err) throw err;
        });
        res.send({
          message: "success",
          token: userToken,
          data: {
            userid: result[0].userid,
            name: result[0].name,
            email: result[0].email,
            phone: result[0].phone,
          },
        });
      } else res.status(401).send({ err: "Invalid Credentials" });
    });
  } else {
    res.status(204).send({ err: "Enter email or password" });
  }
});

openRouter.get("/admin/login", (req, res) => {
  if (req.body.email && req.body.password) {
    var sql =
      "SELECT * FROM admins WHERE email = '" +
      req.body.email +
      "' AND password = '" +
      req.body.password +
      "'";
    con.query(sql, function (err, result) {
      if (err) throw err;
      if (result.length) {
        let adminToken = jwt.sign(
          { data: result[0] },
          process.env.ADMIN_SECRET_KEY,
          { expiresIn: 604800 }
        );
        var sql1 =
          "INSERT INTO admintoken (email, token) values ('" +
          req.body.email +
          "', '" +
          adminToken +
          "')";
        con.query(sql1, function (err, result) {
          if (err) throw err;
        });
        res.send({
          message: "success",
          token: adminToken,
          data: {
            adminid: result[0].admin_id,
            name: result[0].name,
            email: result[0].email,
            phone: result[0].phone,
          },
        });
      } else res.status(401).send({ err: "Invalid Credentials" });
    });
  } else {
    res.status(400).send({ err: "Enter email or password" });
  }
});

export default openRouter;