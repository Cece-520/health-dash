from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

MEDLINEPLUS_SEARCH_URL = "https://wsearch.nlm.nih.gov/ws/query"


@router.get("/info")
async def get_symptom_info(name: str):
    """
    Uses MedlinePlus web search API — works with plain English symptom names.
    """
    params = {
        "db": "healthTopics",
        "term": name,
        "retmax": 3,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                MEDLINEPLUS_SEARCH_URL, params=params, timeout=10.0
            )
            response.raise_for_status()

            # Parse XML response
            import xml.etree.ElementTree as ET
            root = ET.fromstring(response.text)

            results = []
            for doc in root.findall(".//document"):
                title_el = doc.find(".//content[@name='title']")
                snippet_el = doc.find(".//content[@name='FullSummary']")
                url = doc.get("url", "")

                title = title_el.text if title_el is not None else ""
                summary = snippet_el.text if snippet_el is not None else ""

                # Strip HTML tags from summary
                import re
                summary = re.sub(r"<[^>]+>", "", summary or "")

                if title:
                    results.append({
                        "title": title,
                        "summary": summary[:400] + "..." if len(summary) > 400 else summary,
                        "url": url,
                    })

            return {
                "symptom": name,
                "source": "MedlinePlus — U.S. National Library of Medicine",
                "disclaimer": "This information is for educational purposes only. Always consult a healthcare professional.",
                "results": results,
            }

        except httpx.HTTPError:
            raise HTTPException(
                status_code=502, detail="Could not reach MedlinePlus API"
            )