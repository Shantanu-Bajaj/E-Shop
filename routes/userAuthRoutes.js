import express from "express";
const userAuthRouter = express.Router();
import con from "../db.js";

userAuthRouter.get("/", (req, res) => {
  res.status(200).send({data:{
    user_id: req.decoded.data.user_id,
    name: req.decoded.data.name,
    email: req.decoded.data.email,
    phone: req.decoded.data.phone
  },
  iat: req.decoded.iat,
  exp: req.decoded.exp
});
});

userAuthRouter.get("/allproducts", (req, res) => {
  con.query("SELECT * FROM products", function (err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

userAuthRouter.post("/logout", (req, res) => {
  var sql =
    "DELETE FROM usertoken WHERE email='" + req.decoded.data.email + "'";
  con.query(sql, function (err, results) {
    if (err) throw err;
    res.status(200).send({ message: "success" });
  });
});

export default userAuthRouter;
