import React, { useState, useRef } from 'react';

const BlockPlacer = () => {
  const [blocks, setBlocks] = useState([]);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const containerRef = useRef(null);
  
  const blockSize = 32;
  const blockOffset = blockSize / 2;

  const handleClick = (e) => {
    // Only place blocks if we're not dragging
    if (!draggedBlock) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if the new block would be within bounds
      if (!isWithinBounds(x, y)) return;

      // Check if the new block overlaps with any existing blocks
      const blockExists = blocks.some(block => {
        const distanceX = Math.abs(block.x - x);
        const distanceY = Math.abs(block.y - y);
        return distanceX < blockSize && distanceY < blockSize;
      });

      // If no block exists at the position, add a new one
      if (!blockExists) {
        setBlocks([...blocks, { x, y, id: Date.now() }]);
      }
    }
  };

  const handleMouseDown = (e, block) => {
    e.stopPropagation(); // Prevent click event from firing
    setDraggedBlock(block);
  };

  const handleMouseMove = (e) => {
    if (draggedBlock) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      // Check if the new position would be within bounds
      if (!isWithinBounds(newX, newY)) return;

      // Check if the new position would overlap with other blocks
      const wouldOverlap = blocks.some(block => {
        if (block.id === draggedBlock.id) return false;
        const distanceX = Math.abs(block.x - newX);
        const distanceY = Math.abs(block.y - newY);
        return distanceX < blockSize && distanceY < blockSize;
      });

      if (!wouldOverlap) {
        setBlocks(blocks.map(block =>
          block.id === draggedBlock.id
            ? { ...block, x: newX, y: newY }
            : block
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedBlock(null);
  };

  const isWithinBounds = (x, y) => {
    const rect = containerRef.current.getBoundingClientRect();
    return (
      x >= blockOffset &&
      x <= rect.width - blockOffset &&
      y >= blockOffset &&
      y <= rect.height - blockOffset
    );
  };

  const handleSubmitScore = () => {
    const score = blocks.length;
    fetch('https://cis437hw5.uk.r.appspot.com/submit-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score }),
    })    
      .then(response => response.json())
      .then(data => {
        console.log('Score submitted successfully:', data);
      })
      .catch(error => {
        console.error('Error submitting score:', error);
      });
  };

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '400px',
          border: '2px solid #ccc',
          cursor: draggedBlock ? 'grabbing' : 'crosshair',
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {blocks.map((block) => (
          <div
            key={block.id}
            style={{
              position: 'absolute',
              width: `${blockSize}px`,
              height: `${blockSize}px`,
              backgroundColor: 'white',
              left: `${block.x - blockOffset}px`,
              top: `${block.y - blockOffset}px`,
              transition: draggedBlock?.id === block.id ? 'none' : 'all 0.2s ease',
              border: '1px solid black',
              cursor: 'grab',
              userSelect: 'none',
            }}
            onMouseDown={(e) => handleMouseDown(e, block)}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            color: '#666',
          }}
        >
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