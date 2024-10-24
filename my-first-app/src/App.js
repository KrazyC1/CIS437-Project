import './App.css';
import BlockPlacer from './components/BlockPlacer'


function App() {
  return (
    <div className="App">
      <header className="App-header">

        <div style={{ padding: '20px' }}>
        <h1 style={{ marginBottom: '20px' }}>Block Placer</h1>
        <BlockPlacer />
      </div>

      </header>
    </div>
  );
}

export default App;
