#!/usr/bin/env python3
"""
RERA PDF Extractor
Reads RERA project registration PDFs and outputs structured JSON files.
"""

import json
import os
import re
import pdfplumber

PDF_DIR = os.path.join(os.path.dirname(__file__), "pdfs")
OUT_DIR = os.path.join(os.path.dirname(__file__), "json")


def extract_text(pdf_path: str) -> str:
    """Extract and concatenate text from all pages, normalizing whitespace."""
    parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                parts.append(t)
    return "\n".join(parts)


def clean(text: str) -> str:
    """Normalize multi-line field values (PDFs split long lines at ~30 chars)."""
    # Join lines that were broken by PDF column rendering
    text = re.sub(r"\n(?=[a-z0-9/,.()\-\s])", " ", text)
    # Collapse multiple spaces / stray whitespace inside a value
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text


def field(pattern: str, text: str, group: int = 1):
    """Return first regex match group or None."""
    m = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    return m.group(group).strip() if m else None


def int_field(pattern: str, text: str) -> int | None:
    v = field(pattern, text)
    if v is None:
        return None
    v = re.sub(r"[,\s]", "", v)
    try:
        return int(v)
    except ValueError:
        return None


def float_field(pattern: str, text: str) -> float | None:
    v = field(pattern, text)
    if v is None:
        return None
    v = re.sub(r"[,\s]", "", v)
    try:
        return float(v)
    except ValueError:
        return None


def parse_date(raw: str | None) -> str | None:
    """Convert DD-MM-YYYY → YYYY-MM-DD (ISO)."""
    if not raw:
        return None
    m = re.match(r"(\d{2})-(\d{2})-(\d{4})", raw.strip())
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    return raw.strip()


def extract(pdf_path: str) -> dict:
    raw = extract_text(pdf_path)
    t = clean(raw)          # for most fields (cleaned)

    # ------------------------------------------------------------------
    # metadata
    # ------------------------------------------------------------------
    ack = field(r"Acknowledgement Number\s*:\s*(PR/[^\s]+)", t)
    reg = field(r"Registration Number\s*:\s*(PRM/[^\s]+)", t)
    doc_type = field(r"(Project Registration Details)", t)

    # ------------------------------------------------------------------
    # project identity
    # ------------------------------------------------------------------
    proj_name = field(r"Project Name\s*:\s*([^\n]+)", t)
    proj_type = field(r"Project Type\s*:\s*([^\n]+)", t)
    proj_status = field(r"Project Status\s*:\s*(Completed|Ongoing)", t)
    approving_auth = field(r"Approving Authority\s*:\s*([^\n]+?)(?=No of Garage)", t)

    # ------------------------------------------------------------------
    # promoter
    # ------------------------------------------------------------------
    promoter_type = field(r"Promoter Type\s*:\s*([^\n]+)", t)
    promoter_name = field(r"(?:Promoter Type[^\n]*\n|Name\s*:\s*)([^\n]+LLP|[^\n]+Ltd|[^\n]+Private Limited|[^\n]+Partnership)", t)
    # more reliable: pick the Name that comes after Promoter Details section
    pm = re.search(r"Promoter Details.*?Name\s*:\s*([^\n]+)", t, re.DOTALL | re.IGNORECASE)
    if pm:
        promoter_name = pm.group(1).strip()
    pan = field(r"PAN Number\s*:\s*([A-Z]{5}[0-9]{4}[A-Z])", t)
    auth_sig = field(r"Authorized Signatory Detail\s*Name\s*:\s*([^\n]+)", t)

    # ------------------------------------------------------------------
    # timeline
    # ------------------------------------------------------------------
    start_date_raw = field(r"Project Start Date\s*:\s*([\d\-]+)", t)
    proposed_raw = field(r"Proposed Project Completion Date\s*:\s*([\d\-]+)", t)
    # fallback  from the registration block
    if not start_date_raw:
        start_date_raw = field(r"At the time of Registration\s+([\d\-]+)\s+([\d\-]+)", t, 1)
    if not proposed_raw:
        proposed_raw = field(r"At the time of Registration\s+([\d\-]+)\s+([\d\-]+)", t, 2)

    # ------------------------------------------------------------------
    # construction metrics
    # ------------------------------------------------------------------
    land_area = float_field(r"Total Area Of Land \(Sq Mtr\)\s*:\s*([\d.,]+)", t)
    covered_area = float_field(r"Total Coverd Area \(Sq Mtr\)\s*:\s*([\d.,]+)", t)
    open_area = float_field(r"Total Open Area \(Sq Mtr\)\s*:\s*([\d.,]+)", t)
    dev_carried = float_field(r"Extent of development carried till date\s*:\s*([\d.]+)\s*%", t)
    dev_pending = float_field(r"Extent of development pending\s*:\s*([\d.]+)\s*%", t)

    # ------------------------------------------------------------------
    # financials
    # ------------------------------------------------------------------
    est_cost = int_field(r"Estimated Cost of Construction \(INR\)\s*:\s*([\d,]+)", t)
    land_cost = int_field(r"Cost of Land \(INR\)\s*:\s*([\d,]+)", t)
    total_cost = int_field(r"Total Project Cost \(INR\)\s*:\s*([\d,]+)", t)
    amt_collected = int_field(r"Total amount of money collected from allottee\s*:\s*([\d,]+)", t)
    amt_used = int_field(r"Total amount of money used for development of project\s*:\s*([\d,]+)", t)

    # ------------------------------------------------------------------
    # escrow account
    # ------------------------------------------------------------------
    bank_name = field(r"Bank Name\s*:\s*([^\n]+)", t)
    branch = field(r"Branch\s*:\s*([^\n]+)", t)
    ifsc = field(r"ifscCode\s*:\s*([A-Z0-9]+)", t)
    acct = field(r"Account No\.\(70% Account\)\s*:\s*([\d]+)", t)

    # ------------------------------------------------------------------
    # inventory
    # ------------------------------------------------------------------
    parking_count = int_field(r"No of Parking for Sale\s*:\s*([\d]+)", t)
    parking_area = float_field(r"Area of Parking for Sale \(Sq Mtr\)\s*:\s*([\d.]+)", t)
    garages = int_field(r"No of Garage for Sale\s*:\s*([\d]+)", t)

    return {
        "metadata": {
            "acknowledgement_number": ack,
            "registration_number": reg,
            "document_type": doc_type,
        },
        "project_identity": {
            "project_name": proj_name,
            "project_type": proj_type,
            "project_status": proj_status,
            "approving_authority": approving_auth.strip() if approving_auth else None,
        },
        "promoter_info": {
            "name": promoter_name,
            "type": promoter_type,
            "pan": pan,
            "authorized_signatory": auth_sig,
        },
        "timeline": {
            "start_date": parse_date(start_date_raw),
            "proposed_completion": parse_date(proposed_raw),
        },
        "construction_metrics": {
            "total_land_area_sq_m": land_area,
            "total_covered_area_sq_m": covered_area,
            "total_open_area_sq_m": open_area,
            "development_carried_till_date_pct": dev_carried,
            "development_pending_pct": dev_pending,
        },
        "financials": {
            "estimated_construction_cost": est_cost,
            "land_cost": land_cost,
            "total_project_cost": total_cost,
            "amount_collected_from_allottees": amt_collected,
            "amount_used_for_development": amt_used,
        },
        "escrow_account": {
            "bank_name": bank_name,
            "branch": branch,
            "ifsc": ifsc,
            "account_number": acct,
        },
        "inventory": {
            "parking_for_sale_count": parking_count,
            "parking_area_sq_m": parking_area,
            "garages_for_sale": garages,
        },
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    pdf_files = sorted(f for f in os.listdir(PDF_DIR) if f.endswith(".pdf"))

    for fname in pdf_files:
        stem = os.path.splitext(fname)[0]
        pdf_path = os.path.join(PDF_DIR, fname)
        out_path = os.path.join(OUT_DIR, f"{stem}.json")

        print(f"Processing {fname} ...", end=" ", flush=True)
        try:
            data = extract(pdf_path)
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"→ {out_path}")
        except Exception as e:
            print(f"ERROR: {e}")


if __name__ == "__main__":
    main()
