const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { format } = require("fast-csv");

const app = express();

const PORT = process.env.PORT || 4000;  //if mentioned in .env file the take from there or else default port is 4000
const OUTPUT_DIR = path.join(__dirname, "csv_files");

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

//URLs for API
const API_USERS = "https://jsonplaceholder.typicode.com/users";
const API_POSTS = "https://jsonplaceholder.typicode.com/posts";
const API_COMMENTS = "https://jsonplaceholder.typicode.com/comments";

//Get Request
app.get("/generate-csv", async (req, res) => {
  try {

    //API Calling => users, posts and comments
    const responseUsers = await axios.get(API_USERS).catch((err) => {
      return res.status(err.status).json({ message: "API_USERS request failed", error: err.message });
    });

    const responsePosts = await axios.get(API_POSTS).catch((err) => {
      return res.status(err.status).json({ message: "API_POSTS request failed", error: err.message });
    });

    const responseComments = await axios.get(API_COMMENTS).catch((err) => {
      return res.status(err.status).json({ message: "API_COMMENTS request failed", error: err.message });
    });

    const users = responseUsers.data;
    const posts = responsePosts.data;
    const comments = responseComments.data;

    let data = users.map((item1) => {
      let findDataPosts = posts.find((item2) => item2.id == item1.id);
      let findDataComments = comments.find((item3) => item3.id == item1.id);

      return {
        id: item1.id,
        name: item1.name,
        title: findDataPosts.title,
        body: findDataComments.body,
      };
    });

    // Generate CSV filename with timestamp
    const fileName = `data_${Date.now()}.csv`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    // Write CSV file
    const writeStream = fs.createWriteStream(filePath);
    const csvStream = format({ headers: true });

    csvStream.pipe(writeStream);
    data.forEach((row) => csvStream.write(row));
    csvStream.end();

    writeStream.on("finish", () => {
      res.json({ message: "CSV file created", filePath });
    });

    writeStream.on("error", (err) => {
      console.error("File writing error:", err.message);
      res
        .status(500)
        .json({ message: "Error writing CSV file", error: err.message });
    });

    // res.json(data);
  } catch (err) {
    console.error("Error: ", err);
    res
      .status(500)
      .json({ message: "Error creating CSV file", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
