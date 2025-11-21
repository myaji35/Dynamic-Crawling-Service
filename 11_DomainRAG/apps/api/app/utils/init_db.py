from app.core.database import db

def create_vector_index():
    session = db.get_session()
    try:
        # Create Vector Index for Document chunks
        session.run("""
        CREATE VECTOR INDEX document_embedding IF NOT EXISTS
        FOR (d:Document)
        ON (d.embedding)
        OPTIONS {indexConfig: {
         `vector.dimensions`: 1536,
         `vector.similarity_function`: 'cosine'
        }}
        """)
        
        # Create Vector Index for Email chunks
        session.run("""
        CREATE VECTOR INDEX email_embedding IF NOT EXISTS
        FOR (e:Email)
        ON (e.embedding)
        OPTIONS {indexConfig: {
         `vector.dimensions`: 1536,
         `vector.similarity_function`: 'cosine'
        }}
        """)
        print("Vector indexes created successfully.")
    except Exception as e:
        print(f"Error creating vector indexes: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    db.connect()
    create_vector_index()
    db.close()
