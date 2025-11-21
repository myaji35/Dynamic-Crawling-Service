from fastapi import APIRouter, HTTPException
from app.core.database import db

router = APIRouter()

@router.get("/visualize")
async def get_graph_data(limit: int = 100):
    session = db.get_session()
    try:
        # Fetch nodes and relationships
        # Limiting to avoid overwhelming the UI
        query = """
        MATCH (n)-[r]->(m)
        RETURN n, r, m
        LIMIT $limit
        """
        result = session.run(query, {"limit": limit})
        
        nodes = {}
        links = []
        
        for record in result:
            n = record["n"]
            m = record["m"]
            r = record["r"]
            
            # Add nodes if not already added
            if n.element_id not in nodes:
                nodes[n.element_id] = {
                    "id": n.element_id,
                    "label": list(n.labels)[0] if n.labels else "Node",
                    "properties": dict(n)
                }
            if m.element_id not in nodes:
                nodes[m.element_id] = {
                    "id": m.element_id,
                    "label": list(m.labels)[0] if m.labels else "Node",
                    "properties": dict(m)
                }
            
            # Add link
            links.append({
                "source": n.element_id,
                "target": m.element_id,
                "type": r.type,
                "properties": dict(r)
            })
            
        return {
            "nodes": list(nodes.values()),
            "links": links
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()
