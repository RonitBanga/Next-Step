const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const mysql = require("mysql");
const db = require("./public/list"); //?importing the static database
const createItem = require("./public/Create");
const database = require("./public/database"); //? connecting database
// const auth = require("./public/authentication"); //? authentication
const prevent = require("./public/prevent");
const hashIt = require("./public/hashit");
const alertIt = require("./public/alert");

const auth = {
  id: "",
  username: "",
  authenticated: false,
};

//*initializing app
app = express();

//*additional usage regarding app
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

//*connecting with database
// const conn = database("byrnbofcdwa2cgouqo28");
// const conn = database("project");
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root', /* MySQL User */
  password: '', /* MySQL Password */
  database: 'project' /* MySQL Database */
});

//? ****** Home Route ******
app.get("/", (req, res) => {
  if (auth.authenticated) {
    let query = `Select * FROM \`${auth.username}\``;
    conn.query(query, (err, rows) => {
      if (err) console.log(err);

      res.render("index", {
        list: rows,
        authenticated: auth.authenticated,
      });
    });
  } else {
    res.render("index", { list: db, authenticated: auth.authenticated });
  }
});

//? *********** Login Get Route *************
app.get("/login", (req, res) => {
  res.render("login", { err: "" });
});

//? *********** Login POST Route *************
app.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  username = prevent(username);
  password = hashIt(prevent(password));
  let query = `SELECT * FROM users WHERE username='${username}' && password='${password}'`;
  conn.query(query, (err, result) => {
    if (err) {
      res.render("login", { err: "Invalid Credentials!" });
    } else if (result.length == 0)
      res.render("login", { err: "Invalid Credentials!" });
    else {
      auth.authenticated = true;
      auth.username = username;
      auth.id = result[0].id;
      res.redirect("/");
    }
  });
});

//? *********** Register Get Route *************
app.get("/register", (req, res) => {
  res.render("register", { err: "", color: "" });
});

//? *********** Register Post Route *************
app.post("/register", (req, res) => {
  let username = req.body.username;
  let password = hashIt(req.body.password);
    console.log(username);
    console.log(password);
  let q1 = `SELECT id FROM users WHERE username='${username}'`;
  conn.query(q1, (err, result) => {
    if (err) res.render("register", { err: "User Already Exist" });
    else {
      if (result.length != 0) {
        // console.log(result)
        res.render("register", { err: "User Already Exist" });
      } else {
        let data = { username: username, password: password };
        let query = "INSERT INTO users SET ?";
        conn.query(query, data, (err, result) => {
          if (err) console.log(err);
          else {
            let q2 = `CREATE TABLE project.\`${username}\` (Id INT(255) NOT NULL AUTO_INCREMENT , Description VARCHAR(255) NOT NULL , Assigned_On VARCHAR(255) NOT NULL , Deadline VARCHAR(255) NOT NULL ,Status BOOLEAN NOT NULL,PRIMARY KEY (Id) )`;
            conn.query(q2, (err, result) => {
              if (err) throw err;
              console.log(username + " Table Created");
            });
            alertIt(
              "Registered Successfuly.. will be redirected to login page",
              201
            );
            res.redirect("/login");
          }
        });
      }
    }
  });
});

//? ***************** Post Route for Adding items **************
app.post("/item", (req, res) => {
  const desc = req.body.desc;
  const deadline = req.body.deadline;

  if (auth.authenticated) {
    let username = auth.username;
    console.log(desc);
    let data = createItem(desc, deadline, null);
    let query = `INSERT INTO \`${username}\` SET ?`;
    conn.query(query, data, (err, result) => {
      if (err) throw err;
      else console.log("Inserted One row");
    });
  } else {
    const item = createItem(desc, deadline, db);
    db.push(item);
  }
  res.redirect("/");
});

//? ********************** Get Route to open Add Page  *************
app.get("/item", (req, res) => {
  res.render("add", { authenticated: auth.authenticated });
});

//? ********************** LogOut Route *************
app.get("/logout", (req, res) => {
  auth.authenticated = false;
  auth.username = "";
  res.redirect("/");
});

//? ********************** Delete Route *************
app.get("/delete/:id", (req, res) => {
  let id = req.params.id;
  if (auth.authenticated) {
    let query = `DELETE FROM \`${auth.username}\` WHERE Id=${id}`;
    conn.query(query, (err, res) => {
      if (err) console.log(err);
      else {
        console.log("Row Deleted");
      }
    });
  } else {
    for (var i = 0; i < db.length; i++) {
      if (db[i].Id == req.params.id) {
        db.splice(i, 1);
        break;
      }
    }
  }
  res.redirect("/");
});

//? ***************** Get Route For Edit ****************/
app.get("/edit/:id", (req, res) => {
  let desc = "";
  let deadline = "";
  let id = req.params.id;
  if (auth.authenticated) {
    let query = `SELECT * FROM \`${auth.username}\` WHERE Id=${id}`;
    conn.query(query, (err, rows) => {
      if (err) throw err;
      else {
        desc = rows[0].Description;
        deadline = rows[0].Deadline;
        res.render("edit", {
          description: desc,
          id: req.params.id,
          deadline: deadline,
          authenticated: auth.authenticated,
        });
      }
    });
  } else {
    for (var i = 0; i < db.length; i++) {
      if (db[i].Id == req.params.id) {
        desc = db[i].Description;
        deadline = db[i].Deadline;
        break;
      }
    }
    res.render("edit", {
      description: desc,
      id: req.params.id,
      deadline: deadline,
      authenticated: auth.authenticated,
    });
  }
});

//? ***************** Post Route For Edit ****************/
app.post("/edit/:id", (req, res) => {
  const desc = req.body.desc;
  const deadline = req.body.deadline;

  if (auth.authenticated) {
    let query = `UPDATE \`${auth.username}\` SET Description='${desc}',Deadline='${deadline}' WHERE Id=${req.params.id}`;
    conn.query(query, (err, rows) => {
      if (err) throw err;
    });
    res.redirect("/");
  } else {
    for (var i = 0; i < db.length; i++) {
      if (db[i].Id == req.params.id) {
        if (desc != db[i].Description) db[i].Description = desc;
        if (deadline != db[i].Deadline) db[i].Deadline = deadline;
      }
    }
  }
  res.redirect("/");
});

//? ****************8 Status Route **************************
app.get("/status/:id", (req, res) => {
  let id = req.params.id;
  if (auth.authenticated) {
    let newStatus = false;
    let query = `SELECT * FROM \`${auth.username}\` WHERE Id=${id}`;
    conn.query(query, (err, rows) => {
      if (err) throw err;
      else {
        newStatus = !rows[0].Status;
        let q2 = `UPDATE \`${auth.username}\` SET Status=${newStatus} WHERE Id=${req.params.id}`;
        conn.query(q2, (err, rows) => {
          if (err) console.log(err);
          console.log("Status Updated");
        });
      }
    });
  } else {
    for (var i = 0; i < db.length; i++) {
      if (db[i].Id == id) {
        db[i].Status = !db[i].Status;
      }
    }
  }
  res.redirect("/");
});

//?listening on port number 5020
app.listen(5020, () => {
  console.log("Runnning on => " + `http://localhost:5020/`);
});
