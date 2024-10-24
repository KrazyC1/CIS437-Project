import React, { useState } from 'react';

const BlockPlacer = () => {
  const [blocks, setBlocks] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setBlocks([...blocks, { x, y, id: Date.now() }]);
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        border: '2px solid #ccc',
        cursor: 'crosshair'
      }}
      onClick={handleClick}
    >
      {blocks.map(block => (
        <div
          key={block.id}
          style={{
            position: 'absolute',
            width: '32px',
            height: '32px',
            backgroundColor: 'red',
            left: `${block.x - 16}px`,
            top: `${block.y - 16}px`,
            transition: 'all 0.2s ease'
          }}
        />
      ))}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        color: '#666'
      }}>
        Blocks placed: {blocks.length}
      </div>
    </div>
  );
};

export default BlockPlacer;