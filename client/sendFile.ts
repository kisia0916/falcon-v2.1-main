import * as fs from "fs"
import { dataClient, mainClient, sendDataSplitSize } from "./clientMain"
import { setFormat } from "../protocol/sendFormat"
import { readRateAniRun } from "./textLog"
let splitDataList:any[] = []

let fileFd:any = undefined
let splitDataCounter:number = 0
let splitNum:number = 0
let rastPacketSize:number = 0
let fileSize:number = 0
export let nowSendedSize:number = 0
const openFile = (path:string)=>{
    fs.open(path,"r",(err,fd)=>{
        fileFd = fd
        // console.log("open")
        fileSize = fs.statSync(path).size
        splitNum = Math.ceil(fileSize/sendDataSplitSize)
        rastPacketSize = fileSize%sendDataSplitSize
        // console.log(rastPacketSize)
        mainClient.write(setFormat("send_rast_packet_size","mainClient",{rastPacketSize:rastPacketSize,splitDataListLength:splitNum}))
        readRateAniRun("Uploading file",fileSize)
    })
}

export const firstSendSetting = (dataPath:string)=>{
    openFile(dataPath)
}

export const NextSendFile = ()=>{
    let buffer = Buffer.alloc(sendDataSplitSize)
    if (splitDataCounter+1 !== splitNum){
        fs.read(fileFd,buffer,0,sendDataSplitSize,splitDataCounter*sendDataSplitSize,(err, bytesRead, buffer)=>{
            sendData(buffer)
            // console.log(splitDataCounter*sendDataSplitSize)
            nowSendedSize = splitDataCounter*sendDataSplitSize

        })
    }else{
        buffer = Buffer.alloc(rastPacketSize)
        fs.read(fileFd,buffer,0,rastPacketSize,splitDataCounter*sendDataSplitSize,(err, bytesRead, buffer)=>{
            sendData(buffer)
            // console.log(splitDataCounter*sendDataSplitSize)
            nowSendedSize = fileSize
        })
    }
}

export const sendData = (data:any)=>{
    // console.log(splitDataList.length)
    // console.log(data.length)
    dataClient.write(data)
    splitDataCounter+=1
}