from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    source = Column(String(200))
    severity = Column(Enum('High', 'Medium', 'Low', name="severity_enum"), nullable=False, index=True)
    sector = Column(Enum('Banking', 'Government', 'Infrastructure', 'General', name="sector_enum"), nullable=False, index=True)
    link = Column(Text, nullable=False)
    link_hash = Column(String(64), nullable=False, unique=True)
    origin = Column(String(100))
    published_at = Column(DateTime, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
