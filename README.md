# 🍎 SmartAttend
### *The Autonomous Command Center for Modern Educators*

**SmartAttend** is a high-performance React ecosystem designed to bridge the gap between fragmented school schedules and classroom management. By transforming static CSV data into a **Live, Context-Aware Dashboard**, it eliminates administrative overhead and automates parent-teacher communication.

---

## 🛠️ Key Engineering Pillars

### 📡 Data Virtualization Engine
Built a custom parser to transform unstructured **CSV schedule data** into a time-aware UI. The system dynamically calculates "Live" vs. "Next" class states based on the system clock, providing a real-time "Control Room" for the educator's day.

### ⚡ Contextual "Smart Launch" Logic
Implemented a predictive navigation system. With one click from the timetable, the app automatically initializes the Attendance or Marks portal with the correct subject, section, and student roster—zero manual searching required.

### 🔄 Single Source of Truth (SSOT)
Engineered a centralized data architecture where student rosters are managed in a single Dashboard and propagated across four distinct modules: **Attendance, Assignments, Marks, and Timetable.**

### 📢 Automated Communication Layer
Integrated the **WhatsApp Web API** and **jsPDF** to bridge digital records with real-world action:
* **Instant Alerts:** Automated identification of absentees or "Top 3 Rankers" with pre-formatted professional templates.
* **Document Generation:** High-fidelity PDF exports for formal institutional records.

---

## 💻 Tech Stack
* **Frontend:** React.js, Tailwind CSS
* **State & Routing:** React Router (Deep-Linking), LocalStorage API
* **Analytics:** Chart.js (Data Visualization)
* **Utilities:** jsPDF, Lucide-React

---
*Developed by [Your Name] — Bridging the gap between code and classroom.*