import express from "express";
const addressRouter = express.Router();
import con from "../db.js"

addressRouter.get("/", (req, res) => {
  var sql =
    "SELECT * FROM useraddresses where user_id='" +
    req.decoded.data.user_id +
    "'";

  // let result = await query_new(sql);
  // console.log(result);
  con.query(sql, function (err, result) {
    if (err) throw err;
    if (!result.length) res.status(404).send("[]");
    else {
      res.status(200).send({ message: "success", data: result });
    }
  });
});

addressRouter.post(
  "/add",
  (req, res) => {
    if (!req.body.line_1) res.status(400).send({ err: "enter line 1" });
    else if (!req.body.city) res.status(400).send({ err: "enter city" });
    else if (!req.body.pincode) res.status(400).send({ err: "enter pincode" });
    else if (!req.body.state) res.status(400).send({ err: "enter state" });
    else if (!req.body.country) res.status(400).send({ err: "enter country" });
    else {
      var sql =
        "INSERT INTO useraddresses(user_id, line_1, line_2, city, pincode, state, country) values ('" +
        req.decoded.data.user_id +
        "','" +
        req.body.line_1 + 
        "','" +
        req.body.line_2 +
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
            line_1: req.body.line_1,
            line_2: req.body.line_2,
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

addressRouter.post(
  "/remove",
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
                line_1: add_data[0].line_1,
                line_2: add_data[0].line_2,
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

addressRouter.put(
  "/update",
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

export default addressRouter;
