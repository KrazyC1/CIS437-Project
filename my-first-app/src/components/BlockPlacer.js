import React, { useState, useRef, useEffect } from 'react';

const BlockPlacer = () => {
  const [blocks, setBlocks] = useState([]);
  const [toolbarElements, setToolbarElements] = useState([]);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const containerRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    contextRef.current = document.createElement("canvas").getContext("2d");
    contextRef.current.font = "16px Arial";

    // Initialize toolbar with base elements
    const labels = [
      { text: "Water💧", color: "#0077ff" },
      { text: "Fire🔥", color: "#ff4d4d" },
      { text: "Wind💨", color: "#66cc66" },
      { text: "Earth🌍", color: "#8b5e3c" }
    ];
    setToolbarElements(labels);
  }, []);

  const hexToRgb = (hex) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });

  const rgbToHex = (r, g, b) =>
    `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

  const averageColors = (color1, color2) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    return rgbToHex(
      Math.round((rgb1.r + rgb2.r) / 2),
      Math.round((rgb1.g + rgb2.g) / 2),
      Math.round((rgb1.b + rgb2.b) / 2)
    );
  };

  const calculateBlockSize = (text) => ({
    width: contextRef.current.measureText(text).width + 36,
    height: 40,
  });

  const findOverlappingBlock = (x, y, id) =>
    blocks.find(b => b.id !== id && Math.abs(b.x - x) < 40 && Math.abs(b.y - y) < 40);

  const combineBlocks = async (x, y, targetBlock) => {
    const { text: element1, color: color1 } = draggedBlock.label;
    const { text: element2, color: color2 } = targetBlock.label;

    try {
      const response = await fetch(
        //`http://localhost:5000/get_combination?element1=${element1}&element2=${element2}`
        `https://homework4-440015.uk.r.appspot.com/get_combination?element1=${element1}&element2=${element2}`
      );
      const data = await response.json();

      const newText = data.result || "⬜";
      const newColor = data.result ? averageColors(color1, color2) : "pink";
      const newBlock = {
        id: Date.now(),
        x: (x + targetBlock.x) / 2,
        y: (y + targetBlock.y) / 2,
        label: { text: newText, color: newColor },
        ...calculateBlockSize(newText)
      };

      setBlocks(blocks.filter(b => b.id !== draggedBlock.id && b.id !== targetBlock.id).concat(newBlock));
      updateToolbar(newBlock.label);
    } catch (error) {
      console.error("Error fetching combination:", error);
    }
  };

  const updateToolbar = (label) => {
    if (!toolbarElements.some(e => e.text === label.text)) {
      setToolbarElements([...toolbarElements, label]);
    }
  };

  const clampPosition = (value, min, max) => Math.max(min, Math.min(value, max));

  const handleDragEnd = (e) => {
    if (!draggedBlock) return;
    const { left, top, width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    let x = e.clientX - left, y = e.clientY - top;
    const { width, height } = draggedBlock;

    x = clampPosition(x, width / 2, cw - width / 2);
    y = clampPosition(y, height / 2, ch - height / 2);

    const overlappingBlock = findOverlappingBlock(x, y, draggedBlock.id);
    overlappingBlock
      ? combineBlocks(x, y, overlappingBlock)
      : setBlocks(blocks.map(b => (b.id === draggedBlock.id ? { ...b, x, y } : b)));
    setDraggedBlock(null);
  };

  const addBlockAtRandomPosition = (label) => {
    const { width, height } = calculateBlockSize(label.text);
    const { offsetWidth: cw, offsetHeight: ch } = containerRef.current;
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * (cw - width) + width / 2;
      const y = Math.random() * (ch - height) + height / 2;
      if (!blocks.some(b => Math.abs(b.x - x) < (b.width + width) / 2 && Math.abs(b.y - y) < (b.height + height) / 2)) {
        const newBlock = { x, y, id: Date.now(), label, width, height };
        setBlocks([...blocks, newBlock]);
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedBlock) return;
    const { left, top, width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    let x = e.clientX - left, y = e.clientY - top;
    const { width, height } = draggedBlock;

    x = clampPosition(x, width / 2, cw - width / 2);
    y = clampPosition(y, height / 2, ch - height / 2);

    setBlocks(blocks.map(b => (b.id === draggedBlock.id ? { ...b, x, y } : b)));
  };

  const clearBlocks = () => {
    setBlocks([]);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', background: '#f5f5f5', padding: '20px', userSelect: 'none' }}>
      <div
        style={{
          display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px',
          marginBottom: '15px', backgroundColor: '#ddd', borderRadius: '8px', gap: '10px'
        }}
      >
        {toolbarElements.map(element => (
          <div
            key={element.text}
            onClick={() => addBlockAtRandomPosition(element)}
            style={{
              flex: '0 0 100px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px', backgroundColor: element.color, color: 'white',
              fontWeight: 'bold', textAlign: 'center', cursor: 'pointer',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            {element.text}
          </div>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{
          position: 'relative', width: '100%', height: '20vw', borderRadius: '10px', border: '2px solid #ddd',
          backgroundColor: '#ffffff', overflow: 'hidden', boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
          cursor: draggedBlock ? 'grabbing' : 'crosshair', userSelect: 'none'
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
              cursor: 'grab', userSelect: 'none', transition: 'transform 0.2s'
            }}
            onMouseDown={(e) => { e.stopPropagation(); setDraggedBlock(block); }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            {block.label.text}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#ff4d4d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold'
          }}
          onClick={clearBlocks}
        >
          🗑️
        </div>
      </div>
    </div>
  );
};

export default BlockPlacer;
