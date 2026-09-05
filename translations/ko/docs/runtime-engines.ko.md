# 런타임 엔진

Node.js ESM을 CLI·MCP 런타임으로 유지합니다. 공개 최소 요구사항은 Node 18 이상이며 개발·플랫폼 검증은 실제 실행 버전을 명시합니다. TypeScript는 개발 검사 도구이며 런타임 분석 엔진이 아닙니다. 종료한 분석 명령과 함께 AST-grep·PNG diff 의존성을 제거했습니다.

선택형 Python 3.11 이상 글쓰기 엔진의 기존 인터프리터 선택과 JS fallback을 유지합니다. CLI는 기본 JS를 사용하고 --engine auto·python으로 Python 탐색을 선택합니다. npm prerelease의 Python metadata는 대응하는 PEP 440 개발 버전을 사용합니다. 런타임은 모델 추론이나 새 서비스를 요구하지 않습니다.
