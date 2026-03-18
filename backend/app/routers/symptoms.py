from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

MEDLINEPLUS_URL = "https://connect.medlineplus.gov/service"


@router.get("/info")
async def get_symptom_info(name: str):
    """
    Proxies to MedlinePlus Connect API.
    No API key required — free public health data from the US National Library of Medicine.
    """
    params = {
        "mainSearchCriteria.v.cs": "2.16.840.1.113883.6.90",
        "mainSearchCriteria.v.dn": name,
        "informationRecipient.languageCode.c": "en",
        "knowledgeResponseType": "application/json",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(MEDLINEPLUS_URL, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            # Extract relevant entries from the MedlinePlus response
            entries = data.get("feed", {}).get("entry", [])
            results = [
                {
                    "title": e.get("title", {}).get("_value", ""),
                    "summary": e.get("summary", {}).get("_value", ""),
                    "url": e.get("link", [{}])[0].get("href", ""),
                }
                for e in entries[:3]  # Return top 3 results
            ]

            return {
                "symptom": name,
                "source": "MedlinePlus — U.S. National Library of Medicine",
                "disclaimer": "This information is for educational purposes only.",
                "results": results,
            }

        except httpx.HTTPError:
            raise HTTPException(
                status_code=502, detail="Could not reach MedlinePlus API"
            )