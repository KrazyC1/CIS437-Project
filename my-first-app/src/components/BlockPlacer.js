import React, { useState, useRef, useEffect } from 'react';

const BlockPlacer = () => {
  const [blocks, setBlocks] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const containerRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    contextRef.current = canvas.getContext("2d");
    contextRef.current.font = "16px Arial"; // Set font style to match display
  }, []);

  const calculateBlockSize = (text) => {
    const textWidth = contextRef.current.measureText(text).width;
    return { width: textWidth + 36, height: 40 }; // Extra padding for both width and height
  };

  const labels = [
    { text: "Water💧", color: "white" },
    { text: "Fire🔥", color: "white" },
    { text: "Wind💨", color: "white" },
    { text: "Earth🌍", color: "white" }
  ];

  const handleCanvasClick = (e) => {
    if (!selectedLabel || draggedBlock) return;
    const { left, top } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left, y = e.clientY - top;
    const { width, height } = calculateBlockSize(selectedLabel.text);
    if (isWithinBounds(x, y, width, height) && !isOverlapping(x, y, width, height))
      setBlocks([...blocks, { x, y, id: Date.now(), label: selectedLabel, width, height }]);
  };

  const handleMouseMove = (e) => {
    if (!draggedBlock) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - left, newY = e.clientY - top;
    if (isWithinBounds(newX, newY, draggedBlock.width, draggedBlock.height) &&
        !isOverlapping(newX, newY, draggedBlock.width, draggedBlock.height, draggedBlock.id))
      setBlocks(blocks.map(b => (b.id === draggedBlock.id ? { ...b, x: newX, y: newY } : b)));
  };

  const isWithinBounds = (x, y, width, height) => {
    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    return x >= width / 2 && x <= containerWidth - width / 2 &&
           y >= height / 2 && y <= containerHeight - height / 2;
  };

  const isOverlapping = (x, y, width, height, id = null) => blocks.some(b =>
    b.id !== id && Math.abs(b.x - x) < (b.width + width) / 2 &&
    Math.abs(b.y - y) < (b.height + height) / 2
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
        {labels.map((label) => (
          <div
            key={label.text}
            onClick={() => setSelectedLabel(label)}
            style={{
              padding: '0 8px', height: '32px', display: 'flex', alignItems: 'center',
              backgroundColor: label.color, cursor: 'pointer',
              border: selectedLabel === label ? '2px solid black' : '1px solid #ccc',
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
              position: 'absolute', width: block.width, height: block.height,
              backgroundColor: block.label.color, left: block.x - block.width / 2, top: block.y - block.height / 2,
              border: '1px solid black', cursor: 'grab', userSelect: 'none', color: 'black',
              display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap'
            }}
            onMouseDown={(e) => { e.stopPropagation(); setDraggedBlock(block); }}
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
