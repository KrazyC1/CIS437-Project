import React, { useState, useRef, useEffect } from 'react';

const BlockPlacer = () => {
  const [blocks, setBlocks] = useState([]);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const containerRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    contextRef.current = canvas.getContext("2d");
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

  const findOverlappingBlock = (x, y, currentBlockId) => {
    const proximityThreshold = 40; // Increased proximity for easier merging
    return blocks.find(b => 
      b.id !== currentBlockId && 
      Math.abs(b.x - x) < proximityThreshold &&
      Math.abs(b.y - y) < proximityThreshold
    );
  };

  const combineBlocks = (block1X, block1Y, block2) => {
    // Calculate the midpoint between the release position and the found block
    const newX = (block1X + block2.x) / 2;
    const newY = (block1Y + block2.y) / 2;

    // Create a new blank block
    const newBlock = {
      id: Date.now(),
      x: newX,
      y: newY,
      label: { text: "⬜", color: "white" },
      ...calculateBlockSize("⬜")
    };

    // Remove the original blocks and add the new one
    setBlocks(blocks.filter(b => b.id !== draggedBlock.id && b.id !== block2.id).concat(newBlock));
  };

  const handleDragEnd = (e) => {
    if (!draggedBlock) return;

    const { left, top } = containerRef.current.getBoundingClientRect();
    const releaseX = e.clientX - left;
    const releaseY = e.clientY - top;

    // Find any nearby block to combine with
    const overlappingBlock = findOverlappingBlock(releaseX, releaseY, draggedBlock.id);
    
    if (overlappingBlock) {
      combineBlocks(releaseX, releaseY, overlappingBlock);
    } else {
      // If no combination, update the block's position
      setBlocks(blocks.map(b => 
        b.id === draggedBlock.id 
          ? { ...b, x: releaseX, y: releaseY }
          : b
      ));
    }
    
    setDraggedBlock(null);
  };

  const addBlockAtRandomPosition = (label) => {
    const { width, height } = calculateBlockSize(label.text);
    let x, y;

    for (let i = 0; i < 100; i++) {
      x = Math.random() * (containerRef.current.offsetWidth - width) + width / 2;
      y = Math.random() * (containerRef.current.offsetHeight - height) + height / 2;

      if (!isOverlapping(x, y, width, height)) {
        setBlocks([...blocks, { x, y, id: Date.now(), label, width, height }]);
        return;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedBlock) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - left, newY = e.clientY - top;
    if (isWithinBounds(newX, newY, draggedBlock.width, draggedBlock.height)) {
      setBlocks(blocks.map(b => (b.id === draggedBlock.id ? { ...b, x: newX, y: newY } : b)));
    }
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
            onClick={() => addBlockAtRandomPosition(label)}
            style={{
              padding: '0 8px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center',
              backgroundColor: label.color, 
              cursor: 'pointer',
              border: '1px solid #ccc', 
              marginRight: '5px', 
              color: 'black'
            }}
          >
            {label.text}
          </div>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{
          position: 'relative', 
          width: '100%', 
          height: '400px', 
          border: '2px solid #ccc',
          cursor: draggedBlock ? 'grabbing' : 'crosshair',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {blocks.map(block => (
          <div
            key={block.id}
            style={{
              position: 'absolute',
              width: block.width,
              height: block.height,
              backgroundColor: block.label.color,
              left: block.x - block.width / 2,
              top: block.y - block.height / 2,
              border: '1px solid black',
              cursor: 'grab',
              userSelect: 'none',
              color: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap'
            }}
            onMouseDown={(e) => { 
              e.stopPropagation(); 
              setDraggedBlock(block); 
            }}
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
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={handleSubmitScore}
      >
        SUBMIT SCORE
      </button>
    </div>
  );
};

export default BlockPlacer;