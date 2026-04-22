const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    deadline: Date,
    priority: String,

    // ✅ ADD THIS
    progress: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Task', taskSchema);