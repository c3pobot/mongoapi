'use strict'
const { MongoClient } = require("mongodb");
let dbo, mongo, connectionString = 'mongodb://'+process.env.MONGO_USER+':'+process.env.MONGO_PASS+'@'+process.env.MONGO_HOST+'/?compressors=zlib'
const Cmds = {}
Cmds.init = async()=>{
  try{
    if(process.env.MONGO_AUTH_DB) connectionString += '&authSource='+process.env.MONGO_AUTH_DB
    if(process.env.MONGO_REPSET) connectionString += '&replicaSet='+process.env.MONGO_REPSET
    mongo = await MongoClient.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    dbo = await mongo.db(process.env.MONGO_DB)
    return true
  }catch(e){
    throw(e);
  }
}
Cmds.aggregate = async({ collection, matchCondition, data = [] })=>{
  try{
    if(matchCondition) data.unshift({$match: matchCondition})
    return await dbo.collection(collection).aggregate(data, { allowDiskUse: true }).toArray()
  }catch(e){
    throw(e);
  }
}
Cmds.del = async({ collection, matchCondition })=>{
  try{
    return await dbo.collection(collection).deleteOne(matchCondition)
  }catch(e){
    throw(e)
  }
}
Cmds.delMany = async({collection, matchCondition})=>{
  try{
    return await dbo.collection(collection).deleteMany(matchCondition)
  }catch(e){
    throw(e)
  }
}
Cmds.count = async({collection, matchCondition})=>{
  try{
    return await dbo.collection( collection ).countDocuments(matchCondition)
  }catch(e){
    throw(e)
  }
}
Cmds.find = async({collection, matchCondition, data})=>{
  try{
    return await dbo.collection( collection ).find( matchCondition, {projection: data} ).toArray()
  }catch(e){
    throw(e)
    return []
  }
}
Cmds.limit = async({collection, matchCondition, data, limitCount = 50, })=>{
  try{
    return await dbo.collection( collection ).find( matchCondition, { projection: data } ).limit( limitCount ).toArray()
  }catch(e){
    throw(e)
    return []
  }
}
Cmds.skip = async({collection, matchCondition, data, limitCount = 50, skipCount = 50})=>{
  try{
    return await dbo.collection( collection ).find( matchCondition, { projection: data } ).limit( limitCount ).skip( skipCount ).toArray()
  }catch(e){
    throw(e)
    return []
  }
}
Cmds.set = async({ collection, matchCondition, data })=>{
  try{
    data.TTL = new Date()
    return await dbo.collection(collection).updateOne(matchCondition,{$set: data },{"upsert":true})
  }catch(e){
    throw (e)
  }
}
Cmds.setMany = async({collection, matchCondition, data })=>{
  try{
    data.TTL = new Date()
    return await dbo.collection(collection).updateMany(matchCondition, {$set: data}, {upsert: true})
  }catch(e){
    throw(e)
  }
}
Cmds.math = async({collection, matchCondition, data})=>{
  try{
    return await dbo.collection(collection).updateOne(matchCondition, {$inc: data, $set: {TTL: new Date()}}, {"upsert":true})
  }catch(e){
    throw (e)
  }
}
Cmds.push = async({collection, matchCondition, data})=>{
  try{
    return await dbo.collection(collection).updateOne(matchCondition, {$push: data, $set: {TTL: new Date()}}, {"upsert":true})
  }catch(e){
    throw (e)
  }
}
Cmds.pull = async({collection, matchCondition, data})=>{
  try{
    return await dbo.collection(collection).updateOne(matchCondition, {$pull: data, $set: {TTL: new Date()}})
  }catch(e){
    throw (e)
  }
}
Cmds.unset = async({collection, matchCondition, data})=>{
  try{
    return await dbo.collection(collection).updateOne(matchCondition, {$unset: data, $set: {TTL: new Date()}})
  }catch(e){
    throw (e)
  }
}
Cmds.rep = async({collection, matchCondition, data})=>{
  try {
    data.TTL = new Date()
    return await dbo.collection(collection).replaceOne(matchCondition, data, { upsert: true });
  } catch (e) {
    throw (e)
  }
}
Cmds.next = async({collection, matchCondition, data})=>{
  try{
    const checkCounter = await dbo.collection(collection).findOneAndUpdate(matchCondition,{$inc:{[data]:1}},{returnNewDocument:true, upsert: true})
    if(checkCounter.value){
      return checkCounter.value[data]
    }else{
      const nextValue = await dbo.collection(collection).findOneAndUpdate(matchCondition,{$inc:{[data]:1}},{returnNewDocument:true})
      return nextValue.value[data]
    }
  }catch(e){
    throw (e)
  }
}
module.exports = Cmds
