const express = require('express')
const compression = require('compression');
const bodyParser = require('body-parser')
const mongo = require('./mongo')
const MONGO_API_KEY = process.env.MONGO_API_KEY
const PORT = process.env.HEALTH_PORT || 3000
const POD_NAME = process.env.POD_NAME
const app = express()

let mongoReady = false, server
app.use(compression());
app.use(bodyParser.json({
  limit: '1000MB',
  verify: (req, res, buf)=>{
    req.rawBody = buf.toString()
  }
}))

app.get('/healthz', (req, res)=>{
  res.json({status: 'ok'})
})
app.use('/status', (req, res)=>{
  if(mongoReady){
    res.json({status: 'ok'})
  }else{
    res.sendStatus(503)
  }
})
app.post('/*', async(req, res)=>{
  handleRequest(req, res)
})
const handleRequest = async(req, res)=>{
  try{
    let apiKey = req?.query?.apiKey, tempCmd = req?.path?.replace('/', '')
    if(MONGO_API_KEY && MONGO_API_KEY !== apiKey){
      res.sendStatus(503)
    }else{
      if(tempCmd && req?.body?.collection && mongo[tempCmd] && tempCmd !== 'init'){
        const obj = await mongo[tempCmd](req.body)
        res.json(obj)
        return;
      }else{
        res.sendStatus(503)
      }
    }
  }catch(e){
    console.error(e);
    res.sendStatus(503)
  }
}
const CheckMongo = async()=>{
  try{
    let mongoStatus = await mongo.init()
    if(mongoStatus){
      mongoReady = true
      console.log('Mongo connection is ready on '+POD_NAME)
      server = app.listen(PORT || 3000, ()=>{
        console.log(POD_NAME+' api is Listening on ', server.address().port)
      })
    }else{
      setTimeout(CheckMongo, 5000)
    }
  }catch(e){
    console.error(e);
    setTimeout(CheckMongo, 5000)
  }
}
CheckMongo()
