import fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http';
import {findingSessionFromTxt} from "./service/finderAllocator"
import {answerQuery} from "./index"
import fastifyCors from '@fastify/cors'


const server: FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({ logger: true });

server.register(fastifyCors, {
  origin: true, // Replace with your desired CORS configuration
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
})


interface PingBody {
    question: string;
    sessionId: string;
  }

server.get('/getResponse',(req,res)=>{
  res.code(200).send({wing:"happy"})
})
  
server.post<{
    Body: PingBody;
  }>('/getResponse', async(request, reply) => {
    //http://[::1]:8080/getResponse?sessionId=123455

    try{
      let {question,sessionId}=request.body;
      let sessionData=await findingSessionFromTxt(sessionId)
      //console.log(sessionData)
      let queryResponse= await answerQuery(question,sessionId,sessionData?sessionData:undefined)
      console.log(queryResponse,"response from langchain")
      reply.code(200).send({ pong: queryResponse,sessionId });
    }
    catch(err:any)
    {
      reply.code(500).send({pong:err.message})
    }

  });
  
  // Start your server
  server.listen({ port: 8080, host:'0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
     console.log(`server listening on ${address}`)
  });

  //http://[::1]:8080/getResponse
