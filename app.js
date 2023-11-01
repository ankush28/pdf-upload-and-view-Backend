const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());
app.use("/files", express.static("files"));
//mongodb connection----------------------------------------------
const mongoUrl =
  "mongodb+srv://ankush:ankush@cluster0.xgfrc3e.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));
//multer------------------------------------------------------------
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

require("./pdfDetails");
const PdfSchema = mongoose.model("PdfDetails");
const upload = multer({ storage: storage });

app.post("/upload-files", upload.single("file"), async (req, res) => {
  console.log(req.file);
  const title = req.body.title;
  const fileName = req.file.filename;
  try {
    await PdfSchema.create({ title: title, pdf: fileName });
    res.send({ status: "ok" });
  } catch (error) {
    res.json({ status: error });
  }
});

app.get("/get-files", async (req, res) => {
  try {
    PdfSchema.find({}).then((data) => {
      res.send({ status: "ok", data: data });
    });
  } catch (error) {}
});

app.get('/pdf/:id', async (req, res) => {
  try {
    const pdfId = req.params.id;
    const pdf = await PdfSchema.findById(pdfId);
    console.log(pdf)
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.send(pdf)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving PDF' });
  }
});
app.delete('/pdf/:id', async (req, res) => {
  try {
    console.log()
    const pdfId = req.params.id;
    const deletedPdf = await PdfSchema.findByIdAndDelete(pdfId);

    if (!deletedPdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.status(200).json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting PDF' });
  }
});
//apis----------------------------------------------------------------
app.get("/", async (req, res) => {
  res.send("Success!!!!!!");
});

app.listen(5000, () => {
  console.log("Server Started");
});
