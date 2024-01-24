import { doneConnectionFlg } from "./clientMain";
import { nowSendedSize } from "./sendFile";

process.stdout.write( "\x1b[?25l" );
process.on("exit", ()=>process.stdout.write( "\x1b[?25h" ));
process.on("SIGINT", ()=>process.exit(0));

//
let loadContents = [ "｜","／","―","＼"];
let loadContentsCounter = 0
const loadTextAni = (beforeText:string,done:boolean)=>{
    if (!done){
        process.stdout.write(`${beforeText}${loadContents[loadContentsCounter]}\r`)
        loadContentsCounter+=1
        if (loadContentsCounter === loadContents.length){
            loadContentsCounter = 0
        }
    setTimeout(()=>loadTextAniRun(beforeText),40)
    }
}
export const loadTextAniRun = (beforeText:string)=>{
    setTimeout(()=>loadTextAni(beforeText,doneConnectionFlg),40)
}
//
const loadBoxNum = 20
let maxSizeMain = 0
// let nowContentSize = 0
const readRateAni = (beforeText:string)=>{
    let nowContentSize = nowSendedSize
    const nowRate = Math.ceil((nowContentSize/maxSizeMain)*100)
    let writeBox = ""
    if (maxSizeMain+1>=nowContentSize){
        for (let i = 0;loadBoxNum>i;i++){
            if (i+1 <=(nowRate/10)*(loadBoxNum/10)){
                writeBox+="■"
            }else{
                writeBox+="□"
            }
        }
    }
    if (maxSizeMain>nowContentSize){
        process.stdout.write(`${beforeText} [${writeBox}]${nowRate}%\r`)
        setTimeout(()=>readRateAni(beforeText),10)
    }else if (nowContentSize>=maxSizeMain){
        console.log(`${beforeText} [${writeBox}]${nowRate}%`)
        console.log("\x1b[32mUpload done!"+"\x1b[39m")
        nowContentSize+=1
    }
}

export const readRateAniRun = (beforeText:string,maxSize:number)=>{
    maxSizeMain = maxSize
    setTimeout(()=>readRateAni(beforeText),10)
}
// readRateAniRun("lll")
// loadTextAniRun("loading...")