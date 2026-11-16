
const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    };
}

const connectDB = async () => {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing in environment variables");
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
            })
            .then((mongooseInstance) => {
                console.log(
                    `MongoDB Connected: ${mongooseInstance.connection.host}`
                );

                return mongooseInstance;
            })
            .catch((error) => {
                cached.promise = null;
                console.error("MongoDB Connection Error:", error.message);
                throw error;
            });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        throw error;
    }
};

module.exports = connectDB;
