from app.core.database import db
from app.models.graph import GraphData

class GraphService:
    def save_graph_data(self, data: GraphData, source_doc_id: str):
        session = db.get_session()
        try:
            # 1. Merge Nodes
            for node in data.nodes:
                query = f"""
                MERGE (n:{node.type} {{id: $id}})
                SET n += $props
                """
                session.run(query, {"id": node.id, "props": node.properties})

            # 2. Merge Relationships
            for rel in data.relationships:
                # We assume nodes already exist or are created above.
                # We need to know the types of source/target to match efficiently, 
                # but for generic extraction we might have to do a broad match or pass types in relationship data.
                # Simplified approach: Match by ID (assuming IDs are unique across types or we know types)
                
                # Ideally, the extraction should provide types for source and target in the relationship
                # For this PoC, we will try to match any node with the ID.
                query = f"""
                MATCH (s {{id: $source_id}})
                MATCH (t {{id: $target_id}})
                MERGE (s)-[r:{rel.type}]->(t)
                SET r += $props
                """
                session.run(query, {
                    "source_id": rel.source, 
                    "target_id": rel.target, 
                    "props": rel.properties
                })
            
            # 3. Link to Source Document
            # Connect all extracted nodes to the source document
            for node in data.nodes:
                query = """
                MATCH (d:Document {id: $doc_id})
                MATCH (n {id: $node_id})
                MERGE (d)-[:MENTIONS]->(n)
                """
                session.run(query, {"doc_id": source_doc_id, "node_id": node.id})
                
        except Exception as e:
            print(f"Error saving graph data: {e}")
            raise e
        finally:
            session.close()
