export const setFormat = (type:string,sendFrom:"mainClient"|"dataClient"|"server",data:any):string=>{
    const sendData = {type:type,sendFrom:sendFrom,data:data}
    return JSON.stringify(sendData)
}