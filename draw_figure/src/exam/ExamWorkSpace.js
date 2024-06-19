import "./exam.css";
/**
 * - 문제 보여주는 영역
 *  - 단순 사진
 * - 문제 푸는 영역
 *  - 판 생성 ( 원하는 크기만큼 )
 *      - 판 생성은 입력한 짝수 값 / 2로 나눔 ( 문제 영역과 풀이 영역, 즉 캔버스 2개로 하자 )
 *  - 문제 풀기 ( 선 그리기, 선 지우기 )
 *  - 문제 맞았는지 틀렸는지 체크
 *
 * */
import { useCallback, useEffect, useRef, useState } from "react";

const INITIAL_INFO = {
    radius: 6
};

const INITIAL_CLICK_INFO = {
    curX: 0,
    curY:0,
    active: false
};

/**
 * gridCount - 각 가로/세로 블럭 개수 ( 문제 영역 + 푸는 영역 / 꼭 짝수로 입력 )
 * */
export default function ExamWorkSpace(props) {
    // 문제 정보를 가지고 옴.
    const { exam: { name, gridCount, positionList } } = props;
    // 선과 선이 만나는 지점인 점에 마우스를 갖다대기란 어렵기 때문에, 그 주변 둘레에만 갖다대면 거기에 선을 그을 수 있도록 하기 위해, 그 범위 지정하는 변수
    const { radius } = INITIAL_INFO;
    const examCvsRef = useRef(null);
    const writeCvsRef = useRef(null);
    const cvsGridInfo = useRef({
        exam: {
            pointList: [[0,0]]
        },
        write: {
            pointList: [[0,0]],
            lineList: [],
        }
    });
    // mousedown event 발생 시 클릭한 위치 담아둘 변수
    const clickInfo = useRef(INITIAL_CLICK_INFO);
    
    // 작업할 캔버스 관련 정보를 가져옴.
    const getCvsInfo = (cvsType) => {
        const examCvs = examCvsRef.current;
        const writeCvs = writeCvsRef.current;
        if(!examCvs || !writeCvs) return {
            cvs: null,
            ctx: null
        };

        const examCtx = examCvs.getContext('2d');
        const writeCtx = writeCvs.getContext('2d');
        const isExam = cvsType === 'exam';
        return {
            cvs: isExam ? examCvs : writeCvs,
            ctx: isExam ? examCtx : writeCtx
        }
    }
    
    // 성공 여부 ( 최종적으로 문제를 맞추면 true로 바뀌도록 설계. 그 후 작업은 의뢰인님이 원하시는대로..
    const [isSuccess, setSuccess] = useState(false);
    
    // 캔버스에 세로/가로선을 만드는 로직 ( cvsType으로 나눠서, 문제 영역의 캔버스, 그리는 영역의 캔버스를 나누었음 )
    const makeGridLine = useCallback((cvsType, lineCount) => {
        const { cvs, ctx } = getCvsInfo(cvsType);
        const { width, height } = cvs;
        const info = cvsGridInfo.current[cvsType];
        const emptyArray = Array.from(Array(lineCount)).fill(1);
        const XIncreaseNum = width / lineCount; // 세로 선당 선의 거리값
        const YIncreaseNum = height / lineCount; // 가로 선당 선의 거리값
        let lastX = 0, lastY = 0;

        ctx.strokeStyle = "black";
        ctx.strokeWidth = 1;
        
        // 세로 선 그리기
        emptyArray.forEach((_, idx) => {
            let [x, y] = [lastX, lastY];
            // Canvas API 사용 ( JavaScript 기본 내장 기능 )
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + height)
            ctx.stroke();
            ctx.closePath();
            
            x += XIncreaseNum;
            info.pointList.push([x, y]);
            emptyArray.forEach((_, subIdx) => {
                info.pointList.push([x, YIncreaseNum * (subIdx + 1)]);
            })
            lastX = x;
            lastY = y;
        })

        // 가로 선 그리기
        lastX = 0;
        lastY = 0;
        emptyArray.forEach((_, idx) => {
            let [x, y] = [lastX, lastY];
            console.log('x, y', x, y)
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y)
            ctx.stroke();
            ctx.closePath();

            y += YIncreaseNum;
            info.pointList.push([x, y]);
            emptyArray.forEach((_, subIdx) => {
                info.pointList.push([XIncreaseNum * (subIdx + 1), y]);
            })
            lastX = x;
            lastY = y;
        });

        // 중복값 제거
        info.pointList = info.pointList.reduce((acc, item) => {
            // x, y 둘 다 일치하는 값만 제외.
            if(acc.findIndex(subItem => ((item[0] === subItem[0]) && (item[1] === subItem[1]))) !== -1) return acc;
            
            acc.push(item);
            return acc;
        }, []);

        // 선과 선이 만나는 지점이 원 그리기 ( 필요하면 주석 제거하기 / 원 크기는 INITIAL_CLICK_INFO.radius 값을 수정하여 조정 가능.)
        // info.pointList.forEach(item => {
        //     const [x,y] = item;
        //     ctx.beginPath();
        //     ctx.arc(x, y, radius, 0, 360);
        //     ctx.stroke();
        //     ctx.closePath();
        // })
    }, []);

    // canvas 태그 내에서 마우스를 클릭한 위치의 좌표 정보를 가져옴
    const getPos = (event) => ([event.x - event.target.offsetLeft, event.y - event.target.offsetTop]);
    
    // 선과 선이 만나는 지점에 마우스 클릭이 되었는지 확인.
    const findClickArea = (cvsType = 'exam', event) => {
        const { pointList } = cvsGridInfo.current[cvsType] ?? {};
        const [x, y] = getPos((event));

        // 마우스 포인터 위치가, 원 둘레에 들어왔는지 체크
        return pointList.findIndex(([arcX, arcY]) => {
            const dx = x - arcX;
            const dy = y - arcY;
            return (dx * dx + dy * dy) <= (radius * radius);
        })
    }
    
    useEffect(() => {
        // 처음 캔버스 로딩 안 되면 작업 못하도록 막기
        if(!getCvsInfo('exam')?.cvs) return () => {};
        const lineCount = Math.ceil(gridCount / 2);

        // init
        makeGridLine('exam', lineCount);
        makeGridLine('write', lineCount);
        
        // 작성 영역에서 그린 값을 반전시켜서 문제 영역에 그리기 위해 사용되는 함수.
        const reverseXY = (cvsType, x, y) => {
            const { cvs } = getCvsInfo(cvsType);
            const XIncreaseNum = cvs.width / lineCount;
            const YIncreaseNum = cvs.height / lineCount;
            const reverseX = ((lineCount ) - Math.ceil(x / XIncreaseNum)) * XIncreaseNum;
            const reverseY = ((lineCount) - Math.ceil(y / YIncreaseNum)) * YIncreaseNum
            return [reverseX, reverseY];
        }
        
        // 사전에 문제 영역에 그림 그려두기.
        (() => {
            const { cvs, ctx } = getCvsInfo('exam');
            ctx.strokeStyle = "blue"; // 선 색상은 파란색으로.
            ctx.strokeWidth = 2;
            
            positionList.map((item) => {
                const [curX, curY, x, y] = item;
                return [...reverseXY('exam', curX, curY), ...reverseXY('exam', x, y)]
            }).forEach(item => {
                const [curX, curY, x, y] = item;
                ctx.beginPath();
                ctx.moveTo(curX, curY);
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.closePath();
            })
        })();
        
        // 작성 영역에 대한 이벤트 처리 ( 마우스 누르고 움직이고 때고 등 )
        const writeCvsEvent = () => {
            const { cvs, ctx } = getCvsInfo("write");
            
            // 마우스 클릭을 했을 때 ( 클릭 후 떼지 않은 상태 )
            cvs.addEventListener("mousedown", (event) => {
                // 선과 선이 만나는 지접을 클릭을 안 했을 경우에는, 그릴 수 없도록 조치
                const idx = findClickArea('write', event);
                if(idx === -1) return;
                
                
                // 선과 선 만나는 지점을 누른 좌표 값을 가져와 저장.
                const [curX, curY] = cvsGridInfo.current['write'].pointList[idx];
                clickInfo.current = {
                    active: true,
                    curX,
                    curY
                };
            })

            // 작성 영역의 그림을 전부 없애고, 다시 그리기.
            const redraw = (cvsType = 'write') => {
                const { cvs, ctx } = getCvsInfo(cvsType);
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                makeGridLine('write', lineCount);
                ctx.strokeStyle = "red";
                ctx.strokeWidth = 2;
                cvsGridInfo.current.write.lineList.forEach(item => {
                    const [curX, curY, x, y] = item;
                    ctx.beginPath();
                    ctx.moveTo(curX, curY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    ctx.closePath();
                })
            }
            
            // 마우스 클릭을 유지한 상태로 움직일 때
            cvs.addEventListener("mousemove", (event) => {
                if(!clickInfo.current.active) return;
                const { curX, curY }  = clickInfo.current;
                const [x,y] = getPos(event);
                
                const idx = findClickArea('write', event);
                if(idx !== -1) {
                    const [pointX, pointY] = cvsGridInfo.current.write.pointList[idx];
                    const findIndex = cvsGridInfo.current.write.lineList.findIndex(item => {
                        return (
                            curX === item[0] &&
                            curY === item[1] &&
                            pointX === item[2] &&
                            pointY === item[3]
                        );
                    });
                    console.log('findIndex', findIndex)
                    
                    if (findIndex !== -1) {
                        redraw();
                        return;
                    }
                    cvsGridInfo.current.write.lineList.push([curX, curY, pointX,  pointY]);
                    clickInfo.current.curX = pointX;
                    clickInfo.current.curY = pointY;
                    redraw();
                    return;
                }
                
                redraw();
                ctx.strokeWidth = 2;
                ctx.strokeStyle = 'red';
                ctx.beginPath();
                ctx.moveTo(curX, curY);
                ctx.lineTo(x,  y);
                ctx.stroke();
                ctx.closePath();
            })

            // 마우스 클릭을 풀었을 때
            cvs.addEventListener("mouseup", () => {
                const checkLineList = JSON.parse(JSON.stringify(cvsGridInfo.current.write.lineList));
                cvsGridInfo.current.write.lineList = [];
                redraw();
                clickInfo.current = INITIAL_CLICK_INFO;
                
                const errorMessage = '모양이 일치하지 않습니다. 다시 시도해 주세요.';
                if (positionList.length !== checkLineList.length) {
                    redraw();
                    return alert(errorMessage);
                }
                
                // 자신이 그린 그림이, 문제와 일치하는지 확인
                const isSame = JSON.parse(JSON.stringify(positionList)).reduce((acc, item) => {
                    if(checkLineList.findIndex(subItem => {
                        return (
                            item[0] === subItem[0] &&
                            item[1] === subItem[1] &&
                            item[2] === subItem[2] &&
                            item[3] === subItem[3]
                        );
                    }) !== -1) acc.push(true);
                    return acc;
                }, []).length === positionList.length;
                
                
                if (isSame) {
                    alert("성공이에요!! 축하합니다!!");
                    setSuccess(true);
                } else {
                    alert(errorMessage);
                    redraw();
                }
            })
        }
        // examCvsEvent();
        writeCvsEvent();
        // 캔버스에 마우스 이벤트 추가
        
    }, []);
    
    useEffect(() => {
        if (isSuccess) {
            console.log('성공!!');
            // 그 외 로직..
        }
    }, [isSuccess]);
    
    return <div className={'workspace-container'}>
        <canvas ref={examCvsRef} width={400} height={400} className={'workspace exam-workspace'}></canvas>
        <canvas ref={writeCvsRef} width={400} height={400} className={'workspace write-workspace'}></canvas>
    </div>;
}
