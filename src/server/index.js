const express = require('express');
const fs = require('fs')
const path = require('path')

const app = express()

app.use('/', express.static(path.resolve(__dirname, '../../dist')))

app.use('*', (req, res) => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../dist/index.html'), {
    encoding: 'utf-8'
  })
  res.send(html)
})

app.listen(3000, () => {
  console.log('app is running on localhost://3000')
})