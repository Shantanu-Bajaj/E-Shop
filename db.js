import mysql from "mysql";
import dotenv from "dotenv";
dotenv.config();

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

  export default con;