const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { format } = require("fast-csv");

const app = express();

const PORT = process.env.PORT || 4000;
const OUTPUT_DIR = path.join(__dirname, "csv_files");

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const items = ["item1", "item2", "item3"];

// const API_USERS = "https://jsonplaceholder.typicode.com/users";
const API_USERS = "https://activity1.stoxbox.in:9010/stxauth/authentication";

const API_POSTS = "https://jsonplaceholder.typicode.com/posts";
const API_COMMENTS = "https://jsonplaceholder.typicode.com/comments";

app.get("/generate-csv", async (req, res) => {
  try {

    // const [apiCallUsers, apiCallPosts, apiCallComments] = Promise.all([
    //     axios.get(API_USERS),
    //     axios.get(API_POSTS),
    //     axios.get(API_COMMENTS)
    // ])

    const responseUsers = await axios.get(API_USERS);
    const responsePosts = await axios.get(API_POSTS);
    const responseComments = await axios.get(API_COMMENTS);

    // const responseUsers = await apiCallUsers;
    // const responsePosts = await apiCallPosts;
    // const responseComments = await apiCallComments;

    if(responseUsers.status !== 200) {
        return res.status(responseUsers.status).json({ message: "API request(s) failed", errors: failedRequests });
    }

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
        res.status(500).json({ message: "Error writing CSV file", error: err.message });
    });

    // res.json(data);
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).json({ message: "Error creating CSV file", error: err.message})
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
