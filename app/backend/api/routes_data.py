"""
Data Ingestion, Quality Auditing, and NCBI Genomics API Routes
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import json
from pathlib import Path
from app.backend.config import SAMPLE_DATA_DIR, PROCESSED_DATA_DIR
from app.backend.database.connection import get_db
from app.backend.database.models import NCBIGenomeRecord, AuditLogRecord
from app.backend.ml.preprocessor import DataQualityEngine
from app.backend.ncbi.ncbi_client import ncbi_client
from app.backend.schemas.pydantic_models import NCBIGenomeRequest

router = APIRouter(prefix="/data", tags=["Data Management"])

@router.get("/datasets")
def list_datasets():
    """Lists preloaded research cohorts and uploaded datasets."""
    files = []
    for p in SAMPLE_DATA_DIR.glob("*.csv"):
        df = pd.read_csv(p)
        files.append({
            "name": p.name,
            "type": "SAMPLE_RESEARCH_COHORT",
            "samples": len(df),
            "features_count": len(df.columns) - 2,
            "target": "disease_risk_label" if "disease_risk_label" in df.columns else "unknown"
        })
    return {"datasets": files}

@router.get("/audit/{dataset_name}")
def audit_dataset(dataset_name: str):
    """Executes clinical data quality evaluation."""
    file_path = SAMPLE_DATA_DIR / dataset_name
    if not file_path.exists():
        file_path = PROCESSED_DATA_DIR / dataset_name
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_name} not found.")

    try:
        df = pd.read_csv(file_path)
        audit_res = DataQualityEngine.audit_dataset(df)
        return audit_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data audit failed: {str(e)}")

@router.post("/ncbi/fetch")
def fetch_ncbi_genomics(payload: NCBIGenomeRequest, db: Session = Depends(get_db)):
    """
    Fetches real NCBI assembly report for reference accession (e.g. GRCh38 human genome).
    Parses key genomic indicators and stores record into database.
    """
    try:
        report_raw = ncbi_client.fetch_assembly_report(payload.accession)
        features = ncbi_client.extract_genomic_features(report_raw)

        # Store or update in DB
        rec = db.query(NCBIGenomeRecord).filter(NCBIGenomeRecord.accession == features["accession"]).first()
        if not rec:
            rec = NCBIGenomeRecord(
                accession=features["accession"],
                organism_name=features["organism_name"],
                tax_id=features["tax_id"],
                assembly_level=features["assembly_level"],
                gc_percent=features["gc_percent"],
                contig_n50=features["contig_n50"],
                total_sequence_length=features["total_sequence_length"],
                coding_genes=features["coding_genes"],
                busco_completeness=features["busco_completeness"],
                raw_json=json.dumps(report_raw)
            )
            db.add(rec)
        else:
            rec.gc_percent = features["gc_percent"]
            rec.contig_n50 = features["contig_n50"]
            rec.coding_genes = features["coding_genes"]
            rec.busco_completeness = features["busco_completeness"]

        import uuid
        # Audit log
        db.add(AuditLogRecord(
            log_id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
            user_role="RESEARCHER",
            action="NCBI_GENOMICS_FETCH",
            record_id=payload.accession,
            details_json=json.dumps({"accession": payload.accession, "organism": features["organism_name"]})
        ))
        db.commit()

        return {
            "status": "SUCCESS",
            "accession": features["accession"],
            "organism": features["organism_name"],
            "features": features,
            "reports_count": len(report_raw.get("reports", [])),
            "data_source": "NCBI Datasets v2alpha REST API"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"NCBI fetch error: {str(e)}")

@router.get("/ncbi/records")
def get_ncbi_records(db: Session = Depends(get_db)):
    """Lists saved NCBI genome records."""
    records = db.query(NCBIGenomeRecord).all()
    return [
        {
            "accession": r.accession,
            "organism_name": r.organism_name,
            "gc_percent": r.gc_percent,
            "contig_n50": r.contig_n50,
            "coding_genes": r.coding_genes,
            "busco_completeness": r.busco_completeness,
            "fetched_at": r.fetched_at.isoformat() if r.fetched_at else None
        }
        for r in records
    ]
