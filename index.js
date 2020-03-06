const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')

const app = express()

const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

const db = mysql.createConnection({
  host:'127.0.0.1',
  port:'3306',
  user:'root',
  password:'',
  database:"kpop_shop"
})

db.connect((err) => {
  if (err){
    throw err
  }else{
    console.log("Database connected")
  }

})


// LOGIN //
const isAuthorized = (request, result, next)=> {
  if(typeof(request.headers['x-api-key']) == 'undefined'){
    return result.status(403).json({
      success: false,
      message: 'Unauthorized. Token is not provided'
    })
  }

  let token = request.headers['x-api-key']

  jwt.verify(token, secretKey, (err, decoded)=>{
    if (err) {
      return result.status(401).json({
        success: false,
        message:'Unauthorized. Token is invalid'
      })
    }
  })

  next()
}


app.get('/',(request,result) =>{
  result.json({
    success: true,
    message: 'Welcome'
  })
})

app.post('/login',(request,result)=>{
  let data = request.body

  if(data.username == 'admin' && data.password == 'admin'){
    let token = jwt.sign(data.username + '|' + data.password, secretKey)

    result.json({
      success: true,
      message:'Login succes, Welcome back!',
      token: token
    })
  }

  result.json({
    success: false,
    message: 'Kamu bukan orangnya yaa?!'
  })
})

// CRUD Admin //
app.get('/admin', (req, res) => {
  let sql = `
        select id_admin, nama_admin, username, password from admin
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "Success get all admin",
      data: result
    })
  })
})

app.post('/admin', (req, res) => {
  let data = req.body

  let sql = `
        insert into admin (id_admin, nama_admin, username, password)
        values ('`+data.id_admin+`', '`+data.nama_admin+`', '`+data.username+`', '`+data.password+`')
  `

  db.query(sql, (err, result) => {
    if(err) throw err

    res.json({
      message: "admin created",
      data: result
    })
  })
})

app.get('/admin/:id', (req, res) => {
  let sql = `
        select * from admin
        where id_admin = `+req.params.id+`
        limit 1
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "success get a admin detail",
      data: result[0]
    })
  })
})


app.put('/admin/:id', (req, res) => {
  let data = req.body

  let sql = `
        update admin
        set id_admin = '`+data.id_admin+`', nama_admin = '`+data.nama_admin+`', username = '`+data.username+`', password = '`+data.password+`'
        where id_admin = '`+req.params.id+`'
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "data has been updated",
      data: result
    })
  })
})

app.delete('/admin/:id', (req, res) => {
  let sql = `
        delete from admin
        where id_admin = '`+req.params.id+`'
  `

  db.query(sql, (err, result) => {
    if(err) throw err

    res.json({
      message: "data has been deleted",
      data: result
    })
  })
})

// CRUD Barang //
app.get('/barang', isAuthorized, (req, res) => {
  let sql = `
  select * from barang
  `

  db.query(sql,(err, result) => {
    if(err) throw  err

    res.json({
      success: true,
      message: 'Success retrive data from database',
      data: result
    })
  })
})

app.post('/barang', isAuthorized, (request, res) => {
  let data = request.body

  let sql = `
      insert into barang (id_barang, nama_barang, jumlah, harga)
      values ('`+data.id_barang+`', '`+data.nama_barang+`', '`+data.jumlah+`', '`+data.harga+`');
  `

  db.query(sql, (err, result) => {
    if (err) throw err
  })

  res.json({
    success: true,
    message: 'Barang kamu sudah ready:)'
  })
})

app.put('/barang/:id', isAuthorized, (request, result) => {
  let data = request.body

  let sql = `
      update barang
      set id_barang = '`+data.id_barang+`', nama_barang = '`+data.nama_barang+`', jumlah = '`+data.jumlah+`', harga = '`+data.harga+`'
      where id_barang = `+request.params.id+`
      `

  db.query(sql, (err, result) => {
    if (err) throw err
  })

  result.json({
    success: true,
    message: 'Data has been updated'
  })
})

app.delete('/barang/:id', isAuthorized, (request, result) => {
  let sql = `
      delete from barang where id_barang = `+request.params.id+`
  `

  db.query(sql, (err, res) => {
    if(err) throw err
  })

  result.json({
    success: true,
    message: 'Data has been deleted'
  })
})

// Transaksi //

app.post('/barang/:id/take', (req, res) => {
  let data = req.body

  db.query(`
    insert into transaksi (id_admin, id_barang)
    values ('`+data.id_admin+`', '`+req.params.id+`')
    `, (err, result) => {
      if (err) throw err
    })

  db.query(`
    update barang
    set jumlah = jumlah - 1
    where id_barang = '`+req.params.id+`'
    `, (err, result) => {
      if (err) throw err
    })

    res.json({
      message: "barang sudah dipesan user"
    })
})

app.get('/admin/:id/barang', (req, res) => {
    db.query(`
      select barang.nama_barang, barang.jumlah, barang.harga
      from admin
      right join transaksi on admin.id_admin = transaksi.id_admin
      right join barang on transaksi.id_barang = barang.id_barang
      where admin.id_admin = '`+req.params.id+`'
  `, (err, result) => {
    if (err) throw err

    res.json({
      message: "sukses transaksi barang",
      data: result
    })
  } )
})

app.listen(2555, ()=>{
  console.log('App is running on port 2555')
})
