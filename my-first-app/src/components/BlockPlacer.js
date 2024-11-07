import React, { useState, useRef, useEffect } from 'react';

const BlockPlacer = () => {
  const [blocks, setBlocks] = useState([]);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const containerRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    contextRef.current = document.createElement("canvas").getContext("2d");
    contextRef.current.font = "16px Arial";
  }, []);

  const calculateBlockSize = (text) => {
    const textWidth = contextRef.current.measureText(text).width;
    return { width: textWidth + 36, height: 40 };
  };

  const labels = [
    { text: "Water💧", color: "white" },
    { text: "Fire🔥", color: "white" },
    { text: "Wind💨", color: "white" },
    { text: "Earth🌍", color: "white" }
  ];

  const findOverlappingBlock = (x, y, id) => blocks.find(b => 
    b.id !== id && Math.abs(b.x - x) < 40 && Math.abs(b.y - y) < 40
  );

  const combineBlocks = async (x, y, targetBlock) => {
    // Make a request to the Flask server to check if there's a combination
    const element1 = draggedBlock.label.text;
    const element2 = targetBlock.label.text;

    try {
      const response = await fetch(`http://localhost:5000/get_combination?element1=${element1}&element2=${element2}`);
      const data = await response.json();

      const newLabel = data.result ? { text: data.result, color: "white" } : { text: "⬜", color: "gray" };
      const newBlock = {
        id: Date.now(),
        x: (x + targetBlock.x) / 2,
        y: (y + targetBlock.y) / 2,
        label: newLabel,
        ...calculateBlockSize(newLabel.text)
      };

      setBlocks(blocks.filter(b => b.id !== draggedBlock.id && b.id !== targetBlock.id).concat(newBlock));
    } catch (error) {
      console.error("Error fetching combination:", error);
    }
  };

  const handleDragEnd = (e) => {
    if (!draggedBlock) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left, y = e.clientY - top;
    const overlappingBlock = findOverlappingBlock(x, y, draggedBlock.id);
    overlappingBlock ? combineBlocks(x, y, overlappingBlock) : 
      setBlocks(blocks.map(b => b.id === draggedBlock.id ? { ...b, x, y } : b));
    setDraggedBlock(null);
  };

  const addBlockAtRandomPosition = (label) => {
    const { width, height } = calculateBlockSize(label.text);
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * (containerRef.current.offsetWidth - width) + width / 2;
      const y = Math.random() * (containerRef.current.offsetHeight - height) + height / 2;
      if (!blocks.some(b => Math.abs(b.x - x) < (b.width + width) / 2 && Math.abs(b.y - y) < (b.height + height) / 2)) {
        setBlocks([...blocks, { x, y, id: Date.now(), label, width, height }]);
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedBlock) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left, y = e.clientY - top;
    const { width, height } = draggedBlock;
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    if (x >= width / 2 && x <= cw - width / 2 && y >= height / 2 && y <= ch - height / 2) {
      setBlocks(blocks.map(b => (b.id === draggedBlock.id ? { ...b, x, y } : b)));
    }
  };

  const handleSubmitScore = () => {
    fetch('https://cis437hw5.uk.r.appspot.com/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: blocks.length }),
    })
    .then(res => res.json())
    .then(data => console.log('Score submitted:', data))
    .catch(error => console.error('Submission error:', error));
  };

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        {labels.map(label => (
          <div
            key={label.text}
            onClick={() => addBlockAtRandomPosition(label)}
            style={{
              padding: '0 8px', height: '32px', display: 'flex', alignItems: 'center',
              backgroundColor: label.color, cursor: 'pointer', border: '1px solid #ccc',
              marginRight: '5px', color: 'black'
            }}
          >
            {label.text}
          </div>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{
          position: 'relative', width: '100%', height: '400px', border: '2px solid #ccc',
          cursor: draggedBlock ? 'grabbing' : 'crosshair'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {blocks.map(block => (
          <div
            key={block.id}
            style={{
              position: 'absolute', width: block.width, height: block.height,
              backgroundColor: block.label.color, left: block.x - block.width / 2,
              top: block.y - block.height / 2, border: '1px solid black', cursor: 'grab',
              userSelect: 'none', color: 'black', display: 'flex', alignItems: 'center',
              justifyContent: 'center', whiteSpace: 'nowrap'
            }}
            onMouseDown={e => { e.stopPropagation(); setDraggedBlock(block); }}
          >
            {block.label.text}
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', color: '#666' }}>
          Blocks placed: {blocks.length}
        </div>
      </div>
      <button
        style={{
          marginTop: '20px', padding: '10px 20px', fontSize: '16px',
          backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer'
        }}
        onClick={handleSubmitScore}
      >
        SUBMIT SCORE
      </button>
    </div>
  );
};

export default BlockPlacer;
