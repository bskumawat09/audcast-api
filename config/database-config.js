const mongoose = require("mongoose");

function connectDB() {
    const DB_URL = process.env.DB_URL;

    mongoose
        .connect(DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .catch((error) => console.log(error));

    const db = mongoose.connection;

    db.on("error", console.error.bind(console, "connection error:"));
    db.once("open", () => {
        if (process.env.NODE_ENV === "developement") {
            console.log(`Database connected to ${DB_URL}`);
        } else {
            console.log("Database connected");
        }
    });
}

module.exports = connectDB;
