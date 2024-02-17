const express = require("express");
require("dotenv").config();
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const { Client } = require("@googlemaps/google-maps-services-js");
const db = require("./dbConnect");

app.use(cors({ origin: "http://127.0.0.1:5500" }));
app.use(bodyParser.json());

const mapClient = new Client({});

const insertStatement = db.prepare(
	"INSERT INTO locations (email, location, lat, lng) VALUES (?, ?, ?, ?)"
);

app.post("/addLocation", async (req, res) => {
	console.log(req.body);
	const { email, location } = req.body;
	try {
		const response = await mapClient.geocode({
			params: {
				address: location,
				key: process.env.GOOGLE_MAPS_API_KEY,
			},
		});

		const lat = response.data.results[0].geometry.location.lat;
		const lng = response.data.results[0].geometry.location.lng;

		insertStatement.run(email, location, lat, lng);

		res.status(200).json({
			lat: lat,
			lng: lng,
		});
	} catch (e) {
		console.error(e);
		res.status(500).json({
			err: e,
		});
	}
});

const deleteStatement = db.prepare(
	"DELETE FROM locations WHERE email = ? AND location = ?"
);

app.post("/deleteLocation", async (req, res) => {
	console.log(req.body);
	try {
		const { email, location } = req.body;
		deleteStatement.run(email, location);
		res.status(200).send();
	} catch (e) {
		console.error(e);
		res.status(500);
	}
});

app.get("/locations", async (req, res) => {
	try {
		const email = req.query.email;
		console.log(email);
		let locations = [];
		await db.each(
			`SELECT location, lat, lng FROM locations where email = '${email}'`,
			(err, row) => {
				console.log(row);
				locations.push(row);
			},
			() => {
				res.status(200).json({
					locations: locations,
				});
			}
		);
	} catch (e) {
		console.error(e);
		res.status(500).json({
			err: e,
		});
	}
});

app.listen(process.env.PORT, () => {
	console.log(`Backend is running on ${process.env.PORT}`);
});
