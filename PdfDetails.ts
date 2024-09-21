import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the PdfDetails document
interface IPdfDetails extends Document {
    title: string;
    filePath: string;
    // Add any other fields you need
}

// Define the PdfDetails schema
const PdfDetailsSchema: Schema = new Schema({
    title: { type: String, required: true },
    filePath: { type: String, required: true },
    // Add any other fields you need
});

// Register the model with Mongoose
const PdfDetails = mongoose.model<IPdfDetails>("PdfDetails", PdfDetailsSchema);

export default PdfDetails;
