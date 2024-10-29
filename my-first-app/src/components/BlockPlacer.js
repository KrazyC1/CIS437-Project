import React, { useState, useRef } from 'react';

const BlockPlacer = () => {
  const [blocks, setBlocks] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null); // Start with no color selected
  const [draggedBlock, setDraggedBlock] = useState(null);
  const containerRef = useRef(null);
  const blockSize = 32, blockOffset = blockSize / 2;

  const colors = ['red', 'blue', 'green', 'yellow', 'purple'];

  const handleCanvasClick = (e) => {
    if (!selectedColor || draggedBlock) return; // Ensure a color is selected

    const { left, top } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left, y = e.clientY - top;

    if (isWithinBounds(x, y) && !isOverlapping(x, y))
      setBlocks([...blocks, { x, y, id: Date.now(), color: selectedColor }]);
  };

  const handleMouseMove = (e) => {
    if (!draggedBlock) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - left, newY = e.clientY - top;

    if (isWithinBounds(newX, newY) && !isOverlapping(newX, newY, draggedBlock.id))
      setBlocks(blocks.map(b => (b.id === draggedBlock.id ? { ...b, x: newX, y: newY } : b)));
  };

  const isWithinBounds = (x, y) => {
    const { width, height } = containerRef.current.getBoundingClientRect();
    return x >= blockOffset && x <= width - blockOffset && y >= blockOffset && y <= height - blockOffset;
  };

  const isOverlapping = (x, y, id = null) => blocks.some(b => 
    b.id !== id && Math.abs(b.x - x) < blockSize && Math.abs(b.y - y) < blockSize
  );

  const handleSubmitScore = () => {
    fetch('https://cis437hw5.uk.r.appspot.com/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: blocks.length }),
    })
      .then(response => response.json())
      .then(data => console.log('Score submitted:', data))
      .catch(error => console.error('Submission error:', error));
  };

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        {colors.map((color) => (
          <div
            key={color}
            onClick={() => setSelectedColor(color)}
            style={{
              width: '32px', height: '32px', backgroundColor: color, cursor: 'pointer',
              border: selectedColor === color ? '2px solid black' : '1px solid #ccc',
              marginRight: '5px'
            }}
          />
        ))}
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'relative', width: '100%', height: '400px', border: '2px solid #ccc',
          cursor: draggedBlock ? 'grabbing' : 'crosshair',
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDraggedBlock(null)}
        onMouseLeave={() => setDraggedBlock(null)}
      >
        {blocks.map(block => (
          <div
            key={block.id}
            style={{
              position: 'absolute', width: blockSize, height: blockSize,
              backgroundColor: block.color, left: block.x - blockOffset, top: block.y - blockOffset,
              border: '1px solid black', cursor: 'grab', userSelect: 'none',
            }}
            onMouseDown={(e) => { e.stopPropagation(); setDraggedBlock(block); }}
          />
        ))}
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', color: '#666' }}>
          Blocks placed: {blocks.length}
        </div>
      </div>

      <button
        style={{
          marginTop: '20px', padding: '10px 20px', fontSize: '16px',
          backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer',
        }}
        onClick={handleSubmitScore}
      >
        SUBMIT SCORE
      </button>
    </div>
  );
};

export default BlockPlacer;
