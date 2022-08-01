import express from "express";
const adminAuthRouter = express.Router();
import con from "../db.js";

adminAuthRouter.get("/", (req, res) => {
  res.status(200).send({data:{
    admin_id: req.decoded.data.adminid,
    name: req.decoded.data.name,
    email: req.decoded.data.email,
    phone: req.decoded.data.phone
  },
  iat: req.decoded.iat,
  exp: req.decoded.exp
});
});

adminAuthRouter.get("/allusers", (req, res) => {
  con.query("SELECT user_id, name, email, phone FROM users", function (err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

adminAuthRouter.post("/logout", (req, res) => {
  var sql =
    "DELETE FROM admintoken WHERE email='" + req.decoded.data.email + "'";
  con.query(sql, function (err, results) {
    if (err) throw err;
    res.status(200).send({ message: "success" });
  });
});

export default adminAuthRouter;
