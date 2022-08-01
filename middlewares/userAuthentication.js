import jwt from "jsonwebtoken";
import con from "../db.js"

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

  export default userAuthentication;