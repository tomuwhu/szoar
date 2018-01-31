var dbname="blank", //database name (collections --> users, subjects, days)
    express = require('express'), bodyParser = require('body-parser'),
    frontend={ root: __dirname+'/frontend' },
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    mongoose = require('mongoose'), app = express()
app .use(bodyParser.json()).use(cookieParser())
    .use(express.static('public')).use(session({
        resave: true, saveUninitialized: true,
        secret: 'ABC123', cookie: { maxAge: 600000 }
    }))
mongoose.connect('mongodb://localhost/'+dbname, { useMongoClient: true })
mongoose.Promise = global.Promise

// router redirect
app.get( '/', (req, res) => res.sendFile('index.html', frontend) )
app.get( '/admin/:id', (req, res) => res.redirect( '/' ) )
app.get( '/login', (req, res) => res.redirect( '/' ) )
app.get( '/logout', (req, res) => res.redirect( '/' ) )

// router angular template-ek
app.get( '/ps1', (req, res) => res.sendFile('main.html', frontend) )
app.get( '/log', (req, res) => res.sendFile('login.html', frontend) )
app.get( '/a_fc', (req, res) => res.sendFile('admin/setup.html', frontend) )
app.get( '/a_targyak', (req, res) => res.sendFile('admin/targyak.html', frontend) )
app.get( '/a_oktatok', (req, res) => res.sendFile('admin/oktatok.html', frontend) )
app.get( '/a_hallgatok', (req, res) => res.sendFile('admin/hallgatok.html', frontend) )
app.get( '/a_idopontok', (req, res) => res.sendFile('admin/idopontok.html', frontend) )
app.get( '/session', (req, res) => res.send( req.session.user) )

//felhasználók: adminok / tanárok / diákok
var User = mongoose.model('user', {
    email:   { type: String, trim: true, index: true, unique: true, lowercase: true },
    pw:      { type: String },
    nev:     { type: String, trim: true },
    jog:     { type: Number },
    szd:     { type: Date },
    updated: { type: Date, default: Date.now }
})
app.post( '/ujoktato', (req, res) => {
    if ((typeof req.body.nev) !== 'undefined') {
        if (req.body.modosit) {
            /*
            User.find( {email: req.body.email } ).update(req.body).exec()
            res.send( { oktmod: true } )
            */
            console.log("oktató módosítás")
        } else {
            var ujoktato = req.body
            ujoktato.jog = 2
            var uo = new User( ujoktato )
            uo.save( (err,cucc) => {
                newuser = cucc
                newuser.pw = ""
                res.send( newuser )
            })

        }
    } else res.send( {epty: true} )
})
app.post( '/ujdiak', (req, res) => {
    if ((typeof req.body.nev) !== 'undefined') {
        if (req.body.modosit) {
            /*
            User.find( {email: req.body.email } ).update(req.body).exec()
            res.send( { oktmod: true } )
            */
            console.log("diák módosítás")
        } else {
            var ujoktato = req.body
            ujoktato.jog = 1
            var uo = new User( ujoktato )
            uo.save( (err,cucc) => {
                newuser = cucc
                newuser.pw = ""
                res.send( newuser )
            })

        }
    } else res.send( {epty: true} )
})
app.get("/getst", (req, res) => {
  User.find({jog: 4}).exec((err,arr) => {
      if (arr.length) {
          res.send( {nau: false} )
      } else res.send( {nau: true} )
  } )
} )
app.get("/oktlist", (req, res) => {
  User.find({jog: 2}).sort({nev: 1}).exec((err,arr) => {
      if (arr.length) {
          arr.forEach(okt => okt.pw="")
          res.send( arr )
      } else res.send( {epty: true} )
  } )
} )
app.get("/diaklist", (req, res) => {
  User.find({jog: 1}).sort({nev: 1}).exec((err,arr) => {
      if (arr.length) {
          arr.forEach(okt => okt.pw="")
          res.send( arr )
      } else res.send( {epty: true} )
  } )
} )
app.post( '/firstconfig', (req, res) => {
    User.find().exec((err,arr) => {
        if (arr.length == 0) {
          ujadmin = req.body
          ujadmin.jog = 4
          var ua = new User( ujadmin )
          ua.save((err,cucc) => {
              if (err) console.log(err.errmsg)
              else {
                  req.session.user = cucc
                  req.session.user.pw=''
                  res.send( req.session.user )
              }
          })
        }
    } )

} )
app.post( '/session', (req, res) => {
    User.find( {email: req.body.email, pw: req.body.pw} ).exec((err,arr) => {
        if (arr.length) {
            req.session.user=arr[0]
            req.session.user.pw=''
            res.send( req.session.user )
        } else res.send( {wp: true} )
    } )

} )
app.get( '/session/destroy', (req, res) => {
        req.session.destroy()
        res.send( {jog: 0} )
} )

//tárgyak/modulok
var Targy = mongoose.model('subject', {
    tnev:    { type: String, trim: true },
    osz:     { type: Number },
    updated: { type: Date, default: Date.now }
})
app.post( '/targymod', (req, res) => {
    Targy.findById(req.body._id).update(req.body).exec( (err,cucc) => res.send({jo: cucc.nModified}) )
} )
app.post( '/ujtargy', (req, res) => {
    var ut = new Targy( req.body )
    ut.save((err,cucc) => {
      if (err) console.log(err.errmsg)
      else res.send(cucc)
    })
} )
app.get("/targylist", (req, res) => {
  Targy.find().sort({tnev: 1}).exec((err,arr) => {
      if (arr.length) {
          res.send( arr )
      } else res.send( {epty: true} )
  } )
} )

//időpontok
var Idopont = mongoose.model('day', {
    idate:   { type: Date },
    osz:     { type: Number },
    oszrow:  { type: Number },
    oktid:   { type: String, trim: true },
    targyid: { type: String, trim: true },
    updated: { type: Date, default: Date.now }
})
app.post("/ipsetokt", (req, res) => {
  Idopont.findById(req.body.ipid).update({oktid: req.body.oktid}).exec((err,cucc) => {
      res.send({jo: cucc.ok})
  } )
} )
app.post("/deltargyokt", (req, res) => {
  Idopont.findById(req.body.id).update({oktid: "", targyid: ""}).exec((err,cucc) => {
      res.send({jo: cucc.ok})
  } )
} )
app.post("/ipsettargy", (req, res) => {
  Idopont.findById(req.body.ipid).update({targyid: req.body.targyid}).exec((err,cucc) => {
      res.send({jo: cucc.ok})
  } )
} )
app.post("/ipnoszmod", (req, res) => {
  Idopont.findById(req.body.id).update({osz: req.body.osz}).exec((err,cucc) => {
      res.send({jo: cucc.ok})
  } )
} )
app.post("/ipaoszmod", (req, res) => {
  Idopont.findById(req.body.id).update({oszrow: req.body.osz}).exec((err,cucc) => {
      res.send({jo: cucc.ok})
  } )
} )
app.post( '/ujip', (req, res) => {
    var ui = new Idopont( req.body )
    ui.save((err,cucc) => {
      if (err) console.log(err.errmsg)
      else res.send(cucc)
    })
} )
app.get("/iplist", (req, res) => {
  Idopont.find().sort({idate: 1}).exec((err,arr) => {
      if (arr.length) {
          res.send( arr )
      } else res.send( {epty: true} )
  } )
} )
app.post("/delip", (req, res) => {
  Idopont.findById(req.body.tid).remove().exec((err,cucc) => {
      res.send({jo: cucc.result.ok})
  } )
} )

app.listen(3001)
