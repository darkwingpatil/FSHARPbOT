import { loadQARefineChain,ConversationChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import {ChatMessageHistory,BufferMemory} from "langchain/memory"
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import path from "path"
import {writeSessionData} from "./service/finderAllocator"
import dotenv from "dotenv"
dotenv.config();


// Create the models and chain
const embeddings = new OpenAIEmbeddings({openAIApiKey:process.env.OPEN_API_KEY});
const model = new OpenAI({ temperature: 0,openAIApiKey:process.env.OPEN_API_KEY});
//const chain = loadQARefineChain(model);
const currPath=path.resolve(__dirname,'docs')

let pastMessages =new ChatMessageHistory()

// Load the documents and create the vector store

let formattedList='["dotnet","f#","f sharp programming language"]'
let outofscope='{ text: "Sorry your query is beyond the scope of this lab, Please try again with a new query" }'


    const basePrompt = `f"""
You are an AI tutor having knowleage and expertise on topics present in these lists: ${formattedList}, You will be assiting the students. Note you will have knowleage only about topics present in these lists: ${formattedList}
"""`

    const finalPrompt = `f"""
Perform the following actions:

If the user query is related to your expertise which are topics present in these lists: ${formattedList} then provide relevent response

If the user query is not related to your expertise then respond saying: ${outofscope} .


'''${basePrompt}'''
"""`

const context_wrapper=async(relevantDocs:any,historyThread?:any)=>{

    try{
        let memory;
    if(historyThread && historyThread!=undefined){
        memory= new BufferMemory({
            memoryKey:"chat_history",
            chatHistory:historyThread,
            returnMessages:true
        })
    }
    else
    {
        await pastMessages.addUserMessage(finalPrompt)    
        memory=new BufferMemory({
            memoryKey:"chat_history",
            chatHistory:pastMessages,
            returnMessages:true
        })
    }

    //let chain=new ConversationChain({llm:model,memory})
    let chain = ConversationalRetrievalQAChain.fromLLM(
        model,
        relevantDocs.asRetriever(),
        {
          memory: memory
        }
      );

    return {chain,memory}
    }
    catch(err:any){
        throw new Error(err.message)
    }

}


// this is basically setting up the pdf for the context    
const chatDocumentLoader = async (question:string) => {
    try{
        const loader = new PDFLoader(currPath+"/fsharp_tutorial.pdf");
        const docs = await loader.loadAndSplit();
        const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
    
        const vectorStore = await HNSWLib.fromDocuments(docs, embeddings);
    
        return vectorStore
    }
    catch(err:any){
        throw new Error(err.message)
    }


}


// the one is sent to this where is answers the question
export const answerQuery=async(question:string,sessionId:string,historyThread?:any)=>{

    try{
        let relevantDocs=await chatDocumentLoader(question)

    let {chain,memory}=historyThread && historyThread!=undefined ?
        await context_wrapper(relevantDocs,historyThread)
        :
        await context_wrapper(relevantDocs)

    const res = await chain.call({
        question:question,
    });

    await pastMessages.addUserMessage(question)
    await pastMessages.addAIChatMessage(String(res))

    // bug need to be fixed in further versions
    // await writeSessionData(sessionId,pastMessages)
    memory=new BufferMemory({
        memoryKey:"chat_history",
        chatHistory:pastMessages,
        returnMessages:true
    })
    return res
    }
    catch(err:any){
        throw new Error(err.message)
    }

    
}


/*
{
  output_text: '\n' +
    '\n' +
    "The president said that Justice Stephen Breyer has dedicated his life to serve this country and thanked him for his service. He also mentioned that Judge Ketanji Brown Jackson will continue Justice Breyer's legacy of excellence, and that the constitutional right affirmed in Roe v. Wade—standing precedent for half a century—is under attack as never before. He emphasized the importance of protecting access to health care, preserving a woman's right to choose, and advancing maternal health care in America. He also expressed his support for the LGBTQ+ community, and his commitment to protecting their rights, including offering a Unity Agenda for the Nation to beat the opioid epidemic, increase funding for prevention, treatment, harm reduction, and recovery, and strengthen the Violence Against Women Act."
}
*/