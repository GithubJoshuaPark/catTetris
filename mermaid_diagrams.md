# UML Diagrams for catTetris Game


> 이 다이어그램들은 CatTetris 게임
> 전체 아키텍처, 데이터 흐름, 클래스 구조, 모바일 레이아웃, 파일 구조를 
> 시각적으로 보여줍니다. 
> 
> 각 다이어그램은 특정 관점에서 게임의 구조를 설명하며, 
> Mermaid 문법으로 작성되어 VS Code에서 바로 미리보기가 가능합니다.
>> 

## Mermaid vsCode Extension 설치
> "Markdown Mermaid Viewer" 확장 프로그램> 
> 
> ---

### CatTetris 게임 아키텍처 다이어그램

```mermaid

%%{init: {'theme': 'default', 
          'themeVariables': { 'primaryColor': '#ff6b9d', 
                              'primaryTextColor': '#fff', 
                              'primaryBorderColor': '#e55a87', 
                              'lineColor': '#ff9a9e', 
                              'tertiaryColor': '#fecfef'
                            }
        }
  }%%

flowchart TB
    subgraph Frontend["클라이언트 측 (Frontend)"]
        A[HTML Structure<br>index.html]
        B[CSS Styling<br>style.css]
        C[JavaScript Logic<br>main.js]
        
        subgraph UIComponents["UI 컴포넌트"]
            D[게임 캔버스<br>#gameCanvas]
            E[다음 블록 캔버스<br>#nextCanvas]
            F[점수/레벨 표시]
            G[터치 컨트롤 버튼]
            H[게임 오버 화면]
        end
        
        subgraph MediaAssets["미디어 에셋"]
            I[고양이 블록 이미지<br>new_I.png, new_O.png 등]
            J[컨트롤 버튼 이미지<br>left.png, right.png 등]
            K[사운드 효과<br>move.wav, rotate.wav 등]
        end
    end
    
    subgraph Backend["서비스 워커 & PWA"]
        L[Service Worker<br>sw.js]
        M[Web App Manifest<br>manifest.json]
    end
    
    subgraph GameCore["게임 코어 엔진"]
        subgraph GameState["게임 상태 관리"]
            N[보드 데이터<br>10x20 배열]
            O[현재 피스<br>위치/회전 상태]
            P[다음 피스<br>미리보기]
        end
        
        subgraph GameLogic["게임 로직"]
            Q[피스 이동/회전<br>충돌 감지]
            R[라인 클리어<br>점수 계산]
            S[레벨 업<br>속도 증가]
            T[게임 오버<br>조건 확인]
        end
        
        subgraph Rendering["렌더링 시스템"]
            U[메인 보드 그리기]
            V[다음 블록 미리보기]
            W[고양이 이미지<br>렌더링]
            X[배경색<br>랜덤 변경]
        end
    end
    
    subgraph InputSystem["입력 처리 시스템"]
        Y[키보드 입력<br>화살표 키, 스페이스]
        Z[터치 입력<br>모바일 버튼]
        AA[소프트 드롭<br>가속 하강]
    end
    
    subgraph AudioSystem["오디오 시스템"]
        BB[Web Audio API<br>초기화]
        CC[사운드 효과<br>재생]
        DD[폴백 비프음<br>생성]
    end
    
    %% 연결 관계
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    
    B --> UIComponents
    C --> GameLogic
    C --> Rendering
    C --> InputSystem
    C --> AudioSystem
    
    I --> W
    J --> G
    K --> CC
    
    L --> M
    
    N --> Q
    O --> Q
    P --> V
    
    Q --> R
    R --> S
    Q --> T
    
    Y --> Q
    Z --> Q
    AA --> Q
    
    BB --> CC
    CC --> DD
    
    %% 스타일링
    classDef frontend fill:#ff9999
    classDef backend fill:#99ff99
    classDef game fill:#9999ff
    classDef input fill:#ffff99
    classDef audio fill:#ff99ff
    
    class A,B,C,D,E,F,G,H,I,J,K frontend
    class L,M backend
    class N,O,P,Q,R,S,T,U,V,W,X game
    class Y,Z,AA input
    class BB,CC,DD audio
```

> 게임 데이터 흐름 다이어그램

```mermaid
sequenceDiagram
    participant U as 사용자
    participant I as 입력 시스템
    participant G as 게임 로직
    participant R as 렌더링
    participant A as 오디오
    
    Note over U: 게임 시작
    U->>I: 키보드/터치 입력
    I->>G: 이동/회전 명령
    G->>G: 충돌 감지
    alt 유효한 이동
        G->>R: 새로운 위치 렌더링
        G->>A: 이동 사운드 재생
    else 충돌 발생
        G->>G: 이동 무시
    end
    
    Note over G: 자동 하강
    loop 게임 루프
        G->>G: 현재 피스 하강
        G->>G: 하단 충돌 확인
        alt 바닥 충돌
            G->>G: 피스 고정
            G->>G: 라인 완성 검사
            alt 라인 완성
                G->>G: 라인 제거
                G->>G: 점수/레벨 업데이트
                G->>A: 라인 클리어 사운드
                G->>R: 배경색 변경
            end
            G->>G: 새 피스 생성
            G->>G: 게임 오버 확인
            alt 게임 오버
                G->>R: 게임 오버 화면
                G->>A: 게임 오버 사운드
            end
        end
        G->>R: 전체 보드 렌더링
        G->>R: 다음 피스 미리보기
    end
```

> 클래스 구조 다이어그램

```mermaid
classDiagram
    class GameEngine {
        -canvas: HTMLCanvasElement
        -ctx: CanvasRenderingContext2D
        -board: Array[20][10]
        -currentPiece: Piece
        -nextPiece: Piece
        -score: number
        -level: number
        -lines: number
        +initGame()
        +gameLoop()
        +draw()
        +clearLines()
        +isGameOver()
    }
    
    class Piece {
        -type: string
        -x: number
        -y: number
        -rotation: number
        -shape: number[][]
        +rotate()
        +move(dx, dy)
        +isValidPosition()
    }
    
    class InputHandler {
        -gameEngine: GameEngine
        -isSoftDropping: boolean
        +handleKeyDown()
        +handleTouch()
        +enableSoftDrop()
        +disableSoftDrop()
    }
    
    class AudioManager {
        -audioContext: AudioContext
        -loadedSounds: Object
        +loadSounds()
        +playSound(name)
        +beep(freq, duration)
    }
    
    class Renderer {
        -BLOCK_SIZE: number
        -loadedImages: Object
        +drawBlock()
        +drawPiece()
        +drawNextPiece()
        +changeBackgroundColor()
    }
    
    GameEngine --> Piece
    GameEngine --> InputHandler
    GameEngine --> AudioManager
    GameEngine --> Renderer
    InputHandler --> GameEngine
```


> 모바일 레이아웃 다이어그램

```mermaid
graph TB
    subgraph MobileLayout["모바일 화면 레이아웃"]
        A[🐱 고양이 테트리스 🐱]
        B[점수: 0 레벨: 1 라인: 0]
        C[게임 보드 캔버스]
        
        subgraph Controls["터치 컨트롤 영역"]
            D[좌측 컨트롤]
            E[우측 컨트롤]
            
            subgraph LeftControls["좌측 버튼"]
                F[◀ 이동]
                G[▼ 하강]
            end
            
            subgraph RightControls["우측 버튼"]
                H[▶ 이동]
                I[↻ 회전]
            end
        end
        
        J[다음 블록 미리보기<br>클릭시 토글]
    end
    
    A --> B
    B --> C
    C --> Controls
    D --> LeftControls
    E --> RightControls
    J -.->|모바일 전용| C
    
    style A fill:#ff6b9d
    style B fill:#a8e6cf
    style C fill:#9999ff
    style D fill:#ffff99
    style E fill:#ff99ff
    style J fill:#99ffff
```

> 파일 구조 다이어그램

```mermaid
graph LR
    A[catTetris/]
    
    B[index.html<br>메인 HTML 파일]
    C[manifest.json<br>PWA 매니페스트]
    D[sw.js<br>서비스 워커]
    
    subgraph CSS
        E[css/style.css<br>스타일시트]
    end
    
    subgraph JavaScript
        F[js/main.js<br>게임 로직]
    end
    
    subgraph Assets
        subgraph Images
            G[new_images/<br>고양이 블록 이미지]
            H[new_images/<br>컨트롤 버튼]
        end
        
        subgraph Sounds
            I[sounds/<br>사운드 효과]
        end
    end
    
    A --> B
    A --> C
    A --> D
    A --> CSS
    A --> JavaScript
    A --> Assets
    
    CSS --> E
    JavaScript --> F
    Assets --> Images
    Assets --> Sounds
    Images --> G
    Images --> H
    Sounds --> I
    
    style A fill:#333,color:#fff
    style B fill:#e74c3c,color:#fff
    style C fill:#3498db,color:#fff
    style D fill:#9b59b6,color:#fff
    style E fill:#2ecc71,color:#fff
    style F fill:#f39c12,color:#fff
    style G fill:#1abc9c,color:#fff
    style H fill:#34495e,color:#fff
    style I fill:#e67e22,color:#fff
```