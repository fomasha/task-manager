const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const options = Object.assign(req.body, { owner: req.user._id })
    const task = new Task(options)

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/tasks', auth, async (req, res) => {
    const match = {}
    
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    let sortOptions = {}
    const [sort, order] = req.query.sortBy.split('_');
    if (sort && order) {
        sortOptions[sort] = order === 'asc' ? 1 : -1;
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit, 10),
                skip: parseInt(req.query.skip, 10),
                sort: sortOptions,
            },
        }).execPopulate()

        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const { id } = req.params

    try {
        const task = await Task.findOne({ _id: id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed']
    const updates = req.body
    const id = req.params.id

    try {
        if (Object.keys(updates).every((update) => allowedUpdates.includes(update))) {
            const task = await Task.findOne({ _id: id, owner: req.user._id });

            if (!task) {
                return res.status(404).send()
            }

            Object.keys(updates).forEach((update) => task[update] = updates[update]);
            await task.save();

            return res.send(task)
        }

        res.status(400).send({ error: 'Unallowed updates!' })
    } catch (error) {
        res.status(500).send(error)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    const id = req.params.id

    try {
        const task = await Task.findOneAndDelete({ _id: id, owner: req.user._id })
        
        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router