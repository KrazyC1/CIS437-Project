import React, { useState } from 'react';

const BlockPlacer = () => {
  const [blocks, setBlocks] = useState([]);

  const blockSize = 32;
  const blockOffset = blockSize / 2;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        border: '2px solid #ccc',
        cursor: 'crosshair',
      }}
      onClick={handleClick}
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
            transition: 'all 0.2s ease',
            border: '1px solid black', // Optional, to visualize the white block
          }}
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
  );
};

export default BlockPlacer;
