import * as fs from "fs"
import { dataClient, mainClient, sendDataSplitSize } from "./clientMain"
import { setFormat } from "../protocol/sendFormat"
let splitDataList:any[] = []
export const firstSendSetting = (dataPath:string)=>{
    const getFile:any = fs.readFileSync(dataPath)
    const fileSize = fs.statSync(dataPath).size
    const splitNum = Math.ceil(fileSize/sendDataSplitSize)
    if (fileSize > sendDataSplitSize){
        for (let i = 0;splitNum>i;i++){
            splitDataList.push(getFile.slice(i*sendDataSplitSize,i*sendDataSplitSize+sendDataSplitSize))
        }
    }else{
        splitDataList.push(getFile)
    }
    console.log(splitDataList)
    mainClient.write(setFormat("send_rast_packet_size","mainClient",{rastPacketSize:splitDataList[splitDataList.length-1].length,splitDataListLength:splitDataList.length}))
}

export const NextSendFile = ()=>{
    console.log("next")
    sendData(splitDataList[0])
}

export const sendData = (data:any)=>{
    console.log(splitDataList.length)
    console.log(data.length)
    dataClient.write(data)
    splitDataList.splice(0,1)
}