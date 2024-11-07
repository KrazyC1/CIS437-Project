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
    { text: "Water💧", color: "#0077ff" },
    { text: "Fire🔥", color: "#ff4d4d" },
    { text: "Wind💨", color: "#66cc66" },
    { text: "Earth🌍", color: "#8b5e3c" }
  ];

  const hexToRgb = (hex) => {
    let bigint = parseInt(hex.slice(1), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };

  const rgbToHex = (rgb) => {
    return (
      "#" +
      ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)
    );
  };

  const averageColors = (color1, color2) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const avgRgb = {
      r: Math.round((rgb1.r + rgb2.r) / 2),
      g: Math.round((rgb1.g + rgb2.g) / 2),
      b: Math.round((rgb1.b + rgb2.b) / 2),
    };
    return rgbToHex(avgRgb);
  };

  const findOverlappingBlock = (x, y, id) => blocks.find(b => 
    b.id !== id && Math.abs(b.x - x) < 40 && Math.abs(b.y - y) < 40
  );

  const combineBlocks = async (x, y, targetBlock) => {
    const element1 = draggedBlock.label.text;
    const element2 = targetBlock.label.text;

    try {
      const response = await fetch(`http://localhost:5000/get_combination?element1=${element1}&element2=${element2}`);
      const data = await response.json();

      const newText = data.result ? data.result : "⬜";
      const newColor = data.result
        ? averageColors(draggedBlock.label.color, targetBlock.label.color)
        : "gray";

      const newBlock = {
        id: Date.now(),
        x: (x + targetBlock.x) / 2,
        y: (y + targetBlock.y) / 2,
        label: { text: newText, color: newColor },
        ...calculateBlockSize(newText)
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
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ display: 'flex', marginBottom: '15px', gap: '10px' }}>
        {labels.map(label => (
          <div
            key={label.text}
            onClick={() => addBlockAtRandomPosition(label)}
            style={{
              padding: '10px 15px', borderRadius: '20px', display: 'flex', alignItems: 'center',
              backgroundColor: label.color, cursor: 'pointer', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              color: 'white', fontWeight: 'bold', transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            {label.text}
          </div>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{
          position: 'relative', width: '100%', height: '400px', borderRadius: '10px', border: '2px solid #ddd',
          backgroundColor: '#ffffff', overflow: 'hidden', boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
          cursor: draggedBlock ? 'grabbing' : 'crosshair', transition: 'background-color 0.3s ease-in-out'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {blocks.map(block => (
          <div
            key={block.id}
            style={{
              position: 'absolute', width: block.width, height: block.height, borderRadius: '8px',
              backgroundColor: block.label.color, left: block.x - block.width / 2,
              top: block.y - block.height / 2, color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 'bold', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'grab'
            }}
            onMouseDown={(e) => { e.stopPropagation(); setDraggedBlock(block); }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            {block.label.text}
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', color: '#666' }}>
          Blocks placed: {blocks.length}
        </div>
      </div>
      <button
        style={{
          marginTop: '20px', padding: '12px 25px', fontSize: '16px', borderRadius: '8px',
          backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', transition: 'background-color 0.3s ease-in-out'
        }}
        onClick={handleSubmitScore}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
      >
        SUBMIT SCORE
      </button>
    </div>
  );
};

export default BlockPlacer;
