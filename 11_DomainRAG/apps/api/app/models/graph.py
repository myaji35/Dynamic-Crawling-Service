from typing import List, Optional
from pydantic import BaseModel, Field

class Node(BaseModel):
    id: str = Field(description="Unique identifier for the node, usually the name or a specific ID")
    type: str = Field(description="Type of the node, e.g., 'Person', 'Organization', 'Topic', 'Project'")
    properties: dict = Field(default_factory=dict, description="Additional properties of the node")

class Relationship(BaseModel):
    source: str = Field(description="ID of the source node")
    target: str = Field(description="ID of the target node")
    type: str = Field(description="Type of the relationship, e.g., 'MENTIONS', 'AUTHORED', 'RELATED_TO'")
    properties: dict = Field(default_factory=dict, description="Additional properties of the relationship")

class GraphData(BaseModel):
    nodes: List[Node]
    relationships: List[Relationship]
