# 🚀 MarkSheet Digitizer – AI-Powered Mark Entry Automation  

Welcome to the **MarkSheet Digitizer**, a modern web application designed to **automate the digitization of student mark sheets** using AI-powered OCR.  
This repository contains multiple components, each serving a unique purpose in the digitization workflow.  

---

## 📂 Project Structure  

### 1️⃣ Authentication Module 🔑  
- Provides **secure login** for educators with predefined credentials.  
- Ensures only authorized users can access the system.  

---

### 2️⃣ Image Handling Module 🖼️  
- Supports **file uploads** and **live camera capture** for mark sheets.  
- Accepts scanned images and photos for flexible input.  

---

### 3️⃣ AI Processing Module 🤖  
- Uses **Google Gemini (via Genkit)** for OCR and intelligent data extraction.  
- Accurately identifies **student roll numbers, question-wise marks, and totals**.  

---

### 4️⃣ Verification Module ✅  
- Displays extracted data in an **editable review table**.  
- Users can quickly correct OCR errors before finalizing results.  

---

### 5️⃣ Data Management Module 📊  
- Consolidates verified marks into structured tables.  
- Uses **Local Storage** to retain session data between logins.  

---

### 6️⃣ Export Module 📂  
- Allows one-click export to **Excel files**.  
- Provides **CSV merging** for easy integration with existing academic systems.  

---

## 🚀 Getting Started  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/your-username/marksheet-digitizer.git
cd marksheet-digitizer
