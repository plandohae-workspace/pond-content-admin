# POND Admin — 콘텐츠 저작 및 검수 관리 시스템

## 프로젝트 소개

POND Admin은 콘텐츠 저작 과정에서 분산되어 있는 진행 현황, 검수 기록, 자료 링크와 일정을 한곳에서 관리하도록 설계한 웹 애플리케이션입니다. 여러 팀이 Lesson의 현재 작업 단계와 필요한 자료를 같은 화면 구조에서 확인할 수 있습니다.

콘텐츠는 **Level → Textbook → Unit → Lesson** 계층으로 관리합니다. 실제 회사 시스템이나 개인정보를 사용하지 않는 브라우저 기반 프로토타입이며, 가상의 샘플 데이터로 바로 체험할 수 있습니다. 외부 데이터베이스, 로그인 서버 또는 비밀키는 필요하지 않습니다.

## 주요 기능

### 1. 대시보드

- 전체 Lesson, 저작 진행 중, 저작 완료, 검수 미완료 Lesson의 KPI 4개를 집계합니다.
- 6개 Level별로 기존 정렬 순서의 첫 미완료 Lesson과 현재 저작 단계를 표시합니다. 전체 완료와 데이터 없음도 구분합니다.
- 1차 검수와 최종 검수의 실제 완료 여부를 각각 표시합니다. 오류 수정 상태를 검수 완료로 간주하지 않습니다.
- 월간 콘텐츠 일정 캘린더에 저작 마감·1차 검수·최종 검수 일정명을 직접 표시합니다. 월 이동, 유형별 필터, 더보기와 Lesson 상세 이동을 지원합니다. 저장된 날짜가 없는 일정은 생성하지 않습니다.

### 2. 저작 관리

- 사이드바의 **Level** 메뉴에서 저작 관리 화면을 엽니다. 기본 Level은 **ECP6m, ECP7m, ECP7, S1, MAG1, MAG2**입니다.
- Textbook·Unit 종속 필터와 검색을 제공하고, Lesson을 **저작 대기 / 저작 진행 / 저작 완료** 칸반 보드에 표시합니다.
- Lesson 카드를 클릭하면 상세 화면에서 일정, 담당자, 관련 자료와 변경 이력을 확인할 수 있습니다.
- 6단계 워크플로: **소스 제출 → 저작 작업 → 1차 검수 → 수정 작업 → 최종 검수 → 저작 완료**.
- 단계별 상태·예정 및 실제 날짜를 관리하고, 완료 단계 수 ÷ 6을 기준으로 진행률을 계산합니다.
- 드래그 앤 드롭으로 대기 Lesson의 소스 제출을 시작할 수 있습니다. 6단계가 모두 완료되어야 완료 영역에 표시됩니다. 완료 단계나 검수 기록이 있는 Lesson은 대기 복귀를 제한하여 기록을 보호합니다.

### 3. 검수 관리

- Level → Textbook → Unit → Lesson을 선택하고 **1st Review / Final Review** 기록을 구분해 관리합니다.
- 엑셀형 테이블에서 오류 1건을 1행으로 추가·수정·삭제합니다. Class·Activity 직접 입력, 오류 유형, STATUS와 처리 결과를 관리합니다.
- 스크린샷 파일 첨부와 클립보드 이미지 붙여넣기, 셀 내 미리보기와 클릭 확대를 지원합니다.
- Excel(.xlsx) 내보내기에 오류 데이터와 **실제 첨부 이미지**를 함께 포함합니다.
- 오류가 없는 Lesson도 별도의 확인 절차로 검수 완료를 관리합니다. 미해결 오류가 있는 검수 단계의 완료는 제한됩니다.

### 4. 자료 관리

- 왼쪽 Level 내비게이션에서 Level별 Google Drive 공유 폴더 바로가기를 관리합니다.
- 각 Level에 다음 **10개 공통 폴더**를 같은 순서로 표시하며 총 60개 링크를 독립적으로 저장합니다.

| 번호 | 폴더명 |
| --- | --- |
| 1 | POND Lesson Flow |
| 2 | Content Dev. List |
| 3 | Content Sample |
| 4 | Manuscript Prototype |
| 5 | Inputting Statements |
| 6 | VL |
| 7 | Multimedia Contents |
| 8 | Prototype Resources |
| 9 | Teacher's Tip |
| 10 | POND Resources |

- Admin 데모 역할에서 폴더별 URL 등록·수정·삭제가 가능합니다. 등록된 카드는 Google Drive를 새 탭에서 엽니다.
- HTTPS Google Drive 폴더 주소의 형식을 검증합니다. Windows 탐색기 경로(`G:\…`)는 등록할 수 없습니다.
- 실제 폴더 존재 여부나 접근 권한은 확인하지 않습니다. Google Drive API·로그인·동기화 기능은 구현하지 않았습니다.
- 이전에 등록한 자료와 첨부파일은 ‘기존 자료’ 영역에 보존합니다.

### 5. 사용자·권한

- 이름·이메일·소속 팀·역할로 사용자를 등록·수정하고, 중복 이메일을 검증합니다.
- 사용자 검색과 활성·비활성 전환을 지원합니다. 비활성화해도 과거 업무 기록은 삭제하지 않습니다.
- **Admin / Source Team / Authoring Team / QA Reviewer** 역할별 기능 권한표와 역할 전환 데모를 제공합니다.
- 현재는 **데모 권한 시스템**입니다. 실제 로그인이나 서버 측 권한 검증이 없으며 비밀번호를 수집·저장하지 않습니다.

## 실행 방법

### 웹에서 실행 (GitHub Pages)

예정 웹 주소: **[https://plandohae-workspace.github.io/pond-content-admin/](https://plandohae-workspace.github.io/pond-content-admin/)**

배포 설정이 main에 반영되면 GitHub Actions가 검사·빌드를 수행하고 `dist/`를 GitHub Pages에 자동 배포합니다. 실제 배포 성공 전에는 위 주소의 실행을 보장하지 않습니다. 저장소의 **Actions → Deploy to GitHub Pages**에서 배포 결과를 확인하세요. Pages의 Source는 **GitHub Actions**로 설정합니다.

별도 비밀키는 필요하지 않습니다. 메뉴 이동은 앱 내부 상태로 처리하며 하위 URL을 생성하지 않습니다. 새로고침 시 첫 화면으로 돌아오지만 저장 데이터는 같은 브라우저·같은 사이트에서 유지됩니다. 로컬 실행 데이터와 웹 사이트 데이터는 서로 공유되지 않습니다.

### A. 설치 없이 실행

1. [artifacts/POND-Admin.html](artifacts/POND-Admin.html)을 열고 GitHub의 **Download raw file** 버튼으로 다운로드합니다.
2. 다운로드한 HTML 파일을 Chrome 또는 Edge 등 최신 브라우저에서 엽니다.
3. 샘플 데이터로 각 메뉴를 체험합니다. HTML 파일 안에 실행 코드와 스타일이 포함되어 있어 별도 설치가 필요하지 않습니다.

브라우저 정책에 따라 로컬 파일(`file://`)의 저장소 접근이 제한될 수 있습니다. 저장 오류가 발생하면 아래 개발 환경 실행 방법을 사용하세요. 기존 자동 브라우저 검증은 단일 HTML 파일의 내용을 HTTP로 제공하여 수행했으며, 직접 `file://` 실행은 미검증입니다.

### B. 개발 환경에서 실행

**Node.js 22.12 이상(22 LTS 또는 24 LTS 권장)**과 npm을 준비합니다. Vite 7의 지원 범위는 Node.js 20.19 이상인 20.x 또는 22.12 이상이며, 이 프로젝트는 Node.js 24 환경에서도 검증했습니다.

저장소를 내려받은 뒤 프로젝트 폴더에서 실행합니다.

```bash
git clone https://github.com/plandohae-workspace/pond-content-admin.git
cd pond-content-admin
npm ci
npm run dev
```

브라우저에서 **http://localhost:5173/pond-content-admin/**에 접속합니다. 해당 포트가 사용 중이면 Vite가 다른 포트를 선택할 수 있으므로 터미널에 표시된 주소를 확인하세요. `npm run dev`는 `--host 0.0.0.0`으로 실행됩니다.

배포용 빌드와 로컬 빌드 확인:

```bash
npm run build
npm run preview
```

빌드 결과는 `dist/`에 생성됩니다. preview의 기본 접속 주소는 **http://localhost:4173/pond-content-admin/**입니다.

최신 standalone HTML 생성:

```bash
npm run build:html
```

결과 파일은 `artifacts/POND-Admin.html`입니다.

## 사용 기술

| 영역 | 기술 및 용도 |
| --- | --- |
| 화면 | React 19, JavaScript(ES Modules), CSS — 관리자 화면 및 반응형 레이아웃 |
| 개발·빌드 | Vite 7, esbuild — 개발 서버, 배포 빌드 및 단일 HTML 생성 |
| 데이터 저장 | 브라우저 IndexedDB — 업무 데이터와 첨부 이미지 저장 |
| Excel | ExcelJS — 검수 데이터와 이미지가 포함된 .xlsx 생성 |
| 아이콘 | Lucide React |
| 검증 | ESLint, Node.js 내장 테스트 러너, Playwright(Chromium) |

## 데이터 저장 및 제한 사항

- 데이터는 현재 브라우저의 IndexedDB(`pond-admin`)에 저장됩니다. 저장 성공 후 같은 브라우저·같은 접속 주소에서 새로고침하면 유지됩니다. 과거 localStorage 데이터는 호환 로직으로 읽습니다.
- 다른 기기·브라우저·접속 주소와 데이터가 자동 공유되지 않습니다. 브라우저 데이터 삭제, 시크릿 모드 종료 또는 저장 공간 부족으로 데이터가 사라지거나 저장이 실패할 수 있습니다. 실제 업무용 영구 저장소나 백업 시스템은 아닙니다.
- 현재 자료 관리의 원본 파일은 Google Drive에 있습니다. POND Admin은 링크만 관리하며, Drive의 실제 접근 권한은 원본 서비스 설정을 따릅니다. 기존 첨부 자료는 브라우저 저장소에 보존됩니다.
- 실제 다중 사용자 인증, 서버 데이터베이스, 서버 파일 저장소와 Google Drive API 연동은 향후 개발 범위입니다. 평가 시 가상 정보만 입력하세요.

## 검증 방법

프로젝트 폴더에서 다음 명령으로 정적 검사, 단위 테스트와 빌드를 실행할 수 있습니다.

```bash
npm run lint
npm test
npm run build
```

실제 standalone HTML 대상 브라우저 테스트도 제공합니다.

```bash
npm run build:html
npm run test:lesson-drag
npm run test:dashboard-calendar
npm run test:users
```

현재 브라우저 테스트 스크립트는 실행 파일 `/usr/bin/chromium`이 있는 Linux 환경을 전제로 합니다. 일반 PC에서 위 자동 테스트를 실행하려면 해당 환경 또는 스크립트의 브라우저 경로 조정이 필요합니다. 앱 실행에는 이 조건이 필요하지 않습니다. 테스트 결과와 화면 기록은 `docs/`에서 확인할 수 있습니다.

평가자는 **Level에서 Lesson 상세·단계 저장**, **검수 로그 편집·이미지 포함 Excel 다운로드**, **자료 폴더 링크 등록**, **사용자 추가**, **대시보드 반영 및 새로고침 후 유지** 순으로 핵심 기능을 확인할 수 있습니다.

## 프로젝트 구조

```text
src/                       화면, 업무 모델, 저장 및 Excel 처리
scripts/build-html.mjs     standalone HTML 생성
tests/                    브라우저 테스트
artifacts/POND-Admin.html   설치 없이 실행하는 단일 HTML
docs/                     화면 및 검증 기록
package.json               실행·빌드·검증 명령과 의존성
```
