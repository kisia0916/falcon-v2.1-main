import * as net from "net"
import * as fs from "fs"
import * as uuid from "uuid"
import { setFormat } from "../protocol/sendFormat"
import { dataClientFun } from "./dataClientFuns"

const PORT = 3000

const server = net.createServer()

interface clientListInterface {
    userId:string,
    mainClientSocket:any,
    dataClientSocket:any,
    targetInfo:targetsInfoInterface
    rastPacketInfo:rastPacketInfoInterface
}
export interface targetsInfoInterface {
    mainTarget:string,
    subTarget:string,
}

export interface rastPacketInfoInterface {
    rastPacketSize:number,
    splitDataListLength:number,
}

export let clientList:clientListInterface[] = []
export const sendDataSplitSize = 20480



server.on("connection",(socket)=>{
    let userId:string = ""
    let clientType:string = ""
    let mainClientId:string = ""//dataClientがmainClientのIDを保存するよう
    let rastPacketSize:number = 0
    let changeJsonFlg = true
    let targetsInfo:targetsInfoInterface = {mainTarget:"",subTarget:""}//mainは自分から接続しに行ったクライアントでsubは相手から接続してきたクライアント
    socket.write(setFormat("first_send","server",""))

    socket.on("data",(data:string)=>{
        let getData:any = ""
        if (changeJsonFlg){
            getData = JSON.parse(data)
        }else{
            getData = data
            dataClientFun(data,targetsInfo,mainClientId)
        }
        if (changeJsonFlg){
            if (getData.type === "send_client_info"){
                clientType = getData.data.data
                if (getData.data.data === "mainClient"){
                    userId = uuid.v4()
                    clientList.push({userId:userId,mainClientSocket:socket,dataClientSocket:undefined,targetInfo:{mainTarget:"",subTarget:""},rastPacketInfo:{rastPacketSize:0,splitDataListLength:0}})
                    socket.write(setFormat("send_server_userId","server",userId))
                }else if (getData.data.data === "dataClient"){
                    console.log("動いてるよ")
                    const clientIndex = clientList.findIndex((i)=>i.userId === getData.data.userId)
                    if (clientIndex !== -1){
                        mainClientId = getData.data.userId
                        changeJsonFlg = false//データをjsonに変換させないようにする
                        clientList[clientIndex].dataClientSocket = socket
                        targetsInfo = clientList[clientIndex].targetInfo//dataClientにターゲットの情報を設定
                        socket.write(setFormat("conection_done_dataClient","server","done"))
                    }
                }
            }else if (getData.type === "send_main_target"){
                const clientIndex = clientList.findIndex((i)=>i.userId === userId)
                if (clientIndex !== -1){
                    clientList[clientIndex].targetInfo.mainTarget = getData.data
                }
                targetsInfo.mainTarget = getData.data

                //mainTargetに接続リクエストを送信
                const mainTargetIndex = clientList.findIndex((i)=>i.userId === targetsInfo.mainTarget)
                if (mainTargetIndex !== -1){
                    console.log(targetsInfo.mainTarget)
                    console.log("リクエストを送信しました")
                    clientList[mainTargetIndex].mainClientSocket.write(setFormat("send_conection_reqest_mainTarget","server",userId))
                }
            }else if (getData.type === "done_connection_mainTarget"){
                const subTargetIndex = clientList.findIndex((i)=>i.userId === getData.data)
                targetsInfo.subTarget = getData.data
                clientList[subTargetIndex].mainClientSocket.write(setFormat("start_upload","server","start"))
            }else if (getData.type === "done_write_mainTargetFile"){
                console.log("jkfldsjaklfjdasoiejfoiw")
                console.log(targetsInfo)
                const subTargetIndex = clientList.findIndex((i)=>i.userId === targetsInfo.subTarget)
                if (subTargetIndex !== -1){
                    clientList[subTargetIndex].mainClientSocket.write(setFormat("send_next_reqest","server","done"))
                }
            }else if (getData.type === "send_rast_packet_size"){
                rastPacketSize = getData.data.rastPacketSize
                const myIndex = clientList.findIndex((i)=>i.userId === userId)
                if (myIndex !== -1){
                    clientList[myIndex].rastPacketInfo.rastPacketSize = rastPacketSize
                    clientList[myIndex].rastPacketInfo.splitDataListLength = getData.data.splitDataListLength
                }
                console.log(rastPacketSize)
                const mainTargetIndex = clientList.findIndex((i)=>i.userId === targetsInfo.mainTarget)
                if (mainTargetIndex !== -1){
                    clientList[mainTargetIndex].mainClientSocket.write(setFormat("send_rast_packet_size_mainTarget","server",{rastPacketSize:rastPacketSize,splitDataListLength:getData.data.splitDataListLength}))
                }
            }else if (getData.type === "start_send_packet"){
                const subTargetIndex = clientList.findIndex((i)=>i.userId === targetsInfo.subTarget)
                if (subTargetIndex !== -1){
                    clientList[subTargetIndex].mainClientSocket.write(setFormat("start_send_packet_2","server","done"))
                }
            }
        }
    })
})

server.listen(PORT,()=>{
    console.log("server run!")
})