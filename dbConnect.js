const sqlite3 = require("sqlite3");

db = new sqlite3.Database("./db.db", sqlite3.OPEN_READWRITE, (err) => {
	if (err) {
		console.error(err);
	} else {
		console.log("Connected to DB!!");
	}
});

module.exports = db;
