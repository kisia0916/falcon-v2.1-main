const fs = require("fs")

const length = 3
const buffer = Buffer.alloc(length);
fs.open("./testFiles/data.txt","r",(err,fd)=>{
    fs.read(fd, buffer, 0, length, 0, (err, bytesRead, buffer) => {
        console.log(buffer.toString())
    })
    fs.read(fd, buffer, 0, 2, 0, (err, bytesRead, buffer) => {
        console.log(buffer.toString())
    })
})