import dotenv from "dotenv";
import mysql from "mysql";
import express from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import util from "util";
import cors from "cors";

dotenv.config();
const PORT = 8080;
const app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var jsonParser = bodyParser.json();

app.use(cors());

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

const query_new = util.promisify(con.query).bind(con);
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
            password: result[0].password,
            phone: result[0].phone,
          },
        });
      } else res.status(401).send({ err: "Invalid Credentials" });
    });
  } else {
    res.status(400).send({ err: "Enter email or password" });
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

app.post(
  "/admin/removeproduct",
  adminAuthentication,
  urlencodedParser,
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

app.put("/admin/editproduct", adminAuthentication, jsonParser, (req, res) => {
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
            "SELECT * FROM products WHERE prod_id='" + req.query.prod_id + "'";
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
});

app.get("/admin/allusers", adminAuthentication, (req, res) => {
  con.query("SELECT * FROM users", function (err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.get("/admin/allproducts", adminAuthentication, (req, res) => {
  con.query("SELECT * FROM products", function (err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/admin/logout", adminAuthentication, (req, res) => {
  var sql =
    "DELETE FROM admintoken WHERE email='" + req.decoded.data.email + "'";
  con.query(sql, function (err, results) {
    if (err) throw err;
    res.status(200).send({ message: "success" });
  });
});

//USER ROUTES
app.post("/user/register", urlencodedParser, (req, res) => {
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

app.get("/user/login", urlencodedParser, (req, res) => {
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

app.get("/user", userAuthentication, (req, res) => {
  res.send(req.decoded);
});

app.get("/user/allproducts", userAuthentication, (req, res) => {
  con.query("SELECT * FROM products", function (err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.get("/user/cart", userAuthentication, urlencodedParser, (req, res) => {
  var sql = "SELECT * FORM cart WHERE user_id='" +
    req.decoded.data.user_id +
    "'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    if(!result.length) res.status(404).send({ err: "Cart is empty" });
    else{
      res.status(200).send(result);
    }
  });
}); 

app.post(
  "/user/cart/add",
  userAuthentication,
  urlencodedParser,
  jsonParser,
  (req, res) => {
    if (!req.body.options) {
      if (req.body.prod_id) {
        var query =
          "SELECT * FROM products WHERE prod_id='" + req.body.prod_id + "'";
        con.query(query, function (err, result) {
          if (err) throw err;
          if (req.body.prod_quantity > result[0].stock)
            res.status(400).send({ err: "quantity exceeded" });
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
          // console.log(result)
          var options = JSON.parse(result[0].options);
          if (options.hasOwnProperty(req.body.options.prod_color)) {
            if (
              options[req.body.options.prod_color].hasOwnProperty(
                req.body.options.prod_size
              )
            ) {
              if (
                options[req.body.options.prod_color][
                  req.body.options.prod_size
                ]["quantity"] >= req.body.options.prod_quantity
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
  }
);


app.post(
  "/user/cart/remove",
  userAuthentication,
  urlencodedParser,
  jsonParser,
  (req, res) => {
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
  }
);


app.put(
  "/user/cart/update",
  userAuthentication,
  jsonParser,
  urlencodedParser,
  (req, res) => {
    if (req.query.id) {
      var sql =
        "SELECT * FROM cart WHERE id = '" + req.query.id + "'";
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
            var cartsql =
              "SELECT * FROM cart WHERE id='" +
              req.query.id +
              "'";
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
  }
);


app.post(
  "/user/order",
  userAuthentication,
  jsonParser,
  urlencodedParser,
  (req, res) => {
    var addsql =
      "SELECT * FROM useraddresses WHERE user_id = '" +
      req.decoded.data.user_id +
      "'";
    con.query(addsql, function (err, addresult) {
      if (err) throw err;
      var ordersql =
        "INSERT INTO orders (user_id, address_id) VALUES ('" +
        req.decoded.data.user_id +
        "', '" +
        addresult[0].id +
        "')";
      con.query(ordersql, function (err, orderresult) {
        if (err) throw err;
        var oritemsql =
          "SELECT id FROM orders WHERE user_id = '" +
          req.decoded.data.user_id +
          "'";
        con.query(oritemsql, function (err, orderid) {
          if (err) throw err;
          var sql =
            "SELECT * FROM cart WHERE user_id ='" +
            req.decoded.data.user_id +
            "'";
          con.query(sql, function (err, cartresult) {
            if (err) throw err;
            // console.log(cartresult)
            if (!cartresult.length)
              res.status(400).send({ err: "Cart is Empty" });
            else {
              // something(cartresult).then(newSomething);
              for (let i = 0; i < cartresult.length; i++) {
                var sql1 =
                  "SELECT * FROM products WHERE prod_id='" +
                  cartresult[i].prod_id +
                  "'";
                con.query(sql1, function (err, prodresult) {
                  if (err) throw err;
                  // console.log(prodresult);
                  if (!prodresult.length) {
                    // console.log("HELLO");
                    res.status(404).send({ err: "currently unavailable" });
                  } else {
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
                            prodOptions[cartOptions.prod_color][
                              cartOptions.prod_size
                            ]["quantity"] >= cartOptions.prod_quantity
                          ) {
                            var amount =
                              cartOptions.prod_quantity *
                              cartresult[i].prod_price;
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
                            con.query(SQL, function (err, result) {
                              if (err) throw err;
                              var newQuantity =
                                prodOptions[cartOptions.prod_color][
                                  cartOptions.prod_size
                                ]["quantity"] - cartOptions.prod_quantity;
                              prodOptions[cartOptions.prod_color][
                                cartOptions.prod_size
                              ]["quantity"] = newQuantity;
                              // console.log(prodOptions)
                              var prodsql =
                                "UPDATE products SET options='" +
                                JSON.stringify(prodOptions) +
                                "' WHERE prod_id='" +
                                cartresult[i].prod_id +
                                "'";
                              con.query(prodsql, function (err, result) {
                                if (err) throw err;
                              });

                              var cartsql =
                                "DELETE FROM cart WHERE id='" +
                                cartresult[i].id +
                                "'";
                              con.query(cartsql, function (err, result) {
                                if (err) throw err;
                              });
                            });
                          } else {
                            res.status(400).send({ err: "Quantity Exceeded" });
                          }
                        } else {
                          res
                            .status(404)
                            .send({ err: "currently unavailable" });
                        }
                      } else {
                        res.status(404).send({ err: "currently unavailable" });
                      }
                    } else {
                      if (cartresult[i].prod_quantity <= prodresult[0].stock) {
                        var amount =
                          cartresult[i].prod_quantity *
                          cartresult[i].prod_price;
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
                        con.query(SQL, function (err, result) {
                          if (err) throw err;
                          var newQuantity =
                            prodresult[0].stock - cartresult[i].prod_quantity;
                          prodresult[0].stock = newQuantity;
                          // console.log(prodOptions)
                          var prodsql =
                            "UPDATE products SET stock='" +
                            prodresult[0].stock +
                            "' WHERE prod_id='" +
                            cartresult[i].prod_id +
                            "'";
                          con.query(prodsql, function (err, result) {
                            if (err) throw err;
                          });

                          var cartsql =
                            "DELETE FROM cart WHERE id='" +
                            cartresult[i].id +
                            "'";
                          con.query(cartsql, function (err, result) {
                            if (err) throw err;
                          });
                        });
                      } else {
                        res.status(400).send({ err: "Quantity Exceeded" });
                      }
                    }
                  }
                });
              }
            }
          });
        });
      });
    });
    res.status(200).send({ message: "Order placed" });
  }
);

app.get("/user/allorders", userAuthentication, (req, res) => {
  var sql =
    "SELECT * FROM orders WHERE user_id ='" + req.decoded.data.user_id + "'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result);
    if (!result.length) res.status(404).send({ err: "not found" });
    else {
      res.status(200).send({ message: "success", data: result });
    }
  });
});

app.get("/user/address", userAuthentication, (req, res) => {
  var sql =
    "SELECT * FROM useraddresses where user_id='" +
    req.decoded.data.user_id +
    "'";

  // let result = await query_new(sql);
  // console.log(result);
  con.query(sql, function (err, result) {
    if (err) throw err;
    if (!result.length) res.status(404).send({ err: "not found" });
    else {
      res.status(200).send({ message: "success", data: result });
    }
  });
});

app.post(
  "/user/address/add",
  userAuthentication,
  urlencodedParser,
  (req, res) => {
    if (!req.body.street) res.status(400).send({ err: "enter street" });
    else if (!req.body.city) res.status(400).send({ err: "enter city" });
    else if (!req.body.pincode) res.status(400).send({ err: "enter pincode" });
    else if (!req.body.state) res.status(400).send({ err: "enter state" });
    else if (!req.body.country) res.status(400).send({ err: "enter country" });
    else {
      var sql =
        "INSERT INTO useraddresses(user_id, street, city, pincode, state, country) values ('" +
        req.decoded.data.user_id +
        "','" +
        req.body.street +
        "','" +
        req.body.city +
        "','" +
        req.body.pincode +
        "','" +
        req.body.state +
        "','" +
        req.body.country +
        "')";
      con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).send({
          message: "success",
          data: {
            userid: req.decoded.data.user_id,
            street: req.body.street,
            city: req.body.city,
            pincode: req.body.pimcode,
            state: req.body.state,
            country: req.body.country,
          },
        });
      });
    }
  }
);

app.post(
  "/user/address/remove",
  userAuthentication,
  urlencodedParser,
  (req, res) => {
    let add_data = [];
    if (!req.body.id) res.status(400).send({ err: "enter address id" });
    else {
      var sql1 =
        "SELECT id FROM useraddresses where user_id='" +
        req.decoded.data.user_id +
        "' and id='" +
        req.body.id +
        "'";
      con.query(sql1, function (err, result) {
        if (err) throw err;
        if (!result.length) res.status(404).send({ err: "Not found" });
        else {
          var sql2 =
            "SELECT * FROM useraddresses where id ='" +
            req.body.id +
            "' and user_id='" +
            req.decoded.data.user_id +
            "'";
          con.query(sql2, function (err, resultss) {
            if (err) throw err;
            add_data = resultss;
          });
          var sql =
            "DELETE FROM useraddresses where id ='" +
            req.body.id +
            "' and user_id='" +
            req.decoded.data.user_id +
            "'";
          con.query(sql, function (err, results) {
            if (err) throw err;
            res.status(200).send({
              message: "success",
              data: {
                id: add_data[0].id,
                user_id: add_data[0].user_id,
                street: add_data[0].street,
                city: add_data[0].city,
                pincode: add_data[0].pincode,
                state: add_data[0].state,
                country: add_data[0].country,
              },
            });
          });
        }
      });
    }
  }
);

app.put(
  "/user/address/update",
  userAuthentication,
  urlencodedParser,
  (req, res) => {
    for (let i = 0; i < Object.keys(req.body).length; i++) {
      var sql =
        "UPDATE useraddresses SET " +
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
  }
);

app.post("/user/logout", userAuthentication, (req, res) => {
  var sql =
    "DELETE FROM usertoken WHERE email='" + req.decoded.data.email + "'";
  con.query(sql, function (err, results) {
    if (err) throw err;
    res.status(200).send({ message: "success" });
  });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
