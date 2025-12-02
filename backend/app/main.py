from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers.health import router as health_router
from app.routers.parse import router as parse_router
from app.routers.auth import router as auth_router

app = FastAPI(title='CSI Parse API', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

app.include_router(health_router, prefix='/api/v1')
app.include_router(auth_router, prefix='/api/v1')
app.include_router(parse_router, prefix='/api/v1')
