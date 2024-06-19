import './App.css';
import ExamWorkSpace from "./exam/ExamWorkSpace";
import testData from './assets/json/testData.json';

function App() {
    // json 파일의 문제 정보를 가져옴. ( 그리드 선 개수, 문제 이름, 문제 선 양식 등 )
const exam = testData.examList[0];
  return (
    <div className="App">
      <div className={'container'}>
          <ExamWorkSpace exam={exam} />
      </div>
    </div>
  );
}

export default App;
