import express, { Express, Request, Response } from "express";
import fs from 'fs';
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";

const app: Express = express();

app.use(express.json());
app.use(cors());
app.use("/files", express.static("files"));

// MongoDB connection
const mongoUrl = "mongodb://localhost:27017/pdf";

mongoose.connect(mongoUrl)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));


// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage }).array("files");

import PdfDetails from "./pdfDetails";
const PdfSchema = mongoose.model("PdfDetails");

app.post("/upload-files", (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error uploading files.' });
    }
    const uploadedFiles = req.files as Express.Multer.File[];
    
    const uploadedFilePaths = uploadedFiles.map(file => `${file.filename}`);
    const pdfDetail = new PdfDetails({
      title: req.body.title,
      filePath: uploadedFilePaths[0],
    });
    await pdfDetail.save();
    try {
      await Promise.all(uploadedFilePaths.map(async (filePath) => {
        console.log({ filePath });
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }));

      res.json({ success: true, paths: uploadedFilePaths });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error handling files.' });
    }
  });
});

app.get("/get-files", async (req: Request, res: Response) => {
  try {
    const data = await PdfSchema.find({});
    res.send({ status: "ok", data: data });
  } catch (error) {
    res.status(500).send({ error: 'Error fetching files' });
  }
});

app.get('/pdf/:id', async (req: Request, res: Response) => {
  try {
    const pdfId = req.params.id;
    const pdf = await PdfSchema.findById(pdfId);
    console.log(pdf)
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving PDF' });
  }
});

app.delete('/pdf/:id', async (req: Request, res: Response) => {
  try {
    const pdfId = req.params.id;
    const deletedPdf = await PdfSchema.findByIdAndDelete(pdfId);
    if (!deletedPdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    res.status(200).json({ message: 'PDF deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting PDF' });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("Success!!!!!!");
});

app.listen(5000, () => {
  console.log("Server Started");
});
