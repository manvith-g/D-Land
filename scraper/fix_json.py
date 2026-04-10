import json, os, re
import PyPDF2

for fname in ["006813", "006996", "007269", "007871", "008338", "99001360"]:
    pdf_path = f"pdfs/{fname}.pdf"
    json_path = f"json/{fname}.json"
    
    with open(json_path) as f:
        data = json.load(f)
        
    print(f"Processing {fname}...")
    try:
        text = ""
        with open(pdf_path, "rb") as pdf_file:
            reader = PyPDF2.PdfReader(pdf_file)
            for p in reader.pages:
                t = p.extract_text()
                if t: text += t + " "
    except Exception as e:
        print("err", e)
        continue

    text = re.sub(r"[ \t]{2,}", " ", text)
    text = text.replace("\n", " ")

    def extract(pattern, is_int=False):
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            if is_int:
                return int(re.sub(r"[^\d]", "", val))
            return val
        return None

    # Fixes based on new PDF layout:
    if data["promoter_info"]["type"] is None:
        data["promoter_info"]["type"] = extract(r"Type of Firm\s*:\s*([A-Za-z]+)")
    if data["promoter_info"]["pan"] is None:
        data["promoter_info"]["pan"] = extract(r"PAN\s*:\s*([A-Z0-9]{10})")
    if data["project_identity"]["project_status"] is None:
        data["project_identity"]["project_status"] = extract(r"Project Status\s*:\s*([A-Za-z ]+?)\s+Project")
    if data["project_identity"]["approving_authority"] is None:
        v = extract(r"Approving Authority\s*:\s*(.*?)(?=\s+No\.)")
        if v: data["project_identity"]["approving_authority"] = v
    if data["promoter_info"]["authorized_signatory"] is None:
        data["promoter_info"]["authorized_signatory"] = extract(r"Name of Authorized Signatory\s*:\s*([A-Za-z ]+?)\s+Board")
    if data["escrow_account"]["ifsc"] is None:
        data["escrow_account"]["ifsc"] = extract(r"IFSC Code\s*:\s*([A-Z0-9]+)")
    if data["financials"]["land_cost"] is None:
        data["financials"]["land_cost"] = extract(r"Cost of Land \(INR\) \(C1\)\s*([\d]+)", True)
    if data["financials"]["estimated_construction_cost"] is None:
        data["financials"]["estimated_construction_cost"] = extract(r"Cost of Layout Development \(INR\) \(C2\)\s*([\d]+)", True)
    if data["financials"]["total_project_cost"] is None:
        data["financials"]["total_project_cost"] = extract(r"Total Project Cost \(INR\) \(C1\+C2\)\s*:\s*([\d]+)", True)
    if data["inventory"]["parking_for_sale_count"] is None:
        data["inventory"]["parking_for_sale_count"] = extract(r"No\. of Covered Parking\s*:\s*([\d]+)", True)
    if data["inventory"]["garages_for_sale"] is None:
        data["inventory"]["garages_for_sale"] = extract(r"No\. of Garage\s*:\s*([\d]+)", True)
    if data["inventory"]["parking_area_sq_m"] is None:
        val = extract(r"Area Of Covered Parking \(Sq Mtr\)\s*:\s*([\d.]+)")
        if val: data["inventory"]["parking_area_sq_m"] = float(val)
        
    with open(json_path, "w") as f:
        json.dump(data, f, indent=2)

print("Done fixing jsons.")
