from typing import TypedDict, List, Annotated
import operator
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, END
from app.core.config import get_settings
from app.core.database import db

settings = get_settings()

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    context: str

class RAGService:
    def __init__(self):
        self.llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY, model="gpt-4o")
        self.workflow = self._build_workflow()

    def _retrieve(self, state: AgentState):
        query = state["messages"][-1].content
        session = db.get_session()
        context_text = ""
        try:
            # 1. Vector Search (Simplified)
            # In a real app, use vector index query
            # result = session.run("CALL db.index.vector.queryNodes('document_embedding', 3, $embedding) ...")
            
            # 2. Graph Traversal (Simplified)
            # Find nodes related to keywords in query
            result = session.run("""
            MATCH (n:Document) 
            WHERE n.content CONTAINS $query
            RETURN n.content as content LIMIT 3
            """, {"query": query})
            
            docs = [record["content"] for record in result]
            context_text = "\n\n".join(docs)
            
            if not context_text:
                context_text = "No relevant documents found."
                
        except Exception as e:
            print(f"Error retrieving: {e}")
            context_text = "Error retrieving context."
        finally:
            session.close()
            
        return {"context": context_text}

    def _generate(self, state: AgentState):
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful assistant. Use the following context to answer the user's question.
            If the context doesn't contain the answer, say you don't know.
            
            Context:
            {context}
            """),
            ("user", "{question}")
        ])
        
        chain = prompt | self.llm | StrOutputParser()
        question = state["messages"][-1].content
        response = chain.invoke({"context": state["context"], "question": question})
        
        return {"messages": [AIMessage(content=response)]}

    def _build_workflow(self):
        workflow = StateGraph(AgentState)
        
        workflow.add_node("retrieve", self._retrieve)
        workflow.add_node("generate", self._generate)
        
        workflow.set_entry_point("retrieve")
        workflow.add_edge("retrieve", "generate")
        workflow.add_edge("generate", END)
        
        return workflow.compile()

    async def astream(self, message: str):
        inputs = {"messages": [HumanMessage(content=message)], "context": ""}
        async for event in self.workflow.astream_events(inputs, version="v1"):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    yield content
