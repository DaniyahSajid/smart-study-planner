const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// import model
const Task = require('./models/Task');

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/studyPlannerDB')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));


// ---------------- ROUTES ----------------

// test route
app.get('/', (req, res) => {
    res.send('Server is running successfully');
});


// ADD TASK (POST)
app.post('/tasks', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// GET ALL TASKS
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// TEST ROUTE (you can delete later)
app.get('/add-test', async (req, res) => {
    const task = new Task({
        title: "Study ML",
        description: "Revise unit 2",
        deadline: new Date(),
        priority: "High"
    });

    await task.save();
    res.send("Test task added");
});


// ---------------- SERVER ----------------
app.listen(5000, () => {
    console.log('Server running on port 5000');
});
app.delete('/tasks/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.put('/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});