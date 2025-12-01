"""Quick sanity check script to test database setup."""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, get_db, engine
from app.models.db_models import User, ParseResult, Base
from sqlalchemy.orm import Session

def test_database():
    """Test database initialization and basic operations."""
    print("Testing database setup...")
    print("-" * 50)
    
    # 1. Test database initialization
    print("1. Initializing database...")
    try:
        init_db()
        print("   ✓ Database initialized successfully")
    except Exception as e:
        print(f"   ✗ Failed to initialize database: {e}")
        return False
    
    # 2. Check if tables exist
    print("\n2. Checking if tables exist...")
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"   Found tables: {tables}")
        if "users" in tables and "parse_results" in tables:
            print("   ✓ All required tables exist")
        else:
            print("   ✗ Missing required tables")
            return False
    except Exception as e:
        print(f"   ✗ Failed to check tables: {e}")
        return False
    
    # 3. Test creating a user (then delete it)
    print("\n3. Testing User model...")
    try:
        db = next(get_db())
        test_user = User(
            email="test@example.com",
            hashed_password="test_hash_12345"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"   ✓ Created test user with ID: {test_user.id}")
        print(f"   ✓ User email: {test_user.email}")
        print(f"   ✓ User created_at: {test_user.created_at}")
        
        # Clean up - delete the test user
        db.delete(test_user)
        db.commit()
        print("   ✓ Test user deleted successfully")
    except Exception as e:
        print(f"   ✗ Failed to test User model: {e}")
        return False
    finally:
        db.close()
    
    # 4. Test database file exists
    print("\n4. Checking database file...")
    db_file = "csi_parse.db"
    if os.path.exists(db_file):
        size = os.path.getsize(db_file)
        print(f"   ✓ Database file exists: {db_file} ({size} bytes)")
    else:
        print(f"   ✗ Database file not found: {db_file}")
        return False
    
    print("\n" + "-" * 50)
    print("✓ All tests passed! Database setup is working correctly.")
    return True

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)

