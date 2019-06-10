const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mashafomashina@yandex.ru',
        subject: 'Welcome to the App',
        text: `Welcome to the App, ${name}. Let me know how you get along with the app.`,
    })
}

const sendAccountRemovalEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mashafomashina@yandex.ru',
        subject: 'We\'ve deleted your account',
        text: `Hello ${name}. We've deleted your account.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendAccountRemovalEmail
}