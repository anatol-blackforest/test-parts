const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL,  
      pass: process.env.MAILPASS
    }
});

class contactServise {
    getContactForm (req, res) {
        // here will be get
    }
    postContactForm (req, res) {
        if (!req.body.email || !req.body.company || !req.body.firstname || !req.body.lastname || !req.body.phone || !req.body.country ) return res.status(500).send("Not all required form fields are filled")

        let data = `
            title: ${req.body.title},
            email: ${req.body.email},
            firstname: ${req.body.firstname},
            lastname: ${req.body.lastname},
            company: ${req.body.company},
            phone:${req.body.phone},
            street:${req.body.street},
            city:${req.body.city},
            zipcode:${req.body.zipcode},
            state:${req.body.state},
            country:${req.body.country},
            website:${req.body.website} 
        `

        transporter.sendMail({
            from: req.body.email,
            to:  process.env.MAIL,
            subject: 'Message from customer',
            text: data
        }, function(error, info){
            if (error) {
              res.status(500).send(error)
            } else {
              res.status(200).send({message: 'Message sended', info})
            }
        });
    }
}

module.exports = new contactServise
