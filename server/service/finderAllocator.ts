import fs from 'fs';

export const findingSessionFromTxt=async(sessionId:string)=>{
    return new Promise((res,rej)=>{
        fs.readFile(`${__dirname}/../session.txt`,{encoding:"utf-8"},(err,data)=>{
            if(err){
                throw new Error(err.message)
            }
            const sessionData=JSON.parse(data)   
           // console.log(sessionData[sessionId],"logging")
            res(sessionData[sessionId])
        })
    })
}

export const writeSessionData=async(sessionId:string,pastMessage:any)=>{

    return new Promise((resolve,reject)=>{
        fs.readFile(`${__dirname}/../session.txt`,{encoding:"utf-8"},(err,data)=>{
            // const parsed=JSON.parse(data)
            // parsed.products=[...parsed.products,req.body]
            const parsed=JSON.parse(data)
            parsed[sessionId]=pastMessage
    
            fs.writeFile(`${__dirname}/../session.txt`,JSON.stringify(parsed),()=>{
                resolve("writingDone")
            })
            
        })
    })

}
