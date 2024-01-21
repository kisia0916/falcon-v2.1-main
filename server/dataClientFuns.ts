import { clientList, rastPacketInfoInterface, sendDataSplitSize, targetsInfoInterface } from "./serverMain"

let getDataCacheList:any[] = []
let rastPacketInfo:rastPacketInfoInterface|undefined = undefined
let packetCounter:number = 0
export const dataClientFun = (data:any,targetInfo:targetsInfoInterface,mainClientUserId:string,systemMode:string)=>{
    let targetId:string = ""
    if (systemMode === "upload"){
        targetId = targetInfo.mainTarget
    }else if (systemMode === "download"){
        targetId = targetInfo.subTarget
    }
    console.log(Buffer.isBuffer(data))
    if (!rastPacketInfo){
        const mainClientIndex = clientList.findIndex((i)=>i.userId === mainClientUserId)
        rastPacketInfo = clientList[mainClientIndex].rastPacketInfo
        console.log(rastPacketInfo)
    }
    console.log("データを受け取りました")
    console.log(packetCounter)
    console.log(rastPacketInfo.splitDataListLength)
    getDataCacheList.push(data)
    if (rastPacketInfo){
        if (packetCounter+1 !== rastPacketInfo.splitDataListLength){
            console.log("ここまでは動いてる")
            console.log(rastPacketInfo)
            console.log(Buffer.concat(getDataCacheList).length)
            if (Buffer.concat(getDataCacheList).length === sendDataSplitSize){
                console.log("すべてのパケットを取得しました")
                const targetDataClientIndex = clientList.findIndex((i)=>i.userId === targetId)
                // console.log(targetDataClientIndex)

                if (targetDataClientIndex !== -1){
                    console.log("次のパケットを送信します")
                    console.log(Buffer.concat(getDataCacheList).length)
                    clientList[targetDataClientIndex].dataClientSocket.write(Buffer.concat(getDataCacheList))
                }
                getDataCacheList = []
                packetCounter +=1
            }
        }else{
            console.log("動いてはいる")
            if (Buffer.concat(getDataCacheList).length === rastPacketInfo.rastPacketSize){
                console.log("最後のパケットを受け取りました")
                const targetDataClientIndex = clientList.findIndex((i)=>i.userId === targetId)
                // console.log(targetDataClientIndex)
                if (targetDataClientIndex !== -1){
                    clientList[targetDataClientIndex].dataClientSocket.write(Buffer.concat(getDataCacheList))
                }
                getDataCacheList = []
                packetCounter +=1
            }
        }
    }else{
        console.log("error")
    }
}