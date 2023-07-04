const express = require('express')
const compression = require('compression');
const bodyParser = require('body-parser')
const app = express()
const mongo = require('./mongo')
let mongoReady = false, server
app.use(bodyParser.json({
  limit: '1000MB',
  verify: (req, res, buf)=>{
    req.rawBody = buf.toString()
  }
}))
app.use(compression());
app.get('/healtz', (req, res)=>{
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
  try{
    let apiKey = req?.query?.apiKey, tempCmd = req?.path?.replace('/', '')
    if(process.env.MONGO_API_KEY && process.env.MONGO_API_KEY !== apiKey){
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
})
const CheckMongo = async()=>{
  try{
    let mongoStatus = await mongo.init()
    if(mongoStatus){
      mongoReady = true
      console.log('Mongo connection is ready on '+process.env.POD_NAME)
      server = app.listen(process.env.PORT || 3000, ()=>{
        console.log(process.env.POD_NAME+' api is Listening on ', server.address().port)
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
