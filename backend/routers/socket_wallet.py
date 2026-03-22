from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict
import asyncio

# Импортируем нашу базу и модель юзера
from database import get_db
from models import User

router = APIRouter(tags=["Realtime & Webhooks"])
