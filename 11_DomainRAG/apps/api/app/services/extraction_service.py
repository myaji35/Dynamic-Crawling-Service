from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel
from app.core.config import get_settings
from app.models.graph import GraphData

settings = get_settings()

class ExtractionService:
    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model="gpt-4o", # Or gpt-3.5-turbo for cost savings
            temperature=0
        )
        self.extraction_chain = self._build_chain()

    def _build_chain(self):
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert at extracting knowledge graph data from text.
            Extract the following entities and relationships:
            - Entities: Person, Organization, Project, Topic, Date
            - Relationships: MENTIONS, WORKING_ON, RELATED_TO, AUTHORED, DEADLINE_IS
            
            Make sure to resolve pronouns and ambiguous references where possible.
            Return the output in the specified JSON format."""),
            ("user", "{text}")
        ])
        
        return prompt | self.llm.with_structured_output(GraphData)

    async def extract(self, text: str) -> GraphData:
        return await self.extraction_chain.ainvoke({"text": text})
