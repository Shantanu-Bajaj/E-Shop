import express from "express";
const orderRouter = express.Router();
import con from "../db.js";
import util from "util";
const query = util.promisify(con.query).bind(con);

orderRouter.get("/", (req, res) => {
  var sql =
    "SELECT * FROM cart WHERE user_id='" + req.decoded.data.user_id + "'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    if (!result.length) res.status(404).send({ err: "Cart is empty" });
    else {
      res.status(200).send(result);
    }
  });
});

orderRouter.post("/add", (req, res) => {
  if (!req.body.options) {
    if (req.body.prod_id) {
      var query =
        "SELECT * FROM products WHERE prod_id='" + req.body.prod_id + "'";
      con.query(query, function (err, result) {
        if (err) throw err;
        if (req.body.prod_quantity > result[0].stock)
          res.status(400).send({ err: "quantity exceeded" });
        else {
          var sql =
            "INSERT INTO cart (user_id, prod_id, prod_quantity, prod_price) VALUES ('" +
            req.decoded.data.user_id +
            "','" +
            req.body.prod_id +
            "','" +
            req.body.prod_quantity +
            "','" +
            result[0].price +
            "')";
          con.query(sql, function (err, results) {
            if (err) throw err;
          });
          res.status(200).send({ message: "success" });
        }
      });
    } else {
      res.status(200).send({ err: "enter product id" });
    }
  } else {
    if (req.body.prod_id) {
      var query =
        "SELECT * FROM products WHERE prod_id='" + req.body.prod_id + "'";
      con.query(query, function (err, result) {
        if (err) throw err;
        var options = JSON.parse(result[0].options);
        if (options.hasOwnProperty(req.body.options.prod_color)) {
          if (
            options[req.body.options.prod_color].hasOwnProperty(
              req.body.options.prod_size
            )
          ) {
            if (
              options[req.body.options.prod_color][req.body.options.prod_size][
                "quantity"
              ] >= req.body.options.prod_quantity
            ) {
              var sql =
                "INSERT INTO cart (user_id,prod_id, prod_price, options) VALUES ('" +
                req.decoded.data.user_id +
                "','" +
                req.body.prod_id +
                "','" +
                result[0].price +
                "','" +
                JSON.stringify(req.body.options) +
                "')";
              con.query(sql, function (err, results) {
                if (err) throw err;
                res.status(200).send({ message: "success" });
              });
            } else {
              res.status(400).send({ err: "Quantity Exceeded" });
            }
          } else {
            res.status(404).send({ err: "not found" });
          }
        } else {
          res.status(404).send({ err: "not found" });
        }
      });
    } else {
      res.status(200).send({ err: "enter product id" });
    }
  }
});

orderRouter.post("/remove", (req, res) => {
  let cart_data = [];
  if (!req.body.id) res.status(400).send({ err: "enter cart id" });
  else {
    var sql1 =
      "SELECT id FROM cart where user_id='" +
      req.decoded.data.user_id +
      "' and id='" +
      req.body.id +
      "'";
    con.query(sql1, function (err, result) {
      if (err) throw err;
      if (!result.length) res.status(404).send({ err: "Not found" });
      else {
        var sql2 =
          "SELECT * FROM cart where id ='" +
          req.body.id +
          "' and user_id='" +
          req.decoded.data.user_id +
          "'";
        con.query(sql2, function (err, resultss) {
          if (err) throw err;
          cart_data = resultss;
        });

        var sql =
          "DELETE FROM cart where id ='" +
          req.body.id +
          "' and user_id='" +
          req.decoded.data.user_id +
          "'";
        con.query(sql, function (err, results) {
          if (err) throw err;
          res.status(200).send({
            message: "success",
            data: {
              id: cart_data[0].id,
              user_id: cart_data[0].user_id,
              prod_id: cart_data[0].prod_id,
              prod_quantity: cart_data[0].prod_quantity,
              prod_price: cart_data[0].prod_price,
              options: cart_data[0].options,
            },
          });
        });
      }
    });
  }
});

orderRouter.put("/update", (req, res) => {
  if (req.query.id) {
    var sql = "SELECT * FROM cart WHERE id = '" + req.query.id + "'";
    con.query(sql, function (err, result) {
      if (err) throw err;
      if (!result.length) res.status(404).send({ err: "not found" });
      else {
        if (!req.body.options) {
          for (let i = 0; i < Object.keys(req.body).length; i++) {
            var sql =
              "UPDATE cart SET " +
              Object.keys(req.body)[i] +
              "='" +
              Object.values(req.body)[i] +
              "' WHERE id='" +
              req.query.id +
              "'";
            con.query(sql, function (err, result) {
              if (err) throw err;
              res.status(200).send({ message: "success" });
            });
          }
        } else {
          var cartsql = "SELECT * FROM cart WHERE id='" + req.query.id + "'";
          con.query(cartsql, function (err, cartresult) {
            if (err) throw err;
            var cartOptions = JSON.parse(cartresult[0].options);
            cartOptions = req.body.options;
            var sql =
              "UPDATE cart SET options='" +
              JSON.stringify(cartOptions) +
              "' WHERE id='" +
              req.query.id +
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
    res.status(400).send({ err: "Enter cart id" });
  }
});

orderRouter.post("/order", async (req, res) => {
  var sql =
    "SELECT * FROM cart WHERE user_id ='" + req.decoded.data.user_id + "'";
  let cartresult = await query(sql);
  if (!cartresult.length) res.status(400).send({ err: "Cart is Empty" });
  else {
    var ordersql =
      "INSERT INTO orders (user_id, address_id) VALUES ('" +
      req.decoded.data.user_id +
      "', '" +
      req.query.address_id +
      "')";
    let orderresult = await query(ordersql);
    var oritemssql =
      "SELECT id FROM orders WHERE user_id = '" +
      req.decoded.data.user_id +
      "'";
    let orderid = await query(oritemssql);
    for (let i = 0; i < cartresult.length; i++) {
      var sql1 =
        "SELECT * FROM products WHERE prod_id='" + cartresult[i].prod_id + "'";
      let prodresult = await query(sql1);
      if (!prodresult.length)
        res.status(404).send({ err: "currently unavailable" });
      else {
        if (cartresult[i].options) {
          var prodOptions = JSON.parse(prodresult[0].options);
          var cartOptions = JSON.parse(cartresult[i].options);
          if (prodOptions.hasOwnProperty(cartOptions.prod_color)) {
            if (
              prodOptions[cartOptions.prod_color].hasOwnProperty(
                cartOptions.prod_size
              )
            ) {
              if (
                prodOptions[cartOptions.prod_color][cartOptions.prod_size][
                  "quantity"
                ] >= cartOptions.prod_quantity
              ) {
                var amount =
                  cartOptions.prod_quantity * cartresult[i].prod_price;
                var SQL =
                  "INSERT INTO orderitems(order_id, prod_name, prod_quantity, prod_price, options, total) VALUES('" +
                  orderid[orderid.length - 1].id +
                  "','" +
                  prodresult[0].name +
                  "','" +
                  cartOptions.prod_quantity +
                  "','" +
                  cartresult[i].prod_price +
                  "','" +
                  JSON.stringify(cartOptions) +
                  "','" +
                  amount +
                  "')";
                let orderitemsresult = await query(SQL);
                var newQuantity =
                  prodOptions[cartOptions.prod_color][cartOptions.prod_size][
                    "quantity"
                  ] - cartOptions.prod_quantity;
                prodOptions[cartOptions.prod_color][cartOptions.prod_size][
                  "quantity"
                ] = newQuantity;
                var prodsql =
                  "UPDATE products SET options='" +
                  JSON.stringify(prodOptions) +
                  "' WHERE prod_id='" +
                  cartresult[i].prod_id +
                  "'";
                let productresult = await query(prodsql);

                var cartsql =
                  "DELETE FROM cart WHERE id='" + cartresult[i].id + "'";
                let cartdeleteresult = await query(cartsql);
              } else {
                res.status(400).send({ err: "Quantity Exceeded" });
              }
            } else {
              res.status(404).send({ err: "currently unavailable" });
            }
          } else {
            res.status(404).send({ err: "currently unavailable" });
          }
        } else {
          if (cartresult[i].prod_quantity <= prodresult[0].stock) {
            var amount = cartresult[i].prod_quantity * cartresult[i].prod_price;
            var SQL =
              "INSERT INTO orderitems(order_id, prod_name, prod_quantity, prod_price, total) VALUES('" +
              orderid[orderid.length - 1].id +
              "','" +
              prodresult[0].name +
              "','" +
              cartresult[i].prod_quantity +
              "','" +
              cartresult[i].prod_price +
              "','" +
              amount +
              "')";
            let orderitemsresult = await query(SQL);
            var newQuantity = prodresult[0].stock - cartresult[i].prod_quantity;
            prodresult[0].stock = newQuantity;
            var prodsql =
              "UPDATE products SET stock='" +
              prodresult[0].stock +
              "' WHERE prod_id='" +
              cartresult[i].prod_id +
              "'";
            let updateprodsql = await query(prodsql);

            var cartsql =
              "DELETE FROM cart WHERE id='" + cartresult[i].id + "'";
            let deletecartsql = await query(cartsql);
          } else {
            res.status(400).send({ err: "Quantity Exceeded" });
          }
        }
      }
    }
    let orders = [];
      let lastorder = []
      var sql =
      "SELECT * FROM orders WHERE user_id = '" + req.decoded.data.user_id + "'";
      orders = await query(sql);
      lastorder = orders[orders.length-1]
      let oritemsql =
      "SELECT * FROM orderitems where order_id = '" + lastorder.id + "'";
      let orderitems = await query(oritemsql);
      lastorder["items"] = orderitems
      orderitems.forEach((item) => {
        lastorder["amount"] += item.total;
      });
      
      res.status(200).send({ message: "Order placed", data: lastorder });
  }
});

orderRouter.get("/allorders", async (req, res) => {
  let orders = [];
  var sql =
    "SELECT * FROM orders WHERE user_id ='" + req.decoded.data.user_id + "'";
  orders = await query(sql);
  // if (err) throw err;
  for (let i = 0; i < orders.length; i++) {
    let orsql =
      "SELECT * FROM orderitems where order_id = '" + orders[i].id + "'";
    let order_items = await query(orsql);
    let addsql = "SELECT * FROM useraddresses WHERE id= '" + orders[i].id + "'";
    req.decoded.data.user_id + "'";
    let address = await query(addsql);
    // if (err) throw err;
    orders[i]["items"] = order_items;
    order_items.forEach((item) => {
      orders[i]["amount"] += item.total;
      orders[i]["address"] = address;
    });
  }
  res.status(200).send({ message: "success", data: orders });
});

export default orderRouter;
