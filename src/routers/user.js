const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendAccountRemovalEmail } = require('../emails/account')

const router = new express.Router()
const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File should have one of three formats: jpg, jpeg or png'))
        }

        cb(null, true)
    }
})

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    
    try {
        await user.save()
        const token = await user.generateAuthToken()

        sendWelcomeEmail(user.email, user.name)

        res.status(201).send({ user, token })
    } catch (error) {
        console.log(error)

        res.status(400).send(error)
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const update = req.body

    const allowedUpdates = ['name', 'age', 'email', 'password']
    const updates = Object.keys(update)

    try {
        if (updates.every((update) => allowedUpdates.includes(update))) {
            const user = req.user;

            updates.forEach((key) => user[key] = update[key])
            await user.save()

            return res.send(user)
        }

        res.status(400).send({ error: 'Invalid updates!' })
    } catch (error) {
        res.status(500).send(error)
    }
})

router.delete('/users/me', auth , async (req, res) => {
    try {
        req.user.remove()
        sendAccountRemovalEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findByCredentials(email, password)
        const token = await user.generateAuthToken()

        res.send({ user, token })
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/logout', auth,  async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(({ token }) => token !== req.token)

        await req.user.save()

        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []

        await req.user.save()

        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer()

    req.user.avatar = buffer;

    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            return new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

module.exports = router