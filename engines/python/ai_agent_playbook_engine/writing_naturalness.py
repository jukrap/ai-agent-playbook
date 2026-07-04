from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

MAX_FINDINGS = 30


@dataclass(frozen=True)
class Rule:
    id: str
    language: str
    category: str
    severity: str
    pattern: re.Pattern[str]
    message: str
    suggestion: str


RULES = [
    Rule(
        "python.writing.ko.repeated-template-ending",
        "ko",
        "translationese",
        "medium",
        re.compile(r"(할 수 있습니다|것으로 보입니다|제공됩니다|진행됩니다|수행됩니다|처리됩니다|구성됩니다)"),
        "반복되는 가능/수동 표현이 한국어 문장을 번역문처럼 만들 수 있습니다.",
        "가능하면 주어와 행동을 드러내고, 같은 어미가 반복되는 문장을 나누세요.",
    ),
    Rule(
        "python.writing.ko.nominalization",
        "ko",
        "sentence-shape",
        "low",
        re.compile(r"(\w+화|검토|진행|수행|처리|제공|구성)(을|를|이|가)?\s*(합니다|합니다\.|됩니다|됩니다\.)"),
        "명사화된 동작이 많으면 책임 주체와 행동이 흐려질 수 있습니다.",
        "명사형 표현을 동사로 바꾸거나, 실행 주체를 문장 앞에 두세요.",
    ),
    Rule(
        "python.writing.ko.connector-template",
        "ko",
        "flow",
        "low",
        re.compile(r"(이를 통해|뿐만 아니라|또한|따라서|관점에서|측면에서|바탕으로)"),
        "템플릿형 연결어가 반복되어 문단 흐름이 기계적으로 보일 수 있습니다.",
        "연결어를 줄이고 문장 순서, 주어, 구체적인 결과로 흐름을 만드세요.",
    ),
    Rule(
        "python.writing.en.ai-register",
        "en",
        "naturalness",
        "medium",
        re.compile(r"\b(delves? into|realm|landscape|it is important to note|seamless|robust|comprehensive|powerful|transformative)\b", re.I),
        "Common AI-writing register appears in the text.",
        "Replace broad framing or praise with concrete behavior, limits, or evidence.",
    ),
    Rule(
        "python.writing.en.participle-padding",
        "en",
        "sentence-shape",
        "low",
        re.compile(r",\s+(ensuring|enabling|allowing|highlighting|underscoring)\b", re.I),
        "Comma-led participle clauses can pad prose without adding a decision.",
        "Turn the clause into a direct action or remove it if it repeats the prior claim.",
    ),
]


def analyze_writing_naturalness(payload: dict[str, Any]) -> dict[str, Any]:
    if payload.get("ok") is False and payload.get("conflicts"):
        return payload

    text = payload.get("text")
    if not isinstance(text, str):
        text = ""
    requested = payload.get("lang") if payload.get("lang") in {"auto", "ko", "en"} else "auto"
    analysis_text = normalize_prose_for_analysis(text)
    detected = detect_language(analysis_text or text)
    language = detected if requested == "auto" else requested
    optional = optional_capabilities()
    sentences = split_sentences(analysis_text, language, optional)
    findings: list[dict[str, Any]] = []
    findings.extend(pattern_findings(analysis_text, language))
    findings.extend(sentence_shape_findings(analysis_text, language, sentences))
    if language == "ko":
        findings.extend(korean_density_findings(analysis_text))

    findings = findings[:MAX_FINDINGS]
    return {
        "schemaVersion": "1",
        "kind": "python.writing-naturalness",
        "ok": True,
        "engine": {
            "name": "python",
            "optionalCapabilities": optional,
        },
        "language": {
            "requested": requested,
            "detected": detected,
            "analyzed": language,
        },
        "summary": {
            "characters": len(text),
            "sentences": len(sentences),
            "findings": len(findings),
        },
        "findings": findings,
        "warnings": [],
        "conflicts": [],
    }


def optional_capabilities() -> dict[str, bool]:
    capabilities = {"kss": False, "kiwipiepy": False}
    try:
        import kss  # noqa: F401

        capabilities["kss"] = True
    except Exception:
        capabilities["kss"] = False
    try:
        import kiwipiepy  # noqa: F401

        capabilities["kiwipiepy"] = True
    except Exception:
        capabilities["kiwipiepy"] = False
    return capabilities


def detect_language(text: str) -> str:
    hangul = len(re.findall(r"[\uac00-\ud7af]", text))
    latin = len(re.findall(r"[A-Za-z]", text))
    if hangul >= 20 and hangul >= latin / 2:
        return "ko"
    return "en"


def normalize_prose_for_analysis(text: str) -> str:
    normalized: list[str] = []
    fenced = False
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fenced = not fenced
            normalized.append("")
            continue
        if fenced or is_non_prose_line(stripped):
            normalized.append("")
            continue
        line = re.sub(r"`[^`]*`", " ", line)
        line = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", line)
        line = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line)
        line = re.sub(r"https?://\S+", " ", line)
        line = re.sub(r"<[^>]+>", " ", line)
        normalized.append(line)
    return "\n".join(normalized)


def is_non_prose_line(stripped: str) -> bool:
    if not stripped:
        return True
    if re.match(r"^</?[a-z][^>]*>$", stripped, re.I):
        return True
    if re.match(r"^<img\b", stripped, re.I):
        return True
    if re.match(r"^\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)$", stripped):
        return True
    if re.match(r"^!\[[^\]]*\]\([^)]+\)$", stripped):
        return True
    if re.match(r"^\|?[\s:|.-]+\|?$", stripped):
        return True
    if re.match(r"^(?:npm|pnpm|yarn|node|python|py|aapb|npx|git|rg|pwsh|powershell|curl)\s", stripped):
        return True
    if re.match(r"^[A-Za-z]:[\\/]", stripped) or re.match(r"^\.?[\\/]", stripped):
        return True
    return False


def split_sentences(text: str, language: str, optional: dict[str, bool]) -> list[str]:
    if language == "ko" and optional.get("kss"):
        try:
            import kss

            return [sentence.strip() for sentence in kss.split_sentences(text) if len(sentence.strip()) >= 12]
        except Exception:
            pass
    pattern = r"[.!?。]\s+|\n+" if language == "ko" else r"[.!?]\s+|\n+"
    return [sentence.strip() for sentence in re.split(pattern, text) if len(sentence.strip()) >= 20]


def pattern_findings(text: str, language: str) -> list[dict[str, Any]]:
    findings = []
    lines = text.splitlines()
    for rule in [item for item in RULES if item.language == language]:
        evidence = []
        for index, line in enumerate(lines, start=1):
            if rule.pattern.search(line):
                evidence.append({"line": index, "excerpt": compact(line)})
            if len(evidence) >= 5:
                break
        if evidence:
            findings.append({
                "id": rule.id,
                "engine": "python",
                "category": rule.category,
                "severity": rule.severity,
                "message": rule.message,
                "suggestion": rule.suggestion,
                "evidence": evidence,
            })
    return findings


def sentence_shape_findings(text: str, language: str, sentences: list[str]) -> list[dict[str, Any]]:
    if len(sentences) < 4:
        return []
    lengths = [len(sentence) for sentence in sentences]
    average = sum(lengths) / len(lengths)
    findings = []
    long_limit = 95 if language == "ko" else 160
    long_sentences = [sentence for sentence in sentences if len(sentence) > long_limit]
    if long_sentences:
        findings.append({
            "id": f"python.writing.{language}.long-sentence",
            "engine": "python",
            "category": "readability",
            "severity": "low",
            "message": "긴 문장이 있어 핵심 행동이나 조건이 묻힐 수 있습니다." if language == "ko" else "Long sentences may hide the main action or caveat.",
            "suggestion": "조건, 행동, 예외를 나누어 더 짧은 문장으로 정리하세요." if language == "ko" else "Split conditions, action, and caveats into shorter sentences.",
            "evidence": [{"line": line_number(text, sentence), "excerpt": compact(sentence)} for sentence in long_sentences[:3]],
        })
    variance = sum((length - average) ** 2 for length in lengths) / len(lengths)
    if average > 0 and variance ** 0.5 < average * 0.18:
        findings.append({
            "id": f"python.writing.{language}.uniform-rhythm",
            "engine": "python",
            "category": "rhythm",
            "severity": "low",
            "message": "문장 길이가 지나치게 비슷해 리듬이 기계적으로 보일 수 있습니다." if language == "ko" else "Sentence lengths are very similar, which can make the rhythm feel mechanical.",
            "suggestion": "중요한 결정은 짧게 두고, 설명 문장은 필요할 때만 풀어 쓰세요." if language == "ko" else "Keep key decisions short and expand only when the explanation needs it.",
            "evidence": [{"line": line_number(text, sentence), "excerpt": compact(sentence)} for sentence in sentences[:3]],
        })
    return findings


def korean_density_findings(text: str) -> list[dict[str, Any]]:
    hangul_words = re.findall(r"[\uac00-\ud7af]+", text)
    latin_words = re.findall(r"\b[A-Za-z][A-Za-z0-9_-]{2,}\b", text)
    if len(hangul_words) < 30:
        return []
    ratio = len(latin_words) / max(len(hangul_words), 1)
    if ratio <= 0.16:
        return []
    return [{
        "id": "python.writing.ko.english-term-density",
        "engine": "python",
        "category": "readability",
        "severity": "medium",
        "message": "한국어 문서 안의 영어 용어 비율이 높습니다.",
        "suggestion": "식별자와 고유명사는 보존하되, 설명 가능한 용어는 처음에만 병기하고 이후에는 한국어 역할명으로 줄이세요.",
        "evidence": [{"line": line_number(text, word), "excerpt": word} for word in latin_words[:5]],
    }]


def line_number(text: str, excerpt: str) -> int:
    index = text.find(excerpt)
    if index < 0:
        return 1
    return text[:index].count("\n") + 1


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())[:180]
