import * as net from "net"
import * as fs from "fs"
import { setFormat } from "../protocol/sendFormat"
import { NextSendFile, firstSendSetting} from "./sendFile"
import { loadTextAniRun } from "./textLog"

export const mainClient = new net.Socket()
export const dataClient = new net.Socket()

// const HOST = "0.tcp.jp.ngrok.io"
// const PORT = 17745
const HOST = "localhost"
const PORT = 3000
let sendFile:string = "./testFiles/sendData.exe"
let writeFile:string = "./testFiles/getData.exe"


interface getDataInterFace{
    type:string,
    sendFrom:string
    data:any
}
interface targetsInfoInterface {
    mainTarget:string,
    subTarget:string,
}

let userId:string = ""
let targetsInfo:targetsInfoInterface = {mainTarget:"",subTarget:""}//mainは自分から接続しに行ったクライアントでsubは相手から接続してきたクライアント

export const sendDataSplitSize = 102400
export let rastPacketSize:number = 0
export let splitDataListLength:number = 0
export let packetCounter:number = 0
export let systemMode:"upload"|"download"|undefined = "upload"


mainClient.on("data",(data:string)=>{
    const getData:getDataInterFace = JSON.parse(data)
    if (getData.type === "first_send"){
        mainClient.write(setFormat("send_client_info","mainClient",{data:"mainClient",systemMode:systemMode}))
    }else if (getData.type === "send_server_userId"){
        userId = getData.data
        console.log(`my userId is ${userId}`)
        //本番ではここを標準入力にする
        targetsInfo.mainTarget = fs.readFileSync("./testFiles/target.txt","utf-8")
        if (targetsInfo.mainTarget){
            console.log("ターゲットを読み込みました")
            mainClient.write(setFormat("send_main_target","mainClient",{mainTarget:targetsInfo.mainTarget}))
        }else{
            //ターゲットがないときにdataClientを接続させる
            dataClient.connect(PORT,HOST,()=>{
                console.log("dataClient connected server!")
            })
        }
        /////
    }else if (getData.type === "send_conection_reqest_mainTarget"){
        targetsInfo.subTarget = getData.data
        console.log("reqestを受け取りました")
        mainClient.write(setFormat("done_connection_mainTarget","mainClient",targetsInfo.subTarget))
    }else if (systemMode === "upload"){
        if (getData.type === "start_upload"){
            console.log("リクエストが成功しました")
            dataClient.connect(PORT,HOST,()=>{
                console.log("dataClient connected server!")
            })
        }else if (getData.type === "send_next_reqest"){
            NextSendFile()
        }else if (getData.type === "send_rast_packet_size_mainTarget"){
            rastPacketSize = getData.data.rastPacketSize
            splitDataListLength = getData.data.splitDataListLength
            console.log(`rast packet size is ${rastPacketSize}`)
            mainClient.write(setFormat("start_send_packet","mainClient","done"))
        }else if (getData.type === "start_send_packet_2"){
            NextSendFile()
        }
    }else if (systemMode === "download"){
        if (getData.type === "start_download"){
            console.log("downloadを開始します")
            dataClient.connect(PORT,HOST,()=>{
                console.log("dataClient connected server!")
            })
        }else if (getData.type === "send_download_path_sub"){
            sendFile = getData.data
            console.log("downloadのファイル送信の準備開始")
            firstSendSetting(sendFile)

        }else if (getData.type === "send_rast_packet_size_subTarget"){
            console.log(getData.data)
            rastPacketSize = getData.data.rastPacketSize
            splitDataListLength = getData.data.splitDataListLength
            console.log(`rast packet size is ${rastPacketSize}`)
            mainClient.write(setFormat("start_send_packet","mainClient","done"))
        }else if (getData.type === "start_send_packet_2"){
            console.log("うけとり")
            NextSendFile()
        }else if (getData.type === "send_next_reqest"){
            NextSendFile()
        }
    }
})

let dataClientFirstFlg:boolean = true
let getDataCacheList:any[] = []
dataClient.on("data",(data:string)=>{
    let getData:getDataInterFace;
    if (dataClientFirstFlg){
        getData = JSON.parse(data)
        if (getData.type === "first_send"){
            dataClient.write(setFormat("send_client_info","dataClient",{data:"dataClient",userId:userId,systemMode:systemMode}))
        }else if (getData.type === "conection_done_dataClient"){
            if (systemMode === "upload"){
                if (targetsInfo.mainTarget){
                    
                    firstSendSetting(sendFile)   
                }
            }else if (systemMode === "download"){
                mainClient.write(setFormat("send_download_path_main","mainClient",sendFile))
            }
            dataClientFirstFlg = false//ここでもうjsonデータは受け取れなくなる
        }
    }else{
        console.log("subTargetからデータを受け取りました")
        console.log(Buffer.isBuffer(data))
        getDataCacheList.push(data)
        console.log(Buffer.concat(getDataCacheList).length)
        console.log(Buffer.concat(getDataCacheList).length)

        if (packetCounter+1 !== splitDataListLength){
            if (Buffer.concat(getDataCacheList).length === sendDataSplitSize){
                fs.appendFile(writeFile,Buffer.concat(getDataCacheList),(error)=>{
                    console.log("書き込み完了")
                    mainClient.write(setFormat("done_write_mainTargetFile","mainClient","done"))
                    getDataCacheList = []
                    packetCounter+=1
                })

            }
        }else{
            if (Buffer.concat(getDataCacheList).length === rastPacketSize){
                fs.appendFile(writeFile,Buffer.concat(getDataCacheList),(error)=>{
                    console.log("最後のパケットを書き込みました")
                    // mainClient.write(setFormat("done_write_mainTargetFile","dataClient","done"))
                    getDataCacheList = []
                    packetCounter+=1
                })

            }
        }
    }
})

export let doneConnectionFlg:boolean = false
loadTextAniRun(`Connecting to ${HOST}:${PORT}`)
mainClient.connect(PORT,HOST,()=>{
    doneConnectionFlg = true
    console.log(`${"Connecting to localhost:3000"}`+"\x1b[32m done"+"\x1b[39m")
})
