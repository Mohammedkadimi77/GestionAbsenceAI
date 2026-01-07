from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles


from app.db.mongo import init_mongo
from app.api.auth import router as auth_router
from app.api.teacher import router as teacher_router
from app.api.dev import router as dev_router   # 👈 import OK
from app.api.ai import router as ai_router
from app.api.admin import router as admin_router
from app.api.admin_import import router as admin_import_router
from app.api.student import router as student_router
from app.api.ai_explain import router as ai_explain_router
from app.api.ai_train import router as ai_train_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Gestion Absences + IA (MongoDB)")

@app.on_event("startup")
async def on_startup():
    await init_mongo()

app.include_router(auth_router)
app.include_router(teacher_router)
app.include_router(dev_router)  
app.include_router(ai_router)
app.include_router(admin_router)
app.include_router(admin_import_router)
app.include_router(student_router)
app.include_router(ai_explain_router)
app.include_router(ai_train_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")



@app.get("/")
def health():
    return {"status": "ok"}



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)