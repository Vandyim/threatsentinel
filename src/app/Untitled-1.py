# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class ThreatSentinel(gl.Contract):
    # This is the blockchain's memory — stores past verdicts
    verdicts: TreeMap[str, str]

    def __init__(self):
        self.verdicts = TreeMap()

    @gl.public.view
    def get_verdict(self, url: str) -> str:
        # Returns a saved verdict, or empty string if never checked
        return self.verdicts.get(url, "")

    @gl.public.write
    def check_url(self, url: str):
        # Step 1: fetch the webpage content from the real internet
        def fetch_and_judge():
            try:
                page = gl.nondet.web.render(url, mode='html')
                # Only grab the first 3000 characters so we don't overload the AI
                snippet = page[:3000]
            except:
                snippet = "Could not load page"

            # Step 2: ask the AI to judge it
            prompt = f"""
            You are a cybersecurity expert. Analyze this webpage content and decide if the URL is safe.

            URL: {url}
            Page content snippet:
            {snippet}

            Reply with a JSON object with exactly these keys:
            - "verdict": one of "safe", "phishing", or "malicious"
            - "reason": one sentence explaining why (max 20 words)
            - "confidence": a number from 1 to 100
            """
            return gl.nondet.exec_prompt(prompt, response_format='json')

        def validate_result(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata
            # Make sure the AI gave us the right shape of answer
            return (
                isinstance(data, dict)
                and data.get("verdict") in ("safe", "phishing", "malicious")
                and isinstance(data.get("reason"), str)
                and isinstance(data.get("confidence"), (int, float))
            )

        result = gl.vm.run_nondet_unsafe(fetch_and_judge, validate_result)

        # Step 3: store the verdict on the blockchain
        verdict_str = json.dumps(result)
        self.verdicts[url] = verdict_str