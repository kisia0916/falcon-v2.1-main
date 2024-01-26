import * as readline from "readline"
import { mainClient, settSystemMode, targetsInfo } from "./clientMain";
import { setFormat } from "../protocol/sendFormat";

export const getInput = (beforeText:string)=>{
    const readLine = readline.createInterface({
        input:process.stdin,
        output:process.stdout
    })
    return new Promise((resolve, reject) => {
        readLine.question(beforeText, (answer) => {
          resolve(answer);
          readLine.close();
        });
    })
}

export const cmdAnalyze = (data:string)=>{
    const getCmd = data.split(" ")
    if (getCmd[0] === "cd"){
        settSystemMode("cmd")
    }else if (getCmd[0] === "upload"){
        console.log("upload")
        console.log(targetsInfo.mainTarget)
        settSystemMode("upload")
        mainClient.write(setFormat("done_connection_mainTarget_upload","mainClient",targetsInfo.mainTarget))
    }else if (getCmd[0] === "download"){
        settSystemMode("download")
    }else if (getCmd[0] === "clear"){
        settSystemMode("cmd")
    }else{

    }
}