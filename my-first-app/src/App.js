import './App.css';
import BlockPlacer from './components/BlockPlacer';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="content-container">
          <h1 className="app-title">Essentia</h1>
          <BlockPlacer />
        </div>
      </header>
    </div>
  );
}

export default App;
