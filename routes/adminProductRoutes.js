import express from "express";
const adminProductRouter = express.Router();
import con from "../db.js"

adminProductRouter.post(
  "/add",
  (req, res) => {
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
  }
);

adminProductRouter.post(
  "/remove",
  (req, res) => {
    let data = [];
    if (!req.body.prod_id) res.status(400).send({ err: "enter product id" });
    else {
      var sqll =
        "SELECT prod_id FROM products WHERE prod_id='" + req.body.prod_id + "'";
      con.query(sqll, function (err, result) {
        if (err) throw err;
        if (!result.length) res.status(404).send({ err: "Not found" });
        else {
          var SQL =
            "SELECT * FROM products where prod_id='" + req.body.prod_id + "'";
          con.query(SQL, function (err, results) {
            if (err) throw err;
            data = results;
          });
          var sql =
            "DELETE FROM products where prod_id='" + req.body.prod_id + "'";
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
    }
  }
);

adminProductRouter.put(
  "/edit",
  (req, res) => {
    if (req.query.prod_id) {
      var sql =
        "SELECT * FROM products WHERE prod_id = '" + req.query.prod_id + "'";
      con.query(sql, function (err, result) {
        if (err) throw err;
        if (!result.length) res.status(404).send({ err: "not found" });
        else {
          if (!req.body.options) {
            for (let i = 0; i < Object.keys(req.body).length; i++) {
              var sql =
                "UPDATE products SET " +
                Object.keys(req.body)[i] +
                "='" +
                Object.values(req.body)[i] +
                "' WHERE prod_id='" +
                req.query.prod_id +
                "'";
              con.query(sql, function (err, result) {
                if (err) throw err;
                res.status(200).send({ message: "success" });
              });
            }
          } else {
            var prodsql =
              "SELECT * FROM products WHERE prod_id='" +
              req.query.prod_id +
              "'";
            con.query(prodsql, function (err, prodresult) {
              if (err) throw err;
              var prodOptions = JSON.parse(prodresult[0].options);
              prodOptions = req.body.options;
              var sql =
                "UPDATE products SET options='" +
                JSON.stringify(prodOptions) +
                "' WHERE prod_id='" +
                req.query.prod_id +
                "'";
              con.query(sql, function (err, result) {
                if (err) throw err;
                res.status(200).send({ message: "success" });
              });
            });
          }
        }
      });
    } else {
      res.status(400).send({ err: "Enter product id" });
    }
  }
);

adminProductRouter.get(
  "/all",
  (req, res) => {
    con.query("SELECT * FROM products", function (err, result, fields) {
      if (err) throw err;
      res.send(result);
    });
  }
);

export default adminProductRouter;
