const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// MongoDB Connection
mongoose.connect("mongodb+srv://poll_game:921182@cluster0.3eckf.mongodb.net/for_Students", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema for Student Data
const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  grade: String,
  parentContact: String,
  courseCodes: [String],
  enrollmentNo: String, // Added enrollmentNo field
  fatherName: String,    // Added fatherName field
  session: String,       // Added session field
});

const Student = mongoose.model("Student", studentSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Access Control Middleware
const mainUser = { username: "Hey_Google", password: "Bye_Google" }; // Change accordingly
let loggedIn = false;

app.get("/", (req, res) => {
  if (loggedIn) {
    res.render("index");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === mainUser.username && password === mainUser.password) {
    loggedIn = true;
    res.redirect("/");
  } else {
    res.send("Unauthorized Access");
  }
});

app.post("/submit", async (req, res) => {
  const { name, age, grade, parentContact, courseCodes, enrollmentNo, fatherName, session } = req.body;
  const newStudent = new Student({
    name,
    age,
    grade,
    parentContact,
    courseCodes,  // Ensure this is correctly passed
    enrollmentNo, // Ensure this is passed
    fatherName,   // Ensure this is passed
    session,      // Ensure this is passed
  });
  await newStudent.save();
  res.redirect("/");
});

app.get("/print", async (req, res) => {
  try {
    const students = await Student.find();
    if (!students.length) {
      return res.render("print", { students: [] }); // If no students, pass an empty array
    }
    res.render("print", { students });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

const PDFDocument = require("pdfkit");

app.get("/download-pdf/:studentId", async (req, res) => {
  const student = await Student.findById(req.params.studentId);

  if (!student) {
    return res.send("Student not found");
  }

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${student.name}_details.pdf"`);

  doc.pipe(res);

  // Add logo at the top-center
  const pageWidth = doc.page.width; // Get the page width
  const imageWidth = 200; // Image width
  const imageX = (pageWidth - imageWidth) / 2; // Center the image horizontally

  doc.image("logo.jpeg", imageX, 0, { width: imageWidth }); // Place image at 50px from top

  // Add text immediately below the image
  doc.moveDown(3); // Minimal space between image and text
  doc.fontSize(10).text("INDIRA GANDHI STUDY CENTER 1007, PT.J.L.N. GOVT COLLEGE, SECTOR 16-A FARIDABAD", { align: "center" });

  // Add student details
  doc.moveDown(1.5); // Space before student details
  doc.fontSize(10).text(`Enrollment No: ${student.enrollmentNo || "N/A"}`, 50, 150);
  doc.text(`Student Name: ${student.name}`, 50, 170);
  doc.text(`Father Name: ${student.fatherName || "N/A"}`, 50, 190);
  doc.text(`Contact No: ${student.parentContact || "N/A"}`, 50, 210);
  doc.text(`Session: ${student.session || "N/A"}`, 350, 150);
  doc.text(`Class: ${student.grade || "N/A"}`, 350, 170);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 350, 190);

  // Course Codes Section
  doc.moveDown(1.5);
  doc.fontSize(12).text(`Course Code: ${student.course || "N/A"}`, { align: "left" });

  const courseCodes = student.courseCodes || [
    "BEGE-101", "BEGE-102", "BEGE-103", "BEGE-104", "BEGE-105",
    "BEGE-106", "BEGE-107", "BEGE-108", "BEGE-109", "BEGE-110"
  ]; // Default codes if not provided

  let y = 240;
  courseCodes.forEach((code, index) => {
    const x = index < 5 ? 50 : 300;
    y = index < 5 ? 240 + index * 20 : 240 + (index - 5) * 20;
    doc.text(`Code${index + 1}: ${code}`, x, y);
  });

  // Add signature section
  doc.moveDown(2);
  doc.fontSize(10).text("Authorized Signatory", 400, y + 40);

  doc.end();
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
